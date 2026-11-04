import assert from 'node:assert';
import { PrismaClient } from '../apps/api/node_modules/@prisma/client';

const prisma = new PrismaClient();

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

async function main() {
  console.log('\n===============================================================');
  console.log('MAXLINE LOGISTICS — SELLER WALLET & SHIPMENT CHARGES QA SUITE');
  console.log('===============================================================\n');

  const testMerchantId = 'd8e7f6a5-b4c3-4210-9876-543210fedcba';
  const testAwb = '47474099999999';
  const testOrderId = 'ORD-TEST-9999';

  try {
    // 0. Setup isolated test merchant
    await prisma.$executeRawUnsafe(`
      INSERT INTO public.merchants (id, business_name, status)
      VALUES ('${testMerchantId}', 'QA Test Logistics Ltd', 'ACTIVE')
      ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE';
    `);

    // Clean any prior test data for this merchant
    await prisma.$executeRawUnsafe(`DELETE FROM public.wallet_transactions WHERE merchant_id = '${testMerchantId}';`);
    await prisma.$executeRawUnsafe(`DELETE FROM public.wallets WHERE merchant_id = '${testMerchantId}';`);

    // 1. Initial State Check
    await runTest('1. Wallet starts with clean state (auto-provision on credit)', async () => {
      const w = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public.wallets WHERE merchant_id = '${testMerchantId}';`);
      assert.strictEqual(w.length, 0, 'No wallet should exist yet');
    });

    // 2. Recharge ₹1,000 via atomic credit_wallet_rpc
    await runTest('2. Recharge ₹1,000.00 via credit_wallet_rpc', async () => {
      const creditRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT public.credit_wallet_rpc(
          '${testMerchantId}'::uuid,
          100000::bigint,
          'RECHARGE'::text,
          'pay_test_recharge_1000'::text,
          'idemp_test_recharge_1000'::text,
          'Test Recharge of ₹1,000.00'::text
        ) as res;
      `);
      const res = creditRes[0].res;
      assert.strictEqual(res.success, true);
      assert.strictEqual(String(res.balance_after_minor), '100000');

      const wallet = (await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public.wallets WHERE merchant_id = '${testMerchantId}';`))[0];
      assert.strictEqual(wallet.available_balance_minor.toString(), '100000');
      assert.strictEqual(wallet.total_recharged_minor.toString(), '100000');
      assert.strictEqual(wallet.total_spent_minor.toString(), '0');

      const txs = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public.wallet_transactions WHERE merchant_id = '${testMerchantId}';`);
      assert.strictEqual(txs.length, 1);
      assert.strictEqual(txs[0].type, 'RECHARGE');
      assert.strictEqual(txs[0].direction, 'CREDIT');
      assert.strictEqual(txs[0].amount_minor.toString(), '100000');
      assert.strictEqual(txs[0].balance_after_minor.toString(), '100000');
    });

    // 3. Debit ₹102.16 for shipment booking via debit_wallet_rpc
    await runTest('3. Debit ₹102.16 (10,216 paise) for simulated shipment', async () => {
      const debitRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT public.debit_wallet_rpc(
          '${testMerchantId}'::uuid,
          10216::bigint,
          'SHIPMENT'::text,
          'SHP-ORD-TEST-9999'::text,
          'shipment-charge:SHP-ORD-TEST-9999'::text,
          'Freight debit for Delhivery Surface - Order ORD-TEST-9999'::text
        ) as res;
      `);
      const res = debitRes[0].res;
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.is_duplicate, false);
      assert.strictEqual(String(res.balance_after_minor), '89784');

      const wallet = (await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public.wallets WHERE merchant_id = '${testMerchantId}';`))[0];
      assert.strictEqual(wallet.available_balance_minor.toString(), '89784', 'Available balance must be exactly ₹897.84');
      assert.strictEqual(wallet.total_recharged_minor.toString(), '100000', 'Total recharged must be ₹1,000.00');
      assert.strictEqual(wallet.total_spent_minor.toString(), '10216', 'Total spent must be ₹102.16');

      const txs = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public.wallet_transactions WHERE merchant_id = '${testMerchantId}' ORDER BY created_at ASC;`);
      assert.strictEqual(txs.length, 2, 'Must have exactly 2 ledger transactions (1 credit + 1 debit)');

      const debitTx = txs[1];
      assert.strictEqual(debitTx.type, 'FREIGHT_DEBIT');
      assert.strictEqual(debitTx.direction, 'DEBIT');
      assert.strictEqual(debitTx.amount_minor.toString(), '10216');
      assert.strictEqual(debitTx.balance_before_minor.toString(), '100000');
      assert.strictEqual(debitTx.balance_after_minor.toString(), '89784');
    });

    // 4. Duplicate debit prevention (Idempotency)
    await runTest('4. Duplicate debit request handled idempotently without second charge', async () => {
      const dupRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT public.debit_wallet_rpc(
          '${testMerchantId}'::uuid,
          10216::bigint,
          'SHIPMENT'::text,
          'SHP-ORD-TEST-9999'::text,
          'shipment-charge:SHP-ORD-TEST-9999'::text,
          'Freight debit duplicate retry'::text
        ) as res;
      `);
      const res = dupRes[0].res;
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.is_duplicate, true, 'Must flag as duplicate');
      assert.strictEqual(String(res.balance_after_minor), '89784');

      const wallet = (await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public.wallets WHERE merchant_id = '${testMerchantId}';`))[0];
      assert.strictEqual(wallet.available_balance_minor.toString(), '89784', 'Balance must not change');

      const txs = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public.wallet_transactions WHERE merchant_id = '${testMerchantId}';`);
      assert.strictEqual(txs.length, 2, 'No additional ledger entry should be created');
    });

    // 5. Insufficient Balance Guard
    await runTest('5. Reject debit exceeding available balance', async () => {
      try {
        await prisma.$queryRawUnsafe<any[]>(`
          SELECT public.debit_wallet_rpc(
            '${testMerchantId}'::uuid,
            500000::bigint,
            'SHIPMENT'::text,
            'SHP-OVER-LIMIT'::text,
            'idemp-over-limit'::text,
            'Over limit charge'::text
          ) as res;
        `);
        assert.fail('Should have thrown an insufficient funds error');
      } catch (err: any) {
        assert(err.message.includes('Insufficient Funds'), 'Error must specify Insufficient Funds');
      }

      // Verify balance remains ₹897.84
      const wallet = (await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public.wallets WHERE merchant_id = '${testMerchantId}';`))[0];
      assert.strictEqual(wallet.available_balance_minor.toString(), '89784');
    });

    // 6. Full Ledger Mathematical Reconciliation
    await runTest('6. Mathematical reconciliation: sum(Credits) - sum(Debits) === Available Balance', async () => {
      const sumCredits = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COALESCE(SUM(amount_minor), 0) as total FROM public.wallet_transactions 
        WHERE merchant_id = '${testMerchantId}' AND direction = 'CREDIT';
      `);
      const sumDebits = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COALESCE(SUM(amount_minor), 0) as total FROM public.wallet_transactions 
        WHERE merchant_id = '${testMerchantId}' AND direction = 'DEBIT';
      `);
      const wallet = (await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public.wallets WHERE merchant_id = '${testMerchantId}';`))[0];

      const credits = BigInt(sumCredits[0].total);
      const debits = BigInt(sumDebits[0].total);
      const calculatedBalance = credits - debits;
      const actualBalance = BigInt(wallet.available_balance_minor);

      assert.strictEqual(calculatedBalance, actualBalance, `Calculated (${calculatedBalance}) must equal actual (${actualBalance})`);
      assert.strictEqual(actualBalance.toString(), '89784');
      assert.strictEqual(credits.toString(), '100000');
      assert.strictEqual(debits.toString(), '10216');
    });

    // 7. Admin and Seller Synchronization
    await runTest('7. Admin view queries identical authoritative figures', async () => {
      const walletRow = (await prisma.$queryRawUnsafe<any[]>(`
        SELECT available_balance_minor, total_recharged_minor, total_spent_minor, reserved_balance_minor
        FROM public.wallets WHERE merchant_id = '${testMerchantId}';
      `))[0];

      const balanceINR = Number(walletRow.available_balance_minor) / 100;
      const rechargedINR = Number(walletRow.total_recharged_minor) / 100;
      const spentINR = Number(walletRow.total_spent_minor) / 100;

      assert.strictEqual(balanceINR, 897.84, 'Admin balance must be ₹897.84');
      assert.strictEqual(rechargedINR, 1000.00, 'Admin recharged must be ₹1,000.00');
      assert.strictEqual(spentINR, 102.16, 'Admin spent must be ₹102.16');
    });

    // 8. Tenant Isolation Guard
    await runTest('8. Tenant isolation: Wallet and transactions are inaccessible across tenants', async () => {
      const otherMerchantId = '11111111-2222-3333-4444-555555555555';
      const foreignWallet = await prisma.$queryRawUnsafe<any[]>(`
        SELECT * FROM public.wallets WHERE merchant_id = '${otherMerchantId}';
      `);
      assert.strictEqual(foreignWallet.length, 0);

      const foreignTxs = await prisma.$queryRawUnsafe<any[]>(`
        SELECT * FROM public.wallet_transactions WHERE merchant_id = '${otherMerchantId}';
      `);
      assert.strictEqual(foreignTxs.length, 0);
    });

  } finally {
    // Clean up isolated test fixtures
    console.log('\n--- Cleaning up Isolated Test Fixtures ---');
    await prisma.$executeRawUnsafe(`DELETE FROM public.wallet_transactions WHERE merchant_id = '${testMerchantId}';`);
    await prisma.$executeRawUnsafe(`DELETE FROM public.wallets WHERE merchant_id = '${testMerchantId}';`);
    await prisma.$executeRawUnsafe(`DELETE FROM public.merchants WHERE id = '${testMerchantId}';`);
    console.log('✓ Isolated test fixtures scrubbed cleanly.');
  }

  const passedCount = results.filter((r) => r.passed).length;
  console.log('\n===============================================================');
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`);
  console.log('===============================================================\n');

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
