import * as fs from 'fs';
import * as path from 'path';
import { parseExcelWorkbook } from '../src/services/excelRateCardParser.service';

function runParserTest() {
  const filePath = path.resolve('Shypfy B2B Rate Card Courier Wise_50 (3).xlsx');
  console.log('Testing Excel parser on:', filePath);

  const buffer = fs.readFileSync(filePath);
  const result = parseExcelWorkbook(buffer, 'Shypfy B2B Rate Card Courier Wise_50 (3).xlsx');

  console.log(`Parsed ${result.parsedSheetsCount} of ${result.totalSheetsCount} sheets.`);

  for (const s of result.sheets) {
    console.log(`\n================================`);
    console.log(`Sheet: ${s.sheetName}`);
    console.log(`Courier: ${s.courierName} (${s.courierId})`);
    console.log(`Service: ${s.serviceName}`);
    console.log(`Origin Zones (${s.originZones.length}):`, s.originZones.join(', '));
    console.log(`Dest Zones (${s.destinationZones.length}):`, s.destinationZones.join(', '));
    console.log(`Total Rates: ${s.totalRatesParsed}`);
    console.log(`Volumetric Divisor: ${s.volumetricDivisor}`);
    console.log(`Min Weight: ${s.minChargeableWeightGrams / 1000} KG`);
    console.log(`Min Freight: ₹${s.minFreightChargeMinor / 100}`);
    console.log(`Fuel Surcharge: ${s.fuelSurchargePercent}%`);
    console.log(`Docket Fee: ₹${s.docketChargeMinor / 100}`);
    console.log(`Extracted Surcharges (${s.surcharges.length}):`);
    s.surcharges.slice(0, 5).forEach((sc) => {
      console.log(`  - [${sc.code}] ${sc.name} (${sc.calcType}): ${sc.formulaDescription}`);
    });
    console.log(`Zone Coverage entries: ${Object.keys(s.zoneCoverage).length}`);
    console.log(`Warnings (${s.warnings.length}):`, s.warnings);
    console.log(`Status: ${s.status}`);
  }

  // Specific assertions
  if (result.parsedSheetsCount !== 3) {
    throw new Error(`Expected 3 parsed sheets, got ${result.parsedSheetsCount}`);
  }

  const delhivery = result.sheets.find((s) => s.courierId === 'delhivery');
  if (!delhivery || delhivery.originZones.length !== 16 || delhivery.totalRatesParsed !== 256) {
    throw new Error('Delhivery parsing validation failed');
  }

  const ekart = result.sheets.find((s) => s.courierId === 'ekart');
  if (!ekart || ekart.fuelSurchargePercent !== 15 || ekart.totalRatesParsed !== 256) {
    throw new Error('Ekart parsing validation failed');
  }

  const movin = result.sheets.find((s) => s.courierId === 'movin');
  if (!movin || movin.destinationZones.length !== 14 || movin.totalRatesParsed !== 196) {
    throw new Error(`Movin parsing validation failed: dest zones=${movin?.destinationZones.length}, rates=${movin?.totalRatesParsed}`);
  }

  console.log('\n✓ ALL PARSER TESTS PASSED 100%!');
}

runParserTest();
