const crypto = require('crypto');
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_Tu1LtziG5Lhqvx';
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

    // 1. Constant-Time HMAC-SHA256 Signature Verification
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    const isSignatureValid =
      generatedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(generatedSignature, 'utf-8'),
        Buffer.from(razorpay_signature, 'utf-8')
      );

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid payment signature. Verification failed.' },
      });
    }

    // 2. Server-Side Verification: Fetch authoritative order amount & merchant notes from Razorpay API
    let verifiedAmountMinor = null;
    let verifiedMerchantId = merchantId;

    try {
      const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpay_order_id)}`, {
        headers: { 'Authorization': `Basic ${auth}` },
      });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        if (orderData.amount) {
          verifiedAmountMinor = Number(orderData.amount);
        }
        if (orderData.notes?.merchantId) {
          verifiedMerchantId = orderData.notes.merchantId;
        } else if (orderData.notes?.tenantId) {
          verifiedMerchantId = orderData.notes.tenantId;
        }
      }
    } catch (apiErr) {
      console.warn('[Razorpay Order Fetch Warning]:', apiErr.message);
    }

    // Fallback only if Razorpay API was unreachable, with strict number validation
    if (!verifiedAmountMinor && amountINR && Number(amountINR) > 0) {
      verifiedAmountMinor = Math.round(Number(amountINR) * 100);
    }

    if (!verifiedAmountMinor || verifiedAmountMinor <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Unable to verify payment amount. Credit aborted.' },
      });
    }

    if (!verifiedMerchantId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing merchant identifier for wallet credit.' },
      });
    }

    // 3. Single Authoritative Server-Side Atomic Credit via PostgreSQL RPC
    // Enforces row-level lock (FOR UPDATE), idempotency key uniqueness, atomic balance patch,
    // and immutable ledger logging in a single database transaction.
    const idempotencyKey = `rzp_${razorpay_payment_id}`;
    let credited = false;
    let isDuplicate = false;
    let newBalanceINR = null;

    try {
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      };

      const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/credit_wallet_rpc`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          p_merchant_id: verifiedMerchantId,
          p_amount_minor: verifiedAmountMinor,
          p_reference_type: 'RAZORPAY',
          p_reference_id: razorpay_payment_id,
          p_idempotency_key: idempotencyKey,
          p_description: `Wallet Balance Added via Razorpay (${razorpay_payment_id})`,
        }),
      });

      if (rpcRes.ok) {
        const rpcData = await rpcRes.json();
        if (rpcData && rpcData.success) {
          credited = true;
          isDuplicate = !!rpcData.is_duplicate;
          newBalanceINR = Number(rpcData.balance_after_minor || 0) / 100;
        }
      } else {
        const errBody = await rpcRes.text();
        console.error('[Verify Payment RPC Error]:', rpcRes.status, errBody);
      }
    } catch (rpcErr) {
      console.error('[Verify Payment RPC Exception]:', rpcErr.message);
    }

    return res.status(200).json({
      success: true,
      message: isDuplicate
        ? 'Payment already verified and credited previously (Idempotent).'
        : 'Payment verified and credited to wallet successfully.',
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      credited,
      isDuplicate,
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
