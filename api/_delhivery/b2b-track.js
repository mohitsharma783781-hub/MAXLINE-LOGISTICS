/**
 * MAXLINE LOGISTICS - Delhivery B2B Tracking Service
 * Tracks B2B LR numbers against Delhivery Freight gateway (/v2/track/{lrnum}).
 */

const B2B_STAGING_BASE = 'https://btob-api-dev.delhivery.com';
const B2B_PROD_BASE = 'https://btob.api.delhivery.com';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const isProd = process.env.DELHIVERY_B2B_ENV === 'production';
    const baseUrl = isProd && process.env.DELHIVERY_B2B_ALLOW_LIVE === 'true' ? B2B_PROD_BASE : B2B_STAGING_BASE;

    const lrNumber = req.query?.lrNumber || req.query?.waybill || req.query?.lrnum;
    let token = req.query?.token || req.headers?.authorization?.replace('Bearer ', '');

    if (!lrNumber) {
      return res.status(400).json({
        success: false,
        message: 'LR Number (lrnum) is required to track B2B shipments.',
      });
    }

    if (!token) {
      const b2bUser = process.env.DELHIVERY_B2B_USERNAME;
      const b2bPass = process.env.DELHIVERY_B2B_PASSWORD;

      if (!b2bUser || !b2bPass) {
        return res.status(500).json({
          success: false,
          message: 'Delhivery B2B credentials are not configured in server environment.',
        });
      }

      try {
        const loginRes = await fetch(`${baseUrl}/ums/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: b2bUser.trim(),
            password: b2bPass.trim(),
          }),
        });
        if (loginRes.ok) {
          const lData = await loginRes.json();
          token = lData.jwt || lData.token;
        }
      } catch (loginErr) {
        console.warn('[Delhivery B2B Auto-Login Fallback]:', loginErr);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unable to authenticate with Delhivery B2B gateway.',
      });
    }

    const trackRes = await fetch(`${baseUrl}/v2/track/${encodeURIComponent(lrNumber)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token.trim()}`,
      },
    });

    const data = await trackRes.json().catch(() => ({}));

    return res.status(trackRes.status).json({
      success: trackRes.ok,
      lrNumber,
      trackingData: data,
    });
  } catch (err) {
    console.error('[Delhivery B2B Track Error]:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error while tracking Delhivery B2B consignment.',
    });
  }
};
