/**
 * MAXLINE LOGISTICS - Delhivery B2B Authentication Service
 * Authenticates against Delhivery B2B UMS gateway and caches the 24h Bearer Token.
 */

const B2B_STAGING_BASE = 'https://btob-api-dev.delhivery.com';
const B2B_PROD_BASE = 'https://btob.api.delhivery.com';

// In-memory token cache for serverless instance lifetime
let cachedToken = null;
let tokenExpiresAt = 0;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
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

    const username = req.body?.username || process.env.DELHIVERY_B2B_USERNAME;
    const password = req.body?.password || process.env.DELHIVERY_B2B_PASSWORD;

    if (!username || !password) {
      return res.status(500).json({
        success: false,
        message: 'Delhivery B2B credentials (DELHIVERY_B2B_USERNAME, DELHIVERY_B2B_PASSWORD) are not configured in server environment.',
        environment: isProd ? 'production' : 'staging',
      });
    }

    // Return cached token if valid (buffer of 5 minutes before expiry)
    const now = Date.now();
    if (cachedToken && tokenExpiresAt > now + 5 * 60 * 1000 && !req.body?.forceRefresh) {
      return res.status(200).json({
        success: true,
        cached: true,
        token: cachedToken,
        expiresInSeconds: Math.floor((tokenExpiresAt - now) / 1000),
      });
    }

    const loginRes = await fetch(`${baseUrl}/ums/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        username: username.trim(),
        password: password.trim(),
      }),
    });

    const data = await loginRes.json().catch(() => ({}));

    if (!loginRes.ok || (!data.token && !data.jwt && !data.data?.token)) {
      return res.status(loginRes.status || 401).json({
        success: false,
        status: loginRes.status,
        message: data.message || data.error || 'Authentication failed with Delhivery B2B UMS gateway.',
        details: data,
      });
    }

    const token = data.token || data.jwt || data.data?.token;
    cachedToken = token;
    // Delhivery B2B tokens are valid for 24 hours (86400 seconds)
    tokenExpiresAt = now + (data.expires_in || 86400) * 1000;

    return res.status(200).json({
      success: true,
      token,
      environment: isProd ? 'production' : 'staging',
      username,
      expiresInSeconds: Math.floor((tokenExpiresAt - now) / 1000),
    });
  } catch (err) {
    console.error('[Delhivery B2B Login Error]:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error while authenticating with Delhivery B2B.',
    });
  }
};
