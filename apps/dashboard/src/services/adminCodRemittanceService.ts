import { NotificationService } from './notificationService';
import { supabase } from '../lib/supabaseClient';
import { toValidTenantUUID } from '../utils/uuidHelper';

export type AdminCodReceivableStatus =
  | 'NOT_ELIGIBLE'
  | 'ELIGIBLE'
  | 'PROCESSING'
  | 'REMITTED'
  | 'ON_HOLD'
  | 'MISMATCH';

export type AdminRemittanceStatus =
  | 'DRAFT'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'ON_HOLD'
  | 'CANCELLED';

export interface AdminCodReceivableRecord extends Record<string, unknown> {
  id: string;
  shipmentId: string;
  orderId: string;
  tenantId: string;
  courierId: string;
  courierName: string;
  awbNumber: string;
  deliveredDate: string;
  codAmountINR: number;
  codChargeINR: number;
  netEligibleINR: number;
  status: AdminCodReceivableStatus;
  eligibleDate: string;
  remittanceId?: string;
}

export interface AdminRemittanceRecord extends Record<string, unknown> {
  id: string;
  remittanceId: string;
  tenantId: string;
  courierId: string;
  courierName: string;
  settlementPeriod: string;
  shipmentCount: number;
  grossCodAmountINR: number;
  codChargesINR: number;
  otherAdjustmentsINR: number;
  recoveriesINR: number;
  netRemittanceINR: number;
  status: AdminRemittanceStatus;
  bankReferenceId?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  shipmentIds: string[];
  payoutDestination?: 'BANK' | 'WALLET';
  payoutType?: 'STANDARD_T7' | 'EARLY_T2' | 'INSTANT_T0';
}

export interface CourierCodSummaryRecord extends Record<string, unknown> {
  courierId: string;
  courierName: string;
  codDeliveredINR: number;
  codEligibleINR: number;
  codReceivedINR: number;
  codRemittedINR: number;
  codPendingINR: number;
  codMismatchINR: number;
}

export interface CodReconciliationException extends Record<string, unknown> {
  id: string;
  shipmentId: string;
  courierName: string;
  expectedAmountINR: number;
  receivedAmountINR: number;
  differenceINR: number;
  mismatchType: 'MATCH' | 'SHORT' | 'EXCESS' | 'MISSING' | 'DUPLICATE' | 'PENDING';
  status: 'OPEN' | 'RESOLVED' | 'UNDER_REVIEW';
  notes?: string;
  createdAt: string;
}

export interface RemittanceRuleConfig extends Record<string, unknown> {
  minSettlementDaysPostDelivery: number;
  eligibleStatuses: string[];
  autoRemitEnabled: boolean;
}

// Initial Data Seed
export const INITIAL_COD_RECEIVABLES: AdminCodReceivableRecord[] = [
  {
    id: 'rec-001',
    shipmentId: 'SHP-99101',
    orderId: 'ORD-55410',
    tenantId: 'tenant-demo-01',
    courierId: 'delhivery',
    courierName: 'Delhivery Surface',
    awbNumber: 'DEL-881290192',
    deliveredDate: '2026-10-29',
    codAmountINR: 2450,
    codChargeINR: 45,
    netEligibleINR: 2405,
    status: 'ELIGIBLE',
    eligibleDate: '2026-10-30',
  },
  {
    id: 'rec-002',
    shipmentId: 'SHP-99102',
    orderId: 'ORD-55411',
    tenantId: 'tenant-demo-01',
    courierId: 'bluedart',
    courierName: 'Blue Dart Air',
    awbNumber: 'BLR-992019201',
    deliveredDate: '2026-10-30',
    codAmountINR: 4120,
    codChargeINR: 60,
    netEligibleINR: 4060,
    status: 'ELIGIBLE',
    eligibleDate: '2026-10-31',
  },
  {
    id: 'rec-003',
    shipmentId: 'SHP-99103',
    orderId: 'ORD-55412',
    tenantId: 'tenant-demo-01',
    courierId: 'dtdc',
    courierName: 'DTDC Express',
    awbNumber: 'DTD-332019482',
    deliveredDate: '2026-10-25',
    codAmountINR: 1850,
    codChargeINR: 40,
    netEligibleINR: 1810,
    status: 'REMITTED',
    eligibleDate: '2026-10-26',
    remittanceId: 'REM-892104',
  },
];

