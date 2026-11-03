/**
 * MAXLINE LOGISTICS - Delhivery Real-time Webhook Synchronization API
 * Receives live push tracking scan events, milestone updates, NDR, and POD from Delhivery.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lbldljgyusyqqcbyvmem.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxibGRsamd5dXN5cXFjYnl2bWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5Mzg2NDcsImV4cCI6MjEwODUxNDY0N30.WsFo9NV3CI_fw5jOe3d-XNuGZ-HElpogkyq0UAINN8U';

function mapDelhiveryStatus(rawStatus, statusType) {
  const s = String(rawStatus || '').toLowerCase();
  const st = String(statusType || '').toLowerCase();

  if (st.includes('dl') || s.includes('delivered')) return { internal: 'DELIVERED', customer: 'Delivered' };
  if (s.includes('out for delivery') || s.includes('ofd') || st.includes('od')) return { internal: 'OUT_FOR_DELIVERY', customer: 'Out for Delivery' };
  if (st.includes('rt') || s.includes('rto') || s.includes('returned')) return { internal: 'RTO_INITIATED', customer: 'RTO Initiated' };
  if (st.includes('ud') || s.includes('ndr') || s.includes('undelivered') || s.includes('failed')) return { internal: 'NDR', customer: 'Delivery Attempted' };
  if (st.includes('pu') || s.includes('picked up') || s.includes('collected')) return { internal: 'PICKED_UP', customer: 'Picked Up' };
  if (s.includes('pickup scheduled')) return { internal: 'PICKUP_REQUESTED', customer: 'Pickup Requested' };
  if (st.includes('in') || s.includes('transit') || s.includes('dispatched') || s.includes('hub')) return { internal: 'IN_TRANSIT', customer: 'In Transit' };
  if (s.includes('cancelled') || s.includes('void')) return { internal: 'CANCELLED', customer: 'Cancelled' };

  return { internal: 'IN_TRANSIT', customer: 'In Transit' };
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

  // Health check / Handshake for Delhivery webhook registration
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      service: 'MAXLINE LOGISTICS Delhivery Webhook Receiver',
      status: 'OPERATIONAL',
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // Continue with raw body
      }
    }

    // Delhivery may send a single object or an array of scans
    const updates = Array.isArray(body) ? body : [body];
    const results = [];

    for (const update of updates) {
      const awb =
        update.Waybill ||
        update.waybill ||
        update.awb ||
        update.wbn ||
        (update.Shipment && update.Shipment.Waybill);

      if (!awb) continue;

      const cleanAwb = String(awb).trim();
      const rawStatus =
        (update.Status && update.Status.Status) ||
        update.status ||
        update.StatusType ||
        'In Transit';
      const statusType = (update.Status && update.Status.StatusType) || update.status_type || '';
      const location =
        (update.Status && update.Status.ScannedLocation) ||
        update.location ||
        'Delhivery Transit Hub';
      const instructions =
        (update.Status && update.Status.Instructions) ||
        update.remarks ||
        update.comment ||
        'Scanned by Delhivery Network';
      const eventTime =
        (update.Status && update.Status.StatusDateTime) ||
        update.scan_datetime ||
        new Date().toISOString();

      const { internal, customer } = mapDelhiveryStatus(rawStatus, statusType);

      // Attempt Supabase live update if credentials present
      let dbUpdated = false;
      try {
        const patchRes = await fetch(
          `${SUPABASE_URL}/rest/v1/shipments?awb_number=eq.${encodeURIComponent(cleanAwb)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              booking_status: internal,
              customer_facing_status: customer,
              tracking_status: internal,
              updated_at: new Date().toISOString(),
            }),
          }
        );
        dbUpdated = patchRes.ok;
      } catch (dbErr) {
        console.warn('[Delhivery Webhook] Supabase update fallback:', dbErr.message);
      }

      results.push({
        awb: cleanAwb,
        status: internal,
        customerStatus: customer,
        location,
        eventTime,
        dbUpdated,
      });
    }

    return res.status(200).json({
      success: true,
      processedCount: results.length,
      updates: results,
      message: `Processed ${results.length} Delhivery tracking webhook scan(s).`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Delhivery Webhook Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process Delhivery webhook event.',
      error: error.message,
    });
  }
};
