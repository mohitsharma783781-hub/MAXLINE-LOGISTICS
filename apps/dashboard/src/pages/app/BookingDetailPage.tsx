import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Alert,
  Table,
} from '../../components/ui';
import type { BookingRecord, BookingAttempt } from '../../types/booking';
import { BOOKING_STATUS_CONFIG } from '../../types/booking';
import { BookingEngine } from '../../services/bookingEngine';

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [attempts, setAttempts] = useState<BookingAttempt[]>([]);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  useEffect(() => {
    const targetId = id || 'book-9840192';
    const record = BookingEngine.getBooking(targetId);
    setBooking(record);
    setAttempts(BookingEngine.getBookingAttempts(targetId));
  }, [id]);

  const handleRetry = async () => {
    if (!booking) return;
    const res = await BookingEngine.retryBooking(booking.id);
    if (res.success) {
      setActionAlert(`Booking retried successfully! New AWB: ${res.awb}`);
      setBooking({ ...res.booking });
      setAttempts(BookingEngine.getBookingAttempts(booking.id));
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    const res = await BookingEngine.cancelBooking(booking.id);
    if (res.success) {
      setActionAlert(res.message);
      setBooking(BookingEngine.getBooking(booking.id));
    }
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Bookings', path: '/app/bookings' },
    { label: booking?.bookingReference || id || 'Detail', path: `/app/bookings/${id}` },
  ];

  if (!booking) {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <Alert variant="danger" title="Booking Record Not Found">
          The requested booking reference does not exist or has been removed.
        </Alert>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/bookings')} style={{ marginTop: 'var(--space-4)' }}>
          Back to Bookings
        </Button>
      </div>
    );
  }

  const statusConfig = BOOKING_STATUS_CONFIG.find((c) => c.key === booking.status) || {
    label: booking.status,
    variant: 'neutral' as const,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title={`Booking ${booking.bookingReference}`}
        description={`Order Ref: ${booking.orderId || 'N/A'} • Shipment ID: ${booking.shipmentId} • Requested At: ${booking.requestedAt}`}
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/bookings')} leftIcon={<ArrowLeft size={16} />}>
              Back to Bookings
            </Button>
            {booking.status === 'FAILED' && (
              <Button variant="primary" size="sm" onClick={handleRetry} leftIcon={<RotateCcw size={16} />}>
                Retry Booking
              </Button>
            )}
            {booking.status === 'BOOKED' && (
              <Button variant="outline" size="sm" onClick={handleCancel} style={{ color: 'var(--color-danger)' }}>
                Cancel Booking
              </Button>
            )}
          </div>
        }
      />

      {actionAlert && (
        <Alert variant="success" title="Action Completed">
          {actionAlert}
        </Alert>
      )}

      {/* HEADER SUMMARY CARD */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-default)', backgroundColor: 'var(--color-violet-light)', color: 'var(--color-violet-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold' }}>{booking.bookingReference}</h3>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>
              <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>
                Courier: <strong>{booking.courierName} ({booking.serviceName})</strong>
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>AWB Number:</div>
            <div style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold', color: 'var(--color-violet-main)' }}>
              {booking.awb || 'Not Assigned'}
            </div>
          </div>
        </div>
      </Card>

      {/* DETAILED INFORMATION GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
        {/* PROVIDER DETAILS CARD */}
        <Card style={{ padding: 'var(--space-6)' }}>
          <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>
            Carrier & Provider Reference
          </h4>
          <div style={{ fontSize: 'var(--font-size-small)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div>Courier Partner: <strong>{booking.courierName}</strong></div>
            <div>Courier Code: <strong>{booking.courierCode}</strong></div>
            <div>Provider Ref: <strong>{booking.providerReference || 'N/A'}</strong></div>
            <div>AWB Status: <Badge variant={booking.awbStatus === 'ASSIGNED' ? 'success' : 'neutral'}>{booking.awbStatus}</Badge></div>
            <div>Idempotency Key: <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{booking.idempotencyKey}</span></div>
          </div>
        </Card>

        {/* ROUTE & CHARGES CARD */}
        <Card style={{ padding: 'var(--space-6)' }}>
          <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>
            Route & Payment Details
          </h4>
          <div style={{ fontSize: 'var(--font-size-small)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div>Origin Pincode: <strong>{booking.originPincode}</strong></div>
            <div>Destination Pincode: <strong>{booking.destinationPincode}</strong></div>
            <div>Payment Mode: <Badge variant="info">{booking.paymentMode}</Badge></div>
            <div>Total Cost: <strong>₹{(booking.totalCostMinor / 100).toFixed(2)}</strong></div>
            <div>Booked At: <strong>{booking.bookedAt || 'N/A'}</strong></div>
          </div>
        </Card>
      </div>

      {/* BOOKING ATTEMPTS LOG TABLE */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
          Booking Attempts & Dispatch History
        </h4>
        <Table<BookingAttempt>
          keyExtractor={(a) => a.id}
          columns={[
            {
              key: 'attemptNumber',
              header: 'Attempt #',
              render: (row) => <strong>#{row.attemptNumber}</strong>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge variant={row.status === 'BOOKED' ? 'success' : 'danger'}>{row.status}</Badge>,
            },
            {
              key: 'requestId',
              header: 'Request Reference',
              render: (row) => <span style={{ fontFamily: 'monospace' }}>{row.requestId}</span>,
            },
            {
              key: 'providerReference',
              header: 'Provider Response AWB',
              render: (row) => <span>{row.providerReference || 'N/A'}</span>,
            },
            {
              key: 'createdAt',
              header: 'Timestamp',
              render: (row) => <span>{row.createdAt}</span>,
            },
          ]}
          data={attempts}
        />
      </Card>
    </div>
  );
};
