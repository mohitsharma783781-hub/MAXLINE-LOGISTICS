import { supabase } from '../lib/supabaseClient';
import { apiClient } from './apiClient';
import { WalletService } from '../mocks/wallet.mock';

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

export interface AdminMerchantItem extends Record<string, unknown> {
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
  password?: string;
  businessType?: string;
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

const MERCHANTS_STORAGE_KEY = 'maxline_merchants_registry';

export function getRegisteredMerchantsFromStorage(): AdminMerchantItem[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(MERCHANTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {}
  return [];
}

export function saveRegisteredMerchantsToStorage(list: AdminMerchantItem[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(MERCHANTS_STORAGE_KEY, JSON.stringify(list));
    }
  } catch {}
}

export const AdminManagementService = {
  getRegisteredMerchantsFromStorage,
  saveRegisteredMerchantsToStorage,

  registerNewMerchant(merchant: AdminMerchantItem): void {
    const list = getRegisteredMerchantsFromStorage();
    const filtered = list.filter(
      (m) => m.id !== merchant.id && m.ownerEmail?.toLowerCase() !== merchant.ownerEmail?.toLowerCase()
    );
    filtered.unshift(merchant);
    saveRegisteredMerchantsToStorage(filtered);
  },
  /**
   * Fetch aggregate platform metrics directly from Supabase Cloud Database with fallback
   */
  async getDashboardStats(): Promise<AdminDashboardStats | null> {
    try {
      const [merchantsRes, shipmentsRes, walletsRes] = await Promise.all([
        supabase.from('merchants').select('status'),
        supabase.from('shipments').select('status, booking_status'),
        supabase.from('wallets').select('available_balance_minor, total_recharged_minor, total_spent_minor'),
      ]);

      const merchantsList = merchantsRes.data || [];
      const shipmentsList = shipmentsRes.data || [];
      const walletsList = walletsRes.data || [];

      const totalMerchants = merchantsList.length;
      const activeMerchants = merchantsList.filter((m) => m.status === 'ACTIVE').length;
      const pendingMerchants = merchantsList.filter((m) => m.status === 'PENDING_KYC').length;
      const suspendedMerchants = merchantsList.filter((m) => m.status === 'SUSPENDED').length;

      const totalShipments = shipmentsList.length;
      const deliveredShipments = shipmentsList.filter((s) => s.booking_status === 'DELIVERED' || s.status === 'DELIVERED').length;
      const inTransitShipments = shipmentsList.filter((s) => s.booking_status === 'IN_TRANSIT' || s.status === 'IN_TRANSIT').length;
      const pendingShipments = shipmentsList.filter((s) => s.booking_status === 'BOOKING_CONFIRMED' || s.booking_status === 'BOOKED').length;

      let totalAvailableMinor = 0;
      let totalRechargedMinor = 0;
      let totalSpentMinor = 0;

      walletsList.forEach((w) => {
        totalAvailableMinor += Number(w.available_balance_minor || 0);
        totalRechargedMinor += Number(w.total_recharged_minor || 0);
        totalSpentMinor += Number(w.total_spent_minor || 0);
      });

      if (totalMerchants > 0 || totalShipments > 0 || walletsList.length > 0) {
        return {
          merchants: {
            total: totalMerchants,
            active: activeMerchants,
            pending: pendingMerchants,
            suspended: suspendedMerchants,
          },
          shipments: {
            total: totalShipments,
            delivered: deliveredShipments,
            inTransit: inTransitShipments,
            pending: pendingShipments,
          },
          financials: {
            totalAvailableBalanceINR: totalAvailableMinor / 100,
            totalRechargedINR: totalRechargedMinor / 100,
            totalSpentINR: totalSpentMinor / 100,
          },
          timestamp: new Date().toISOString(),
        };
      }
    } catch (err: any) {
      console.warn('[AdminManagementService] Supabase stats query warning:', err?.message);
    }

    const res = await apiClient.get<AdminDashboardStats>('/admin/dashboard-stats');
    if (res.data) return res.data;
    return null;
  },

  /**
   * Fetch live registered merchants with user profile and wallet balance
   */
  async getMerchants(): Promise<AdminMerchantItem[]> {
    const localRegistered = getRegisteredMerchantsFromStorage();

    try {
      const [merchantsRes, usersRes, walletsRes, whRes] = await Promise.all([
        supabase.from('merchants').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('*'),
        supabase.from('wallets').select('*'),
        supabase.from('warehouses').select('merchant_id'),
      ]);

      const cloudList: AdminMerchantItem[] = (merchantsRes.data || []).map((m: any) => {
        const matchedUser = (usersRes.data || []).find((u: any) => u.id === m.id || u.auth_user_id === m.id);
        const matchedWallet = (walletsRes.data || []).find((w: any) => w.merchant_id === m.id);
        const whCount = (whRes.data || []).filter((w: any) => w.merchant_id === m.id).length;
        const wal = WalletService.getWallet(m.id);
        const liveBal = wal.availableBalanceMinor / 100;

        return {
          id: m.id,
          businessName: m.business_name || 'Registered Seller',
          status: m.status || 'ACTIVE',
          createdAt: m.created_at || new Date().toISOString(),
          ownerName: matchedUser?.full_name || 'Seller Owner',
          ownerEmail: matchedUser?.email || 'seller@maxlinelogistics.com',
          ownerPhone: matchedUser?.phone || '',
          warehouseCount: whCount || 0,
          walletBalanceINR: liveBal !== undefined ? liveBal : (matchedWallet ? Number(matchedWallet.available_balance_minor || 0) / 100 : 0),
          walletStatus: matchedWallet?.status || 'ACTIVE',
        };
      });

      // Merge local and cloud merchants seamlessly
      const merged = [...cloudList];
      for (const loc of localRegistered) {
        if (!merged.some((m) => m.id === loc.id || (m.ownerEmail && loc.ownerEmail && m.ownerEmail.toLowerCase() === loc.ownerEmail.toLowerCase()))) {
          const wal = WalletService.getWallet(loc.id);
          merged.push({
            ...loc,
            walletBalanceINR: wal.availableBalanceMinor / 100,
          });
        }
      }

      return merged;
    } catch (err: any) {
      console.warn('[AdminManagementService] Supabase getMerchants warning:', err?.message);
    }

    return localRegistered.map((m) => {
      const wal = WalletService.getWallet(m.id);
      return {
        ...m,
        walletBalanceINR: wal.availableBalanceMinor / 100,
      };
    });
  },

  /**
   * Update merchant active/suspended lifecycle status
   */
  async updateMerchantStatus(merchantId: string, status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_KYC' | 'CLOSED'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('merchants')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', merchantId);

      if (!error) return true;
    } catch (err: any) {
      console.warn('[AdminManagementService] Supabase updateMerchantStatus warning:', err?.message);
    }

