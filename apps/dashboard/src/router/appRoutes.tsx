import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { RoutePlaceholder } from '../components/common/RoutePlaceholder';
import { PermissionGuard } from '../components/common/PermissionGuard';
import { TenantGuard } from '../components/common/TenantGuard';

// Lazy-loaded Merchant Portal Pages
const CustomerDashboard = lazy(() => import('../pages/app/CustomerDashboard').then((m) => ({ default: m.CustomerDashboard })));
const ShipmentsPage = lazy(() => import('../pages/app/ShipmentsPage').then((m) => ({ default: m.ShipmentsPage })));
const CreateShipmentWizardPage = lazy(() => import('../pages/app/CreateShipmentWizardPage').then((m) => ({ default: m.CreateShipmentWizardPage })));
const ShipmentControlCenterPage = lazy(() => import('../pages/app/ShipmentControlCenterPage').then((m) => ({ default: m.ShipmentControlCenterPage })));
const ShipmentLabelPage = lazy(() => import('../pages/app/ShipmentLabelPage').then((m) => ({ default: m.ShipmentLabelPage })));
const LabelPreviewPage = lazy(() => import('../pages/app/LabelPreviewPage').then((m) => ({ default: m.LabelPreviewPage })));
const CustomerOrdersPage = lazy(() => import('../pages/app/CustomerOrdersPage').then((m) => ({ default: m.CustomerOrdersPage })));
const BulkOrderImportPage = lazy(() => import('../pages/app/BulkOrderImportPage').then((m) => ({ default: m.BulkOrderImportPage })));
const CustomerPickupRequestsPage = lazy(() => import('../pages/app/CustomerPickupRequestsPage').then((m) => ({ default: m.CustomerPickupRequestsPage })));
const PickupsPage = lazy(() => import('../pages/app/PickupsPage').then((m) => ({ default: m.PickupsPage })));
const CreatePickupWizardPage = lazy(() => import('../pages/app/CreatePickupWizardPage').then((m) => ({ default: m.CreatePickupWizardPage })));
const PickupDetailPage = lazy(() => import('../pages/app/PickupDetailPage').then((m) => ({ default: m.PickupDetailPage })));
const ShippingLabelsPage = lazy(() => import('../pages/app/ShippingLabelsPage').then((m) => ({ default: m.ShippingLabelsPage })));
const ManifestsPage = lazy(() => import('../pages/app/ManifestsPage').then((m) => ({ default: m.ManifestsPage })));
const CreateManifestPage = lazy(() => import('../pages/app/CreateManifestPage').then((m) => ({ default: m.CreateManifestPage })));
const ManifestDetailPage = lazy(() => import('../pages/app/ManifestDetailPage').then((m) => ({ default: m.ManifestDetailPage })));
const ExceptionsPage = lazy(() => import('../pages/app/ExceptionsPage').then((m) => ({ default: m.ExceptionsPage })));
const ExceptionDetailPage = lazy(() => import('../pages/app/ExceptionDetailPage').then((m) => ({ default: m.ExceptionDetailPage })));
const TrackingPage = lazy(() => import('../pages/app/TrackingPage').then((m) => ({ default: m.TrackingPage })));
const PublicTrackingPage = lazy(() => import('../pages/public/PublicTrackingPage').then((m) => ({ default: m.PublicTrackingPage })));
const CustomerTrackingPreviewPage = lazy(() => import('../pages/app/CustomerTrackingPreviewPage').then((m) => ({ default: m.CustomerTrackingPreviewPage })));
const TrackingPageSettings = lazy(() => import('../pages/app/settings/TrackingPageSettings').then((m) => ({ default: m.TrackingPageSettings })));
const NotificationsPage = lazy(() => import('../pages/app/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const NotificationTemplatesPage = lazy(() => import('../pages/app/NotificationTemplatesPage').then((m) => ({ default: m.NotificationTemplatesPage })));
const NotificationRulesPage = lazy(() => import('../pages/app/NotificationRulesPage').then((m) => ({ default: m.NotificationRulesPage })));
const NotificationDetailPage = lazy(() => import('../pages/app/NotificationDetailPage').then((m) => ({ default: m.NotificationDetailPage })));
const NotificationChannelSettings = lazy(() => import('../pages/app/settings/NotificationChannelSettings').then((m) => ({ default: m.NotificationChannelSettings })));
const WalletPage = lazy(() => import('../pages/app/WalletPage').then((m) => ({ default: m.WalletPage })));
const WalletRechargeWizardPage = lazy(() => import('../pages/app/WalletRechargeWizardPage').then((m) => ({ default: m.WalletRechargeWizardPage })));
const WalletTransactionsPage = lazy(() => import('../pages/app/WalletTransactionsPage').then((m) => ({ default: m.WalletTransactionsPage })));
const WalletTransactionDetailPage = lazy(() => import('../pages/app/WalletTransactionDetailPage').then((m) => ({ default: m.WalletTransactionDetailPage })));
const InvoiceDetailPage = lazy(() => import('../pages/app/InvoiceDetailPage').then((m) => ({ default: m.InvoiceDetailPage })));
const BillingSettingsPage = lazy(() => import('../pages/app/settings/BillingSettingsPage').then((m) => ({ default: m.BillingSettingsPage })));
const CourierSettingsPage = lazy(() => import('../pages/app/settings/CourierSettingsPage').then((m) => ({ default: m.CourierSettingsPage })));
const CouriersPage = lazy(() => import('../pages/app/CouriersPage').then((m) => ({ default: m.CouriersPage })));
const AddCourierWizardPage = lazy(() => import('../pages/app/AddCourierWizardPage').then((m) => ({ default: m.AddCourierWizardPage })));
const CourierDetailPage = lazy(() => import('../pages/app/CourierDetailPage').then((m) => ({ default: m.CourierDetailPage })));
const PricingPage = lazy(() => import('../pages/app/PricingPage').then((m) => ({ default: m.PricingPage })));
const BookingsPage = lazy(() => import('../pages/app/BookingsPage').then((m) => ({ default: m.BookingsPage })));
const BookingDetailPage = lazy(() => import('../pages/app/BookingDetailPage').then((m) => ({ default: m.BookingDetailPage })));
const RateCalculatorPage = lazy(() => import('../pages/app/RateCalculatorPage').then((m) => ({ default: m.RateCalculatorPage })));
const CustomerMyRateCardPage = lazy(() => import('../pages/app/CustomerMyRateCardPage').then((m) => ({ default: m.CustomerMyRateCardPage })));
const ServiceabilityPage = lazy(() => import('../pages/app/ServiceabilityPage').then((m) => ({ default: m.ServiceabilityPage })));
const CourierAllocationPage = lazy(() => import('../pages/app/CourierAllocationPage').then((m) => ({ default: m.CourierAllocationPage })));
const WarehousesPage = lazy(() => import('../pages/app/WarehousesPage').then((m) => ({ default: m.WarehousesPage })));
const CodDashboardPage = lazy(() => import('../pages/app/CodDashboardPage').then((m) => ({ default: m.CodDashboardPage })));
const NdrManagementPage = lazy(() => import('../pages/app/NdrManagementPage').then((m) => ({ default: m.NdrManagementPage })));
const RtoManagementPage = lazy(() => import('../pages/app/RtoManagementPage').then((m) => ({ default: m.RtoManagementPage })));
const SellerOnboardingWizardPage = lazy(() => import('../pages/app/SellerOnboardingWizardPage').then((m) => ({ default: m.SellerOnboardingWizardPage })));
const SellerStaffUsersPage = lazy(() => import('../pages/app/settings/SellerStaffUsersPage').then((m) => ({ default: m.SellerStaffUsersPage })));
const SellerTeamRolesPage = lazy(() => import('../pages/app/team/SellerTeamRolesPage').then((m) => ({ default: m.SellerTeamRolesPage })));
const SellerTeamActivityPage = lazy(() => import('../pages/app/team/SellerTeamActivityPage').then((m) => ({ default: m.SellerTeamActivityPage })));
const CompanyProfilePage = lazy(() => import('../pages/app/settings/CompanyProfilePage').then((m) => ({ default: m.CompanyProfilePage })));
const SellerKycVerificationPage = lazy(() => import('../pages/app/settings/SellerKycVerificationPage').then((m) => ({ default: m.SellerKycVerificationPage })));
const BankDetailsPage = lazy(() => import('../pages/app/settings/BankDetailsPage').then((m) => ({ default: m.BankDetailsPage })));
const ShippingPlansPage = lazy(() => import('../pages/app/settings/ShippingPlansPage').then((m) => ({ default: m.ShippingPlansPage })));
const ServiceAgreementPage = lazy(() => import('../pages/app/settings/ServiceAgreementPage').then((m) => ({ default: m.ServiceAgreementPage })));
const TrainingCenterPage = lazy(() => import('../pages/app/settings/TrainingCenterPage').then((m) => ({ default: m.TrainingCenterPage })));
const PreferencesPage = lazy(() => import('../pages/app/settings/PreferencesPage').then((m) => ({ default: m.PreferencesPage })));
const ChangePasswordPage = lazy(() => import('../pages/app/settings/ChangePasswordPage').then((m) => ({ default: m.ChangePasswordPage })));
const WeightDiscrepancyPage = lazy(() => import('../pages/app/WeightDiscrepancyPage').then((m) => ({ default: m.WeightDiscrepancyPage })));
const OrderDetailPage = lazy(() => import('../pages/app/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })));
const GstProfileSettingsPage = lazy(() => import('../pages/app/settings/GstProfileSettingsPage').then((m) => ({ default: m.GstProfileSettingsPage })));
const CustomerGstInvoicesPage = lazy(() => import('../pages/app/billing/CustomerGstInvoicesPage').then((m) => ({ default: m.CustomerGstInvoicesPage })));

export const appRoutes: RouteObject = {
  path: '/app',
  element: <AppLayout />,
  children: [
    {
      index: true,
      element: <CustomerDashboard />,
    },
    // SHIPMENTS
    {
      path: 'shipments',
      element: <ShipmentsPage />,
    },
    {
      path: 'shipments/create',
      element: <CreateShipmentWizardPage />,
    },
    {
      path: 'shipments/:shipmentId',
      element: <TenantGuard><ShipmentControlCenterPage /></TenantGuard>,
    },
    {
      path: 'shipment-control-center/:id',
      element: <TenantGuard><ShipmentControlCenterPage /></TenantGuard>,
    },
    {
      path: 'shipments/:shipmentId/label',
      element: <ShipmentLabelPage />,
    },
    {
      path: 'labels/:id',
      element: <LabelPreviewPage />,
    },
    {
      path: 'shipments/ready',
      element: <RoutePlaceholder moduleName="Ready to Ship Dispatches" portal="Customer Portal" path="/app/shipments/ready" />,
    },
    {
      path: 'shipments/pickup',
      element: <PickupsPage />,
    },
    {
      path: 'shipments/in-transit',
      element: <RoutePlaceholder moduleName="In-Transit Parcels" portal="Customer Portal" path="/app/shipments/in-transit" />,
    },
    {
      path: 'shipments/out-for-delivery',
      element: <RoutePlaceholder moduleName="Out for Delivery Shipments" portal="Customer Portal" path="/app/shipments/out-for-delivery" />,
    },
    {
      path: 'shipments/delivered',
      element: <RoutePlaceholder moduleName="Delivered Orders & Proof of Delivery" portal="Customer Portal" path="/app/shipments/delivered" />,
    },
    {
      path: 'ndr',
      element: <NdrManagementPage />,
    },
    {
      path: 'weight-discrepancies',
      element: <WeightDiscrepancyPage />,
    },
    {
      path: 'rto',
      element: <RtoManagementPage />,
    },
    {
      path: 'tracking',
      element: <TrackingPage />,
    },
    {
      path: 'tracking/:shipmentId',
      element: <TrackingPage />,
    },
    {
      path: 'tracking-preview',
      element: <CustomerTrackingPreviewPage />,
    },
    {
      path: 'settings/tracking-page',
      element: <TrackingPageSettings />,
    },
    {
      path: 'notifications',
      element: <NotificationsPage />,
    },
    {
      path: 'notifications/templates',
      element: <NotificationTemplatesPage />,
    },
    {
      path: 'notifications/rules',
      element: <NotificationRulesPage />,
    },
    {
      path: 'notifications/:id',
      element: <NotificationDetailPage />,
    },
    {
      path: 'settings/notifications',
      element: <NotificationChannelSettings />,
    },
    {
      path: 'exceptions',
      element: <ExceptionsPage />,
    },
    {
      path: 'exceptions/:id',
      element: <ExceptionDetailPage />,
    },

    // PICKUPS
    {
      path: 'pickups',
      element: <CustomerPickupRequestsPage />,
    },
    {
      path: 'pickups/create',
      element: <CreatePickupWizardPage />,
    },
    {
      path: 'pickups/:pickupId',
      element: <PickupDetailPage />,
    },

    // LABELS & MANIFESTS
    {
      path: 'labels',
      element: <ShippingLabelsPage />,
    },
    {
      path: 'manifests',
      element: <ManifestsPage />,
    },
    {
      path: 'manifests/create',
      element: <CreateManifestPage />,
    },
    {
      path: 'manifests/:manifestId',
      element: <ManifestDetailPage />,
    },

    // BULK OPERATIONS
    {
      path: 'bulk',
      element: <BulkOrderImportPage />,
    },
    {
      path: 'bulk/upload',
      element: <BulkOrderImportPage />,
    },
    {
      path: 'bulk/history',
      element: <BulkOrderImportPage />,
    },
    {
      path: 'bulk/labels',
      element: <ShippingLabelsPage />,
    },
    {
      path: 'bulk/manifests',
      element: <ManifestsPage />,
    },
    {
      path: 'bulk/failed',
      element: <BulkOrderImportPage />,
    },

    // ORDERS
    {
      path: 'orders',
      element: <CustomerOrdersPage />,
    },
    {
      path: 'orders/bulk-upload',
      element: <BulkOrderImportPage />,
    },
    {
      path: 'orders/create',
      element: <CreateShipmentWizardPage />,
    },
    {
      path: 'orders/:id',
      element: <OrderDetailPage />,
    },
    {
      path: 'orders/pending',
      element: <RoutePlaceholder moduleName="Pending & Unfulfilled Orders" portal="Customer Portal" path="/app/orders/pending" />,
    },
    {
      path: 'orders/cancelled',
      element: <RoutePlaceholder moduleName="Cancelled Orders Log" portal="Customer Portal" path="/app/orders/cancelled" />,
    },

    // COURIERS & RATES
    {
      path: 'couriers',
      element: <CouriersPage />,
    },
    {
      path: 'couriers/integrations',
      element: <CouriersPage />,
    },
    {
      path: 'couriers/add',
      element: <AddCourierWizardPage />,
    },
    {
      path: 'couriers/:courierId',
      element: <CourierDetailPage />,
    },
    {
      path: 'pricing',
      element: <PricingPage />,
    },
    {
      path: 'bookings',
      element: <BookingsPage />,
    },
    {
      path: 'bookings/:id',
      element: <BookingDetailPage />,
    },
    {
      path: 'rates',
      element: <RateCalculatorPage />,
    },
    {
      path: 'my-rate-card',
      element: <CustomerMyRateCardPage />,
    },
    {
      path: 'rate-calculator',
      element: <RateCalculatorPage />,
    },
    {
      path: 'calculator',
      element: <RateCalculatorPage />,
    },
    {
      path: 'serviceability',
      element: <ServiceabilityPage />,
    },
    {
      path: 'couriers/calculator',
      element: <RateCalculatorPage />,
    },
    {
      path: 'couriers/serviceability',
      element: <ServiceabilityPage />,
    },
    {
      path: 'courier-allocation',
      element: <CourierAllocationPage />,
    },
    {
      path: 'couriers/allocation',
      element: <CourierAllocationPage />,
    },

    // FINANCE
    {
      path: 'wallet',
      element: <WalletPage />,
    },
    {
      path: 'wallet/transactions',
      element: <WalletTransactionsPage />,
    },
    {
      path: 'wallet/transactions/:id',
      element: <WalletTransactionDetailPage />,
    },
    {
      path: 'wallet/recharge',
      element: <WalletRechargeWizardPage />,
    },
    {
      path: 'cod',
      element: <CodDashboardPage />,
    },
    {
      path: 'billing',
      element: <CustomerGstInvoicesPage />,
    },
    {
      path: 'billing/gst-invoices',
      element: <CustomerGstInvoicesPage />,
    },
    {
      path: 'billing/invoices/:id',
      element: <InvoiceDetailPage />,
    },
    {
      path: 'settings/billing',
      element: <BillingSettingsPage />,
    },
    {
      path: 'settings/gst-profile',
      element: <GstProfileSettingsPage />,
    },
    {
      path: 'settings/warehouses',
      element: <WarehousesPage />,
    },
    {
      path: 'settings/couriers',
      element: <CourierSettingsPage />,
    },

    // ANALYTICS
    {
      path: 'reports',
      element: <RoutePlaceholder moduleName="Analytics & Shipping Reports" portal="Customer Portal" path="/app/reports" />,
    },
    {
      path: 'reports/analytics',
      element: <RoutePlaceholder moduleName="Logistics BI & Shipping Analytics" portal="Customer Portal" path="/app/reports/analytics" />,
    },

    // MANAGEMENT
    {
      path: 'warehouses',
      element: <WarehousesPage />,
    },
    {
      path: 'customers',
      element: <RoutePlaceholder moduleName="Customer Address Book" portal="Customer Portal" path="/app/customers" />,
    },
    {
      path: 'onboarding',
      element: <SellerOnboardingWizardPage />,
    },
    {
      path: 'team',
      element: <PermissionGuard><SellerStaffUsersPage /></PermissionGuard>,
    },
    {
      path: 'team/roles',
      element: <PermissionGuard><SellerTeamRolesPage /></PermissionGuard>,
    },
    {
      path: 'team/activity',
      element: <PermissionGuard><SellerTeamActivityPage /></PermissionGuard>,
    },
    {
      path: 'settings/team',
      element: <PermissionGuard><SellerStaffUsersPage /></PermissionGuard>,
    },
    {
      path: 'settings/company',
      element: <CompanyProfilePage />,
    },
    {
      path: 'settings/profile',
      element: <CompanyProfilePage />,
    },
    {
      path: 'kyc',
      element: <SellerKycVerificationPage />,
    },
    {
      path: 'settings/kyc',
      element: <SellerKycVerificationPage />,
    },
    {
      path: 'settings/bank',
      element: <BankDetailsPage />,
    },
    {
      path: 'settings/shipping-plans',
      element: <ShippingPlansPage />,
    },
    {
      path: 'settings/agreement',
      element: <ServiceAgreementPage />,
    },
    {
      path: 'settings/training',
      element: <TrainingCenterPage />,
    },
    {
      path: 'settings/preferences',
      element: <PreferencesPage />,
    },
    {
      path: 'settings/security',
      element: <ChangePasswordPage />,
    },
    // SUPPORT & ACCOUNT
    {
      path: 'support',
      element: <RoutePlaceholder moduleName="Customer Support & Help Desk" portal="Customer Portal" path="/app/support" />,
    },
    {
      path: 'support/tickets',
      element: <RoutePlaceholder moduleName="Support Tickets History" portal="Customer Portal" path="/app/support/tickets" />,
    },
    {
      path: 'settings',
      element: <CompanyProfilePage />,
    },
  ],
};

export const publicTrackRoutes: RouteObject = {
  path: 'track',
  element: <PublicTrackingPage />,
  children: [
    {
      path: ':awb',
      element: <PublicTrackingPage />,
    },
  ],
};