export const INITIAL_ADMIN_REMITTANCES: AdminRemittanceRecord[] = [
  {
    id: 'rem-admin-001',
    remittanceId: 'REM-892104',
    tenantId: 'tenant-demo-01',
    courierId: 'dtdc',
    courierName: 'DTDC Express',
    settlementPeriod: '2026-10-21 to 2026-10-27',
    shipmentCount: 1,
    grossCodAmountINR: 1850,
    codChargesINR: 40,
    otherAdjustmentsINR: 0,
    recoveriesINR: 0,
    netRemittanceINR: 1810,
    status: 'COMPLETED',
    bankReferenceId: 'UTR-HDFC-992817263',
    notes: 'Weekly T+3 automated bank settlement',
    createdAt: '2026-10-28, 11:30 AM',
    completedAt: '2026-10-28, 12:15 PM',
    shipmentIds: ['SHP-99103'],
    payoutDestination: 'BANK',
    payoutType: 'STANDARD_T7',
  },
];

export const INITIAL_RECONCILIATION_EXCEPTIONS: CodReconciliationException[] = [
  {
    id: 'exc-001',
    shipmentId: 'SHP-99042',
    courierName: 'Xpressbees Surface',
    expectedAmountINR: 1950,
    receivedAmountINR: 1450,
    differenceINR: -500,
    mismatchType: 'SHORT',
    status: 'UNDER_REVIEW',
    notes: 'Short collection reported by courier delivery agent. Under ops review.',
    createdAt: '2026-10-30, 04:15 PM',
  },
];

export const STORAGE_KEY_COD_RECEIVABLES = 'MAXLINE_COD_RECEIVABLES_STORE';
export const STORAGE_KEY_COD_REMITTANCES = 'MAXLINE_COD_REMITTANCES_STORE';
export const STORAGE_KEY_COD_EXCEPTIONS = 'MAXLINE_COD_EXCEPTIONS_STORE';

function loadReceivablesFromStorage(): AdminCodReceivableRecord[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORAGE_KEY_COD_RECEIVABLES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch {}
  return [...INITIAL_COD_RECEIVABLES];
}

function saveReceivablesToStorage(list: AdminCodReceivableRecord[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_COD_RECEIVABLES, JSON.stringify(list));
    }
  } catch {}
}

function loadRemittancesFromStorage(): AdminRemittanceRecord[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORAGE_KEY_COD_REMITTANCES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch {}
  return [...INITIAL_ADMIN_REMITTANCES];
}

function saveRemittancesToStorage(list: AdminRemittanceRecord[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_COD_REMITTANCES, JSON.stringify(list));
    }
  } catch {}
}

function loadExceptionsFromStorage(): CodReconciliationException[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORAGE_KEY_COD_EXCEPTIONS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch {}
  return [...INITIAL_RECONCILIATION_EXCEPTIONS];
}

let RECEIVABLES_STORE: AdminCodReceivableRecord[] = loadReceivablesFromStorage();
let REMITTANCE_STORE: AdminRemittanceRecord[] = loadRemittancesFromStorage();
let EXCEPTION_STORE: CodReconciliationException[] = loadExceptionsFromStorage();

let RULE_CONFIG: RemittanceRuleConfig = {
  minSettlementDaysPostDelivery: 1,
  eligibleStatuses: ['DELIVERED'],
  autoRemitEnabled: false,
};

