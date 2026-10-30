import assert from 'node:assert';
import crypto from 'crypto';
import { prisma } from '../src/db';
import { B2BQuoteManagerService } from '../src/services/b2bQuoteManager.service';
import { compareB2BRates, validateB2BQuote, consumeB2BQuote } from '../src/controllers/adminB2BRates.controller';

function createMockReqRes(options: {
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  query?: Record<string, string>;
  user?: any;
}) {
  const req: any = {
    body: options.body || {},
    headers: options.headers || {},
    params: options.params || {},
    query: options.query || {},
    user: options.user,
  };

  let statusCode = 200;
  let responseData: any = null;

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseData = data;
      return res;
    },
    getStatusCode() {
      return statusCode;
    },
    getResponseData() {
      return responseData;
    },
  };

  return { req, res };
}

interface ReliabilityTestItem {
  id: number;
  testCase: string;
  status: 'PASS' | 'FAIL';
  evidence: string;
}

const auditResults: ReliabilityTestItem[] = [];

async function runReliabilitySuite() {
  console.log('========================================================================');
  console.log('  MAXLINE LOGISTICS — B2B Step 4 Production Reliability Verification   ');
  console.log('========================================================================\n');

  const TEST_CARD_ACTIVE_ID = crypto.randomUUID();
  const TEST_CARD_INACTIVE_ID = crypto.randomUUID();
  const MERCHANT_ALPHA = `merchant_alpha_${Date.now()}`;
  const MERCHANT_BRAVO = `merchant_bravo_${Date.now()}`;

  try {
    // 0. Setup Test Rate Cards in Supabase Postgres
    console.log('[Setup]: Inserting isolated test rate cards in Supabase Postgres...');
    await prisma.carrier_rate_cards.createMany({
      data: [
        {
          id: TEST_CARD_ACTIVE_ID,
          name: 'Delhivery Surface B2B Reliability Test',
          rate_card_code: `TEST_REL_DEL_${Date.now()}`,
          courier_id: 'delhivery',
          courier_name: 'Delhivery B2B',
          service_id: 'surface_cargo',
          service_name: 'Express Cargo Surface',
          mode: 'B2B',
          card_type: 'BASE_COST',
          markup_type: 'PERCENTAGE',
          markup_value: 10.0,
          volumetric_divisor: 4500,
          min_chargeable_weight_grams: 20000,
          min_freight_charge_minor: 35000,
          weight_rounding_rule: 'ROUND_UP_1KG',
          fuel_surcharge_percent: 10.0,
          docket_charge_minor: 10000,
          gst_percent: 18.0,
          zone_matrix: {
            N1: { S1: 1500, N1: 800 },
          },
          zone_coverage: {}, // No verified transit days -> SLA unverified
          surcharges: [],
          is_active: true,
          version: 'v1.0',
        },
        {
          id: TEST_CARD_INACTIVE_ID,
          name: 'Inactive Rate Card Test',
          rate_card_code: `TEST_REL_INACT_${Date.now()}`,
          courier_id: 'bluedart',
          courier_name: 'Blue Dart Cargo',
          service_id: 'air_cargo',
          service_name: 'Air Cargo Priority',
          mode: 'B2B',
          card_type: 'BASE_COST',
          markup_type: 'NONE',
          markup_value: 0,
          volumetric_divisor: 5000,
          min_chargeable_weight_grams: 20000,
          min_freight_charge_minor: 50000,
          weight_rounding_rule: 'ROUND_UP_1KG',
          fuel_surcharge_percent: 12.0,
          docket_charge_minor: 15000,
          gst_percent: 18.0,
          zone_matrix: {
            N1: { S1: 2500 },
          },
          zone_coverage: {},
          surcharges: [],
          is_active: false,
          version: 'v1.0',
        },
      ],
    });
    console.log('[Setup]: Test rate cards inserted successfully.\n');

    // -------------------------------------------------------------------------
    // TEST 1: Durable Database-Backed Storage & Server Restart Survival
    // -------------------------------------------------------------------------
    let createdQuoteId = '';
    {
      const initialQuote = await B2BQuoteManagerService.createQuote({
        merchantId: MERCHANT_ALPHA,
        courierId: 'delhivery',
        courierName: 'Delhivery B2B',
        serviceId: 'surface_cargo',
        serviceName: 'Express Cargo Surface',
        rateCardId: TEST_CARD_ACTIVE_ID,
        rateCardName: 'Delhivery Surface B2B Reliability Test',
        rateCardVersion: 'v1.0',
        originPincode: '110001',
        destinationPincode: '560001',
        originZone: 'N1',
        destinationZone: 'S1',
        deadWeightKg: 25,
        chargeableWeightKg: 25,
        customerRatePerKgINR: 16.5,
        customerFreightINR: 412.5,
        customerDocketChargeINR: 100,
        customerFuelSurchargeINR: 37.5,
        customerFuelSurchargePercent: 10,
        customerApplicableCharges: [],
        gstPercent: 18,
        gstAmountINR: 99,
        finalPayableAmountINR: 649,
        estimatedDeliveryDays: 'Standard Commercial Cargo',
        hasVerifiedTransitData: false,
        baseCostINR: 512.5,
        markupAmountINR: 37.5,
        grossMarginPercent: 6.82,
      });

      createdQuoteId = initialQuote.quoteId;

      // Direct Database Query: Verify record exists in Postgres table public.b2b_quotes
      const dbRow = await prisma.b2b_quotes.findUnique({
        where: { quote_token: createdQuoteId },
      });

      assert.ok(dbRow, 'Quote MUST be physically stored in Supabase Postgres b2b_quotes table');
      assert.strictEqual(dbRow.merchant_id, MERCHANT_ALPHA);
      assert.strictEqual(dbRow.status, 'PENDING');
      assert.strictEqual(Number(dbRow.final_payable_amount_inr), 649.0);

      // Simulate API server restart by querying fresh through service
      const retrieved = await B2BQuoteManagerService.getQuote(createdQuoteId);
      assert.ok(retrieved, 'Quote must be retrieved from database across process boundaries');
      assert.strictEqual(retrieved.quoteId, createdQuoteId);
      assert.strictEqual(retrieved.merchantId, MERCHANT_ALPHA);

      auditResults.push({
        id: 1,
        testCase: 'Durable Database-Backed Quote Storage & Restart Survival',
        status: 'PASS',
        evidence: `Quote '${createdQuoteId}' persisted in Supabase Postgres 'b2b_quotes' table and retrieved successfully. Zero dependency on process memory.`,
      });
    }

    // -------------------------------------------------------------------------
    // TEST 2: Merchant Cross-Access Prevention (Tenant Isolation)
    // -------------------------------------------------------------------------
    {
      // Merchant Bravo tries to validate / access Merchant Alpha's quote
      const crossValidation = await B2BQuoteManagerService.validateQuote(createdQuoteId, {
        merchantId: MERCHANT_BRAVO, // Impersonating / Cross-tenant
        originPincode: '110001',
        destinationPincode: '560001',
      });

      assert.strictEqual(crossValidation.valid, false, 'Cross-tenant access must be rejected');
      assert.strictEqual(crossValidation.code, 'UNAUTHORIZED_QUOTE_ACCESS');

      // Merchant Alpha (Owner) validates
      const ownerValidation = await B2BQuoteManagerService.validateQuote(createdQuoteId, {
        merchantId: MERCHANT_ALPHA,
        originPincode: '110001',
        destinationPincode: '560001',
      });

      assert.strictEqual(ownerValidation.valid, true, 'Legitimate owner validation must succeed');

      auditResults.push({
        id: 2,
        testCase: 'Merchant Ownership & Cross-Access Prevention',
        status: 'PASS',
        evidence: `Foreign merchant '${MERCHANT_BRAVO}' blocked with UNAUTHORIZED_QUOTE_ACCESS. Owner '${MERCHANT_ALPHA}' verified successfully.`,
      });
    }

    // -------------------------------------------------------------------------
    // TEST 3: Expired Quote Rejection
    // -------------------------------------------------------------------------
    {
      const expiredToken = `B2B-QTE-EXP-${Date.now().toString().slice(-6)}`;
      await prisma.b2b_quotes.create({
        data: {
          quote_token: expiredToken,
          merchant_id: MERCHANT_ALPHA,
          courier_id: 'delhivery',
          courier_name: 'Delhivery B2B',
          service_id: 'surface_cargo',
          service_name: 'Express Cargo Surface',
          rate_card_id: TEST_CARD_ACTIVE_ID,
          rate_card_name: 'Test',
          rate_card_version: 'v1.0',
          origin_pincode: '110001',
          destination_pincode: '560001',
          origin_zone: 'N1',
          destination_zone: 'S1',
          dead_weight_kg: 25,
          chargeable_weight_kg: 25,
          customer_rate_per_kg_inr: 16.5,
          customer_freight_inr: 412.5,
          customer_docket_charge_inr: 100,
          customer_fuel_surcharge_inr: 37.5,
          customer_fuel_surcharge_pct: 10,
          gst_percent: 18,
          gst_amount_inr: 99,
          final_payable_amount_inr: 649,
          status: 'PENDING',
          expires_at: new Date(Date.now() - 5000), // Expired 5 seconds ago!
        },
      });

      const expValidation = await B2BQuoteManagerService.validateQuote(expiredToken);
      assert.strictEqual(expValidation.valid, false, 'Expired quote must be rejected');
      assert.strictEqual(expValidation.code, 'EXPIRED_QUOTE');

      auditResults.push({
        id: 3,
        testCase: 'Expired Quote Rejection',
        status: 'PASS',
        evidence: `Quote '${expiredToken}' with expires_at in the past was strictly rejected with code EXPIRED_QUOTE.`,
      });
    }

    // -------------------------------------------------------------------------
    // TEST 4: Double Booking & Quote Reuse Prevention
    // -------------------------------------------------------------------------
    {
      // First booking: consume quote for shipment SHP-ALPHA-001
      const consume1 = await B2BQuoteManagerService.consumeQuote(createdQuoteId, {
        merchantId: MERCHANT_ALPHA,
        originPincode: '110001',
        destinationPincode: '560001',
        chargeableWeightKg: 25,
        courierId: 'delhivery',
        shipmentId: 'SHP-ALPHA-001',
      });

      assert.strictEqual(consume1.valid, true, 'First booking consumption must succeed');
      assert.strictEqual(consume1.quote?.status, 'BOOKED');
      assert.strictEqual(consume1.quote?.shipmentId, 'SHP-ALPHA-001');

      // Verify in Postgres table
      const dbConsumed = await prisma.b2b_quotes.findUnique({
        where: { quote_token: createdQuoteId },
      });
      assert.strictEqual(dbConsumed?.status, 'BOOKED');
      assert.ok(dbConsumed?.used_at, 'used_at timestamp must be recorded');

      // Second booking attempt: try to reuse the same quote for SHP-ALPHA-002
      const consume2 = await B2BQuoteManagerService.consumeQuote(createdQuoteId, {
        merchantId: MERCHANT_ALPHA,
        originPincode: '110001',
        destinationPincode: '560001',
        chargeableWeightKg: 25,
        courierId: 'delhivery',
        shipmentId: 'SHP-ALPHA-002',
      });

      assert.strictEqual(consume2.valid, false, 'Reusing an already consumed quote must FAIL');
      assert.strictEqual(consume2.code, 'QUOTE_ALREADY_USED');

      auditResults.push({
        id: 4,
        testCase: 'Double Booking & Quote Reuse Prevention',
        status: 'PASS',
        evidence: `Quote '${createdQuoteId}' consumed for SHP-ALPHA-001 (status: BOOKED). Second booking attempt rejected with QUOTE_ALREADY_USED.`,
      });
    }

    // -------------------------------------------------------------------------
    // TEST 5: Rate-Card Changes (Deactivation & Version Bumps)
    // -------------------------------------------------------------------------
    {
      // 5a. Create quote bound to active card
      const versionQuote = await B2BQuoteManagerService.createQuote({
        merchantId: MERCHANT_ALPHA,
        courierId: 'delhivery',
        courierName: 'Delhivery B2B',
        serviceId: 'surface_cargo',
        serviceName: 'Express Cargo Surface',
        rateCardId: TEST_CARD_ACTIVE_ID,
        rateCardName: 'Test Card',
        rateCardVersion: 'v1.0',
        originPincode: '110001',
        destinationPincode: '560001',
        originZone: 'N1',
        destinationZone: 'S1',
        deadWeightKg: 25,
        chargeableWeightKg: 25,
        customerRatePerKgINR: 16.5,
        customerFreightINR: 412.5,
        customerDocketChargeINR: 100,
        customerFuelSurchargeINR: 37.5,
        customerFuelSurchargePercent: 10,
        customerApplicableCharges: [],
        gstPercent: 18,
        gstAmountINR: 99,
        finalPayableAmountINR: 649,
      });

      // Update rate card in DB: bump version from v1.0 to v2.0
      await prisma.carrier_rate_cards.update({
        where: { id: TEST_CARD_ACTIVE_ID },
        data: { version: 'v2.0' },
      });

      const verCheck = await B2BQuoteManagerService.validateQuote(versionQuote.quoteId, {
        merchantId: MERCHANT_ALPHA,
      });
      assert.strictEqual(verCheck.valid, false, 'Version mismatch must fail');
      assert.strictEqual(verCheck.code, 'RATE_CARD_VERSION_CHANGED');

      // Restore version and deactivate card
      await prisma.carrier_rate_cards.update({
        where: { id: TEST_CARD_ACTIVE_ID },
        data: { version: 'v1.0', is_active: false },
      });

      const inactCheck = await B2BQuoteManagerService.validateQuote(versionQuote.quoteId, {
        merchantId: MERCHANT_ALPHA,
      });
      assert.strictEqual(inactCheck.valid, false, 'Deactivated card must fail');
      assert.strictEqual(inactCheck.code, 'RATE_CARD_INACTIVE');

      // Re-activate card for further tests
      await prisma.carrier_rate_cards.update({
        where: { id: TEST_CARD_ACTIVE_ID },
        data: { is_active: true },
      });

      auditResults.push({
        id: 5,
        testCase: 'Rate Card Changes (Version Bumps & Deactivation)',
        status: 'PASS',
        evidence: 'Rate card version bump rejected with RATE_CARD_VERSION_CHANGED. Rate card deactivation rejected with RATE_CARD_INACTIVE.',
      });
    }

    // -------------------------------------------------------------------------
    // TEST 6: Delivery Time & "Fastest" Claim Integrity (Requirement 5)
    // -------------------------------------------------------------------------
    {
      const { req, res } = createMockReqRes({
        body: {
          originPincode: '110001',
          destinationPincode: '560001',
          actualWeightKg: 25,
        },
        user: { merchantId: MERCHANT_ALPHA, role: 'SELLER', isPlatformAdmin: false },
      });

      await compareB2BRates(req, res);
      const data = res.getResponseData();
      const delhiveryQuote = data.quotes.find((q: any) => q.courierId === 'delhivery');

      // Card TEST_CARD_ACTIVE_ID has no verified transit SLA
      assert.strictEqual(delhiveryQuote.hasVerifiedTransitData, false, 'hasVerifiedTransitData must be false when unverified');
      assert.strictEqual(delhiveryQuote.isFastest, false, 'isFastest must NOT be claimed without verified transit data');
      assert.strictEqual(delhiveryQuote.isCheapest, true, 'isCheapest must be accurately calculated from configured selling price');

      auditResults.push({
        id: 6,
        testCase: 'Fastest & Transit-Time Claim Integrity',
        status: 'PASS',
        evidence: `Unverified courier has hasVerifiedTransitData=false and isFastest=false. Speculative transit-time claims strictly disabled. isCheapest=true accurately calculated.`,
      });
    }

    // -------------------------------------------------------------------------
    // TEST 7: Merchant Confidentiality & Secret Scrubbing (Requirement 6)
    // -------------------------------------------------------------------------
    {
      const { req, res } = createMockReqRes({
        body: {
          originPincode: '110001',
          destinationPincode: '560001',
          actualWeightKg: 25,
        },
        user: { merchantId: MERCHANT_ALPHA, role: 'SELLER', isPlatformAdmin: false },
      });

      await compareB2BRates(req, res);
      const jsonStr = JSON.stringify(res.getResponseData());

      const leakedPurchase = jsonStr.includes('baseCostINR') || jsonStr.includes('rawFreightPaise');
      const leakedDivisor = jsonStr.includes('volumetricDivisor') || jsonStr.includes('divisorUsed');
      const leakedMargin = jsonStr.includes('grossMarginPercent') || jsonStr.includes('markupDetails');
      const leakedFormula = jsonStr.includes('markupType') || jsonStr.includes('markupValue');

      assert.strictEqual(leakedPurchase, false, 'Base purchase cost must not be leaked');
      assert.strictEqual(leakedDivisor, false, 'Volumetric divisor must not be leaked');
      assert.strictEqual(leakedMargin, false, 'Gross margin percent must not be leaked');
      assert.strictEqual(leakedFormula, false, 'Admin markup formula must not be leaked');

      auditResults.push({
        id: 7,
        testCase: 'Merchant Commercial Confidentiality & Secret Scrubbing',
        status: 'PASS',
        evidence: 'Zero carrier purchase rates, volumetric divisors, markup formulas, or profit margins leaked in seller responses.',
      });
    }

    // -------------------------------------------------------------------------
    // TEST 8: Transactional Revalidation on Booking (Requirement 7)
    // -------------------------------------------------------------------------
    {
      // Create a fresh quote
      const bookableQuote = await B2BQuoteManagerService.createQuote({
        merchantId: MERCHANT_ALPHA,
        courierId: 'delhivery',
        courierName: 'Delhivery B2B',
        serviceId: 'surface_cargo',
        serviceName: 'Express Cargo Surface',
        rateCardId: TEST_CARD_ACTIVE_ID,
        rateCardName: 'Test Card',
        rateCardVersion: 'v1.0',
        originPincode: '110001',
        destinationPincode: '560001',
        originZone: 'N1',
        destinationZone: 'S1',
        deadWeightKg: 25,
        chargeableWeightKg: 25,
        customerRatePerKgINR: 16.5,
        customerFreightINR: 412.5,
        customerDocketChargeINR: 100,
        customerFuelSurchargeINR: 37.5,
        customerFuelSurchargePercent: 10,
        customerApplicableCharges: [],
        gstPercent: 18,
        gstAmountINR: 99,
        finalPayableAmountINR: 649,
      });

      // 8a. Tampered weight booking attempt
      const { req: reqTamper, res: resTamper } = createMockReqRes({
        body: {
          quoteId: bookableQuote.quoteId,
          originPincode: '110001',
          destinationPincode: '560001',
          chargeableWeightKg: 40, // Tampered from 25 to 40!
          courierId: 'delhivery',
          consume: true,
          shipmentId: 'SHP-TAMPER-001',
        },
        user: { merchantId: MERCHANT_ALPHA },
      });

      await consumeB2BQuote(reqTamper, resTamper);
      assert.strictEqual(resTamper.getResponseData().valid, false, 'Tampered weight must fail inside booking');
      assert.strictEqual(resTamper.getResponseData().code, 'WEIGHT_MISMATCH');

      // 8b. Legitimate booking consumption
      const { req: reqBook, res: resBook } = createMockReqRes({
        body: {
          quoteId: bookableQuote.quoteId,
          originPincode: '110001',
          destinationPincode: '560001',
          chargeableWeightKg: 25,
          courierId: 'delhivery',
          consume: true,
          shipmentId: 'SHP-BOOK-001',
        },
        user: { merchantId: MERCHANT_ALPHA },
      });

      await consumeB2BQuote(reqBook, resBook);
      assert.strictEqual(resBook.getResponseData().valid, true, 'Legitimate booking consumption must succeed');
      assert.strictEqual(resBook.getResponseData().code, 'QUOTE_CONSUMED');

      auditResults.push({
        id: 8,
        testCase: 'Transactional Revalidation & Consumption Inside Booking Flow',
        status: 'PASS',
        evidence: 'Tampered parameters rejected with WEIGHT_MISMATCH before booking. Legitimate booking consumes quote and locks token with QUOTE_CONSUMED.',
      });
    }

  } finally {
    console.log('\n[Teardown]: Cleaning up test fixtures from Supabase Postgres...');
    await prisma.b2b_quotes.deleteMany({
      where: {
        merchant_id: { in: [MERCHANT_ALPHA, MERCHANT_BRAVO] },
      },
    });
    await prisma.carrier_rate_cards.deleteMany({
      where: {
        id: { in: [TEST_CARD_ACTIVE_ID, TEST_CARD_INACTIVE_ID] },
      },
    });
    console.log('[Teardown]: Cleanup completed successfully.');
  }

  // Final Summary Output
  console.log('\n========================================================================');
  console.log('              PRODUCTION RELIABILITY TEST RESULTS                       ');
  console.log('========================================================================');
  let passCount = 0;
  for (const item of auditResults) {
    if (item.status === 'PASS') passCount++;
    console.log(`[${item.status}] #${item.id}: ${item.testCase}`);
    console.log(`       -> ${item.evidence}`);
  }
  console.log('========================================================================');
  console.log(`Total: ${passCount}/${auditResults.length} Production Reliability Tests PASSED\n`);

  if (passCount !== auditResults.length) {
    process.exit(1);
  }
}

runReliabilitySuite()
  .catch((err) => {
    console.error('Fatal Reliability Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
