import React, { useState, useMemo } from 'react';
import { IndianRupee, CheckCircle2, Clock, Eye, Zap, Settings, Wallet, Landmark, Search, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Modal,
  Alert,
  Input,
  Select,
  Pagination,
} from '../../components/ui';
import {
  CustomerCodService,
  type CodRemittanceRecord,
  type CodTransactionRecord,
  type EarlyCodPlanType,
  type PayoutDestinationType,
} from '../../services/customerCodService';
import { formatCurrency } from '../../utils/formatters';

export const CodDashboardPage: React.FC = () => {
  const tenantId = 'tenant-demo-01';
  const [activeTab, setActiveTab] = useState<'transactions' | 'remittances' | 'settings'>('transactions');
  const [selectedRemittance, setSelectedRemittance] = useState<CodRemittanceRecord | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Early COD Modal State
  const [isInstantClaimModalOpen, setIsInstantClaimModalOpen] = useState(false);
  const [payoutDestination, setPayoutDestination] = useState<PayoutDestinationType>('WALLET');
  const payoutPlanFeePercent = 1.0;
  const [successReceipt, setSuccessReceipt] = useState<CodRemittanceRecord | null>(null);

  // Early COD Config State
  const [earlyCodConfig, setEarlyCodConfig] = useState(() => CustomerCodService.getEarlyCodConfig(tenantId));
  const [selectedPlanType, setSelectedPlanType] = useState<EarlyCodPlanType>(earlyCodConfig.activePlan);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const stats = CustomerCodService.getCodSummaryStats(tenantId);

  // Query Filtered COD Data
  const filteredTransactions = useMemo(() => {
    return CustomerCodService.queryCodTransactions({
      tenantId,
      searchQuery,
      statusFilter,
    });
  }, [tenantId, searchQuery, statusFilter]);

  const filteredRemittances = useMemo(() => {
    return CustomerCodService.queryRemittances({
      tenantId,
      searchQuery,
      statusFilter,
    });
  }, [tenantId, searchQuery, statusFilter]);

  // Pagination Math
  const activeListLength = activeTab === 'transactions' ? filteredTransactions.length : filteredRemittances.length;
  const totalPages = Math.ceil(activeListLength / pageSize) || 1;

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const paginatedRemittances = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRemittances.slice(start, start + pageSize);
  }, [filteredRemittances, currentPage, pageSize]);

  // Instant Payout Calculation
  const eligibleTxs = CustomerCodService.getCodTransactions(tenantId).filter((t) => t.status === 'ELIGIBLE_FOR_REMITTANCE');
  const grossEligibleAmount = eligibleTxs.reduce((sum, t) => sum + t.codAmountINR, 0);
  const estimatedStandardDeductions = Math.round(grossEligibleAmount * 0.01);
  const estimatedEarlyFee = Math.round(grossEligibleAmount * (payoutPlanFeePercent / 100));
  const netEstimatedPayout = grossEligibleAmount - estimatedStandardDeductions - estimatedEarlyFee;

  const handleClaimInstantPayout = () => {
    try {
      const rec = CustomerCodService.claimInstantCodPayout(tenantId, payoutDestination, payoutPlanFeePercent);
      setSuccessReceipt(rec);
    } catch (err: any) {
      alert(err?.message || 'Failed to claim instant payout.');
    }
  };

  const handleSavePlanSettings = () => {
    const updated = CustomerCodService.updateEarlyCodPlan(tenantId, selectedPlanType);
    setEarlyCodConfig({ ...updated });
    setToastMessage(`Early COD Plan updated to ${selectedPlanType === 'INSTANT_T0' ? 'Instant T+0 Same Day' : selectedPlanType === 'EARLY_T2' ? 'Early T+2 Days' : 'Standard T+7 Days'}.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Export COD Report CSV
  const handleExportCSV = () => {
    if (activeTab === 'transactions') {
      if (filteredTransactions.length === 0) return alert('No COD transactions to export.');
      const headers = ['Shipment ID', 'AWB Number', 'Order ID', 'Delivered Date', 'COD Amount (INR)', 'Remittance Status', 'Remittance ID'];
      const rows = filteredTransactions.map((t) => [t.shipmentId, t.awbNumber, t.orderId, t.deliveredDate, t.codAmountINR, t.status, t.remittanceId || 'PENDING']);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `COD_Shipments_Export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } else {
      if (filteredRemittances.length === 0) return alert('No COD remittances to export.');
      const headers = ['Remittance ID', 'Date', 'Shipment Count', 'Gross COD (INR)', 'Net Remitted (INR)', 'Destination', 'Status', 'UTR Ref'];
      const rows = filteredRemittances.map((r) => [r.remittanceId, r.remittanceDate, r.shipmentCount, r.grossCodAmountINR, r.netRemittanceINR, r.payoutDestination, r.status, r.bankReferenceId || 'N/A']);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `COD_Remittances_Export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'COD Remittance & Settlement', path: '/app/cod' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Cash on Delivery (COD) Remittance & Settlement Dashboard"
        description="Monitor Cash on Delivery collections, pending settlements, bank payouts, and instant early COD remittances."
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<FileSpreadsheet size={15} />}>
            Export COD Report
          </Button>
        }
      />

      {toastMessage && (
        <Alert variant="success" title="Early COD Settings Updated">
          {toastMessage}
        </Alert>
      )}

      {/* 2. Overview Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="COD Collected (Total)" value={formatCurrency(stats.totalCodValueINR)} subtext={`${stats.totalCodShipments} Total COD dispatches`} icon={IndianRupee} />
        <StatCard label="COD Pending Settlement" value={formatCurrency(stats.pendingRemittanceINR)} subtext={`${stats.deliveredCodCount} Delivered COD orders awaiting settlement`} icon={Clock} />
        <StatCard label="COD Remitted (Paid)" value={formatCurrency(stats.remittedCodINR)} subtext="Successfully remitted to merchant" icon={CheckCircle2} />
        <StatCard label="Next Settlement Cycle" value={earlyCodConfig.activePlan === 'INSTANT_T0' ? 'Instant T+0' : earlyCodConfig.activePlan === 'EARLY_T2' ? 'Early T+2' : 'T+7 Standard'} subtext="Configured settlement schedule" icon={Landmark} />
      </div>

      {/* 3. EARLY COD HERO BANNER */}
      <Card style={{ padding: '20px', borderLeft: '4px solid #8b5cf6', backgroundColor: 'var(--color-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Zap size={20} style={{ color: '#8b5cf6' }} />
            <strong style={{ fontSize: '16px', color: 'var(--color-text-primary)' }}>
              ⚡ Instant COD Payout & Early Remittance Available
            </strong>
            <Badge variant="brand">T+0 SAME DAY</Badge>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, maxWidth: '650px' }}>
            You have <strong style={{ color: 'var(--color-success)' }}>{formatCurrency(grossEligibleAmount)}</strong> in delivered COD orders waiting for standard settlement. Claim an instant payout to your bank or shipping wallet today!
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Button variant="outline" size="sm" leftIcon={<Settings size={14} />} onClick={() => setActiveTab('settings')}>
            Settings
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Zap size={16} />}
            disabled={eligibleTxs.length === 0}
            onClick={() => { setSuccessReceipt(null); setIsInstantClaimModalOpen(true); }}
            style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}
          >
            ⚡ Claim Instant Payout ({formatCurrency(grossEligibleAmount)})
          </Button>
        </div>
      </Card>

      {/* 4. Navigation Tabs */}
      <Card style={{ padding: 'var(--space-2)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            onClick={() => { setActiveTab('transactions'); setCurrentPage(1); }}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-default)',
              border: 'none',
              backgroundColor: activeTab === 'transactions' ? 'var(--color-violet-light)' : 'transparent',
              color: activeTab === 'transactions' ? 'var(--color-violet-main)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'transactions' ? 'bold' : 'normal',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            COD Shipment Transactions ({filteredTransactions.length})
          </button>

          <button
            onClick={() => { setActiveTab('remittances'); setCurrentPage(1); }}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-default)',
              border: 'none',
              backgroundColor: activeTab === 'remittances' ? 'var(--color-violet-light)' : 'transparent',
              color: activeTab === 'remittances' ? 'var(--color-violet-main)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'remittances' ? 'bold' : 'normal',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Remittance Payout History ({filteredRemittances.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-default)',
              border: 'none',
              backgroundColor: activeTab === 'settings' ? 'var(--color-violet-light)' : 'transparent',
              color: activeTab === 'settings' ? 'var(--color-violet-main)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'settings' ? 'bold' : 'normal',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Early COD Settings
          </button>
        </div>
      </Card>

      {/* 5. SEARCH & FILTERS BAR */}
      {activeTab !== 'settings' && (
        <Card style={{ padding: 'var(--space-3.5)' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <Input
                placeholder="Search AWB, Order ID, Remittance ID, UTR..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                leadingIcon={<Search size={16} />}
              />
            </div>

            <div style={{ width: '180px' }}>
              <Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                options={
                  activeTab === 'transactions'
                    ? [
                        { label: 'Status: All', value: 'all' },
                        { label: 'Pending Delivery', value: 'PENDING_DELIVERY' },
                        { label: 'Eligible for Payout', value: 'ELIGIBLE_FOR_REMITTANCE' },
                        { label: 'Remitted', value: 'REMITTED' },
                      ]
                    : [
                        { label: 'Status: All', value: 'all' },
                        { label: 'Remitted', value: 'REMITTED' },
                        { label: 'Processing', value: 'PROCESSING' },
                      ]
                }
              />
            </div>

            <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('all'); setCurrentPage(1); }} leftIcon={<RotateCcw size={14} />}>
              Reset
            </Button>
          </div>
        </Card>
      )}

      {/* TAB 1: COD TRANSACTIONS TABLE */}
      {activeTab === 'transactions' && (
        <Card style={{ padding: 'var(--space-4)' }}>
          <Table<CodTransactionRecord>
            keyExtractor={(r) => r.id}
            columns={[
              {
                key: 'shipmentId',
                header: 'Shipment & AWB',
                render: (r) => (
                  <div>
                    <strong style={{ color: 'var(--color-violet-main)' }}>{r.shipmentId}</strong>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                      AWB: {r.awbNumber}
                    </div>
                  </div>
                ),
              },
              { key: 'orderId', header: 'Order ID', render: (r) => <span>{r.orderId}</span> },
              { key: 'codAmountINR', header: 'COD Amount', render: (r) => <strong style={{ color: 'var(--color-violet-main)' }}>{formatCurrency(r.codAmountINR)}</strong> },
              { key: 'deliveredDate', header: 'Delivered Date', render: (r) => <span>{r.deliveredDate}</span> },
              {
                key: 'status',
                header: 'COD Status',
                render: (r) => (
                  <Badge variant={r.status === 'REMITTED' ? 'success' : r.status === 'ELIGIBLE_FOR_REMITTANCE' ? 'brand' : 'neutral'}>
                    {r.status === 'PENDING_DELIVERY' ? 'PENDING DELIVERY' : r.status === 'ELIGIBLE_FOR_REMITTANCE' ? '⚡ ELIGIBLE FOR PAYOUT' : r.status}
                  </Badge>
                ),
              },
              { key: 'remittanceId', header: 'Remittance Ref', render: (r) => <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{r.remittanceId || 'PENDING SETTLEMENT'}</span> },
            ]}
            data={paginatedTransactions}
          />

          <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Showing {filteredTransactions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length} COD shipments
            </span>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </Card>
      )}

      {/* TAB 2: REMITTANCES HISTORY TABLE */}
      {activeTab === 'remittances' && (
        <Card style={{ padding: 'var(--space-4)' }}>
          <Table<CodRemittanceRecord>
            keyExtractor={(r) => r.id}
            columns={[
              {
                key: 'remittanceId',
                header: 'Remittance ID',
                render: (r) => (
                  <div>
                    <strong style={{ color: 'var(--color-violet-main)', fontFamily: 'monospace' }}>{r.remittanceId}</strong>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      {r.payoutType === 'INSTANT_T0' ? '⚡ Instant T+0 Payout' : r.payoutType === 'EARLY_T2' ? '⚡ Early T+2 Payout' : 'Standard T+7 Payout'}
                    </div>
                  </div>
                ),
              },
              { key: 'shipmentCount', header: 'Shipments', render: (r) => <span>{r.shipmentCount} Orders</span> },
              { key: 'grossCodAmountINR', header: 'Gross COD Collected', render: (r) => <span>{formatCurrency(r.grossCodAmountINR)}</span> },
              { key: 'deductionINR', header: 'Deductions & Fees', render: (r) => <span style={{ color: 'var(--color-danger)' }}>-{formatCurrency(r.deductionINR + r.earlyFeeINR)}</span> },
              {
                key: 'netRemittanceINR',
                header: 'Net Remitted Amount',
                render: (r) => <strong style={{ color: 'var(--color-success)' }}>{formatCurrency(r.netRemittanceINR)}</strong>,
              },
              {
                key: 'payoutDestination',
                header: 'Destination',
                render: (r) => <Badge variant={r.payoutDestination === 'WALLET' ? 'brand' : 'info'}>{r.payoutDestination === 'WALLET' ? '💳 Wallet' : '🏦 Bank'}</Badge>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (r) => <Badge variant={r.status === 'REMITTED' ? 'success' : 'warning'}>{r.status}</Badge>,
              },
              { key: 'remittanceDate', header: 'Settlement Date', render: (r) => <span style={{ fontSize: '11px' }}>{r.remittanceDate}</span> },
              {
                key: 'actions',
                header: 'Actions',
                render: (r) => (
                  <Button variant="outline" size="sm" leftIcon={<Eye size={14} />} onClick={() => setSelectedRemittance(r)}>
                    Breakdown
                  </Button>
                ),
              },
            ]}
            data={paginatedRemittances}
          />

          <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Showing {filteredRemittances.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredRemittances.length)} of {filteredRemittances.length} settlements
            </span>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </Card>
      )}

      {/* TAB 3: EARLY COD PLAN SETTINGS */}
      {activeTab === 'settings' && (
        <Card style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--color-text-primary)' }}>
            Early COD Payout Preferences & Plan Configuration
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            Choose how quickly you want COD funds remitted to your bank account or shipping wallet after shipment delivery.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {/* Plan 1 */}
            <div
              onClick={() => setSelectedPlanType('STANDARD_T7')}
              style={{
                border: selectedPlanType === 'STANDARD_T7' ? '2px solid var(--color-violet-main)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-default)',
                padding: '16px',
                cursor: 'pointer',
                backgroundColor: selectedPlanType === 'STANDARD_T7' ? 'var(--color-violet-light)' : 'var(--color-surface)',
              }}
            >
              <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>Standard COD Payout</strong>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '6px 0' }}>Cycle: <strong>T+7 Days</strong></div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Processing Fee: <strong>0% Free</strong></div>
            </div>

            {/* Plan 2 */}
            <div
              onClick={() => setSelectedPlanType('EARLY_T2')}
              style={{
                border: selectedPlanType === 'EARLY_T2' ? '2px solid var(--color-violet-main)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-default)',
                padding: '16px',
                cursor: 'pointer',
                backgroundColor: selectedPlanType === 'EARLY_T2' ? 'var(--color-violet-light)' : 'var(--color-surface)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>⚡ Early COD Payout</strong>
                <Badge variant="info">POPULAR</Badge>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '6px 0' }}>Cycle: <strong>T+2 Days</strong></div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Processing Fee: <strong>0.5%</strong></div>
            </div>

            {/* Plan 3 */}
            <div
              onClick={() => setSelectedPlanType('INSTANT_T0')}
              style={{
                border: selectedPlanType === 'INSTANT_T0' ? '2px solid #8b5cf6' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-default)',
                padding: '16px',
                cursor: 'pointer',
                backgroundColor: selectedPlanType === 'INSTANT_T0' ? 'var(--color-violet-light)' : 'var(--color-surface)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '14px', color: 'var(--color-violet-main)' }}>⚡ Instant COD Payout</strong>
                <Badge variant="brand">SAME DAY</Badge>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '6px 0' }}>Cycle: <strong>T+0 Same Day</strong></div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Processing Fee: <strong>1.0%</strong></div>
            </div>
          </div>

          <Button variant="primary" size="md" onClick={handleSavePlanSettings}>
            Save Early COD Settings
          </Button>
        </Card>
      )}

      {/* 6. INSTANT COD CLAIM MODAL */}
      <Modal
        isOpen={isInstantClaimModalOpen}
        onClose={() => setIsInstantClaimModalOpen(false)}
        title="⚡ Claim Instant COD Payout (T+0 Same Day)"
      >
        {successReceipt ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '10px 0' }}>
            <CheckCircle2 size={48} style={{ color: 'var(--color-success)', margin: '0 auto' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--color-text-primary)' }}>
              Instant COD Payout Dispatched Successfully!
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
              {successReceipt.payoutDestination === 'WALLET'
                ? `Net ${formatCurrency(successReceipt.netRemittanceINR)} credited instantly to your Shipping Wallet balance!`
                : `Net ${formatCurrency(successReceipt.netRemittanceINR)} transferred to your Bank Account!`}
            </p>

            <div style={{ padding: '14px', borderRadius: 'var(--radius-default)', backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border)', textAlign: 'left', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>Remittance ID: <strong>{successReceipt.remittanceId}</strong></div>
              <div>Reference / UTR: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{successReceipt.bankReferenceId}</span></div>
              <div>Orders Settled: <strong>{successReceipt.shipmentCount} Delivered Shipments</strong></div>
              <div>Gross COD Value: <strong>{formatCurrency(successReceipt.grossCodAmountINR)}</strong></div>
              <div>Early Instant Fee (1.0%): <strong style={{ color: 'var(--color-danger)' }}>-{formatCurrency(successReceipt.earlyFeeINR)}</strong></div>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '6px', color: 'var(--color-success)', fontWeight: 'bold', fontSize: '14px' }}>
                Net Credited: {formatCurrency(successReceipt.netRemittanceINR)}
              </div>
            </div>

            <Button variant="primary" onClick={() => setIsInstantClaimModalOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Alert variant="info" title="Eligible Instant Remittance Summary">
              You are claiming instant settlement for {eligibleTxs.length} delivered COD orders.
            </Alert>

            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-default)', padding: '14px', backgroundColor: 'var(--color-surface-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Gross Eligible COD Amount:</span>
                <strong>{formatCurrency(grossEligibleAmount)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                <span>Standard Handling Fee (1%):</span>
                <span>-{formatCurrency(estimatedStandardDeductions)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                <span>Instant Payout Fee ({payoutPlanFeePercent}%):</span>
                <span>-{formatCurrency(estimatedEarlyFee)}</span>
              </div>

              <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: 'var(--color-success)', fontWeight: 'bold' }}>
                <span>Net Instant Payout:</span>
                <span>{formatCurrency(netEstimatedPayout)}</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                Select Payout Destination *
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  onClick={() => setPayoutDestination('WALLET')}
                  style={{
                    border: payoutDestination === 'WALLET' ? '2px solid var(--color-violet-main)' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-default)',
                    padding: '12px',
                    cursor: 'pointer',
                    backgroundColor: payoutDestination === 'WALLET' ? 'var(--color-violet-light)' : 'var(--color-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <Wallet size={20} style={{ color: 'var(--color-violet-main)' }} />
                  <div>
                    <strong style={{ fontSize: '13px' }}>Shipping Wallet</strong>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Instant Wallet Credit</div>
                  </div>
                </div>

                <div
                  onClick={() => setPayoutDestination('BANK')}
                  style={{
                    border: payoutDestination === 'BANK' ? '2px solid var(--color-violet-main)' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-default)',
                    padding: '12px',
                    cursor: 'pointer',
                    backgroundColor: payoutDestination === 'BANK' ? 'var(--color-violet-light)' : 'var(--color-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <Landmark size={20} style={{ color: 'var(--color-info)' }} />
                  <div>
                    <strong style={{ fontSize: '13px' }}>Bank Account</strong>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>IMPS UTR Transfer</div>
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              leftIcon={<Zap size={18} />}
              onClick={handleClaimInstantPayout}
              style={{ width: '100%', backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}
            >
              CONFIRM INSTANT PAYOUT ({formatCurrency(netEstimatedPayout)})
            </Button>
          </div>
        )}
      </Modal>

      {/* 7. REMITTANCE BREAKDOWN AUDIT MODAL */}
      {selectedRemittance && (
        <Modal
          isOpen={!!selectedRemittance}
          onClose={() => setSelectedRemittance(null)}
          title={`COD Remittance Breakdown (${selectedRemittance.remittanceId})`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: '13px' }}>
            <div>Remittance ID: <strong style={{ fontFamily: 'monospace' }}>{selectedRemittance.remittanceId}</strong></div>
            <div>Payout Mode: <Badge variant="brand">{selectedRemittance.payoutType || 'STANDARD_T7'}</Badge></div>
            <div>Destination: <Badge variant="info">{selectedRemittance.payoutDestination === 'WALLET' ? '💳 Shipping Wallet' : '🏦 Bank Transfer'}</Badge></div>
            <div>Reference / UTR: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{selectedRemittance.bankReferenceId || 'N/A'}</span></div>
            <div>Gross COD Value: <strong>{formatCurrency(selectedRemittance.grossCodAmountINR)}</strong></div>
            <div>Standard Fee Deduction: <span style={{ color: 'var(--color-text-secondary)' }}>-{formatCurrency(selectedRemittance.deductionINR)}</span></div>
            {selectedRemittance.earlyFeeINR > 0 && (
              <div>Early Payout Processing Fee: <span style={{ color: 'var(--color-danger)' }}>-{formatCurrency(selectedRemittance.earlyFeeINR)}</span></div>
            )}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '6px', fontSize: '14px' }}>
              Net Remitted: <strong style={{ color: 'var(--color-success)' }}>{formatCurrency(selectedRemittance.netRemittanceINR)}</strong>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
