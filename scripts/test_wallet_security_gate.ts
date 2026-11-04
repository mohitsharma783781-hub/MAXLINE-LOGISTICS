import assert from 'node:assert';
import crypto from 'node:crypto';
import { PrismaClient } from '../apps/api/node_modules/@prisma/client';

const prisma = new PrismaClient();
process.env.INTERNAL_WALLET_GATEWAY_SECRET = '4199bebe019375701356c1466b560a9b3c93103ad6f33151ab08988e54d17907';

const debitWalletHandler = require('../api/debit-wallet.js');

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, durationMs: Date.now() - start });
    console.log(`  ✓ [PASS] ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err.message, durationMs: Date.now() - start });
    console.error(`  ✗ [FAIL] ${name} (${Date.now() - start}ms) - ${err.message}`);
  }
}

// Mock Request & Response helper for testing serverless API handler
function createMockReqRes(options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}) {
  const req = {
    method: options.method || 'POST',
    headers: options.headers || {},
    body: options.body || {},
  };

  let statusCode = 200;
  let responseData: any = null;
  const headersSet: Record<string, string> = {};

  const res = {
    statusCode,
    headers: headersSet,
    setHeader(k: string, v: string) {
      headersSet[k.toLowerCase()] = v;
    },
    status(code: number) {
      statusCode = code;
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      responseData = data;
      return this;
    },
    end() {
      return this;
    },
    get _statusCode() {
      return statusCode;
    },
    get _responseData() {
      return responseData;
    },
  };

  return { req, res };
}

async function main() {
  console.log('\n===============================================================');
  console.log('MAXLINE LOGISTICS — CRITICAL WALLET SECURITY & PERMISSIONS GATE');
  console.log('===============================================================\n');

  const merchantA = '11111111-aaaa-bbbb-cccc-111111111111';
  const merchantB = '22222222-aaaa-bbbb-cccc-222222222222';

  try {
    // Setup isolated test merchants A and B
    await prisma.$executeRawUnsafe(`
      INSERT INTO public.merchants (id, business_name, status)
      VALUES 
        ('${merchantA}', 'Merchant A Secure Test', 'ACTIVE'),
        ('${merchantB}', 'Merchant B Secure Test', 'ACTIVE')
      ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE';
    `);

    // Clean test wallets & transactions
    await prisma.$executeRawUnsafe(`DELETE FROM public.wallet_transactions WHERE merchant_id IN ('${merchantA}', '${merchantB}');`);
    await prisma.$executeRawUnsafe(`DELETE FROM public.wallets WHERE merchant_id IN ('${merchantA}', '${merchantB}');`);

    // Fund Merchant A with ₹500.00 (50,000 paise)
    await prisma.$executeRawUnsafe(`
      INSERT INTO public.wallets (merchant_id, currency, available_balance_minor, reserved_balance_minor, total_recharged_minor, total_spent_minor, low_balance_threshold_minor, status, version)
      VALUES ('${merchantA}', 'INR', 50000, 0, 50000, 0, 50000, 'ACTIVE', 1);
    `);

    // Fund Merchant B with ₹500.00 (50,000 paise)
    await prisma.$executeRawUnsafe(`
      INSERT INTO public.wallets (merchant_id, currency, available_balance_minor, reserved_balance_minor, total_recharged_minor, total_spent_minor, low_balance_threshold_minor, status, version)
      VALUES ('${merchantB}', 'INR', 50000, 0, 50000, 0, 50000, 'ACTIVE', 1);
    `);

    // 1. Direct Client Invocation by anon role is strictly blocked by PostgreSQL permissions
    await runTest('1. Direct client invocation of debit_wallet_rpc by anon blocked by PostgreSQL permission denial', async () => {
      try {
        await prisma.$executeRawUnsafe(`SET ROLE anon;`);
        await prisma.$queryRawUnsafe(`
          SELECT public.debit_wallet_rpc(
            '${merchantA}'::uuid,
            1000::bigint,
            'TEST'::text,
            'REF-1'::text,
            'idemp-direct-client-1'::text,
            'Direct hacker debit'::text
          );
        `);
        assert.fail('Should have been rejected with permission denial');
      } catch (err: any) {
        assert(
          err.message.includes('permission denied') || err.message.includes('PERMISSION DENIED'),
          `Error must specify permission denied: ${err.message}`
        );
      } finally {
        await prisma.$executeRawUnsafe(`RESET ROLE;`);
      }
    });

    // 2. Anonymous Request to Gateway is Rejected (403 Forbidden)
    await runTest('2. Anonymous request to /api/debit-wallet rejected with 403 Forbidden', async () => {
      const { req, res } = createMockReqRes({
        headers: {}, // No auth header
        body: {
          merchantId: merchantA,
          amountMinor: 10000,
          orderId: 'ORD-ANON-TEST',
          idempotencyKey: 'idemp-anon-test-1',
        },
      });

      await debitWalletHandler(req, res);
      assert.strictEqual(res._statusCode, 403, 'Must return 403 Forbidden');
      assert(res._responseData.error.includes('Forbidden'), 'Error must specify Forbidden');

      // Verify wallet balance is completely untouched
      const w = (await prisma.$queryRawUnsafe<any[]>(`SELECT available_balance_minor FROM public.wallets WHERE merchant_id = '${merchantA}';`))[0];
      assert.strictEqual(w.available_balance_minor.toString(), '50000', 'Balance must remain ₹500.00');
    });

    // 3. Invalid or Tampered Session Token is Rejected
    await runTest('3. Invalid / forged authorization token rejected with 403 Forbidden', async () => {
      const { req, res } = createMockReqRes({
        headers: {
          authorization: 'Bearer forged-malicious-jwt-token-12345',
        },
        body: {
          merchantId: merchantA,
          amountMinor: 10000,
          orderId: 'ORD-FORGED-TEST',
          idempotencyKey: 'idemp-forged-test-1',
        },
      });

      await debitWalletHandler(req, res);
      assert.strictEqual(res._statusCode, 403, 'Must return 403 Forbidden');

      const w = (await prisma.$queryRawUnsafe<any[]>(`SELECT available_balance_minor FROM public.wallets WHERE merchant_id = '${merchantA}';`))[0];
      assert.strictEqual(w.available_balance_minor.toString(), '50000');
    });

    // 4. Cross-Tenant Protection: Merchant A cannot debit Merchant B
    await runTest('4. Cross-Tenant Protection: Merchant A cannot debit Merchant B wallet', async () => {
      const { req, res } = createMockReqRes({
        headers: {
          authorization: 'Bearer unmapped-caller-token',
        },
        body: {
          merchantId: merchantB,
          amountMinor: 10000,
          orderId: 'ORD-CROSS-TENANT-ATTACK',
          idempotencyKey: 'idemp-cross-tenant-1',
        },
      });

      await debitWalletHandler(req, res);
      assert.strictEqual(res._statusCode, 403, 'Cross-tenant debit must be rejected with 403 Forbidden');

      const wB = (await prisma.$queryRawUnsafe<any[]>(`SELECT available_balance_minor FROM public.wallets WHERE merchant_id = '${merchantB}';`))[0];
      assert.strictEqual(wB.available_balance_minor.toString(), '50000', 'Merchant B balance must remain intact');
    });

    // 5. Authorized Debit & Idempotency: Duplicate Debits Charge Exactly Once
    await runTest('5. Duplicate debits charge exactly once and return duplicate acknowledgment', async () => {
      const idempKey = 'idemp-dup-qa-test-unique';

      // First Request (Authorized via internal service secret)
      const { req: req1, res: res1 } = createMockReqRes({
        headers: {
          'x-internal-service-key': process.env.INTERNAL_WALLET_GATEWAY_SECRET,
        },
        body: {
          merchantId: merchantA,
          amountMinor: 10216, // ₹102.16
          orderId: 'ORD-DUP-TEST-1',
          shipmentId: 'SHP-DUP-TEST-1',
          courierName: 'Delhivery Surface',
          idempotencyKey: idempKey,
        },
      });

      await debitWalletHandler(req1, res1);
      assert.strictEqual(res1._statusCode, 200);
      assert.strictEqual(res1._responseData.success, true);
      assert.strictEqual(res1._responseData.isDuplicate, false);
      assert.strictEqual(String(res1._responseData.balanceAfterMinor), '39784'); // 50000 - 10216 = 39784

      // Second Request (Identical retry)
      const { req: req2, res: res2 } = createMockReqRes({
        headers: {
          'x-internal-service-key': process.env.INTERNAL_WALLET_GATEWAY_SECRET,
        },
        body: {
          merchantId: merchantA,
          amountMinor: 10216,
          orderId: 'ORD-DUP-TEST-1',
          shipmentId: 'SHP-DUP-TEST-1',
          courierName: 'Delhivery Surface',
          idempotencyKey: idempKey,
        },
      });

      await debitWalletHandler(req2, res2);
      assert.strictEqual(res2._statusCode, 200);
      assert.strictEqual(res2._responseData.success, true);
      assert.strictEqual(res2._responseData.isDuplicate, true, 'Second submission must be flagged as duplicate');
      assert.strictEqual(String(res2._responseData.balanceAfterMinor), '39784', 'Balance must not be deducted twice');

      // Verify DB state: exactly 1 ledger row and balance 39784
      const wA = (await prisma.$queryRawUnsafe<any[]>(`SELECT available_balance_minor, total_spent_minor FROM public.wallets WHERE merchant_id = '${merchantA}';`))[0];
      assert.strictEqual(wA.available_balance_minor.toString(), '39784');
      assert.strictEqual(wA.total_spent_minor.toString(), '10216');

      const txs = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public.wallet_transactions WHERE merchant_id = '${merchantA}';`);
      assert.strictEqual(txs.length, 1, 'Only 1 transaction row must exist in ledger');
    });

    // 6. Charge Tampering Prevention: Backend verifies authoritative shipment charge from DB
    await runTest('6. Charge Tampering Prevention: Seller cannot submit arbitrary debit amount', async () => {
      // Ensure test shipment exists in database with authoritative charge 10216 paise
      const testShpId = '00000000-1111-2222-3333-444444444444';
      await prisma.$executeRawUnsafe(`
        INSERT INTO public.shipments (
          id, merchant_id, shipment_number, booking_reference_id, order_id, courier_id, courier_name,
          service_type, mode, pickup_contact_person, pickup_phone, pickup_address_line1, pickup_city, pickup_state, pickup_pincode,
          delivery_contact_name, delivery_phone, delivery_address_line1, delivery_city, delivery_state, delivery_pincode,
          total_packages_count, actual_weight_kg, chargeable_weight_kg, invoice_value_minor, payment_mode, cod_amount_minor,
          freight_charge_minor, fuel_surcharge_minor, cod_fee_minor, insurance_fee_minor, gst_amount_minor, total_charge_minor,
          status, label_generated, booked_at, created_at, updated_at
        ) VALUES (
          '${testShpId}', '${merchantA}', 'SHP-TAMPER-TEST', 'BOK-TAMPER', 'ORD-TAMPER-TEST', 'delhivery', 'Delhivery Surface',
          'Surface', 'B2C', 'Sender', '9999999999', 'Addr', 'City', 'State', '110001',
          'Recipient', '8888888888', 'Addr', 'City', 'State', '110002',
          1, 0.5, 0.5, 50000, 'PREPAID', 0,
          5144, 514, 0, 0, 0, 10216,
          'BOOKED', true, now(), now(), now()
        ) ON CONFLICT (id) DO UPDATE SET total_charge_minor = 10216;
      `);

      // Hacker seller attempts to submit 100 paise (₹1.00) instead of authoritative ₹102.16
      const { req, res } = createMockReqRes({
        headers: {
          'x-internal-service-key': process.env.INTERNAL_WALLET_GATEWAY_SECRET,
        },
        body: {
          merchantId: merchantA,
          amountMinor: 100, // Tampered price
          orderId: 'ORD-TAMPER-TEST',
          shipmentId: 'SHP-TAMPER-TEST',
          idempotencyKey: 'idemp-tamper-attempt-1',
        },
      });

      await debitWalletHandler(req, res);
      assert.strictEqual(res._statusCode, 400, 'Tampered amount must be rejected with 400 Bad Request');
      assert(res._responseData.error.includes('Charge Tampering Detected'), 'Must detect charge tampering');

      // Clean test shipment
      await prisma.$executeRawUnsafe(`DELETE FROM public.shipments WHERE id = '${testShpId}';`);
    });

    // 7. Concurrency Safety: Concurrent Debits Cannot Overspend Available Balance
    await runTest('7. High-concurrency race condition test: 10 concurrent debits cannot overspend wallet', async () => {
      // Set balance to exactly ₹100.00 (10,000 paise)
      await prisma.$executeRawUnsafe(`
        UPDATE public.wallets 
        SET available_balance_minor = 10000, total_spent_minor = 0 
        WHERE merchant_id = '${merchantB}';
      `);
      await prisma.$executeRawUnsafe(`DELETE FROM public.wallet_transactions WHERE merchant_id = '${merchantB}';`);

      // Launch 10 simultaneous debit requests of ₹100.00 (10,000 paise each)
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => {
        const { req, res } = createMockReqRes({
          headers: {
            'x-internal-service-key': process.env.INTERNAL_WALLET_GATEWAY_SECRET,
          },
          body: {
            merchantId: merchantB,
            amountMinor: 10000,
            orderId: `ORD-CONCURRENT-B-${i}`,
            idempotencyKey: `idemp-concurrent-b-${i}`,
          },
        });
        return debitWalletHandler(req, res).then(() => res);
      });

      const responses = await Promise.all(concurrentRequests);
      const successes = responses.filter((r) => r._statusCode === 200);
      const failures = responses.filter((r) => r._statusCode === 402 || r._statusCode === 400);

      console.log(`    Concurrency Outcome: Successes = ${successes.length}, Blocked/Insufficient = ${failures.length}`);

      assert.strictEqual(successes.length, 1, 'Exactly one concurrent debit must succeed');
      assert.strictEqual(failures.length, 9, 'All subsequent 9 debits must be rejected due to insufficient balance');

      const wB = (await prisma.$queryRawUnsafe<any[]>(`SELECT available_balance_minor, total_spent_minor FROM public.wallets WHERE merchant_id = '${merchantB}';`))[0];
      assert.strictEqual(wB.available_balance_minor.toString(), '0', 'Balance must be exactly ₹0.00');
      assert.strictEqual(wB.total_spent_minor.toString(), '10000', 'Total spent must be exactly ₹100.00');
    });

    // 8. Atomic Rollback: Rejected Debit Leaves Wallet and Ledger Untouched
    await runTest('8. Atomic Rollback: Rejected debit leaves wallet balance and ledger untouched', async () => {
      const balanceBefore = (await prisma.$queryRawUnsafe<any[]>(`SELECT available_balance_minor FROM public.wallets WHERE merchant_id = '${merchantA}';`))[0].available_balance_minor;

      const { req, res } = createMockReqRes({
        headers: {
          'x-internal-service-key': process.env.INTERNAL_WALLET_GATEWAY_SECRET,
        },
        body: {
          merchantId: merchantA,
          amountMinor: 99999999, // Exceeds available balance
          orderId: 'ORD-OVERDRAFT-TEST',
          idempotencyKey: 'idemp-overdraft-test-1',
        },
      });

      await debitWalletHandler(req, res);
      assert.strictEqual(res._statusCode, 402, 'Must return 402 Insufficient Funds');

      const balanceAfter = (await prisma.$queryRawUnsafe<any[]>(`SELECT available_balance_minor FROM public.wallets WHERE merchant_id = '${merchantA}';`))[0].available_balance_minor;
      assert.strictEqual(balanceBefore.toString(), balanceAfter.toString(), 'Balance must remain identical after rejected debit');

      const badTx = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public.wallet_transactions WHERE idempotency_key = 'idemp-overdraft-test-1';`);
      assert.strictEqual(badTx.length, 0, 'No transaction row should be committed for rejected debit');
    });
  } finally {
    console.log('\n--- Cleaning up Security Test Fixtures ---');
    await prisma.$executeRawUnsafe(`DELETE FROM public.wallet_transactions WHERE merchant_id IN ('${merchantA}', '${merchantB}');`);
    await prisma.$executeRawUnsafe(`DELETE FROM public.wallets WHERE merchant_id IN ('${merchantA}', '${merchantB}');`);
    await prisma.$executeRawUnsafe(`DELETE FROM public.merchants WHERE id IN ('${merchantA}', '${merchantB}');`);
    console.log('✓ Security test fixtures scrubbed cleanly.');
  }

  console.log('\n===============================================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`TOTAL SECURITY TESTS: ${results.length} | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log('===============================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Test suite error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
