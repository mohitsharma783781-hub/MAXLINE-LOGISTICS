import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Warehouse,
  Truck,
  Package,
  FileText,
  Printer,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Checkbox,
  Alert,
  ConfirmationDialog,
} from '../../components/ui';
import { CustomerWarehouseService, type CustomerWarehouse } from '../../services/customerWarehouseService';
import { CustomerShipmentService, type CustomerShipmentDetail } from '../../services/customerShipmentService';
import { ManifestEngine } from '../../services/manifestEngine';
import type { Manifest } from '../../types/manifests';
import { useTenant } from '../../context/TenantContext';

export const CreateManifestPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [warehouses, setWarehouses] = useState<CustomerWarehouse[]>([]);
  const [shipments, setShipments] = useState<CustomerShipmentDetail[]>([]);

  useEffect(() => {
    CustomerWarehouseService.syncFromSupabase(tenantId).catch(() => {});
    CustomerShipmentService.syncFromSupabase(tenantId).catch(() => {});

    setWarehouses(CustomerWarehouseService.getWarehouses(tenantId));
    setShipments(CustomerShipmentService.getShipments(tenantId));
  }, [tenantId]);

  const defaultWh = warehouses.find((w) => w.isDefault) || warehouses[0] || null;

  const [warehouseId, setWarehouseId] = useState<string>(defaultWh?.id || '');
  const [courierId, setCourierId] = useState<string>('delhivery');
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdManifest, setCreatedManifest] = useState<Manifest | null>(null);

  // Eligible booked parcels
  const eligibleShipments = useMemo(() => {
    return shipments.filter((s) => {
      const st = (s.bookingStatus || '').toUpperCase();
      const cf = (s.customerFacingStatus || '').toLowerCase();
      return (
        st === 'BOOKING_CONFIRMED' ||
        st === 'AWB_ASSIGNED' ||
        st === 'PICKUP_REQUESTED' ||
        st === 'BOOKED' ||
        st === 'READY_TO_SHIP' ||
        cf === 'booked' ||
        cf === 'pickup requested'
      );
    });
  }, [shipments]);

  // Auto-select eligible shipments if none currently selected
  useEffect(() => {
    if (eligibleShipments.length > 0 && selectedShipmentIds.length === 0) {
      setSelectedShipmentIds(eligibleShipments.map((s) => s.shipmentId || s.id));
    }
  }, [eligibleShipments]);

  const steps = [
    { num: 1, label: 'Warehouse Hub', icon: Warehouse },
    { num: 2, label: 'Courier Fleet', icon: Truck },
    { num: 3, label: 'Parcels List', icon: Package },
    { num: 4, label: 'Review & Generate', icon: CheckCircle2 },
  ];

  const selectedSummary = useMemo(() => {
    const list = eligibleShipments.filter((s) =>
      selectedShipmentIds.includes(s.shipmentId || s.id)
    );
    const count = list.length;
    const totalWeightKg = list.reduce(
      (acc, s) => acc + Number(s.chargeableWeightKg || s.actualWeightKg || 1.0),
      0
    );
    return { count, totalWeightKg };
  }, [eligibleShipments, selectedShipmentIds]);

  const toggleSelectShipment = (id: string) => {
    setSelectedShipmentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1 && !warehouseId) {
      errs.warehouse = 'Please select a dispatch warehouse origin.';
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
      const manifest = await ManifestEngine.createManifestFromShipments({
        warehouseId,
        courierId,
        shipmentIds: selectedShipmentIds,
        tenantId,
      });

      if (manifest) {
        setCreatedManifest(manifest);
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

  const selectedWarehouse =
    warehouses.find((w) => w.id === warehouseId) || defaultWh;

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Pickups & Manifests', path: '/app/pickups' },
    { label: 'Create Manifest', path: '/app/manifests/create' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <PageHeader
        title="Create Courier Handover Manifest"
        description="Consolidate booked dispatches into an official pickup run sheet with barcodes."
        breadcrumbs={breadcrumbs}
      />

      {/* Stepper Header */}
      <Card style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {steps.map((st, idx) => {
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            const Icon = st.icon;

            return (
              <React.Fragment key={st.num}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: isCurrent ? '#0284c7' : isCompleted ? '#16a34a' : '#64748b',
                    fontWeight: isCurrent ? '800' : '600',
                    fontSize: '12px',
                  }}
                >
                  <Icon size={14} />
                  <span>{st.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div style={{ flex: 1, height: '2px', backgroundColor: isCompleted ? '#16a34a' : '#e2e8f0', margin: '0 12px' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      {/* STEP CONTENT */}
      <Card style={{ padding: '24px' }}>
        {/* STEP 1: WAREHOUSE */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Step 1: Select Origin Warehouse Hub</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                All shipments included in this manifest will be collected from this origin hub.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {warehouses.map((wh) => (
                <div
                  key={wh.id}
                  onClick={() => setWarehouseId(wh.id)}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: warehouseId === wh.id ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    backgroundColor: warehouseId === wh.id ? '#f0f9ff' : '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{wh.warehouseName}</strong>
                    {warehouseId === wh.id && <span style={{ fontSize: '10px', color: '#0284c7', fontWeight: '800' }}>SELECTED</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                    {wh.addressLine1}, {wh.city} - <strong>{wh.pincode}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: COURIER */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Step 2: Select Courier Partner</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Choose the carrier partner whose collection van will take physical custody of these parcels.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {[
                { id: 'delhivery', name: 'Delhivery Surface Express', tag: 'Primary Fleet', icon: '🚚' },
                { id: 'delhivery_air', name: 'Delhivery Air Cargo Priority', tag: 'Air Express', icon: '✈️' },
              ].map((c) => (
                <div
                  key={c.id}
                  onClick={() => setCourierId(c.id)}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: courierId === c.id ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    backgroundColor: courierId === c.id ? '#f0f9ff' : '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '24px' }}>{c.icon}</div>
                  <strong style={{ fontSize: '14px', marginTop: '6px', display: 'block' }}>{c.name}</strong>
                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700' }}>{c.tag}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: SHIPMENTS */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Step 3: Select Dispatches to Include</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Select booked shipments ready for handover at <strong>{selectedWarehouse.warehouseName}</strong>.
              </p>
            </div>

            {eligibleShipments.length === 0 ? (
              <Alert variant="warning" title="No shipments ready for manifestation">
                Book a shipment in the Shipment Wizard first before generating manifests.
              </Alert>
            ) : (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px', width: '36px' }}>
                        <Checkbox
                          checked={
                            selectedShipmentIds.length === eligibleShipments.length &&
                            eligibleShipments.length > 0
                          }
                          onChange={() => {
                            if (selectedShipmentIds.length === eligibleShipments.length) {
                              setSelectedShipmentIds([]);
                            } else {
                              setSelectedShipmentIds(eligibleShipments.map((s) => s.shipmentId || s.id));
                            }
                          }}
                        />
                      </th>
                      <th style={{ padding: '10px' }}>AWB Number</th>
                      <th style={{ padding: '10px' }}>Order ID</th>
                      <th style={{ padding: '10px' }}>Recipient & Destination</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligibleShipments.map((s) => {
                      const sid = s.shipmentId || s.id;
                      const isChecked = selectedShipmentIds.includes(sid);
                      return (
                        <tr
                          key={sid}
                          onClick={() => toggleSelectShipment(sid)}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: isChecked ? '#f0f9ff' : 'transparent',
                            cursor: 'pointer',
                          }}
                        >
                          <td style={{ padding: '10px 12px' }}>
                            <Checkbox checked={isChecked} onChange={() => toggleSelectShipment(sid)} />
                          </td>
                          <td style={{ padding: '10px', fontWeight: '800', fontFamily: 'monospace', color: '#0284c7' }}>
                            {s.awbNumber || 'AWB-ASSIGNED'}
                          </td>
                          <td style={{ padding: '10px' }}>{s.orderId}</td>
                          <td style={{ padding: '10px' }}>
                            {s.deliveryContact} ({s.deliveryCity})
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>
                            {s.chargeableWeightKg || 1.0} KG
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: REVIEW */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Step 4: Final Manifest Verification</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Review details. Once created, you can print the A4 handover run sheet for driver sign-off.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>ORIGIN HUB</span>
                <div style={{ fontSize: '13px', fontWeight: '800', marginTop: '2px' }}>{selectedWarehouse.warehouseName}</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>{selectedWarehouse.city} - {selectedWarehouse.pincode}</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>COURIER PARTNER</span>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0284c7', marginTop: '2px' }}>DELHIVERY SURFACE</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>INCLUDED SHIPMENTS</span>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#16a34a', marginTop: '2px' }}>
                  {selectedSummary.count} Shipments ({selectedSummary.totalWeightKg.toFixed(1)} KG)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          <Button
            variant="outline"
            disabled={currentStep === 1 || isSubmitting}
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
            style={{
              backgroundColor: currentStep === 4 ? '#16a34a' : '#0284c7',
              borderColor: currentStep === 4 ? '#16a34a' : '#0284c7',
              fontWeight: '800',
            }}
          >
            {currentStep === 4 ? (isSubmitting ? 'Generating...' : 'Confirm & Generate Manifest') : 'Continue'}
          </Button>
        </div>
      </Card>

      {/* SUCCESS CONFIRMATION MODAL */}
      {createdManifest && (
        <ConfirmationDialog
          isOpen={!!createdManifest}
          onClose={() => navigate('/app/pickups')}
          onConfirm={() => navigate(`/app/manifests/${createdManifest.id}?autoPrint=1`)}
          title="Courier Manifest Generated Successfully!"
          description={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              <Alert variant="success" title="Official Handover Run Sheet Ready">
                Manifest <strong>{createdManifest.manifestNumber}</strong> has been generated for Delhivery pickup handover.
              </Alert>

              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Manifest Number: <strong style={{ color: '#0284c7', fontSize: '14px', fontFamily: 'monospace' }}>{createdManifest.manifestNumber}</strong></div>
                <div>Origin Warehouse: <strong>{createdManifest.warehouseName}</strong></div>
                <div>Courier Carrier: <strong>{createdManifest.courierName}</strong></div>
                <div>Included Shipments: <strong>{createdManifest.shipmentCount} Parcels</strong></div>
              </div>
            </div>
          }
          confirmLabel="🖨️ Print Manifest Document Now"
          cancelLabel="View Pickups & Manifests List"
          variant="primary"
        />
      )}
    </div>
  );
};
