/**
 * MAXLINE LOGISTICS - Delhivery B2B Commercial Freight Pickup Request API
 * Schedules commercial vehicle collection for B2B cargo / LTL consignments.
 */

const B2B_STAGING_BASE = 'https://btob-api-dev.delhivery.com';
const B2B_PROD_BASE = 'https://btob.api.delhivery.com';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
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
    const baseUrl = isProd && process.env.DELHIVERY_B2B_ALLOW_LIVE === 'true' ? B2B_PROD_BASE : B2B_STAGING_BASE;

    const {
      token,
      pickupWarehouse,
      pickupDate,
      pickupTime = '14:00:00',
      expectedPackageCount = 1,
      totalWeightKg = 20,
      consignments = [], // Array of LRN numbers e.g. ['LRN-DEL-69885169']
      contactPerson = 'Mohit',
      contactPhone = '7009311318',
      vehicleType = 'Tata Ace / Commercial Cargo Van',
      specialInstructions = 'Pickup from loading dock',
    } = req.body || {};

    // Standardize date YYYY-MM-DD
    let targetDate = pickupDate;
    if (!targetDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDate = tomorrow.toISOString().split('T')[0];
    } else {
      targetDate = String(targetDate).trim().slice(0, 10);
    }

    // Standardize time HH:MM:SS
    let targetTime = '14:00:00';
    if (pickupTime) {
      const t = String(pickupTime).toUpperCase();
      if (t.includes('AM')) targetTime = '11:00:00';
      else if (t.includes('PM')) targetTime = '15:00:00';
      else if (/^\d{2}:\d{2}(:\d{2})?$/.test(t)) {
        targetTime = t.length === 5 ? `${t}:00` : t;
      }
    }

    const clientName = process.env.DELHIVERY_B2B_CLIENT_NAME || process.env.DELHIVERY_B2B_USERNAME;
    if (!clientName) {
      return res.status(500).json({
        success: false,
        message: 'DELHIVERY_B2B_CLIENT_NAME or DELHIVERY_B2B_USERNAME is not configured in server environment.',
      });
    }
    const warehouseLocation = pickupWarehouse || process.env.DELHIVERY_B2B_DEFAULT_WAREHOUSE || 'MAXLINE LOGI - 156';

    const payload = {
      client_name: clientName,
      pickup_location: warehouseLocation,
      pickup_date: targetDate,
      pickup_time: targetTime,
      expected_package_count: Number(expectedPackageCount) || 1,
      total_weight_kg: Number(totalWeightKg) || 20,
      consignments: Array.isArray(consignments) ? consignments : [consignments].filter(Boolean),
      vehicle_type: vehicleType,
      contact_person: contactPerson,
      contact_phone: contactPhone,
      special_instructions: specialInstructions,
    };

    // Auto-acquire auth token if not provided
    let authToken = token;
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
          authToken = lData.jwt || lData.token;
        } else {
          return res.status(401).json({
            success: false,
            message: 'Failed to authenticate with Delhivery B2B UMS gateway.',
          });
        }
      } catch (loginErr) {
        return res.status(502).json({
          success: false,
          message: `Network error connecting to Delhivery B2B login service: ${loginErr.message}`,
        });
      }
    }

    if (!authToken) {
      return res.status(401).json({
        success: false,
        message: 'No valid authentication token available for B2B pickup request.',
      });
    }

    // Attempt live carrier dispatch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const pickupRes = await fetch(`${baseUrl}/fm/request/pickup/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken.trim()}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const pData = await pickupRes.json().catch(() => null);

    if (pickupRes.ok && pData) {
      const prqId = pData.pickup_id || pData.prq_id || pData.id || pData.reference_id;
      if (prqId) {
        return res.status(200).json({
          success: true,
          pickupId: String(prqId),
          pickupDate: targetDate,
          pickupTime: targetTime,
          status: 'SCHEDULED',
          message: `Delhivery B2B Cargo Pickup scheduled successfully. PRQ: ${prqId}`,
          carrierResponse: pData,
        });
      }
    }

    return res.status(pickupRes.status || 502).json({
      success: false,
      message: pData?.message || pData?.error || 'Delhivery B2B pickup request was rejected by carrier gateway.',
      details: pData,
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        message: 'Delhivery B2B pickup request timed out (8000ms). Pickup status is UNKNOWN.',
      });
    }
    console.error('[Delhivery B2B Pickup Error]:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error while scheduling Delhivery B2B pickup.',
    });
  }
};
