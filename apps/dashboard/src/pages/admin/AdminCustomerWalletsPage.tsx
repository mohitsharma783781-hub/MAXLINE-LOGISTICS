import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Input,
  ConfirmationDialog,
} from '../../components/ui';

export interface TenantWalletItem extends Record<string, unknown> {
  id: string;
  tenantId: string;
  merchantName: string;
  email: string;
  balance: number;
  totalRecharged: number;
  totalSpent: number;
  creditLimit: number;
  status: 'ACTIVE' | 'FROZEN';
  lastRechargeDate: string;
}

export const DEMO_TENANT_WALLETS: TenantWalletItem[] = [
  { id: 'w-01', tenantId: 'tenant-demo-01', merchantName: 'Apex Logistics & Retail', email: 'admin@apexretail.com', balance: 45000, totalRecharged: 250000, totalSpent: 205000, creditLimit: 50000, status: 'ACTIVE', lastRechargeDate: '2026-08-15' },
  { id: 'w-02', tenantId: 'tenant-demo-02', merchantName: 'Zenith Online Stores', email: 'support@zenith.com', balance: 12500, totalRecharged: 100000, totalSpent: 87500, creditLimit: 10000, status: 'ACTIVE', lastRechargeDate: '2026-08-10' },
  { id: 'w-03', tenantId: 'tenant-demo-03', merchantName: 'Nova Enterprise Solutions', email: 'ops@novabrands.in', balance: 180000, totalRecharged: 500000, totalSpent: 320000, creditLimit: 100000, status: 'ACTIVE', lastRechargeDate: '2026-08-20' },
];

export const AdminCustomerWalletsPage: React.FC = () => {
  const [wallets, setWallets] = useState<TenantWalletItem[]>(DEMO_TENANT_WALLETS);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  const [isCreditOpen, setIsCreditOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState('5000');
  const [creditReason, setCreditReason] = useState('Promotional Bonus');

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);

  const handleApplyCredit = () => {
    if (!selectedWalletId || !creditAmount) return;
    const amt = parseFloat(creditAmount);
    setWallets((prev) =>
      prev.map((w) => (w.id === selectedWalletId ? { ...w, balance: w.balance + amt, totalRecharged: w.totalRecharged + amt } : w))
    );
    setIsCreditOpen(false);
    alert(`Successfully credited ₹${amt} to ${selectedWallet?.merchantName}`);
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Finance & Wallets', path: '/admin/wallet' },
    { label: 'Customer Wallets', path: '/admin/customer-wallets' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      <PageHeader
        title="Customer Wallet Management"
        description="Monitor multi-tenant merchant wallet balances, perform credit/debit adjustments, and inspect transaction ledgers."
        breadcrumbs={breadcrumbs}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard
          label="Total Merchant Reserves"
          value={`₹${wallets.reduce((sum, w) => sum + w.balance, 0).toLocaleString()}`}
          subtext="Combined tenant balance"
          icon={Wallet}
        />
        <StatCard
          label="Total Recharges"
          value={`₹${wallets.reduce((sum, w) => sum + w.totalRecharged, 0).toLocaleString()}`}
          subtext="All-time deposit volume"
          icon={ArrowUpRight}
        />
        <StatCard
          label="Total Shipping Spend"
          value={`₹${wallets.reduce((sum, w) => sum + w.totalSpent, 0).toLocaleString()}`}
          subtext="All-time debit volume"
          icon={ArrowDownLeft}
        />
      </div>

      <Card style={{ padding: 'var(--space-6)' }}>
        <Table<TenantWalletItem>
          keyExtractor={(item) => item.id}
          columns={[
            {
              key: 'merchantName',
              header: 'Merchant & Email',
              render: (row) => (
                <div>
                  <strong>{row.merchantName}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{row.email} • Tenant: {row.tenantId}</div>
                </div>
              ),
            },
            {
              key: 'balance',
              header: 'Available Balance',
              render: (row) => (
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-violet-main)' }}>
                  ₹{row.balance.toLocaleString()}
                </span>
              ),
            },
            {
              key: 'totalRecharged',
              header: 'Total Recharged',
              render: (row) => <span>₹{row.totalRecharged.toLocaleString()}</span>,
            },
            {
              key: 'totalSpent',
              header: 'Total Spent',
              render: (row) => <span>₹{row.totalSpent.toLocaleString()}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge variant={row.status === 'ACTIVE' ? 'success' : 'danger'}>{row.status}</Badge>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => { setSelectedWalletId(row.id); setIsCreditOpen(true); }}
                  >
                    + Credit Adjustment
                  </Button>
                </div>
              ),
            },
          ]}
          data={wallets}
        />
      </Card>

      {isCreditOpen && (
        <ConfirmationDialog
          isOpen={isCreditOpen}
          onClose={() => setIsCreditOpen(false)}
          onConfirm={handleApplyCredit}
          title={`Credit Adjustment for ${selectedWallet?.merchantName}`}
          description="Add funds or promotional credit to merchant wallet."
          confirmLabel="Apply Credit"
          cancelLabel="Cancel"
          variant="primary"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Input
              label="Credit Amount (₹) *"
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
            />
            <Input
              label="Adjustment Reason *"
              placeholder="e.g. Promotional Signup Bonus"
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
            />
          </div>
        </ConfirmationDialog>
      )}
    </div>
  );
};
