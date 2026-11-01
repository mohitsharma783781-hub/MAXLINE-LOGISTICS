const crypto = require('crypto');
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '5hDdnq0PT1gV64UYEV7vk3TE';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lbldljgyusyqqcbyvmem.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxibGRsamd5dXN5cXFjYnl2bWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5Mzg2NDcsImV4cCI6MjEwODUxNDY0N30.WsFo9NV3CI_fw5jOe3d-XNuGZ-HElpogkyq0UAINN8U';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { message: 'Method Not Allowed' } });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, merchantId, amountINR } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing razorpay_order_id, razorpay_payment_id, or razorpay_signature.' },
      });
    }

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    const isValid =
      generatedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(generatedSignature, 'utf-8'),
        Buffer.from(razorpay_signature, 'utf-8')
      );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: { message: 'Payment verification failed: Signature mismatch.' },
      });
    }

    let credited = false;
    let newBalanceINR = null;

    // Asynchronously synchronize verified payment credit into Supabase Cloud DB
    if (merchantId && amountINR && Number(amountINR) > 0) {
      const amountMinor = Math.round(Number(amountINR) * 100);
      try {
        const headers = {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        };

        // 1. Fetch current wallet
        const walletRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?merchant_id=eq.${encodeURIComponent(merchantId)}&select=*`, {
          method: 'GET',
          headers,
        });

        if (walletRes.ok) {
          const wallets = await walletRes.json();
          if (Array.isArray(wallets) && wallets.length > 0) {
            const currentWallet = wallets[0];
            const currentMinor = Number(currentWallet.available_balance_minor || 0);
            const updatedMinor = currentMinor + amountMinor;
            const updatedRechargedMinor = Number(currentWallet.total_recharged_minor || 0) + amountMinor;

            // 2. Update wallet balance
            const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${encodeURIComponent(currentWallet.id)}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                available_balance_minor: updatedMinor,
                total_recharged_minor: updatedRechargedMinor,
                updated_at: new Date().toISOString(),
              }),
            });

            if (updateRes.ok) {
              credited = true;
              newBalanceINR = updatedMinor / 100;

              // 3. Insert immutable ledger audit transaction
              await fetch(`${SUPABASE_URL}/rest/v1/wallet_transactions`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  merchant_id: merchantId,
                  wallet_id: currentWallet.id,
                  type: 'RECHARGE',
                  direction: 'CREDIT',
                  amount_minor: amountMinor,
                  currency: 'INR',
                  description: `Wallet Balance Added via Razorpay (${razorpay_payment_id})`,
                  reference_type: 'RECHARGE',
                  reference_id: razorpay_payment_id,
                }),
              });
            }
          }
        }
      } catch (dbErr) {
        console.warn('[Verify Payment Supabase Sync Warning]:', dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment signature verified successfully.',
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      credited,
      newBalanceINR,
      verified_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Verify Payment Serverless Exception]:', err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || 'Internal server error verifying signature' },
    });
  }
};
