/**
 * MAXLINE LOGISTICS - Delhivery B2C Pincode Serviceability API
 * Queries Delhivery Production network for pincode delivery, COD, and routing details.
 */

const DELHIVERY_API_TOKEN = process.env.DELHIVERY_API_TOKEN;
const DELHIVERY_HOST = process.env.DELHIVERY_HOST || 'track.delhivery.com';

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

  if (!DELHIVERY_API_TOKEN) {
    return res.status(500).json({
      success: false,
      message: 'DELHIVERY_API_TOKEN is not configured in server environment.',
    });
  }

  const pincode = req.query.pincode || (req.body && req.body.pincode);
  if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
    return res.status(400).json({
      success: false,
      message: 'A valid 6-digit destination pincode is required.',
    });
  }

  try {
    const cleanPin = String(pincode).trim();
    const url = `https://${DELHIVERY_HOST}/c/api/pin-codes/json/?filter_codes=${cleanPin}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${DELHIVERY_API_TOKEN}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: `Delhivery API returned HTTP status ${response.status}`,
      });
    }

    const data = await response.json();
    const deliveryCodes = data.delivery_codes || [];

    if (deliveryCodes.length === 0) {
      return res.status(200).json({
        success: true,
        pincode: cleanPin,
        serviceable: false,
        message: 'Destination pincode is out of coverage for Delhivery.',
      });
    }

    const info = deliveryCodes[0].postal_code || {};
    const isServiceable = info.pre_paid === 'Y' || info.cod === 'Y';

    return res.status(200).json({
      success: true,
      pincode: cleanPin,
      serviceable: isServiceable,
      codAvailable: info.cod === 'Y',
      prepaidAvailable: info.pre_paid === 'Y',
      pickupAvailable: info.pickup === 'Y',
      isODA: info.is_oda === 'Y',
      district: info.district || '',
      state: info.state_code || '',
      country: info.country_code || 'IN',
      sortCode: info.sort_code || '',
      remarks: info.remarks || '',
    });
  } catch (error) {
    console.error('[Delhivery Serviceability Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to query Delhivery serviceability service.',
      error: error.message,
    });
  }
};
