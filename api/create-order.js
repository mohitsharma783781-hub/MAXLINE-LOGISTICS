const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_Tu1LtziG5Lhqvx';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '5hDdnq0PT1gV64UYEV7vk3TE';

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
    const { amount, currency = 'INR', receipt, notes } = req.body || {};
    const parsedAmount = Number(amount);

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount < 100) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid amount. Minimum amount is 100 paise (₹1.00).' },
      });
    }

    const orderReceipt = receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(parsedAmount),
        currency: (currency || 'INR').toUpperCase(),
        receipt: String(orderReceipt).slice(0, 40),
        notes: notes || {},
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Razorpay Order Error]:', data);
      return res.status(response.status).json({
        success: false,
        error: { message: data?.error?.description || 'Failed to create order on Razorpay' },
      });
    }

    return res.status(200).json({
      success: true,
      order_id: data.id,
      amount: data.amount,
      currency: data.currency,
      key_id: RAZORPAY_KEY_ID,
      receipt: data.receipt,
    });
  } catch (err) {
    console.error('[Create Order Serverless Exception]:', err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || 'Internal server error creating Razorpay order' },
    });
  }
};
