/**
 * MAXLINE LOGISTICS - Delhivery B2B Shipment Manifestation (LR Booking)
 * Creates LTL / Freight consignments with 10 CFT dimensional density and 20 KG slab rule.
 */

const B2B_STAGING_BASE = 'https://btob-api-dev.delhivery.com';
const B2B_PROD_BASE = 'https://btob.api.delhivery.com';

/**
 * 10 CFT Volumetric Weight Calculation:
 * Formula: (Length_cm * Width_cm * Height_cm / 27000) * 10 kg
 * 1 CFT = 1728 cubic inches = 28316.846592 cubic cm (approx 27000 cm³ in Indian logistics standard divisor)
 */
function calculate10CftWeightKg(lengthCm, widthCm, heightCm) {
  const l = Number(lengthCm) || 0;
  const w = Number(widthCm) || 0;
  const h = Number(heightCm) || 0;
  const volumeCm3 = l * w * h;
  // 1 CFT approx 27,000 cm³ with 10kg/CFT factor
  const volumetricKg = (volumeCm3 / 27000) * 10;
  return Math.round(volumetricKg * 100) / 100;
}

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
    // Live commercial freight bookings are strictly blocked unless DELHIVERY_B2B_ALLOW_LIVE === 'true'
    const isProd = process.env.DELHIVERY_B2B_ENV === 'production';
    if (isProd && process.env.DELHIVERY_B2B_ALLOW_LIVE !== 'true') {
      return res.status(403).json({
        success: false,
        message: 'Delhivery B2B live production bookings are disabled during testing phase. Set DELHIVERY_B2B_ALLOW_LIVE=true in production environment once approved.',
      });
    }
    const baseUrl = isProd && process.env.DELHIVERY_B2B_ALLOW_LIVE === 'true' ? B2B_PROD_BASE : B2B_STAGING_BASE;

    const {
      token, // Optional bearer token passed from frontend or login service
      orderId,
      ewayBillNumber,
      invoiceNumber,
      invoiceValueINR = 0,
      consigneeName,
      consigneePhone,
      consigneeGstin,
      consigneeAddress,
      consigneeCity,
      consigneeState,
      consigneePincode,
      boxes = [], // [{ lengthCm, widthCm, heightCm, actualWeightKg, boxCount }]
      pickupWarehouse,
      paymentMode = 'Prepaid',
      codAmount = 0,
    } = req.body || {};

    // TASK 3: Strict Validation of Consignment Payload — Never invent missing values
    if (!consigneeName || !consigneePhone || !consigneeAddress || !consigneePincode) {
      return res.status(400).json({
        success: false,
        message: 'Consignee Name, Phone, Address, and 6-digit Pincode are strictly required for B2B booking.',
      });
    }

    if (!Array.isArray(boxes) || boxes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Consignment must contain at least one package box with dimensions and weight.',
      });
    }

    // TASK 3 & 6: Legal E-Way Bill Validation under CGST Rule 138 (with statutory exemptions)
    const invVal = Number(invoiceValueINR) || 0;
    const cleanEwb = String(ewayBillNumber || '').trim().replace(/\D/g, '');
    const isEwbExempt = req.body?.isEwbExempt === true;

    if (cleanEwb) {
      if (cleanEwb.length !== 12) {
        return res.status(400).json({
          success: false,
          message: 'E-Way Bill Number must be exactly 12 numeric digits.',
        });
      }
    } else if (invVal > 50000 && !isEwbExempt) {
      return res.status(400).json({
        success: false,
        message: `E-Way Bill Number (12 numeric digits) is legally required under Indian GST for B2B consignments with invoice value exceeding ₹50,000 (Current: ₹${invVal}) unless exempted under GST Rule 138(14).`,
      });
    }

    // Volumetric computation across all boxes with 10 CFT factor (effective divisor: 2700)
    let totalActualWeightKg = 0;
    let totalVolumetricWeightKg = 0;
    let totalPieces = 0;

    const normalizedBoxes = boxes.map((b, idx) => {
      const count = Math.max(1, Number(b.boxCount || 1));
      const l = Math.max(1, Number(b.lengthCm || 10));
      const w = Math.max(1, Number(b.widthCm || 10));
      const h = Math.max(1, Number(b.heightCm || 10));
      const actKg = Math.max(0.1, Number(b.actualWeightKg || 1));
      const volKg = calculate10CftWeightKg(l, w, h);

      totalPieces += count;
      totalActualWeightKg += actKg * count;
      totalVolumetricWeightKg += volKg * count;

      return {
        piece_index: idx + 1,
        box_count: count,
        length: l,
        width: w,
        height: h,
        actual_weight_kg: actKg,
        volumetric_weight_10cft_kg: volKg,
      };
    });

    // 20 KG MINIMUM SLAB RULE for Delhivery B2B:
    // Chargeable weight is the higher of actual vs volumetric, clamped to a minimum of 20 kg.
    const rawChargeableWeight = Math.max(totalActualWeightKg, totalVolumetricWeightKg);
    const minSlabKg = 20; // 20 KG SLAB
    const chargeableWeightKg = Math.max(minSlabKg, Math.round(rawChargeableWeight * 100) / 100);

    const clientName = process.env.DELHIVERY_B2B_CLIENT_NAME || process.env.DELHIVERY_B2B_USERNAME;
    if (!clientName) {
      return res.status(500).json({
        success: false,
        message: 'DELHIVERY_B2B_CLIENT_NAME or DELHIVERY_B2B_USERNAME is not configured in server environment.',
      });
    }
    const warehouseLocation = pickupWarehouse || process.env.DELHIVERY_B2B_DEFAULT_WAREHOUSE || 'MAXLINE LOGI - 156';

    // Build Delhivery B2B Manifest Payload
    const manifestPayload = {
      client_name: clientName,
      pickup_location: warehouseLocation,
      order_id: String(orderId || `B2B-ORD-${Date.now()}`),
      eway_bill: ewayBillNumber ? String(ewayBillNumber).trim() : '',
      invoice_number: invoiceNumber || '',
      invoice_value: invVal,
      payment_mode: paymentMode === 'COD' ? 'COD' : 'Prepaid',
      cod_amount: paymentMode === 'COD' ? Number(codAmount || 0) : 0,
      chargeable_weight: chargeableWeightKg,
      actual_weight: Math.round(totalActualWeightKg * 100) / 100,
      volumetric_weight: Math.round(totalVolumetricWeightKg * 100) / 100,
      volumetric_slab: '10CFT',
      min_slab_kg: minSlabKg,
      total_pieces: totalPieces,
      consignee: {
        name: consigneeName,
        phone: consigneePhone,
        gstin: consigneeGstin || '',
        address: consigneeAddress,
        city: consigneeCity,
        state: consigneeState,
        pincode: Number(String(consigneePincode).replace(/\D/g, '')),
      },
      boxes: normalizedBoxes,
    };

    // TASK 4: Auto-acquire auth token strictly via environment variables (no hardcoded passwords)
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
          const errData = await loginRes.json().catch(() => ({}));
          return res.status(401).json({
            success: false,
            message: `Delhivery B2B UMS Login Failed: ${errData.message || errData.error || loginRes.statusText}`,
          });
        }
      } catch (loginErr) {
        return res.status(502).json({
          success: false,
          message: `Network failure connecting to Delhivery B2B UMS gateway: ${loginErr.message}`,
        });
      }
    }

    if (!authToken) {
      return res.status(401).json({
        success: false,
        message: 'No valid Delhivery B2B authentication token available.',
      });
    }

    // Invoke live Delhivery B2B manifest endpoint
    const manifestRes = await fetch(`${baseUrl}/v2/manifest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken.trim()}`,
      },
      body: JSON.stringify(manifestPayload),
    });

    const manifestData = await manifestRes.json().catch(() => ({}));

    if (!manifestRes.ok || (!manifestData.lrnum && !manifestData.lr_number && !manifestData.waybill)) {
      return res.status(manifestRes.status || 400).json({
        success: false,
        message: manifestData.message || manifestData.error || 'Delhivery B2B manifestation failed.',
        details: manifestData,
        payloadSent: manifestPayload,
      });
    }

    const issuedLr = manifestData.lrnum || manifestData.lr_number || manifestData.waybill;

    return res.status(200).json({
      success: true,
      lrNumber: issuedLr,
      chargeableWeightKg,
      minSlabKg,
      volumetricFactor: '10CFT',
      rawResponse: manifestData,
    });
  } catch (err) {
    console.error('[Delhivery B2B Manifest Error]:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error while manifesting Delhivery B2B shipment.',
    });
  }
};
