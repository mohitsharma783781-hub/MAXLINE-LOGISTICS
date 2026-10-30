import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Warehouse,
  Truck,
  Package,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Checkbox,
  Alert,
  ConfirmationDialog,
  Table,
} from '../../components/ui';
import { DEMO_WAREHOUSES } from '../../mocks/pickups.mock';
import { DEMO_SHIPMENT_ITEMS } from '../../mocks/shipments.mock';
import { demoManifestProvider } from '../../mocks/shippingOperations.mock';
import type { ManifestItem } from '../../types/shippingOperations';
import type { ShipmentItem } from '../../types/shipments';

export const CreateManifestPage: React.FC = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [warehouseId, setWarehouseId] = useState<string>('wh-001');
  const [courierId, setCourierId] = useState<string>('bluedart');
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>(['DEMO-9840192', 'DEMO-9840197']);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdManifest, setCreatedManifest] = useState<ManifestItem | null>(null);

  const steps = [
    { num: 1, label: 'Warehouse', icon: Warehouse },
    { num: 2, label: 'Courier', icon: Truck },
    { num: 3, label: 'Shipments', icon: Package },
    { num: 4, label: 'Review', icon: CheckCircle2 },
  ];

  // Eligible booked shipments for selected warehouse & courier
  const eligibleShipments = useMemo(() => {
    return DEMO_SHIPMENT_ITEMS.filter((s) => s.status === 'booked' || s.status === 'ready_to_ship');
  }, []);

  const selectedSummary = useMemo(() => {
    const list = eligibleShipments.filter((s) => selectedShipmentIds.includes(s.awb));
    const count = list.length;
    const totalWeightKg = list.reduce((acc, s) => acc + Number(s.weightKg || 0), 0);
    return { count, totalWeightKg };
  }, [eligibleShipments, selectedShipmentIds]);

  const toggleSelectShipment = (awb: string) => {
    setSelectedShipmentIds((prev) =>
      prev.includes(awb) ? prev.filter((id) => id !== awb) : [...prev, awb]
    );
  };

  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1 && !warehouseId) {
      errs.warehouse = 'Please select a warehouse origin.';
    } else if (step === 2 && !courierId) {
      errs.courier = 'Please select a courier partner for this manifest.';
    } else if (step === 3 && selectedShipmentIds.length === 0) {
      errs.shipments = 'Please select at least one shipment to include in the manifest.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirmCreate = async () => {
    setIsSubmitting(true);

    try {
      const res = await demoManifestProvider.createManifest({
        warehouseId,
        courierId,
        shipmentIds: selectedShipmentIds,
      });

      if (res.success && res.manifest) {
        setCreatedManifest(res.manifest);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((prev) => prev + 1);
      } else {
        handleConfirmCreate();
      }
    }
  };

  const selectedWarehouse = DEMO_WAREHOUSES.find((w) => w.id === warehouseId) || DEMO_WAREHOUSES[0];

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Manifests', path: '/app/manifests' },
    { label: 'Create Manifest', path: '/app/manifests/create' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title="Create Dispatch Manifest"
        description="Group ready shipments from the same warehouse origin and courier partner into a batch manifest."
        breadcrumbs={breadcrumbs}
      />

      {/* Stepper Progress Bar */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          {steps.map((st) => {
            const Icon = st.icon;
            const isActive = currentStep === st.num;
            const isCompleted = currentStep > st.num;

            return (
              <div
                key={st.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  opacity: isActive || isCompleted ? 1 : 0.4,
                  fontWeight: isActive ? 'var(--font-weight-bold)' : 'normal',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted ? 'var(--color-success)' : isActive ? 'var(--color-violet-main)' : 'var(--color-surface-secondary)',
                    color: isCompleted || isActive ? '#ffffff' : 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} />
                </div>
                <span>Step {st.num}: {st.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Wizard Content Body */}
      <Card style={{ padding: 'var(--space-6)' }}>
        {/* STEP 1: WAREHOUSE */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold' }}>Step 1: Select Pickup Warehouse</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>All shipments in a single manifest must originate from the same warehouse.</p>
            {errors.warehouse && <Alert variant="danger">{errors.warehouse}</Alert>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {DEMO_WAREHOUSES.map((wh) => (
                <Card
                  key={wh.id}
                  style={{
                    padding: 'var(--space-4)',
                    border: warehouseId === wh.id ? '2px solid var(--color-violet-main)' : '1px solid var(--color-border)',
                    backgroundColor: warehouseId === wh.id ? 'var(--color-violet-light)' : 'var(--color-surface)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setWarehouseId(wh.id)}
                >
                  <strong style={{ fontSize: 'var(--font-size-body)' }}>{wh.name}</strong>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    {wh.addressLine1}, {wh.city}, {wh.state} - {wh.pincode}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: COURIER */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold' }}>Step 2: Select Courier Partner</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>All shipments in a manifest must use the exact same courier partner for handover.</p>
            {errors.courier && <Alert variant="danger">{errors.courier}</Alert>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
              {[
                { id: 'bluedart', name: 'BlueDart Express', logo: '✈️' },
                { id: 'delhivery', name: 'Delhivery Surface', logo: '📦' },
                { id: 'fedex', name: 'FedEx Priority', logo: '⚡' },
              ].map((c) => (
                <Card
                  key={c.id}
                  style={{
                    padding: 'var(--space-4)',
                    border: courierId === c.id ? '2px solid var(--color-violet-main)' : '1px solid var(--color-border)',
                    backgroundColor: courierId === c.id ? 'var(--color-violet-light)' : 'var(--color-surface)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setCourierId(c.id)}
                >
                  <div style={{ fontSize: '20px' }}>{c.logo}</div>
                  <strong style={{ fontSize: 'var(--font-size-body)', marginTop: '8px', display: 'block' }}>{c.name}</strong>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: SHIPMENT SELECTION */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold' }}>Step 3: Select Eligible Booked Parcels</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Select booked shipments matching <strong>{selectedWarehouse.name}</strong> and <strong>{courierId.toUpperCase()}</strong>.
            </p>
            {errors.shipments && <Alert variant="danger">{errors.shipments}</Alert>}

            <Table<ShipmentItem>
              keyExtractor={(r) => r.awb}
              columns={[
                {
                  key: 'select',
                  header: 'Select',
                  render: (row) => (
                    <Checkbox
                      checked={selectedShipmentIds.includes(row.awb)}
                      onChange={() => toggleSelectShipment(row.awb)}
                    />
                  ),
                },
                { key: 'awb', header: 'AWB' },
                { key: 'customerName', header: 'Recipient' },
                { key: 'destinationCity', header: 'Destination' },
                { key: 'weightKg', header: 'Weight', render: (r) => `${r.weightKg} KG` },
              ]}
              data={eligibleShipments}
            />
          </div>
        )}

        {/* STEP 4: REVIEW */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold' }}>Step 4: Final Manifest Review</h3>

            <Card style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-secondary)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block' }}>Origin Warehouse</span>
                  <strong>{selectedWarehouse.name}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block' }}>Courier Partner</span>
                  <strong>{courierId.toUpperCase()}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block' }}>Selected Parcels</span>
                  <strong style={{ color: 'var(--color-violet-main)' }}>{selectedSummary.count} Shipments ({selectedSummary.totalWeightKg} KG)</strong>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Wizard Controls Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
          <Button
            variant="outline"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((p) => Math.max(1, p - 1))}
            leftIcon={<ArrowLeft size={16} />}
          >
            Back
          </Button>

          <Button
            variant="primary"
            onClick={handleNext}
            isLoading={isSubmitting}
            rightIcon={currentStep === 4 ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
          >
            {currentStep === 4 ? (isSubmitting ? 'Creating...' : 'Confirm & Create Manifest') : 'Continue'}
          </Button>
        </div>
      </Card>

      {/* Success Dialog */}
      {createdManifest && (
        <ConfirmationDialog
          isOpen={!!createdManifest}
          onClose={() => navigate('/app/manifests')}
          onConfirm={() => navigate(`/app/manifests/${createdManifest.manifestNumber}`)}
          title="Manifest Created Successfully!"
          description={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <Alert variant="info" title="Demo Manifest Initialized">
                Demo manifest reference created. Lock and close manifest when ready for courier handover.
              </Alert>
              <div style={{ fontSize: 'var(--font-size-body)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Manifest Reference: <strong style={{ color: 'var(--color-violet-main)' }}>{createdManifest.manifestReference}</strong></div>
                <div>Manifest ID: <strong>{createdManifest.manifestNumber}</strong></div>
                <div>Warehouse: <strong>{createdManifest.warehouseName}</strong></div>
                <div>Courier: <strong>{createdManifest.courierName}</strong></div>
                <div>Parcels Count: <strong>{createdManifest.shipmentCount} Shipments ({createdManifest.totalWeightKg} KG)</strong></div>
              </div>
            </div>
          }
          confirmLabel="View Manifest Workspace"
          cancelLabel="Go to Manifests List"
          variant="primary"
        />
      )}
    </div>
  );
};
