import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  RotateCcw,
  ArrowDownLeft,
  Search,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Alert,
  Modal,
  Input,
  Select,
  Drawer,
  Pagination,
} from '../../components/ui';
import {
  type Wallet,
  type WalletTransaction,
} from '../../types/wallet';
import { WalletService } from '../../mocks/wallet.mock';
import { formatCurrency } from '../../utils/formatters';
import { useTenant } from '../../context/TenantContext';
import { RazorpayService } from '../../services/razorpayService';

export const WalletPage: React.FC = () => {
  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId;

  const [wallet, setWallet] = useState<Wallet>(() => WalletService.getWallet(tenantId));
  const [rechargeAmount, setRechargeAmount] = useState<string>('1000');
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isRecharging, setIsRecharging] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ variant: 'success' | 'danger' | 'warning'; title: string; text: string } | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'last7' | 'last30'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination & Drawer State
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Automatically sync with Supabase Cloud DB on mount
  useEffect(() => {
    WalletService.syncFromSupabase(tenantId)
      .then((cloudWallet) => {
        setWallet({ ...cloudWallet });
        setIsCloudSynced(true);
      })
      .catch(() => {});
  }, [tenantId]);

  // Refresh wallet & transactions
  const refreshData = () => {
    WalletService.syncFromSupabase(tenantId)
      .then((cloudWallet) => {
        setWallet({ ...cloudWallet });
        setIsCloudSynced(true);
      })
      .catch(() => {
        setWallet(WalletService.getWallet(tenantId));
      });
  };

  // Summary Metrics
  const summaryStats = useMemo(() => {
    return WalletService.getWalletSummaryStats(tenantId);
  }, [wallet, tenantId]);

  // Query Filtered Ledger Transactions
  const filteredTransactions = useMemo(() => {
    return WalletService.getTransactions(
      {
        searchQuery,
        status: statusFilter,
        direction: 'all',
        type: typeFilter,
      },
      tenantId
    );
  }, [searchQuery, statusFilter, typeFilter, wallet, tenantId]);

  // Pagination Math
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Handle Add Money / Recharge via Razorpay Standard Checkout
  const handleExecuteRecharge = async () => {
    const amt = parseFloat(rechargeAmount);
    if (!amt || isNaN(amt) || amt < 1) {
      setAlertMessage({
        variant: 'warning',
        title: 'Invalid Amount',
        text: 'Please enter a valid amount of at least ₹1.00.',
      });
      return;
    }

    setIsRecharging(true);

    try {
      await RazorpayService.openCheckout({
        amountINR: amt,
        name: 'MAXLINE LOGISTICS',
        description: `Wallet Balance Top-Up: ₹${amt.toLocaleString('en-IN')}`,
        notes: {
          tenantId,
          purpose: 'WALLET_RECHARGE',
        },
        onSuccess: (data) => {
          // Credit the wallet with the verified payment
          WalletService.recharge(amt, `Razorpay (${data.payment_id})`, tenantId);
          setWallet(WalletService.getWallet(tenantId));
          setIsRechargeModalOpen(false);
          setIsRecharging(false);
          setAlertMessage({
            variant: 'success',
            title: 'Payment Successful',
            text: `₹${amt.toLocaleString('en-IN')} credited to your wallet via Razorpay (Payment ID: ${data.payment_id}).`,
          });
          setTimeout(() => setAlertMessage(null), 8000);
        },
        onError: (err) => {
          setIsRecharging(false);
          setAlertMessage({
            variant: 'danger',
            title: 'Payment Failed',
            text: err.message || 'Payment could not be completed. Please try again.',
          });
          setTimeout(() => setAlertMessage(null), 8000);
        },
        onDismiss: () => {
          setIsRecharging(false);
        },
      });
    } catch (err: any) {
      setIsRecharging(false);
      setAlertMessage({
        variant: 'danger',
        title: 'Checkout Error',
        text: err?.message || 'Failed to initialize payment gateway.',
      });
      setTimeout(() => setAlertMessage(null), 8000);
    }
  };

  // Handle Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setDateRange('all');
    setTypeFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // Export Ledger CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No ledger transactions available to export.');
      return;
    }

    const headers = [
      'Transaction ID',
      'Date/Time',
      'Type',
      'Direction',
      'Reference ID',
      'Amount (INR)',
      'Balance Before (INR)',
      'Balance After (INR)',
      'Status',
      'Description',
    ];

    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.createdAt,
      tx.type,
      tx.direction,
      tx.referenceId,
      (tx.direction === 'CREDIT' ? '+' : '-') + (tx.amountMinor / 100).toFixed(2),
      (tx.balanceBeforeMinor / 100).toFixed(2),
      (tx.balanceAfterMinor / 100).toFixed(2),
      tx.status,
      `"${tx.description}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Wallet_Ledger_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Finance & Wallet', path: '/app/wallet' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Merchant Wallet & Financial Ledger"
        description="Manage your prepaid shipping balance, track automated dispatch debits, handle refunds, and inspect auditable transaction history."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {isCloudSynced && (
              <Badge variant="success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px' }}>
                <ShieldCheck size={12} /> Supabase Cloud Synced
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<FileSpreadsheet size={15} />}>
              Export Ledger CSV
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsRechargeModalOpen(true)} leftIcon={<Plus size={15} />}>
              + Add Money
            </Button>
          </div>
        }
      />

      {/* ALERT BANNERS */}
      {alertMessage && (
        <Alert variant={alertMessage.variant} title={alertMessage.title}>
          {alertMessage.text}
        </Alert>
      )}

      {summaryStats.isLowBalance && (
        <Alert variant="warning" title="Low Wallet Balance Warning">
          Your wallet balance ({formatCurrency(summaryStats.availableBalanceINR)}) is below the recommended threshold ({formatCurrency(summaryStats.lowBalanceThresholdINR)}). Please recharge to avoid shipment booking interruptions.
        </Alert>
      )}

      {/* 2. SUMMARY KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard
          label="Available Wallet Balance"
          value={formatCurrency(summaryStats.availableBalanceINR)}
          subtext="Usable prepaid shipping funds"
          badgeText={summaryStats.isLowBalance ? 'LOW BALANCE' : 'ACTIVE'}
          badgeVariant={summaryStats.isLowBalance ? 'warning' : 'success'}
          icon={WalletIcon}
        />
        <StatCard
          label="Total Credited (Added)"
          value={formatCurrency(summaryStats.totalAddedINR)}
          subtext="Successful recharges & refunds"
          icon={ArrowDownLeft}
        />
        <StatCard
          label="Total Debited (Used)"
          value={formatCurrency(summaryStats.totalUsedINR)}
          subtext="Spent on freight dispatches"
          icon={ArrowUpRight}
        />
      </div>

      {/* 3. PROMINENT SEARCH BAR */}
      <Card style={{ padding: 'var(--space-3.5)' }}>
        <Input
          placeholder="Search AWB, Order ID, Transaction ID, or Reference..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          leadingIcon={<Search size={16} />}
        />
      </Card>

      {/* 4. HORIZONTAL FILTER BAR */}
      <Card style={{ padding: 'var(--space-3.5)' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Date Range Filter */}
          <div style={{ width: '150px' }}>
            <Select
              value={dateRange}
              onChange={(e) => { setDateRange(e.target.value as any); setCurrentPage(1); }}
              options={[
                { label: 'Date: All Time', value: 'all' },
                { label: 'Today', value: 'today' },
                { label: 'Last 7 Days', value: 'last7' },
                { label: 'Last 30 Days', value: 'last30' },
              ]}
            />
          </div>

          {/* Transaction Type Filter */}
          <div style={{ width: '180px' }}>
            <Select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              options={[
                { label: 'Type: All', value: 'all' },
                { label: 'Wallet Recharge', value: 'RECHARGE' },
                { label: 'Shipment Booking', value: 'SHIPMENT_CHARGE' },
                { label: 'Refund Credit', value: 'REFUND' },
                { label: 'Adjustment', value: 'ADJUSTMENT' },
              ]}
            />
          </div>

          {/* Status Filter */}
          <div style={{ width: '150px' }}>
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              options={[
                { label: 'Status: All', value: 'all' },
                { label: 'Posted', value: 'POSTED' },
                { label: 'Pending', value: 'PENDING' },
              ]}
            />
          </div>

          {/* Reset Filters */}
          <Button variant="ghost" size="sm" onClick={handleResetFilters} leftIcon={<RotateCcw size={14} />}>
            Reset Filters
          </Button>
        </div>
      </Card>

      {/* 5. WALLET TRANSACTIONS LEDGER TABLE */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          Audited Wallet Transactions Ledger
        </div>

        <Table<WalletTransaction>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'id',
              header: 'Transaction ID & Ref',
              render: (row) => (
                <div>
                  <strong
                    style={{ color: 'var(--color-violet-main)', cursor: 'pointer', fontFamily: 'monospace' }}
                    onClick={() => setSelectedTx(row)}
                  >
                    {row.id}
                  </strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    Ref: <strong>{row.referenceId}</strong>
                  </div>
                </div>
              ),
            },
            {
              key: 'createdAt',
              header: 'Date/Time',
              render: (row) => <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{row.createdAt}</span>,
            },
            {
              key: 'type',
              header: 'Transaction Type',
              render: (row) => <Badge variant="neutral">{row.type}</Badge>,
            },
            {
              key: 'amountMinor',
              header: 'Direction & Amount',
              render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Badge variant={row.direction === 'CREDIT' ? 'success' : 'danger'}>
                    {row.direction === 'CREDIT' ? '+ CREDIT' : '- DEBIT'}
                  </Badge>
                  <strong style={{ color: row.direction === 'CREDIT' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {row.direction === 'CREDIT' ? '+' : '-'}{formatCurrency(row.amountMinor / 100)}
                  </strong>
                </div>
              ),
            },
            {
              key: 'balanceAfterMinor',
              header: 'Balance After',
              render: (row) => <strong>{formatCurrency(row.balanceAfterMinor / 100)}</strong>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge variant={row.status === 'POSTED' ? 'success' : 'warning'}>{row.status}</Badge>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <Button variant="outline" size="sm" onClick={() => setSelectedTx(row)}>
                  View Audit
                </Button>
              ),
            },
          ]}
          data={paginatedTransactions}
        />

        {/* Pagination Controls */}
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Showing {filteredTransactions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
            {Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length} transactions
          </span>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </Card>

      {/* 6. ADD MONEY MODAL */}
      <Modal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        title="+ Add Money to Shipping Wallet"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
              Select Quick Amount (₹):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[500, 1000, 2000, 5000].map((amt) => (
                <Button
                  key={amt}
                  variant={rechargeAmount === amt.toString() ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setRechargeAmount(amt.toString())}
                >
                  ₹{amt.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          <Input
            label="Or Enter Custom Amount (₹) *"
            type="number"
            value={rechargeAmount}
            onChange={(e) => setRechargeAmount(e.target.value)}
          />

          <div style={{ padding: '12px 14px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '13px', color: '#1e40af', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🔒</span>
            <div>
              <strong>Secure Razorpay Payment:</strong> 100% encrypted & authenticated. Supports UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, and Wallets.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Button variant="ghost" onClick={() => setIsRechargeModalOpen(false)} disabled={isRecharging}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExecuteRecharge}
              disabled={isRecharging}
              style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
            >
              {isRecharging ? 'Opening Razorpay...' : `Pay ₹${parseFloat(rechargeAmount || '0').toLocaleString('en-IN')} with Razorpay`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 7. TRANSACTION AUDIT DRAWER */}
      {selectedTx && (
        <Drawer
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
          title={`Ledger Audit — ${selectedTx.id}`}
          position="right"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px' }}>
            <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <Badge variant={selectedTx.direction === 'CREDIT' ? 'success' : 'danger'}>
                {selectedTx.direction === 'CREDIT' ? '+ CREDIT TRANSACTION' : '- DEBIT TRANSACTION'}
              </Badge>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '6px', color: selectedTx.direction === 'CREDIT' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {selectedTx.direction === 'CREDIT' ? '+' : '-'}{formatCurrency(selectedTx.amountMinor / 100)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
              <div>Transaction ID: <strong style={{ display: 'block', fontFamily: 'monospace' }}>{selectedTx.id}</strong></div>
              <div>Reference ID: <strong style={{ display: 'block', fontFamily: 'monospace' }}>{selectedTx.referenceId}</strong></div>
              <div>Date & Time: <strong style={{ display: 'block' }}>{selectedTx.createdAt}</strong></div>
              <div>Status: <Badge variant="success">{selectedTx.status}</Badge></div>
              <div>Previous Balance: <strong>{formatCurrency(selectedTx.balanceBeforeMinor / 100)}</strong></div>
              <div>New Balance: <strong>{formatCurrency(selectedTx.balanceAfterMinor / 100)}</strong></div>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface-secondary)', padding: '12px', borderRadius: '6px', fontSize: '12px' }}>
              <strong>Description:</strong>
              <div style={{ marginTop: '4px', color: 'var(--color-text-secondary)' }}>{selectedTx.description}</div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
