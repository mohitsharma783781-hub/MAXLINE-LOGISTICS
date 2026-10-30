import { WalletService } from '../mocks/wallet.mock';
import { MockPaymentGatewayAdapter, type PaymentVerificationInput } from './paymentProviderAdapter';

export type RechargeStatus =
  | 'CREATED'
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'AMOUNT_MISMATCH';

export interface WalletRechargeRecord extends Record<string, unknown> {
  id: string;
  rechargeId: string;
  tenantId: string;
  amountINR: number;
  expectedAmountINR: number;
  paymentFeeINR: number;
  payableAmountINR: number;
  paymentStatus: RechargeStatus;
  paymentProvider: string;
  providerPaymentId?: string;
  walletTransactionId?: string;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}

export interface ReconciliationReportItem extends Record<string, unknown> {
  rechargeId: string;
  tenantId: string;
  expectedAmountINR: number;
  paidAmountINR: number;
  gatewayStatus: RechargeStatus;
  walletCredited: boolean;
  reconciliationStatus: 'MATCHED' | 'PENDING' | 'MISMATCH' | 'FAILED';
}

export const INITIAL_RECHARGES: WalletRechargeRecord[] = [
  {
    id: 'rch-rec-01',
    rechargeId: 'RCH-8471902',
    tenantId: 'tenant-demo-01',
    amountINR: 1000.0,
    expectedAmountINR: 1000.0,
    paymentFeeINR: 0,
    payableAmountINR: 1000.0,
    paymentStatus: 'SUCCESS',
    paymentProvider: 'MockPaymentGateway',
    providerPaymentId: 'PAY-MOCK-99182301',
    walletTransactionId: 'tx-101',
    createdAt: '2026-08-01 10:00 AM',
    completedAt: '2026-08-01 10:01 AM',
  },
];

let RECHARGE_STORE = [...INITIAL_RECHARGES];
const PROCESSED_RECHARGE_IDS = new Set<string>(['RCH-8471902']);

export const WalletRechargeService = {
  getRecharges: (tenantId?: string, statusFilter = 'all'): WalletRechargeRecord[] => {
    return RECHARGE_STORE.filter((r) => {
      if (tenantId && tenantId !== 'all' && r.tenantId !== tenantId) return false;
      if (statusFilter !== 'all' && r.paymentStatus !== statusFilter) return false;
      return true;
    });
  },

  getRechargeById: (rechargeId: string): WalletRechargeRecord | null => {
    return RECHARGE_STORE.find((r) => r.rechargeId === rechargeId || r.id === rechargeId) || null;
  },

  // 1. Create Initial Recharge Intent
  createRechargeIntent: (amountINR: number, tenantId = 'tenant-demo-01'): WalletRechargeRecord => {
    const minAmount = 100; // Configurable minimum amount
    if (amountINR < minAmount) {
      throw new Error(`Minimum recharge amount is ₹${minAmount}.`);
    }

    const rechargeId = `RCH-${Math.floor(1000000 + Math.random() * 9000000)}`;

    const newRecord: WalletRechargeRecord = {
      id: `rch-${Date.now()}`,
      rechargeId,
      tenantId,
      amountINR,
      expectedAmountINR: amountINR,
      paymentFeeINR: 0,
      payableAmountINR: amountINR,
      paymentStatus: 'CREATED',
      paymentProvider: 'MockPaymentGateway',
      createdAt: new Date().toLocaleString(),
    };

    RECHARGE_STORE.unshift(newRecord);
    return newRecord;
  },

  // 2. Server-side Verification & Idempotent Wallet Credit
  verifyAndCreditWallet: async (
    verificationInput: PaymentVerificationInput
  ): Promise<{ success: boolean; message: string; recharge: WalletRechargeRecord; newBalanceINR?: number }> => {
    const recharge = WalletRechargeService.getRechargeById(verificationInput.rechargeId);
    if (!recharge) {
      throw new Error('Recharge record not found.');
    }

    // 1. Idempotency Check
    if (PROCESSED_RECHARGE_IDS.has(recharge.rechargeId) && recharge.paymentStatus === 'SUCCESS') {
      const wallet = WalletService.getWallet(recharge.tenantId);
      return {
        success: true,
        message: 'Payment already processed and wallet credited (Idempotency Guard).',
        recharge,
        newBalanceINR: wallet.availableBalanceMinor / 100,
      };
    }

    // 2. Server-Side Gateway Verification
    const res = await MockPaymentGatewayAdapter.verifyPaymentSignature(verificationInput);

    recharge.providerPaymentId = verificationInput.providerPaymentId;

    if (res.status === 'FAILED') {
      recharge.paymentStatus = 'FAILED';
      recharge.failureReason = res.reasonMessage;
      return { success: false, message: res.reasonMessage, recharge };
    }

    if (res.status === 'PENDING') {
      recharge.paymentStatus = 'PENDING';
      recharge.failureReason = res.reasonMessage;
      return { success: false, message: res.reasonMessage, recharge };
    }

    // 3. Amount Verification Check
    const actualPaid = verificationInput.actualPaidAmountINR || recharge.expectedAmountINR;
    if (actualPaid !== recharge.expectedAmountINR) {
      recharge.paymentStatus = 'AMOUNT_MISMATCH';
      recharge.amountINR = actualPaid;
      recharge.failureReason = `Paid amount (₹${actualPaid}) does not match expected amount (₹${recharge.expectedAmountINR}). Wallet credit held.`;
      return {
        success: false,
        message: recharge.failureReason,
        recharge,
      };
    }

    // 4. Mark Verified SUCCESS & Atomic Wallet Credit
    PROCESSED_RECHARGE_IDS.add(recharge.rechargeId);
    recharge.paymentStatus = 'SUCCESS';
    recharge.completedAt = new Date().toLocaleString();

    // Call Wallet Engine to Credit Merchant Wallet
    const tx = WalletService.recharge(recharge.amountINR, recharge.paymentProvider, recharge.tenantId);
    recharge.walletTransactionId = tx.id;

    const wallet = WalletService.getWallet(recharge.tenantId);

    return {
      success: true,
      message: `Payment verified successfully! ₹${recharge.amountINR.toFixed(2)} credited to merchant wallet.`,
      recharge,
      newBalanceINR: wallet.availableBalanceMinor / 100,
    };
  },

  // 3. Reconciliation Report Generator
  getReconciliationReport: (): ReconciliationReportItem[] => {
    return RECHARGE_STORE.map((r) => {
      let reconciliationStatus: ReconciliationReportItem['reconciliationStatus'] = 'MATCHED';
      if (r.paymentStatus === 'PENDING') reconciliationStatus = 'PENDING';
      else if (r.paymentStatus === 'AMOUNT_MISMATCH') reconciliationStatus = 'MISMATCH';
      else if (r.paymentStatus === 'FAILED') reconciliationStatus = 'FAILED';

      return {
        rechargeId: r.rechargeId,
        tenantId: r.tenantId,
        expectedAmountINR: r.expectedAmountINR,
        paidAmountINR: r.amountINR,
        gatewayStatus: r.paymentStatus,
        walletCredited: r.paymentStatus === 'SUCCESS',
        reconciliationStatus,
      };
    });
  },
};
