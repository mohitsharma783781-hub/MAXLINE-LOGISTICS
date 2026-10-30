import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Card,
  Badge,
  Table,
  Input,
  Select,
  Button,
  Modal,
} from '../../components/ui';
import {
  CustomerShipmentService,
  type CustomerShipmentDetail,
  type InternalShipmentStatus,
} from '../../services/customerShipmentService';

export const AdminShipmentsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shipments, setShipments] = useState<CustomerShipmentDetail[]>(() => CustomerShipmentService.getShipments('all'));

  // Manual Status Update State
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [targetStatus, setTargetStatus] = useState<InternalShipmentStatus>('IN_TRANSIT');
  const [updateReason, setUpdateReason] = useState('Operational hub scan verification');

  const refreshShipments = () => {
    setShipments(CustomerShipmentService.getShipments('all', searchQuery, statusFilter));
  };

  const handleExecuteManualStatusUpdate = () => {
    if (!selectedShipmentId || !updateReason.trim()) return;

    const res = CustomerShipmentService.updateStatus(
      selectedShipmentId,
      targetStatus,
      updateReason.trim(),
      'ADMIN',
      'Super Admin'
    );

    setSelectedShipmentId(null);
    refreshShipments();
    alert(res.message);
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Operations & Shipments', path: '/admin/shipments' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Global Platform Shipments (Super Admin Control)"
        description="Monitor multi-tenant dispatches, status lifecycle history, internal courier buy costs, customer selling prices, and platform gross margins."
        breadcrumbs={breadcrumbs}
      />

      {/* 2. Controls & Search */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <Input
              placeholder="Search Shipment ID, AWB, Order ID, Customer Tenant, Courier..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); refreshShipments(); }}
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); refreshShipments(); }}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'BOOKING_CONFIRMED', label: 'Booking Confirmed' },
              { value: 'PENDING_API', label: 'Pending API Execution' },
              { value: 'AWB_ASSIGNED', label: 'AWB Assigned' },
              { value: 'PICKED_UP', label: 'Picked Up' },
              { value: 'IN_TRANSIT', label: 'In Transit' },
              { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
              { value: 'DELIVERED', label: 'Delivered' },
              { value: 'NDR', label: 'NDR Exception' },
              { value: 'RTO_INITIATED', label: 'RTO Initiated' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
            style={{ width: '200px' }}
          />
        </div>
      </Card>

      {/* 3. Global Admin Shipments Table */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <Table<CustomerShipmentDetail>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'shipmentId',
              header: 'Shipment & AWB',
              render: (r) => (
                <div>
                  <strong style={{ color: 'var(--color-violet-main)' }}>{r.shipmentId}</strong>
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                    AWB: {r.awbNumber || 'Pending API'}
                  </div>
                </div>
              ),
            },
            {
              key: 'tenantId',
              header: 'Customer Tenant',
              render: (r) => <strong>{r.tenantId}</strong>,
            },
            {
              key: 'courierName',
              header: 'Courier & Mode',
              render: (r) => (
                <div>
                  <span>{r.courierName}</span>
                  <div><Badge variant={r.mode === 'B2B' ? 'brand' : 'info'}>{r.mode}</Badge></div>
                </div>
              ),
            },
            {
              key: 'pincodes',
              header: 'Route Pincodes',
              render: (r) => <span style={{ fontSize: '12px' }}>{r.pickupPincode} → <strong>{r.deliveryPincode}</strong></span>,
            },
            {
              key: 'chargeableWeightKg',
              header: 'Weight',
              render: (r) => <span>{r.chargeableWeightKg} KG</span>,
            },
            {
              key: 'totalCustomerChargeINR',
              header: 'Customer Selling Price',
              render: (r) => <strong style={{ color: 'var(--color-violet-main)' }}>₹{r.totalCustomerChargeINR.toFixed(2)}</strong>,
            },
            {
              key: 'courierCostINR',
              header: 'Internal Courier Cost',
              render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>₹{(r.courierCostINR || r.totalCustomerChargeINR * 0.75).toFixed(2)}</span>,
            },
            {
              key: 'grossMarginINR',
              header: 'Platform Gross Margin',
              render: (r) => {
                const margin = r.grossMarginINR || r.totalCustomerChargeINR * 0.25;
                return (
                  <div>
                    <strong style={{ color: 'var(--color-success)' }}>+₹{margin.toFixed(2)}</strong>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      ({((margin / r.totalCustomerChargeINR) * 100).toFixed(1)}% margin)
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'bookingStatus',
              header: 'Internal Lifecycle Status',
              render: (r) => (
                <div>
                  <Badge variant={r.bookingStatus === 'DELIVERED' ? 'success' : r.bookingStatus === 'CANCELLED' ? 'danger' : 'brand'}>
                    {r.bookingStatus}
                  </Badge>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Customer: {r.customerFacingStatus}</div>
                </div>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (r) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedShipmentId(r.shipmentId)}
                >
                  Update Status
                </Button>
              ),
            },
          ]}
          data={shipments}
        />
      </Card>

      {/* Manual Status Update Modal */}
      {selectedShipmentId && (
        <Modal
          isOpen={!!selectedShipmentId}
          onClose={() => setSelectedShipmentId(null)}
          title={`Manual Status Update (${selectedShipmentId})`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Select
              label="Select Target Operational Status *"
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as any)}
              options={[
                { value: 'BOOKING_CONFIRMED', label: 'BOOKING_CONFIRMED' },
                { value: 'PENDING_API', label: 'PENDING_API' },
                { value: 'AWB_ASSIGNED', label: 'AWB_ASSIGNED' },
                { value: 'PICKUP_REQUESTED', label: 'PICKUP_REQUESTED' },
                { value: 'PICKED_UP', label: 'PICKED_UP' },
                { value: 'IN_TRANSIT', label: 'IN_TRANSIT' },
                { value: 'OUT_FOR_DELIVERY', label: 'OUT_FOR_DELIVERY' },
                { value: 'DELIVERED', label: 'DELIVERED' },
                { value: 'NDR', label: 'NDR Exception' },
                { value: 'RTO_INITIATED', label: 'RTO_INITIATED' },
                { value: 'CANCELLED', label: 'CANCELLED' },
              ]}
            />

            <Input
              label="Auditable Update Reason / Notes *"
              placeholder="e.g. Verified parcel arrival at regional linehaul hub"
              value={updateReason}
              onChange={(e) => setUpdateReason(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => setSelectedShipmentId(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleExecuteManualStatusUpdate}>
                Update Status & Write Audit Log
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
