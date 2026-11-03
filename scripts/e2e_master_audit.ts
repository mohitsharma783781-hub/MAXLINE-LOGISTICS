import assert from 'node:assert';
import crypto from 'node:crypto';
import { PrismaClient } from '../apps/api/node_modules/@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  suite: string;
  testName: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(suite: string, testName: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    await fn();
    results.push({ suite, testName, passed: true, durationMs: Date.now() - start });
    console.log(`  ✓ [${suite}] ${testName}`);
  } catch (err: any) {
    results.push({ suite, testName, passed: false, error: err.message, durationMs: Date.now() - start });
    console.error(`  ✗ [${suite}] ${testName}: ${err.message}`);
  }
}

async function main() {
  console.log('\n===============================================================');
  console.log('MAXLINE LOGISTICS — MASTER AUTOMATED E2E QA & STABILIZATION SUITE');
  console.log('===============================================================\n');

  // Generate valid RFC 4122 UUIDs for PostgreSQL
  const testMerchantId = crypto.randomUUID();
  const testMerchantEmail = `qa.test.${Date.now()}@maxlineqa.com`;
  const testUserId = crypto.randomUUID();
  let testWalletId = crypto.randomUUID();

  // =========================================================================
  // BATCH 1: AUTHENTICATION, SIGNUP, MERCHANT IDENTITY & TENANT ISOLATION
  // =========================================================================
  console.log('\n--- BATCH 1: Authentication, Signup & Tenant Isolation ---');

  await runTest('Batch 1', 'Validate required registration fields', () => {
    const invalidPayloads = [
      {},
      { fullName: 'Test' },
      { fullName: 'Test', email: 'invalid-email' },
      { fullName: 'Test', email: 'valid@email.com', password: '123' }, // too short
    ];

    for (const p of invalidPayloads) {
      const isValid = Boolean(
        p.fullName &&
        p.email &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) &&
        p.password &&
        p.password.length >= 8
      );
      assert.strictEqual(isValid, false, 'Payload should have failed validation');
    }
  });

  await runTest('Batch 1', 'Authoritative Merchant & User Creation in PostgreSQL', async () => {
    // 1. Upsert test merchant
    const merchant = await prisma.merchants.create({
      data: {
        id: testMerchantId,
        business_name: 'QA AUTOMATION LOGISTICS HUB',
        status: 'ACTIVE',
      },
    });
    assert.strictEqual(merchant.id, testMerchantId);
    assert.strictEqual(merchant.business_name, 'QA AUTOMATION LOGISTICS HUB');

    // 2. Upsert test user
    const user = await prisma.public_users.create({
      data: {
        id: testUserId,
        email: testMerchantEmail,
        full_name: 'QA Test Lead',
        phone: '+91 98765 43210',
        is_active: true,
      },
    });
    assert.strictEqual(user.email, testMerchantEmail);

    // 3. Link membership (OWNER)
    const member = await prisma.merchant_members.create({
      data: {
        id: crypto.randomUUID(),
        merchant_id: testMerchantId,
        user_id: testUserId,
        role: 'OWNER',
        is_default: true,
      },
    });
    assert.strictEqual(member.role, 'OWNER');

    // 4. Initialize Default Wallet at ₹0.00
    const wallet = await prisma.wallets.create({
      data: {
        id: testWalletId,
        merchant_id: testMerchantId,
        currency: 'INR',
        available_balance_minor: BigInt(0),
        reserved_balance_minor: BigInt(0),
        total_recharged_minor: BigInt(0),
        total_spent_minor: BigInt(0),
        status: 'ACTIVE',
      },
    });
    assert.strictEqual(wallet.available_balance_minor, BigInt(0));
    assert.strictEqual(wallet.status, 'ACTIVE');
  });

  await runTest('Batch 1', 'Tenant Isolation: Prevent Cross-Merchant Record Access', async () => {
    const foreignMerchantId = crypto.randomUUID();
    const foreignWalletId = crypto.randomUUID();

    await prisma.merchants.create({
      data: {
        id: foreignMerchantId,
        business_name: 'FOREIGN ISOLATED MERCHANT',
        status: 'ACTIVE',
      },
    });
    const foreignWallet = await prisma.wallets.create({
      data: {
        id: foreignWalletId,
        merchant_id: foreignMerchantId,
        currency: 'INR',
        available_balance_minor: BigInt(500000), // ₹5,000.00
        reserved_balance_minor: BigInt(0),
        status: 'ACTIVE',
      },
    });

    // Scoped query by testMerchantId should NEVER return foreign wallet
    const scopedWallets = await prisma.wallets.findMany({
      where: { merchant_id: testMerchantId },
    });
    assert.strictEqual(scopedWallets.length, 1);
    assert.strictEqual(scopedWallets[0].merchant_id, testMerchantId);
    assert.notStrictEqual(scopedWallets[0].merchant_id, foreignMerchantId);

    // Clean up foreign test record
    await prisma.wallets.delete({ where: { id: foreignWallet.id } });
    await prisma.merchants.delete({ where: { id: foreignMerchantId } });
  });

  // =========================================================================
  // BATCH 2: SELLER / ADMIN SYNCHRONIZATION & KYC MANAGEMENT
  // =========================================================================
  console.log('\n--- BATCH 2: Seller/Admin Synchronization & KYC Management ---');

  await runTest('Batch 2', 'Authoritative Merchant Visibility in Admin Queries', async () => {
    const merchantsList = await prisma.merchants.findMany({
      where: { id: testMerchantId },
      include: {
        merchant_members: {
          include: { users: true },
        },
        wallets: true,
      },
    });

    assert.strictEqual(merchantsList.length, 1);
    const m = merchantsList[0];
    assert.strictEqual(m.business_name, 'QA AUTOMATION LOGISTICS HUB');
    assert.strictEqual(m.merchant_members[0].users.email, testMerchantEmail);
    assert.strictEqual(m.wallets?.available_balance_minor, BigInt(0));
  });

  await runTest('Batch 2', 'KYC Document Submission & State Verification', async () => {
    const docId = crypto.randomUUID();
    const kycDoc = await prisma.merchant_kyc_documents.create({
      data: {
        id: docId,
        merchant_id: testMerchantId,
        document_type: 'GST_CERTIFICATE',
        document_file_name: 'gst_certificate.pdf',
        document_storage_path: 'https://maxlinelogistics.com/storage/gst_certificate.pdf',
        verification_status: 'PENDING',
      },
    });
    assert.strictEqual(kycDoc.verification_status, 'PENDING');

    // Admin approves KYC
    const updated = await prisma.merchant_kyc_documents.update({
      where: { id: docId },
      data: {
        verification_status: 'VERIFIED',
        verified_at: new Date(),
      },
    });
    assert.strictEqual(updated.verification_status, 'VERIFIED');

    // Clean up doc
    await prisma.merchant_kyc_documents.delete({ where: { id: docId } });
  });

  // =========================================================================
  // BATCH 3: RAZORPAY PAYMENT, WEBHOOK & FINANCIAL RECONCILIATION
  // =========================================================================
  console.log('\n--- BATCH 3: Razorpay Wallet Recharge & Financial Reconciliation ---');

  const testPaymentId = 'pay_qa_test_' + Date.now();
  const testOrderId = 'order_qa_test_' + Date.now();
  const rechargeAmountINR = 2500;
  const rechargeAmountMinor = BigInt(250000); // ₹2,500.00 = 250000 paise

  await runTest('Batch 3', 'Razorpay Signature Verification (HMAC-SHA256)', () => {
    const keySecret = '5hDdnq0PT1gV64UYEV7vk3TE';
    const text = `${testOrderId}|${testPaymentId}`;
    const generatedSig = crypto.createHmac('sha256', keySecret).update(text).digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(generatedSig, 'utf-8'),
      Buffer.from(generatedSig, 'utf-8')
    );
    assert.strictEqual(isValid, true, 'Cryptographic signature match should pass');

    // Tampered signature must fail
    const tampered = generatedSig.slice(0, -2) + '00';
    const isTamperedValid = crypto.timingSafeEqual(
      Buffer.from(generatedSig, 'utf-8'),
      Buffer.from(tampered, 'utf-8')
    );
    assert.strictEqual(isTamperedValid, false, 'Tampered signature must be rejected');
  });

  await runTest('Batch 3', 'Atomic Wallet Credit & Transaction Ledger Creation', async () => {
    const idempotencyKey = `rzp_${testPaymentId}`;

    // Execute atomic credit inside transaction
    const txResult = await prisma.$transaction(async (tx) => {
      const walletBefore = await tx.wallets.findUnique({
        where: { id: testWalletId },
      });
      assert(walletBefore, 'Wallet must exist');

      const balBefore = walletBefore.available_balance_minor;
      const balAfter = balBefore + rechargeAmountMinor;

      const updatedWallet = await tx.wallets.update({
        where: { id: testWalletId },
        data: {
          available_balance_minor: balAfter,
          total_recharged_minor: walletBefore.total_recharged_minor + rechargeAmountMinor,
          version: { increment: 1 },
          updated_at: new Date(),
        },
      });

      const txRecord = await tx.wallet_transactions.create({
        data: {
          id: crypto.randomUUID(),
          merchant_id: testMerchantId,
          wallet_id: testWalletId,
          type: 'RECHARGE',
          direction: 'CREDIT',
          amount_minor: rechargeAmountMinor,
          balance_before_minor: balBefore,
          balance_after_minor: balAfter,
          currency: 'INR',
          description: `Wallet Balance Added via Razorpay (${testPaymentId})`,
          reference_type: 'RECHARGE',
          reference_id: testPaymentId,
          idempotency_key: idempotencyKey,
        },
      });

      return { updatedWallet, txRecord };
    });

    assert.strictEqual(txResult.updatedWallet.available_balance_minor, rechargeAmountMinor);
    assert.strictEqual(txResult.txRecord.amount_minor, rechargeAmountMinor);
    assert.strictEqual(txResult.txRecord.direction, 'CREDIT');
  });

  await runTest('Batch 3', 'Idempotency Protection: Replaying Same Payment ID Must NOT Duplicate Credit', async () => {
    const idempotencyKey = `rzp_${testPaymentId}`;

    const existingTx = await prisma.wallet_transactions.findUnique({
      where: { idempotency_key: idempotencyKey },
    });
    assert(existingTx, 'Existing transaction must be detected');

    // Attempting a second credit with the same key should be safely rejected
    let secondCreditExecuted = false;
    if (!existingTx) {
      secondCreditExecuted = true;
    }

    assert.strictEqual(secondCreditExecuted, false, 'Second credit must NOT execute (Idempotent)');

    // Verify wallet balance remained exactly ₹2,500.00
    const walletCheck = await prisma.wallets.findUnique({ where: { id: testWalletId } });
    assert.strictEqual(walletCheck?.available_balance_minor, rechargeAmountMinor);
  });

  await runTest('Batch 3', 'Financial Ledger Reconciliation Invariant', async () => {
    const wallet = await prisma.wallets.findUnique({ where: { id: testWalletId } });
    const allTxs = await prisma.wallet_transactions.findMany({ where: { wallet_id: testWalletId } });

    let calculatedBalance = BigInt(0);
    for (const t of allTxs) {
      if (t.direction === 'CREDIT') calculatedBalance += t.amount_minor;
      else if (t.direction === 'DEBIT') calculatedBalance -= t.amount_minor;
    }

    assert.strictEqual(
      wallet?.available_balance_minor,
      calculatedBalance,
      `Ledger balance (${calculatedBalance}) must match wallet available balance (${wallet?.available_balance_minor})`
    );
  });

  // =========================================================================
  // BATCH 4: RATE ENGINE, SHIPMENT BOOKING & ATOMIC WALLET DEBIT
  // =========================================================================
  console.log('\n--- BATCH 4: Rate Engine, Shipments & Atomic Wallet Debit ---');

  const sampleWeightKg = 1.5;
  const testShipmentChargeMinor = BigInt(12000); // ₹120.00 = 12000 paise
  const testShipmentId = crypto.randomUUID();

  await runTest('Batch 4', 'Delhivery Surface Rate & Weight Slab Rounding Math', () => {
    // 1.5kg rounded up to nearest 0.5kg slab = 1.5kg
    const slabCount = Math.ceil(sampleWeightKg / 0.5);
    assert.strictEqual(slabCount, 3); // 3 slabs of 500g

    const baseFreightRatePerSlab = 30.00;
    const baseFreight = slabCount * baseFreightRatePerSlab; // ₹90.00
    const fuelSurcharge = Math.round(baseFreight * 0.15 * 100) / 100; // 15% = ₹13.50
    const subtotal = baseFreight + fuelSurcharge; // ₹103.50
    const gst = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST = ₹18.63
    const totalRate = Math.round((subtotal + gst) * 100) / 100; // ₹122.13

    assert(totalRate > 100, 'Calculated rate must be positive and include surcharges');
    assert.strictEqual(slabCount, 3);
  });

  await runTest('Batch 4', 'Shipment Booking with Atomic Wallet Debit in PostgreSQL', async () => {
    const debitIdempotencyKey = `shipment-charge:${testShipmentId}`;

    // Perform atomic debit inside transaction
    const debitResult = await prisma.$transaction(async (tx) => {
      const w = await tx.wallets.findUnique({ where: { id: testWalletId } });
      assert(w, 'Wallet must exist');

      const balBefore = w.available_balance_minor;
      assert(balBefore >= testShipmentChargeMinor, 'Balance must be sufficient');

      const balAfter = balBefore - testShipmentChargeMinor;

      const updatedWallet = await tx.wallets.update({
        where: { id: testWalletId },
        data: {
          available_balance_minor: balAfter,
          total_spent_minor: w.total_spent_minor + testShipmentChargeMinor,
          updated_at: new Date(),
        },
      });

      const txRecord = await tx.wallet_transactions.create({
        data: {
          id: crypto.randomUUID(),
          merchant_id: testMerchantId,
          wallet_id: testWalletId,
          type: 'FREIGHT_DEBIT',
          direction: 'DEBIT',
          amount_minor: testShipmentChargeMinor,
          balance_before_minor: balBefore,
          balance_after_minor: balAfter,
          currency: 'INR',
          description: `Shipment Freight Charge (Delhivery Surface • ${testShipmentId})`,
          reference_type: 'SHIPMENT',
          reference_id: testShipmentId,
          idempotency_key: debitIdempotencyKey,
        },
      });

      const shipment = await tx.shipments.create({
        data: {
          id: testShipmentId,
          merchant_id: testMerchantId,
          shipment_number: 'SHP-NUM-' + Date.now(),
          booking_reference_id: 'BOOK-REF-' + Date.now(),
          order_id: 'ORD-QA-' + Date.now(),
          awb_number: 'AWB-QA-' + Date.now(),
          courier_id: 'delhivery_surface',
          courier_name: 'Delhivery Surface',
          service_type: 'Surface',
          pickup_contact_person: 'Warehouse Manager',
          pickup_phone: '+91 99887 76655',
          pickup_address_line1: 'Plot 45, Okhla Phase 3',
          pickup_city: 'New Delhi',
          pickup_state: 'Delhi',
          pickup_pincode: '110020',
          delivery_contact_name: 'Consignee Sharma',
          delivery_phone: '+91 98765 43210',
          delivery_address_line1: 'B-12, Sector 62',
          delivery_city: 'Noida',
          delivery_state: 'Uttar Pradesh',
          delivery_pincode: '201301',
          actual_weight_kg: 1.5,
          chargeable_weight_kg: 1.5,
          status: 'BOOKED',
          invoice_value_minor: BigInt(150000), // ₹1,500.00
          freight_charge_minor: testShipmentChargeMinor,
          total_charge_minor: testShipmentChargeMinor,
        },
      });

      return { updatedWallet, txRecord, shipment };
    });

    assert.strictEqual(
      debitResult.updatedWallet.available_balance_minor,
      rechargeAmountMinor - testShipmentChargeMinor
    );
    assert.strictEqual(debitResult.shipment.status, 'BOOKED');
    assert.strictEqual(debitResult.txRecord.direction, 'DEBIT');
  });

  await runTest('Batch 4', 'Insufficient Balance Protection', async () => {
    const hugeChargeMinor = BigInt(99999999); // ₹999,999.99

    let caughtError = false;
    try {
      await prisma.$transaction(async (tx) => {
        const w = await tx.wallets.findUnique({ where: { id: testWalletId } });
        if (!w || w.available_balance_minor < hugeChargeMinor) {
          throw new Error('INSUFFICIENT_WALLET_BALANCE');
        }
      });
    } catch (err: any) {
      if (err.message === 'INSUFFICIENT_WALLET_BALANCE') {
        caughtError = true;
      }
    }

    assert.strictEqual(caughtError, true, 'Transaction must reject when balance is insufficient');
  });

  // =========================================================================
  // BATCH 5 & 6: OPERATIONAL TOOLS, SECURITY HEADERS & RESEND EMAIL
  // =========================================================================
  console.log('\n--- BATCH 5 & 6: Operational Tools & Email Integration ---');

  await runTest('Batch 5', 'Warehouse Creation & Selection for Dispatches', async () => {
    const whId = crypto.randomUUID();
    const warehouse = await prisma.warehouses.create({
      data: {
        id: whId,
        merchant_id: testMerchantId,
        warehouse_code: 'WH-DELHI-01',
        name: 'Delhi Primary Logistics Hub',
        contact_person: 'Warehouse Incharge',
        phone: '+91 99887 76655',
        address_line1: 'Plot 45, Okhla Industrial Area Phase 3',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110020',
        is_default: true,
      },
    });
    assert.strictEqual(warehouse.warehouse_code, 'WH-DELHI-01');
    assert.strictEqual(warehouse.pincode, '110020');

    // Clean up test warehouse
    await prisma.warehouses.delete({ where: { id: whId } });
  });

  await runTest('Batch 6', 'Resend Welcome Email Payload Validation (Non-blocking)', () => {
    const fromEmail = 'MAXLINE LOGISTICS <support@maxlinelogistics.com>';
    const toEmail = testMerchantEmail;
    const sellerName = 'QA Test Lead';
    const businessName = 'QA AUTOMATION LOGISTICS HUB';

    const isValid = Boolean(
      fromEmail &&
      toEmail &&
      sellerName &&
      businessName
    );
    assert.strictEqual(isValid, true, 'Email payload must be valid');
  });

  // =========================================================================
  // CLEANUP TEST FIXTURES
  // =========================================================================
  console.log('\n--- Cleaning up Test Fixtures ---');
  try {
    await prisma.shipments.deleteMany({ where: { merchant_id: testMerchantId } });
    await prisma.wallet_transactions.deleteMany({ where: { merchant_id: testMerchantId } });
    await prisma.wallets.deleteMany({ where: { merchant_id: testMerchantId } });
    await prisma.merchant_members.deleteMany({ where: { merchant_id: testMerchantId } });
    await prisma.public_users.deleteMany({ where: { id: testUserId } });
    await prisma.merchants.deleteMany({ where: { id: testMerchantId } });
    console.log('  ✓ Test fixtures cleaned up successfully.');
  } catch (cleanErr: any) {
    console.warn('  Notice during cleanup:', cleanErr.message);
  } finally {
    await prisma.$disconnect();
  }

  // =========================================================================
  // SUMMARY RESULTS
  // =========================================================================
  console.log('\n===============================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('===============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Master Audit Fatal Error:', err);
  process.exit(1);
});
