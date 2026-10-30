/**
 * Phase 2 Multi-Tenant Warehouse & Pickup Management Test Suite
 * Tests multi-tenant isolation, zero demo leakage, transactional default assignment,
 * soft deactivation, immutable snapshot generation, and cross-tenant boundary protections.
 */
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import {
  CustomerWarehouseService,
  lookupPincodeDetails,
} from '../src/services/customerWarehouseService';
import { toValidTenantUUID, isValidUUID } from '../src/utils/uuidHelper';

async function runWarehouseTests() {
  console.log('====================================================');
  console.log('🏬 RUNNING PHASE 2 WAREHOUSE MANAGEMENT TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}\n     ${err.message}`);
      failed++;
    }
  }

  // --- Suite 1: Multi-Tenant Boundary & Zero Demo Leakage ---
  console.log('--- Suite 1: Multi-Tenant Boundary & Zero Demo Leakage ---');
  const freshTenantA = 'a1111111-1111-4111-8111-111111111111';
  const freshTenantB = 'b2222222-2222-4222-8222-222222222222';
  const demoTenant = 'tenant-demo-01';

  test('New merchant tenant starts with 0 warehouses and no demo leaks', () => {
    const listA = CustomerWarehouseService.getWarehouses(freshTenantA);
    assert.strictEqual(listA.length, 0, 'Fresh tenant must have 0 warehouses');

    const defaultA = CustomerWarehouseService.getDefaultWarehouse(freshTenantA);
    assert.strictEqual(defaultA, null, 'Fresh tenant default warehouse must be null, never demo warehouse');

    const activeA = CustomerWarehouseService.getActiveWarehouses(freshTenantA);
    assert.strictEqual(activeA.length, 0, 'Fresh tenant active list must be empty');
  });

  test('Demo tenant preserves its demo warehouses without leaking to other tenants', () => {
    const demoWarehouses = CustomerWarehouseService.getWarehouses(demoTenant);
    assert.ok(demoWarehouses.length > 0, 'Demo tenant retains its sample hubs');
    assert.ok(demoWarehouses.every((w) => w.tenantId === demoTenant), 'All demo hubs belong strictly to demo tenant');

    const defaultDemo = CustomerWarehouseService.getDefaultWarehouse(demoTenant);
    assert.ok(defaultDemo !== null, 'Demo tenant has a default');
    assert.strictEqual(defaultDemo?.tenantId, demoTenant);
  });

  // --- Suite 2: Auto-Default and Default Switching Logic ---
  console.log('\n--- Suite 2: Auto-Default and Default Switching Logic ---');

  let whA1Id = '';
  let whA2Id = '';
  let whA3Id = '';

  test('Adding the first warehouse for a tenant automatically marks it as DEFAULT', () => {
    const res1 = CustomerWarehouseService.addWarehouse({
      tenantId: freshTenantA,
      warehouseName: 'Tenant A Primary Hub',
      contactPerson: 'Alice Merchant',
      phone: '+91 91234 56780',
      addressLine1: 'Building 1, Tech Park',
      pincode: '560001',
      city: 'Bangalore',
      state: 'Karnataka',
    });

    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.warehouse.isDefault, true, 'First warehouse must auto-become default');
    assert.strictEqual(res1.warehouse.status, 'ACTIVE');
    whA1Id = res1.warehouse.id;

    const currentDefault = CustomerWarehouseService.getDefaultWarehouse(freshTenantA);
    assert.strictEqual(currentDefault?.id, whA1Id);
  });

  test('Adding a second warehouse with isDefault=false preserves first as default', () => {
    const res2 = CustomerWarehouseService.addWarehouse({
      tenantId: freshTenantA,
      warehouseName: 'Tenant A Secondary Hub',
      contactPerson: 'Bob Dispatch',
      phone: '+91 91234 56781',
      addressLine1: 'Plot 4, MIDC Area',
      pincode: '400001',
      city: 'Mumbai',
      state: 'Maharashtra',
      isDefault: false,
    });

    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.warehouse.isDefault, false);
    whA2Id = res2.warehouse.id;

    const currentDefault = CustomerWarehouseService.getDefaultWarehouse(freshTenantA);
    assert.strictEqual(currentDefault?.id, whA1Id, 'Primary must remain default');
  });

  test('Adding a third warehouse with isDefault=true resets previous defaults', () => {
    const res3 = CustomerWarehouseService.addWarehouse({
      tenantId: freshTenantA,
      warehouseName: 'Tenant A North Hub',
      contactPerson: 'Charlie Depot',
      phone: '+91 91234 56782',
      addressLine1: 'Shop 10, Connaught Place',
      pincode: '110001',
      city: 'New Delhi',
      state: 'Delhi',
      isDefault: true,
    });

    assert.strictEqual(res3.success, true);
    assert.strictEqual(res3.warehouse.isDefault, true);
    whA3Id = res3.warehouse.id;

    const currentDefault = CustomerWarehouseService.getDefaultWarehouse(freshTenantA);
    assert.strictEqual(currentDefault?.id, whA3Id, 'Newly added warehouse with isDefault: true must become default');

    // Verify whA1 is no longer default
    const wh1 = CustomerWarehouseService.getWarehouseById(whA1Id, freshTenantA);
    assert.strictEqual(wh1?.isDefault, false, 'Previous default must be reset to false');
  });

  test('Explicit setDefaultWarehouse switches default atomically', () => {
    const switchRes = CustomerWarehouseService.setDefaultWarehouse(whA2Id, freshTenantA);
    assert.strictEqual(switchRes.success, true);

    const currentDefault = CustomerWarehouseService.getDefaultWarehouse(freshTenantA);
    assert.strictEqual(currentDefault?.id, whA2Id, 'whA2 must now be default');

    const wh1 = CustomerWarehouseService.getWarehouseById(whA1Id, freshTenantA);
    const wh3 = CustomerWarehouseService.getWarehouseById(whA3Id, freshTenantA);
    assert.strictEqual(wh1?.isDefault, false);
    assert.strictEqual(wh3?.isDefault, false);
  });

  // --- Suite 3: Soft Deactivation vs Deletion ---
  console.log('\n--- Suite 3: Soft Deactivation & Default Reassignment ---');

  test('Deactivating the current default hub unsets default and reassigns to next active hub', () => {
    // Currently whA2 is default. Let's deactivate it.
    const deactRes = CustomerWarehouseService.deactivateWarehouse(whA2Id, freshTenantA);
    assert.strictEqual(deactRes.success, true);

    const wh2 = CustomerWarehouseService.getWarehouseById(whA2Id, freshTenantA);
    assert.strictEqual(wh2?.status, 'INACTIVE');
    assert.strictEqual(wh2?.isDefault, false, 'Deactivated warehouse cannot be default');

    // Remaining active hubs are whA1 and whA3. One of them must now be default.
    const currentDefault = CustomerWarehouseService.getDefaultWarehouse(freshTenantA);
    assert.ok(currentDefault !== null, 'A remaining active hub must be auto-assigned default');
    assert.strictEqual(currentDefault?.status, 'ACTIVE');
    assert.notStrictEqual(currentDefault?.id, whA2Id);

    // Active list should only contain 2 hubs
    const activeHubs = CustomerWarehouseService.getActiveWarehouses(freshTenantA);
    assert.strictEqual(activeHubs.length, 2);
    assert.ok(!activeHubs.some((w) => w.id === whA2Id));
  });

  // --- Suite 4: Cross-Tenant Mutation & Access Protection ---
  console.log('\n--- Suite 4: Cross-Tenant Mutation & Access Protection ---');

  test('Tenant B cannot read Tenant A warehouses by ID', () => {
    const forbidden = CustomerWarehouseService.getWarehouseById(whA1Id, freshTenantB);
    assert.strictEqual(forbidden, null, 'Cross-tenant lookup must return null');
  });

  test('Tenant B cannot set Tenant A warehouse as default', () => {
    const hijackAttempt = CustomerWarehouseService.setDefaultWarehouse(whA1Id, freshTenantB);
    assert.strictEqual(hijackAttempt.success, false, 'Cross-tenant setDefault must fail');
  });

  test('Tenant B cannot deactivate Tenant A warehouse', () => {
    const deactAttempt = CustomerWarehouseService.deactivateWarehouse(whA1Id, freshTenantB);
    assert.strictEqual(deactAttempt.success, false, 'Cross-tenant deactivation must fail');

    // Confirm whA1 status is unchanged
    const wh1 = CustomerWarehouseService.getWarehouseById(whA1Id, freshTenantA);
    assert.strictEqual(wh1?.status, 'ACTIVE');
  });

  // --- Suite 5: Pincode Auto-Resolution & Normalization ---
  console.log('\n--- Suite 5: Pincode Auto-Resolution & Normalization ---');

  test('Resolves Delhi pincodes correctly', () => {
    const loc = lookupPincodeDetails('110001');
    assert.strictEqual(loc.city, 'New Delhi');
    assert.strictEqual(loc.state, 'Delhi');
  });

  test('Resolves Mumbai pincodes correctly', () => {
    const loc = lookupPincodeDetails('400001');
    assert.strictEqual(loc.city, 'Mumbai');
    assert.strictEqual(loc.state, 'Maharashtra');
  });

  test('Resolves Bangalore pincodes correctly', () => {
    const loc = lookupPincodeDetails('560001');
    assert.strictEqual(loc.city, 'Bangalore');
    assert.strictEqual(loc.state, 'Karnataka');
  });

  test('Pincode non-digit characters are stripped on warehouse creation', () => {
    const res = CustomerWarehouseService.addWarehouse({
      tenantId: freshTenantB,
      warehouseName: 'Tenant B Hub with Pincode Spacing',
      contactPerson: 'Bob B',
      phone: '+91 99999 88888',
      addressLine1: 'Some Road',
      pincode: ' 400 001 ',
      city: 'Mumbai',
      state: 'Maharashtra',
    });
    assert.strictEqual(res.warehouse.pincode, '400001', 'Pincode must be stripped of whitespace/non-digits');
  });

  // --- Suite 6: Immutable Snapshot Creation ---
  console.log('\n--- Suite 6: Immutable Snapshot Creation ---');

  test('Creates an immutable pickup snapshot with frozenAt timestamp', () => {
    const snapshot = CustomerWarehouseService.createWarehouseSnapshot(whA1Id, freshTenantA);
    assert.ok(snapshot !== null, 'Snapshot must be created');
    assert.strictEqual(snapshot?.warehouseId, whA1Id);
    assert.strictEqual(snapshot?.city, 'Bangalore');
    assert.strictEqual(snapshot?.contactPerson, 'Alice Merchant');
    assert.ok(snapshot?.frozenAt, 'Snapshot must have frozenAt timestamp');

    // Mutate the active warehouse
    CustomerWarehouseService.updateWarehouse(whA1Id, { contactPerson: 'Alice Changed' }, freshTenantA);

    // Old snapshot remains unmodified
    assert.strictEqual(snapshot?.contactPerson, 'Alice Merchant', 'Previous snapshot must remain unchanged');
  });

  // --- Suite 7: Database & SQL Migration Verification ---
  console.log('\n--- Suite 7: Database Migration & RLS Verification ---');

  test('001_initial_schema.sql contains warehouses table with tenant_id foreign key', () => {
    const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
    assert.ok(fs.existsSync(sqlPath));
    const content = fs.readFileSync(sqlPath, 'utf8');
    assert.ok(content.includes('CREATE TABLE IF NOT EXISTS warehouses'), 'Must create warehouses table');
    assert.ok(content.includes('tenant_id UUID NOT NULL REFERENCES tenants(id)'), 'Must enforce tenant foreign key');
  });

  test('002_rls_policies.sql enforces tenant isolation RLS on warehouses', () => {
    const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/002_rls_policies.sql');
    assert.ok(fs.existsSync(sqlPath));
    const content = fs.readFileSync(sqlPath, 'utf8');
    assert.ok(content.includes('ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY'), 'Must enable RLS');
    assert.ok(content.includes('CREATE POLICY warehouses_select_policy ON warehouses'), 'Must define select policy');
    assert.ok(content.includes('CREATE POLICY warehouses_insert_policy ON warehouses'), 'Must define insert policy');
    assert.ok(content.includes('CREATE POLICY warehouses_update_policy ON warehouses'), 'Must define update policy');
    assert.ok(content.includes('CREATE POLICY warehouses_delete_policy ON warehouses'), 'Must define delete policy');
  });

  test('003_phase2_sync.sql adds status, pickup_start_time, pickup_end_time, and warehouse_code', () => {
    const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/003_phase2_sync.sql');
    assert.ok(fs.existsSync(sqlPath));
    const content = fs.readFileSync(sqlPath, 'utf8');
    assert.ok(content.includes('ADD COLUMN IF NOT EXISTS warehouse_code'), 'Must add warehouse_code');
    assert.ok(content.includes('ADD COLUMN IF NOT EXISTS pickup_start_time'), 'Must add pickup_start_time');
    assert.ok(content.includes('ADD COLUMN IF NOT EXISTS pickup_end_time'), 'Must add pickup_end_time');
    assert.ok(content.includes('ADD COLUMN IF NOT EXISTS status'), 'Must add status');
  });

  // --- Summary ---
  console.log('\n====================================================');
  console.log(`📊 PHASE 2 WAREHOUSE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runWarehouseTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
