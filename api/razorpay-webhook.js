const crypto = require('crypto');
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '5hDdnq0PT1gV64UYEV7vk3TE';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_KEY_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lbldljgyusyqqcbyvmem.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxibGRsamd5dXN5cXFjYnl2bWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5Mzg2NDcsImV4cCI6MjEwODUxNDY0N30.WsFo9NV3CI_fw5jOe3d-XNuGZ-HElpogkyq0UAINN8U';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { message: 'Method Not Allowed' } });
  }

  try {
    const signature = req.headers['x-razorpay-signature'];
    const payload = req.body;

    if (!payload) {
      return res.status(400).json({ success: false, error: { message: 'Empty webhook payload' } });
    }

    // 1. Signature Verification if signature header is provided
    if (signature) {
      const bodyString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(bodyString)
        .digest('hex');

      const isSignatureValid =
        expectedSignature.length === signature.length &&
        crypto.timingSafeEqual(Buffer.from(expectedSignature, 'utf-8'), Buffer.from(signature, 'utf-8'));

      if (!isSignatureValid) {
        return res.status(400).json({ success: false, error: { message: 'Invalid webhook signature' } });
      }
    }

    // 2. Parse Event & Entity
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity || payload.payment || {};
    const paymentId = paymentEntity.id;
    const paymentStatus = paymentEntity.status;
    const amountMinor = paymentEntity.amount;
    const merchantId = paymentEntity.notes?.merchantId || paymentEntity.notes?.tenantId;

    // We only process successful payment captures
    if (event === 'payment.captured' || paymentStatus === 'captured') {
      if (!paymentId || !amountMinor || !merchantId) {
        return res.status(200).json({ received: true, ignored: true, reason: 'Missing required entity fields' });
      }

      const idempotencyKey = `rzp_${paymentId}`;
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      };

      const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/credit_wallet_rpc`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          p_merchant_id: merchantId,
          p_amount_minor: Number(amountMinor),
          p_reference_type: 'RAZORPAY',
          p_reference_id: paymentId,
          p_idempotency_key: idempotencyKey,
          p_description: `Wallet Balance Added via Razorpay Webhook (${paymentId})`,
        }),
      });

      if (rpcRes.ok) {
        const rpcData = await rpcRes.json();
        return res.status(200).json({
          received: true,
          credited: true,
          isDuplicate: !!rpcData.is_duplicate,
          balance_after_minor: rpcData.balance_after_minor,
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Razorpay Webhook Error]:', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
};
