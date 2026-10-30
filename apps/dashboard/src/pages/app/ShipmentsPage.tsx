import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  RotateCcw,
  Printer,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Table,
  Pagination,
  Input,
  ConfirmationDialog,
  Alert,
} from '../../components/ui';
import { CustomerShipmentService, type CustomerShipmentDetail } from '../../services/customerShipmentService';
import { useTenant } from '../../context/TenantContext';

export const SHIPMENT_STATUS_TABS = [
  { key: 'all', label: 'All Shipments' },
  { key: 'BOOKED', label: 'Booked' },
  { key: 'PICKUP_REQUESTED', label: 'Pickup Scheduled' },
  { key: 'PICKED_UP', label: 'Picked Up' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'NDR', label: 'NDR Exceptions' },
  { key: 'RTO', label: 'RTO Returns' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export const ShipmentsPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Cancellation State & Alert Banner
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  const { activeTenantId, scopeData } = useTenant();

  const shipments = useMemo(() => {
    const raw = CustomerShipmentService.getShipments(activeTenantId, searchQuery, activeTab);
    return scopeData(raw);
  }, [activeTenantId, searchQuery, activeTab, scopeData]);

  const handleCancelShipment = () => {
    if (!cancelTargetId) return;
    const res = CustomerShipmentService.cancelShipment(cancelTargetId, 'Merchant requested cancellation from All Shipments list');

    setIsCancelModalOpen(false);
    setCancelTargetId(null);
    setActionAlert(res.message);
    setTimeout(() => setActionAlert(null), 5000);
  };

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Shipments', path: '/app/shipments' },
  ];

  const totalPages = Math.ceil(shipments.length / pageSize) || 1;
  const paginatedShipments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return shipments.slice(start, start + pageSize);
  }, [shipments, currentPage, pageSize]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title="All Dispatched Shipments"
        description="Monitor and manage all outgoing parcel dispatches, delivery statuses, and courier tracking links."
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate('/app/orders/create')} leftIcon={<Plus size={16} />}>
            Create New Shipment
          </Button>
        }
      />

      {/* Action Notification Alert Banner */}
      {actionAlert && (
        <Alert variant="success" title="Shipment Action Completed">
          {actionAlert}
        </Alert>
      )}

      {/* Status Filter Tabs Bar */}
      <Card style={{ padding: 'var(--space-3)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', overflowX: 'auto' }}>
          {SHIPMENT_STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-default)',
                  border: 'none',
                  fontSize: 'var(--font-size-small)',
                  fontWeight: isActive ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
                  backgroundColor: isActive ? 'var(--color-violet-main)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Search Input Bar */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <Input
            placeholder="Search by AWB Number, Order ID, or Receiver Name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{ flex: 1 }}
          />
        </div>
      </Card>

      {/* Shipments Table */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <Table<CustomerShipmentDetail>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'awbNumber',
              header: 'AWB / Order ID',
              render: (row) => (
                <div>
                  <strong
                    style={{ color: 'var(--color-violet-main)', cursor: 'pointer' }}
                    onClick={() => navigate(`/app/shipments/${row.id}`)}
                  >
                    {row.awbNumber || 'PENDING AWB'}
                  </strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Order: {row.orderId}
                  </div>
                </div>
              ),
            },
            {
              key: 'deliveryContact',
              header: 'Receiver Details',
              render: (row) => (
                <div>
                  <strong>{row.deliveryContact}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    {row.deliveryCity} ({row.deliveryPincode})
                  </div>
                </div>
              ),
            },
            {
              key: 'courierName',
              header: 'Courier Partner',
              render: (row) => (
                <div>
                  <Badge variant="brand">{row.courierName}</Badge>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {row.mode} Mode
                  </div>
                </div>
              ),
            },
            {
              key: 'totalCustomerChargeINR',
              header: 'Chargeable Freight',
              render: (row) => (
                <div>
                  <strong>₹{row.totalCustomerChargeINR.toFixed(2)}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {row.chargeableWeightKg} KG billable
                  </div>
                </div>
              ),
            },
            {
              key: 'customerFacingStatus',
              header: 'Current Status',
              render: (row) => {
                const variant =
                  row.bookingStatus === 'DELIVERED'
                    ? 'success'
                    : row.bookingStatus === 'IN_TRANSIT' || row.bookingStatus === 'PICKED_UP'
                    ? 'info'
                    : row.bookingStatus === 'NDR'
                    ? 'warning'
                    : row.bookingStatus === 'RTO_INITIATED' || row.bookingStatus === 'CANCELLED'
                    ? 'danger'
                    : 'neutral';
                return <Badge variant={variant}>{row.customerFacingStatus}</Badge>;
              },
            },
            {
              key: 'bookingDate',
              header: 'Booking Date',
              render: (row) => <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{row.bookingDate}</span>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Printer size={13} />}
                    onClick={() => navigate(`/app/shipments/${row.id}/label`)}
                    title="Print Thermal Shipping Label"
                  >
                    Label
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/app/shipments/${row.id}`)}>
                    View Details
                  </Button>
                  {row.bookingStatus !== 'CANCELLED' && row.bookingStatus !== 'DELIVERED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ color: 'var(--color-danger)' }}
                      onClick={() => {
                        setCancelTargetId(row.id);
                        setIsCancelModalOpen(true);
                      }}
                      leftIcon={<RotateCcw size={13} />}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={paginatedShipments}
          emptyText="No dispatches match the selected filter query."
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </Card>

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelShipment}
        title="Cancel Shipment Dispatch?"
        description="Are you sure you want to cancel this shipment? The deducted freight charge will be refunded back to your shipping wallet."
        confirmLabel="Cancel Shipment"
        cancelLabel="Keep Active"
        variant="danger"
      />
    </div>
  );
};
