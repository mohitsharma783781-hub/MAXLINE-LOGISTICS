/**
 * Phase 4 NDR & RTO Lifecycle Management Automated Test Suite
 * Tests tracking event ingestion, transition rules, duplicate prevention,
 * NDR exception workflows, action handlers (Reattempt, Address/Phone update,
 * COD to Prepaid conversion, Internal Notes, RTO trigger), RTO lifecycle tracking,
 * multi-tenant isolation guardrails, and database schema / RLS policies verification.
 */
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import {
  ShipmentTrackingNdrRtoService,
  type NdrReason,
  type RtoReason,
} from '../src/services/shipmentTrackingNdrRtoService';

async function runPhase4Tests() {
  console.log('====================================================');
  console.log('🛡️ RUNNING PHASE 4 NDR & RTO LIFECYCLE TEST SUITE');
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

  const tenantA = '55555555-5555-4555-8555-555555555555';
  const tenantB = '66666666-6666-4666-8666-666666666666';

  // Reset in-memory stores for clean test state
  ShipmentTrackingNdrRtoService._resetStoreForTesting();

  // --- Suite 1: Tracking Transitions, Ingestion & Deduplication ---
  console.log('--- Suite 1: Tracking Transitions, Ingestion & Deduplication ---');

  await test('Valid tracking status transitions are permitted', () => {
    const valid1 = ShipmentTrackingNdrRtoService.validateStatusTransition('BOOKED', 'PICKUP_REQUESTED');
    assert.strictEqual(valid1.valid, true);

    const valid2 = ShipmentTrackingNdrRtoService.validateStatusTransition('OUT_FOR_DELIVERY', 'DELIVERED');
    assert.strictEqual(valid2.valid, true);

    const valid3 = ShipmentTrackingNdrRtoService.validateStatusTransition('OUT_FOR_DELIVERY', 'NDR');
    assert.strictEqual(valid3.valid, true);

    const valid4 = ShipmentTrackingNdrRtoService.validateStatusTransition('NDR', 'OUT_FOR_DELIVERY');
    assert.strictEqual(valid4.valid, true);
  });

  await test('Invalid tracking status transitions are blocked with security lock reason', () => {
    const invalid1 = ShipmentTrackingNdrRtoService.validateStatusTransition('DELIVERED', 'BOOKED');
    assert.strictEqual(invalid1.valid, false);
    assert.match(invalid1.reason || '', /Security Lock/);

    const invalid2 = ShipmentTrackingNdrRtoService.validateStatusTransition('BOOKED', 'DELIVERED');
    assert.strictEqual(invalid2.valid, false);
  });

  await test('Duplicate tracking scan events are safely ignored and deduplicated', () => {
    const shipmentId = 'SHP-TRK-001';
    const awb = 'AWB-TRK-001';
    const timestamp = '2026-10-14 10:00:00';

    const scan1 = ShipmentTrackingNdrRtoService.addTrackingEvent({
      shipmentId,
      awbNumber: awb,
      courierId: 'delhivery',
      rawStatus: 'Shipment Picked Up',
      location: 'Bangalore Hub',
      city: 'Bangalore',
      description: 'Package scanned at origin hub',
      eventTime: timestamp,
      tenantId: tenantA,
    });
    assert.strictEqual(scan1.success, true);
    assert.match(scan1.message, /posted cleanly/);

    // Identical duplicate scan
    const scan2 = ShipmentTrackingNdrRtoService.addTrackingEvent({
      shipmentId,
      awbNumber: awb,
      courierId: 'delhivery',
      rawStatus: 'Shipment Picked Up',
      location: 'Bangalore Hub',
      city: 'Bangalore',
      description: 'Package scanned at origin hub',
      eventTime: timestamp,
      tenantId: tenantA,
    });
    assert.strictEqual(scan2.success, true);
    assert.match(scan2.message, /Duplicate tracking event safely ignored/);

    const events = ShipmentTrackingNdrRtoService.getTrackingEvents(shipmentId);
    assert.strictEqual(events.length, 1);
  });

  // --- Suite 2: NDR Exception Creation & Attempt Progression ---
  console.log('\n--- Suite 2: NDR Exception Creation & Attempt Progression ---');

  let ndrA1Id = '';
  await test('Posting NDR tracking scan automatically creates NDR record with attempt #1', () => {
    const scan = ShipmentTrackingNdrRtoService.addTrackingEvent({
      shipmentId: 'SHP-NDR-101',
      awbNumber: 'AWB-NDR-101',
      courierId: 'bluedart',
      rawStatus: 'Undelivered: Customer not available at address',
      location: 'South Delhi Hub',
      city: 'New Delhi',
      description: 'Door locked, delivery attempted',
      eventTime: '2026-10-14 11:30:00',
      tenantId: tenantA,
    });
    assert.strictEqual(scan.success, true);

    const records = ShipmentTrackingNdrRtoService.getNdrRecords(tenantA);
    const ndr = records.find((r) => r.shipmentId === 'SHP-NDR-101');
    assert.ok(ndr, 'NDR record should be created');
    assert.strictEqual(ndr.tenantId, tenantA);
    assert.strictEqual(ndr.attemptNumber, 1);
    assert.strictEqual(ndr.status, 'CUSTOMER_ACTION_REQUIRED');
    assert.strictEqual(ndr.attemptsHistory.length, 1);
    ndrA1Id = ndr.ndrId;
  });

  await test('Repeated delivery failure increments attempt number to #2 and preserves history', () => {
    ShipmentTrackingNdrRtoService.createNdrRecord({
      shipmentId: 'SHP-NDR-101',
      awbNumber: 'AWB-NDR-101',
      tenantId: tenantA,
      courierId: 'bluedart',
      courierName: 'Blue Dart Air',
      ndrReason: 'Customer unavailable',
      location: 'South Delhi Hub',
      rawStatus: 'Customer requested delivery next day',
    });

    const ndr = ShipmentTrackingNdrRtoService.getNdrById(ndrA1Id, tenantA);
    assert.ok(ndr);
    assert.strictEqual(ndr.attemptNumber, 2);
    assert.strictEqual(ndr.attemptsHistory.length, 2);
  });

  // --- Suite 3: NDR Resolution Action Handlers ---
  console.log('\n--- Suite 3: NDR Resolution Action Handlers ---');

  await test('Merchant can request reattempt with preferred delivery date and instructions', () => {
    const res = ShipmentTrackingNdrRtoService.requestReattempt({
      ndrId: ndrA1Id,
      actionType: 'REATTEMPT',
      preferredDeliveryDate: 'Tomorrow',
      deliveryInstructions: 'Call 9876543210 before coming',
      tenantId: tenantA,
    });
    assert.strictEqual(res.success, true);
    assert.match(res.message, /submitted to/i);

    const ndr = ShipmentTrackingNdrRtoService.getNdrById(ndrA1Id, tenantA);
    assert.ok(ndr);
    assert.strictEqual(ndr.status, 'REATTEMPT_REQUESTED');
    assert.strictEqual(ndr.preferredDeliveryDate, 'Tomorrow');
    assert.strictEqual(ndr.deliveryInstructions, 'Call 9876543210 before coming');
  });

  await test('Merchant can update consignee phone and address and schedule reattempt', () => {
    const res = ShipmentTrackingNdrRtoService.requestReattempt({
      ndrId: ndrA1Id,
      actionType: 'UPDATE_ADDRESS_PHONE',
      recipientName: 'Mohit Sharma',
      updatedPhone: '9811223344',
      updatedAddress: 'Flat 402, Sunshine Heights, Koramangala, Bangalore',
      tenantId: tenantA,
    });
    assert.strictEqual(res.success, true);
    assert.match(res.message, /updated/i);

    const ndr = ShipmentTrackingNdrRtoService.getNdrById(ndrA1Id, tenantA);
    assert.ok(ndr);
    assert.strictEqual(ndr.recipientName, 'Mohit Sharma');
    assert.strictEqual(ndr.updatedPhone, '9811223344');
    assert.strictEqual(ndr.updatedAddress, 'Flat 402, Sunshine Heights, Koramangala, Bangalore');
  });

  await test('Merchant can convert COD shipment to Prepaid and generate instant payment URL', () => {
    const res = ShipmentTrackingNdrRtoService.requestReattempt({
      ndrId: ndrA1Id,
      actionType: 'CONVERT_TO_PREPAID',
      tenantId: tenantA,
    });
    assert.strictEqual(res.success, true);
    assert.ok(res.paymentUrl, 'Payment URL should be generated');
    assert.match(res.paymentUrl, /cod-pay/);

    const ndr = ShipmentTrackingNdrRtoService.getNdrById(ndrA1Id, tenantA);
    assert.ok(ndr);
    assert.strictEqual(ndr.paymentTypeChange, 'CONVERT_TO_PREPAID');
    assert.strictEqual(ndr.paymentLinkSent, true);
    assert.strictEqual(ndr.paymentLinkUrl, res.paymentUrl);
  });

  await test('Merchant can attach internal audit notes to NDR case', () => {
    const res = ShipmentTrackingNdrRtoService.addInternalNote(
      ndrA1Id,
      'Spoke with customer; customer agreed to pay online upon arrival.',
      'Operations Agent',
      tenantA
    );
    assert.strictEqual(res.success, true);

    const ndr = ShipmentTrackingNdrRtoService.getNdrById(ndrA1Id, tenantA);
    assert.ok(ndr);
    const notes = (ndr as any).internalNotes;
    assert.ok(Array.isArray(notes));
    assert.strictEqual(notes.length, 1);
    assert.strictEqual(notes[0].note, 'Spoke with customer; customer agreed to pay online upon arrival.');
    assert.strictEqual(notes[0].user, 'Operations Agent');
  });

  await test('Merchant can initiate RTO return directly from NDR console', () => {
    const res = ShipmentTrackingNdrRtoService.requestReattempt({
      ndrId: ndrA1Id,
      actionType: 'RTO',
      tenantId: tenantA,
    });
    assert.strictEqual(res.success, true);
    assert.match(res.message, /RTO initiated/i);

    const ndr = ShipmentTrackingNdrRtoService.getNdrById(ndrA1Id, tenantA);
    assert.ok(ndr);
    assert.strictEqual(ndr.status, 'RTO_INITIATED');

    const rtos = ShipmentTrackingNdrRtoService.getRtoRecords(tenantA);
    const rto = rtos.find((r) => r.shipmentId === 'SHP-NDR-101');
    assert.ok(rto, 'RTO record should be created');
    assert.strictEqual(rto.status, 'RTO_INITIATED');
    assert.strictEqual(rto.tenantId, tenantA);
  });

  // --- Suite 4: Multi-Tenant Boundary Isolation & Attack Defense ---
  console.log('\n--- Suite 4: Multi-Tenant Boundary Isolation & Attack Defense ---');

  let ndrBId = '';
  await test('Setup Tenant B NDR record', () => {
    const ndrB = ShipmentTrackingNdrRtoService.createNdrRecord({
      shipmentId: 'SHP-TENANTB-201',
      awbNumber: 'AWB-TENANTB-201',
      tenantId: tenantB,
      courierId: 'delhivery',
      courierName: 'Delhivery Surface',
      ndrReason: 'Incomplete address',
      location: 'Whitefield Hub',
      rawStatus: 'Premises closed',
    });
    assert.ok(ndrB);
    assert.strictEqual(ndrB.tenantId, tenantB);
    ndrBId = ndrB.ndrId;
  });

  await test('Tenant A cannot list Tenant B NDR records', () => {
    const listA = ShipmentTrackingNdrRtoService.getNdrRecords(tenantA);
    const foundB = listA.find((n) => n.tenantId === tenantB);
    assert.strictEqual(foundB, undefined, 'Tenant A must never see Tenant B NDR records');

    const listB = ShipmentTrackingNdrRtoService.getNdrRecords(tenantB);
    assert.strictEqual(listB.length, 1);
    assert.strictEqual(listB[0].ndrId, ndrBId);
  });

  await test('Tenant A summary stats strictly reflect only Tenant A data', () => {
    const statsA = ShipmentTrackingNdrRtoService.getNdrSummaryStats(tenantA);
    const statsB = ShipmentTrackingNdrRtoService.getNdrSummaryStats(tenantB);

    assert.strictEqual(statsA.totalNdr, 1);
    assert.strictEqual(statsB.totalNdr, 1);
    assert.strictEqual(statsB.actionRequired, 1);

    const statsNonExistent = ShipmentTrackingNdrRtoService.getNdrSummaryStats('non-existent-tenant');
    assert.strictEqual(statsNonExistent.totalNdr, 0);
    assert.strictEqual(statsNonExistent.actionRequired, 0);
  });

  await test('Tenant A cannot read Tenant B NDR case by ID (Cross-tenant IDOR defense)', () => {
    const ndr = ShipmentTrackingNdrRtoService.getNdrById(ndrBId, tenantA);
    assert.strictEqual(ndr, null, 'Cross-tenant lookup by ID must return null');
  });

  await test('Tenant A cannot execute reattempt on Tenant B NDR case', () => {
    const res = ShipmentTrackingNdrRtoService.requestReattempt({
      ndrId: ndrBId,
      actionType: 'REATTEMPT',
      preferredDeliveryDate: 'Tomorrow',
      tenantId: tenantA, // Malicious spoof
    });
    assert.strictEqual(res.success, false);
    assert.match(res.message, /unauthorized/i);
  });

  await test('Tenant A cannot attach internal note to Tenant B NDR case', () => {
    const res = ShipmentTrackingNdrRtoService.addInternalNote(
      ndrBId,
      'Unauthorized injected note',
      'Hacker',
      tenantA
    );
    assert.strictEqual(res.success, false);
    assert.match(res.message, /unauthorized/i);

    const ndrB = ShipmentTrackingNdrRtoService.getNdrById(ndrBId, tenantB);
    assert.ok(ndrB);
    assert.strictEqual((ndrB as any).internalNotes, undefined);
  });

  // --- Suite 5: RTO Lifecycle & Reverse Logistics ---
  console.log('\n--- Suite 5: RTO Lifecycle & Reverse Logistics ---');

  let rtoBId = '';
  await test('initiateRto creates unique RTO with standard freight charge', () => {
    const rto = ShipmentTrackingNdrRtoService.initiateRto({
      shipmentId: 'SHP-TENANTB-201',
      awbNumber: 'AWB-TENANTB-201',
      tenantId: tenantB,
      courierId: 'delhivery',
      courierName: 'Delhivery Surface',
      rtoReason: 'Maximum delivery attempts reached',
    });
    assert.ok(rto);
    assert.strictEqual(rto.tenantId, tenantB);
    assert.strictEqual(rto.status, 'RTO_INITIATED');
    assert.strictEqual(rto.rtoChargeINR, 65.0);
    rtoBId = rto.rtoId;
  });

  await test('initiateRto is idempotent for the same shipment ID', () => {
    const rtoAgain = ShipmentTrackingNdrRtoService.initiateRto({
      shipmentId: 'SHP-TENANTB-201',
      awbNumber: 'AWB-TENANTB-201',
      tenantId: tenantB,
      courierId: 'delhivery',
      courierName: 'Delhivery Surface',
      rtoReason: 'Maximum delivery attempts reached',
    });
    assert.strictEqual(rtoAgain.rtoId, rtoBId, 'Must return existing RTO without creating duplicate');

    const listB = ShipmentTrackingNdrRtoService.getRtoRecords(tenantB);
    assert.strictEqual(listB.length, 1);
  });

  await test('RTO status transitions progressively from INITIATED -> IN_TRANSIT -> DELIVERED', () => {
    const t1 = ShipmentTrackingNdrRtoService.updateRtoStatus(rtoBId, 'RTO_IN_TRANSIT', tenantB);
    assert.strictEqual(t1.success, true);
    assert.strictEqual(t1.record?.status, 'RTO_IN_TRANSIT');

    const t2 = ShipmentTrackingNdrRtoService.updateRtoStatus(rtoBId, 'RTO_DELIVERED', tenantB);
    assert.strictEqual(t2.success, true);
    assert.strictEqual(t2.record?.status, 'RTO_DELIVERED');
    assert.ok(t2.record?.completedAt, 'completedAt timestamp must be recorded');
  });

  await test('Tenant A cannot view or update Tenant B RTO record', () => {
    const rtosA = ShipmentTrackingNdrRtoService.getRtoRecords(tenantA);
    const foundB = rtosA.find((r) => r.rtoId === rtoBId);
    assert.strictEqual(foundB, undefined);

    const updateRes = ShipmentTrackingNdrRtoService.updateRtoStatus(rtoBId, 'RTO_INITIATED', tenantA);
    assert.strictEqual(updateRes.success, false);
    assert.match(updateRes.message, /unauthorized/i);
  });

  // --- Suite 6: Database Schema & RLS Policies Verification ---
  console.log('\n--- Suite 6: Database Schema & RLS Policies Verification ---');

  await test('001_initial_schema.sql contains ndr_records and rto_records tables with tenant_id foreign keys', () => {
    const schemaPath = path.resolve(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
    assert.ok(fs.existsSync(schemaPath), '001_initial_schema.sql must exist');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Check table creation
    assert.match(sql, /CREATE TABLE IF NOT EXISTS ndr_records/i);
    assert.match(sql, /CREATE TABLE IF NOT EXISTS rto_records/i);

    // Check foreign keys
    assert.match(sql, /tenant_id UUID NOT NULL REFERENCES tenants\(id\) ON DELETE CASCADE/);
    assert.match(sql, /shipment_id UUID NOT NULL REFERENCES shipments\(id\) ON DELETE CASCADE/);

    // Check enums
    assert.match(sql, /CREATE TYPE ndr_status AS ENUM/);
    assert.match(sql, /CREATE TYPE rto_status AS ENUM/);

    // Check indexes
    assert.match(sql, /idx_ndr_tenant ON ndr_records\(tenant_id\)/);
    assert.match(sql, /idx_rto_tenant ON rto_records\(tenant_id\)/);
  });

  await test('002_rls_policies.sql enforces RLS and tenant isolation on ndr_records and rto_records', () => {
    const rlsPath = path.resolve(process.cwd(), 'supabase/migrations/002_rls_policies.sql');
    assert.ok(fs.existsSync(rlsPath), '002_rls_policies.sql must exist');
    const sql = fs.readFileSync(rlsPath, 'utf8');

    // RLS enabled
    assert.match(sql, /ALTER TABLE ndr_records ENABLE ROW LEVEL SECURITY/i);
    assert.match(sql, /ALTER TABLE rto_records ENABLE ROW LEVEL SECURITY/i);

    // Policies
    assert.match(sql, /CREATE POLICY ndr_select_policy ON ndr_records/i);
    assert.match(sql, /tenant_id = get_auth_tenant_id\(\)/);
    assert.match(sql, /CREATE POLICY ndr_update_policy ON ndr_records/i);
    assert.match(sql, /CREATE POLICY rto_select_policy ON rto_records/i);
  });

  console.log('\n====================================================');
  console.log(`📊 PHASE 4 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase4Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
