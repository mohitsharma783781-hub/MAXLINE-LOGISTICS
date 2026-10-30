import { NotificationService } from './notificationService';

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
export const INITIAL_COD_RECEIVABLES: AdminCodReceivableRecord[] = [];

export const INITIAL_ADMIN_REMITTANCES: AdminRemittanceRecord[] = [];

export const INITIAL_RECONCILIATION_EXCEPTIONS: CodReconciliationException[] = [];

let RECEIVABLES_STORE = [...INITIAL_COD_RECEIVABLES];
let REMITTANCE_STORE = [...INITIAL_ADMIN_REMITTANCES];
let EXCEPTION_STORE = [...INITIAL_RECONCILIATION_EXCEPTIONS];

let RULE_CONFIG: RemittanceRuleConfig = {
  minSettlementDaysPostDelivery: 1,
  eligibleStatuses: ['DELIVERED'],
  autoRemitEnabled: false,
};

export const AdminCodRemittanceService = {
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
