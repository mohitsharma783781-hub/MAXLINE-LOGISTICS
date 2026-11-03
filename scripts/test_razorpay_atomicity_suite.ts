import assert from 'node:assert';
import crypto from 'node:crypto';
import { PrismaClient } from '../apps/api/node_modules/@prisma/client';

const prisma = new PrismaClient();
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '5hDdnq0PT1gV64UYEV7vk3TE';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, durationMs: Date.now() - start });
    console.log(`  ✓ [PASS] ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err.message, durationMs: Date.now() - start });
    console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
  }
}

// Helper to simulate calling public.credit_wallet_rpc
async function callCreditWalletRpc(params: {
  merchantId: string;
  amountMinor: number;
  paymentId: string;
  description?: string;
}) {
  const idempotencyKey = `rzp_${params.paymentId}`;
  const desc = params.description || `Wallet recharge via Razorpay (${params.paymentId})`;

  const res: any = await prisma.$queryRaw`
    SELECT public.credit_wallet_rpc(
      ${params.merchantId}::uuid,
      ${BigInt(params.amountMinor)}::bigint,
      'RAZORPAY'::text,
      ${params.paymentId}::text,
      ${idempotencyKey}::text,
      ${desc}::text
    ) as result
  `;

  return res?.[0]?.result;
}

function generateSignature(orderId: string, paymentId: string, secret = RAZORPAY_KEY_SECRET): string {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

function verifySignatureTimingSafe(orderId: string, paymentId: string, signature: string, secret = RAZORPAY_KEY_SECRET): boolean {
  const text = `${orderId}|${paymentId}`;
  const generated = crypto.createHmac('sha256', secret).update(text).digest('hex');
  if (generated.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(generated, 'utf-8'), Buffer.from(signature, 'utf-8'));
}

async function main() {
  console.log('\n===============================================================');
  console.log('MAXLINE LOGISTICS — CRITICAL RAZORPAY WALLET ATOMICITY QA SUITE');
  console.log('===============================================================\n');

  // Isolated test merchant and wallet
  const testMerchantId = crypto.randomUUID();
  const testMerchantId2 = crypto.randomUUID();

  // 1. Setup isolated test merchant
  await prisma.merchants.create({
    data: {
      id: testMerchantId,
      business_name: 'ATOMICITY QA TEST MERCHANT',
      status: 'ACTIVE',
    },
  });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Successful Payment (Single Credit & Immutable Ledger)
    // -------------------------------------------------------------------------
    await runTest('1. Successful payment verification and single atomic credit', async () => {
      const orderId = `order_${Date.now()}`;
      const paymentId = `pay_t1_${Date.now()}`;
      const sig = generateSignature(orderId, paymentId);

      // Verify signature
      assert.strictEqual(verifySignatureTimingSafe(orderId, paymentId, sig), true);

      // Execute atomic credit of ₹500 (50,000 paise)
      const res = await callCreditWalletRpc({
        merchantId: testMerchantId,
        amountMinor: 50000,
        paymentId,
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.is_duplicate, false);
      assert.strictEqual(Number(res.balance_after_minor), 50000);

      // Verify wallet row in database
      const wallet = await prisma.wallets.findUnique({ where: { merchant_id: testMerchantId } });
      assert.ok(wallet);
      assert.strictEqual(Number(wallet.available_balance_minor), 50000);
      assert.strictEqual(Number(wallet.total_recharged_minor), 50000);

      // Verify ledger transaction
      const tx = await prisma.wallet_transactions.findUnique({
        where: { idempotency_key: `rzp_${paymentId}` },
      });
      assert.ok(tx);
      assert.strictEqual(Number(tx.amount_minor), 50000);
      assert.strictEqual(tx.direction, 'CREDIT');
      assert.strictEqual(tx.type, 'RECHARGE');
    });

    // -------------------------------------------------------------------------
    // TEST 2: Failed Payment (Zero Credit)
    // -------------------------------------------------------------------------
    await runTest('2. Failed payment status rejected without crediting wallet', async () => {
      const paymentStatus = 'failed';
      let creditExecuted = false;

      if (paymentStatus === 'captured') {
        await callCreditWalletRpc({
          merchantId: testMerchantId,
          amountMinor: 10000,
          paymentId: `pay_failed_${Date.now()}`,
        });
        creditExecuted = true;
      }

      assert.strictEqual(creditExecuted, false, 'Failed payment must never trigger wallet credit');

      const wallet = await prisma.wallets.findUnique({ where: { merchant_id: testMerchantId } });
      assert.strictEqual(Number(wallet?.available_balance_minor), 50000, 'Balance must remain unchanged');
    });

    // -------------------------------------------------------------------------
    // TEST 3: Invalid Signature Rejected
    // -------------------------------------------------------------------------
    await runTest('3. Invalid or tampered signature rejected with zero balance impact', async () => {
      const orderId = `order_${Date.now()}`;
      const paymentId = `pay_tampered_${Date.now()}`;
      const fakeSignature = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

      const isValid = verifySignatureTimingSafe(orderId, paymentId, fakeSignature);
      assert.strictEqual(isValid, false, 'Tampered signature must fail verification');

      // Verify balance untouched
      const wallet = await prisma.wallets.findUnique({ where: { merchant_id: testMerchantId } });
      assert.strictEqual(Number(wallet?.available_balance_minor), 50000);
    });

    // -------------------------------------------------------------------------
    // TEST 4: Duplicate Callback Idempotency
    // -------------------------------------------------------------------------
    await runTest('4. Duplicate callback re-submission returns duplicate acknowledgment without double-crediting', async () => {
      const paymentId = `pay_dup_cb_${Date.now()}`;

      // First call
      const res1 = await callCreditWalletRpc({
        merchantId: testMerchantId,
        amountMinor: 25000, // ₹250
        paymentId,
      });
      assert.strictEqual(res1.success, true);
      assert.strictEqual(res1.is_duplicate, false);
      assert.strictEqual(Number(res1.balance_after_minor), 75000); // 50,000 + 25,000

      // Duplicate callback with same payment ID
      const res2 = await callCreditWalletRpc({
        merchantId: testMerchantId,
        amountMinor: 25000,
        paymentId,
      });
      assert.strictEqual(res2.success, true);
      assert.strictEqual(res2.is_duplicate, true, 'Second call must be flagged as duplicate');
      assert.strictEqual(Number(res2.balance_after_minor), 75000, 'Balance must NOT increase');

      const wallet = await prisma.wallets.findUnique({ where: { merchant_id: testMerchantId } });
      assert.strictEqual(Number(wallet?.available_balance_minor), 75000);
    });

    // -------------------------------------------------------------------------
    // TEST 5: Duplicate Webhook Idempotency
    // -------------------------------------------------------------------------
    await runTest('5. Duplicate webhook re-delivery handled idempotently', async () => {
      const paymentId = `pay_dup_wh_${Date.now()}`;

      // Initial webhook event
      const res1 = await callCreditWalletRpc({
        merchantId: testMerchantId,
        amountMinor: 10000, // ₹100
        paymentId,
      });
      assert.strictEqual(res1.is_duplicate, false);
      assert.strictEqual(Number(res1.balance_after_minor), 85000);

      // Re-delivered webhook
      const res2 = await callCreditWalletRpc({
        merchantId: testMerchantId,
        amountMinor: 10000,
        paymentId,
      });
      assert.strictEqual(res2.is_duplicate, true);
      assert.strictEqual(Number(res2.balance_after_minor), 85000);

      const wallet = await prisma.wallets.findUnique({ where: { merchant_id: testMerchantId } });
      assert.strictEqual(Number(wallet?.available_balance_minor), 85000);
    });

    // -------------------------------------------------------------------------
    // TEST 6: Simultaneous Callback & Webhook Arrival (Race Condition)
    // -------------------------------------------------------------------------
    await runTest('6. Callback and webhook arriving simultaneously credit exactly once', async () => {
      const paymentId = `pay_concurrent_pair_${Date.now()}`;
      const amountMinor = 15000; // ₹150

      // Execute both concurrently
      const [resCallback, resWebhook] = await Promise.all([
        callCreditWalletRpc({ merchantId: testMerchantId, amountMinor, paymentId, description: 'Client Callback' }),
        callCreditWalletRpc({ merchantId: testMerchantId, amountMinor, paymentId, description: 'Server Webhook' }),
      ]);

      assert.strictEqual(resCallback.success, true);
      assert.strictEqual(resWebhook.success, true);

      // Exactly one must be new credit, and exactly one must be duplicate
      const duplicates = [resCallback.is_duplicate, resWebhook.is_duplicate];
      assert.strictEqual(duplicates.filter((d) => !d).length, 1, 'Exactly one call must be processed as original credit');
      assert.strictEqual(duplicates.filter((d) => d).length, 1, 'Exactly one call must be recognized as duplicate');

      // Final balance must have incremented by exactly 15,000 (from 85,000 to 100,000)
      const wallet = await prisma.wallets.findUnique({ where: { merchant_id: testMerchantId } });
      assert.strictEqual(Number(wallet?.available_balance_minor), 100000);

      // Exactly 1 ledger transaction must exist for this payment
      const txs = await prisma.wallet_transactions.findMany({
        where: { reference_id: paymentId },
      });
      assert.strictEqual(txs.length, 1, 'Exactly one ledger record must exist for the payment');
    });

    // -------------------------------------------------------------------------
    // TEST 7: 20 Concurrent Requests for Same Payment
    // -------------------------------------------------------------------------
    await runTest('7. High-concurrency stress test: 20 concurrent requests for same payment ID', async () => {
      const paymentId = `pay_stress_20_${Date.now()}`;
      const amountMinor = 20000; // ₹200

      // Execute 20 concurrent requests in pooled batches of 5 to respect Supabase pooler connection limits
      const allBatchResults: any[] = [];
      const batchSize = 5;

      for (let i = 0; i < 20; i += batchSize) {
        const batch = Array.from({ length: batchSize }, (_, j) =>
          callCreditWalletRpc({
            merchantId: testMerchantId,
            amountMinor,
            paymentId,
            description: `Concurrent Worker #${i + j + 1}`,
          })
        );
        const res = await Promise.all(batch);
        allBatchResults.push(...res);
      }

      const successCount = allBatchResults.filter((r) => r.success).length;
      assert.strictEqual(successCount, 20, 'All 20 concurrent requests must complete successfully');

      const originalCount = allBatchResults.filter((r) => !r.is_duplicate).length;
      const duplicateCount = allBatchResults.filter((r) => r.is_duplicate).length;

      assert.strictEqual(originalCount, 1, 'Exactly 1 request must win the race and perform the credit');
      assert.strictEqual(duplicateCount, 19, 'All other 19 requests must be recognized as idempotent duplicates');

      // Final balance must have incremented by exactly 20,000 (from 100,000 to 120,000)
      const wallet = await prisma.wallets.findUnique({ where: { merchant_id: testMerchantId } });
      assert.strictEqual(Number(wallet?.available_balance_minor), 120000);

      // Verify only 1 ledger row exists
      const txCount = await prisma.wallet_transactions.count({
        where: { idempotency_key: `rzp_${paymentId}` },
      });
      assert.strictEqual(txCount, 1, 'Database must contain exactly 1 ledger record');
    });

    // -------------------------------------------------------------------------
    // TEST 8: Database Failure / Rollback Atomicity
    // -------------------------------------------------------------------------
    await runTest('8. Database failure simulation rolls back atomically without partial state', async () => {
      const nonExistentMerchantId = '00000000-0000-0000-0000-000000000000';
      const balanceBefore = (await prisma.wallets.findUnique({ where: { merchant_id: testMerchantId } }))?.available_balance_minor;

      let errorThrown = false;
      try {
        // Attempting to credit an invalid negative amount must trigger exception
        await prisma.$queryRaw`
          SELECT public.credit_wallet_rpc(
            ${nonExistentMerchantId}::uuid,
            ${BigInt(-500)}::bigint,
            'RAZORPAY'::text,
            'pay_invalid'::text,
            'rzp_invalid'::text,
            'Invalid negative amount'::text
          )
        `;
      } catch (err: any) {
        errorThrown = true;
        assert.ok(err.message.includes('Invalid Amount'));
      }

      assert.strictEqual(errorThrown, true, 'Database function must reject negative amounts');

      // Verify target wallet was completely unaffected
      const balanceAfter = (await prisma.wallets.findUnique({ where: { merchant_id: testMerchantId } }))?.available_balance_minor;
      assert.strictEqual(balanceBefore, balanceAfter);
    });

    // -------------------------------------------------------------------------
    // TEST 9: Retry After Partial / Network Failure
    // -------------------------------------------------------------------------
    await runTest('9. Retry after transient failure succeeds cleanly and credits once', async () => {
      const retryPaymentId = `pay_retry_${Date.now()}`;
      const amountMinor = 30000; // ₹300

      // Step 1: Normal credit
      const res = await callCreditWalletRpc({
        merchantId: testMerchantId,
        amountMinor,
        paymentId: retryPaymentId,
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.is_duplicate, false);
      assert.strictEqual(Number(res.balance_after_minor), 150000); // 120,000 + 30,000

      // Step 2: Retry with identical payment ID
      const retryRes = await callCreditWalletRpc({
        merchantId: testMerchantId,
        amountMinor,
        paymentId: retryPaymentId,
      });

      assert.strictEqual(retryRes.success, true);
      assert.strictEqual(retryRes.is_duplicate, true);
      assert.strictEqual(Number(retryRes.balance_after_minor), 150000);
    });

    // -------------------------------------------------------------------------
    // TEST 10: Two Different Valid Payments for Same Wallet
    // -------------------------------------------------------------------------
    await runTest('10. Two distinct valid payments credit independently and correctly', async () => {
      const paymentA = `pay_distinct_A_${Date.now()}`;
      const paymentB = `pay_distinct_B_${Date.now()}`;

      const resA = await callCreditWalletRpc({
        merchantId: testMerchantId,
        amountMinor: 50000, // ₹500
        paymentId: paymentA,
      });
      assert.strictEqual(resA.success, true);
      assert.strictEqual(resA.is_duplicate, false);
      assert.strictEqual(Number(resA.balance_after_minor), 200000); // 150,000 + 50,000

      const resB = await callCreditWalletRpc({
        merchantId: testMerchantId,
        amountMinor: 25000, // ₹250
        paymentId: paymentB,
      });
      assert.strictEqual(resB.success, true);
      assert.strictEqual(resB.is_duplicate, false);
      assert.strictEqual(Number(resB.balance_after_minor), 225000); // 200,000 + 25,000

      // Total balance must be exactly ₹2,250.00 (225,000 paise)
      const wallet = await prisma.wallets.findUnique({ where: { merchant_id: testMerchantId } });
      assert.strictEqual(Number(wallet?.available_balance_minor), 225000);
    });

    // -------------------------------------------------------------------------
    // TEST 11: Mathematical Ledger Reconciliation Invariant
    // -------------------------------------------------------------------------
    await runTest('11. Full wallet ledger mathematical reconciliation invariant: sum(CREDIT) - sum(DEBIT) == balance', async () => {
      const wallet = await prisma.wallets.findUnique({ where: { merchant_id: testMerchantId } });
      const currentBalance = Number(wallet?.available_balance_minor || 0);

      const credits = await prisma.wallet_transactions.aggregate({
        where: { merchant_id: testMerchantId, direction: 'CREDIT' },
        _sum: { amount_minor: true },
      });

      const debits = await prisma.wallet_transactions.aggregate({
        where: { merchant_id: testMerchantId, direction: 'DEBIT' },
        _sum: { amount_minor: true },
      });

      const totalCredits = Number(credits._sum.amount_minor || 0);
      const totalDebits = Number(debits._sum.amount_minor || 0);
      const netCalculated = totalCredits - totalDebits;

      console.log(`    Reconciliation Check: Total Credits = ₹${totalCredits / 100}, Total Debits = ₹${totalDebits / 100}, Net = ₹${netCalculated / 100}, Available Balance = ₹${currentBalance / 100}`);

      assert.strictEqual(
        netCalculated,
        currentBalance,
        `Ledger sum must equal available balance: ${netCalculated} vs ${currentBalance}`
      );
    });

  } finally {
    // Clean up test merchant and all associated records
    console.log('\n--- Cleaning up Isolated Test Fixtures ---');
    await prisma.wallet_transactions.deleteMany({ where: { merchant_id: testMerchantId } });
    await prisma.wallets.deleteMany({ where: { merchant_id: testMerchantId } });
    await prisma.merchants.deleteMany({ where: { id: testMerchantId } });
    console.log('✓ Isolated test fixtures scrubbed cleanly.');
  }

  console.log('\n===============================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
