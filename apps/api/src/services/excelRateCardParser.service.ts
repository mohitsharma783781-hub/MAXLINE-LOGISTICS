import * as XLSX from 'xlsx';

export interface ParsedChargeRule {
  id: string;
  code: string;
  name: string;
  calcType: 'FIXED' | 'PERCENTAGE' | 'PER_KG' | 'PER_BOX' | 'PER_DAY_PER_KG' | 'HIGHER_OF_MIN_OR_VARIABLE' | 'INVOICE_PERCENTAGE';
  value: number; // in minor units (paise) or percentage value
  minAmountMinor?: number;
  rawLabel: string;
  rawValue: string;
  formulaDescription: string;
  isPostShipment?: boolean;
  condition?: string;
  needsReview?: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ParsedSheetRateCard {
  sheetName: string;
  courierId: string;
  courierName: string;
  serviceName: string;
  originZones: string[];
  destinationZones: string[];
  zoneMatrix: Record<string, Record<string, number>>; // origin -> dest -> rate in paise
  volumetricDivisor: number;
  minChargeableWeightGrams: number;
  minFreightChargeMinor: number;
  weightRoundingRule: 'ROUND_UP_1KG' | 'ROUND_UP_500G' | 'EXACT' | 'CEIL';
  fuelSurchargePercent: number;
  docketChargeMinor: number;
  gstPercent: number;
  surcharges: ParsedChargeRule[];
  zoneCoverage: Record<string, string>;
  rawChargePairs: Array<{ key: string; value: string }>;
  totalRatesParsed: number;
  warnings: string[];
  needsManualReview: boolean;
  status: 'DRAFT';
}

export interface WorkbookParseResult {
  fileName: string;
  sheets: ParsedSheetRateCard[];
  totalSheetsCount: number;
  parsedSheetsCount: number;
  globalWarnings: string[];
}

export function normalizeCourierId(rawText: string): { id: string; name: string; service: string } {
  const lower = (rawText || '').toLowerCase().trim();

  if (lower.includes('delhivery')) {
    return { id: 'delhivery', name: 'Delhivery Surface & Express', service: 'Surface Freight Cargo' };
  }
  if (lower.includes('ekart')) {
    return { id: 'ekart', name: 'Ekart Logistics B2B', service: 'B2B Commercial Surface' };
  }
  if (lower.includes('movin')) {
    return { id: 'movin', name: 'Movin Standard Premium (UPS/InterGlobe)', service: 'Standard Premium Freight' };
  }
  if (lower.includes('blue') || lower.includes('bluedart')) {
    return { id: 'bluedart', name: 'Blue Dart Express', service: 'Priority Commercial Cargo' };
  }
  if (lower.includes('dtdc')) {
    return { id: 'dtdc', name: 'DTDC Express Ltd', service: 'Express Cargo Freight' };
  }
  if (lower.includes('xpress') || lower.includes('xpressbees')) {
    return { id: 'xpressbees', name: 'XpressBees Logistics', service: 'B2B Heavy Surface' };
  }
  if (lower.includes('gati')) {
    return { id: 'gati', name: 'Gati KWE Express', service: 'Commercial Surface Cargo' };
  }

  const slug = lower.replace(/[^a-z0-9]/g, '_').slice(0, 20) || 'custom_courier';
  return {
    id: slug,
    name: rawText.trim() || 'Custom Courier Partner',
    service: 'B2B Cargo Freight'
  };
}

export function parseChargeRule(key: string, valStr: string): ParsedChargeRule {
  const cleanKey = key.trim();
  const cleanVal = valStr.trim();
  const lowerKey = cleanKey.toLowerCase();
  const id = `sur-${Math.random().toString(36).slice(2, 9)}`;

  // Docket Fee
  if (lowerKey.includes('docket')) {
    const match = cleanVal.match(/(\d+(?:\.\d+)?)/);
    const inr = match ? parseFloat(match[1]) : 65;
    return {
      id,
      code: 'DOCKET',
      name: 'Docket Fee',
      calcType: 'FIXED',
      value: Math.round(inr * 100),
      rawLabel: cleanKey,
      rawValue: cleanVal,
      formulaDescription: `Flat ₹${inr} per docket`,
      status: 'ACTIVE',
      isPostShipment: false
    };
  }

  // Fuel Surcharge
  if (lowerKey.includes('fuel') || lowerKey.includes('fsc')) {
    const match = cleanVal.match(/(\d+(?:\.\d+)?)\s*%/);
    const pct = match ? parseFloat(match[1]) : 13.5;
    return {
      id,
      code: 'FUEL',
      name: 'Fuel Surcharge (FSC)',
      calcType: 'PERCENTAGE',
      value: pct,
      rawLabel: cleanKey,
      rawValue: cleanVal,
      formulaDescription: `${pct}% on base freight`,
      status: 'ACTIVE',
      isPostShipment: false
    };
  }

  // Freight on Value / Insurance
  if (lowerKey.includes('fov') || lowerKey.includes('value') || lowerKey.includes("owner's risk") || lowerKey.includes('insurance')) {
    const minMatch = cleanVal.match(/(?:inr|rs\.?|minimum)\s*(\d+(?:\.\d+)?)/i);
    const pctMatch = cleanVal.match(/(\d+(?:\.\d+)?)\s*%/);
    const minINR = minMatch ? parseFloat(minMatch[1]) : 50;
    const pct = pctMatch ? parseFloat(pctMatch[1]) : 0.05;

    return {
      id,
      code: 'FOV',
      name: "Freight on Value / Owner's Risk",
      calcType: 'HIGHER_OF_MIN_OR_VARIABLE',
      value: pct,
      minAmountMinor: Math.round(minINR * 100),
      rawLabel: cleanKey,
      rawValue: cleanVal,
      formulaDescription: `Higher of ₹${minINR} or ${pct}% of declared invoice value`,
      status: 'ACTIVE',
      isPostShipment: false
    };
  }

  // ODA
  if (lowerKey.includes('oda')) {
    const minMatch = cleanVal.match(/(?:inr|rs\.?)\s*(\d+(?:\.\d+)?)/i);
    const kgMatch = cleanVal.match(/(\d+(?:\.\d+)?)\s*\/\s*kg/i);
    const minINR = minMatch ? parseFloat(minMatch[1]) : 550;
    const perKg = kgMatch ? parseFloat(kgMatch[1]) : 2.25;

    return {
      id,
      code: 'ODA',
      name: 'Out of Delivery Area (ODA)',
      calcType: 'HIGHER_OF_MIN_OR_VARIABLE',
      value: Math.round(perKg * 100),
      minAmountMinor: Math.round(minINR * 100),
      rawLabel: cleanKey,
      rawValue: cleanVal,
      formulaDescription: `Higher of ₹${minINR} or ₹${perKg}/KG`,
      status: 'ACTIVE',
      isPostShipment: false,
      condition: 'ODA_DESTINATION'
    };
  }

  // Appointment / ABD
  if (lowerKey.includes('appointment') || lowerKey.includes('abd')) {
    const minMatch = cleanVal.match(/(?:inr|rs\.?)\s*(\d+(?:\.\d+)?)/i);
    const kgMatch = cleanVal.match(/(\d+(?:\.\d+)?)\s*(?:\/|per)\s*kg/i);
    const minINR = minMatch ? parseFloat(minMatch[1]) : 550;
    const perKg = kgMatch ? parseFloat(kgMatch[1]) : 3.0;

    return {
      id,
      code: 'APPOINTMENT',
      name: 'Appointment / ABD Delivery Charge',
      calcType: 'HIGHER_OF_MIN_OR_VARIABLE',
      value: Math.round(perKg * 100),
      minAmountMinor: Math.round(minINR * 100),
      rawLabel: cleanKey,
      rawValue: cleanVal,
      formulaDescription: `Higher of ₹${minINR} or ₹${perKg}/KG`,
      status: 'ACTIVE',
      isPostShipment: false,
      condition: 'APPOINTMENT_REQUESTED'
    };
  }

  // Reattempt
  if (lowerKey.includes('reattempt')) {
    const minMatch = cleanVal.match(/(?:inr|rs\.?)\s*(\d+(?:\.\d+)?)/i);
    const kgMatch = cleanVal.match(/(\d+(?:\.\d+)?)\s*\/\s*kg/i);
    const minINR = minMatch ? parseFloat(minMatch[1]) : 500;
    const perKg = kgMatch ? parseFloat(kgMatch[1]) : 2.0;

    return {
      id,
      code: 'REATTEMPT',
      name: 'Reattempt Delivery Fee (Beyond Free)',
      calcType: 'HIGHER_OF_MIN_OR_VARIABLE',
      value: Math.round(perKg * 100),
      minAmountMinor: Math.round(minINR * 100),
      rawLabel: cleanKey,
      rawValue: cleanVal,
      formulaDescription: `Higher of ₹${minINR} or ₹${perKg}/KG`,
      status: 'ACTIVE',
      isPostShipment: true,
      condition: 'EXCEEDS_FREE_ATTEMPTS'
    };
  }

  // Mall / Special
  if (lowerKey.includes('mall') || lowerKey.includes('special delivery')) {
    const minMatch = cleanVal.match(/(?:inr|rs\.?)\s*(\d+(?:\.\d+)?)/i);
    const kgMatch = cleanVal.match(/(\d+(?:\.\d+)?)\s*\/\s*kg/i);
    const minINR = minMatch ? parseFloat(minMatch[1]) : 500;
    const perKg = kgMatch ? parseFloat(kgMatch[1]) : 2.0;

    return {
      id,
      code: 'MALL_DELIVERY',
      name: 'Mall / Special Entry Delivery',
      calcType: 'HIGHER_OF_MIN_OR_VARIABLE',
      value: Math.round(perKg * 100),
      minAmountMinor: Math.round(minINR * 100),
      rawLabel: cleanKey,
      rawValue: cleanVal,
      formulaDescription: `Higher of ₹${minINR} or ₹${perKg}/KG`,
      status: 'ACTIVE',
      isPostShipment: false
    };
  }

  // RTO
  if (lowerKey.includes('rto')) {
    return {
      id,
      code: 'RTO',
      name: 'Return to Origin (RTO)',
      calcType: 'PERCENTAGE',
      value: 100,
      rawLabel: cleanKey,
      rawValue: cleanVal,
      formulaDescription: 'Same as forward freight (100% forward base rate)',
      status: 'ACTIVE',
      isPostShipment: true
    };
  }

  // Demurrage
  if (lowerKey.includes('demurrage')) {
    const kgDayMatch = cleanVal.match(/(\d+(?:\.\d+)?)\s*(?:\/day\/kg|\/kg\/day)/i);
    const minDayMatch = cleanVal.match(/minimum\s*(?:inr|rs\.?)\s*(\d+(?:\.\d+)?)/i) || cleanVal.match(/min\s*(?:inr|rs\.?)\s*(\d+(?:\.\d+)?)/i);
    const ratePerDayKg = kgDayMatch ? parseFloat(kgDayMatch[1]) : 1.5;
    const minPerDay = minDayMatch ? parseFloat(minDayMatch[1]) : 100;

    return {
      id,
      code: 'DEMURRAGE',
      name: 'Hub Demurrage Holding Fee',
      calcType: 'PER_DAY_PER_KG',
      value: Math.round(ratePerDayKg * 100),
      minAmountMinor: Math.round(minPerDay * 100),
      rawLabel: cleanKey,
      rawValue: cleanVal,
      formulaDescription: `₹${ratePerDayKg}/day/kg, minimum ₹${minPerDay}/day/docket (post free days)`,
      status: 'ACTIVE',
      isPostShipment: true,
      condition: 'POST_FREE_STORAGE_DAYS'
    };
  }

  // Heavy Package Handling
  if (lowerKey.includes('handling') && (lowerKey.includes('100') || lowerKey.includes('single box'))) {
    const kgMatch = cleanVal.match(/(\d+(?:\.\d+)?)\s*\/\s*kg/i);
    const minMatch = cleanVal.match(/minimum\s*(?:inr|rs\.?)\s*(\d+(?:\.\d+)?)/i);
    const perKg = kgMatch ? parseFloat(kgMatch[1]) : 1.15;
    const minINR = minMatch ? parseFloat(minMatch[1]) : 200;

    return {
      id,
      code: 'HEAVY_HANDLING',
      name: 'Heavy Package Handling (>100 KG Box)',
      calcType: 'HIGHER_OF_MIN_OR_VARIABLE',
      value: Math.round(perKg * 100),
      minAmountMinor: Math.round(minINR * 100),
      rawLabel: cleanKey,
      rawValue: cleanVal,
      formulaDescription: `₹${perKg}/kg, minimum ₹${minINR} (for single box > 100 KG)`,
      status: 'ACTIVE',
      isPostShipment: false,
      condition: 'SINGLE_BOX_EXCEEDS_100KG'
    };
  }

  // Package Handling Per Box
  if (lowerKey.includes('additional handling') || lowerKey.includes('per package')) {
    const match = cleanVal.match(/(?:inr|rs\.?)\s*(\d+(?:\.\d+)?)/i);
    const inr = match ? parseFloat(match[1]) : 50;
    return {
      id,
      code: 'HANDLING_PER_BOX',
      name: 'Package Handling Surcharge',
      calcType: 'PER_BOX',
      value: Math.round(inr * 100),
      rawLabel: cleanKey,
      rawValue: cleanVal,
      formulaDescription: `₹${inr} per physical package`,
      status: 'ACTIVE',
      isPostShipment: false
    };
  }

  // Over Maximum / Large Package Surcharge
  if (lowerKey.includes('over maximum') || lowerKey.includes('large package') || lowerKey.includes('lps')) {
    const match = cleanVal.match(/(?:inr|rs\.?)\s*(\d+(?:\.\d+)?)/i);
    const inr = match ? parseFloat(match[1]) : 500;
    return {
      id,
      code: 'LPS',
      name: 'Large Package / Over Max Surcharge',
      calcType: 'FIXED',
      value: Math.round(inr * 100),
      rawLabel: cleanKey,
      rawValue: cleanVal,
      formulaDescription: `₹${inr} per oversize package`,
      status: 'ACTIVE',
      isPostShipment: false
    };
  }

  // Green Tax
  if (lowerKey.includes('green tax') || lowerKey.includes('green')) {
    const match = cleanVal.match(/(?:inr|rs\.?)\s*(\d+(?:\.\d+)?)/i);
    const inr = match ? parseFloat(match[1]) : 75;
    return {
      id,
      code: 'GREEN_TAX',
      name: 'Green Tax / Environmental Cess',
      calcType: 'FIXED',
      value: Math.round(inr * 100),
      rawLabel: cleanKey,
      rawValue: cleanVal,
      formulaDescription: `Flat ₹${inr} per docket`,
      status: 'ACTIVE',
      isPostShipment: false
    };
  }

  // Address Correction
  if (lowerKey.includes('address correction')) {
    const match = cleanVal.match(/(?:inr|rs\.?)\s*(\d+(?:\.\d+)?)/i);
    const inr = match ? parseFloat(match[1]) : 300;
    return {
      id,
      code: 'ADDRESS_CORRECTION',
      name: 'Address Correction Fee',
      calcType: 'FIXED',
      value: Math.round(inr * 100),
      rawLabel: cleanKey,
      rawValue: cleanVal,
      formulaDescription: `₹${inr} per corrected shipment`,
      status: 'ACTIVE',
      isPostShipment: true
    };
  }

  // Return Label
  if (lowerKey.includes('return label')) {
    const match = cleanVal.match(/(?:inr|rs\.?)\s*(\d+(?:\.\d+)?)/i);
    const inr = match ? parseFloat(match[1]) : 150;
    return {
      id,
      code: 'RETURN_LABEL',
      name: 'Return Label Printing',
      calcType: 'FIXED',
      value: Math.round(inr * 100),
      rawLabel: cleanKey,
      rawValue: cleanVal,
      formulaDescription: `₹${inr} per label`,
      status: 'ACTIVE',
      isPostShipment: true
    };
  }

  // Undeliverable Handling
  if (lowerKey.includes('undeliverable')) {
    const match = cleanVal.match(/(?:inr|rs\.?)\s*(\d+(?:\.\d+)?)/i);
    const inr = match ? parseFloat(match[1]) : 600;
    return {
      id,
      code: 'UNDELIVERABLE_HANDLING',
      name: 'Undeliverable Special Handling',
      calcType: 'FIXED',
      value: Math.round(inr * 100),
      rawLabel: cleanKey,
      rawValue: cleanVal,
      formulaDescription: `₹${inr} per undeliverable shipment`,
      status: 'ACTIVE',
      isPostShipment: true
    };
  }

  const genericNum = cleanVal.match(/(\d+(?:\.\d+)?)/);
  const fallbackVal = genericNum ? parseFloat(genericNum[1]) : 0;
  const isPct = cleanVal.includes('%');

  return {
    id,
    code: cleanKey.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20) || 'CUSTOM_FEE',
    name: cleanKey,
    calcType: isPct ? 'PERCENTAGE' : 'FIXED',
    value: isPct ? fallbackVal : Math.round(fallbackVal * 100),
    rawLabel: cleanKey,
    rawValue: cleanVal,
    formulaDescription: cleanVal,
    status: 'ACTIVE',
    needsReview: true,
    isPostShipment: false
  };
}

