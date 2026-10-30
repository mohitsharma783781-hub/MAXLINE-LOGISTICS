import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PhoneCall,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Table,
  ConfirmationDialog,
  Modal,
  Select,
  Input,
} from '../../components/ui';
import { demoExceptionProvider } from '../../mocks/exceptions.mock';
import {
  type NDRCase,
  type CustomerResponse,
  type MerchantAction,
  NDR_STATUS_CONFIG,
} from '../../types/exceptions';

export const ExceptionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<NDRCase | null>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [isReattemptModalOpen, setIsReattemptModalOpen] = useState(false);
  const [isRTOConfirmOpen, setIsRTOConfirmOpen] = useState(false);

  // Form states
  const [customerResponse, setCustomerResponse] = useState<CustomerResponse>('REQUEST_REATTEMPT');
  const [merchantAction, setMerchantAction] = useState<MerchantAction>('REATTEMPT');
  const [responseNotes, setResponseNotes] = useState('');
  const [reattemptDate, setReattemptDate] = useState('2026-08-23');
  const [reattemptSlot, setReattemptSlot] = useState('10:00 AM – 02:00 PM');
  const [reattemptNotes, setReattemptNotes] = useState('');

  useEffect(() => {
    const targetId = id || 'ndr-101';
    const match = demoExceptionProvider.getNDRCaseById(targetId);
    setDetail(match ? { ...match } : null);
  }, [id]);

  const handleSaveResponse = () => {
    if (!detail) return;
    const updated = demoExceptionProvider.updateCustomerResponse(detail.id, customerResponse, merchantAction, responseNotes);
    if (updated) setDetail({ ...updated });
    setIsResponseModalOpen(false);
  };

  const handleConfirmReattempt = () => {
    if (!detail) return;
    const res = demoExceptionProvider.scheduleReattempt(detail.id, reattemptDate, reattemptSlot, reattemptNotes);
    if (res.ndr) setDetail({ ...res.ndr });
    setIsReattemptModalOpen(false);
  };

  const handleConfirmRTO = () => {
    if (!detail) return;
    demoExceptionProvider.initiateRTO(detail.shipmentId, 'MERCHANT_REQUEST', 'RTO initiated from exception workspace');
    const updated = demoExceptionProvider.getNDRCaseById(detail.id);
    if (updated) setDetail({ ...updated });
    setIsRTOConfirmOpen(false);
  };

  const statusConfig = NDR_STATUS_CONFIG.find((c) => c.key === detail?.status) || {
    label: detail?.status || 'Open NDR',
    variant: 'warning' as const,
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'NDR & Exceptions', path: '/app/exceptions' },
    { label: detail?.id || id || 'Detail', path: `/app/exceptions/${id}` },
  ];

  if (!detail) {
    return (
      <Card style={{ padding: 'var(--space-8)' }}>
        <div>Loading exception case workspace...</div>
      </Card>
    );
  }

  const events = demoExceptionProvider.getExceptionEvents(detail.shipmentId);
  const attempts = demoExceptionProvider.getDeliveryAttempts(detail.shipmentId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title={`NDR Case #${detail.id}`}
        description={`${detail.shipmentId} • Order ${detail.orderId} • AWB ${detail.awb} (${detail.courierName})`}
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => navigate('/app/exceptions')}
            >
              Back to Exceptions
            </Button>

            {detail.status !== 'RTO_INITIATED' && detail.status !== 'CLOSED' && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<PhoneCall size={16} />}
                  onClick={() => setIsResponseModalOpen(true)}
                >
                  Record Feedback
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Calendar size={16} />}
                  onClick={() => setIsReattemptModalOpen(true)}
                >
                  Schedule Reattempt
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  style={{ color: 'var(--color-danger)' }}
                  onClick={() => setIsRTOConfirmOpen(true)}
                >
                  Initiate RTO
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Case Overview Card */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
          <div>
            <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', display: 'block' }}>
              NDR Exception Status
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: '4px' }}>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              <Badge variant="neutral">Attempt #{detail.attemptNumber}</Badge>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
            <div>Created: {detail.createdAt}</div>
            <div>Updated: {detail.updatedAt}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Buyer Contact</span>
            <div style={{ fontWeight: 'bold' }}>{detail.customerName}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>📞 {detail.maskedPhone} • {detail.destinationCity}</div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Exception Reason</span>
            <div style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>{detail.reason}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Code: {detail.reasonCode}</div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Buyer Response</span>
            <div style={{ fontWeight: 'bold' }}>{detail.customerResponse}</div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Next Scheduled Action</span>
            <div style={{ fontWeight: 'bold', color: 'var(--color-violet-main)' }}>
              {detail.nextActionAt || 'Awaiting Action'}
            </div>
          </div>
        </div>
      </Card>

      {/* Delivery Attempts Table */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
          Failed Delivery Attempts Log
        </h4>

        <Table
          keyExtractor={(r: any) => r.id}
          columns={[
            { key: 'attemptNumber', header: 'Attempt #', render: (r: any) => `Attempt #${r.attemptNumber}` },
            { key: 'attemptedAt', header: 'Attempt Date/Time' },
            { key: 'reason', header: 'Reason Text', render: (r: any) => <span style={{ color: 'var(--color-danger)' }}>{r.reason}</span> },
            { key: 'notes', header: 'Courier Agent Notes', render: (r: any) => r.notes || 'No agent notes' },
            { key: 'status', header: 'Result', render: (r: any) => <Badge variant="danger">{r.status}</Badge> },
          ]}
          data={attempts}
        />
      </Card>

      {/* Audit Timeline Log */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
          NDR Timeline & Resolution History
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {events.map((evt) => (
            <div
              key={evt.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-default)',
                backgroundColor: 'rgba(124, 58, 237, 0.05)',
                borderLeft: '3px solid var(--color-violet-main)',
              }}
            >
              <div>
                <strong style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-violet-main)' }}>
                  {evt.eventType.replace('_', ' ')}
                </strong>
                <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {evt.message}
                </p>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {evt.timestamp}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* MODALS */}
      <Modal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        title="Record Customer Feedback & Action"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Select
            label="Customer Response"
            value={customerResponse}
            onChange={(e) => setCustomerResponse(e.target.value as CustomerResponse)}
            options={[
              { value: 'REQUEST_REATTEMPT', label: 'Request Reattempt' },
              { value: 'REQUEST_RESCHEDULE', label: 'Request Reschedule' },
              { value: 'CONFIRMED_DELIVERY', label: 'Confirmed Delivery Address' },
              { value: 'REFUSED', label: 'Refused Order' },
            ]}
          />

          <Select
            label="Merchant Action"
            value={merchantAction}
            onChange={(e) => setMerchantAction(e.target.value as MerchantAction)}
            options={[
              { value: 'REATTEMPT', label: 'Schedule Reattempt' },
              { value: 'CONTACT_CUSTOMER', label: 'Contact Customer Again' },
              { value: 'CORRECT_ADDRESS', label: 'Correct Address' },
              { value: 'INITIATE_RTO', label: 'Initiate RTO Return' },
            ]}
          />

          <Input
            label="Notes"
            value={responseNotes}
            onChange={(e) => setResponseNotes(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button variant="outline" onClick={() => setIsResponseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveResponse}>
              Save Resolution
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isReattemptModalOpen}
        onClose={() => setIsReattemptModalOpen(false)}
        title="Schedule Courier Reattempt"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            label="Reattempt Date"
            type="date"
            value={reattemptDate}
            onChange={(e) => setReattemptDate(e.target.value)}
          />

          <Select
            label="Time Slot"
            value={reattemptSlot}
            onChange={(e) => setReattemptSlot(e.target.value)}
            options={[
              { value: '09:00 AM – 01:00 PM', label: '09:00 AM – 01:00 PM (Morning)' },
              { value: '10:00 AM – 02:00 PM', label: '10:00 AM – 02:00 PM (Standard)' },
              { value: '02:00 PM – 06:00 PM', label: '02:00 PM – 06:00 PM (Evening)' },
            ]}
          />

          <Input
            label="Reattempt Instructions"
            value={reattemptNotes}
            onChange={(e) => setReattemptNotes(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button variant="outline" onClick={() => setIsReattemptModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmReattempt}>
              Confirm Reattempt
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationDialog
        isOpen={isRTOConfirmOpen}
        onClose={() => setIsRTOConfirmOpen(false)}
        onConfirm={handleConfirmRTO}
        title="Initiate Return-to-Origin (RTO)?"
        description="Are you sure you want to initiate RTO for this shipment? The parcel will be returned back to the origin warehouse."
        confirmLabel="Initiate RTO"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
};
