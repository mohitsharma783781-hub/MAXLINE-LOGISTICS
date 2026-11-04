import { WalletService } from '../mocks/wallet.mock';
import { supabase } from '../lib/supabaseClient';
import { toValidTenantUUID } from '../utils/uuidHelper';
import {
  AdminCodRemittanceService,
  STORAGE_KEY_COD_RECEIVABLES,
  STORAGE_KEY_COD_REMITTANCES,
} from './adminCodRemittanceService';

export type CodRemittanceStatus = 'PENDING' | 'PROCESSING' | 'REMITTED' | 'FAILED' | 'ON_HOLD';
export type EarlyCodPlanType = 'STANDARD_T7' | 'EARLY_T2' | 'INSTANT_T0';
export type PayoutDestinationType = 'BANK' | 'WALLET';

export interface CodRemittanceRecord extends Record<string, unknown> {
  id: string;
  remittanceId: string;
  tenantId: string;
  shipmentCount: number;
  grossCodAmountINR: number;
  deductionINR: number;
  earlyFeeINR: number;
  netRemittanceINR: number;
  status: CodRemittanceStatus;
  payoutType: EarlyCodPlanType;
  payoutDestination: PayoutDestinationType;
  remittanceDate: string;
  bankReferenceId?: string;
  createdAt: string;
}

export interface CodTransactionRecord extends Record<string, unknown> {
  id: string;
  tenantId: string;
  shipmentId: string;
  awbNumber: string;
  orderId: string;
  deliveredDate: string;
  codAmountINR: number;
  netAmountINR: number;
  remittanceId?: string;
  status: 'PENDING_DELIVERY' | 'ELIGIBLE_FOR_REMITTANCE' | 'REMITTED';
}

export interface MerchantEarlyCodConfig extends Record<string, unknown> {
  tenantId: string;
  activePlan: EarlyCodPlanType;
  bankAccountName: string;
  bankAccountNumber: string;
  ifscCode: string;
  updatedAt: string;
}

export const INITIAL_COD_REMITTANCES: CodRemittanceRecord[] = [
  {
    id: 'rem-seller-001',
    remittanceId: 'REM-892104',
    tenantId: 'tenant-demo-01',
    shipmentCount: 1,
    grossCodAmountINR: 1850,
    deductionINR: 40,
    earlyFeeINR: 0,
    netRemittanceINR: 1810,
    status: 'REMITTED',
    payoutType: 'STANDARD_T7',
    payoutDestination: 'BANK',
    remittanceDate: '2026-10-28 12:15 PM',
    bankReferenceId: 'UTR-HDFC-992817263',
    createdAt: '2026-10-28T11:30:00Z',
  },
];

export const INITIAL_COD_TRANSACTIONS: CodTransactionRecord[] = [
  {
    id: 'tx-001',
    tenantId: 'tenant-demo-01',
    shipmentId: 'SHP-99101',
    awbNumber: 'DEL-881290192',
    orderId: 'ORD-55410',
    deliveredDate: '2026-10-29',
    codAmountINR: 2450,
    netAmountINR: 2405,
    status: 'ELIGIBLE_FOR_REMITTANCE',
  },
  {
    id: 'tx-002',
    tenantId: 'tenant-demo-01',
    shipmentId: 'SHP-99102',
    awbNumber: 'BLR-992019201',
    orderId: 'ORD-55411',
    deliveredDate: '2026-10-30',
    codAmountINR: 4120,
    netAmountINR: 4060,
    status: 'ELIGIBLE_FOR_REMITTANCE',
  },
  {
    id: 'tx-003',
    tenantId: 'tenant-demo-01',
    shipmentId: 'SHP-99103',
    awbNumber: 'DTD-332019482',
    orderId: 'ORD-55412',
    deliveredDate: '2026-10-25',
    codAmountINR: 1850,
    netAmountINR: 1810,
    remittanceId: 'REM-892104',
    status: 'REMITTED',
  },
];

function loadSellerRemittances(): CodRemittanceRecord[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORAGE_KEY_COD_REMITTANCES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((r: any) => ({
            id: r.id,
            remittanceId: r.remittanceId,
            tenantId: r.tenantId,
            shipmentCount: r.shipmentCount,
            grossCodAmountINR: r.grossCodAmountINR,
            deductionINR: (r.codChargesINR || 0) + (r.otherAdjustmentsINR || 0) + (r.recoveriesINR || 0) + (r.deductionINR || 0),
            earlyFeeINR: r.earlyFeeINR || 0,
            netRemittanceINR: r.netRemittanceINR,
            status: (r.status === 'COMPLETED' ? 'REMITTED' : (r.status || 'PROCESSING')) as CodRemittanceStatus,
            payoutType: r.payoutType || 'STANDARD_T7',
            payoutDestination: r.payoutDestination || 'BANK',
            remittanceDate: r?.completedAt || r?.remittanceDate || r?.createdAt || '—',
            bankReferenceId: r?.bankReferenceId,
            createdAt: r?.createdAt || new Date().toISOString(),
          }));
        }
      }
    }
  } catch {}
  return [...INITIAL_COD_REMITTANCES];
}

