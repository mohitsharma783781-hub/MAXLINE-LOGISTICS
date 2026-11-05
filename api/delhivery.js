/**
 * MAXLINE LOGISTICS - Delhivery Unified API Router
 * Dispatches Delhivery actions through a single Serverless Function to comply
 * with Vercel Hobby limits (<= 12 functions) while preserving all endpoints.
 */

const handlers = {
  'cancel': require('./_delhivery/cancel.js'),
  'create-shipment': require('./_delhivery/create-shipment.js'),
  'create-warehouse': require('./_delhivery/create-warehouse.js'),
  'label': require('./_delhivery/label.js'),
  'pickup': require('./_delhivery/pickup.js'),
  'serviceability': require('./_delhivery/serviceability.js'),
  'track': require('./_delhivery/track.js'),
  'waybill': require('./_delhivery/waybill.js'),
  'webhook': require('./_delhivery/webhook.js'),
  // Delhivery B2B (10CFT & 20KG Slab) Endpoints
  'b2b-login': require('./_delhivery/b2b-login.js'),
  'b2b-manifest': require('./_delhivery/b2b-manifest.js'),
  'b2b-track': require('./_delhivery/b2b-track.js'),
};

module.exports = async (req, res) => {
  // CORS Preflight
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

  // Determine requested action
  let action = req.query?.action;
  if (!action && req.url) {
    const cleanUrl = req.url.split('?')[0];
    const parts = cleanUrl.split('/').filter(Boolean);
    action = parts[parts.length - 1];
  }

  // Normalize action name (e.g. 'create_shipment' -> 'create-shipment')
  if (action) {
    action = String(action).toLowerCase().trim().replace(/_/g, '-');
  }

  const handler = handlers[action];
  if (!handler) {
    return res.status(404).json({
      success: false,
      error: `Delhivery endpoint '${action}' not found`,
      availableActions: Object.keys(handlers),
    });
  }

  try {
    return await handler(req, res);
  } catch (err) {
    console.error(`[Delhivery API] Error executing action '${action}':`, err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error in Delhivery dispatcher',
    });
  }
};
