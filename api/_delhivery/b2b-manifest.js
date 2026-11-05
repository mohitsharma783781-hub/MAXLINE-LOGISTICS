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
    const isProd = process.env.DELHIVERY_B2B_ENV === 'production';
    const baseUrl = isProd ? B2B_PROD_BASE : B2B_STAGING_BASE;

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
      pickupWarehouse = 'AJAYKUMAR10RP B2BRC',
      paymentMode = 'Prepaid',
      codAmount = 0,
    } = req.body || {};

    if (!consigneeName || !consigneePhone || !consigneeAddress || !consigneePincode) {
      return res.status(400).json({
        success: false,
        message: 'Consignee Name, Phone, Address, and Pincode are required for B2B booking.',
      });
    }

    // Volumetric computation across all boxes with 10 CFT factor
    let totalActualWeightKg = 0;
    let totalVolumetricWeightKg = 0;
    let totalPieces = 0;

    const normalizedBoxes = (boxes.length > 0 ? boxes : [{ lengthCm: 30, widthCm: 30, heightCm: 30, actualWeightKg: 20, boxCount: 1 }]).map((b, idx) => {
      const count = Math.max(1, Number(b.boxCount || 1));
      const l = Math.max(1, Number(b.lengthCm || 10));
      const w = Math.max(1, Number(b.widthCm || 10));
      const h = Math.max(1, Number(b.heightCm || 10));
      const actKg = Math.max(0.1, Number(b.actualWeightKg || 5));
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

    // Build Delhivery B2B Manifest Payload
    const manifestPayload = {
      client_name: 'AJAYKUMAR10RPB2BRC-B2B',
      pickup_location: pickupWarehouse || 'AJAYKUMAR10RP B2BRC',
      order_id: String(orderId || `B2B-ORD-${Date.now()}`),
      eway_bill: ewayBillNumber || '',
      invoice_number: invoiceNumber || `INV-${Date.now()}`,
      invoice_value: Number(invoiceValueINR || 0),
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

    // If an auth token is provided, invoke live Delhivery B2B manifest endpoint
    if (token) {
      const manifestRes = await fetch(`${baseUrl}/v2/manifest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify(manifestPayload),
      });

      const manifestData = await manifestRes.json().catch(() => ({}));

      if (!manifestRes.ok) {
        return res.status(manifestRes.status || 400).json({
          success: false,
          message: manifestData.message || manifestData.error || 'Delhivery B2B manifestation failed.',
          details: manifestData,
          payloadSent: manifestPayload,
        });
      }

      return res.status(200).json({
        success: true,
        lrNumber: manifestData.lrnum || manifestData.lr_number || manifestData.waybill,
        chargeableWeightKg,
        minSlabKg,
        volumetricFactor: '10CFT',
        rawResponse: manifestData,
      });
    }

    // If token not yet present (pending credentials), return staged preview
    return res.status(200).json({
      success: true,
      stagedPreview: true,
      message: 'Consignment validated with 10 CFT density & 20 KG minimum slab rule. Ready for dispatch upon password confirmation.',
      payload: manifestPayload,
      weightBreakdown: {
        totalActualWeightKg: Math.round(totalActualWeightKg * 100) / 100,
        totalVolumetricWeightKg: Math.round(totalVolumetricWeightKg * 100) / 100,
        minSlabKg: 20,
        chargeableWeightKg,
      },
    });
  } catch (err) {
    console.error('[Delhivery B2B Manifest Error]:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error while manifesting Delhivery B2B shipment.',
    });
  }
};
