/**
 * Phase 3 Real Courier Booking & Supabase Execution Test Suite
 * Tests end-to-end booking validation, wallet sufficiency checks, atomic wallet debit,
 * idempotency & double-charge defense, pickup warehouse linking, and multi-tenant isolation.
 */
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { CustomerBookingService } from '../src/services/customerBookingService';
import { CustomerShipmentService } from '../src/services/customerShipmentService';
import { CustomerWarehouseService } from '../src/services/customerWarehouseService';
import { WalletService } from '../src/mocks/wallet.mock';

async function runPhase3Tests() {
  console.log('====================================================');
  console.log('📦 RUNNING PHASE 3 COURIER BOOKING & WALLET TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}\n     ${err.message}`);
      failed++;
    }
  }

  const tenantA = '33333333-3333-4333-8333-333333333333';
  const tenantB = '44444444-4444-4444-8444-444444444444';

  // --- Suite 1: Booking Validation & Defensive Guardrails ---
  console.log('--- Suite 1: Booking Validation & Defensive Guardrails ---');

  await test('Rejects booking when tenantId is missing', async () => {
    const res = await CustomerBookingService.bookShipmentWithWalletDebit({
      tenantId: '',
      orderId: 'ORD-9901',
      customerName: 'Test Receiver',
      customerPhone: '9876543210',
      shipmentType: 'b2c',
      pickupContactName: 'Warehouse Manager',
      pickupPhone: '9876543211',
      pickupAddressLine1: 'Warehouse 1',
      pickupCity: 'Bangalore',
      pickupPincode: '560001',
      deliveryContactName: 'Consignee',
      deliveryPhone: '9876543212',
      deliveryAddressLine1: 'Consignee Address',
      deliveryCity: 'Mumbai',
      deliveryState: 'Maharashtra',
      deliveryPincode: '400001',
      invoiceValueINR: 500,
      paymentMode: 'prepaid',
      packages: [],
      actualWeightKg: 0.5,
      chargeableWeightKg: 0.5,
      courierId: 'delhivery',
      courierName: 'Delhivery Surface',
      serviceName: 'Surface Express',
      baseFreightINR: 80,
      fuelSurchargeINR: 10,
      codFeeINR: 0,
      insuranceFeeINR: 0,
      gstINR: 16.2,
      shippingChargeINR: 106.2,
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.reason, 'VALIDATION_FAILED');
  });

  await test('Rejects booking when origin pincode is invalid', async () => {
    const res = await CustomerBookingService.bookShipmentWithWalletDebit({
      tenantId: tenantA,
      orderId: 'ORD-9902',
      customerName: 'Test Receiver',
      customerPhone: '9876543210',
      shipmentType: 'b2c',
      pickupContactName: 'Manager',
      pickupPhone: '9876543211',
      pickupAddressLine1: 'Origin St',
      pickupCity: 'City',
      pickupPincode: '123', // Invalid pincode
      deliveryContactName: 'Consignee',
      deliveryPhone: '9876543212',
      deliveryAddressLine1: 'Consignee St',
      deliveryCity: 'Mumbai',
      deliveryState: 'Maharashtra',
      deliveryPincode: '400001',
      invoiceValueINR: 500,
      paymentMode: 'prepaid',
      packages: [],
      actualWeightKg: 0.5,
      chargeableWeightKg: 0.5,
      courierId: 'delhivery',
      courierName: 'Delhivery Surface',
      serviceName: 'Surface Express',
      baseFreightINR: 80,
      fuelSurchargeINR: 10,
      codFeeINR: 0,
      insuranceFeeINR: 0,
      gstINR: 16.2,
      shippingChargeINR: 106.2,
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.reason, 'VALIDATION_FAILED');
  });

  await test('Rejects booking when delivery pincode is invalid', async () => {
    const res = await CustomerBookingService.bookShipmentWithWalletDebit({
      tenantId: tenantA,
      orderId: 'ORD-9903',
      customerName: 'Test Receiver',
      customerPhone: '9876543210',
      shipmentType: 'b2c',
      pickupContactName: 'Manager',
      pickupPhone: '9876543211',
      pickupAddressLine1: 'Origin St',
      pickupCity: 'City',
      pickupPincode: '560001',
      deliveryContactName: 'Consignee',
      deliveryPhone: '9876543212',
      deliveryAddressLine1: 'Consignee St',
      deliveryCity: 'Mumbai',
      deliveryState: 'Maharashtra',
      deliveryPincode: 'INVALID', // Invalid pincode
      invoiceValueINR: 500,
      paymentMode: 'prepaid',
      packages: [],
      actualWeightKg: 0.5,
      chargeableWeightKg: 0.5,
      courierId: 'delhivery',
      courierName: 'Delhivery Surface',
      serviceName: 'Surface Express',
      baseFreightINR: 80,
      fuelSurchargeINR: 10,
      codFeeINR: 0,
      insuranceFeeINR: 0,
      gstINR: 16.2,
      shippingChargeINR: 106.2,
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.reason, 'VALIDATION_FAILED');
  });

  // --- Suite 2: Wallet Sufficiency & Insufficient Balance Defense ---
  console.log('\n--- Suite 2: Wallet Sufficiency & Insufficient Balance Defense ---');

  await test('Fresh tenant starts with ₹0.00 wallet balance', () => {
    const wal = WalletService.getWallet(tenantA);
    assert.strictEqual(wal.availableBalanceMinor, 0, 'Fresh merchant must start at ₹0');
  });

  await test('Rejects booking when wallet balance is insufficient', async () => {
    const res = await CustomerBookingService.bookShipmentWithWalletDebit({
      tenantId: tenantA,
      orderId: 'ORD-9904',
      customerName: 'Alice Buyer',
      customerPhone: '9876543210',
      shipmentType: 'b2c',
      pickupContactName: 'Origin Dispatch',
      pickupPhone: '9876543211',
      pickupAddressLine1: 'Warehouse Hub',
      pickupCity: 'Bangalore',
      pickupPincode: '560001',
      deliveryContactName: 'Alice Buyer',
      deliveryPhone: '9876543210',
      deliveryAddressLine1: 'Apartment 4B',
      deliveryCity: 'Mumbai',
      deliveryState: 'Maharashtra',
      deliveryPincode: '400001',
      invoiceValueINR: 1200,
      paymentMode: 'prepaid',
      packages: [
        {
          id: 'pkg-1',
          packageNumber: 1,
          actualWeightKg: 1.0,
          lengthCm: 20,
          widthCm: 15,
          heightCm: 10,
          volumetricWeightKg: 0.6,
          chargeableWeightKg: 1.0,
          quantity: 1,
        },
      ],
      actualWeightKg: 1.0,
      chargeableWeightKg: 1.0,
      courierId: 'delhivery',
      courierName: 'Delhivery Surface',
      serviceName: 'Surface Express',
      baseFreightINR: 120,
      fuelSurchargeINR: 15,
      codFeeINR: 0,
      insuranceFeeINR: 0,
      gstINR: 24.3,
      shippingChargeINR: 159.3,
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.reason, 'INSUFFICIENT_WALLET_BALANCE');
    assert.strictEqual(res.requiredAmountINR, 159.3);
    assert.strictEqual(res.availableBalanceINR, 0);

    // Verify wallet was NOT debited
    const walAfter = WalletService.getWallet(tenantA);
    assert.strictEqual(walAfter.availableBalanceMinor, 0);
  });

  // --- Suite 3: Successful Booking & Atomic Wallet Debit ---
  console.log('\n--- Suite 3: Successful Booking & Atomic Wallet Debit ---');

  let bookedShipmentId = '';
  let bookedWarehouseId = '';

  await test('Creates warehouse for Tenant A', () => {
    const whRes = CustomerWarehouseService.addWarehouse({
      tenantId: tenantA,
      warehouseName: 'Tenant A Primary Distribution Hub',
      contactPerson: 'Suresh Raina',
      phone: '+91 98765 11111',
      addressLine1: 'Plot 10, Industrial Phase 1',
      pincode: '560001',
      city: 'Bangalore',
      state: 'Karnataka',
      isDefault: true,
    });
    assert.strictEqual(whRes.success, true);
    bookedWarehouseId = whRes.warehouse.id;
  });

  await test('Recharging tenant wallet allows successful shipment booking', async () => {
    // Recharge ₹1,000.00
    WalletService.recharge(1000, 'TestPaymentProvider', tenantA);
    const wal = WalletService.getWallet(tenantA);
    assert.strictEqual(wal.availableBalanceMinor, 100000, 'Balance must be ₹1,000.00 (100,000 paise)');

    const res = await CustomerBookingService.bookShipmentWithWalletDebit({
      tenantId: tenantA,
      pickupWarehouseId: bookedWarehouseId,
      orderId: 'ORD-REAL-101',
      customerName: 'Priya Sharma',
      customerPhone: '9876543210',
      customerEmail: 'priya@example.com',
      shipmentType: 'b2c',
      pickupContactName: 'Suresh Raina',
      pickupPhone: '+91 98765 11111',
      pickupAddressLine1: 'Plot 10, Industrial Phase 1',
      pickupCity: 'Bangalore',
      pickupPincode: '560001',
      deliveryContactName: 'Priya Sharma',
      deliveryPhone: '9876543210',
      deliveryAddressLine1: 'Flat 101, Sunshine Heights',
      deliveryAddressLine2: 'Andheri West',
      deliveryCity: 'Mumbai',
      deliveryState: 'Maharashtra',
      deliveryPincode: '400001',
      invoiceNumber: 'INV-2026-001',
      invoiceDate: '2026-10-14',
      invoiceValueINR: 2500,
      paymentMode: 'prepaid',
      packages: [
        {
          id: 'pkg-1',
          packageNumber: 1,
          packageType: 'Box',
          actualWeightKg: 1.5,
          lengthCm: 25,
          widthCm: 20,
          heightCm: 15,
          volumetricWeightKg: 1.5,
          chargeableWeightKg: 1.5,
          quantity: 1,
        },
      ],
      actualWeightKg: 1.5,
      chargeableWeightKg: 1.5,
      courierId: 'delhivery',
      courierName: 'Delhivery Surface',
      serviceName: 'Surface Express Cargo',
      baseFreightINR: 160,
      fuelSurchargeINR: 20,
      codFeeINR: 0,
      insuranceFeeINR: 0,
      gstINR: 32.4,
      shippingChargeINR: 212.4, // Total: ₹212.40
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.shipmentId);
    assert.ok(res.awbNumber);
    assert.strictEqual(res.customerChargeINR, 212.4);
    assert.strictEqual(res.remainingBalanceINR, 787.6);
    bookedShipmentId = res.shipmentId!;

    // Verify wallet deduction in storage
    const walAfter = WalletService.getWallet(tenantA);
    assert.strictEqual(walAfter.availableBalanceMinor, 78760, 'Balance must be ₹787.60');
  });

  // --- Suite 4: Idempotency & Double Charge Defense ---
  console.log('\n--- Suite 4: Idempotency & Double Charge Defense ---');

  await test('Rejects duplicate wallet debit for the same shipment ID', () => {
    const dupRes = WalletService.debit(
      bookedShipmentId,
      'ORD-REAL-101',
      'delhivery',
      'Delhivery Surface',
      212.4,
      undefined,
      tenantA
    );

    assert.strictEqual(dupRes.success, false, 'Duplicate charge must be rejected');
    assert.ok(dupRes.message.includes('Double charge protection'));

    // Wallet balance must remain unchanged
    const wal = WalletService.getWallet(tenantA);
    assert.strictEqual(wal.availableBalanceMinor, 78760);
  });

  // --- Suite 5: Pickup Warehouse Link & Snapshot Persistence ---
  console.log('\n--- Suite 5: Pickup Warehouse Link & Snapshot Persistence ---');

  await test('Shipment stores pickupWarehouseId and pickup details', () => {
    const shipment = CustomerShipmentService.getShipmentById(bookedShipmentId, tenantA);
    assert.ok(shipment !== null, 'Shipment record must exist');
    assert.strictEqual(shipment?.pickupWarehouseId, bookedWarehouseId, 'Must link to correct warehouse');
    assert.strictEqual(shipment?.pickupCity, 'Bangalore');
    assert.strictEqual(shipment?.pickupPincode, '560001');
    assert.strictEqual(shipment?.bookingStatus, 'BOOKING_CONFIRMED');
    assert.ok(shipment?.trackingTimeline.length! > 0, 'Must have tracking timeline entry');
  });

  // --- Suite 6: Multi-Tenant Boundary Protection ---
  console.log('\n--- Suite 6: Multi-Tenant Boundary Protection ---');

  await test('Tenant B cannot access Tenant A booked shipment', () => {
    const forbidden = CustomerShipmentService.getShipmentById(bookedShipmentId, tenantB);
    assert.strictEqual(forbidden, null, 'Tenant B must receive null for Tenant A shipment');

    const tenantBList = CustomerShipmentService.getShipments(tenantB);
    assert.strictEqual(tenantBList.some((s) => s.shipmentId === bookedShipmentId), false);
  });

  // --- Suite 7: Database & SQL Schema Verification ---
  console.log('\n--- Suite 7: Database Migration & RPC Procedure Verification ---');

  await test('001_initial_schema.sql declares pickup_warehouse_id with foreign key', () => {
    const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
    assert.ok(fs.existsSync(sqlPath));
    const content = fs.readFileSync(sqlPath, 'utf8');
    assert.ok(content.includes('pickup_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL'));
    assert.ok(content.includes('CREATE TABLE IF NOT EXISTS shipment_status_history'));
  });

  await test('003_phase2_sync.sql declares debit_wallet_rpc with idempotency check', () => {
    const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/003_phase2_sync.sql');
    assert.ok(fs.existsSync(sqlPath));
    const content = fs.readFileSync(sqlPath, 'utf8');
    assert.ok(content.includes('CREATE OR REPLACE FUNCTION debit_wallet_rpc'));
    assert.ok(content.includes('idempotency_key = p_idempotency_key'));
    assert.ok(content.includes('FOR UPDATE'));
  });

  // --- Summary ---
  console.log('\n====================================================');
  console.log(`📊 PHASE 3 BOOKING TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
