import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ShieldAlert,
  Activity,
  BarChart3,
  PieChart,
  X,
  Copy,
  Check,
  ExternalLink,
  Clock,
  MapPin,
  Calendar,
  Boxes,
  Compass,
  Calculator,
  Warehouse,
  ReceiptText,
  PackagePlus,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Table,
  CardSkeleton,
} from '../../components/ui';
import { Drawer } from '../../components/ui/Drawer';
import { AnimatedCounter } from '../../components/common/AnimatedCounter';
import { WalletService } from '../../mocks/wallet.mock';
import { CustomerShipmentService, type CustomerShipmentDetail } from '../../services/customerShipmentService';
import { formatNumber } from '../../utils/formatters';
import { OnboardingTrackerCard } from '../../components/app/OnboardingTrackerCard';
import { useTenant } from '../../context/TenantContext';

export const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Alert Dismiss States
  const [showDisputesAlert, setShowDisputesAlert] = useState(false);
  const [showNdrAlert, setShowNdrAlert] = useState(false);
  const [showWalletAlert, setShowWalletAlert] = useState(true);

  // 5-Stage Interactive Shipment Pipeline Filter ('all' | 'created' | 'inTransit' | 'delivered' | 'rto')
  const [activeStageFilter, setActiveStageFilter] = useState<'all' | 'created' | 'inTransit' | 'delivered' | 'rto'>('all');

  // Slide-over Order Peek Drawer
  const [selectedDrawerOrder, setSelectedDrawerOrder] = useState<CustomerShipmentDetail | null>(null);

  // 1-Click Copy AWB with temporary feedback
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);
  const handleCopyAwb = (e: React.MouseEvent, awb: string) => {
    e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(awb);
    }
    setCopiedAwb(awb);
    setTimeout(() => {
      setCopiedAwb((prev) => (prev === awb ? null : prev));
    }, 2000);
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setSyncVersion] = useState<number>(0);

  // Active Tenant & Wallet Data
  const { activeTenantId, activeTenant } = useTenant();

  const currentUser = (() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('courrier3_current_user');
        if (raw) return JSON.parse(raw);
      }
    } catch {}
    return null;
  })();

  const rawMerchantName = activeTenant?.companyName || currentUser?.businessName || '';
  const isGenericOrMissing =
    !rawMerchantName ||
    rawMerchantName.trim() === '' ||
    rawMerchantName.toLowerCase().includes('tenant-') ||
    rawMerchantName.toLowerCase().includes('skyon');

  const merchantDisplayName = !isGenericOrMissing ? rawMerchantName.trim() : 'Merchant Setup Pending';

  const handleSync = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        CustomerShipmentService.syncFromSupabase(activeTenantId),
        WalletService.syncFromSupabase(activeTenantId),
      ]);
      setSyncVersion((v) => v + 1);
    } catch {
      // non-blocking
    } finally {
      setTimeout(() => setIsRefreshing(false), 350);
    }
  };

  // Synchronize shipments and wallet from Supabase Cloud DB on mount
  useEffect(() => {
    handleSync();
  }, [activeTenantId]);

  const wallet = WalletService.getWallet(activeTenantId);
  const walletBalancePaise = wallet.availableBalanceMinor ?? 0;
  const walletBalanceINR = (walletBalancePaise / 100).toFixed(2);
  const isWalletLow = parseFloat(walletBalanceINR) < 500;

  // Real-time Tenant Shipments Data
  const tenantShipments = CustomerShipmentService.queryShipments({ tenantId: activeTenantId });

  const totalShipmentsCount = tenantShipments.length;
  const todaysOrdersCount = tenantShipments.length;
  const createdCount = tenantShipments.filter((s) =>
    ['CREATED', 'DRAFT', 'BOOKING_CONFIRMED', 'AWB_ASSIGNED', 'PICKUP_REQUESTED', 'PENDING_API', 'API_PROCESSING'].includes(
      s.bookingStatus
    )
  ).length;
  const inTransitCount = tenantShipments.filter((s) =>
    ['IN_TRANSIT', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(s.bookingStatus)
  ).length;
  const deliveredCount = tenantShipments.filter((s) => s.bookingStatus === 'DELIVERED').length;
  const rtoCount = tenantShipments.filter((s) =>
    ['NDR', 'RTO_INITIATED', 'RTO_IN_TRANSIT', 'RTO_DELIVERED', 'CANCELLED', 'CANCEL_REQUESTED'].includes(s.bookingStatus)
  ).length;
  const codPendingTotal = tenantShipments
    .filter((s) => s.paymentMode === 'COD' && s.bookingStatus !== 'DELIVERED')
    .reduce((acc, curr) => acc + (curr.codAmountINR || 0), 0);

  // Breadcrumbs
  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Dashboard', path: '/app' },
  ];

  // 1. TOP 5 KPI CARDS CONFIGURATION (Clean white surfaces, deep navy numbers, refined royal-blue badges)
  const kpiCardsList = [
    {
      id: 'wallet-balance',
      title: 'Wallet Balance',
      numericValue: parseFloat(walletBalanceINR) || 0,
      prefix: '₹ ',
      decimals: 2,
      trend: parseFloat(walletBalanceINR) > 0 ? 'Active Funds' : 'Recharge Required',
      isTrendPositive: parseFloat(walletBalanceINR) > 0,
      subtitle: 'Available shipping balance',
      icon: Wallet,
      iconColor: '#1d4ed8',
      iconBg: '#eff6ff',
      path: '/app/wallet',
    },
    {
      id: 'todays-orders',
      title: "Today's Orders",
      numericValue: todaysOrdersCount,
      prefix: '',
      decimals: 0,
      trend: todaysOrdersCount === 0 ? '0 Booked' : `${todaysOrdersCount} Active`,
      isTrendPositive: todaysOrdersCount > 0,
      subtitle: 'Booked for dispatch',
      icon: Package,
      iconColor: '#0f172a',
      iconBg: '#f8fafc',
      path: '/app/orders',
    },
    {
      id: 'in-transit',
      title: 'In Transit',
      numericValue: inTransitCount,
      prefix: '',
      decimals: 0,
      trend: inTransitCount === 0 ? '0 on Route' : `${inTransitCount} on Linehaul`,
      isTrendPositive: inTransitCount > 0,
      subtitle: 'Active shipments on the move',
      icon: Truck,
      iconColor: '#0284c7',
      iconBg: '#f0f9ff',
      path: '/app/shipments',
    },
    {
      id: 'delivered',
      title: 'Delivered',
      numericValue: deliveredCount,
      prefix: '',
      decimals: 0,
      trend: deliveredCount === 0 ? '0 Delivered' : `${deliveredCount} Fulfilled`,
      isTrendPositive: true,
      subtitle: 'Successfully completed',
      icon: CheckCircle2,
      iconColor: '#16a34a',
      iconBg: '#f0fdf4',
      path: '/app/shipments',
    },
    {
      id: 'cod-pending',
      title: 'COD Pending',
      numericValue: codPendingTotal,
      prefix: '₹ ',
      decimals: 2,
      trend: codPendingTotal === 0 ? 'Nil Pending' : `Pipeline Active`,
      isTrendPositive: true,
      subtitle: 'Cash on delivery balance',
      icon: CreditCard,
      iconColor: '#b45309',
      iconBg: '#fffbeb',
      path: '/app/cod',
    },
  ];

  // 2. COMPACT QUICK OPERATIONAL ACTIONS (Refined, high-efficiency command row)
  const quickActionsList = [
    {
      id: 'create-shipment',
      title: 'Create Shipment',
      subtitle: 'B2C & B2B rate cards',
      icon: PackagePlus,
      iconColor: '#1d4ed8',
      iconBg: '#eff6ff',
      path: '/app/orders/create',
    },
    {
      id: 'all-orders',
      title: 'All Orders',
      subtitle: 'Manifests & labels',
      icon: Boxes,
      iconColor: '#0f172a',
      iconBg: '#f8fafc',
      path: '/app/orders',
    },
    {
      id: 'track-shipment',
      title: 'Track AWB',
      subtitle: 'Real-time timeline',
      icon: Compass,
      iconColor: '#0284c7',
      iconBg: '#f0f9ff',
      path: '/app/tracking',
    },
    {
      id: 'rate-calculator',
      title: 'Rate Calculator',
      subtitle: '29,000+ pincodes',
      icon: Calculator,
      iconColor: '#1d4ed8',
      iconBg: '#eff6ff',
      path: '/app/rates',
    },
    {
      id: 'warehouses',
      title: 'Pickup Hubs',
      subtitle: 'Manage origin points',
      icon: Warehouse,
      iconColor: '#0f172a',
      iconBg: '#f8fafc',
      path: '/app/warehouses',
    },
    {
      id: 'invoices',
      title: 'Invoices & Billing',
      subtitle: 'GST tax statements',
      icon: ReceiptText,
      iconColor: '#047857',
      iconBg: '#ecfdf5',
      path: '/app/billing',
    },
  ];

  // 3. RECENT ORDERS DATA (Filtered dynamically by active pipeline funnel stage)
  const filteredShipments = tenantShipments.filter((s) => {
    if (activeStageFilter === 'all') return true;
    if (activeStageFilter === 'created') {
      return ['CREATED', 'DRAFT', 'BOOKING_CONFIRMED', 'AWB_ASSIGNED', 'PICKUP_REQUESTED', 'PENDING_API', 'API_PROCESSING'].includes(
        s.bookingStatus
      );
    }
    if (activeStageFilter === 'inTransit') {
      return ['IN_TRANSIT', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(s.bookingStatus);
    }
    if (activeStageFilter === 'delivered') {
      return s.bookingStatus === 'DELIVERED';
    }
    if (activeStageFilter === 'rto') {
      return ['NDR', 'RTO_INITIATED', 'RTO_IN_TRANSIT', 'RTO_DELIVERED', 'CANCELLED', 'CANCEL_REQUESTED'].includes(
        s.bookingStatus
      );
    }
    return true;
  });

  interface RecentOrderRow extends Record<string, unknown> {
    awb: string;
    orderId: string;
    customer: string;
    destinationCity: string;
    courier: string;
    status: string;
    statusVariant: 'success' | 'info' | 'warning' | 'danger' | 'brand' | 'neutral';
    amount: string;
    rawShipment: CustomerShipmentDetail;
  }

  const recentOrdersData: RecentOrderRow[] = filteredShipments.slice(0, 6).map((s) => ({
    awb: s.awbNumber || 'PENDING',
    orderId: s.orderId || s.id,
    customer: s.deliveryContact || 'Customer',
    destinationCity: s.deliveryCity || '',
    courier: s.courierName || 'MAXLINE Express',
    status: CustomerShipmentService.getCustomerFacingStatus(s.bookingStatus),
    statusVariant: (s.bookingStatus === 'DELIVERED' ? 'success' : s.bookingStatus === 'CANCELLED' ? 'danger' : 'brand') as any,
    amount: `₹${(s.totalCustomerChargeINR || 0).toFixed(2)}`,
    rawShipment: s,
  }));

  // 4. LIVE OPERATIONAL ACTIVITY FEED DATA
  const activityFeedData = [
    {
      id: 'act-1',
      title: 'Database Synchronized',
      description: 'Dedicated MAXLINE Supabase cloud connection active (HTTP 200 OK)',
      time: 'Real-time',
      icon: CheckCircle2,
      iconColor: '#16a34a',
      bgColor: '#f0fdf4',
    },
    {
      id: 'act-2',
      title: 'Merchant Workspace Initialized',
      description: 'Multi-carrier routing & automated rate assignment engine standing by',
      time: 'Live',
      icon: Package,
      iconColor: '#1d4ed8',
      bgColor: '#eff6ff',
    },
    {
      id: 'act-3',
      title: 'Billing & Wallet Ready',
      description: 'Prepaid balance ledger and automated freight debit system active',
      time: 'System',
      icon: Wallet,
      iconColor: '#0f172a',
      bgColor: '#f8fafc',
    },
  ];

  // 5. COURIER USAGE ANALYTICS DATA
  const courierUsageData = [
    { name: 'Delhivery Surface', share: 45, count: 0, color: '#1d4ed8' },
    { name: 'Blue Dart Air', share: 30, count: 0, color: '#0284c7' },
    { name: 'DTDC Express', share: 25, count: 0, color: '#475569' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '48px' }}>
      
      {/* 1. DASHBOARD HEADER WITH ENTERPRISE CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          {/* Breadcrumb Trail */}
          <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
            <span>Merchant Portal</span>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ color: '#0f172a', fontWeight: '600' }}>Dashboard</span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span
              style={{
                color: merchantDisplayName === 'Merchant Setup Pending' ? '#64748b' : '#1d4ed8',
                fontWeight: '700',
                fontSize: '11px',
                backgroundColor: merchantDisplayName === 'Merchant Setup Pending' ? '#f1f5f9' : '#eff6ff',
                border: `1px solid ${merchantDisplayName === 'Merchant Setup Pending' ? '#e2e8f0' : '#bfdbfe'}`,
                padding: '1px 8px',
                borderRadius: '12px',
              }}
            >
              {merchantDisplayName}
            </span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              Merchant Dashboard
            </h1>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 9px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: '600', color: '#475569' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#94a3b8' }} />
              System Operational
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0', lineHeight: 1.4 }}>
            Real-time shipping operations, wallet balance, and delivery metrics.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleSync}
            disabled={isRefreshing}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '12px',
              fontWeight: '600',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.15s ease',
            }}
            title="Refresh database sync"
          >
            <RefreshCw size={13} style={{ transform: isRefreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s ease' }} />
            {isRefreshing ? 'Syncing...' : 'Sync'}
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/rates')}
            leftIcon={<Calculator size={14} />}
            style={{ borderColor: '#e2e8f0', color: '#0f172a', fontWeight: '600', fontSize: '13px', height: '36px', backgroundColor: '#ffffff' }}
          >
            Rate Calculator
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => navigate('/app/orders/create')}
            style={{ backgroundColor: '#1d4ed8', borderColor: '#1d4ed8', fontWeight: '700', fontSize: '13px', height: '36px', boxShadow: '0 1px 3px rgba(29, 78, 216, 0.3)' }}
          >
            Create Shipment
          </Button>
        </div>
      </div>

      {/* ONBOARDING TRACKER CARD */}
      <OnboardingTrackerCard customerId="CUST-1001" />

      {/* 2. ALERT CENTER (CONDITIONAL OPERATIONAL ALERTS) */}
      {(showDisputesAlert || showNdrAlert || (isWalletLow && showWalletAlert)) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Weight Disputes Alert */}
          {showDisputesAlert && (
            <div style={{ padding: '12px 16px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={18} style={{ color: '#d97706', flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: '13px', color: '#92400e', display: 'block' }}>3 Weight Disputes Pending Verification</strong>
                  <span style={{ fontSize: '12px', color: '#b45309' }}>Courier weight discrepancies detected. Submit proof to avoid auto-debit.</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button variant="outline" size="sm" onClick={() => navigate('/app/weight-discrepancies')} style={{ fontSize: '12px', borderColor: '#fde68a', color: '#92400e', backgroundColor: '#ffffff' }}>
                  Resolve Disputes
                </Button>
                <button
                  type="button"
                  onClick={() => setShowDisputesAlert(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#92400e', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Dismiss Alert"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Pending NDR Alert */}
          {showNdrAlert && (
            <div style={{ padding: '12px 16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={18} style={{ color: '#1d4ed8', flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: '13px', color: '#1e3a8a', display: 'block' }}>38 Pending NDR Cases Requiring Action</strong>
                  <span style={{ fontSize: '12px', color: '#1d4ed8' }}>Delivery re-attempt instructions needed to prevent parcel return.</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Button variant="outline" size="sm" onClick={() => navigate('/app/ndr')} style={{ height: '30px', fontSize: '12px', fontWeight: '600', borderColor: '#93c5fd', color: '#1d4ed8', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                  Take Action
                </Button>
                <button
                  type="button"
                  onClick={() => setShowNdrAlert(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8' }}
                  title="Dismiss Alert"
                  aria-label="Dismiss pending NDR alert"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* Low Wallet Balance Alert */}
          {isWalletLow && showWalletAlert && (
            <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CreditCard size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: '13px', color: '#991b1b', display: 'block' }}>Low Wallet Balance (₹{walletBalanceINR})</strong>
                  <span style={{ fontSize: '12px', color: '#b91c1c' }}>Recharge your shipping wallet to ensure uninterrupted courier dispatch.</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  style={{ height: '30px', fontSize: '12px', fontWeight: '600', borderColor: '#fca5a5', color: '#991b1b', backgroundColor: '#ffffff', borderRadius: '6px', cursor: 'not-allowed' }}
                >
                  Recharge Unavailable
                </Button>
                <button
                  type="button"
                  onClick={() => setShowWalletAlert(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991b1b' }}
                  title="Dismiss Alert"
                  aria-label="Dismiss low wallet balance alert"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. REFINED KPI CARDS (Clean White Surfaces, Deep Navy Numbers, Royal Blue Accents) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', width: '100%' }}>
        {kpiCardsList.map((card) => {
          const CardIcon = card.icon;
          return (
            <div
              key={card.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(card.path)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(card.path);
                }
              }}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(15, 23, 42, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: card.iconBg,
                    border: '1px solid rgba(0,0,0,0.04)',
                    color: card.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CardIcon size={19} />
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: card.isTrendPositive ? '#15803d' : '#b91c1c',
                    backgroundColor: card.isTrendPositive ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${card.isTrendPositive ? '#dcfce7' : '#fee2e2'}`,
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  {card.isTrendPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {card.trend}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                  {card.title}
                </span>

                <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', lineHeight: 1.15, marginTop: '4px', letterSpacing: '-0.02em' }}>
                  <AnimatedCounter
                    value={card.numericValue}
                    prefix={card.prefix}
                    decimals={card.decimals}
                  />
                </div>

                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  {card.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. COMPACT QUICK-ACTION SECTION */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Quick Operations
          </h2>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Core logistics shortcuts</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', width: '100%' }}>
          {quickActionsList.map((action) => {
            const ActionIcon = action.icon;
            return (
              <div
                key={action.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(action.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(action.path);
                  }
                }}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.borderColor = '#1d4ed8';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 78, 216, 0.08)';
                  const arrow = e.currentTarget.querySelector('.action-arrow') as HTMLElement | null;
                  if (arrow) arrow.style.color = '#1d4ed8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.03)';
                  const arrow = e.currentTarget.querySelector('.action-arrow') as HTMLElement | null;
                  if (arrow) arrow.style.color = '#94a3b8';
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: action.iconBg,
                    color: action.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ActionIcon size={17} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {action.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {action.subtitle}
                  </div>
                </div>

                <ArrowUpRight className="action-arrow" size={15} style={{ color: '#94a3b8', flexShrink: 0, transition: 'color 0.15s ease' }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. PIPELINE FUNNEL & WALLET SUMMARY ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', alignItems: 'stretch' }}>
        
        {/* LEFT: SHIPMENT PIPELINE FUNNEL */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: totalShipmentsCount === 0 ? '14px 18px' : '22px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: totalShipmentsCount === 0 ? '10px' : '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={17} style={{ color: '#1d4ed8' }} /> Shipment Pipeline Funnel
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Interactive stage filter for active consignments</span>
              </div>

              {activeStageFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setActiveStageFilter('all')}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '6px',
                    border: '1px solid #bfdbfe',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Show all shipments"
                >
                  Clear Filter <X size={12} />
                </button>
              )}
            </div>

            {/* Visual Performance Progress Bar */}
            <div style={{ marginBottom: totalShipmentsCount === 0 ? '10px' : '16px' }}>
              <div style={{ height: '8px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: totalShipmentsCount > 0 ? `${Math.round((deliveredCount / totalShipmentsCount) * 100)}%` : '0%', backgroundColor: '#16a34a', transition: 'width 0.4s ease' }} title={`Delivered: ${deliveredCount}`} />
                <div style={{ width: totalShipmentsCount > 0 ? `${Math.round((inTransitCount / totalShipmentsCount) * 100)}%` : '0%', backgroundColor: '#0284c7', transition: 'width 0.4s ease' }} title={`In Transit: ${inTransitCount}`} />
                <div style={{ width: totalShipmentsCount > 0 ? `${Math.round((createdCount / totalShipmentsCount) * 100)}%` : '0%', backgroundColor: '#93c5fd', transition: 'width 0.4s ease' }} title={`Created: ${createdCount}`} />
                <div style={{ width: totalShipmentsCount > 0 ? `${Math.round((rtoCount / totalShipmentsCount) * 100)}%` : '0%', backgroundColor: '#ef4444', transition: 'width 0.4s ease' }} title={`RTO / NDR: ${rtoCount}`} />
              </div>
            </div>

            {/* Interactive 5-Stage Funnel Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', gap: totalShipmentsCount === 0 ? '6px' : '8px' }}>
              {[
                { key: 'all' as const, label: 'All Orders', count: totalShipmentsCount, color: '#1e293b' },
                { key: 'created' as const, label: 'Booked', count: createdCount, color: '#1d4ed8' },
                { key: 'inTransit' as const, label: 'In Transit', count: inTransitCount, color: '#0284c7' },
                { key: 'delivered' as const, label: 'Delivered', count: deliveredCount, color: '#16a34a' },
                { key: 'rto' as const, label: 'NDR / RTO', count: rtoCount, color: '#dc2626' },
              ].map((stage) => {
                const isActive = activeStageFilter === stage.key;
                return (
                  <button
                    key={stage.key}
                    type="button"
                    onClick={() => setActiveStageFilter(stage.key)}
                    style={{
                      padding: totalShipmentsCount === 0 ? '6px 4px' : '10px 6px',
                      backgroundColor: isActive ? '#eff6ff' : '#f8fafc',
                      border: `1.5px solid ${isActive ? '#1d4ed8' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? '0 2px 8px rgba(29, 78, 216, 0.12)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: totalShipmentsCount === 0 ? '9px' : '10px', color: stage.color, fontWeight: '700', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {stage.label}
                    </span>
                    <span style={{ fontSize: totalShipmentsCount === 0 ? '15px' : '18px', fontWeight: '800', color: '#0f172a', display: 'block', marginTop: '2px', lineHeight: 1.1 }}>
                      <AnimatedCounter value={stage.count} />
                    </span>
                    {isActive && (
                      <span style={{ fontSize: '9px', fontWeight: '800', color: '#1d4ed8', display: 'inline-block', marginTop: '2px', textTransform: 'uppercase' }}>
                        Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: totalShipmentsCount === 0 ? '10px' : '16px', paddingTop: totalShipmentsCount === 0 ? '8px' : '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
            <span>Fulfillment Rate: <strong style={{ color: totalShipmentsCount > 0 ? '#16a34a' : '#64748b' }}>{totalShipmentsCount > 0 ? `${Math.round((deliveredCount / totalShipmentsCount) * 100)}%` : '—'}</strong></span>
            <span>Filter: <strong style={{ color: '#1d4ed8', textTransform: 'uppercase' }}>{activeStageFilter}</strong></span>
          </div>
        </div>

        {/* RIGHT: WALLET SUMMARY CARD */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '22px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={18} style={{ color: '#1d4ed8' }} />
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Shipping Wallet
                </h3>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#1d4ed8', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '12px' }}>
                Prepaid Merchant
              </span>
            </div>

            {/* Current Balance Block */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                Available Shipping Funds
              </span>
              <div style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', marginTop: '4px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                <AnimatedCounter
                  value={parseFloat(walletBalanceINR) || 0}
                  prefix="₹ "
                  decimals={2}
                />
              </div>
            </div>

            {/* Hold Balance & Monthly Spend breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>Hold Balance</span>
                <strong style={{ color: '#0f172a', fontSize: '14px', display: 'block', marginTop: '2px' }}>₹ 0.00</strong>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>Monthly Spend</span>
                <strong style={{ color: '#0f172a', fontSize: '14px', display: 'block', marginTop: '2px' }}>₹ 0.00</strong>
              </div>
            </div>
          </div>

          {/* Recharge CTA */}
          <div style={{ marginTop: '16px' }}>
            <Button
              variant="outline"
              size="md"
              disabled
              style={{
                width: '100%',
                backgroundColor: '#f8fafc',
                borderColor: '#e2e8f0',
                color: '#64748b',
                fontWeight: '600',
                height: '38px',
                cursor: 'not-allowed',
                boxShadow: 'none',
              }}
              title="Online payment gateway integration is currently in setup mode"
            >
              Recharge Unavailable
            </Button>
            <span style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', display: 'block', marginTop: '6px' }}>
              Payment gateway not live • Automated credit disabled
            </span>
          </div>
        </div>

      </div>

      {/* 6. RECENT ORDERS TABLE & LIVE ACTIVITY FEED */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', alignItems: 'start' }}>
        
        {/* LEFT: RECENT ORDERS TABLE & PROFESSIONAL EMPTY STATE */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '22px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={17} style={{ color: '#1d4ed8' }} /> Recent Shipments
              </h3>
              {activeStageFilter !== 'all' && (
                <Badge variant="brand">
                  {activeStageFilter.toUpperCase()} ({recentOrdersData.length})
                </Badge>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/shipments')}
              style={{ background: 'none', border: 'none', color: '#1d4ed8', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              View All Shipments <ArrowRight size={13} />
            </button>
          </div>

          {recentOrdersData.length === 0 ? (
            /* PROFESSIONAL EMPTY STATE FOR ZERO SHIPMENTS */
            <div
              style={{
                padding: '44px 24px',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Dual-ring visual icon */}
              <div
                style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #dbeafe',
                  boxShadow: '0 0 0 8px #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1d4ed8',
                  marginBottom: '16px',
                }}
              >
                <PackagePlus size={26} />
              </div>

              <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
                {activeStageFilter !== 'all'
                  ? `No Shipments in "${activeStageFilter.toUpperCase()}" Stage`
                  : 'Ready to Dispatch Your First Consignment'}
              </h4>

              <p style={{ fontSize: '13px', color: '#475569', margin: '0 auto 20px', maxWidth: '440px', lineHeight: 1.5 }}>
                {activeStageFilter !== 'all'
                  ? 'There are no active orders matching this pipeline stage. Clear the stage filter to view all merchant consignments.'
                  : 'Book single orders or B2B freight with instant AWB generation across 29,000+ Indian pincodes.'}
              </p>

              {/* Value Feature Badges */}
              {activeStageFilter === 'all' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginBottom: '22px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#334155', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '16px' }}>
                    ⚡ Instant AWB Generation
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#334155', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '16px' }}>
                    🚚 Multi-Carrier Allocation
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#334155', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '16px' }}>
                    📍 Real-Time Tracking
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {activeStageFilter !== 'all' ? (
                  <Button variant="primary" size="sm" onClick={() => setActiveStageFilter('all')} style={{ backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' }}>
                    Show All Orders
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/app/orders/create')}
                      leftIcon={<Plus size={15} />}
                      style={{ backgroundColor: '#1d4ed8', borderColor: '#1d4ed8', fontWeight: '700', height: '36px' }}
                    >
                      Book First Shipment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/app/rates')}
                      leftIcon={<Calculator size={14} />}
                      style={{ borderColor: '#e2e8f0', color: '#0f172a', fontWeight: '600', height: '36px', backgroundColor: '#ffffff' }}
                    >
                      Check Rates
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <Table
              columns={[
                {
                  key: 'awb',
                  header: 'AWB / Tracking',
                  render: (r: RecentOrderRow) => (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedDrawerOrder(r.rawShipment)}
                        style={{
                          fontFamily: 'monospace',
                          color: '#1d4ed8',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                        }}
                        title="Open Quick Peek Drawer"
                      >
                        {r.awb}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleCopyAwb(e, r.awb)}
                        style={{
                          background: copiedAwb === r.awb ? '#dcfce7' : '#f8fafc',
                          border: `1px solid ${copiedAwb === r.awb ? '#86efac' : '#e2e8f0'}`,
                          borderRadius: '4px',
                          padding: '2px 5px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                        }}
                        title={copiedAwb === r.awb ? 'Copied to clipboard!' : 'Copy AWB'}
                      >
                        {copiedAwb === r.awb ? (
                          <Check size={11} style={{ color: '#16a34a' }} />
                        ) : (
                          <Copy size={11} style={{ color: '#64748b' }} />
                        )}
                      </button>
                      {copiedAwb === r.awb && (
                        <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '700' }}>Copied!</span>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'customer',
                  header: 'Customer',
                  render: (r: RecentOrderRow) => (
                    <div>
                      <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '12px', whiteSpace: 'nowrap', display: 'block' }}>
                        {r.customer}
                      </span>
                      {r.destinationCity && (
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                          📍 {r.destinationCity}
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'courier',
                  header: 'Courier',
                  render: (r: RecentOrderRow) => (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #dbeafe',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Truck size={12} style={{ color: '#1d4ed8' }} />
                      {r.courier}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (r: RecentOrderRow) => <Badge variant={r.statusVariant}>{r.status}</Badge>,
                },
                {
                  key: 'amount',
                  header: 'Amount',
                  align: 'right',
                  render: (r: RecentOrderRow) => <strong style={{ color: '#0f172a', fontSize: '12px' }}>{r.amount}</strong>,
                },
                {
                  key: 'action',
                  header: 'Action',
                  align: 'center',
                  render: (r: RecentOrderRow) => (
                    <button
                      type="button"
                      onClick={() => setSelectedDrawerOrder(r.rawShipment)}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#1d4ed8',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                        e.currentTarget.style.borderColor = '#1d4ed8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                      title="Open Peek Drawer"
                    >
                      Peek <ExternalLink size={10} />
                    </button>
                  ),
                },
              ]}
              data={recentOrdersData}
              keyExtractor={(r) => r.awb}
            />
          )}
        </div>

        {/* RIGHT: LIVE ACTIVITY FEED */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '22px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={17} style={{ color: '#16a34a' }} /> Operational Stream
            </h3>
            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '12px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }} /> Live
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activityFeedData.map((act) => {
              const ActIcon = act.icon;
              return (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: act.bgColor,
                      color: act.iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ActIcon size={16} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px' }}>
                      <strong style={{ fontSize: '12px', color: '#0f172a' }}>{act.title}</strong>
                      <span style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0 }}>{act.time}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#475569', margin: '3px 0 0 0', lineHeight: 1.45 }}>
                      {act.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 7. COURIER USAGE ANALYTICS */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '22px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={17} style={{ color: '#1d4ed8' }} /> Carrier Fleet Distribution
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Consignment volume allocation across integrated carrier networks</span>
          </div>

          <Badge variant="neutral">0 Active Dispatches</Badge>
        </div>

        {/* Multi-Segment Share Bar */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ height: '8px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
            {courierUsageData.map((c) => (
              <div key={c.name} style={{ width: `${c.share}%`, backgroundColor: c.color }} title={`${c.name}: ${c.share}%`} />
            ))}
          </div>
        </div>

        {/* Courier Share Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {courierUsageData.map((c) => (
            <div key={c.name} style={{ padding: '12px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: c.color, display: 'inline-block' }} />
                  {c.name}
                </span>
                <strong style={{ fontSize: '13px', color: '#1d4ed8' }}>{c.share}%</strong>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {formatNumber(c.count)} shipments dispatched
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. SLIDE-OVER ORDER PEEK DRAWER */}
      <Drawer
        isOpen={Boolean(selectedDrawerOrder)}
        onClose={() => setSelectedDrawerOrder(null)}
        position="right"
        title={selectedDrawerOrder ? `Order: ${selectedDrawerOrder.orderId || selectedDrawerOrder.awbNumber || 'Details'}` : 'Shipment Details'}
      >
        {selectedDrawerOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* AWB & Status Banner */}
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Airway Bill (AWB)
                  </span>
                  <Badge variant={selectedDrawerOrder.bookingStatus === 'DELIVERED' ? 'success' : selectedDrawerOrder.bookingStatus === 'CANCELLED' ? 'danger' : 'brand'}>
                    {CustomerShipmentService.getCustomerFacingStatus(selectedDrawerOrder.bookingStatus)}
                  </Badge>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                    {selectedDrawerOrder.awbNumber || 'PENDING ASSIGNMENT'}
                  </span>
                  {selectedDrawerOrder.awbNumber && (
                    <button
                      type="button"
                      onClick={(e) => handleCopyAwb(e, selectedDrawerOrder.awbNumber!)}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: copiedAwb === selectedDrawerOrder.awbNumber ? '#16a34a' : '#1d4ed8',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Copy AWB number"
                    >
                      {copiedAwb === selectedDrawerOrder.awbNumber ? (
                        <>
                          <Check size={12} color="#16a34a" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* 4-Step Tracking Stepper */}
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} style={{ color: '#1d4ed8' }} /> Shipment Journey Stepper
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingLeft: '4px' }}>
                  {[
                    {
                      label: 'Booked / Manifested',
                      sub: 'AWB generated on MAXLINE Express',
                      isDone: true,
                      isCurrent: ['BOOKING_CONFIRMED', 'AWB_ASSIGNED', 'PICKUP_REQUESTED'].includes(selectedDrawerOrder.bookingStatus),
                    },
                    {
                      label: 'Pickup Completed',
                      sub: selectedDrawerOrder.pickupCity ? `Origin: ${selectedDrawerOrder.pickupCity}` : 'Dispatched from origin hub',
                      isDone: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedDrawerOrder.bookingStatus),
                      isCurrent: selectedDrawerOrder.bookingStatus === 'PICKED_UP',
                    },
                    {
                      label: 'In Transit / Out for Delivery',
                      sub: 'Linehaul transit active',
                      isDone: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedDrawerOrder.bookingStatus),
                      isCurrent: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(selectedDrawerOrder.bookingStatus),
                    },
                    {
                      label: 'Delivered',
                      sub: selectedDrawerOrder.bookingStatus === 'DELIVERED' ? 'Successfully handed over' : 'Pending destination handover',
                      isDone: selectedDrawerOrder.bookingStatus === 'DELIVERED',
                      isCurrent: selectedDrawerOrder.bookingStatus === 'DELIVERED',
                    },
                  ].map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', position: 'relative' }}>
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: step.isDone ? '#16a34a' : step.isCurrent ? '#1d4ed8' : '#e2e8f0',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: '800',
                          flexShrink: 0,
                          marginTop: '1px',
                        }}
                      >
                        {step.isDone ? <Check size={13} /> : idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: step.isDone || step.isCurrent ? '#0f172a' : '#94a3b8' }}>
                          {step.label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                          {step.sub}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Destination */}
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} style={{ color: '#1d4ed8' }} /> Destination Address
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                  {selectedDrawerOrder.deliveryContact || 'Customer'}
                </div>
                {selectedDrawerOrder.deliveryPhone && (
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Phone: {selectedDrawerOrder.deliveryPhone}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                  {selectedDrawerOrder.deliveryAddress}
                  <br />
                  {selectedDrawerOrder.deliveryCity} - {selectedDrawerOrder.deliveryPincode}
                </div>
              </div>

              {/* Package Specs & Charges */}
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={14} style={{ color: '#1d4ed8' }} /> Package Specs & Billing
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div style={{ padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontSize: '10px', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Courier</span>
                    <strong style={{ color: '#0f172a' }}>{selectedDrawerOrder.courierName || 'MAXLINE Express'}</strong>
                  </div>
                  <div style={{ padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontSize: '10px', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Mode</span>
                    <strong style={{ color: '#0f172a' }}>{selectedDrawerOrder.paymentMode || 'Prepaid'}</strong>
                  </div>
                  <div style={{ padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontSize: '10px', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Weight</span>
                    <strong style={{ color: '#0f172a' }}>{selectedDrawerOrder.actualWeightKg ?? 0.5} kg</strong>
                  </div>
                  <div style={{ padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontSize: '10px', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Charge</span>
                    <strong style={{ color: '#1d4ed8' }}>₹{(selectedDrawerOrder.totalCustomerChargeINR || 0).toFixed(2)}</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Sticky Drawer Footer Actions */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', display: 'flex', gap: '10px' }}>
              <Button
                variant="primary"
                size="sm"
                style={{ flex: 1, backgroundColor: '#1d4ed8', borderColor: '#1d4ed8', fontWeight: '700' }}
                onClick={() => {
                  const awb = selectedDrawerOrder.awbNumber;
                  setSelectedDrawerOrder(null);
                  navigate(`/app/tracking${awb ? `?awb=${awb}` : ''}`);
                }}
              >
                Full Tracking Page →
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDrawerOrder(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Drawer>

    </div>
  );
};
