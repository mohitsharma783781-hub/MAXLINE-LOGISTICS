import type { StatusType } from './component';

export type WalletStatus = 'ACTIVE' | 'LOW_BALANCE' | 'SUSPENDED';

export type TransactionType =
  | 'RECHARGE'
  | 'SHIPMENT_CHARGE'
  | 'REFUND'
  | 'ADJUSTMENT'
  | 'RESERVATION'
  | 'RESERVATION_RELEASE';

export type TransactionDirection = 'CREDIT' | 'DEBIT';

export type TransactionStatus = 'POSTED' | 'PENDING' | 'FAILED' | 'REVERSED';

export interface WalletStatusConfig {
  key: WalletStatus;
  label: string;
  variant: StatusType;
}

export const WALLET_STATUS_CONFIG: WalletStatusConfig[] = [
  { key: 'ACTIVE', label: 'Active Balance', variant: 'success' },
  { key: 'LOW_BALANCE', label: 'Low Balance Warning', variant: 'warning' },
  { key: 'SUSPENDED', label: 'Wallet Suspended', variant: 'danger' },
];

export interface Wallet extends Record<string, unknown> {
  id: string;
  tenantId: string;
  currency: 'INR';
  availableBalanceMinor: number; // in paise
  reservedBalanceMinor: number; // in paise
  totalSpentMinor: number; // in paise
  totalRefundedMinor: number; // in paise
  lowBalanceThresholdMinor: number; // in paise (e.g. 50000 = ₹500.00)
  status: WalletStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction extends Record<string, unknown> {
  id: string;
  tenantId: string;
  walletId: string;
  type: TransactionType;
  direction: TransactionDirection;
  amountMinor: number; // in paise
  currency: 'INR';
  referenceType: 'SHIPMENT' | 'ORDER' | 'RECHARGE' | 'ADJUSTMENT' | 'RESERVATION';
  referenceId: string;
  description: string;
  balanceBeforeMinor: number;
  balanceAfterMinor: number;
  status: TransactionStatus;
  idempotencyKey: string;
  createdAt: string;
  actorType?: 'SYSTEM' | 'MERCHANT' | 'ADMIN';
}

export interface ChargeBreakdown {
  baseFreightMinor: number;
  fuelSurchargeMinor: number;
  codFeeMinor: number;
  handlingFeeMinor: number;
  otherChargesMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
}

export interface ShipmentCharge extends Record<string, unknown> {
  id: string;
  tenantId: string;
  shipmentId: string;
  orderId: string;
  courierId: string;
  courierName: string;
  currency: 'INR';
  baseFreightMinor: number;
  fuelSurchargeMinor: number;
  codFeeMinor: number;
  handlingFeeMinor: number;
  otherChargesMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  status: 'PENDING' | 'POSTED' | 'REFUNDED' | 'VOIDED';
  createdAt: string;
}

export interface TransactionFilterState {
  searchQuery: string;
  type: string;
  direction: string;
  status: string;
}
