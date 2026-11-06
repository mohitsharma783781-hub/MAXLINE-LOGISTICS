/**
 * MAXLINE LOGISTICS — Delhivery B2B LTL Manifestation & LR Engine
 * 
 * Implemented strictly against the official Delhivery B2B Postman Collection:
 * "B2B Postman collection New API Staging Copy 2"
 * 
 * Endpoints:
 * Staging:    POST / GET https://ltl-clients-api-dev.delhivery.com/manifest
 * Production: POST / GET https://ltl-clients-api.delhivery.com/manifest
 * 
 * Protocol: multipart/form-data with async Job ID polling workflow.
 */

const LTL_STAGING_BASE = 'https://ltl-clients-api-dev.delhivery.com';
const LTL_PROD_BASE = 'https://ltl-clients-api.delhivery.com';

/**
 * 10 CFT Volumetric Weight Calculation:
 * Formula: (Length_cm * Width_cm * Height_cm / 27000) * 10 kg = (L * W * H) / 2700
 * Minimum Consignment Slab: 20 KG
 */
function calculate10CftVolumetricKg(lengthCm, widthCm, heightCm) {
  const l = Math.max(1, Number(lengthCm) || 0);
  const w = Math.max(1, Number(widthCm) || 0);
  const h = Math.max(1, Number(heightCm) || 0);
  const volKg = (l * w * h / 27000) * 10;
  return Math.round(volKg * 100) / 100;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper to fetch valid Bearer token from UMS login service.
 */
async function getAuthToken(baseUrl, username, password) {
  try {
    const res = await fetch(`${baseUrl}/ums/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username: username.trim(), password: password.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    return data?.data?.jwt || data?.jwt || data?.token || data?.data?.token || null;
  } catch (err) {
    console.error('[Delhivery B2B Auth Token Error]:', err.message);
    return null;
  }
}

/**
 * Polls GET /manifest?job_id={jobId} to check manifestation status.
 */
async function pollManifestStatus(baseUrl, token, jobId) {
  try {
    const res = await fetch(`${baseUrl}/manifest?job_id=${encodeURIComponent(jobId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return { status: 500, ok: false, error: err.message };
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

  try {
    // SERVER-SIDE SAFETY GUARD: Live production is disabled unless explicitly enabled
    const isProd = process.env.DELHIVERY_B2B_ENV === 'production';
    if (isProd && process.env.DELHIVERY_B2B_ALLOW_LIVE !== 'true') {
      return res.status(403).json({
        success: false,
        message: 'Delhivery B2B live production bookings are disabled during testing phase. Set DELHIVERY_B2B_ALLOW_LIVE=true in production environment once approved.',
      });
    }

    const baseUrl = isProd && process.env.DELHIVERY_B2B_ALLOW_LIVE === 'true' ? LTL_PROD_BASE : LTL_STAGING_BASE;

    // Resolve credentials
    const b2bUser = process.env.DELHIVERY_B2B_USERNAME;
    const b2bPass = process.env.DELHIVERY_B2B_PASSWORD;

    if (!b2bUser || !b2bPass) {
      return res.status(500).json({
        success: false,
        message: 'Delhivery B2B credentials (DELHIVERY_B2B_USERNAME, DELHIVERY_B2B_PASSWORD) are not configured in server environment.',
      });
    }

    let authToken = req.body?.token || req.headers?.authorization?.replace(/^Bearer\s+/i, '');
    if (!authToken) {
      authToken = await getAuthToken(baseUrl, b2bUser, b2bPass);
    }

    if (!authToken) {
      return res.status(401).json({
        success: false,
        message: 'Unable to authenticate with Delhivery B2B UMS gateway. Please verify staging credentials.',
      });
    }

    // RECONCILIATION / STATUS CHECK MODE (GET or POST with jobId)
    // If client queries status of an existing job, check without creating a new manifest
    const existingJobId = req.query?.job_id || req.body?.job_id;
    if (existingJobId || req.method === 'GET') {
      const targetJob = existingJobId || req.query?.job_id;
      if (!targetJob) {
        return res.status(400).json({ success: false, message: 'Param "job_id" is required to query manifest status.' });
      }

      const pollResult = await pollManifestStatus(baseUrl, authToken, targetJob);
      return res.status(pollResult.status || 200).json({
        success: pollResult.ok,
        jobId: targetJob,
        result: pollResult.data,
      });
    }

    // MANIFESTATION CREATION (POST)
    const {
      orderId,
      ewayBillNumber,
      invoiceNumber,
      invoiceValueINR = 0,
      paymentMode = 'Prepaid',
      codAmount = 0,
      pickupWarehouse,
      consigneeName,
      consigneePhone,
      consigneeEmail = '',
      consigneeAddress,
      consigneeCity,
      consigneeState,
      consigneePincode,
      consigneeGstin = 'URP',
      boxes = [],
      billingAddress,
      rovInsurance = false,
      fmPickup = false,
      freightMode = 'fop',
      description = 'B2B Cargo Consignment',
      isEwbExempt = false,
    } = req.body || {};

    // 1. Strict validation of required fields
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

    const cleanPincode = String(consigneePincode).trim().replace(/\D/g, '');
    if (cleanPincode.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Consignee Pincode must be exactly 6 numeric digits.',
      });
    }

    // 2. Legal E-Way Bill Validation under CGST Rule 138
    const invVal = Number(invoiceValueINR) || 0;
    const cleanEwb = String(ewayBillNumber || '').trim().replace(/\D/g, '');

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
        message: `E-Way Bill Number (12 numeric digits) is legally required under Indian GST for B2B consignments with invoice value > ₹50,000 (Current: ₹${invVal}) unless exempted under GST Rule 138(14).`,
      });
    }

    // 3. Multi-Box 10 CFT Dimensional Density & Minimum 20 KG Slab Calculation
    let totalPieces = 0;
    let totalActualKg = 0;
    let totalVolumetricKg = 0;

    const normalizedDimensions = [];
    boxes.forEach(b => {
      const count = Math.max(1, Number(b.boxCount || b.quantity || 1));
      const l = Math.max(1, Number(b.lengthCm || b.length || 10));
      const w = Math.max(1, Number(b.widthCm || b.width || 10));
      const h = Math.max(1, Number(b.heightCm || b.height || 10));
      const actKg = Math.max(0.1, Number(b.actualWeightKg || b.weight || 1));
      const volKg = calculate10CftVolumetricKg(l, w, h);

      totalPieces += count;
      totalActualKg += actKg * count;
      totalVolumetricKg += volKg * count;

      normalizedDimensions.push({
        box_count: count,
        length: l,
        width: w,
        height: h,
      });
    });

    totalActualKg = Math.round(totalActualKg * 100) / 100;
    totalVolumetricKg = Math.round(totalVolumetricKg * 100) / 100;
    const rawChargeableKg = Math.max(totalActualKg, totalVolumetricKg);
    const minSlabKg = 20; // 20 KG Minimum Contract Slab
    const chargeableWeightKg = Math.max(minSlabKg, Math.round(rawChargeableKg * 100) / 100);

    // CRITICAL: Delhivery B2B LTL API strictly expects weight in GRAMS (gm)!
    const totalWeightGrams = Math.round(chargeableWeightKg * 1000);

    // 4. Pickup Location (Warehouse)
    const warehouseLocationName = String(
      pickupWarehouse ||
      process.env.DELHIVERY_B2B_DEFAULT_WAREHOUSE ||
      ''
    ).trim();

    if (!warehouseLocationName) {
      return res.status(400).json({
        success: false,
        status: 'FAILED',
        message: 'Registered pickup warehouse location name (pickupWarehouse parameter or DELHIVERY_B2B_DEFAULT_WAREHOUSE env) is required for Delhivery B2B booking.',
      });
    }

    // 5. Construct Official Multipart/Form-Data Payload
    const formData = new FormData();
    formData.append('lrn', ''); // Empty string to let Delhivery auto-generate LRN
    formData.append('pickup_location_name', warehouseLocationName);
    formData.append('payment_mode', paymentMode === 'COD' ? 'cod' : 'prepaid');
    formData.append('cod_amount', paymentMode === 'COD' ? String(Number(codAmount) || 0) : '0');
    formData.append('weight', String(totalWeightGrams));

    // dropoff_location JSON (Uses "zip" and "address" as per official Postman collection)
    const dropoffObj = {
      consignee_name: String(consigneeName).trim(),
      address: String(consigneeAddress).trim(),
      city: String(consigneeCity || '').trim(),
      state: String(consigneeState || '').trim(),
      zip: cleanPincode,
      phone: String(consigneePhone).trim().replace(/\D/g, '').slice(-10),
      email: String(consigneeEmail || '').trim(),
    };
    formData.append('dropoff_location', JSON.stringify(dropoffObj));

    formData.append('rov_insurance', rovInsurance ? 'True' : 'False');

    // invoices JSON array
    const invoicesArray = [
      {
        ewaybill: cleanEwb,
        inv_num: String(invoiceNumber || `INV-${Date.now()}`),
        inv_amt: invVal,
        inv_qr_code: '',
      },
    ];
    formData.append('invoices', JSON.stringify(invoicesArray));

    // shipment_details JSON array
    const shipmentDetailsArray = [
      {
        order_id: String(orderId || `B2B-ORD-${Date.now()}`),
        box_count: totalPieces,
        description: String(description || 'B2B Cargo Consignment'),
        weight: totalWeightGrams,
        waybills: [],
        master: false,
      },
    ];
    formData.append('shipment_details', JSON.stringify(shipmentDetailsArray));

    // dimensions JSON array
    formData.append('dimensions', JSON.stringify(normalizedDimensions));

    formData.append('fm_pickup', fmPickup ? 'True' : 'False');
    formData.append('freight_mode', freightMode === 'fod' ? 'fod' : 'fop');

    // billing_address JSON (consignor / billing master) - strictly dynamic, no hardcoded personal data
    const billingObj = {
      name: billingAddress?.name || process.env.DELHIVERY_B2B_CLIENT_NAME || 'Consignor Hub',
      company: billingAddress?.company || process.env.DELHIVERY_B2B_COMPANY_NAME || 'MAXLINE LOGISTICS',
      consignor: billingAddress?.consignor || billingAddress?.name || process.env.DELHIVERY_B2B_CLIENT_NAME || 'Consignor Hub',
      address: billingAddress?.address || process.env.DELHIVERY_B2B_BILLING_ADDRESS || 'Commercial Logistics Hub',
      city: billingAddress?.city || process.env.DELHIVERY_B2B_BILLING_CITY || 'Central Hub',
      state: billingAddress?.state || process.env.DELHIVERY_B2B_BILLING_STATE || 'State',
      pin: String(billingAddress?.pin || process.env.DELHIVERY_B2B_BILLING_PIN || '110001').replace(/\D/g, ''),
      phone: String(billingAddress?.phone || process.env.DELHIVERY_B2B_BILLING_PHONE || '9999999999').replace(/\D/g, ''),
      gst_number: billingAddress?.gst_number || consigneeGstin || 'URP',
    };
    formData.append('billing_address', JSON.stringify(billingObj));

    // 6. Submit Multipart Request to Official Delhivery Endpoint
    const manifestRes = await fetch(`${baseUrl}/manifest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken.trim()}`,
        // Note: Do NOT set Content-Type header manually; fetch sets multipart boundary automatically
      },
      body: formData,
    });

    const manifestData = await manifestRes.json().catch(() => ({}));

    if (!manifestRes.ok) {
      return res.status(manifestRes.status || 400).json({
        success: false,
        status: 'FAILED',
        message: manifestData?.error?.message || manifestData?.message || manifestData?.error || 'Delhivery B2B manifest request rejected.',
        details: manifestData,
        weightBreakdown: {
          totalActualKg,
          totalVolumetricKg,
          chargeableWeightKg,
          totalWeightGrams,
        },
      });
    }

    // 7. Handle Asynchronous Job ID Workflow
    const jobId = manifestData?.job_id || manifestData?.data?.job_id || manifestData?.request_id;
    if (!jobId) {
      // If Delhivery returns direct LR synchronously
      const directLr = manifestData?.lrnum || manifestData?.lr_number || manifestData?.data?.lrnum;
      if (directLr) {
        return res.status(200).json({
          success: true,
          status: 'BOOKED',
          lrNumber: String(directLr),
          chargeableWeightKg,
          totalWeightGrams,
          totalPieces,
          rawResponse: manifestData,
        });
      }

      return res.status(502).json({
        success: false,
        status: 'FAILED',
        message: 'Delhivery B2B response missing job_id and lrnum.',
        details: manifestData,
      });
    }

    // 8. Poll for Manifest Processing (Up to 3 attempts with safe delays)
    let confirmedLr = null;
    let pollResponse = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      await delay(1500); // 1.5s interval
      const poll = await pollManifestStatus(baseUrl, authToken, jobId);
      pollResponse = poll.data;

      if (poll.ok && poll.data) {
        const foundLr = poll.data?.lrnum || poll.data?.lr_number || poll.data?.data?.lrnum || poll.data?.data?.lr_number;
        if (foundLr) {
          confirmedLr = String(foundLr);
          break;
        }

        // If explicitly failed in queue
        if (poll.data?.status === 'FAILED' || poll.data?.error) {
          return res.status(400).json({
            success: false,
            status: 'FAILED',
            jobId,
            message: poll.data?.error?.message || poll.data?.message || 'Shipment manifestation failed during queue processing.',
            details: poll.data,
          });
        }
      }
    }

    // If LR was confirmed during polling
    if (confirmedLr) {
      return res.status(200).json({
        success: true,
        status: 'BOOKED',
        lrNumber: confirmedLr,
        jobId,
        chargeableWeightKg,
        totalWeightGrams,
        totalPieces,
        rawResponse: pollResponse,
      });
    }

    // If still in queue, return clean PROCESSING status with jobId (Never generate fake LR!)
    return res.status(202).json({
      success: true,
      status: 'PROCESSING',
      jobId,
      message: 'Manifest request accepted and queued by Delhivery LTL. Query GET /manifest?job_id=' + jobId + ' to retrieve confirmed LR number.',
      chargeableWeightKg,
      totalWeightGrams,
      totalPieces,
    });
  } catch (err) {
    console.error('[Delhivery B2B Manifest Error]:', err);
    return res.status(500).json({
      success: false,
      status: 'FAILED',
      message: err?.message || 'Internal server error while manifesting Delhivery B2B consignment.',
    });
  }
};
