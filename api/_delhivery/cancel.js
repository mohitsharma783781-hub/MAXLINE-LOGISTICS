/**
 * MAXLINE LOGISTICS - Delhivery Shipment Cancellation API
 * Cancels a Delhivery consignment before pickup.
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
    const { awb, reason = 'Cancelled by Merchant' } = req.body || {};
    if (!awb) {
      return res.status(400).json({
        success: false,
        message: 'AWB number is required to cancel Delhivery shipment.',
      });
    }

    const payload = {
      waybill: String(awb).trim(),
      cancellation: true,
      status: 'Cancelled',
      remark: reason,
    };

    const response = await fetch(`https://${DELHIVERY_HOST}/api/p/edit`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DELHIVERY_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return res.status(200).json({
      success: true,
      awb,
      message: `Delhivery shipment ${awb} cancellation request processed.`,
      raw: data,
    });
  } catch (error) {
    console.error('[Delhivery Cancel Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel Delhivery shipment.',
      error: error.message,
    });
  }
};