function loadSellerTransactions(): CodTransactionRecord[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORAGE_KEY_COD_RECEIVABLES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((r: any) => ({
            id: r.id,
            tenantId: r.tenantId,
            shipmentId: r.shipmentId,
            awbNumber: r.awbNumber,
            orderId: r.orderId,
            deliveredDate: r.deliveredDate,
            codAmountINR: r.codAmountINR,
            netAmountINR: r.netEligibleINR || r.netAmountINR || r.codAmountINR,
            remittanceId: r.remittanceId,
            status: r.status === 'REMITTED' ? 'REMITTED' : (r.status === 'ELIGIBLE' ? 'ELIGIBLE_FOR_REMITTANCE' : 'PENDING_DELIVERY'),
          }));
        }
      }
    }
  } catch {}
  return [...INITIAL_COD_TRANSACTIONS];
}

let REMITTANCE_STORE = loadSellerRemittances();
let COD_TX_STORE = loadSellerTransactions();

const MERCHANT_EARLY_COD_CONFIGS: Record<string, MerchantEarlyCodConfig> = {
  'tenant-demo-01': {
    tenantId: 'tenant-demo-01',
    activePlan: 'STANDARD_T7',
    bankAccountName: 'Acme Logistics Operations HDFC',
    bankAccountNumber: '502000491823019',
    ifscCode: 'HDFC0000128',
    updatedAt: '2026-08-01',
  },
};

