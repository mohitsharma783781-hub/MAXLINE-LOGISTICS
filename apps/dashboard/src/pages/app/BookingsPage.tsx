import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Eye,
  Truck,
  Plus,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Input,
  Select,
  Table,
  Alert,
} from '../../components/ui';
import type { BookingRecord } from '../../types/booking';
import { BOOKING_STATUS_CONFIG } from '../../types/booking';
import { BookingEngine } from '../../services/bookingEngine';
import { useTenant } from '../../context/TenantContext';

export const BookingsPage: React.FC = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<BookingRecord[]>(() => BookingEngine.getAllBookings());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [retryAlert, setRetryAlert] = useState<string | null>(null);

  const { scopeData } = useTenant();

  // Filtered Data
  const filteredBookings = useMemo(() => {
    const list = bookings.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRef = b.bookingReference.toLowerCase().includes(q);
        const matchOrd = (b.orderId || '').toLowerCase().includes(q);
        const matchShp = b.shipmentId.toLowerCase().includes(q);
        const matchAwb = (b.awb || '').toLowerCase().includes(q);
        const matchCourier = b.courierName.toLowerCase().includes(q);
        if (!matchRef && !matchOrd && !matchShp && !matchAwb && !matchCourier) return false;
      }

      return true;
    });

    return scopeData(list as unknown as Record<string, unknown>[]) as unknown as BookingRecord[];
  }, [bookings, searchQuery, statusFilter, scopeData]);

  const handleRetry = async (bookingId: string) => {
    const res = await BookingEngine.retryBooking(bookingId);
    if (res.success) {
      setRetryAlert(`Booking ${res.booking.bookingReference} successfully retried! AWB assigned: ${res.awb}`);
      setBookings(BookingEngine.getAllBookings());
    }
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Bookings', path: '/app/bookings' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title="Shipment Bookings"
        description="Manage shipment booking requests, carrier assignments, AWB tracking numbers, and provider dispatch events."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={() => navigate('/app/shipments/create')}>
              + New Shipment Booking
            </Button>
          </div>
        }
      />

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard
          label="Total Booking Requests"
          value={bookings.length}
          subtext="Lifetime booking attempts"
          icon={Package}
        />
        <StatCard
          label="Successful Booked Rate"
          value="98.5%"
          subtext="Carrier acceptance rate"
          icon={CheckCircle2}
        />
        <StatCard
          label="Failed Bookings"
          value={bookings.filter((b) => b.status === 'FAILED').length}
          subtext="Requires retry or edit"
          icon={AlertCircle}
        />
        <StatCard
          label="Active Connected Couriers"
          value={4}
          subtext="Delhivery, BlueDart, DTDC, XpressBees"
          icon={Truck}
        />
      </div>

      {retryAlert && (
        <Alert variant="success" title="Booking Retried">
          {retryAlert}
        </Alert>
      )}

      {/* CONTROLS CARD */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <Input
              placeholder="Search by Booking Ref, Order ID, AWB, or Courier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All Statuses', value: 'ALL' },
              { label: 'BOOKED', value: 'BOOKED' },
              { label: 'PENDING', value: 'PENDING' },
              { label: 'FAILED', value: 'FAILED' },
              { label: 'CANCELLED', value: 'CANCELLED' },
            ]}
            style={{ width: '180px' }}
          />

          <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }} leftIcon={<RotateCcw size={14} />}>
            Reset Filters
          </Button>
        </div>
      </Card>

      {/* BOOKINGS TABLE */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <Table<BookingRecord>
          keyExtractor={(b) => b.id}
          columns={[
            {
              key: 'bookingReference',
              header: 'Booking Reference',
              render: (row) => (
                <div>
                  <strong style={{ color: 'var(--color-violet-main)' }}>{row.bookingReference}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>ID: {row.id}</div>
                </div>
              ),
            },
            {
              key: 'orderId',
              header: 'Order / Shipment ID',
              render: (row) => (
                <div>
                  <div>Ord: <strong>{row.orderId || 'N/A'}</strong></div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Shp: {row.shipmentId}</div>
                </div>
              ),
            },
            {
              key: 'courierName',
              header: 'Courier & Service',
              render: (row) => (
                <div>
                  <strong>{row.courierName}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{row.serviceName}</div>
                </div>
              ),
            },
            {
              key: 'awb',
              header: 'AWB Tracking Number',
              render: (row) =>
                row.awb ? (
                  <Badge variant="brand">{row.awb}</Badge>
                ) : (
                  <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>Not Assigned</span>
                ),
            },
            {
              key: 'status',
              header: 'Booking Status',
              render: (row) => {
                const conf = BOOKING_STATUS_CONFIG.find((c) => c.key === row.status) || {
                  label: row.status,
                  variant: 'neutral' as const,
                };
                return <Badge variant={conf.variant}>{conf.label}</Badge>;
              },
            },
            {
              key: 'totalCostMinor',
              header: 'Total Cost',
              render: (row) => <strong>₹{(row.totalCostMinor / 100).toFixed(2)}</strong>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Eye size={14} />}
                    onClick={() => navigate(`/app/bookings/${row.id}`)}
                  >
                    Details
                  </Button>
                  {row.status === 'FAILED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<RotateCcw size={14} />}
                      onClick={() => handleRetry(row.id)}
                    >
                      Retry
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={filteredBookings}
        />
      </Card>
    </div>
  );
};
