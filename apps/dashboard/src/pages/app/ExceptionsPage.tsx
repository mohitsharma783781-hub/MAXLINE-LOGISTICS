import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  RotateCcw,
  PhoneCall,
  Calendar,
  Send,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  SearchInput,
  Select,
  Input,
  Alert,
  ConfirmationDialog,
  Modal,
} from '../../components/ui';
import {
  type NDRCase,
  type ExceptionFilterState,
  type CustomerResponse,
  type MerchantAction,
  NDR_STATUS_CONFIG,
} from '../../types/exceptions';
import { demoExceptionProvider } from '../../mocks/exceptions.mock';

export const ExceptionsPage: React.FC = () => {
  const navigate = useNavigate();

  const [ndrCases, setNdrCases] = useState<NDRCase[]>(() => demoExceptionProvider.getNDRCases());
  const [activeCase, setActiveCase] = useState<NDRCase | null>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [isReattemptModalOpen, setIsReattemptModalOpen] = useState(false);
  const [isRTOConfirmOpen, setIsRTOConfirmOpen] = useState(false);

  // Response Form Inputs
  const [customerResponse, setCustomerResponse] = useState<CustomerResponse>('REQUEST_REATTEMPT');
  const [merchantAction, setMerchantAction] = useState<MerchantAction>('REATTEMPT');
  const [responseNotes, setResponseNotes] = useState('Customer confirmed available on weekend');

  // Reattempt Form Inputs
  const [reattemptDate, setReattemptDate] = useState('2026-08-23');
  const [reattemptSlot, setReattemptSlot] = useState('10:00 AM – 02:00 PM');
  const [reattemptNotes, setReattemptNotes] = useState('Customer requested morning delivery');

  // Filter State
  const [filters, setFilters] = useState<ExceptionFilterState>({
    searchQuery: '',
    status: 'all',
    courier: 'all',
    reason: 'all',
  });

  const filteredCases = useMemo(() => {
    return demoExceptionProvider.getNDRCases(filters);
  }, [filters, ndrCases]);

  const handleResetFilters = () => {
    setFilters({ searchQuery: '', status: 'all', courier: 'all', reason: 'all' });
  };

  const handleSaveResponse = () => {
    if (!activeCase) return;
    demoExceptionProvider.updateCustomerResponse(activeCase.id, customerResponse, merchantAction, responseNotes);
    setNdrCases(demoExceptionProvider.getNDRCases());
    setIsResponseModalOpen(false);
  };

  const handleConfirmReattempt = () => {
    if (!activeCase) return;
    demoExceptionProvider.scheduleReattempt(activeCase.id, reattemptDate, reattemptSlot, reattemptNotes);
    setNdrCases(demoExceptionProvider.getNDRCases());
    setIsReattemptModalOpen(false);
  };

  const handleConfirmRTO = () => {
    if (!activeCase) return;
    demoExceptionProvider.initiateRTO(activeCase.shipmentId, 'MERCHANT_REQUEST', 'RTO initiated from NDR management panel');
    setNdrCases(demoExceptionProvider.getNDRCases());
    setIsRTOConfirmOpen(false);
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Shipments', path: '/app/shipments' },
    { label: 'NDR & Exceptions', path: '/app/exceptions' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title="NDR & Delivery Exceptions"
        description="Monitor failed delivery attempts, record buyer feedback, schedule courier reattempts and initiate Return-to-Origin (RTO)."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/rto')}>
              View RTO Dashboard →
            </Button>
          </div>
        }
      />

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard
          label="Open NDR Cases"
          value={ndrCases.filter((n) => n.status === 'OPEN').length}
          subtext="Awaiting buyer contact"
          icon={AlertTriangle}
        />
        <StatCard
          label="Action Required"
          value={ndrCases.filter((n) => n.status === 'ACTION_REQUIRED').length}
          subtext="Merchant decision needed"
          icon={PhoneCall}
        />
        <StatCard
          label="Reattempt Scheduled"
          value={ndrCases.filter((n) => n.status === 'REATTEMPT_SCHEDULED').length}
          subtext="Courier slot booked"
          icon={Calendar}
        />
        <StatCard
          label="RTO Initiated"
          value={ndrCases.filter((n) => n.status === 'RTO_INITIATED').length}
          subtext="Returning to origin"
          icon={Send}
        />
      </div>

      {/* Search & Filter Controls */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <SearchInput
              placeholder="Search by Shipment ID, AWB, Buyer Name..."
              value={filters.searchQuery}
              onChange={(e) => setFilters((p) => ({ ...p, searchQuery: e.target.value }))}
            />
          </div>

          <Select
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            options={[
              { value: 'all', label: 'All NDR Statuses' },
              { value: 'OPEN', label: 'Open NDR' },
              { value: 'ACTION_REQUIRED', label: 'Action Required' },
              { value: 'REATTEMPT_SCHEDULED', label: 'Reattempt Scheduled' },
              { value: 'RTO_INITIATED', label: 'RTO Initiated' },
            ]}
            style={{ width: '180px' }}
          />

          <Select
            value={filters.courier}
            onChange={(e) => setFilters((p) => ({ ...p, courier: e.target.value }))}
            options={[
              { value: 'all', label: 'All Couriers' },
              { value: 'delhivery', label: 'Delhivery' },
              { value: 'fedex', label: 'FedEx' },
            ]}
            style={{ width: '170px' }}
          />

          <Button variant="ghost" size="sm" onClick={handleResetFilters} leftIcon={<RotateCcw size={14} />}>
            Reset
          </Button>
        </div>
      </Card>

      {/* NDR Table */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <Table<NDRCase>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'shipmentId',
              header: 'Shipment & AWB',
              render: (row) => (
                <div>
                  <strong style={{ color: 'var(--color-violet-main)' }}>{row.shipmentId}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    AWB: {row.awb}
                  </div>
                </div>
              ),
            },
            {
              key: 'customerName',
              header: 'Recipient (Masked PII)',
              render: (row) => (
                <div>
                  <strong>{row.customerName}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    📞 {row.maskedPhone} • {row.destinationCity}
                  </div>
                </div>
              ),
            },
            {
              key: 'attemptNumber',
              header: 'Attempt',
              render: (row) => <Badge variant="neutral">Attempt #{row.attemptNumber}</Badge>,
            },
            {
              key: 'reason',
              header: 'NDR Exception Reason',
              render: (row) => (
                <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-danger)' }}>
                  {row.reason}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => {
                const conf = NDR_STATUS_CONFIG.find((c) => c.key === row.status);
                return <Badge variant={conf?.variant || 'neutral'}>{conf?.label || row.status}</Badge>;
              },
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/app/exceptions/${row.id}`)}
                  >
                    View Detail
                  </Button>

                  {row.status !== 'RTO_INITIATED' && row.status !== 'CLOSED' && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setActiveCase(row);
                          setIsResponseModalOpen(true);
                        }}
                      >
                        Action
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setActiveCase(row);
                          setIsReattemptModalOpen(true);
                        }}
                      >
                        Reattempt
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => {
                          setActiveCase(row);
                          setIsRTOConfirmOpen(true);
                        }}
                      >
                        RTO
                      </Button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
          data={filteredCases}
        />
      </Card>

      {/* CUSTOMER RESPONSE & ACTION MODAL */}
      <Modal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        title="Record Buyer Feedback & Action"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Alert variant="info" title="NDR Resolution Center">
            Record buyer response and specify merchant dispatch action.
          </Alert>

          <Select
            label="Customer Response"
            value={customerResponse}
            onChange={(e) => setCustomerResponse(e.target.value as CustomerResponse)}
            options={[
              { value: 'REQUEST_REATTEMPT', label: 'Request Reattempt' },
              { value: 'REQUEST_RESCHEDULE', label: 'Request Reschedule' },
              { value: 'CONFIRMED_DELIVERY', label: 'Confirmed Delivery Address' },
              { value: 'REFUSED', label: 'Refused Order' },
              { value: 'NO_RESPONSE', label: 'No Response / Unreachable' },
            ]}
          />

          <Select
            label="Merchant Action Taken"
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
            label="Resolution Notes"
            value={responseNotes}
            onChange={(e) => setResponseNotes(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button variant="outline" onClick={() => setIsResponseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveResponse}>
              Save NDR Resolution
            </Button>
          </div>
        </div>
      </Modal>

      {/* SCHEDULE REATTEMPT MODAL */}
      <Modal
        isOpen={isReattemptModalOpen}
        onClose={() => setIsReattemptModalOpen(false)}
        title="Schedule Courier Reattempt"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Alert variant="info" title="Courier Reattempt Slot">
            Select preferred date and delivery slot for carrier reattempt.
          </Alert>

          <Input
            label="Reattempt Date"
            type="date"
            value={reattemptDate}
            onChange={(e) => setReattemptDate(e.target.value)}
          />

          <Select
            label="Delivery Time Window"
            value={reattemptSlot}
            onChange={(e) => setReattemptSlot(e.target.value)}
            options={[
              { value: '09:00 AM – 01:00 PM', label: '09:00 AM – 01:00 PM (Morning)' },
              { value: '10:00 AM – 02:00 PM', label: '10:00 AM – 02:00 PM (Standard)' },
              { value: '02:00 PM – 06:00 PM', label: '02:00 PM – 06:00 PM (Evening)' },
            ]}
          />

          <Input
            label="Courier Reattempt Instructions"
            value={reattemptNotes}
            onChange={(e) => setReattemptNotes(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button variant="outline" onClick={() => setIsReattemptModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmReattempt}>
              Confirm Reattempt Schedule
            </Button>
          </div>
        </div>
      </Modal>

      {/* INITIATE RTO CONFIRMATION DIALOG */}
      <ConfirmationDialog
        isOpen={isRTOConfirmOpen}
        onClose={() => setIsRTOConfirmOpen(false)}
        onConfirm={handleConfirmRTO}
        title="Initiate Return-to-Origin (RTO)?"
        description="Are you sure you want to initiate RTO for this shipment? The parcel will be returned back to the warehouse origin."
        confirmLabel="Initiate RTO"
        cancelLabel="Keep Active"
        variant="danger"
      />
    </div>
  );
};
