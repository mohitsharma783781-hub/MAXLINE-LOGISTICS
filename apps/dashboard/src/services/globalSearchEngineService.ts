import { WeightDiscrepancyService } from './weightDiscrepancyService';
import { GstInvoiceService } from './gstInvoiceService';
import type { StatusType } from '../types/component';

export type SearchCategory =
  | 'ACTIONS'
  | 'PAGES'
  | 'SHIPMENTS'
  | 'CUSTOMERS'
  | 'INVOICES'
  | 'DISPUTES'
  | 'MANIFESTS'
  | 'RATE_CARDS';

export interface SearchResultItem extends Record<string, unknown> {
  id: string;
  category: SearchCategory;
  categoryLabel: string;
  title: string;
  subtitle?: string;
  statusLabel?: string;
  statusVariant?: StatusType;
  route: string;
  score: number; // Higher is better (exact match = 100)
  iconName?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResponse {
  query: string;
  totalResults: number;
  resultsByCategory: Record<SearchCategory, SearchResultItem[]>;
  flatResults: SearchResultItem[];
  exactMatch?: SearchResultItem;
}

// Memory / LocalStorage store for user recent searches
const RECENT_SEARCHES_KEY = 'courrier3_recent_searches_v1';

export const GlobalSearchEngineService = {
  getRecentSearches: (userId = 'current-user'): string[] => {
    try {
      const raw = localStorage.getItem(`${RECENT_SEARCHES_KEY}_${userId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // Fallback
    }
    return ['DEL847192031', 'INV/2026-27/000125', 'Rate Calculator', 'Weight Discrepancies'];
  },

  addRecentSearch: (userId = 'current-user', query: string): void => {
    if (!query.trim() || query.length < 2) return;
    const current = GlobalSearchEngineService.getRecentSearches(userId);
    const updated = [query.trim(), ...current.filter((q) => q.toLowerCase() !== query.trim().toLowerCase())].slice(0, 5);
    try {
      localStorage.setItem(`${RECENT_SEARCHES_KEY}_${userId}`, JSON.stringify(updated));
    } catch (e) {}
  },

  clearRecentSearches: (userId = 'current-user'): void => {
    try {
      localStorage.removeItem(`${RECENT_SEARCHES_KEY}_${userId}`);
    } catch (e) {}
  },

  // Central Permission-Aware Search Processor
  search: (input: {
    query: string;
    role: 'CUSTOMER' | 'ADMIN';
    tenantId: string;
    userId?: string;
  }): SearchResponse => {
    const rawQuery = input.query.trim();
    const q = rawQuery.toLowerCase();
    const isCustomer = input.role === 'CUSTOMER';
    const tenantId = input.tenantId;

    const resultsByCategory: Record<SearchCategory, SearchResultItem[]> = {
      ACTIONS: [],
      PAGES: [],
      SHIPMENTS: [],
      CUSTOMERS: [],
      INVOICES: [],
      DISPUTES: [],
      MANIFESTS: [],
      RATE_CARDS: [],
    };

    // 1. QUICK ACTIONS & PAGES SEARCH
    const customerActions: SearchResultItem[] = [
      { id: 'act-1', category: 'ACTIONS', categoryLabel: 'Quick Actions', title: 'Create New Shipment', subtitle: 'Book single parcel dispatch wizard', route: '/app/orders/create', score: 90, iconName: 'PlusCircle' },
      { id: 'act-2', category: 'ACTIONS', categoryLabel: 'Quick Actions', title: 'Bulk Order CSV Upload', subtitle: 'Import multiple B2C/B2B orders', route: '/app/orders/bulk-upload', score: 90, iconName: 'FileSpreadsheet' },
      { id: 'act-3', category: 'ACTIONS', categoryLabel: 'Quick Actions', title: 'Open Rate Calculator', subtitle: 'Calculate shipping rate across couriers', route: '/app/rates', score: 90, iconName: 'Calculator' },
      { id: 'act-4', category: 'ACTIONS', categoryLabel: 'Quick Actions', title: 'Top-up Wallet & Ledger', subtitle: 'Recharge wallet balance', route: '/app/wallet', score: 85, iconName: 'Wallet' },
      { id: 'act-5', category: 'ACTIONS', categoryLabel: 'Quick Actions', title: 'Download GST Tax Invoices', subtitle: 'Monthly GST tax invoice register', route: '/app/billing/gst-invoices', score: 85, iconName: 'Receipt' },
      { id: 'act-6', category: 'ACTIONS', categoryLabel: 'Quick Actions', title: 'View Weight Discrepancies', subtitle: 'Check & dispute courier reweigh scans', route: '/app/weight-discrepancies', score: 85, iconName: 'Scale' },
      { id: 'act-7', category: 'ACTIONS', categoryLabel: 'Quick Actions', title: 'Configure Branded Tracking', subtitle: 'Logo, colors & promotional banner settings', route: '/app/settings/tracking-page', score: 80, iconName: 'Smartphone' },
      { id: 'act-8', category: 'ACTIONS', categoryLabel: 'Quick Actions', title: 'Configure WhatsApp & SMS', subtitle: 'Buyer status notification templates', route: '/app/settings/notifications', score: 80, iconName: 'Bell' },
    ];

    const adminActions: SearchResultItem[] = [
      { id: 'admin-act-1', category: 'ACTIONS', categoryLabel: 'Admin Quick Actions', title: 'Execute Monthly Billing Run', subtitle: 'Generate GST tax invoices for merchants', route: '/admin/finance/gst-invoices', score: 90, iconName: 'Receipt' },
      { id: 'admin-act-2', category: 'ACTIONS', categoryLabel: 'Admin Quick Actions', title: 'Supervise Weight Disputes', subtitle: 'Review & refund merchant weight disputes', route: '/admin/weight-discrepancies', score: 90, iconName: 'Scale' },
      { id: 'admin-act-3', category: 'ACTIONS', categoryLabel: 'Admin Quick Actions', title: 'Manage Customers & Accounts', subtitle: 'Merchant onboarding & rate assignments', route: '/admin/customers', score: 90, iconName: 'Users' },
      { id: 'admin-act-4', category: 'ACTIONS', categoryLabel: 'Admin Quick Actions', title: 'B2B & B2C Selling Rate Cards', subtitle: 'Configure freight tariff slabs & zones', route: '/admin/b2b-rates', score: 85, iconName: 'Layers' },
      { id: 'admin-act-5', category: 'ACTIONS', categoryLabel: 'Admin Quick Actions', title: 'Notification Gateway Settings', subtitle: 'WhatsApp & SMS provider configurations', route: '/admin/notifications', score: 85, iconName: 'Bell' },
    ];

    const baseActions = isCustomer ? customerActions : adminActions;

    // Filter Actions & Pages matching query
    if (q) {
      baseActions.forEach((item) => {
        if (item.title.toLowerCase().includes(q) || item.subtitle?.toLowerCase().includes(q)) {
          const isExact = item.title.toLowerCase() === q;
          resultsByCategory.ACTIONS.push({ ...item, score: isExact ? 98 : 70 });
        }
      });
    }

    // 2. SHIPMENTS SEARCH (Strictly Tenant Isolated for Customers)
    const mockShipments = [
      { id: 'SHP-ORD-2026-9041', awb: 'DEL847192031', orderId: 'ORD-2026-9041', courier: 'Delhivery Surface', status: 'OUT_FOR_DELIVERY' as const, variant: 'warning' as const, tenantId: 'tenant-demo-01', recipient: 'Rahul Sharma' },
      { id: 'SHP-ORD-2026-8812', awb: 'BD749102834', orderId: 'ORD-2026-8812', courier: 'Blue Dart Air', status: 'DELIVERED' as const, variant: 'success' as const, tenantId: 'tenant-demo-01', recipient: 'Priya Verma' },
      { id: 'SHP-ORD-2026-7733', awb: 'DTDC991823', orderId: 'ORD-2026-7733', courier: 'DTDC Express', status: 'NDR' as const, variant: 'danger' as const, tenantId: 'tenant-demo-01', recipient: 'Amit Patel' },
      { id: 'SHP-ORD-2026-5511', awb: 'EXP55112233', orderId: 'ORD-2026-5511', courier: 'Delhivery Surface', status: 'IN_TRANSIT' as const, variant: 'info' as const, tenantId: 'tenant-other-02', recipient: 'Sneha Kapoor' }, // Different tenant!
    ];

    mockShipments.forEach((s) => {
      // SECURITY CHECK: Customer cannot see other tenant's shipments!
      if (isCustomer && s.tenantId !== tenantId) return;

      if (!q) return;

      const isExactAwb = s.awb.toLowerCase() === q;
      const isExactOrder = s.orderId.toLowerCase() === q;
      const matchAwb = s.awb.toLowerCase().includes(q);
      const matchOrder = s.orderId.toLowerCase().includes(q);
      const matchRecipient = s.recipient.toLowerCase().includes(q);

      if (isExactAwb || isExactOrder || matchAwb || matchOrder || matchRecipient) {
        const score = isExactAwb || isExactOrder ? 100 : 80;
        const targetRoute = isCustomer ? `/app/shipments/${s.id}` : `/admin/shipments`;

        resultsByCategory.SHIPMENTS.push({
          id: `search-shp-${s.id}`,
          category: 'SHIPMENTS',
          categoryLabel: 'Shipments',
          title: `AWB ${s.awb}`,
          subtitle: `Order Ref: ${s.orderId} • ${s.courier} (${s.recipient})`,
          statusLabel: s.status,
          statusVariant: s.variant,
          route: targetRoute,
          score,
          iconName: 'Package',
        });
      }
    });

    // 3. ADMIN CUSTOMER SEARCH (Admin Only!)
    if (!isCustomer && q) {
      const mockCustomers = [
        { id: 'cust-101', company: 'Acme Electronics India Pvt Ltd', customerId: 'CUST-1001', gstin: '27AAACA1234A1Z8', email: 'accounts@acmestore.com' },
        { id: 'cust-102', company: 'Bharat Traders & Retail', customerId: 'CUST-1002', gstin: '07BBBCC5566B1Z9', email: 'support@bharattraders.com' },
      ];

      mockCustomers.forEach((c) => {
        const matchCompany = c.company.toLowerCase().includes(q);
        const matchId = c.customerId.toLowerCase().includes(q);
        const matchGstin = c.gstin.toLowerCase().includes(q);

        if (matchCompany || matchId || matchGstin) {
          const isExact = c.customerId.toLowerCase() === q || c.gstin.toLowerCase() === q;
          resultsByCategory.CUSTOMERS.push({
            id: `search-cust-${c.id}`,
            category: 'CUSTOMERS',
            categoryLabel: 'Merchant Accounts',
            title: c.company,
            subtitle: `${c.customerId} • GSTIN: ${c.gstin} (${c.email})`,
            statusLabel: 'ACTIVE',
            statusVariant: 'success',
            route: `/admin/customers/${c.id}`,
            score: isExact ? 100 : 82,
            iconName: 'Building2',
          });
        }
      });
    }

    // 4. INVOICES SEARCH
    if (q) {
      const invoices = GstInvoiceService.getInvoices(isCustomer ? tenantId : 'all');
      invoices.forEach((inv) => {
        const matchInv = inv.invoiceNumber.toLowerCase().includes(q);
        const matchMonth = inv.billingPeriodMonth.toLowerCase().includes(q);
        const matchCustomer = !isCustomer && inv.customerSnapshot.customerLegalName.toLowerCase().includes(q);

        if (matchInv || matchMonth || matchCustomer) {
          const isExact = inv.invoiceNumber.toLowerCase() === q;
          const targetRoute = isCustomer ? `/app/billing/gst-invoices` : `/admin/finance/gst-invoices`;

          resultsByCategory.INVOICES.push({
            id: `search-inv-${inv.id}`,
            category: 'INVOICES',
            categoryLabel: 'GST Tax Invoices',
            title: inv.invoiceNumber,
            subtitle: `${inv.billingPeriodMonth} • Total: ₹${inv.grandTotalINR.toLocaleString()} (${inv.customerSnapshot.customerLegalName})`,
            statusLabel: inv.status,
            statusVariant: 'success',
            route: targetRoute,
            score: isExact ? 100 : 75,
            iconName: 'Receipt',
          });
        }
      });
    }

    // 5. WEIGHT DISPUTES SEARCH
    if (q) {
      const disputes = WeightDiscrepancyService.getDiscrepancies(isCustomer ? tenantId : 'all');
      disputes.forEach((d) => {
        const matchDisp = d.discrepancyId.toLowerCase().includes(q);
        const matchAwb = d.awbNumber.toLowerCase().includes(q);

        if (matchDisp || matchAwb) {
          const isExact = d.discrepancyId.toLowerCase() === q || d.awbNumber.toLowerCase() === q;
          const targetRoute = isCustomer ? `/app/weight-discrepancies` : `/admin/weight-discrepancies`;

          resultsByCategory.DISPUTES.push({
            id: `search-disp-${d.id}`,
            category: 'DISPUTES',
            categoryLabel: 'Weight Discrepancies',
            title: d.discrepancyId,
            subtitle: `AWB: ${d.awbNumber} • Booked: ${d.bookedSnapshot.chargeableWeightKg}KG ➔ Courier: ${d.courierAudit.auditedChargeableWeightKg}KG (+${d.weightDiffKg}KG)`,
            statusLabel: d.status,
            statusVariant: 'warning',
            route: targetRoute,
            score: isExact ? 100 : 78,
            iconName: 'Scale',
          });
        }
      });
    }

    // Collect Flat List & Sort by Score (Higher Score First)
    const flatResults: SearchResultItem[] = [];
    (Object.keys(resultsByCategory) as SearchCategory[]).forEach((cat) => {
      flatResults.push(...resultsByCategory[cat]);
    });

    flatResults.sort((a, b) => b.score - a.score);

    const exactMatch = flatResults.find((r) => r.score === 100);

    return {
      query: rawQuery,
      totalResults: flatResults.length,
      resultsByCategory,
      flatResults,
      exactMatch,
    };
  },
};
