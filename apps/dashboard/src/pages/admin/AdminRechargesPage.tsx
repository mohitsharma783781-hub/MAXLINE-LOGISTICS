import React, { useState } from 'react';
import { Wallet, ShieldAlert, CheckCircle2, Eye } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Card,
  Badge,
  Table,
  Select,
  Input,
  Button,
  Modal,
} from '../../components/ui';
import { WalletRechargeService, type WalletRechargeRecord, type ReconciliationReportItem } from '../../services/walletRechargeService';

export const AdminRechargesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'recharges' | 'reconciliation'>('recharges');
  const [selectedRecord, setSelectedRecord] = useState<WalletRechargeRecord | null>(null);

  const recharges = WalletRechargeService.getRecharges('all', statusFilter).filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.rechargeId.toLowerCase().includes(q) ||
        r.tenantId.toLowerCase().includes(q) ||
        (r.providerPaymentId && r.providerPaymentId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const reconciliationItems = WalletRechargeService.getReconciliationReport();

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Finance & Ledgers', path: '/admin/customer-wallets' },
    { label: 'Gateway Recharges & Reconciliation', path: '/admin/recharges' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Gateway Payment Recharges & Reconciliation Control Center"
        description="Monitor merchant payment gateway recharges, server signature verifications, idempotency locks, amount mismatch alerts, and wallet reconciliation ledgers."
        breadcrumbs={breadcrumbs}
      />

      {/* 2. Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Total Gateway Recharges" value={recharges.length} subtext="Recharge payment intents" icon={Wallet} />
        <StatCard label="Matched & Credited" value={reconciliationItems.filter((i) => i.reconciliationStatus === 'MATCHED').length} subtext="Server verified SUCCESS" icon={CheckCircle2} />
        <StatCard label="Amount Mismatch Alerts" value={reconciliationItems.filter((i) => i.reconciliationStatus === 'MISMATCH').length} subtext="Safety locked recharges" icon={ShieldAlert} />
      </div>

      {/* 3. Navigation Tabs */}
      <Card style={{ padding: 'var(--space-2)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            onClick={() => setActiveTab('recharges')}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-default)',
              border: 'none',
              backgroundColor: activeTab === 'recharges' ? 'var(--color-violet-light)' : 'transparent',
              color: activeTab === 'recharges' ? 'var(--color-violet-main)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'recharges' ? 'bold' : 'normal',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Gateway Recharges History
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
            Wallet Reconciliation Exceptions
          </button>
        </div>
      </Card>

      {/* TAB 1: RECHARGES */}
      {activeTab === 'recharges' && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <Input
                placeholder="Search Recharge ID, Customer Tenant, Payment ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'SUCCESS', label: 'Verified SUCCESS' },
                { value: 'PENDING', label: 'Pending Verification' },
                { value: 'FAILED', label: 'Failed Authorization' },
                { value: 'AMOUNT_MISMATCH', label: 'Amount Mismatch Alert' },
              ]}
              style={{ width: '200px' }}
            />
          </div>

          <Table<WalletRechargeRecord>
            keyExtractor={(r) => r.id}
            columns={[
              {
                key: 'rechargeId',
                header: 'Recharge ID',
                render: (r) => <strong style={{ color: 'var(--color-violet-main)' }}>{r.rechargeId}</strong>,
              },
              { key: 'tenantId', header: 'Customer Tenant', render: (r) => <strong>{r.tenantId}</strong> },
              {
                key: 'amountINR',
                header: 'Amount Paid',
                render: (r) => <strong style={{ color: 'var(--color-violet-main)' }}>₹{r.amountINR.toFixed(2)}</strong>,
              },
              { key: 'paymentProvider', header: 'Gateway Provider', render: (r) => <span>{r.paymentProvider}</span> },
              {
                key: 'providerPaymentId',
                header: 'Gateway Payment ID',
                render: (r) => <span style={{ fontFamily: 'monospace' }}>{r.providerPaymentId || 'Pending'}</span>,
              },
              {
                key: 'paymentStatus',
                header: 'Status',
                render: (r) => (
                  <Badge variant={r.paymentStatus === 'SUCCESS' ? 'success' : r.paymentStatus === 'AMOUNT_MISMATCH' ? 'danger' : 'neutral'}>
                    {r.paymentStatus}
                  </Badge>
                ),
              },
              { key: 'createdAt', header: 'Created Date', render: (r) => <span>{r.createdAt}</span> },
              {
                key: 'actions',
                header: 'Actions',
                render: (r) => (
                  <Button variant="outline" size="sm" leftIcon={<Eye size={14} />} onClick={() => setSelectedRecord(r)}>
                    View Detail
                  </Button>
                ),
              },
            ]}
            data={recharges}
          />
        </Card>
      )}

      {/* TAB 2: RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
            Payment Gateway vs Wallet Ledger Reconciliation Matrix
          </h4>

          <Table<ReconciliationReportItem>
            keyExtractor={(r) => r.rechargeId}
            columns={[
              { key: 'rechargeId', header: 'Recharge ID', render: (r) => <strong>{r.rechargeId}</strong> },
              { key: 'tenantId', header: 'Customer Tenant', render: (r) => <span>{r.tenantId}</span> },
              { key: 'expectedAmountINR', header: 'Expected Amount', render: (r) => <span>₹{r.expectedAmountINR.toFixed(2)}</span> },
              { key: 'paidAmountINR', header: 'Gateway Paid Amount', render: (r) => <strong>₹{r.paidAmountINR.toFixed(2)}</strong> },
              { key: 'walletCredited', header: 'Wallet Credited', render: (r) => <Badge variant={r.walletCredited ? 'success' : 'neutral'}>{r.walletCredited ? 'YES' : 'NO'}</Badge> },
              {
                key: 'reconciliationStatus',
                header: 'Reconciliation Result',
                render: (r) => (
                  <Badge variant={r.reconciliationStatus === 'MATCHED' ? 'success' : r.reconciliationStatus === 'MISMATCH' ? 'danger' : 'warning'}>
                    {r.reconciliationStatus === 'MATCHED' ? 'PAYMENT_SUCCESS_WALLET_CREDITED' : r.reconciliationStatus}
                  </Badge>
                ),
              },
            ]}
            data={reconciliationItems}
          />
        </Card>
      )}

      {/* Payment Detail Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Recharge & Payment Gateway Detail (${selectedRecord.rechargeId})`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: '13px' }}>
            <div>Recharge Intent ID: <strong>{selectedRecord.rechargeId}</strong></div>
            <div>Merchant Tenant: <strong>{selectedRecord.tenantId}</strong></div>
            <div>Expected Amount: <strong>₹{selectedRecord.expectedAmountINR.toFixed(2)}</strong></div>
            <div>Gateway Paid Amount: <strong>₹{selectedRecord.amountINR.toFixed(2)}</strong></div>
            <div>Payment Provider: <strong>{selectedRecord.paymentProvider}</strong></div>
            <div>Gateway Payment ID: <span style={{ fontFamily: 'monospace' }}>{selectedRecord.providerPaymentId || 'N/A'}</span></div>
            <div>Payment Status: <Badge variant={selectedRecord.paymentStatus === 'SUCCESS' ? 'success' : 'danger'}>{selectedRecord.paymentStatus}</Badge></div>
            <div>Wallet Transaction ID: <span style={{ fontFamily: 'monospace' }}>{selectedRecord.walletTransactionId || 'None'}</span></div>
            <div>Created Date: <span>{selectedRecord.createdAt}</span></div>
            {selectedRecord.failureReason && (
              <div style={{ color: 'var(--color-danger)', marginTop: '4px' }}>
                Failure Reason: <strong>{selectedRecord.failureReason}</strong>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
