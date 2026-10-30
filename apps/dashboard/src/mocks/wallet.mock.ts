import type {
  Wallet,
  WalletTransaction,
  ShipmentCharge,
  TransactionFilterState,
  WalletStatus,
  ChargeBreakdown,
} from '../types/wallet';
import { parseINRToMinor } from '../utils/moneyFormat';
import { SupabaseWalletService } from '../services/supabase/supabaseWalletService';

// INITIAL DEMO WALLET RECORD
export const INITIAL_WALLET: Wallet = {
  id: 'wal-demo-01',
  tenantId: 'tenant-demo-01',
  currency: 'INR',
  availableBalanceMinor: 0, // ₹0.00 Fresh State
  reservedBalanceMinor: 0,
  totalSpentMinor: 0,
  totalRefundedMinor: 0,
  lowBalanceThresholdMinor: 50000, // ₹500.00 threshold
  status: 'ACTIVE',
  createdAt: new Date().toLocaleString(),
  updatedAt: new Date().toLocaleString(),
};

// INITIAL TRANSACTIONS
export const INITIAL_TRANSACTIONS: WalletTransaction[] = [];

// STORES & PERSISTENCE
function getActiveTenantId(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const active = localStorage.getItem('courrier3_active_tenant_id');
      if (active) return active;
    }
  } catch {}
  return 'tenant-demo-01';
}

function getWalletStorageKey(tenantId: string) {
  return tenantId === 'tenant-demo-01' ? 'COURRIER3_WALLET_STORE' : `COURRIER3_WALLET_STORE_${tenantId}`;
}

function getTxStorageKey(tenantId: string) {
  return tenantId === 'tenant-demo-01' ? 'COURRIER3_TX_STORE' : `COURRIER3_TX_STORE_${tenantId}`;
}

const MEMORY_WALLET_CACHE: Map<string, Wallet> = new Map();
const MEMORY_TX_CACHE: Map<string, WalletTransaction[]> = new Map();

function loadWalletFromStorage(tenantId: string): Wallet {
  const key = getWalletStorageKey(tenantId);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  if (MEMORY_WALLET_CACHE.has(tenantId)) {
    return MEMORY_WALLET_CACHE.get(tenantId)!;
  }
  if (tenantId === 'tenant-demo-01') {
    const demo = { ...INITIAL_WALLET };
    MEMORY_WALLET_CACHE.set(tenantId, demo);
    return demo;
  }
  const fresh: Wallet = {
    id: `wal-${tenantId}`,
    tenantId,
    currency: 'INR',
    availableBalanceMinor: 0, // ₹0.00 Fresh State for new merchant
    reservedBalanceMinor: 0,
    totalSpentMinor: 0,
    totalRefundedMinor: 0,
    lowBalanceThresholdMinor: 50000,
    status: 'ACTIVE',
    createdAt: new Date().toLocaleString(),
    updatedAt: new Date().toLocaleString(),
  };
  MEMORY_WALLET_CACHE.set(tenantId, fresh);
  return fresh;
}

function saveWalletToStorage(wallet: Wallet) {
  MEMORY_WALLET_CACHE.set(wallet.tenantId, wallet);
  const key = getWalletStorageKey(wallet.tenantId);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, JSON.stringify(wallet));
    }
  } catch {}
}

function loadTxsFromStorage(tenantId: string): WalletTransaction[] {
  const key = getTxStorageKey(tenantId);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {}
  if (MEMORY_TX_CACHE.has(tenantId)) {
    return MEMORY_TX_CACHE.get(tenantId)!;
  }
  const initial = tenantId === 'tenant-demo-01' ? [...INITIAL_TRANSACTIONS] : [];
  MEMORY_TX_CACHE.set(tenantId, initial);
  return initial;
}

function saveTxsToStorage(tenantId: string, txs: WalletTransaction[]) {
  MEMORY_TX_CACHE.set(tenantId, txs);
  const key = getTxStorageKey(tenantId);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, JSON.stringify(txs));
    }
  } catch {}
}

const CHARGE_STORE: Map<string, ShipmentCharge> = new Map();

