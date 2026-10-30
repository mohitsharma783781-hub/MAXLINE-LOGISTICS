import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Settings,
  RotateCcw,
  CheckCircle2,
  FileCheck,
  Receipt,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  SearchInput,
  Select,
  Alert,
  ConfirmationDialog,
} from '../../components/ui';
import {
  type Invoice,
  type BillingFilterState,
  INVOICE_STATUS_CONFIG,
} from '../../types/billing';
import { BillingService } from '../../mocks/billing.mock';
import { formatMinorToINR } from '../../utils/moneyFormat';

export const BillingPage: React.FC = () => {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>(() => BillingService.getInvoices());
  const [alertMessage, setAlertMessage] = useState<{ variant: 'success' | 'danger'; text: string } | null>(null);
  const [voidTargetId, setVoidTargetId] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<BillingFilterState>({
    searchQuery: '',
    status: 'all',
    type: 'all',
  });

  const filteredInvoices = useMemo(() => {
    return BillingService.getInvoices(filters);
  }, [filters, invoices]);

  const refreshInvoices = () => {
    setInvoices(BillingService.getInvoices());
  };

  const handleResetFilters = () => {
    setFilters({ searchQuery: '', status: 'all', type: 'all' });
  };

  const handleGenerateInvoice = () => {
    const newInv = BillingService.createDemoInvoice('Rahul Sharma', 150.0);
    refreshInvoices();
    setAlertMessage({
      variant: 'success',
      text: `Tax Invoice ${newInv.invoiceNumber} generated successfully for ${newInv.customerName}.`,
    });
  };

  const handleConfirmVoid = () => {
    if (!voidTargetId) return;
    const res = BillingService.voidInvoice(voidTargetId);
    refreshInvoices();
    setVoidTargetId(null);
    if (res.success) {
      setAlertMessage({ variant: 'success', text: res.message });
    } else {
      setAlertMessage({ variant: 'danger', text: res.message });
    }
  };

  // KPI Computations
  const totalBilledMinor = invoices.reduce((acc, i) => (i.type === 'TAX_INVOICE' && i.status !== 'VOID' ? acc + i.totalMinor : acc), 0);
  const paidBilledMinor = invoices.reduce((acc, i) => (i.status === 'PAID' ? acc + i.totalMinor : acc), 0);
  const creditNotesMinor = invoices.reduce((acc, i) => (i.type === 'CREDIT_NOTE' ? acc + i.totalMinor : acc), 0);

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Finance', path: '/app/wallet' },
    { label: 'Invoices & Billing', path: '/app/billing' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title="Invoices & Billing History"
        description="Manage customer tax invoices, line-item freight charges, credit notes, and tax audit records."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/settings/billing')} leftIcon={<Settings size={14} />}>
              Billing & Tax Settings
            </Button>
            <Button variant="primary" size="sm" onClick={handleGenerateInvoice} leftIcon={<Plus size={14} />}>
              + Generate Tax Invoice (Demo)
            </Button>
          </div>
        }
      />

      {alertMessage && (
        <Alert variant={alertMessage.variant} title="Billing Status Update">
          {alertMessage.text}
        </Alert>
      )}

      {/* KPI STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard
          label="Total Billed"
          value={formatMinorToINR(totalBilledMinor)}
          subtext="Tax Invoices issued"
          icon={Receipt}
        />
        <StatCard
          label="Paid Invoices"
          value={formatMinorToINR(paidBilledMinor)}
          subtext="Settled via wallet / gateway"
          icon={CheckCircle2}
        />
        <StatCard
          label="Credit Notes / Refunded"
          value={formatMinorToINR(creditNotesMinor)}
          subtext="Adjustment credit notes"
          icon={RotateCcw}
        />
        <StatCard
          label="Active Tax Mode"
          value="18% GST"
          subtext="TAX_EXCLUSIVE mode"
          icon={FileCheck}
        />
      </div>

      {/* SEARCH & FILTERS */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <SearchInput
              placeholder="Search by Invoice Number, Customer, AWB..."
              value={filters.searchQuery}
              onChange={(e) => setFilters((p) => ({ ...p, searchQuery: e.target.value }))}
            />
          </div>

          <Select
            value={filters.type}
            onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
            options={[
              { value: 'all', label: 'All Document Types' },
              { value: 'TAX_INVOICE', label: 'Tax Invoice' },
              { value: 'CREDIT_NOTE', label: 'Credit Note' },
              { value: 'DEBIT_NOTE', label: 'Debit Note' },
            ]}
            style={{ width: '180px' }}
          />

          <Select
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'ISSUED', label: 'Issued' },
              { value: 'PAID', label: 'Paid' },
              { value: 'VOID', label: 'Void' },
            ]}
            style={{ width: '160px' }}
          />

          <Button variant="ghost" size="sm" onClick={handleResetFilters} leftIcon={<RotateCcw size={14} />}>
            Reset
          </Button>
        </div>
      </Card>

      {/* INVOICE TABLE */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <Table<Invoice>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'invoiceNumber',
              header: 'Invoice Number',
              render: (row) => (
                <div>
                  <strong style={{ color: 'var(--color-violet-main)' }}>{row.invoiceNumber}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    ID: {row.id}
                  </div>
                </div>
              ),
            },
            {
              key: 'customerName',
              header: 'Customer',
              render: (row) => (
                <div>
                  <div style={{ fontWeight: 'bold' }}>👤 {row.customerName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{row.customerEmail}</div>
                </div>
              ),
            },
            {
              key: 'type',
              header: 'Type',
              render: (row) => (
                <Badge variant={row.type === 'TAX_INVOICE' ? 'brand' : row.type === 'CREDIT_NOTE' ? 'info' : 'warning'}>
                  {row.type}
                </Badge>
              ),
            },
            {
              key: 'totalMinor',
              header: 'Total Amount',
              render: (row) => (
                <strong style={{ color: row.type === 'CREDIT_NOTE' ? 'var(--color-info)' : 'var(--color-violet-main)' }}>
                  {formatMinorToINR(row.totalMinor)}
                </strong>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => {
                const conf = INVOICE_STATUS_CONFIG.find((c) => c.key === row.status);
                return <Badge variant={conf?.variant || 'neutral'}>{conf?.label || row.status}</Badge>;
              },
            },
            {
              key: 'issuedAt',
              header: 'Issue Date',
              render: (row) => <span>{row.issuedAt || row.createdAt}</span>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/app/billing/invoices/${row.id}`)}
                  >
                    View Document
                  </Button>

                  {row.status !== 'PAID' && row.status !== 'VOID' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVoidTargetId(row.id)}
                    >
                      Void
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={filteredInvoices}
        />
      </Card>

      {/* VOID CONFIRMATION DIALOG */}
      <ConfirmationDialog
        isOpen={!!voidTargetId}
        onClose={() => setVoidTargetId(null)}
        onConfirm={handleConfirmVoid}
        title="Void Selected Invoice?"
        description="Voiding an invoice cancels it without altering ledger balances. Voided invoices cannot be issued again."
        confirmLabel="Void Invoice"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
};
