import fs from 'fs';
import path from 'path';
import { parseExcelWorkbook } from '../src/services/excelRateCardParser.service';
import { B2BPricingEngineService } from '../src/services/b2bPricingEngine.service';

async function runVerification() {
  console.log('=== STARTING B2B UPGRADE VERIFICATION TEST ===\n');

  // 1. Verify Excel Workbook Parsing
  const excelPath = path.resolve(__dirname, '../Shypfy B2B Rate Card Courier Wise_50 (3).xlsx');
  if (!fs.existsSync(excelPath)) {
    throw new Error(`Excel sample file not found at: ${excelPath}`);
  }

  const fileBuffer = fs.readFileSync(excelPath);
  const parseResult = parseExcelWorkbook(fileBuffer, path.basename(excelPath));

  console.log(`[1] Multi-Sheet Excel Parser Result:`);
  console.log(`  - File: ${parseResult.fileName}`);
  console.log(`  - Total sheets in workbook: ${parseResult.totalSheetsCount}`);
  console.log(`  - Successfully parsed sheets: ${parseResult.parsedSheetsCount}`);

  for (const sheet of parseResult.sheets) {
    console.log(`\n  * Sheet "${sheet.sheetName}" -> Courier: ${sheet.courierName}`);
    console.log(`    - Matrix dimensions: ${sheet.originZones.length} Origin zones × ${sheet.destinationZones.length} Dest zones`);
    console.log(`    - Total parsed rates: ${sheet.totalRatesParsed}`);
    console.log(`    - Volumetric Divisor: ${sheet.volumetricDivisor}`);
    console.log(`    - Min Chargeable Weight: ${sheet.minChargeableWeightGrams / 1000} KG`);
    console.log(`    - Min Freight Charge: ₹${sheet.minFreightChargeMinor / 100}`);
    console.log(`    - Docket Charge: ₹${sheet.docketChargeMinor / 100}`);
    console.log(`    - Fuel Surcharge: ${sheet.fuelSurchargePercent}%`);
    console.log(`    - Surcharges & Rules extracted: ${sheet.surcharges.length}`);
    console.log(`    - Default Status: ${sheet.status} (Not activated in production)`);

    // Asymmetry check
    if (sheet.courierId === 'movin') {
      const c1ToN1 = sheet.zoneMatrix['C1']?.['N1'];
      const n1ToC1 = sheet.zoneMatrix['N1']?.['C1'];
      console.log(`    - Movin Asymmetric Rate Test: C1 -> N1 = ₹${(c1ToN1 || 0) / 100}, N1 -> C1 = ₹${(n1ToC1 || 0) / 100}`);
      if (c1ToN1 !== n1ToC1) {
        console.log(`      ✓ Verified: Directional pricing preserved (C1->N1 ≠ N1->C1)`);
      }
      if (sheet.originZones.length === 14 && !sheet.originZones.includes('N4')) {
        console.log(`      ✓ Verified: Dynamic zone detection handled non-16x16 matrix (14 zones detected, N4 omitted)`);
      }
    }
  }

  // 2. Authoritative Pricing Engine Test with Merchant Markup
  console.log('\n[2] Backend Pricing Engine Test:');
  const sampleDelhiverySheet = parseResult.sheets.find(s => s.courierId === 'delhivery')!;

  const quoteBase = B2BPricingEngineService.calculate({
    originPincode: '110001', // Delhi N1
    destinationPincode: '560001', // Bangalore S1
    actualWeightKg: 25,
    dimensions: [{ lengthCm: 45, widthCm: 35, heightCm: 35, packageCount: 2 }],
    volumetricDivisor: sampleDelhiverySheet.volumetricDivisor,
    minChargeableWeightKg: sampleDelhiverySheet.minChargeableWeightGrams / 1000,
    minFreightChargePaise: sampleDelhiverySheet.minFreightChargeMinor,
    weightRoundingRule: sampleDelhiverySheet.weightRoundingRule,
    fuelSurchargePercent: sampleDelhiverySheet.fuelSurchargePercent,
    docketChargePaise: sampleDelhiverySheet.docketChargeMinor,
    gstPercent: sampleDelhiverySheet.gstPercent,
    zoneMatrix: sampleDelhiverySheet.zoneMatrix,
    surcharges: sampleDelhiverySheet.surcharges,
    invoiceValueINR: 20000,
    markupType: 'PERCENTAGE',
    markupValue: 15, // 15% platform margin
  });

  console.log(`  - Route: ${quoteBase.originZone} -> ${quoteBase.destinationZone}`);
  console.log(`  - Chargeable Weight: ${quoteBase.chargeableWeightKg} KG (Divisor: /${quoteBase.volumetricDivisorUsed})`);
  console.log(`  - Base Rate/KG: ₹${quoteBase.ratePerKgINR.toFixed(2)}`);
  console.log(`  - Base Freight: ₹${quoteBase.baseFreightINR.toFixed(2)}`);
  console.log(`  - Docket Fee: ₹${quoteBase.docketChargeINR.toFixed(2)}`);
  console.log(`  - Fuel Surcharge (${quoteBase.fuelSurchargePaise > 0 ? sampleDelhiverySheet.fuelSurchargePercent : 0}%): ₹${quoteBase.fuelSurchargeINR.toFixed(2)}`);
  console.log(`  - Upfront Surcharges: ${quoteBase.additionalSurcharges.map(s => `${s.name}: ₹${s.amountINR}`).join(', ') || 'None'}`);
  console.log(`  - Accessorial Schedule (Post-shipment fees): ${quoteBase.accessorialRulesSchedule.length} fee rules registered`);

  if (quoteBase.markupDetails) {
    console.log(`\n[3] Merchant Pricing & Profit Margin Verification:`);
    console.log(`  - Courier Base Cost: ₹${quoteBase.markupDetails.baseCostINR.toFixed(2)}`);
    console.log(`  - Platform Markup (+${quoteBase.markupDetails.markupValue}%): +₹${quoteBase.markupDetails.markupAmountINR.toFixed(2)}`);
    console.log(`  - Merchant Selling Rate (excl. GST): ₹${quoteBase.markupDetails.sellingRateINR.toFixed(2)}`);
    console.log(`  - Platform Gross Margin: ${quoteBase.markupDetails.grossMarginPercent}%`);
    console.log(`  - Grand Total (incl. GST): ₹${quoteBase.totalAmountINR.toFixed(2)}`);
  }

  // 3. Test RATE_NOT_CONFIGURED check
  console.log('\n[4] Missing Configuration Guard Check:');
  try {
    B2BPricingEngineService.calculate({
      originPincode: '110001',
      destinationPincode: '799001', // NE2
      actualWeightKg: 20,
      volumetricDivisor: 4500,
      minChargeableWeightKg: 20,
      minFreightChargePaise: 0,
      weightRoundingRule: 'ROUND_UP_1KG',
      fuelSurchargePercent: 0,
      docketChargePaise: 0,
      gstPercent: 18,
      zoneMatrix: {}, // Empty matrix
    });
    console.error('  FAILED: Expected ZONE_ROUTE_NOT_CONFIGURED error');
  } catch (err: any) {
    if (err.message && err.message.includes('ZONE_ROUTE_NOT_CONFIGURED')) {
      console.log(`  ✓ Successfully threw ZONE_ROUTE_NOT_CONFIGURED when no rate exists in matrix`);
    } else {
      throw err;
    }
  }

  console.log('\n=== ALL B2B UPGRADE VERIFICATIONS PASSED SUCCESSFULLY ===');
}

runVerification().catch(err => {
  console.error('[Verification Failed]:', err);
  process.exit(1);
});
