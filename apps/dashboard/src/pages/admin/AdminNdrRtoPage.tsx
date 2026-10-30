import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Modal,
} from '../../components/ui';
import {
  ShipmentTrackingNdrRtoService,
  type NdrRecord,
  type RtoRecord,
} from '../../services/shipmentTrackingNdrRtoService';

export const AdminNdrRtoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ndr' | 'rto'>('ndr');
  const [ndrRecords, setNdrRecords] = useState<NdrRecord[]>(() =>
    ShipmentTrackingNdrRtoService.getNdrRecords()
  );
  const [rtoRecords] = useState<RtoRecord[]>(() =>
    ShipmentTrackingNdrRtoService.getRtoRecords()
  );

  const [selectedNdr, setSelectedNdr] = useState<NdrRecord | null>(null);

  const refreshData = () => {
    setNdrRecords(ShipmentTrackingNdrRtoService.getNdrRecords());
  };

  const handleInitiateRto = () => {
    if (!selectedNdr) return;
    ShipmentTrackingNdrRtoService.initiateRto({
      shipmentId: selectedNdr.shipmentId,
      awbNumber: selectedNdr.awbNumber,
      tenantId: selectedNdr.tenantId,
      courierId: selectedNdr.courierId,
      courierName: selectedNdr.courierName,
      rtoReason: 'Maximum delivery attempts reached',
    });

    selectedNdr.status = 'RTO_INITIATED';
    setSelectedNdr(null);
    refreshData();
    alert(`RTO return initiated for shipment ${selectedNdr.shipmentId}.`);
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'NDR & RTO Control Center', path: '/admin/ndr' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Super Admin NDR & RTO Control Center"
        description="Monitor platform undelivered NDR exception attempts, merchant re-attempt instructions, and RTO return flows across all courier partners."
        breadcrumbs={breadcrumbs}
      />

      {/* 2. Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Total Platform NDRs" value={ndrRecords.length} subtext="Global delivery exceptions" icon={AlertTriangle} />
        <StatCard label="Merchant Action Required" value={ndrRecords.filter((n) => n.status === 'CUSTOMER_ACTION_REQUIRED').length} subtext="Awaiting response" icon={ShieldAlert} />
        <StatCard label="Re-Attempt Requested" value={ndrRecords.filter((n) => n.status === 'REATTEMPT_REQUESTED').length} subtext="Ready for carrier API" icon={CheckCircle2} />
        <StatCard label="RTO Returns Initiated" value={rtoRecords.length} subtext="Reverse linehaul returns" icon={RotateCcw} />
      </div>

      {/* 3. Navigation Tabs */}
      <Card style={{ padding: 'var(--space-2)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            onClick={() => setActiveTab('ndr')}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-default)',
              border: 'none',
              backgroundColor: activeTab === 'ndr' ? 'var(--color-violet-light)' : 'transparent',
              color: activeTab === 'ndr' ? 'var(--color-violet-main)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'ndr' ? 'bold' : 'normal',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Global NDR Exceptions ({ndrRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('rto')}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-default)',
              border: 'none',
              backgroundColor: activeTab === 'rto' ? 'var(--color-violet-light)' : 'transparent',
              color: activeTab === 'rto' ? 'var(--color-violet-main)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'rto' ? 'bold' : 'normal',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Global RTO Returns ({rtoRecords.length})
          </button>
        </div>
      </Card>

      {/* TAB 1: NDR */}
      {activeTab === 'ndr' && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <Table<NdrRecord>
            keyExtractor={(r) => r.id}
            columns={[
              {
                key: 'ndrId',
                header: 'NDR ID & Shipment',
                render: (r) => (
                  <div>
                    <strong style={{ color: 'var(--color-violet-main)' }}>{r.ndrId}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      Tenant: <strong>{r.tenantId}</strong> • AWB: {r.awbNumber}
                    </div>
                  </div>
                ),
              },
              { key: 'courierName', header: 'Courier Partner', render: (r) => <span>{r.courierName}</span> },
              { key: 'ndrReason', header: 'Reason', render: (r) => <strong style={{ color: 'var(--color-danger)' }}>{r.ndrReason}</strong> },
              { key: 'attemptNumber', header: 'Attempt #', render: (r) => <span>Attempt #{r.attemptNumber}</span> },
              {
                key: 'status',
                header: 'Status',
                render: (r) => <Badge variant={r.status === 'REATTEMPT_REQUESTED' ? 'warning' : 'neutral'}>{r.status}</Badge>,
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (r) => (
                  <Button variant="outline" size="sm" onClick={() => setSelectedNdr(r)}>
                    Manage NDR
                  </Button>
                ),
              },
            ]}
            data={ndrRecords}
          />
        </Card>
      )}

      {/* TAB 2: RTO */}
      {activeTab === 'rto' && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <Table<RtoRecord>
            keyExtractor={(r) => r.id}
            columns={[
              { key: 'rtoId', header: 'RTO ID', render: (r) => <strong>{r.rtoId}</strong> },
              { key: 'shipmentId', header: 'Shipment ID', render: (r) => <span>{r.shipmentId}</span> },
              { key: 'tenantId', header: 'Merchant Tenant', render: (r) => <span>{r.tenantId}</span> },
              { key: 'courierName', header: 'Courier Partner', render: (r) => <span>{r.courierName}</span> },
              { key: 'rtoReason', header: 'Return Reason', render: (r) => <strong style={{ color: 'var(--color-danger)' }}>{r.rtoReason}</strong> },
              { key: 'status', header: 'Status', render: (r) => <Badge variant="warning">{r.status}</Badge> },
            ]}
            data={rtoRecords}
          />
        </Card>
      )}

      {/* Manage NDR Modal */}
      {selectedNdr && (
        <Modal isOpen={!!selectedNdr} onClose={() => setSelectedNdr(null)} title={`Manage NDR (${selectedNdr.ndrId})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: '13px' }}>
            <div>Shipment ID: <strong>{selectedNdr.shipmentId}</strong></div>
            <div>Merchant Tenant: <strong>{selectedNdr.tenantId}</strong></div>
            <div>NDR Reason: <strong style={{ color: 'var(--color-danger)' }}>{selectedNdr.ndrReason}</strong></div>
            {selectedNdr.updatedAddress && <div>Merchant Corrected Address: <strong>{selectedNdr.updatedAddress}</strong></div>}
            {selectedNdr.deliveryInstructions && <div>Merchant Instructions: <strong>{selectedNdr.deliveryInstructions}</strong></div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Button variant="ghost" onClick={() => setSelectedNdr(null)}>Cancel</Button>
              <Button variant="outline" style={{ color: 'var(--color-danger)' }} onClick={handleInitiateRto}>Initiate RTO Return</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
