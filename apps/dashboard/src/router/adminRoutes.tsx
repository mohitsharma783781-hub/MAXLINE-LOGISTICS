import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { RoutePlaceholder } from '../components/common/RoutePlaceholder';
import { PermissionGuard } from '../components/common/PermissionGuard';
import { AdminRouteGuard } from '../components/guards/AdminRouteGuard';

// Lazy-loaded Admin Pages
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminCustomersPage = lazy(() => import('../pages/admin/AdminCustomersPage').then((m) => ({ default: m.AdminCustomersPage })));
const AdminCouriersPage = lazy(() => import('../pages/admin/AdminCouriersPage').then((m) => ({ default: m.AdminCouriersPage })));
const AdminCourierDetailPage = lazy(() => import('../pages/admin/AdminCourierDetailPage').then((m) => ({ default: m.AdminCourierDetailPage })));
const AdminZonesPage = lazy(() => import('../pages/admin/AdminZonesPage').then((m) => ({ default: m.AdminZonesPage })));
const AdminServiceabilityTestPage = lazy(() => import('../pages/admin/AdminServiceabilityTestPage').then((m) => ({ default: m.AdminServiceabilityTestPage })));
const AdminPinImportPage = lazy(() => import('../pages/admin/AdminPinImportPage').then((m) => ({ default: m.AdminPinImportPage })));
const AdminSellingRatesPage = lazy(() => import('../pages/admin/AdminSellingRatesPage').then((m) => ({ default: m.AdminSellingRatesPage })));
const AdminB2BRateCardsPage = lazy(() => import('../pages/admin/AdminB2BRateCardsPage').then((m) => ({ default: m.AdminB2BRateCardsPage })));
const AdminCustomerWalletsPage = lazy(() => import('../pages/admin/AdminCustomerWalletsPage').then((m) => ({ default: m.AdminCustomerWalletsPage })));
const AdminCustomerDetailPage = lazy(() => import('../pages/admin/AdminCustomerDetailPage').then((m) => ({ default: m.AdminCustomerDetailPage })));
const AdminCustomerRateAssignmentsPage = lazy(() => import('../pages/admin/AdminCustomerRateAssignmentsPage').then((m) => ({ default: m.AdminCustomerRateAssignmentsPage })));
const AdminShipmentsPage = lazy(() => import('../pages/admin/AdminShipmentsPage').then((m) => ({ default: m.AdminShipmentsPage })));
const AdminRolesPage = lazy(() => import('../pages/admin/AdminRolesPage').then((m) => ({ default: m.AdminRolesPage })));
const AdminPermissionsPage = lazy(() => import('../pages/admin/AdminPermissionsPage').then((m) => ({ default: m.AdminPermissionsPage })));
const AdminAccessLogsPage = lazy(() => import('../pages/admin/AdminAccessLogsPage').then((m) => ({ default: m.AdminAccessLogsPage })));
const AdminOnboardingTrackerPage = lazy(() => import('../pages/admin/AdminOnboardingTrackerPage').then((m) => ({ default: m.AdminOnboardingTrackerPage })));
const AdminReportsPage = lazy(() => import('../pages/admin/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage })));
const AdminRechargesPage = lazy(() => import('../pages/admin/AdminRechargesPage').then((m) => ({ default: m.AdminRechargesPage })));
const AdminNotificationsPage = lazy(() => import('../pages/admin/AdminNotificationsPage').then((m) => ({ default: m.AdminNotificationsPage })));
const AdminCodRemittancesPage = lazy(() => import('../pages/admin/AdminCodRemittancesPage').then((m) => ({ default: m.AdminCodRemittancesPage })));
const AdminNdrRtoPage = lazy(() => import('../pages/admin/AdminNdrRtoPage').then((m) => ({ default: m.AdminNdrRtoPage })));
const AdminWeightDiscrepancyPage = lazy(() => import('../pages/admin/AdminWeightDiscrepancyPage').then((m) => ({ default: m.AdminWeightDiscrepancyPage })));
const AdminCourierMasterPage = lazy(() => import('../pages/admin/AdminCourierMasterPage').then((m) => ({ default: m.AdminCourierMasterPage })));
const AdminRatePreviewPage = lazy(() => import('../pages/admin/AdminRatePreviewPage').then((m) => ({ default: m.AdminRatePreviewPage })));
const AdminGstInvoicesPage = lazy(() => import('../pages/admin/finance/AdminGstInvoicesPage').then((m) => ({ default: m.AdminGstInvoicesPage })));
const AdminKycVerificationPage = lazy(() => import('../pages/admin/AdminKycVerificationPage').then((m) => ({ default: m.AdminKycVerificationPage })));
const WarehousesPage = lazy(() => import('../pages/app/WarehousesPage').then((m) => ({ default: m.WarehousesPage })));

export const adminRoutes: RouteObject = {
  path: '/admin',
  element: (
    <AdminRouteGuard>
      <AdminLayout />
    </AdminRouteGuard>
  ),
  children: [
    {
      index: true,
      element: <AdminDashboardPage />,
    },
    // ACCESS CONTROL
    {
      path: 'roles',
      element: <PermissionGuard><AdminRolesPage /></PermissionGuard>,
    },
    {
      path: 'permissions',
      element: <PermissionGuard><AdminPermissionsPage /></PermissionGuard>,
    },
    {
      path: 'access-logs',
      element: <PermissionGuard><AdminAccessLogsPage /></PermissionGuard>,
    },
    // CUSTOMERS
    {
      path: 'customers',
      element: <PermissionGuard><AdminCustomersPage /></PermissionGuard>,
    },
    {
      path: 'onboarding',
      element: <PermissionGuard><AdminOnboardingTrackerPage /></PermissionGuard>,
    },
    {
      path: 'customers/onboarding',
      element: <PermissionGuard><AdminOnboardingTrackerPage /></PermissionGuard>,
    },
    {
      path: 'customers/:id',
      element: <PermissionGuard><AdminCustomerDetailPage /></PermissionGuard>,
    },
    {
      path: 'kyc',
      element: <PermissionGuard><AdminKycVerificationPage /></PermissionGuard>,
    },
    {
      path: 'customers/kyc',
      element: <PermissionGuard><AdminKycVerificationPage /></PermissionGuard>,
    },
    {
      path: 'customer-users',
      element: <RoutePlaceholder moduleName="Customer Users" portal="Super Admin Portal" path="/admin/customer-users" />,
    },
    {
      path: 'customer-rate-assignments',
      element: <AdminCustomerRateAssignmentsPage />,
    },
    {
      path: 'credit-control',
      element: <AdminCustomerDetailPage />,
    },
    {
      path: 'customer-activity',
      element: <PermissionGuard><AdminAccessLogsPage /></PermissionGuard>,
    },
    {
      path: 'warehouses',
      element: <PermissionGuard><WarehousesPage /></PermissionGuard>,
    },
    // COURIER MANAGEMENT
    {
      path: 'couriers',
      element: <PermissionGuard><AdminCouriersPage /></PermissionGuard>,
    },
    {
      path: 'couriers/:id',
      element: <AdminCourierDetailPage />,
    },
    {
      path: 'courier-master',
      element: <AdminCourierMasterPage />,
    },
    {
      path: 'couriers/master',
      element: <AdminCourierMasterPage />,
    },
    {
      path: 'zones',
      element: <AdminZonesPage />,
    },
    {
      path: 'serviceability-test',
      element: <AdminServiceabilityTestPage />,
    },
    {
      path: 'serviceability',
      element: <AdminServiceabilityTestPage />,
    },
    {
      path: 'pincodes/import',
      element: <AdminPinImportPage />,
    },
    {
      path: 'pincodes',
      element: <AdminPinImportPage />,
    },
    // RATE CARDS
    {
      path: 'selling-rates',
      element: <PermissionGuard><AdminSellingRatesPage /></PermissionGuard>,
    },
    {
      path: 'b2b-rates',
      element: <PermissionGuard><AdminB2BRateCardsPage /></PermissionGuard>,
    },
    {
      path: 'rate-cards',
      element: <AdminSellingRatesPage />,
    },
    {
      path: 'rate-cards/create',
      element: <RoutePlaceholder moduleName="Create Master Rate Card" portal="Super Admin Portal" path="/admin/rate-cards/create" />,
    },
    {
      path: 'rate-preview',
      element: <AdminRatePreviewPage />,
    },

    // FINANCE
    {
      path: 'customer-wallets',
      element: <PermissionGuard><AdminCustomerWalletsPage /></PermissionGuard>,
    },
    {
      path: 'wallets',
      element: <AdminCustomerWalletsPage />,
    },
    {
      path: 'recharges',
      element: <AdminRechargesPage />,
    },
    {
      path: 'payments',
      element: <AdminRechargesPage />,
    },
    {
      path: 'cod',
      element: <PermissionGuard><AdminCodRemittancesPage /></PermissionGuard>,
    },
    {
      path: 'cod/remittances',
      element: <AdminCodRemittancesPage />,
    },
    {
      path: 'cod/receivables',
      element: <AdminCodRemittancesPage />,
    },
    {
      path: 'billing',
      element: <PermissionGuard><AdminGstInvoicesPage /></PermissionGuard>,
    },
    {
      path: 'invoices',
      element: <AdminGstInvoicesPage />,
    },
    {
      path: 'finance/gst-invoices',
      element: <AdminGstInvoicesPage />,
    },
    // OPERATIONS
    {
      path: 'orders',
      element: <RoutePlaceholder moduleName="Global Platform Orders" portal="Super Admin Portal" path="/admin/orders" />,
    },
    {
      path: 'shipments',
      element: <PermissionGuard><AdminShipmentsPage /></PermissionGuard>,
    },
    {
      path: 'weight-discrepancies',
      element: <PermissionGuard><AdminWeightDiscrepancyPage /></PermissionGuard>,
    },
    {
      path: 'pickups',
      element: <RoutePlaceholder moduleName="Global Pickup Requests" portal="Super Admin Portal" path="/admin/pickups" />,
    },
    {
      path: 'tracking',
      element: <RoutePlaceholder moduleName="Global Tracking Scans" portal="Super Admin Portal" path="/admin/tracking" />,
    },
    {
      path: 'ndr',
      element: <PermissionGuard><AdminNdrRtoPage /></PermissionGuard>,
    },
    {
      path: 'rto',
      element: <PermissionGuard><AdminNdrRtoPage /></PermissionGuard>,
    },

    // SYSTEM
    {
      path: 'audit-logs',
      element: <PermissionGuard><AdminAccessLogsPage /></PermissionGuard>,
    },
    {
      path: 'users-roles',
      element: <PermissionGuard><AdminRolesPage /></PermissionGuard>,
    },
    {
      path: 'users',
      element: <PermissionGuard><AdminRolesPage /></PermissionGuard>,
    },
    {
      path: 'reports',
      element: <PermissionGuard><AdminReportsPage /></PermissionGuard>,
    },
    {
      path: 'reports/analytics',
      element: <RoutePlaceholder moduleName="System BI & Revenue Analytics" portal="Super Admin Portal" path="/admin/reports/analytics" />,
    },
    {
      path: 'notifications',
      element: <AdminNotificationsPage />,
    },
    {
      path: 'settings',
      element: <RoutePlaceholder moduleName="System Global Settings" portal="Super Admin Portal" path="/admin/settings" />,
    },
  ],
};
