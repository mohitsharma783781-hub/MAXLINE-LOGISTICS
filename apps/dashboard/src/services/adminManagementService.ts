import { apiClient } from './apiClient';

export interface AdminDashboardStats {
  merchants: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
  };
  shipments: {
    total: number;
    delivered: number;
    inTransit: number;
    pending: number;
  };
  financials: {
    totalAvailableBalanceINR: number;
    totalRechargedINR: number;
    totalSpentINR: number;
  };
  timestamp: string;
}

export interface AdminMerchantItem {
  id: string;
  businessName: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_KYC' | 'CLOSED';
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  warehouseCount: number;
  walletBalanceINR: number;
  walletStatus: string;
}

export interface AdminWalletItem {
  id: string;
  merchantId: string;
  merchantName: string;
  email: string;
  balanceINR: number;
  totalRechargedINR: number;
  totalSpentINR: number;
  status: 'ACTIVE' | 'FROZEN' | 'SUSPENDED';
  updatedAt: string;
}

export interface AdjustWalletPayload {
  merchantId: string;
  amountINR: number;
  type: 'MANUAL_CREDIT' | 'MANUAL_DEBIT';
  description: string;
}

export const AdminManagementService = {
  /**
   * Fetch aggregate platform metrics from Supabase database
   */
  async getDashboardStats(): Promise<AdminDashboardStats | null> {
    const res = await apiClient.get<AdminDashboardStats>('/admin/dashboard-stats');
    if (res.data) return res.data;
    console.warn('[AdminManagementService] Failed to fetch stats:', res.error?.message);
    return null;
  },

  /**
   * Fetch live registered merchants with user profile and wallet balance
   */
  async getMerchants(): Promise<AdminMerchantItem[]> {
    const res = await apiClient.get<AdminMerchantItem[]>('/admin/merchants');
    if (res.data && Array.isArray(res.data)) return res.data;
    console.warn('[AdminManagementService] Failed to fetch merchants:', res.error?.message);
    return [];
  },

  /**
   * Update merchant active/suspended lifecycle status
   */
  async updateMerchantStatus(merchantId: string, status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_KYC' | 'CLOSED'): Promise<boolean> {
    const res = await apiClient.put<{ merchantId: string; status: string }>(`/admin/merchants/${merchantId}/status`, { status });
    return !res.error;
  },

  /**
   * Fetch all merchant wallets
   */
  async getWallets(): Promise<AdminWalletItem[]> {
    const res = await apiClient.get<AdminWalletItem[]>('/admin/wallets');
    if (res.data && Array.isArray(res.data)) return res.data;
    console.warn('[AdminManagementService] Failed to fetch wallets:', res.error?.message);
    return [];
  },

  /**
   * Adjust merchant wallet balance with immutable audit trail
   */
  async adjustWallet(payload: AdjustWalletPayload): Promise<{ success: boolean; message: string; newBalanceINR?: number }> {
    const res = await apiClient.post<{ message: string; transactionId: string; newBalanceINR: number }>('/admin/wallets/adjust', payload);
    if (res.data) {
      return { success: true, message: res.data.message, newBalanceINR: res.data.newBalanceINR };
    }
    return { success: false, message: res.error?.message || 'Adjustment failed' };
  },
};
