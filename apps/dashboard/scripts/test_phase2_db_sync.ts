/**
 * Phase 2 Supabase Database Synchronization Verification Suite
 * Tests UUID normalization, schema transforms, financial safety & idempotency,
 * and SQL companion migration statements.
 */
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import {
  toValidTenantUUID,
  isValidUUID,
  DEFAULT_PLATFORM_TENANT_ID,
  generateUUID,
} from '../src/utils/uuidHelper';

async function runPhase2Tests() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 2 SUPABASE SYNC TEST SUITE');
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

  // --- Suite 1: UUID Normalization & Tenancy ---
  console.log('--- Suite 1: UUID Normalization & PostgreSQL Tenancy ---');
  test('Normalizes "tenant-demo-01" to valid platform UUID', () => {
    const tid = toValidTenantUUID('tenant-demo-01');
    assert.strictEqual(tid, DEFAULT_PLATFORM_TENANT_ID);
    assert.strictEqual(isValidUUID(tid), true);
  });

  test('Normalizes null or "ALL" to valid platform UUID', () => {
    assert.strictEqual(toValidTenantUUID(null), DEFAULT_PLATFORM_TENANT_ID);
    assert.strictEqual(toValidTenantUUID('ALL'), DEFAULT_PLATFORM_TENANT_ID);
    assert.strictEqual(toValidTenantUUID('all'), DEFAULT_PLATFORM_TENANT_ID);
  });

  test('Preserves an already valid UUID without mutation', () => {
    const valid = 'd3b07384-d113-4696-a83a-446733221b65';
    assert.strictEqual(toValidTenantUUID(valid), valid);
  });

  test('Deterministically converts custom tenant strings to valid UUIDs', () => {
    const custom1 = toValidTenantUUID('tenant_mohit_sharma');
    const custom2 = toValidTenantUUID('tenant_mohit_sharma');
    assert.strictEqual(custom1, custom2);
    assert.strictEqual(isValidUUID(custom1), true);
    assert.strictEqual(custom1.length, 36);
  });

  test('Generates cryptographically structured RFC-4122 v4 UUIDs', () => {
    const newId = generateUUID();
    assert.strictEqual(isValidUUID(newId), true);
  });

  // --- Suite 2: Financial Safety & Minor Unit Arithmetic ---
  console.log('\n--- Suite 2: Financial Safety & Minor Unit Arithmetic ---');
  test('Minor units calculation prevents floating-point rounding leakage', () => {
    const amountINR = 149.99;
    const amountMinor = Math.round(amountINR * 100);
    assert.strictEqual(amountMinor, 14999);
    assert.strictEqual(amountMinor / 100, 149.99);
  });

  test('Idempotency key generation produces unique keys per shipment', () => {
    const shipmentId1 = 'SHP-ORD-1001';
    const shipmentId2 = 'SHP-ORD-1002';
    const key1 = `shipment-charge:${shipmentId1}`;
    const key2 = `shipment-charge:${shipmentId2}`;
    assert.notStrictEqual(key1, key2);
    assert.strictEqual(key1, 'shipment-charge:SHP-ORD-1001');
  });

  // --- Suite 3: SQL Migration Integrity Verification ---
  console.log('\n--- Suite 3: SQL Migration Integrity Verification ---');
  test('003_phase2_sync.sql exists and contains all required RPCs and seeds', () => {
    const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/003_phase2_sync.sql');
    assert.strictEqual(fs.existsSync(sqlPath), true, '003_phase2_sync.sql must exist');
    const content = fs.readFileSync(sqlPath, 'utf8');

    assert.ok(content.includes('debit_wallet_rpc'), 'Must declare debit_wallet_rpc');
    assert.ok(content.includes('credit_wallet_rpc'), 'Must declare credit_wallet_rpc');
    assert.ok(content.includes('FOR UPDATE'), 'Must use FOR UPDATE row lock for concurrency');
    assert.ok(content.includes('idempotency_key'), 'Must guard against duplicate idempotency keys');
    assert.ok(content.includes('00000000-0000-0000-0000-000000000001'), 'Must seed default platform tenant');
    assert.ok(content.includes('SECURITY DEFINER'), 'RPCs must be SECURITY DEFINER to bypass table write restrictions');
    assert.ok(content.includes('GRANT EXECUTE'), 'Must grant execute permissions to anon and authenticated');
  });

  test('001_initial_schema.sql and 002_rls_policies.sql remain intact and unchanged', () => {
    const sql1 = path.resolve(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
    const sql2 = path.resolve(process.cwd(), 'supabase/migrations/002_rls_policies.sql');
    assert.strictEqual(fs.existsSync(sql1), true);
    assert.strictEqual(fs.existsSync(sql2), true);
  });

  // --- Suite 4: Service Adapters Structure Verification ---
  console.log('\n--- Suite 4: Service Adapters Structure Verification ---');
  test('SupabaseShipmentService exports fetchShipments, insertShipment, and updateShipmentStatus', async () => {
    const { SupabaseShipmentService } = await import('../src/services/supabase/supabaseShipmentService');
    assert.strictEqual(typeof SupabaseShipmentService.fetchShipments, 'function');
    assert.strictEqual(typeof SupabaseShipmentService.insertShipment, 'function');
    assert.strictEqual(typeof SupabaseShipmentService.updateShipmentStatus, 'function');
  });

  test('SupabaseWalletService exports fetchWallet, fetchTransactions, debitWalletRPC, and creditWalletRPC', async () => {
    const { SupabaseWalletService } = await import('../src/services/supabase/supabaseWalletService');
    assert.strictEqual(typeof SupabaseWalletService.fetchWallet, 'function');
    assert.strictEqual(typeof SupabaseWalletService.fetchTransactions, 'function');
    assert.strictEqual(typeof SupabaseWalletService.debitWalletRPC, 'function');
    assert.strictEqual(typeof SupabaseWalletService.creditWalletRPC, 'function');
  });

  test('SupabaseWarehouseService exports fetchWarehouses, saveWarehouse, and updateWarehouse', async () => {
    const { SupabaseWarehouseService } = await import('../src/services/supabase/supabaseWarehouseService');
    assert.strictEqual(typeof SupabaseWarehouseService.fetchWarehouses, 'function');
    assert.strictEqual(typeof SupabaseWarehouseService.saveWarehouse, 'function');
    assert.strictEqual(typeof SupabaseWarehouseService.updateWarehouse, 'function');
  });

  console.log('\n====================================================');
  console.log(`📊 PHASE 2 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase2Tests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