export const AdminCodRemittanceService = {
  // Sync COD Remittances & Receivables from Supabase Cloud DB
  syncFromSupabase: async (tenantId?: string): Promise<{ remittances: AdminRemittanceRecord[]; receivables: AdminCodReceivableRecord[] }> => {
    try {
      // 1. Fetch cod_remittances from Supabase Cloud DB
      let remQuery = supabase
        .from('cod_remittances')
        .select('*')
        .order('created_at', { ascending: false });

      if (tenantId && tenantId.toLowerCase() !== 'all') {
        const validTid = toValidTenantUUID(tenantId);
        remQuery = remQuery.eq('merchant_id', validTid);
      }

      const { data: remData, error: remError } = await remQuery;
      if (!remError && remData && Array.isArray(remData) && remData.length > 0) {
        const cloudRem: AdminRemittanceRecord[] = remData.map((row: any) => {
          const gross = Number(row.gross_collected_minor || 0) / 100 || Number(row.gross_amount_inr || 0);
          const ded = Number(row.deductions_minor || 0) / 100 || Number(row.charges_inr || 0);
          const net = Number(row.net_payout_minor || 0) / 100 || Number(row.net_amount_inr || 0) || (gross - ded);

          return {
            id: row.id,
            remittanceId: row.remittance_number || row.remittance_id || `REM-${row.id.slice(0, 8).toUpperCase()}`,
            tenantId: row.merchant_id || row.tenant_id,
            courierId: row.courier_id || 'delhivery',
            courierName: row.courier_name || 'Courier Partner',
            settlementPeriod: row.settlement_period || 'Regular Settlement Cycle',
            shipmentCount: row.total_shipments_count || row.shipment_count || 1,
            grossCodAmountINR: gross,
            codChargesINR: ded,
            otherAdjustmentsINR: 0,
            recoveriesINR: 0,
            netRemittanceINR: net,
            status: (row.status === 'REMITTED' ? 'COMPLETED' : (row.status || 'PROCESSING')) as AdminRemittanceStatus,
            bankReferenceId: row.bank_reference_utr || row.bank_reference_id,
            notes: row.notes,
            createdAt: row.created_at ? new Date(row.created_at).toLocaleString() : 'Recent',
            completedAt: row.remitted_at || row.completed_at ? new Date(row.remitted_at || row.completed_at).toLocaleString() : undefined,
            shipmentIds: Array.isArray(row.shipment_ids) ? row.shipment_ids : [],
            payoutDestination: row.payout_mode === 'WALLET' ? 'WALLET' : 'BANK',
          };
        });

        const seenRemIds = new Set(cloudRem.map((r) => r.remittanceId));
        const nonDupRem = REMITTANCE_STORE.filter((r) => !seenRemIds.has(r.remittanceId));
        REMITTANCE_STORE = [...cloudRem, ...nonDupRem];
        saveRemittancesToStorage(REMITTANCE_STORE);
      }

      // 2. Fetch delivered COD shipments from Supabase shipments table
      let shpQuery = supabase
        .from('shipments')
        .select('*')
        .eq('payment_mode', 'COD')
        .gt('cod_amount_minor', 0)
        .order('created_at', { ascending: false });

      if (tenantId && tenantId.toLowerCase() !== 'all') {
        const validTid = toValidTenantUUID(tenantId);
        shpQuery = shpQuery.eq('merchant_id', validTid);
      }

      const { data: shpData, error: shpError } = await shpQuery;
      if (!shpError && shpData && Array.isArray(shpData) && shpData.length > 0) {
        const cloudRecs: AdminCodReceivableRecord[] = shpData.map((s: any) => {
          const codVal = Number(s.cod_amount_minor || 0) / 100;
          const codFee = Math.round(codVal * 0.015);
          const net = Math.max(0, codVal - codFee);
          const isDelivered = (s.status || '').toUpperCase() === 'DELIVERED';

          return {
            id: s.id,
            shipmentId: s.shipment_number || s.id,
            orderId: s.order_id || 'ORD-REF',
            tenantId: s.merchant_id,
            courierId: s.courier_id || 'delhivery',
            courierName: s.courier_name || 'Delhivery',
            awbNumber: s.awb_number || 'N/A',
            deliveredDate: s.delivered_at ? s.delivered_at.split('T')[0] : (s.created_at ? s.created_at.split('T')[0] : '2026-10-30'),
            codAmountINR: codVal,
            codChargeINR: codFee,
            netEligibleINR: net,
            status: isDelivered ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
            eligibleDate: s.created_at ? s.created_at.split('T')[0] : '2026-10-31',
          };
        });

        const seenRecIds = new Set(cloudRecs.map((r) => r.shipmentId));
        const nonDupRecs = RECEIVABLES_STORE.filter((r) => !seenRecIds.has(r.shipmentId));
        RECEIVABLES_STORE = [...cloudRecs, ...nonDupRecs];
        saveReceivablesToStorage(RECEIVABLES_STORE);
      }
    } catch (err: any) {
      console.warn('[AdminCodRemittanceService] Supabase sync warning:', err?.message);
    }

    return { remittances: REMITTANCE_STORE, receivables: RECEIVABLES_STORE };
  },

  getReceivables: (tenantId = 'all', statusFilter = 'all'): AdminCodReceivableRecord[] => {
    return RECEIVABLES_STORE.filter((r) => {
      if (tenantId !== 'all' && r.tenantId !== tenantId) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  },

  getEligibleReceivables: (tenantId = 'all', courierId = 'all'): AdminCodReceivableRecord[] => {
    return RECEIVABLES_STORE.filter((r) => {
      if (r.status !== 'ELIGIBLE') return false;
      if (tenantId !== 'all' && r.tenantId !== tenantId) return false;
      if (courierId !== 'all' && r.courierId !== courierId) return false;
      return true;
    });
  },

  getRemittances: (tenantId = 'all', statusFilter = 'all'): AdminRemittanceRecord[] => {
    return REMITTANCE_STORE.filter((r) => {
      if (tenantId !== 'all' && r.tenantId !== tenantId) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  },

  getCourierSummaries: (): CourierCodSummaryRecord[] => {
    const couriers = [
      { id: 'delhivery', name: 'Delhivery Surface' },
      { id: 'bluedart', name: 'Blue Dart Air' },
      { id: 'dtdc', name: 'DTDC Express' },
      { id: 'xpressbees', name: 'Xpressbees Surface' },
    ];

    return couriers.map((c) => {
      const recs = RECEIVABLES_STORE.filter((r) => r.courierId === c.id);
      const codDeliveredINR = recs.reduce((s, r) => s + r.codAmountINR, 0);
      const codEligibleINR = recs.filter((r) => r.status === 'ELIGIBLE').reduce((s, r) => s + r.codAmountINR, 0);
      const codRemittedINR = recs.filter((r) => r.status === 'REMITTED').reduce((s, r) => s + r.codAmountINR, 0);
      const codPendingINR = recs.filter((r) => r.status === 'NOT_ELIGIBLE').reduce((s, r) => s + r.codAmountINR, 0);

      return {
        courierId: c.id,
        courierName: c.name,
        codDeliveredINR,
        codEligibleINR,
        codReceivedINR: codDeliveredINR,
        codRemittedINR,
        codPendingINR,
        codMismatchINR: c.id === 'xpressbees' ? 500 : 0,
      };
    });
  },

  getReconciliationExceptions: (): CodReconciliationException[] => {
    return EXCEPTION_STORE;
  },

  // Remittance Calculation & Creation with Double Remittance Guard
  createRemittance: (input: {
    tenantId: string;
    courierId: string;
    courierName: string;
    settlementPeriod: string;
    shipmentIds: string[];
    otherAdjustmentsINR?: number;
    recoveriesINR?: number;
    notes?: string;
  }): { success: boolean; message: string; remittance?: AdminRemittanceRecord } => {
    // 1. Double Remittance Check
    const selectedRecs = RECEIVABLES_STORE.filter((r) => input.shipmentIds.includes(r.shipmentId));
    const alreadyRemitted = selectedRecs.filter((r) => r.status === 'REMITTED' || r.status === 'PROCESSING');

    if (alreadyRemitted.length > 0) {
      return {
        success: false,
        message: `Security Lock: Shipment ${alreadyRemitted[0].shipmentId} has already been included in a completed/processing remittance. Double remittance is strictly prohibited.`,
      };
    }

    if (selectedRecs.length === 0) {
      return { success: false, message: 'No valid eligible COD shipments selected.' };
    }

    const grossCod = selectedRecs.reduce((sum, r) => sum + r.codAmountINR, 0);
    const codCharges = selectedRecs.reduce((sum, r) => sum + r.codChargeINR, 0);
    const adjustments = input.otherAdjustmentsINR || 0;
    const recoveries = input.recoveriesINR || 0;
    const netRemittance = Math.max(0, grossCod - codCharges - adjustments - recoveries);

    const remId = `REM-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRemittance: AdminRemittanceRecord = {
      id: `rem-admin-${Date.now()}`,
      remittanceId: remId,
      tenantId: input.tenantId,
      courierId: input.courierId,
      courierName: input.courierName,
      settlementPeriod: input.settlementPeriod,
      shipmentCount: selectedRecs.length,
      grossCodAmountINR: grossCod,
      codChargesINR: codCharges,
      otherAdjustmentsINR: adjustments,
      recoveriesINR: recoveries,
      netRemittanceINR: netRemittance,
      status: 'PROCESSING',
      notes: input.notes,
      createdAt: new Date().toLocaleString(),
      shipmentIds: input.shipmentIds,
    };

    // Update receivables status
    selectedRecs.forEach((r) => {
      r.status = 'PROCESSING';
      r.remittanceId = remId;
    });

    REMITTANCE_STORE.unshift(newRemittance);
    saveRemittancesToStorage(REMITTANCE_STORE);
    saveReceivablesToStorage(RECEIVABLES_STORE);

    if (input.tenantId && input.tenantId.length > 20) {
      Promise.resolve(
        supabase
          .from('cod_remittances')
          .insert([{
            merchant_id: toValidTenantUUID(input.tenantId),
            remittance_number: newRemittance.remittanceId,
            total_shipments_count: newRemittance.shipmentCount,
            gross_collected_minor: Math.round(newRemittance.grossCodAmountINR * 100),
            deductions_minor: Math.round(newRemittance.codChargesINR * 100),
            early_cod_fee_minor: 0,
            net_payout_minor: Math.round(newRemittance.netRemittanceINR * 100),
            payout_mode: 'BANK_TRANSFER',
            status: 'PROCESSING',
            created_at: new Date().toISOString(),
          }])
      ).catch(() => {});
    }

    return { success: true, message: `Remittance ${remId} created in PROCESSING status.`, remittance: newRemittance };
  },

  // Manual Remittance Completion Workflow
  completeRemittance: (
    remittanceId: string,
    bankReferenceId: string,
    notes?: string
  ): { success: boolean; message: string } => {
    const rem = REMITTANCE_STORE.find((r) => r.remittanceId === remittanceId || r.id === remittanceId);
    if (!rem) return { success: false, message: 'Remittance record not found.' };

    rem.status = 'COMPLETED';
    rem.bankReferenceId = bankReferenceId;
    if (notes) rem.notes = notes;
    rem.completedAt = new Date().toLocaleString();

    // Update linked COD receivables
    RECEIVABLES_STORE.forEach((r) => {
      if (rem.shipmentIds.includes(r.shipmentId)) {
        r.status = 'REMITTED';
        r.remittanceId = rem.remittanceId;
      }
    });

    saveRemittancesToStorage(REMITTANCE_STORE);
    saveReceivablesToStorage(RECEIVABLES_STORE);

    if (rem.remittanceId) {
      Promise.resolve(
        supabase
          .from('cod_remittances')
          .update({
            status: 'COMPLETED',
            bank_reference_utr: bankReferenceId,
            remitted_at: new Date().toISOString(),
          })
          .eq('remittance_number', rem.remittanceId)
      ).catch(() => {});
    }

    // Fire Customer Notification
    NotificationService.createNotification({
      recipientId: rem.tenantId,
      recipientType: 'CUSTOMER',
      title: 'COD Remittance Completed',
      message: `Your COD remittance of ₹${rem.netRemittanceINR.toFixed(2)} (Ref: ${bankReferenceId}) has been processed and remitted to your bank account.`,
      type: 'WALLET',
      referenceType: 'WALLET',
      referenceId: rem.remittanceId,
      eventId: `evt-cod-rem-${rem.remittanceId}`,
    });

    return { success: true, message: `Remittance ${rem.remittanceId} marked COMPLETED. Bank reference: ${bankReferenceId}.` };
  },

  getRuleConfig: (): RemittanceRuleConfig => ({ ...RULE_CONFIG }),
  updateRuleConfig: (config: Partial<RemittanceRuleConfig>): RemittanceRuleConfig => {
    RULE_CONFIG = { ...RULE_CONFIG, ...config };
    return { ...RULE_CONFIG };
  },
};