export function parseWorksheet(sheet: XLSX.WorkSheet, sheetName: string): ParsedSheetRateCard {
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const warnings: string[] = [];

  let detectedCourier = normalizeCourierId(sheetName);
  let explicitCourierInCells = '';

  for (const row of rawRows) {
    for (let c = 0; c < row.length - 1; c++) {
      const cellStr = String(row[c] || '').trim().toLowerCase();
      if (cellStr === 'courier' && row[c + 1]) {
        explicitCourierInCells = String(row[c + 1]).trim();
        detectedCourier = normalizeCourierId(explicitCourierInCells);
        break;
      }
    }
    if (explicitCourierInCells) break;
  }

  let headerRowIdx = -1;
  let originColIdx = -1;
  const destZones: Array<{ code: string; colIdx: number }> = [];

  for (let r = 0; r < Math.min(10, rawRows.length); r++) {
    const row = rawRows[r] || [];
    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c] || '').trim();
      const cellLower = cellVal.toLowerCase();

      if (
        cellLower.includes('origin \\ dest') ||
        cellLower.includes('origin/dest') ||
        cellLower.includes('from/to') ||
        cellLower.includes('from \\ to')
      ) {
        headerRowIdx = r;
        originColIdx = c;

        for (let nextC = c + 1; nextC < row.length; nextC++) {
          const zoneCand = String(row[nextC] || '').trim().toUpperCase();
          if (/^[A-Z]{1,3}\d?$/.test(zoneCand)) {
            destZones.push({ code: zoneCand, colIdx: nextC });
          } else if (zoneCand === '') {
            if (destZones.length > 0) break;
          }
        }
        break;
      }
    }
    if (headerRowIdx !== -1) break;
  }

  if (headerRowIdx === -1 || destZones.length === 0) {
    warnings.push(`Could not identify zone matrix header in sheet "${sheetName}".`);
  }

  const zoneMatrix: Record<string, Record<string, number>> = {};
  const originZonesSet = new Set<string>();
  let ratesParsedCount = 0;

  if (headerRowIdx !== -1 && destZones.length > 0) {
    for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r] || [];
      const originCell = String(row[originColIdx] || '').trim().toUpperCase();

      if (/^[A-Z]{1,3}\d?$/.test(originCell)) {
        originZonesSet.add(originCell);
        if (!zoneMatrix[originCell]) {
          zoneMatrix[originCell] = {};
        }

        for (const dz of destZones) {
          const rawPrice = row[dz.colIdx];
          const numPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice || '').trim());

          if (!isNaN(numPrice) && numPrice > 0) {
            zoneMatrix[originCell][dz.code] = Math.round(numPrice * 100);
            ratesParsedCount++;
          } else {
            warnings.push(`Missing or non-numeric rate for route ${originCell} → ${dz.code} (Row ${r + 1}, Col ${dz.colIdx + 1}).`);
          }
        }
      } else if (originCell.toLowerCase().includes('zone') && String(row[originColIdx + 1] || '').toLowerCase().includes('coverage')) {
        break;
      }
    }
  }

  const originZonesList = Array.from(originZonesSet);
  const destZonesList = destZones.map((d) => d.code);

  let volumetricDivisor = 4500;
  let minChargeableWeightGrams = 20000;
  let minFreightChargeMinor = 0;
  let fuelSurchargePercent = 13.5;
  let docketChargeMinor = 6500;
  const rawChargePairs: Array<{ key: string; value: string }> = [];
  const parsedSurcharges: ParsedChargeRule[] = [];

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r] || [];
    for (let c = 0; c < row.length - 1; c++) {
      const cellA = String(row[c] || '').trim();
      const cellB = String(row[c + 1] || '').trim();

      if (!cellA || !cellB) continue;

      const lowerA = cellA.toLowerCase();

      const isChargeKeyword =
        lowerA.includes('docket') ||
        lowerA.includes('fuel') ||
        lowerA.includes('fsc') ||
        lowerA.includes('fov') ||
        lowerA.includes('freight on value') ||
        lowerA.includes("owner's risk") ||
        lowerA.includes('volumetric') ||
        lowerA.includes('volume weight') ||
        lowerA.includes('minimum chargeable') ||
        lowerA.includes('minimum billable') ||
        lowerA.includes('minimum shipment') ||
        lowerA.includes('min freight') ||
        lowerA.includes('oda') ||
        lowerA.includes('appointment') ||
        lowerA.includes('abd') ||
        lowerA.includes('reattempt') ||
        lowerA.includes('mall') ||
        lowerA.includes('demurrage') ||
        lowerA.includes('handling') ||
        lowerA.includes('green tax') ||
        lowerA.includes('cod') ||
        lowerA.includes('address correction') ||
        lowerA.includes('return label') ||
        lowerA.includes('undeliverable') ||
        lowerA.includes('large package') ||
        lowerA.includes('lps') ||
        lowerA.includes('maximum liability');

      if (isChargeKeyword) {
        rawChargePairs.push({ key: cellA, value: cellB });

        if (lowerA.includes('volumetric') || lowerA.includes('volume weight')) {
          const divMatch = cellB.match(/(\d{4})/);
          if (divMatch) volumetricDivisor = parseInt(divMatch[1], 10);
        } else if (lowerA.includes('minimum chargeable') || lowerA.includes('minimum billable')) {
          const wtMatch = cellB.match(/(\d+(?:\.\d+)?)\s*kg/i);
          if (wtMatch) minChargeableWeightGrams = Math.round(parseFloat(wtMatch[1]) * 1000);
        } else if (lowerA.includes('minimum shipment') || lowerA.includes('min freight')) {
          const minFreightMatch = cellB.match(/(?:inr|rs\.?)\s*(\d+(?:\.\d+)?)/i);
          if (minFreightMatch) minFreightChargeMinor = Math.round(parseFloat(minFreightMatch[1]) * 100);
        } else if (lowerA.includes('docket')) {
          const docketMatch = cellB.match(/(\d+(?:\.\d+)?)/);
          if (docketMatch) docketChargeMinor = Math.round(parseFloat(docketMatch[1]) * 100);
          parsedSurcharges.push(parseChargeRule(cellA, cellB));
        } else if (lowerA.includes('fuel') || lowerA.includes('fsc')) {
          const fscMatch = cellB.match(/(\d+(?:\.\d+)?)\s*%/);
          if (fscMatch) fuelSurchargePercent = parseFloat(fscMatch[1]);
          parsedSurcharges.push(parseChargeRule(cellA, cellB));
        } else {
          parsedSurcharges.push(parseChargeRule(cellA, cellB));
        }
      }
    }
  }

  const zoneCoverage: Record<string, string> = {};
  let coverageStartIdx = -1;
  let zoneCol = -1;
  let coverageCol = -1;

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r] || [];
    for (let c = 0; c < row.length - 1; c++) {
      const a = String(row[c] || '').trim().toLowerCase();
      const b = String(row[c + 1] || '').trim().toLowerCase();
      if (a === 'zone' && b === 'coverage') {
        coverageStartIdx = r + 1;
        zoneCol = c;
        coverageCol = c + 1;
        break;
      }
    }
    if (coverageStartIdx !== -1) break;
  }

  if (coverageStartIdx !== -1) {
    for (let r = coverageStartIdx; r < rawRows.length; r++) {
      const row = rawRows[r] || [];
      const z = String(row[zoneCol] || '').trim().toUpperCase();
      const cov = String(row[coverageCol] || '').trim();
      if (/^[A-Z]{1,3}\d?$/.test(z) && cov) {
        zoneCoverage[z] = cov;
      }
    }
  }

  return {
    sheetName,
    courierId: detectedCourier.id,
    courierName: detectedCourier.name,
    serviceName: detectedCourier.service,
    originZones: originZonesList,
    destinationZones: destZonesList,
    zoneMatrix,
    volumetricDivisor,
    minChargeableWeightGrams,
    minFreightChargeMinor,
    weightRoundingRule: 'ROUND_UP_1KG',
    fuelSurchargePercent,
    docketChargeMinor,
    gstPercent: 18.0,
    surcharges: parsedSurcharges,
    zoneCoverage,
    rawChargePairs,
    totalRatesParsed: ratesParsedCount,
    warnings,
    needsManualReview: warnings.length > 0 || parsedSurcharges.some((s) => s.needsReview),
    status: 'DRAFT',
  };
}

export function parseExcelWorkbook(fileData: ArrayBuffer | Uint8Array, fileName: string): WorkbookParseResult {
  const wb = XLSX.read(fileData, { type: 'array' });
  const sheets: ParsedSheetRateCard[] = [];
  const globalWarnings: string[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    try {
      const parsed = parseWorksheet(ws, sheetName);
      if (parsed.totalRatesParsed > 0 || parsed.originZones.length > 0) {
        sheets.push(parsed);
      }
    } catch (err: any) {
      globalWarnings.push(`Failed to parse worksheet "${sheetName}": ${err.message || String(err)}`);
    }
  }

  if (sheets.length === 0) {
    globalWarnings.push('No valid commercial rate matrices found in the uploaded workbook.');
  }

  return {
    fileName,
    sheets,
    totalSheetsCount: wb.SheetNames.length,
    parsedSheetsCount: sheets.length,
    globalWarnings,
  };
}