export const WalletService = {
  getWallet: (tenantId?: string): Wallet => {
    const tid = tenantId || getActiveTenantId();
    const wallet = loadWalletFromStorage(tid);
    if (wallet.availableBalanceMinor <= wallet.lowBalanceThresholdMinor && wallet.status === 'ACTIVE') {
      wallet.status = 'LOW_BALANCE';
    } else if (wallet.availableBalanceMinor > wallet.lowBalanceThresholdMinor && wallet.status === 'LOW_BALANCE') {
      wallet.status = 'ACTIVE';
    }
    return { ...wallet };
  },

  getWalletSummaryStats: (tenantId?: string) => {
    const tid = tenantId || getActiveTenantId();
    const wallet = WalletService.getWallet(tid);
    const list = loadTxsFromStorage(tid);
    let totalAddedMinor = 0;
    let totalUsedMinor = 0;

    list.forEach((tx) => {
      if (tx.direction === 'CREDIT' && tx.status === 'POSTED') {
        totalAddedMinor += tx.amountMinor;
      } else if (tx.direction === 'DEBIT' && tx.status === 'POSTED') {
        totalUsedMinor += tx.amountMinor;
      }
    });

    return {
      availableBalanceINR: wallet.availableBalanceMinor / 100,
      totalAddedINR: totalAddedMinor / 100,
      totalUsedINR: totalUsedMinor / 100,
      lowBalanceThresholdINR: wallet.lowBalanceThresholdMinor / 100,
      isLowBalance: wallet.availableBalanceMinor <= wallet.lowBalanceThresholdMinor,
    };
  },

  getTransactions: (filters?: TransactionFilterState, tenantId?: string): WalletTransaction[] => {
    const tid = tenantId || getActiveTenantId();
    const list = loadTxsFromStorage(tid);
    if (!filters) return list;

    return list.filter((item) => {
      if (filters.status !== 'all' && item.status !== filters.status) return false;
      if (filters.direction !== 'all' && item.direction !== filters.direction) return false;
      if (filters.type !== 'all' && item.type !== filters.type) return false;
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          item.id.toLowerCase().includes(q) ||
          item.referenceId.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  },

  getTransactionById: (id: string, tenantId?: string): WalletTransaction | null => {
    const tid = tenantId || getActiveTenantId();
    const list = loadTxsFromStorage(tid);
    return list.find((t) => t.id === id || t.referenceId === id) || null;
  },

  recharge: (amountINR: number, providerName = 'DemoPaymentProvider', tenantId?: string): WalletTransaction => {
    const tid = tenantId || getActiveTenantId();
    const wallet = loadWalletFromStorage(tid);
    const amountMinor = parseINRToMinor(amountINR);
    const balanceBefore = wallet.availableBalanceMinor;
    const balanceAfter = balanceBefore + amountMinor;

    wallet.availableBalanceMinor = balanceAfter;
    wallet.updatedAt = new Date().toLocaleString();
    saveWalletToStorage(wallet);

    const txs = loadTxsFromStorage(tid);
    const txId = `tx-${Date.now()}`;
    const newTx: WalletTransaction = {
      id: txId,
      tenantId: tid,
      walletId: wallet.id,
      type: 'RECHARGE',
      direction: 'CREDIT',
      amountMinor,
      currency: 'INR',
      referenceType: 'RECHARGE',
      referenceId: `DEMO-PAY-${Math.floor(100000 + Math.random() * 900000)}`,
      description: `Wallet Balance Added via ${providerName} (Demo Mode)`,
      balanceBeforeMinor: balanceBefore,
      balanceAfterMinor: balanceAfter,
      status: 'POSTED',
      idempotencyKey: `recharge-${txId}`,
      createdAt: new Date().toLocaleString(),
      actorType: 'MERCHANT',
    };

    txs.unshift(newTx);
    saveTxsToStorage(tid, txs);

    // Asynchronously synchronize credit with Supabase Cloud DB
    SupabaseWalletService.creditWalletRPC({
      tenantId: tid,
      amountMinor,
      type: 'RECHARGE',
      referenceType: 'RECHARGE',
      referenceId: newTx.referenceId,
      description: newTx.description,
      idempotencyKey: newTx.idempotencyKey,
      actorType: 'MERCHANT',
    }).catch(() => {});

    return newTx;
  },

  debit: (
    shipmentId: string,
    orderId: string,
    courierId: string,
    courierName: string,
    amountINR: number,
    breakdown?: Partial<ChargeBreakdown>,
    tenantId?: string
  ): { success: boolean; message: string; transaction: WalletTransaction | null } => {
    const tid = tenantId || getActiveTenantId();
    const wallet = loadWalletFromStorage(tid);

    // 1. Wallet status check
    if (wallet.status === 'SUSPENDED') {
      return { success: false, message: 'Wallet is suspended. Debit operations are blocked.', transaction: null };
    }

    // 2. Double charge protection check
    const txs = loadTxsFromStorage(tid);
    const idempotencyKey = `shipment-charge:${shipmentId}`;
    const existing = txs.find((t) => t.idempotencyKey === idempotencyKey);
    if (existing) {
      return { success: false, message: 'Shipment has already been charged (Double charge protection).', transaction: existing };
    }

    // 3. Sufficient balance check
    const amountMinor = parseINRToMinor(amountINR);
    if (wallet.availableBalanceMinor < amountMinor) {
      return {
        success: false,
        message: `Insufficient wallet balance. Required ₹${amountINR}, Available ₹${(wallet.availableBalanceMinor / 100).toFixed(2)}.`,
        transaction: null,
      };
    }

    // 4. Atomic balance deduction
    const balanceBefore = wallet.availableBalanceMinor;
    const balanceAfter = balanceBefore - amountMinor;

    wallet.availableBalanceMinor = balanceAfter;
    wallet.totalSpentMinor += amountMinor;
    wallet.updatedAt = new Date().toLocaleString();
    saveWalletToStorage(wallet);

    const txId = `tx-${Date.now()}`;
    const newTx: WalletTransaction = {
      id: txId,
      tenantId: tid,
      walletId: wallet.id,
      type: 'SHIPMENT_CHARGE',
      direction: 'DEBIT',
      amountMinor,
      currency: 'INR',
      referenceType: 'SHIPMENT',
      referenceId: shipmentId,
      description: `Shipment Freight Charge (${courierName} • Order ${orderId})`,
      balanceBeforeMinor: balanceBefore,
      balanceAfterMinor: balanceAfter,
      status: 'POSTED',
      idempotencyKey,
      createdAt: new Date().toLocaleString(),
      actorType: 'SYSTEM',
    };

    txs.unshift(newTx);
    saveTxsToStorage(tid, txs);

    // Record shipment charge breakdown
    const nowStr = new Date().toLocaleString();
    const chargeRecord: ShipmentCharge = {
      id: `chg-${Date.now()}`,
      tenantId: tid,
      shipmentId,
      orderId,
      courierId,
      courierName,
      currency: 'INR',
      baseFreightMinor: breakdown?.baseFreightMinor || parseINRToMinor(amountINR * 0.7),
      fuelSurchargeMinor: breakdown?.fuelSurchargeMinor || parseINRToMinor(amountINR * 0.15),
      codFeeMinor: breakdown?.codFeeMinor || 0,
      handlingFeeMinor: breakdown?.handlingFeeMinor || 0,
      otherChargesMinor: breakdown?.otherChargesMinor || 0,
      discountMinor: breakdown?.discountMinor || 0,
      taxMinor: breakdown?.taxMinor || parseINRToMinor(amountINR * 0.15),
      totalMinor: amountMinor,
      status: 'POSTED',
      createdAt: nowStr,
    };
    CHARGE_STORE.set(shipmentId, chargeRecord);

    // Asynchronously synchronize debit with Supabase Cloud DB via row-locked RPC
    SupabaseWalletService.debitWalletRPC({
      tenantId: tid,
      amountMinor,
      shipmentId,
      orderId,
      courierName,
      idempotencyKey,
    }).catch(() => {});

    return { success: true, message: 'Shipment charge posted successfully.', transaction: newTx };
  },

  reserve: (amountINR: number, referenceId: string, tenantId?: string): { success: boolean; message: string } => {
    const tid = tenantId || getActiveTenantId();
    const wallet = loadWalletFromStorage(tid);
    const amountMinor = parseINRToMinor(amountINR);
    if (wallet.availableBalanceMinor < amountMinor) {
      return { success: false, message: 'Insufficient balance to reserve funds for booking.' };
    }

    wallet.availableBalanceMinor -= amountMinor;
    wallet.reservedBalanceMinor += amountMinor;
    wallet.updatedAt = new Date().toLocaleString();
    saveWalletToStorage(wallet);

    const txs = loadTxsFromStorage(tid);
    const txId = `tx-${Date.now()}`;
    const newTx: WalletTransaction = {
      id: txId,
      tenantId: tid,
      walletId: wallet.id,
      type: 'RESERVATION',
      direction: 'DEBIT',
      amountMinor,
      currency: 'INR',
      referenceType: 'RESERVATION',
      referenceId,
      description: `Hold reserved for booking (${referenceId})`,
      balanceBeforeMinor: wallet.availableBalanceMinor + amountMinor,
      balanceAfterMinor: wallet.availableBalanceMinor,
      status: 'POSTED',
      idempotencyKey: `reserve:${referenceId}`,
      createdAt: new Date().toLocaleString(),
      actorType: 'SYSTEM',
    };

    txs.unshift(newTx);
    saveTxsToStorage(tid, txs);
    return { success: true, message: 'Funds reserved successfully.' };
  },

  releaseReservation: (amountINR: number, referenceId: string, tenantId?: string): { success: boolean; message: string } => {
    const tid = tenantId || getActiveTenantId();
    const wallet = loadWalletFromStorage(tid);
    const amountMinor = parseINRToMinor(amountINR);
    if (wallet.reservedBalanceMinor < amountMinor) {
      return { success: false, message: 'Reserved balance is smaller than requested release amount.' };
    }

    wallet.reservedBalanceMinor -= amountMinor;
    wallet.availableBalanceMinor += amountMinor;
    wallet.updatedAt = new Date().toLocaleString();
    saveWalletToStorage(wallet);

    const txs = loadTxsFromStorage(tid);
    const txId = `tx-${Date.now()}`;
    const newTx: WalletTransaction = {
      id: txId,
      tenantId: tid,
      walletId: wallet.id,
      type: 'RESERVATION_RELEASE',
      direction: 'CREDIT',
      amountMinor,
      currency: 'INR',
      referenceType: 'RESERVATION',
      referenceId,
      description: `Reservation hold released (${referenceId})`,
      balanceBeforeMinor: wallet.availableBalanceMinor - amountMinor,
      balanceAfterMinor: wallet.availableBalanceMinor,
      status: 'POSTED',
      idempotencyKey: `release:${referenceId}`,
      createdAt: new Date().toLocaleString(),
      actorType: 'SYSTEM',
    };

    txs.unshift(newTx);
    saveTxsToStorage(tid, txs);
    return { success: true, message: 'Reservation released successfully.' };
  },

  withdraw: (amountINR: number, description: string, tenantId?: string): WalletTransaction => {
    const tid = tenantId || getActiveTenantId();
    const wallet = loadWalletFromStorage(tid);
    const amountMinor = parseINRToMinor(amountINR);
    const balanceBefore = wallet.availableBalanceMinor;
    const balanceAfter = Math.max(0, balanceBefore - amountMinor);

    wallet.availableBalanceMinor = balanceAfter;
    wallet.totalSpentMinor += amountMinor;
    wallet.updatedAt = new Date().toLocaleString();
    saveWalletToStorage(wallet);

    const txs = loadTxsFromStorage(tid);
    const txId = `tx-${Date.now()}`;
    const newTx: WalletTransaction = {
      id: txId,
      tenantId: tid,
      walletId: wallet.id,
      type: 'ADJUSTMENT',
      direction: 'DEBIT',
      amountMinor,
      currency: 'INR',
      referenceType: 'ADJUSTMENT',
      referenceId: `WD-ADJ-${Date.now()}`,
      description,
      balanceBeforeMinor: balanceBefore,
      balanceAfterMinor: balanceAfter,
      status: 'POSTED',
      idempotencyKey: `withdraw-${txId}`,
      createdAt: new Date().toLocaleString(),
      actorType: 'SYSTEM',
    };

    txs.unshift(newTx);
    saveTxsToStorage(tid, txs);
    return newTx;
  },

  refund: (
    targetTxId: string,
    refundAmountINR: number,
    reason: string,
    tenantId?: string
  ): { success: boolean; message: string; transaction: WalletTransaction | null } => {
    const tid = tenantId || getActiveTenantId();
    const txs = loadTxsFromStorage(tid);
    const originalTx = txs.find((t) => t.id === targetTxId);
    if (!originalTx) return { success: false, message: 'Original transaction not found.', transaction: null };

    if (originalTx.direction !== 'DEBIT') {
      return { success: false, message: 'Cannot refund a CREDIT transaction.', transaction: null };
    }

    const refundAmountMinor = parseINRToMinor(refundAmountINR);
    if (refundAmountMinor > originalTx.amountMinor) {
      return { success: false, message: 'Refund amount cannot exceed original debit transaction amount.', transaction: null };
    }

    const wallet = loadWalletFromStorage(tid);
    const balanceBefore = wallet.availableBalanceMinor;
    const balanceAfter = balanceBefore + refundAmountMinor;

    wallet.availableBalanceMinor = balanceAfter;
    wallet.totalRefundedMinor += refundAmountMinor;
    wallet.updatedAt = new Date().toLocaleString();
    saveWalletToStorage(wallet);

    const txId = `tx-${Date.now()}`;
    const newTx: WalletTransaction = {
      id: txId,
      tenantId: tid,
      walletId: wallet.id,
      type: 'REFUND',
      direction: 'CREDIT',
      amountMinor: refundAmountMinor,
      currency: 'INR',
      referenceType: originalTx.referenceType,
      referenceId: originalTx.referenceId,
      description: `Refund for ${originalTx.referenceId} (${reason})`,
      balanceBeforeMinor: balanceBefore,
      balanceAfterMinor: balanceAfter,
      status: 'POSTED',
      idempotencyKey: `refund:${targetTxId}:${Date.now()}`,
      createdAt: new Date().toLocaleString(),
      actorType: 'ADMIN',
    };

    txs.unshift(newTx);
    saveTxsToStorage(tid, txs);
    return { success: true, message: 'Refund posted successfully.', transaction: newTx };
  },

  adjust: (
    amountINR: number,
    direction: 'CREDIT' | 'DEBIT',
    reason: string,
    tenantId?: string
  ): { success: boolean; message: string; transaction: WalletTransaction | null } => {
    if (!reason || !reason.trim()) {
      return { success: false, message: 'Adjustment reason is required.', transaction: null };
    }

    const tid = tenantId || getActiveTenantId();
    const wallet = loadWalletFromStorage(tid);
    const amountMinor = parseINRToMinor(amountINR);
    const balanceBefore = wallet.availableBalanceMinor;

    if (direction === 'DEBIT' && balanceBefore < amountMinor) {
      return { success: false, message: 'Insufficient balance for debit adjustment.', transaction: null };
    }

    const balanceAfter = direction === 'CREDIT' ? balanceBefore + amountMinor : balanceBefore - amountMinor;

    wallet.availableBalanceMinor = balanceAfter;
    wallet.updatedAt = new Date().toLocaleString();
    saveWalletToStorage(wallet);

    const txs = loadTxsFromStorage(tid);
    const txId = `tx-${Date.now()}`;
    const newTx: WalletTransaction = {
      id: txId,
      tenantId: tid,
      walletId: wallet.id,
      type: 'ADJUSTMENT',
      direction,
      amountMinor,
      currency: 'INR',
      referenceType: 'ADJUSTMENT',
      referenceId: `ADJ-${Math.floor(100000 + Math.random() * 900000)}`,
      description: `Balance Adjustment (${direction}) • ${reason}`,
      balanceBeforeMinor: balanceBefore,
      balanceAfterMinor: balanceAfter,
      status: 'POSTED',
      idempotencyKey: `adj-${txId}`,
      createdAt: new Date().toLocaleString(),
      actorType: 'ADMIN',
    };

    txs.unshift(newTx);
    saveTxsToStorage(tid, txs);
    return { success: true, message: 'Adjustment posted successfully.', transaction: newTx };
  },

  toggleWalletStatus: (status: WalletStatus, tenantId?: string): Wallet => {
    const tid = tenantId || getActiveTenantId();
    const wallet = loadWalletFromStorage(tid);
    wallet.status = status;
    wallet.updatedAt = new Date().toLocaleString();
    saveWalletToStorage(wallet);
    return { ...wallet };
  },

  getShipmentCharge: (shipmentId: string): ShipmentCharge | null => {
    return CHARGE_STORE.get(shipmentId) || null;
  },

  // Synchronize latest wallet balance and transactions from Supabase Cloud DB
  syncFromSupabase: async (tenantId?: string): Promise<Wallet> => {
    const tid = tenantId || getActiveTenantId();
    try {
      const [cloudWallet, cloudTxs] = await Promise.all([
        SupabaseWalletService.fetchWallet(tid),
        SupabaseWalletService.fetchTransactions(tid),
      ]);

      if (cloudWallet) {
        saveWalletToStorage(cloudWallet);
      }
      if (cloudTxs && cloudTxs.length > 0) {
        saveTxsToStorage(tid, cloudTxs);
      }
    } catch (err: any) {
      console.warn('[WalletService] Supabase sync warning:', err?.message);
    }
    return WalletService.getWallet(tid);
  },
};