    const res = await apiClient.put<{ merchantId: string; status: string }>(`/admin/merchants/${merchantId}/status`, { status });
    return !res.error;
  },

  /**
   * Fetch all merchant wallets directly connected with WalletService & Supabase
   */
  async getWallets(): Promise<AdminWalletItem[]> {
    const merchants = await AdminManagementService.getMerchants();
    return merchants.map((m) => {
      const wal = WalletService.getWallet(m.id);
      return {
        id: `wal-${m.id}`,
        merchantId: m.id,
        merchantName: m.businessName,
        email: m.ownerEmail,
        balanceINR: wal.availableBalanceMinor / 100,
        totalRechargedINR: wal.totalRefundedMinor / 100,
        totalSpentINR: wal.totalSpentMinor / 100,
        status: wal.status === 'ACTIVE' ? 'ACTIVE' : 'FROZEN',
        updatedAt: wal.updatedAt,
      };
    });
  },

  /**
   * Adjust merchant wallet balance with real-time sync between Admin and Seller portals
   */
  async adjustWallet(payload: AdjustWalletPayload): Promise<{ success: boolean; message: string; newBalanceINR?: number }> {
    const isCredit = payload.type === 'MANUAL_CREDIT';
    let newBalINR = 0;

    // 1. Immediately update local WalletService so Seller Portal reflects it instantly
    if (isCredit) {
      WalletService.credit(payload.amountINR, payload.description || 'Super Admin Credit Adjustment', payload.merchantId);
      const updatedWal = WalletService.getWallet(payload.merchantId);
      newBalINR = updatedWal.availableBalanceMinor / 100;
    } else {
      const wal = WalletService.getWallet(payload.merchantId);
      const amountMinor = Math.round(payload.amountINR * 100);
      wal.availableBalanceMinor = Math.max(0, wal.availableBalanceMinor - amountMinor);
      wal.totalSpentMinor += amountMinor;
      wal.updatedAt = new Date().toLocaleString();
      newBalINR = wal.availableBalanceMinor / 100;
    }

    // 2. Also update in local merchants registry cache
    const registry = getRegisteredMerchantsFromStorage();
    const targetM = registry.find((m) => m.id === payload.merchantId);
    if (targetM) {
      targetM.walletBalanceINR = newBalINR;
      saveRegisteredMerchantsToStorage(registry);
    }

    // 3. Asynchronously sync to Supabase Cloud DB
    try {
      const amountMinor = Math.round(payload.amountINR * 100);
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('merchant_id', payload.merchantId)
        .maybeSingle();

      if (wallet) {
        const currentMinor = Number(wallet.available_balance_minor || 0);
        const newMinor = isCredit ? currentMinor + amountMinor : Math.max(0, currentMinor - amountMinor);
        const rechargedMinor = isCredit
          ? Number(wallet.total_recharged_minor || 0) + amountMinor
          : Number(wallet.total_recharged_minor || 0);

        await supabase
          .from('wallets')
          .update({
            available_balance_minor: newMinor,
            total_recharged_minor: rechargedMinor,
            updated_at: new Date().toISOString(),
          })
          .eq('id', wallet.id);

        await supabase.from('wallet_transactions').insert({
          merchant_id: payload.merchantId,
          wallet_id: wallet.id,
          type: payload.type,
          direction: isCredit ? 'CREDIT' : 'DEBIT',
          amount_minor: amountMinor,
          currency: 'INR',
          description: payload.description || `Super Admin ${isCredit ? 'Credit' : 'Debit'} Adjustment`,
          reference_type: 'ADJUSTMENT',
          reference_id: `ADJ-${Date.now()}`,
        });
      }
    } catch (err: any) {
      console.warn('[AdminManagementService] Supabase adjustWallet sync notice:', err?.message);
    }

    return {
      success: true,
      message: `Wallet balance successfully adjusted by ₹${payload.amountINR.toLocaleString('en-IN')}`,
      newBalanceINR: newBalINR,
    };
  },
};
