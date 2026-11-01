const RESEND_API_KEY = process.env.RESEND_API_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { message: 'Method Not Allowed' } });
  }

  try {
    const { fullName, email, phone, subject, message } = req.body || {};

    if (!fullName || !email) {
      return res.status(400).json({ success: false, error: { message: 'Full name and email are required.' } });
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">New Customer Inquiry - MAXLINE LOGISTICS</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
        <div style="background-color: #f8fafc; padding: 12px; border-radius: 8px; margin-top: 12px;">
          <strong>Message:</strong><br/>
          <p style="white-space: pre-wrap; color: #334155;">${message || 'No additional message provided.'}</p>
        </div>
        <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">Sent via maxlinelogistics.com contact form at ${new Date().toISOString()}</p>
      </div>
    `;

    if (RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'MAXLINE LOGISTICS <support@maxlinelogistics.com>',
          to: ['support@maxlinelogistics.com', 'maxlinelogistic@gmail.com'],
          subject: `[MAXLINE Contact] ${subject || 'New Inquiry'} from ${fullName}`,
          html: emailHtml,
          reply_to: email,
        }),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Inquiry received successfully. Our team will contact you shortly.',
    });
  } catch (err) {
    console.error('[Contact Serverless Exception]:', err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || 'Failed to submit inquiry.' },
    });
  }
};
