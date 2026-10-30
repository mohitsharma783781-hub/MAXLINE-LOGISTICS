import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Package,
  Wallet,
  IndianRupee,
  UserCheck,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
} from '../../components/ui';
import { AdminManagementService, type AdminDashboardStats, type AdminMerchantItem } from '../../services/adminManagementService';
import { CustomerShipmentService } from '../../services/customerShipmentService';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [merchants, setMerchants] = useState<AdminMerchantItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, merchantsData] = await Promise.all([
        AdminManagementService.getDashboardStats(),
        AdminManagementService.getMerchants(),
      ]);
      if (statsData) setStats(statsData);
      if (merchantsData) setMerchants(merchantsData);
    } catch (err) {
      console.warn('[AdminDashboardPage] Error loading admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalMerchants = stats?.merchants.total ?? merchants.length;
  const activeMerchants = stats?.merchants.active ?? merchants.filter((m) => m.status === 'ACTIVE').length;
  const pendingMerchants = stats?.merchants.pending ?? merchants.filter((m) => m.status === 'PENDING_KYC').length;
  const totalShipments = stats?.shipments.total ?? 0;
  const walletCollection = stats?.financials.totalAvailableBalanceINR ?? 0;

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Dashboard', path: '/admin' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* PAGE HEADER */}
      <PageHeader
        title="Admin Operational Dashboard"
        description="Platform operational metrics, merchant onboarding, rate assignments, and live database telemetry."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} className={isLoading ? 'spin' : ''} />}
              onClick={loadData}
              disabled={isLoading}
            >
              Sync Database
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Users size={14} />}
              onClick={() => navigate('/admin/customers')}
            >
              All Customers
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Users size={14} />}
              onClick={() => navigate('/admin/customers')}
            >
              + Register Customer
            </Button>
          </div>
        }
      />

      {/* 6 OPERATIONAL KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <StatCard
          label="TOTAL CUSTOMERS"
          value={totalMerchants}
          subtext="Registered merchant accounts"
          badgeText="DATABASE"
          badgeVariant="neutral"
          icon={Users}
        />
        <StatCard
          label="ACTIVE CUSTOMERS"
          value={activeMerchants}
          subtext="Verified & booking active"
          badgeText="ACTIVE"
          badgeVariant="success"
          icon={UserCheck}
        />
        <StatCard
          label="PENDING KYC"
          value={pendingMerchants}
          subtext="Awaiting verification"
          badgeText="PENDING"
          badgeVariant="warning"
          icon={Clock}
        />
        <StatCard
          label="PLATFORM SHIPMENTS"
          value={totalShipments}
          subtext="Dispatched across couriers"
          badgeText="LIVE"
          badgeVariant="info"
          icon={Package}
        />
        <StatCard
          label="WALLET COLLECTION"
          value={`₹${walletCollection.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtext="Combined customer balance"
          badgeText="FINANCE"
          badgeVariant="info"
          icon={Wallet}
        />
        <StatCard
          label="COD PENDING"
          value="₹0.00"
          subtext="Awaiting carrier payout"
          badgeText="REMITTANCE"
          badgeVariant="warning"
          icon={IndianRupee}
        />
      </div>

      {/* PENDING ACTIONS BAR */}
      <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--color-warning)', marginTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={18} style={{ color: 'var(--color-warning)' }} />
            <div>
              <strong style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                Platform Operational Status
              </strong>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {pendingMerchants} Customer(s) pending onboarding verification • PostgreSQL Cloud connection active
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/customers')}>
            Review Customers →
          </Button>
        </div>
      </Card>

      {/* 2-COLUMN GRID: RECENT CUSTOMERS & RECENT SHIPMENTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
        {/* RECENT CUSTOMERS TABLE */}
        <Card style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: 'var(--color-text-primary)' }}>
              Recent Registered Merchants
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/customers')}>
              View All →
            </Button>
          </div>

          <Table<AdminMerchantItem>
            keyExtractor={(item) => item.id}
            columns={[
              {
                key: 'businessName',
                header: 'Business Name',
                render: (row) => (
                  <div>
                    <strong style={{ fontSize: '12px' }}>{row.businessName}</strong>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{row.ownerEmail}</div>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <Badge variant={row.status === 'ACTIVE' ? 'success' : row.status === 'PENDING_KYC' ? 'warning' : 'danger'}>
                    {row.status}
                  </Badge>
                ),
              },
              {
                key: 'walletBalanceINR',
                header: 'Wallet',
                render: (row) => (
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>
                    ₹{row.walletBalanceINR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'Action',
                align: 'right',
                render: (row) => (
                  <Button variant="outline" size="sm" onClick={() => navigate(`/admin/customers/${row.id}`)}>
                    Manage
                  </Button>
                ),
              },
            ]}
            data={merchants.slice(0, 5)}
          />
        </Card>

        {/* RECENT SHIPMENTS TABLE */}
        <Card style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: 'var(--color-text-primary)' }}>
              Recent Platform Shipments
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/shipments')}>
              View All →
            </Button>
          </div>

          {(() => {
            const liveShipments = CustomerShipmentService.getShipments('all').slice(0, 5).map((s) => ({
              awb: s.awbNumber || s.shipmentId,
              courier: s.courierName,
              status: s.bookingStatus,
              statusText: s.customerFacingStatus || s.bookingStatus,
              amount: `₹${s.totalCustomerChargeINR.toFixed(2)}`,
            }));

            if (liveShipments.length === 0) {
              return (
                <div style={{ padding: '32px 16px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
                  <Package size={28} style={{ color: '#94a3b8', margin: '0 auto 8px auto', display: 'block' }} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block' }}>
                    No shipments booked yet
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                    Real merchant dispatches and AWB numbers will appear here automatically.
                  </span>
                </div>
              );
            }

            return (
              <Table
                columns={[
                  { key: 'awb', header: 'AWB Number', render: (r) => <strong style={{ fontFamily: 'var(--font-mono)' }}>{r.awb}</strong> },
                  { key: 'courier', header: 'Courier' },
                  { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status as any}>{r.statusText}</Badge> },
                  { key: 'amount', header: 'Amount', align: 'right' },
                ]}
                data={liveShipments}
                keyExtractor={(r) => r.awb}
              />
            );
          })()}
        </Card>
      </div>

      {/* QUICK OPERATIONAL SHORTCUTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Card style={{ padding: '14px', cursor: 'pointer' }} onClick={() => navigate('/admin/customers')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: '13px' }}>Customer Profiles</strong>
            <ArrowRight size={14} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
            Review merchant accounts & selling rate cards
          </span>
        </Card>

        <Card style={{ padding: '14px', cursor: 'pointer' }} onClick={() => navigate('/admin/b2b-rates')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: '13px' }}>Rate Card Master</strong>
            <ArrowRight size={14} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
            Configure B2C & B2B customer selling rates
          </span>
        </Card>

        <Card style={{ padding: '14px', cursor: 'pointer' }} onClick={() => navigate('/admin/customer-wallets')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: '13px' }}>Wallet & Ledger</strong>
            <ArrowRight size={14} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
            Post manual credits, debits, and audit balances
          </span>
        </Card>
      </div>
    </div>
  );
};
