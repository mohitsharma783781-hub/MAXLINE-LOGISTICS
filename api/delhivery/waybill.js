/**
 * MAXLINE LOGISTICS - Delhivery Waybill / AWB Allocator API
 * Pre-fetches authentic tracking waybill numbers from Delhivery HQ.
 */

const DELHIVERY_API_TOKEN = process.env.DELHIVERY_API_TOKEN || '745fcc8cddf49e2c15e9e018a20d78b7ede7656e';
const DELHIVERY_HOST = 'track.delhivery.com';

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
    const url = `https://${DELHIVERY_HOST}/waybill/api/fetch/json/`;

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
        message: `Delhivery waybill fetch failed with status ${response.status}`,
      });
    }

    const text = await response.text();
    // Delhivery returns the waybill as a JSON string or raw string like "47474010040585"
    let waybill = text.trim();
    if (waybill.startsWith('"') && waybill.endsWith('"')) {
      waybill = waybill.slice(1, -1);
    }

    if (!waybill || waybill.length < 8) {
      return res.status(502).json({
        success: false,
        message: 'Invalid waybill response received from Delhivery.',
      });
    }

    return res.status(200).json({
      success: true,
      waybill,
      allocatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Delhivery Waybill Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching waybill from Delhivery.',
      error: error.message,
    });
  }
};
