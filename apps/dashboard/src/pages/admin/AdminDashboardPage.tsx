import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Package,
  Wallet,
  IndianRupee,
  UserCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
} from '../../components/ui';
import { DEMO_CUSTOMERS } from './AdminCustomersPage';
import { DEMO_RECENT_SHIPMENTS } from '../../mocks/customerDashboard.mock';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Dashboard', path: '/admin' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* PAGE HEADER */}
      <PageHeader
        title="Admin Operational Dashboard"
        description="Platform operational metrics, merchant onboarding, rate assignments, and recent activity."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
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
          value={DEMO_CUSTOMERS.length}
          subtext="Registered merchant accounts"
          badgeText="CUSTOMERS"
          badgeVariant="neutral"
          icon={Users}
        />
        <StatCard
          label="ACTIVE CUSTOMERS"
          value={DEMO_CUSTOMERS.filter((c) => c.status === 'ACTIVE').length}
          subtext="Verified & booking active"
          badgeText="ACTIVE"
          badgeVariant="success"
          icon={UserCheck}
        />
        <StatCard
          label="PENDING CUSTOMERS"
          value={DEMO_CUSTOMERS.filter((c) => c.status === 'PENDING').length}
          subtext="Awaiting rate card"
          badgeText="PENDING"
          badgeVariant="warning"
          icon={Clock}
        />
        <StatCard
          label="TODAY'S SHIPMENTS"
          value="0"
          subtext="Dispatched across couriers"
          badgeText="TODAY"
          badgeVariant="info"
          icon={Package}
        />
        <StatCard
          label="WALLET COLLECTION"
          value="₹0.00"
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
      <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--color-warning)', marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={18} style={{ color: 'var(--color-warning)' }} />
            <div>
              <strong style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                Pending Operational Actions
              </strong>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                0 Customers pending rate card assignment • 0 NDR exceptions pending merchant instructions
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
              Recent Customers
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/customers')}>
              View All →
            </Button>
          </div>

          <Table<typeof DEMO_CUSTOMERS[0]>
            keyExtractor={(item) => item.id}
            columns={[
              {
                key: 'name',
                header: 'Business Name',
                render: (row) => (
                  <div>
                    <strong style={{ fontSize: '12px' }}>{row.companyName}</strong>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{row.email}</div>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <Badge variant={row.status === 'ACTIVE' ? 'success' : row.status === 'PENDING' ? 'warning' : 'danger'}>
                    {row.status}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Action',
                align: 'right',
                render: (row) => (
                  <Button variant="outline" size="sm" onClick={() => navigate(`/admin/customers/${row.id}`)}>
                    Profile
                  </Button>
                ),
              },
            ]}
            data={DEMO_CUSTOMERS.slice(0, 4)}
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

          <Table
            columns={[
              { key: 'awb', header: 'AWB Number', render: (r) => <strong style={{ fontFamily: 'var(--font-mono)' }}>{r.awb}</strong> },
              { key: 'courier', header: 'Courier' },
              { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status as any}>{r.statusText}</Badge> },
              { key: 'amount', header: 'Amount', align: 'right' },
            ]}
            data={DEMO_RECENT_SHIPMENTS.slice(0, 4)}
            keyExtractor={(r) => r.awb}
          />
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
