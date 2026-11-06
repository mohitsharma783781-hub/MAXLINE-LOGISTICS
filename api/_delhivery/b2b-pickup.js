/**
 * MAXLINE LOGISTICS - Delhivery B2B Commercial Freight Pickup Request API
 * 
 * Implemented strictly against official Delhivery B2B Postman Collection:
 * "B2B Postman collection New API Staging Copy 2"
 * 
 * Endpoints:
 * Create: POST https://ltl-clients-api-dev.delhivery.com/pickup_requests
 * Cancel: DELETE https://ltl-clients-api-dev.delhivery.com/pickup_requests/{pur_id}
 */

const LTL_STAGING_BASE = 'https://ltl-clients-api-dev.delhivery.com';
const LTL_PROD_BASE = 'https://ltl-clients-api.delhivery.com';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // SERVER-SIDE B2B TESTING MODE GUARD:
    // Live commercial cargo pickups are strictly blocked unless DELHIVERY_B2B_ALLOW_LIVE === 'true'
    const isProd = process.env.DELHIVERY_B2B_ENV === 'production';
    if (isProd && process.env.DELHIVERY_B2B_ALLOW_LIVE !== 'true') {
      return res.status(403).json({
        success: false,
        message: 'Delhivery B2B live commercial cargo pickups are disabled during testing phase. Set DELHIVERY_B2B_ALLOW_LIVE=true once approved.',
      });
    }
    const baseUrl = isProd && process.env.DELHIVERY_B2B_ALLOW_LIVE === 'true' ? LTL_PROD_BASE : LTL_STAGING_BASE;

    // Resolve auth token
    let authToken = req.body?.token || req.headers?.authorization?.replace(/^Bearer\s+/i, '');
    if (!authToken) {
      const b2bUser = process.env.DELHIVERY_B2B_USERNAME;
      const b2bPass = process.env.DELHIVERY_B2B_PASSWORD;

      if (!b2bUser || !b2bPass) {
        return res.status(500).json({
          success: false,
          message: 'Delhivery B2B credentials (DELHIVERY_B2B_USERNAME, DELHIVERY_B2B_PASSWORD) are not configured in server environment.',
        });
      }

      try {
        const loginRes = await fetch(`${baseUrl}/ums/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            username: b2bUser.trim(),
            password: b2bPass.trim(),
          }),
        });
        if (loginRes.ok) {
          const lData = await loginRes.json();
          authToken = lData?.data?.jwt || lData?.jwt || lData?.token || lData?.data?.token;
        }
      } catch (loginErr) {
        console.warn('[Delhivery B2B Pickup Login Error]:', loginErr.message);
      }
    }

    if (!authToken) {
      return res.status(401).json({
        success: false,
        message: 'Unable to authenticate with Delhivery B2B UMS gateway for pickup request.',
      });
    }

    // CANCEL PICKUP REQUEST (DELETE)
    if (req.method === 'DELETE' || req.query?.action === 'cancel' || req.body?.action === 'cancel') {
      const purId = req.query?.pur_id || req.body?.pur_id || req.query?.pickupId || req.body?.pickupId;
      if (!purId) {
        return res.status(400).json({ success: false, message: 'Pickup Request ID (pur_id) is required to cancel pickup.' });
      }

      const cancelRes = await fetch(`${baseUrl}/pickup_requests/${encodeURIComponent(purId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken.trim()}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const cancelData = await cancelRes.json().catch(() => ({}));
      return res.status(cancelRes.status).json({
        success: cancelRes.ok,
        purId,
        details: cancelData,
      });
    }

    // CREATE PICKUP REQUEST (POST)
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const {
      pickupWarehouse,
      pickupDate,
      pickupTime = '14:00',
      expectedPackageCount = 1,
    } = req.body || {};

    const warehouseLocation = String(
      pickupWarehouse ||
      process.env.DELHIVERY_B2B_DEFAULT_WAREHOUSE ||
      ''
    ).trim();

    if (!warehouseLocation) {
      return res.status(400).json({
        success: false,
        message: 'Registered pickup warehouse location (pickupWarehouse or DELHIVERY_B2B_DEFAULT_WAREHOUSE) is required.',
      });
    }

    // Standardize date YYYY-MM-DD
    let targetDate = pickupDate;
    if (!targetDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDate = tomorrow.toISOString().split('T')[0];
    } else {
      targetDate = String(targetDate).trim().slice(0, 10);
    }

    // Standardize time HH:MM
    let targetTime = '14:00';
    if (pickupTime) {
      const t = String(pickupTime).trim();
      const match = t.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        targetTime = `${match[1].padStart(2, '0')}:${match[2]}`;
      }
    }

    // Official Postman payload schema for POST /pickup_requests
    const officialPayload = {
      client_warehouse: warehouseLocation,
      pickup_date: targetDate,
      start_time: targetTime,
      expected_package_count: Number(expectedPackageCount) || 1,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const pickupRes = await fetch(`${baseUrl}/pickup_requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken.trim()}`,
      },
      body: JSON.stringify(officialPayload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const pData = await pickupRes.json().catch(() => null);

    if (pickupRes.ok && pData) {
      const prqId = pData.pickup_id || pData.prq_id || pData.id || pData.data?.prq_id || pData.data?.pickup_id;
      return res.status(200).json({
        success: true,
        pickupId: prqId ? String(prqId) : undefined,
        status: 'SCHEDULED',
        pickupDate: targetDate,
        pickupTime: targetTime,
        message: 'Delhivery B2B Pickup scheduled successfully.',
        carrierResponse: pData,
      });
    }

    return res.status(pickupRes.status || 502).json({
      success: false,
      message: pData?.error?.message || pData?.message || 'Delhivery B2B pickup request was rejected by carrier gateway.',
      details: pData,
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        message: 'Delhivery B2B pickup request timed out (8000ms). Status is UNKNOWN.',
      });
    }
    console.error('[Delhivery B2B Pickup Error]:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error while scheduling Delhivery B2B pickup.',
    });
  }
};
