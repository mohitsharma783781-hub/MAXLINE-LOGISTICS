/**
 * MAXLINE LOGISTICS - Delhivery Shipping Label Generator API
 * Fetches and streams official 4x6 thermal barcode PDF shipping labels from Delhivery.
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

  const awb = req.query.awb || (req.body && req.body.awb);
  if (!awb) {
    return res.status(400).json({
      success: false,
      message: 'Delhivery AWB number is required to fetch shipping label.',
    });
  }

  try {
    const cleanAwb = String(awb).trim();
    const url = `https://${DELHIVERY_HOST}/api/p/packing_slip?wbns=${cleanAwb}&pdf=true`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${DELHIVERY_API_TOKEN}`,
        'Accept': 'application/pdf, application/json, */*',
      },
    });

    const contentType = response.headers.get('content-type') || '';

    // If PDF stream returned directly
    if (contentType.includes('application/pdf')) {
      const arrayBuffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="delhivery_label_${cleanAwb}.pdf"`);
      return res.status(200).send(Buffer.from(arrayBuffer));
    }

    // Otherwise JSON with packages array or error
    const data = await response.json().catch(() => ({}));

    if (data.packages_found === 0 || data.error) {
      return res.status(404).json({
        success: false,
        message: `No Delhivery packing slip found for AWB ${cleanAwb}`,
        raw: data,
      });
    }

    return res.status(200).json({
      success: true,
      awb: cleanAwb,
      data,
    });
  } catch (error) {
    console.error('[Delhivery Label Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate Delhivery shipping label.',
      error: error.message,
    });
  }
};
