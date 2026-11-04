/**
 * MAXLINE LOGISTICS - Delhivery First Mile (FM) Pickup Request API
 * Schedules official courier vehicle/rider dispatch for warehouse collections.
 */

const DELHIVERY_API_TOKEN = process.env.DELHIVERY_API_TOKEN || '745fcc8cddf49e2c15e9e018a20d78b7ede7656e';
const DELHIVERY_HOST = 'track.delhivery.com';

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
    const {
      pickup_time = '14:00:00',
      pickup_date,
      pickup_location = 'MAXLINE_PRIMARY',
      expected_package_count = 1,
    } = req.body || {};

    // Standardize date to YYYY-MM-DD
    let targetDate = pickup_date;
    if (!targetDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDate = tomorrow.toISOString().split('T')[0];
    } else {
      // If date is like '2026-08-22' or similar string
      targetDate = String(targetDate).trim().slice(0, 10);
    }

    // Standardize time format HH:MM:SS
    let targetTime = '14:00:00';
    if (pickup_time) {
      const timeStr = String(pickup_time).toUpperCase();
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        // e.g. "10:00 AM - 01:00 PM" -> use start or standard slot
        if (timeStr.includes('AM')) targetTime = '11:00:00';
        else targetTime = '15:00:00';
      } else if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
        targetTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
      }
    }

    const cleanLocation = String(pickup_location || 'MAXLINE_PRIMARY')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toUpperCase();

    const payload = {
      pickup_time: targetTime,
      pickup_date: targetDate,
      pickup_location: cleanLocation,
      expected_package_count: Math.max(1, parseInt(String(expected_package_count), 10) || 1),
    };

    const response = await fetch(`https://${DELHIVERY_HOST}/fm/request/new/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DELHIVERY_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok || data.pickup_id || data.pr_exist) {
      const pickupId = data.pickup_id || data.pr_id || `PKP-${Date.now()}`;
      return res.status(200).json({
        success: true,
        pickupId: String(pickupId),
        clientName: data.client_name || 'MAXLINE LOGISTICS',
        pickupLocation: data.pickup_location_name || cleanLocation,
        incomingCenter: data.incoming_center_name || 'Central Dispatch Hub',
        pickupDate: data.pickup_date || targetDate,
        pickupTime: data.pickup_time || targetTime,
        expectedPackages: data.expected_package_count || payload.expected_package_count,
        message: data.pr_exist
          ? `Active Delhivery pickup request already scheduled (ID: ${pickupId}).`
          : `Delhivery pickup scheduled successfully! Pickup ID: ${pickupId}`,
        raw: data,
      });
    }

    return res.status(response.status || 400).json({
      success: false,
      message: data.error || data.message || 'Failed to schedule pickup request with Delhivery.',
      raw: data,
    });
  } catch (error) {
    console.error('[Delhivery Pickup Request Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error scheduling pickup with Delhivery.',
      error: error.message,
    });
  }
};