export const CustomerCodService = {
  syncFromSupabase: async (tenantId: string): Promise<{ remittances: CodRemittanceRecord[]; transactions: CodTransactionRecord[] }> => {
    await AdminCodRemittanceService.syncFromSupabase(tenantId);
    REMITTANCE_STORE = loadSellerRemittances();
    COD_TX_STORE = loadSellerTransactions();
    return {
      remittances: REMITTANCE_STORE,
      transactions: COD_TX_STORE,
    };
  },

  getRemittances: (tenantId = 'tenant-demo-01', statusFilter = 'all'): CodRemittanceRecord[] => {
    return CustomerCodService.queryRemittances({ tenantId, statusFilter });
  },

  queryRemittances: (params: {
    tenantId?: string;
    searchQuery?: string;
    statusFilter?: string;
  }): CodRemittanceRecord[] => {
    const { tenantId = 'tenant-demo-01', searchQuery = '', statusFilter = 'all' } = params;
    return REMITTANCE_STORE.filter((r) => {
      if (r.tenantId !== tenantId) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = r.remittanceId.toLowerCase().includes(q);
        const matchUtr = r.bankReferenceId ? r.bankReferenceId.toLowerCase().includes(q) : false;
        if (!matchId && !matchUtr) return false;
      }
      return true;
    });
  },

  getCodTransactions: (tenantId = 'tenant-demo-01'): CodTransactionRecord[] => {
    return CustomerCodService.queryCodTransactions({ tenantId });
  },

  queryCodTransactions: (params: {
    tenantId?: string;
    searchQuery?: string;
    statusFilter?: string;
  }): CodTransactionRecord[] => {
    const { tenantId = 'tenant-demo-01', searchQuery = '', statusFilter = 'all' } = params;
    return COD_TX_STORE.filter((t) => {
      if (t.tenantId !== tenantId) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = t.shipmentId.toLowerCase().includes(q);
        const matchAwb = t.awbNumber ? t.awbNumber.toLowerCase().includes(q) : false;
        const matchOrder = t.orderId.toLowerCase().includes(q);
        if (!matchId && !matchAwb && !matchOrder) return false;
      }
      return true;
    });
  },

  getRemittanceById: (remittanceId: string, tenantId = 'tenant-demo-01'): CodRemittanceRecord | null => {
    return REMITTANCE_STORE.find((r) => r.tenantId === tenantId && (r.remittanceId === remittanceId || r.id === remittanceId)) || null;
  },

  getEarlyCodConfig: (tenantId = 'tenant-demo-01'): MerchantEarlyCodConfig => {
    if (!MERCHANT_EARLY_COD_CONFIGS[tenantId]) {
      MERCHANT_EARLY_COD_CONFIGS[tenantId] = {
        tenantId,
        activePlan: 'STANDARD_T7',
        bankAccountName: 'Merchant Account',
        bankAccountNumber: '99182301982',
        ifscCode: 'ICIC0000102',
        updatedAt: new Date().toISOString().split('T')[0],
      };
    }
    return MERCHANT_EARLY_COD_CONFIGS[tenantId];
  },

  updateEarlyCodPlan: (tenantId: string, planType: EarlyCodPlanType): MerchantEarlyCodConfig => {
    const config = CustomerCodService.getEarlyCodConfig(tenantId);
    config.activePlan = planType;
    config.updatedAt = new Date().toISOString().split('T')[0];
    return config;
  },

  getCodSummaryStats: (tenantId = 'tenant-demo-01') => {
    const txs = CustomerCodService.getCodTransactions(tenantId);
    const totalCodShipments = txs.length;
    const deliveredCodCount = txs.filter((t) => t.status === 'ELIGIBLE_FOR_REMITTANCE' || t.status === 'REMITTED').length;
    const pendingRemittanceINR = txs.filter((t) => t.status === 'ELIGIBLE_FOR_REMITTANCE').reduce((sum, t) => sum + t.codAmountINR, 0);
    const remittedCodINR = txs.filter((t) => t.status === 'REMITTED').reduce((sum, t) => sum + t.codAmountINR, 0);
    const totalCodValueINR = txs.reduce((sum, t) => sum + t.codAmountINR, 0);

    return {
      totalCodShipments,
      deliveredCodCount,
      pendingRemittanceINR,
      remittedCodINR,
      totalCodValueINR,
    };
  },

  // Process Instant COD Remittance Claim (Requirement #7)
  claimInstantCodPayout: (
    tenantId = 'tenant-demo-01',
    payoutDestination: PayoutDestinationType = 'WALLET',
    feePercent = 1.0
  ): CodRemittanceRecord => {
    const eligibleTxs = COD_TX_STORE.filter(
      (t) => t.tenantId === tenantId && t.status === 'ELIGIBLE_FOR_REMITTANCE'
    );

    if (eligibleTxs.length === 0) {
      throw new Error('No delivered COD shipments currently eligible for instant remittance.');
    }

    const grossAmount = eligibleTxs.reduce((sum, t) => sum + t.codAmountINR, 0);
    const standardDeductions = Math.round(grossAmount * 0.01); // 1% standard handling
    const earlyFee = Math.round(grossAmount * (feePercent / 100));
    const netRemittance = grossAmount - standardDeductions - earlyFee;

    const remittanceId = `INST-${Date.now().toString().slice(-6)}`;
    const utr = payoutDestination === 'WALLET'
      ? `WALLET-INST-${Date.now().toString().slice(-8)}`
      : `UTR-IMPS-INST-${Date.now().toString().slice(-8)}`;

    const newRemittance: CodRemittanceRecord = {
      id: `rem-${Date.now()}`,
      remittanceId,
      tenantId,
      shipmentCount: eligibleTxs.length,
      grossCodAmountINR: grossAmount,
      deductionINR: standardDeductions,
      earlyFeeINR: earlyFee,
      netRemittanceINR: netRemittance,
      status: 'REMITTED',
      payoutType: feePercent >= 1.0 ? 'INSTANT_T0' : 'EARLY_T2',
      payoutDestination,
      remittanceDate: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      bankReferenceId: utr,
      createdAt: new Date().toISOString(),
    };

    // Update transactions to REMITTED
    eligibleTxs.forEach((tx) => {
      tx.status = 'REMITTED';
      tx.remittanceId = remittanceId;
    });

    REMITTANCE_STORE.unshift(newRemittance);

    // Save to shared localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const rawRem = localStorage.getItem(STORAGE_KEY_COD_REMITTANCES);
        const rems = rawRem ? JSON.parse(rawRem) : [];
        rems.unshift(newRemittance);
        localStorage.setItem(STORAGE_KEY_COD_REMITTANCES, JSON.stringify(rems));

        const rawRec = localStorage.getItem(STORAGE_KEY_COD_RECEIVABLES);
        if (rawRec) {
          const recs = JSON.parse(rawRec);
          recs.forEach((rc: any) => {
            if (eligibleTxs.some((et) => et.shipmentId === rc.shipmentId)) {
              rc.status = 'REMITTED';
              rc.remittanceId = remittanceId;
            }
          });
          localStorage.setItem(STORAGE_KEY_COD_RECEIVABLES, JSON.stringify(recs));
        }
      }
    } catch {}

    // Insert into Supabase
    if (tenantId && tenantId.length > 20) {
      Promise.resolve(
        supabase
          .from('cod_remittances')
          .insert([{
            merchant_id: toValidTenantUUID(tenantId),
            remittance_number: remittanceId,
            total_shipments_count: eligibleTxs.length,
            gross_collected_minor: Math.round(grossAmount * 100),
            deductions_minor: Math.round(standardDeductions * 100),
            early_cod_fee_minor: Math.round(earlyFee * 100),
            net_payout_minor: Math.round(netRemittance * 100),
            payout_mode: payoutDestination === 'WALLET' ? 'WALLET' : 'BANK_TRANSFER',
            bank_reference_utr: utr,
            status: 'REMITTED',
            remitted_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          }])
      ).catch(() => {});
    }

    // If destination is WALLET, credit wallet instantly!
    if (payoutDestination === 'WALLET') {
      WalletService.recharge(netRemittance, `Instant COD Remittance (${remittanceId})`);
    }

    return newRemittance;
  },
};
