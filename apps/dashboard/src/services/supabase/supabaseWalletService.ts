import { supabase } from '../../lib/supabaseClient';
import { toValidTenantUUID } from '../../utils/uuidHelper';
import type { Wallet, WalletTransaction } from '../../types/wallet';

export const SupabaseWalletService = {
  /**
   * Fetch current wallet balance and metrics from Supabase PostgreSQL.
   */
  async fetchWallet(tenantId?: string): Promise<Wallet | null> {
    try {
      const validTid = toValidTenantUUID(tenantId);
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('merchant_id', validTid)
        .maybeSingle();

      if (error) {
        console.warn('[SupabaseWalletService] Fetch wallet warning:', error.message);
        return null;
      }

      if (!data) return null;

      const available = Number(data.available_balance_minor || 0);
      const threshold = Number(data.low_balance_threshold_minor || 50000);
      let status = data.status || 'ACTIVE';
      if (available <= threshold && status === 'ACTIVE') {
        status = 'LOW_BALANCE';
      }

      return {
        id: data.id,
        tenantId: data.merchant_id,
        currency: data.currency || 'INR',
        availableBalanceMinor: available,
        reservedBalanceMinor: Number(data.reserved_balance_minor || 0),
        totalSpentMinor: Number(data.total_spent_minor || 0),
        totalRefundedMinor: Number(data.total_recharged_minor || 0),
        lowBalanceThresholdMinor: threshold,
        status,
        createdAt: data.created_at ? new Date(data.created_at).toLocaleString() : new Date().toLocaleString(),
        updatedAt: data.updated_at ? new Date(data.updated_at).toLocaleString() : new Date().toLocaleString(),
      };
    } catch (err: any) {
      console.warn('[SupabaseWalletService] Fetch wallet exception:', err.message);
      return null;
    }
  },

  /**
   * Fetch immutable financial audit transactions for a tenant from Supabase.
   */
  async fetchTransactions(tenantId?: string): Promise<WalletTransaction[]> {
    try {
      const validTid = toValidTenantUUID(tenantId);
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('merchant_id', validTid)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[SupabaseWalletService] Fetch transactions warning:', error.message);
        return [];
      }

      if (!data || !Array.isArray(data)) return [];

      return data.map((row: any) => ({
        id: row.id,
        tenantId: row.merchant_id,
        walletId: row.wallet_id,
        type: row.type,
        direction: row.direction,
        amountMinor: Number(row.amount_minor),
        currency: row.currency || 'INR',
        referenceType: row.reference_type,
        referenceId: row.reference_id,
        description: row.description,
        balanceBeforeMinor: Number(row.balance_before_minor),
        balanceAfterMinor: Number(row.balance_after_minor),
        status: 'POSTED',
        idempotencyKey: row.idempotency_key,
        createdAt: row.created_at ? new Date(row.created_at).toLocaleString() : new Date().toLocaleString(),
        actorType: row.is_system_generated ? 'SYSTEM' : 'MERCHANT',
      }));
    } catch (err: any) {
      console.warn('[SupabaseWalletService] Fetch transactions exception:', err.message);
      return [];
    }
  },

  /**
   * Execute atomic wallet debit via secure DB RPC procedure.
   */
  async debitWalletRPC(params: {
    tenantId: string;
    amountMinor: number;
    shipmentId: string;
    orderId: string;
    courierName: string;
    idempotencyKey: string;
  }): Promise<{ success: boolean; message: string; transactionId?: string; isDuplicate?: boolean }> {
    try {
      const validTid = toValidTenantUUID(params.tenantId);
      const { data, error } = await supabase.rpc('debit_wallet_rpc', {
        p_merchant_id: validTid,
        p_amount_minor: Math.round(params.amountMinor),
        p_reference_type: 'SHIPMENT',
        p_reference_id: params.shipmentId || params.orderId,
        p_idempotency_key: params.idempotencyKey,
        p_description: `Freight debit for ${params.courierName || 'Courier'} - Order ${params.orderId}`,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data && typeof data === 'object') {
        return {
          success: !!data.success,
          message: data.message || 'Debit posted',
          transactionId: data.transaction_id,
          isDuplicate: !!data.is_duplicate,
        };
      }

      return { success: true, message: 'Debit successful' };
    } catch (err: any) {
      return { success: false, message: err.message || 'RPC debit error' };
    }
  },

  /**
   * Execute atomic wallet credit (recharge or refund) via secure DB RPC procedure.
   * NOTE: Under MAXLINE Stage 1.6 security policy, credit_wallet_rpc is restricted to service_role (backend verified payment only).
   */
  async creditWalletRPC(params: {
    tenantId: string;
    amountMinor: number;
    type: 'RECHARGE' | 'REFUND' | 'ADJUSTMENT';
    referenceType: string;
    referenceId: string;
    description: string;
    idempotencyKey: string;
    actorType?: string;
  }): Promise<{ success: boolean; message: string; transactionId?: string }> {
    try {
      const validTid = toValidTenantUUID(params.tenantId);
      const { data, error } = await supabase.rpc('credit_wallet_rpc', {
        p_merchant_id: validTid,
        p_amount_minor: Math.round(params.amountMinor),
        p_reference_type: params.referenceType,
        p_reference_id: params.referenceId,
        p_idempotency_key: params.idempotencyKey,
        p_description: params.description,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data && typeof data === 'object') {
        return {
          success: !!data.success,
          message: data.message || 'Credit posted',
          transactionId: data.transaction_id,
        };
      }

      return { success: true, message: 'Credit successful' };
    } catch (err: any) {
      return { success: false, message: err.message || 'RPC credit error' };
    }
  },
};
