import React, { useState } from 'react';
import { IndianRupee, CheckCircle2, ShieldAlert, Plus, Eye, Check, Zap } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Select,
  Input,
  Modal,
} from '../../components/ui';
import {
  AdminCodRemittanceService,
  type AdminCodReceivableRecord,
  type AdminRemittanceRecord,
  type CourierCodSummaryRecord,
  type CodReconciliationException,
} from '../../services/adminCodRemittanceService';

export const AdminCodRemittancesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'remittances' | 'receivables' | 'couriers' | 'reconciliation'>('remittances');
  const [tenantFilter] = useState('all');
  const [statusFilter] = useState('all');

  const [remittances, setRemittances] = useState<AdminRemittanceRecord[]>(() =>
    AdminCodRemittanceService.getRemittances(tenantFilter, statusFilter)
  );
  const [receivables, setReceivables] = useState<AdminCodReceivableRecord[]>(() =>
    AdminCodRemittanceService.getReceivables(tenantFilter, statusFilter)
  );
  const courierSummaries = AdminCodRemittanceService.getCourierSummaries();
  const exceptions = AdminCodRemittanceService.getReconciliationExceptions();

  // Create Remittance Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState('tenant-demo-01');
  const [selectedCourier, setSelectedCourier] = useState('dtdc');
  const [settlementPeriod, setSettlementPeriod] = useState('2026-08-18 to 2026-08-21');
  const [otherAdjustments, setOtherAdjustments] = useState('0');
  const [recoveries, setRecoveries] = useState('0');
  const [remittanceNotes, setRemittanceNotes] = useState('');

  // Complete Remittance Modal
  const [selectedRemittance, setSelectedRemittance] = useState<AdminRemittanceRecord | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [bankReferenceId, setBankReferenceId] = useState('');

  const refreshData = () => {
    setRemittances(AdminCodRemittanceService.getRemittances(tenantFilter, statusFilter));
    setReceivables(AdminCodRemittanceService.getReceivables(tenantFilter, statusFilter));
  };

  const handleCreateRemittance = () => {
    const eligibleRecs = AdminCodRemittanceService.getEligibleReceivables(selectedTenant, selectedCourier);
    if (eligibleRecs.length === 0) {
      alert('No eligible COD shipments found for the selected merchant and courier.');
      return;
    }

    const shipmentIds = eligibleRecs.map((r) => r.shipmentId);
    const res = AdminCodRemittanceService.createRemittance({
      tenantId: selectedTenant,
      courierId: selectedCourier,
      courierName: eligibleRecs[0].courierName,
      settlementPeriod,
      shipmentIds,
      otherAdjustmentsINR: parseFloat(otherAdjustments) || 0,
      recoveriesINR: parseFloat(recoveries) || 0,
      notes: remittanceNotes,
    });

    if (res.success) {
      setIsCreateModalOpen(false);
      refreshData();
      alert(res.message);
    } else {
      alert(res.message);
    }
  };

  const handleCompleteRemittance = () => {
    if (!selectedRemittance || !bankReferenceId.trim()) {
      alert('Please enter a valid Bank UTR / Reference ID.');
      return;
    }

    const res = AdminCodRemittanceService.completeRemittance(selectedRemittance.remittanceId, bankReferenceId.trim());
    if (res.success) {
      setIsCompleteModalOpen(false);
      setSelectedRemittance(null);
      setBankReferenceId('');
      refreshData();
      alert(res.message);
    } else {
      alert(res.message);
    }
  };

  const totalCodValue = receivables.reduce((s, r) => s + r.codAmountINR, 0);
  const eligibleCod = receivables.filter((r) => r.status === 'ELIGIBLE').reduce((s, r) => s + r.codAmountINR, 0);
  const remittedCod = receivables.filter((r) => r.status === 'REMITTED').reduce((s, r) => s + r.codAmountINR, 0);

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Finance & Ledgers', path: '/admin/customer-wallets' },
    { label: 'COD Remittance & Settlement Control Center', path: '/admin/cod/remittances' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Admin COD Remittance & Settlement Control Center"
        description="Manage Cash on Delivery receivables, merchant remittance batches, courier COD settlements, double-remittance guards, and reconciliation exceptions."
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={() => setIsCreateModalOpen(true)}>
            + Create New Remittance Batch
          </Button>
        }
      />

      {/* 2. Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Total COD Receivables" value={`₹${totalCodValue.toFixed(2)}`} subtext="All COD collections" icon={IndianRupee} />
        <StatCard label="Eligible for Remittance" value={`₹${eligibleCod.toFixed(2)}`} subtext="Delivered & rule satisfied" icon={CheckCircle2} />
        <StatCard label="Remitted to Merchants" value={`₹${remittedCod.toFixed(2)}`} subtext="Settlement completed" icon={CheckCircle2} />
        <StatCard label="Early COD Fee Earnings" value="₹14,250.00" subtext="Instant payout charges collected" badgeText="REVENUE" badgeVariant="success" icon={Zap} />
        <StatCard label="Courier Mismatch Alerts" value={exceptions.length} subtext="Reconciliation exceptions" icon={ShieldAlert} />
      </div>

      {/* 3. Navigation Tabs */}
      <Card style={{ padding: 'var(--space-2)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            onClick={() => setActiveTab('remittances')}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-default)',
              border: 'none',
              backgroundColor: activeTab === 'remittances' ? 'var(--color-violet-light)' : 'transparent',
              color: activeTab === 'remittances' ? 'var(--color-violet-main)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'remittances' ? 'bold' : 'normal',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Remittance Batches ({remittances.length})
          </button>
          <button
            onClick={() => setActiveTab('receivables')}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-default)',
              border: 'none',
              backgroundColor: activeTab === 'receivables' ? 'var(--color-violet-light)' : 'transparent',
              color: activeTab === 'receivables' ? 'var(--color-violet-main)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'receivables' ? 'bold' : 'normal',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            COD Receivables ({receivables.length})
          </button>
          <button
            onClick={() => setActiveTab('couriers')}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-default)',
              border: 'none',
              backgroundColor: activeTab === 'couriers' ? 'var(--color-violet-light)' : 'transparent',
              color: activeTab === 'couriers' ? 'var(--color-violet-main)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'couriers' ? 'bold' : 'normal',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Courier-Wise COD ({courierSummaries.length})
          </button>
          <button
            onClick={() => setActiveTab('reconciliation')}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-default)',
              border: 'none',
              backgroundColor: activeTab === 'reconciliation' ? 'var(--color-violet-light)' : 'transparent',
              color: activeTab === 'reconciliation' ? 'var(--color-violet-main)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'reconciliation' ? 'bold' : 'normal',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Reconciliation Exceptions ({exceptions.length})
          </button>
        </div>
      </Card>

      {/* TAB 1: REMITTANCES */}
      {activeTab === 'remittances' && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <Table<AdminRemittanceRecord>
            keyExtractor={(r) => r.id}
            columns={[
              {
                key: 'remittanceId',
                header: 'Remittance ID',
                render: (r) => <strong style={{ color: 'var(--color-violet-main)' }}>{r.remittanceId}</strong>,
              },
              { key: 'tenantId', header: 'Merchant Tenant', render: (r) => <strong>{r.tenantId}</strong> },
              { key: 'courierName', header: 'Courier Partner', render: (r) => <span>{r.courierName}</span> },
              { key: 'shipmentCount', header: 'Shipments', render: (r) => <span>{r.shipmentCount} Orders</span> },
              { key: 'grossCodAmountINR', header: 'Gross COD', render: (r) => <span>₹{r.grossCodAmountINR.toFixed(2)}</span> },
              { key: 'codChargesINR', header: 'Deductions', render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>-₹{r.codChargesINR.toFixed(2)}</span> },
              {
                key: 'netRemittanceINR',
                header: 'Net Remitted',
                render: (r) => <strong style={{ color: 'var(--color-success)' }}>₹{r.netRemittanceINR.toFixed(2)}</strong>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (r) => <Badge variant={r.status === 'COMPLETED' ? 'success' : 'warning'}>{r.status}</Badge>,
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (r) => (
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {r.status === 'PROCESSING' && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Check size={14} />}
                        onClick={() => {
                          setSelectedRemittance(r);
                          setIsCompleteModalOpen(true);
                        }}
                      >
                        Mark Completed
                      </Button>
                    )}
                    <Button variant="outline" size="sm" leftIcon={<Eye size={14} />} onClick={() => setSelectedRemittance(r)}>
                      View Detail
                    </Button>
                  </div>
                ),
              },
            ]}
            data={remittances}
          />
        </Card>
      )}

      {/* TAB 2: RECEIVABLES */}
      {activeTab === 'receivables' && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <Table<AdminCodReceivableRecord>
            keyExtractor={(r) => r.id}
            columns={[
              {
                key: 'shipmentId',
                header: 'Shipment & AWB',
                render: (r) => (
                  <div>
                    <strong style={{ color: 'var(--color-violet-main)' }}>{r.shipmentId}</strong>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>AWB: {r.awbNumber}</div>
                  </div>
                ),
              },
              { key: 'tenantId', header: 'Merchant Tenant', render: (r) => <span>{r.tenantId}</span> },
              { key: 'courierName', header: 'Courier', render: (r) => <span>{r.courierName}</span> },
              { key: 'codAmountINR', header: 'COD Amount', render: (r) => <strong>₹{r.codAmountINR.toFixed(2)}</strong> },
              { key: 'deliveredDate', header: 'Delivered Date', render: (r) => <span>{r.deliveredDate}</span> },
              {
                key: 'status',
                header: 'Remittance Eligibility Status',
                render: (r) => (
                  <Badge variant={r.status === 'REMITTED' ? 'success' : r.status === 'ELIGIBLE' ? 'brand' : 'neutral'}>
                    {r.status}
                  </Badge>
                ),
              },
            ]}
            data={receivables}
          />
        </Card>
      )}

      {/* TAB 3: COURIERS */}
      {activeTab === 'couriers' && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <Table<CourierCodSummaryRecord>
            keyExtractor={(r) => r.courierId}
            columns={[
              { key: 'courierName', header: 'Courier Partner', render: (r) => <strong>{r.courierName}</strong> },
              { key: 'codDeliveredINR', header: 'COD Delivered', render: (r) => <span>₹{r.codDeliveredINR.toFixed(2)}</span> },
              { key: 'codEligibleINR', header: 'COD Eligible', render: (r) => <span>₹{r.codEligibleINR.toFixed(2)}</span> },
              { key: 'codRemittedINR', header: 'COD Remitted', render: (r) => <strong style={{ color: 'var(--color-success)' }}>₹{r.codRemittedINR.toFixed(2)}</strong> },
              { key: 'codMismatchINR', header: 'Reconciliation Mismatch', render: (r) => <Badge variant={r.codMismatchINR > 0 ? 'danger' : 'neutral'}>₹{r.codMismatchINR.toFixed(2)}</Badge> },
            ]}
            data={courierSummaries}
          />
        </Card>
      )}

      {/* TAB 4: RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <Table<CodReconciliationException>
            keyExtractor={(r) => r.id}
            columns={[
              { key: 'shipmentId', header: 'Shipment ID', render: (r) => <strong>{r.shipmentId}</strong> },
              { key: 'courierName', header: 'Courier Partner', render: (r) => <span>{r.courierName}</span> },
              { key: 'expectedAmountINR', header: 'Expected Amount', render: (r) => <span>₹{r.expectedAmountINR.toFixed(2)}</span> },
              { key: 'receivedAmountINR', header: 'Courier Received', render: (r) => <span>₹{r.receivedAmountINR.toFixed(2)}</span> },
              { key: 'differenceINR', header: 'Difference Amount', render: (r) => <strong style={{ color: 'var(--color-danger)' }}>₹{r.differenceINR.toFixed(2)} ({r.mismatchType})</strong> },
              { key: 'status', header: 'Status', render: (r) => <Badge variant="warning">{r.status}</Badge> },
            ]}
            data={exceptions}
          />
        </Card>
      )}

      {/* Create Remittance Modal */}
      {isCreateModalOpen && (
        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New COD Remittance Batch">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Select
              label="Select Merchant Tenant *"
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              options={[
                { value: 'tenant-demo-01', label: 'tenant-demo-01 (ABC Traders)' },
                { value: 'tenant-demo-02', label: 'tenant-demo-02 (XYZ Logistics)' },
              ]}
            />
            <Select
              label="Select Courier Partner *"
              value={selectedCourier}
              onChange={(e) => setSelectedCourier(e.target.value)}
              options={[
                { value: 'delhivery', label: 'Delhivery Surface' },
                { value: 'bluedart', label: 'Blue Dart Air' },
                { value: 'dtdc', label: 'DTDC Express' },
              ]}
            />
            <Input label="Settlement Period *" value={settlementPeriod} onChange={(e) => setSettlementPeriod(e.target.value)} />
            <Input label="Other Deductions / Adjustments (₹)" type="number" value={otherAdjustments} onChange={(e) => setOtherAdjustments(e.target.value)} />
            <Input label="Recoveries (₹)" type="number" value={recoveries} onChange={(e) => setRecoveries(e.target.value)} />
            <Input label="Batch Remittance Notes" placeholder="Add administrative settlement notes..." value={remittanceNotes} onChange={(e) => setRemittanceNotes(e.target.value)} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateRemittance}>Calculate & Create Batch</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Complete Remittance Modal */}
      {isCompleteModalOpen && selectedRemittance && (
        <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title={`Complete Remittance ${selectedRemittance.remittanceId}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>Merchant Tenant: <strong>{selectedRemittance.tenantId}</strong></div>
            <div>Net Payout Amount: <strong style={{ color: 'var(--color-success)', fontSize: '16px' }}>₹{selectedRemittance.netRemittanceINR.toFixed(2)}</strong></div>
            <Input label="Bank UTR / Settlement Reference ID *" placeholder="e.g. UTR-HDFC-991823019" value={bankReferenceId} onChange={(e) => setBankReferenceId(e.target.value)} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Button variant="ghost" onClick={() => setIsCompleteModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCompleteRemittance}>Confirm Bank Payout</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
