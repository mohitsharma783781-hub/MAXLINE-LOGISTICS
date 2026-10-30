import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Warehouse,
  Package,
  Truck,
  Calendar,
  Edit2,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Input,
  Radio,
  Checkbox,
  Alert,
  ConfirmationDialog,
  Table,
} from '../../components/ui';
import { DEMO_WAREHOUSES, demoPickupProvider } from '../../mocks/pickups.mock';
import { DEMO_SHIPMENT_ITEMS } from '../../mocks/shipments.mock';
import type { CreatePickupForm, PickupRequest } from '../../types/pickups';
import type { ShipmentItem } from '../../types/shipments';
import { formatCurrency } from '../../utils/formatters';

export const CreatePickupWizardPage: React.FC = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<CreatePickupForm>({
    warehouseId: 'wh-001',
    selectedShipmentIds: ['DEMO-9840192', 'DEMO-9840197'],
    courierId: 'bluedart',
    pickupDate: '2026-08-22',
    timeSlot: '10:00 AM – 02:00 PM',
    contactPerson: 'Main Warehouse Dispatch',
    contactPhone: '+91 98111 22233',
    specialInstructions: 'Vehicle must arrive at Gate 2 loading dock.',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState<boolean>(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdPickupResult, setCreatedPickupResult] = useState<PickupRequest | null>(null);

  const steps = [
    { num: 1, label: 'Warehouse', icon: Warehouse },
    { num: 2, label: 'Shipments', icon: Package },
    { num: 3, label: 'Courier', icon: Truck },
    { num: 4, label: 'Schedule', icon: Calendar },
    { num: 5, label: 'Review', icon: CheckCircle2 },
  ];

  // Ready-to-Ship Eligible Shipments List
  const eligibleShipments: ShipmentItem[] = useMemo(() => {
    return DEMO_SHIPMENT_ITEMS.filter((s) => s.status === 'ready_to_ship' || s.status === 'booked');
  }, []);

  // Multi-Shipment Calculation Summary
  const selectedSummary = useMemo(() => {
    const selectedList = eligibleShipments.filter((s: ShipmentItem) => formData.selectedShipmentIds.includes(s.awb));
    const shipmentCount = selectedList.length;
    const totalWeightKg = selectedList.reduce((acc: number, s: ShipmentItem) => acc + Number(s.weightKg || 0), 0);
    const totalPackages = selectedList.length;
    const codValue = selectedList
      .filter((s: ShipmentItem) => s.paymentMode === 'cod')
      .reduce((acc: number, s: ShipmentItem) => acc + Number(s.invoiceValue || 0), 0);

    return { shipmentCount, totalWeightKg, totalPackages, codValue };
  }, [eligibleShipments, formData.selectedShipmentIds]);

  const toggleSelectShipment = (awb: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedShipmentIds: prev.selectedShipmentIds.includes(awb)
        ? prev.selectedShipmentIds.filter((id) => id !== awb)
        : [...prev.selectedShipmentIds, awb],
    }));
  };

  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1 && !formData.warehouseId) {
      errs.warehouse = 'Please select a pickup origin warehouse.';
    } else if (step === 2 && formData.selectedShipmentIds.length === 0) {
      errs.shipments = 'Please select at least one ready-to-ship parcel for courier pickup.';
    } else if (step === 3 && !formData.courierId) {
      errs.courier = 'Please select a courier service partner.';
    } else if (step === 4) {
      if (!formData.pickupDate) errs.date = 'Pickup Date is required.';
      if (!formData.contactPerson.trim()) errs.contact = 'Contact Person is required.';
      if (!formData.contactPhone.trim()) errs.phone = 'Contact Phone is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirmCreatePickup = async () => {
    setIsSubmitting(true);

    try {
      const res = await demoPickupProvider.createPickupRequest({
        warehouseId: formData.warehouseId,
        shipmentIds: formData.selectedShipmentIds,
        courierId: formData.courierId,
        pickupDate: formData.pickupDate,
        pickupSlot: formData.timeSlot,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        specialInstructions: formData.specialInstructions,
      });

      if (res.success && res.pickup) {
        setCreatedPickupResult(res.pickup);
        setIsSuccessDialogOpen(true);
      } else if (res.failureReason) {
        setErrors({ submit: res.failureReason });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep((prev) => prev + 1);
      } else {
        handleConfirmCreatePickup();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setErrors({});
      setCurrentStep((prev) => prev - 1);
    }
  };

  const selectedWarehouse = DEMO_WAREHOUSES.find((w) => w.id === formData.warehouseId) || DEMO_WAREHOUSES[0];

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Pickup Requests', path: '/app/pickups' },
    { label: 'Request Pickup', path: '/app/pickups/create' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Header */}
      <PageHeader
        title="Request Pickup"
        description="Select ready-to-ship dispatches and schedule a courier pickup."
        breadcrumbs={breadcrumbs}
        actions={
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<XCircle size={16} />}
            onClick={() => setIsCancelDialogOpen(true)}
          >
            Cancel
          </Button>
        }
      />

      {/* Stepper */}
      <Card style={{ padding: 'var(--space-4)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 'max-content', width: '100%', gap: 'var(--space-2)' }}>
          {steps.map((st, idx) => {
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            const Icon = st.icon;

            return (
              <React.Fragment key={st.num}>
                <button
                  onClick={() => {
                    if (isCompleted || isCurrent) setCurrentStep(st.num);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-default)',
                    border: 'none',
                    backgroundColor: isCurrent
                      ? 'var(--color-violet-light)'
                      : isCompleted
                      ? 'var(--color-surface-secondary)'
                      : 'transparent',
                    color: isCurrent
                      ? 'var(--color-violet-main)'
                      : isCompleted
                      ? 'var(--color-success)'
                      : 'var(--color-text-muted)',
                    fontWeight: isCurrent ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                    fontSize: 'var(--font-size-small)',
                    cursor: isCompleted || isCurrent ? 'pointer' : 'default',
                  }}
                >
                  <Icon size={14} />
                  <span>{st.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <div style={{ flex: 1, height: '2px', backgroundColor: isCompleted ? 'var(--color-success)' : 'var(--color-border)', minWidth: '16px' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      {/* Validation Error Alert */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="danger" title="Please correct highlighted errors">
          {Object.values(errors).join(' • ')}
        </Alert>
      )}

      {/* STEP CONTENT CARDS */}
      <Card style={{ padding: 'var(--space-8)' }}>
        {/* STEP 1: WAREHOUSE SELECTION */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-bold)' }}>
                Step 1: Select Origin Pickup Warehouse
              </h3>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Choose the warehouse facility where the courier vehicle will pick up parcels.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {DEMO_WAREHOUSES.map((wh) => {
                const isSelected = formData.warehouseId === wh.id;
                return (
                  <Card
                    key={wh.id}
                    onClick={() => setFormData((p) => ({ ...p, warehouseId: wh.id, contactPerson: wh.contactPerson, contactPhone: wh.phone }))}
                    style={{
                      padding: 'var(--space-5)',
                      border: isSelected ? '2px solid var(--color-violet-main)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-violet-light)' : 'var(--color-surface)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                      <strong style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-primary)' }}>
                        {wh.name}
                      </strong>
                      {isSelected && <Badge variant="brand">Selected</Badge>}
                    </div>
                    <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
                      {wh.addressLine1}, {wh.city}, {wh.state} - {wh.pincode}
                    </p>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                      Contact: {wh.contactPerson} ({wh.phone})
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: MULTI-SHIPMENT SELECTION & CALCULATIONS */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-bold)' }}>
                Step 2: Select Ready-to-Ship Dispatches
              </h3>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Select dispatches ready for courier vehicle loading. Multiple shipments can be combined into one pickup.
              </p>
            </div>

            {eligibleShipments.length === 0 ? (
              <Alert variant="warning" title="No shipments are ready for pickup">
                Shipments must be in "Ready to Ship" status before requesting a pickup.{' '}
                <button
                  onClick={() => navigate('/app/shipments/create')}
                  style={{ textDecoration: 'underline', fontWeight: 'bold', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                >
                  Create a Shipment
                </button>
              </Alert>
            ) : (
              <>
                {/* Shipments Selection Table */}
                <Card style={{ overflow: 'hidden' }}>
                  <Table<ShipmentItem>
                    keyExtractor={(r) => r.id}
                    columns={[
                      {
                        key: 'select',
                        header: 'Select',
                        render: (r) => (
                          <Checkbox
                            checked={formData.selectedShipmentIds.includes(r.awb)}
                            onChange={() => toggleSelectShipment(r.awb)}
                          />
                        ),
                      },
                      { key: 'awb', header: 'AWB' },
                      { key: 'orderId', header: 'Order Ref' },
                      { key: 'customerName', header: 'Customer' },
                      { key: 'destinationCity', header: 'Destination' },
                      { key: 'weightKg', header: 'Weight (kg)', align: 'right', render: (r) => `${r.weightKg} kg` },
                      { key: 'paymentMode', header: 'Payment', render: (r) => <Badge variant={r.paymentMode === 'cod' ? 'warning' : 'info'}>{r.paymentMode.toUpperCase()}</Badge> },
                    ]}
                    data={eligibleShipments}
                  />
                </Card>

                {/* Live Calculations Summary Bar */}
                <Card style={{ padding: 'var(--space-5)', backgroundColor: 'var(--color-violet-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                    <div>
                      <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
                        Combined Multi-Shipment Summary
                      </span>
                      <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold', color: 'var(--color-violet-main)' }}>
                        {selectedSummary.shipmentCount} Shipments Selected
                      </h3>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-6)', fontSize: 'var(--font-size-small)' }}>
                      <div>Total Weight: <strong>{selectedSummary.totalWeightKg.toFixed(1)} kg</strong></div>
                      <div>Packages: <strong>{selectedSummary.totalPackages}</strong></div>
                      <div>COD Remittance Value: <strong>{formatCurrency(selectedSummary.codValue)}</strong></div>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {/* STEP 3: COURIER PARTNER */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-bold)' }}>
                Step 3: Courier Partner Service Allocation
              </h3>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Select courier logistics partner assigned for vehicle arrival.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
              {[
                { id: 'bluedart', name: 'BlueDart Express', type: 'Air Express Priority', cutoff: 'Daily 04:00 PM Cutoff' },
                { id: 'fedex', name: 'FedEx Express', type: 'Surface Heavy Parcel', cutoff: 'Daily 05:30 PM Cutoff' },
                { id: 'delhivery', name: 'Delhivery Surface', type: 'E-commerce Standard', cutoff: 'Daily 06:00 PM Cutoff' },
              ].map((c) => {
                const isSelected = formData.courierId === c.id;
                return (
                  <Card
                    key={c.id}
                    onClick={() => setFormData((p) => ({ ...p, courierId: c.id }))}
                    style={{
                      padding: 'var(--space-5)',
                      border: isSelected ? '2px solid var(--color-violet-main)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-violet-light)' : 'var(--color-surface)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                      <strong style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-primary)' }}>
                        {c.name}
                      </strong>
                      {isSelected && <Badge variant="brand">Selected</Badge>}
                    </div>
                    <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
                      {c.type}
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{c.cutoff}</span>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: SCHEDULE & CONTACT */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-bold)' }}>
                Step 4: Pickup Date & Time Slot Schedule
              </h3>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Specify expected courier vehicle arrival date and time window.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)' }}>
              <Input
                label="Pickup Date *"
                type="date"
                value={formData.pickupDate}
                onChange={(e) => setFormData((p) => ({ ...p, pickupDate: e.target.value }))}
                error={errors.date}
              />
              <Input
                label="Contact Person Name *"
                value={formData.contactPerson}
                onChange={(e) => setFormData((p) => ({ ...p, contactPerson: e.target.value }))}
                error={errors.contact}
              />
              <Input
                label="Contact Phone *"
                value={formData.contactPhone}
                onChange={(e) => setFormData((p) => ({ ...p, contactPhone: e.target.value }))}
                error={errors.phone}
              />
            </div>

            <div>
              <label style={{ fontSize: 'var(--font-size-small)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                Preferred Time Slot *
              </label>
              <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                <Radio
                  name="puTimeSlot"
                  label="Morning Slot (09:00 AM – 12:00 PM)"
                  checked={formData.timeSlot.includes('09:00')}
                  onChange={() => setFormData((p) => ({ ...p, timeSlot: '09:00 AM – 12:00 PM' }))}
                />
                <Radio
                  name="puTimeSlot"
                  label="Afternoon Slot (10:00 AM – 02:00 PM)"
                  checked={formData.timeSlot.includes('10:00')}
                  onChange={() => setFormData((p) => ({ ...p, timeSlot: '10:00 AM – 02:00 PM' }))}
                />
                <Radio
                  name="puTimeSlot"
                  label="Evening Slot (02:00 PM – 06:00 PM)"
                  checked={formData.timeSlot.includes('02:00')}
                  onChange={() => setFormData((p) => ({ ...p, timeSlot: '02:00 PM – 06:00 PM' }))}
                />
              </div>
            </div>

            <Input
              label="Special Instructions for Courier Driver (Optional)"
              value={formData.specialInstructions || ''}
              onChange={(e) => setFormData((p) => ({ ...p, specialInstructions: e.target.value }))}
            />
          </div>
        )}

        {/* STEP 5: REVIEW AND CONFIRM */}
        {currentStep === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-bold)' }}>
                Step 5: Review & Confirm Pickup Request
              </h3>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Review warehouse, scheduled date, and included shipments before submitting.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {/* Warehouse Card */}
              <Card style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <strong style={{ fontSize: 'var(--font-size-small)' }}>Pickup Warehouse</strong>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)} leftIcon={<Edit2 size={12} />}>Edit</Button>
                </div>
                <div style={{ fontSize: 'var(--font-size-caption)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <strong>{selectedWarehouse.name}</strong>
                  <span>{selectedWarehouse.addressLine1}, {selectedWarehouse.city}</span>
                </div>
              </Card>

              {/* Shipments Card */}
              <Card style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <strong style={{ fontSize: 'var(--font-size-small)' }}>Selected Dispatches</strong>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)} leftIcon={<Edit2 size={12} />}>Edit</Button>
                </div>
                <div style={{ fontSize: 'var(--font-size-caption)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Count: <strong>{selectedSummary.shipmentCount} Parcels</strong></span>
                  <span>Total Weight: {selectedSummary.totalWeightKg.toFixed(1)} kg</span>
                  <span>COD Value: {formatCurrency(selectedSummary.codValue)}</span>
                </div>
              </Card>

              {/* Schedule Card */}
              <Card style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <strong style={{ fontSize: 'var(--font-size-small)' }}>Schedule & Contact</strong>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(4)} leftIcon={<Edit2 size={12} />}>Edit</Button>
                </div>
                <div style={{ fontSize: 'var(--font-size-caption)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Date: <strong>{formData.pickupDate}</strong></span>
                  <span>Time Window: {formData.timeSlot}</span>
                  <span>Contact: {formData.contactPerson} ({formData.contactPhone})</span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-8)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
          <Button
            variant="outline"
            disabled={currentStep === 1}
            onClick={handleBack}
            leftIcon={<ArrowLeft size={16} />}
          >
            Back
          </Button>

          <Button
            variant="primary"
            onClick={handleNext}
            isLoading={isSubmitting}
            rightIcon={currentStep === 5 ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
          >
            {currentStep === 5 ? (isSubmitting ? 'Scheduling...' : 'Confirm & Request Pickup') : 'Continue'}
          </Button>
        </div>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={() => navigate('/app/pickups')}
        title="Discard Pickup Request?"
        description="Are you sure you want to discard this pickup request? Selected shipments and schedule choices will be cleared."
        confirmLabel="Discard Pickup"
        cancelLabel="Continue Editing"
        variant="danger"
      />

      {/* Demo Success Dialog */}
      {isSuccessDialogOpen && (
        <ConfirmationDialog
          isOpen={isSuccessDialogOpen}
          onClose={() => navigate('/app/pickups')}
          onConfirm={() => navigate(`/app/pickups/${createdPickupResult?.pickupNumber || 'PU-DEMO-001'}`)}
          title="Pickup Request Scheduled Successfully!"
          description={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <Alert variant="info" title="Demo Pickup Scheduled">
                Demo pickup request logged. Live courier driver dispatch will occur after courier API integration.
              </Alert>
              {createdPickupResult && (
                <div style={{ fontSize: 'var(--font-size-body)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>Pickup Reference: <strong style={{ color: 'var(--color-violet-main)' }}>{createdPickupResult.pickupReference}</strong></div>
                  <div>Pickup ID: <strong>{createdPickupResult.pickupNumber}</strong></div>
                  <div>Warehouse: <strong>{createdPickupResult.warehouseName}</strong></div>
                  <div>Scheduled Slot: <strong>{createdPickupResult.pickupDate} ({createdPickupResult.timeSlot})</strong></div>
                  <div>Parcels Count: <strong>{createdPickupResult.shipmentCount} Shipments ({createdPickupResult.totalWeightKg} KG)</strong></div>
                </div>
              )}
            </div>
          }
          confirmLabel="View Pickup Workspace"
          cancelLabel="Go to Pickups List"
          variant="primary"
        />
      )}
    </div>
  );
};
