import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Package,
  Truck,
  IndianRupee,
  Wallet,
  Sliders,
  Layers,
  BarChart2,
  Scale,
  Receipt,
  Bell,
  Warehouse,
  MapPin,
  FileCheck,
  Lock,
  FileText,
  KeyRound,
  Rocket,
  Building2,
} from 'lucide-react';
import { AppShell } from '../components/common/AppShell';
import { PageFallback } from '../components/common/PageFallback';
import type { NavGroupConfig } from '../components/common/Sidebar';
import { useRbac } from '../context/RbacContext';
import { useTenant } from '../context/TenantContext';

const BASE_ADMIN_NAV_GROUPS: NavGroupConfig[] = [
  {
    sectionLabel: 'Overview',
    items: [
      { label: 'Dashboard', path: '/admin', icon: ShieldCheck },
    ],
  },
  {
    sectionLabel: 'Access Control',
    items: [
      { label: 'Roles', path: '/admin/roles', icon: Lock },
      { label: 'Permissions Matrix', path: '/admin/permissions', icon: FileCheck },
      { label: 'User Access Logs', path: '/admin/access-logs', icon: FileText },
    ],
  },
  {
    sectionLabel: 'Accounts & Users',
    items: [
      { label: 'Customers', path: '/admin/customers', icon: Users },
      { label: 'Onboarding Tracker', path: '/admin/onboarding', icon: Rocket },
      { label: 'Users & Roles', path: '/admin/roles', icon: Users },
    ],
  },
  {
    sectionLabel: 'Operations',
    items: [
      { label: 'Platform Shipments', path: '/admin/shipments', icon: Package },
      { label: 'NDR & RTO', path: '/admin/ndr', icon: Package, badge: 'Alerts' },
      { label: 'Weight Disputes', path: '/admin/weight-discrepancies', icon: Scale },
      { label: 'Customer Warehouses', path: '/admin/warehouses', icon: Warehouse },
    ],
  },
  {
    sectionLabel: 'Rate Cards',
    items: [
      { label: 'B2B Rate Cards', path: '/admin/b2b-rates', icon: Layers },
      { label: 'B2C Rate Cards', path: '/admin/selling-rates', icon: Sliders },
      { label: 'Rate Preview', path: '/admin/rate-preview', icon: FileCheck },
    ],
  },
  {
    sectionLabel: 'Partners & Network',
    items: [
      { label: 'Courier Partners', path: '/admin/couriers', icon: Truck },
      { label: 'Courier Master', path: '/admin/couriers/master', icon: Truck },
      { label: 'Zones & Pincodes', path: '/admin/zones', icon: MapPin },
    ],
  },
  {
    sectionLabel: 'Finance',
    items: [
      { label: 'Customer Wallets', path: '/admin/customer-wallets', icon: Wallet },
      { label: 'COD Remittances', path: '/admin/cod/remittances', icon: IndianRupee },
      { label: 'GST Tax Invoices', path: '/admin/finance/gst-invoices', icon: Receipt },
    ],
  },
  {
    sectionLabel: 'System & Logs',
    items: [
      { label: 'Notification Center', path: '/admin/notifications', icon: Bell },
      { label: 'Reports & Analytics', path: '/admin/reports', icon: BarChart2 },
      { label: 'System Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck },
    ],
  },
];

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { canAccessPath, currentRole } = useRbac();
  const { activeTenantId, activeTenant, tenants, setActiveTenantId } = useTenant();

  // Filter nav groups dynamically based on RBAC permissions
  const computedNavGroups = BASE_ADMIN_NAV_GROUPS.map((group) => {
    const allowedItems = group.items.filter((item) => canAccessPath(item.path));
    return { ...group, items: allowedItems };
  }).filter((group) => group.items.length > 0);

  // In Super Admin portal (already protected by AdminRouteGuard), ensure nav groups never vanish
  const filteredNavGroups = computedNavGroups.length > 0 ? computedNavGroups : BASE_ADMIN_NAV_GROUPS;

  const topBanner = (
    <div
      style={{
        backgroundColor: '#1e1b4b',
        color: '#ffffff',
        padding: '8px 20px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '1px solid #312e81',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <KeyRound size={14} style={{ color: '#a855f7' }} />
          <span>Role: <strong>{currentRole?.name}</strong></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid #475569', paddingLeft: '16px' }}>
          <Building2 size={14} style={{ color: '#38bdf8' }} />
          <span>Active Tenant: <strong style={{ color: '#38bdf8' }}>{activeTenant?.companyName || activeTenantId} ({activeTenantId})</strong></span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>Tenant Scope:</span>
          <select
            value={activeTenantId}
            onChange={(e) => setActiveTenantId(e.target.value)}
            style={{
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: '#334155',
              color: '#ffffff',
              border: '1px solid #475569',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Tenants (Super Admin View)</option>
            {tenants.map((t) => (
              <option key={t.tenantId} value={t.tenantId}>
                {t.tenantId} - {t.companyName}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>Authorization:</span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#0f172a',
              padding: '4px 12px',
              borderRadius: '8px',
              border: '1px solid #334155',
            }}
          >
            <Lock size={12} color="#10b981" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
              {currentRole?.name || 'Super Admin'} (Verified)
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AppShell
      navigationGroups={filteredNavGroups}
      brandName="MAXLINE LOGISTICS"
      portalLabel="Super Admin Portal"
      topBanner={topBanner}
    >
      <div key={location.pathname} className="animate-fade-in" style={{ width: '100%' }}>
        <React.Suspense fallback={<PageFallback />}>
          <Outlet />
        </React.Suspense>
      </div>
    </AppShell>
  );
};
