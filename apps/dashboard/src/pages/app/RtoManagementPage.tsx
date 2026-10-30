import React, { useMemo } from 'react';
import { RotateCcw, Truck, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Card,
  Badge,
  Table,
} from '../../components/ui';
import { ShipmentTrackingNdrRtoService, type RtoRecord } from '../../services/shipmentTrackingNdrRtoService';
import { useTenant } from '../../context/TenantContext';

export const RtoManagementPage: React.FC = () => {
  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId;
  const rtoRecords = useMemo(() => {
    return ShipmentTrackingNdrRtoService.getRtoRecords(tenantId);
  }, [tenantId]);

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Return to Origin (RTO) Shipments', path: '/app/rto' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Return to Origin (RTO) Tracking Dashboard"
        description="Track shipments marked for return to origin, linehaul reverse transit, and warehouse return delivery."
        breadcrumbs={breadcrumbs}
      />

      {/* 2. Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Total RTO Returns" value={rtoRecords.length} subtext="Returned shipments" icon={RotateCcw} />
        <StatCard label="RTO In Transit" value={rtoRecords.filter((r) => r.status === 'RTO_IN_TRANSIT').length} subtext="Reverse linehaul" icon={Truck} />
        <StatCard label="Returned to Warehouse" value={rtoRecords.filter((r) => r.status === 'RTO_DELIVERED').length} subtext="RTO delivered" icon={CheckCircle2} />
      </div>

      {/* 3. RTO Table */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <Table<RtoRecord>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'rtoId',
              header: 'RTO ID & Shipment',
              render: (r) => (
                <div>
                  <strong style={{ color: 'var(--color-violet-main)' }}>{r.rtoId}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    Shipment: <strong>{r.shipmentId}</strong> (AWB: {r.awbNumber})
                  </div>
                </div>
              ),
            },
            { key: 'courierName', header: 'Courier Partner', render: (r) => <span>{r.courierName}</span> },
            {
              key: 'rtoReason',
              header: 'RTO Return Reason',
              render: (r) => <strong style={{ color: 'var(--color-danger)' }}>{r.rtoReason}</strong>,
            },
            {
              key: 'rtoChargeINR',
              header: 'RTO Freight Charge',
              render: (r) => <span>₹{(r.rtoChargeINR || 0).toFixed(2)}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <Badge variant={r.status === 'RTO_DELIVERED' ? 'success' : 'warning'}>{r.status}</Badge>,
            },
            { key: 'initiatedAt', header: 'Initiated Date', render: (r) => <span>{r.initiatedAt}</span> },
          ]}
          data={rtoRecords}
        />
      </Card>
    </div>
  );
};
