/**
 * MAXLINE LOGISTICS - Delhivery Unified Pincode Serviceability Service
 * 
 * Supports both:
 * 1. B2C Express Parcel Serviceability (Default):
 *    GET https://track.delhivery.com/c/api/pin-codes/json/?filter_codes={pincode}
 * 
 * 2. B2B LTL Serviceability (When service_type=b2b):
 *    GET https://ltl-clients-api-dev.delhivery.com/pincode-service/{pincode}?weight={weight}
 *    Header: Authorization: Bearer <JWT>
 */

const DELHIVERY_API_TOKEN = process.env.DELHIVERY_API_TOKEN;
const DELHIVERY_HOST = process.env.DELHIVERY_HOST || 'track.delhivery.com';

const LTL_STAGING_BASE = 'https://ltl-clients-api-dev.delhivery.com';
const LTL_PROD_BASE = 'https://ltl-clients-api.delhivery.com';

async function getB2bAuthToken(baseUrl) {
  const b2bUser = process.env.DELHIVERY_B2B_USERNAME;
  const b2bPass = process.env.DELHIVERY_B2B_PASSWORD;
  if (!b2bUser || !b2bPass) return null;

  try {
    const res = await fetch(`${baseUrl}/ums/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username: b2bUser.trim(), password: b2bPass.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    return data?.data?.jwt || data?.jwt || data?.token || data?.data?.token || null;
  } catch (err) {
    console.error('[Delhivery B2B Serviceability Auth Error]:', err.message);
    return null;
  }
}

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

  const rawPincode = req.query?.pincode || req.body?.pincode;
  const cleanPin = String(rawPincode || '').trim().replace(/\D/g, '');

  if (!cleanPin || cleanPin.length !== 6) {
    return res.status(400).json({
      success: false,
      message: 'A valid 6-digit destination pincode is required.',
    });
  }

  const serviceType = String(req.query?.service_type || req.query?.type || req.body?.service_type || 'b2c').toLowerCase();

  // ==========================================
  // BRANCH 1: OFFICIAL B2B LTL SERVICEABILITY
  // ==========================================
  if (serviceType === 'b2b') {
    try {
      const isProd = process.env.DELHIVERY_B2B_ENV === 'production';
      const baseUrl = isProd && process.env.DELHIVERY_B2B_ALLOW_LIVE === 'true' ? LTL_PROD_BASE : LTL_STAGING_BASE;

      let authToken = req.query?.token || req.headers?.authorization?.replace(/^Bearer\s+/i, '');
      if (!authToken) {
        authToken = await getB2bAuthToken(baseUrl);
      }

      if (!authToken) {
        return res.status(401).json({
          success: false,
          service_type: 'b2b',
          message: 'Unable to authenticate with Delhivery B2B gateway for serviceability query.',
        });
      }

      // Expected weight in grams (default: 20000 gm = 20 kg minimum slab)
      const weightGrams = Math.round(Number(req.query?.weight || req.body?.weight || 20000));
      const b2bUrl = `${baseUrl}/pincode-service/${cleanPin}?weight=${weightGrams}`;

      const b2bRes = await fetch(b2bUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken.trim()}`,
          Accept: 'application/json',
        },
      });

      const b2bData = await b2bRes.json().catch(() => ({}));

      if (!b2bRes.ok) {
        return res.status(b2bRes.status).json({
          success: false,
          service_type: 'b2b',
          pincode: cleanPin,
          message: b2bData?.error?.message || b2bData?.message || `Delhivery B2B serviceability returned HTTP ${b2bRes.status}`,
          details: b2bData,
        });
      }

      const servData = b2bData?.data?.pincode_serviceability_data || [];
      const failPins = b2bData?.data?.b2b_fail_on_demand_pincodes || [];
      const isFailedOnDemand = failPins.includes(cleanPin) || failPins.includes(Number(cleanPin));

      const isServiceable = servData.length > 0 && !isFailedOnDemand;
      const pinDetails = servData[0] || {};
      const paymentTypes = pinDetails.payment_types || [];

      return res.status(200).json({
        success: true,
        service_type: 'b2b',
        pincode: cleanPin,
        serviceable: isServiceable,
        codAvailable: paymentTypes.includes('COD'),
        prepaidAvailable: paymentTypes.includes('Pre-paid') || paymentTypes.includes('Prepaid'),
        pickupAvailable: Boolean(pinDetails.pickup_available ?? true),
        state: pinDetails.state || '',
        city: pinDetails.city || '',
        remarks: isFailedOnDemand ? 'Pincode marked in B2B fail-on-demand list' : 'Serviceable for B2B LTL cargo',
        data: b2bData,
      });
    } catch (err) {
      console.error('[Delhivery B2B Serviceability Error]:', err);
      return res.status(500).json({
        success: false,
        service_type: 'b2b',
        message: 'Failed to query Delhivery B2B serviceability service.',
        error: err.message,
      });
    }
  }

  // ==========================================
  // BRANCH 2: B2C EXPRESS PARCEL SERVICEABILITY (PRESERVED 100%)
  // ==========================================
  if (!DELHIVERY_API_TOKEN) {
    return res.status(500).json({
      success: false,
      message: 'DELHIVERY_API_TOKEN is not configured in server environment.',
    });
  }

  try {
    const url = `https://${DELHIVERY_HOST}/c/api/pin-codes/json/?filter_codes=${cleanPin}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Token ${DELHIVERY_API_TOKEN}`,
        Accept: 'application/json',
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
      service_type: 'b2c',
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
      service_type: 'b2c',
      message: 'Failed to query Delhivery serviceability service.',
      error: error.message,
    });
  }
};
