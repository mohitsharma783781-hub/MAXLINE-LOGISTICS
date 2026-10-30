import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
  Download,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Table,
  Input,
  Select,
} from '../../components/ui';
import {
  type WalletTransaction,
  type TransactionFilterState,
} from '../../types/wallet';
import { WalletService } from '../../mocks/wallet.mock';
import { formatMinorToINR } from '../../utils/moneyFormat';

export const WalletTransactionsPage: React.FC = () => {
  const navigate = useNavigate();

  const [transactions] = useState<WalletTransaction[]>(() =>
    WalletService.getTransactions()
  );

  // Filter State
  const [filters, setFilters] = useState<TransactionFilterState>({
    searchQuery: '',
    type: 'all',
    direction: 'all',
    status: 'all',
  });

  const filteredTransactions = useMemo(() => {
    return WalletService.getTransactions(filters);
  }, [filters, transactions]);

  const handleResetFilters = () => {
    setFilters({ searchQuery: '', type: 'all', direction: 'all', status: 'all' });
  };

  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Date', 'Type', 'Direction', 'Reference', 'Amount (INR)', 'Balance Before (INR)', 'Balance After (INR)', 'Status'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.createdAt,
      t.type,
      t.direction,
      t.referenceId,
      (t.amountMinor / 100).toFixed(2),
      (t.balanceBeforeMinor / 100).toFixed(2),
      (t.balanceAfterMinor / 100).toFixed(2),
      t.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `wallet_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Wallet', path: '/app/wallet' },
    { label: 'Transactions Ledger', path: '/app/wallet/transactions' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title="Transaction Ledger History"
        description="Auditable ledger history of all wallet balance credits, freight debits, holds and refunds."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/wallet')} leftIcon={<ArrowLeft size={16} />}>
              Back to Wallet
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<Download size={14} />}>
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Search & Filters */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <Input
              placeholder="Search by Transaction ID, Shipment ID, Ref..."
              value={filters.searchQuery}
              onChange={(e) => setFilters((p) => ({ ...p, searchQuery: e.target.value }))}
            />
          </div>

          <Select
            value={filters.type}
            onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
            options={[
              { value: 'all', label: 'All Transaction Types' },
              { value: 'RECHARGE', label: 'Recharge' },
              { value: 'SHIPMENT_CHARGE', label: 'Shipment Charge' },
              { value: 'REFUND', label: 'Refund' },
              { value: 'ADJUSTMENT', label: 'Adjustment' },
              { value: 'RESERVATION', label: 'Reservation' },
            ]}
            style={{ width: '180px' }}
          />

          <Select
            value={filters.direction}
            onChange={(e) => setFilters((p) => ({ ...p, direction: e.target.value }))}
            options={[
              { value: 'all', label: 'All Directions' },
              { value: 'CREDIT', label: 'Credit (+)' },
              { value: 'DEBIT', label: 'Debit (-)' },
            ]}
            style={{ width: '160px' }}
          />

          <Button variant="ghost" size="sm" onClick={handleResetFilters} leftIcon={<RotateCcw size={14} />}>
            Reset
          </Button>
        </div>
      </Card>

      {/* Ledger Table */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <Table<WalletTransaction>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'id',
              header: 'Transaction ID & Ref',
              render: (row) => (
                <div>
                  <button
                    onClick={() => navigate(`/app/wallet/transactions/${row.id}`)}
                    style={{ fontWeight: 'bold', color: 'var(--color-violet-main)', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {row.id}
                  </button>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Ref: {row.referenceId}
                  </div>
                </div>
              ),
            },
            {
              key: 'createdAt',
              header: 'Date & Time',
              render: (row) => <span>{row.createdAt}</span>,
            },
            {
              key: 'type',
              header: 'Type',
              render: (row) => <Badge variant="neutral">{row.type}</Badge>,
            },
            {
              key: 'description',
              header: 'Description / Shipment',
              render: (row) => (
                <div>
                  <span>{row.description}</span>
                  {row.referenceType === 'SHIPMENT' && (
                    <div style={{ marginTop: '2px' }}>
                      <Link to={`/app/shipments/${row.referenceId}`} style={{ fontSize: '11px', color: 'var(--color-violet-main)', fontWeight: 'bold' }}>
                        View Shipment →
                      </Link>
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'direction',
              header: 'Amount',
              render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Badge variant={row.direction === 'CREDIT' ? 'success' : 'danger'}>
                    {row.direction === 'CREDIT' ? '+ CREDIT' : '- DEBIT'}
                  </Badge>
                  <strong style={{ color: row.direction === 'CREDIT' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {row.direction === 'CREDIT' ? '+' : '-'}{formatMinorToINR(row.amountMinor)}
                  </strong>
                </div>
              ),
            },
            {
              key: 'balanceBeforeMinor',
              header: 'Balance Before',
              render: (row) => <span>{formatMinorToINR(row.balanceBeforeMinor)}</span>,
            },
            {
              key: 'balanceAfterMinor',
              header: 'Balance After',
              render: (row) => <strong>{formatMinorToINR(row.balanceAfterMinor)}</strong>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge variant={row.status === 'POSTED' ? 'success' : 'neutral'}>{row.status}</Badge>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/app/wallet/transactions/${row.id}`)}
                >
                  View Log
                </Button>
              ),
            },
          ]}
          data={filteredTransactions}
        />
      </Card>
    </div>
  );
};
