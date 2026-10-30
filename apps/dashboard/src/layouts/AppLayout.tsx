import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  FileSpreadsheet,
  Search,
  AlertTriangle,
  Calculator,
  Wallet,
  IndianRupee,
  CreditCard,
  Warehouse,
  LayoutDashboard,
  FileText,
  RotateCcw,
  Scale,
  Truck,
  MapPin,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { AppShell } from '../components/common/AppShell';
import type { NavGroupConfig } from '../components/common/Sidebar';
import { useRbac } from '../context/RbacContext';
import { useTenant } from '../context/TenantContext';
import { authService } from '../services/auth.service';
import { Spinner } from '../components/ui';
import { MerchantSetupRequired } from '../components/common/MerchantSetupRequired';
import { PageFallback } from '../components/common/PageFallback';
import type { AuthUser } from '../types/auth';

export const BASE_ENTERPRISE_B2B_NAV_GROUPS: NavGroupConfig[] = [
  {
    sectionLabel: 'DASHBOARD',
    categoryIcon: LayoutDashboard,
    items: [
      { label: 'Dashboard', path: '/app', icon: LayoutDashboard },
    ],
  },
  {
    sectionLabel: 'SHIPMENTS',
    categoryIcon: Package,
    items: [
      { label: 'Create Shipment', path: '/app/orders/create', icon: PlusCircle },
      { label: 'All Orders', path: '/app/orders', icon: Package },
      { label: 'Bulk Upload', path: '/app/bulk/upload', icon: FileSpreadsheet },
      { label: 'Pickups & Manifests', path: '/app/pickups', icon: Truck },
    ],
  },
  {
    sectionLabel: 'TRACKING & NDR',
    categoryIcon: Search,
    items: [
      { label: 'Live Tracking', path: '/app/tracking', icon: Search },
      { label: 'NDR Exceptions', path: '/app/ndr', icon: AlertTriangle },
      { label: 'RTO Returns', path: '/app/rto', icon: RotateCcw },
      { label: 'Weight Disputes', path: '/app/weight-discrepancies', icon: Scale },
    ],
  },
  {
    sectionLabel: 'FINANCE',
    categoryIcon: Wallet,
    items: [
      { label: 'Wallet & Recharge', path: '/app/wallet', icon: Wallet },
      { label: 'COD Remittance', path: '/app/cod', icon: IndianRupee },
      { label: 'GST Invoices', path: '/app/billing', icon: CreditCard },
    ],
  },
  {
    sectionLabel: 'TOOLS',
    categoryIcon: Calculator,
    items: [
      { label: 'Rate Calculator', path: '/app/rates', icon: Calculator },
      { label: 'My Rate Card', path: '/app/my-rate-card', icon: FileText },
      { label: 'Pincode Checker', path: '/app/serviceability', icon: MapPin },
      { label: 'Warehouses', path: '/app/warehouses', icon: Warehouse },
    ],
  },
  {
    sectionLabel: 'SETTINGS',
    categoryIcon: Settings,
    items: [
      { label: 'Company Profile', path: '/app/settings/company', icon: Settings },
      { label: 'KYC & Bank Details', path: '/app/settings/kyc', icon: ShieldCheck },
    ],
  },
];

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccessPath } = useRbac();
  const { activeTenantId, activeTenant, refreshTenantProfile } = useTenant();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  // Enforce authentic Supabase session on all merchant portal routes
  useEffect(() => {
    let isMounted = true;
    authService.getCurrentUser().then((user) => {
      if (isMounted) {
        if (!user) {
          navigate('/login', { replace: true });
        } else {
          setCurrentUser(user);
          setIsVerifying(false);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Filter navigation groups dynamically based on RBAC permissions
  const computedNavGroups = BASE_ENTERPRISE_B2B_NAV_GROUPS.map((group) => {
    const allowedItems = group.items.filter((item) => canAccessPath(item.path));
    return { ...group, items: allowedItems };
  }).filter((group) => group.items.length > 0);

  // Fallback: If user is authenticated in seller portal, never show a blank sidebar
  const filteredNavGroups = computedNavGroups.length > 0 ? computedNavGroups : BASE_ENTERPRISE_B2B_NAV_GROUPS;

  if (isVerifying) {
    return (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <Spinner size="lg" />
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
          Verifying secure session...
        </span>
      </div>
    );
  }

  // Check if authenticated customer user has no active merchant organization linked
  const isMerchantSetupRequired =
    currentUser?.role !== 'super_admin' &&
    (!activeTenantId || !activeTenant || activeTenant.status === 'SUSPENDED');

  const isOnboardingRoute = location.pathname.startsWith('/app/onboarding');

  return (
    <AppShell
      navigationGroups={filteredNavGroups}
      brandName="MAXLINE LOGISTICS"
      portalLabel="Merchant Portal"
    >
      <div key={location.pathname} className="animate-fade-in" style={{ width: '100%' }}>
        {isMerchantSetupRequired && !isOnboardingRoute ? (
          <MerchantSetupRequired user={currentUser} onRefresh={refreshTenantProfile} />
        ) : (
          <React.Suspense fallback={<PageFallback />}>
            <Outlet />
          </React.Suspense>
        )}
      </div>
    </AppShell>
  );
};
