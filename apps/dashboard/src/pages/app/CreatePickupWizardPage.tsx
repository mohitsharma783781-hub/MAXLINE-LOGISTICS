import React, { useState, useMemo, useEffect } from 'react';
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
  FileText,
  Clock,
  MapPin,
  Check,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Input,
  Checkbox,
  Alert,
  ConfirmationDialog,
  Table,
} from '../../components/ui';
import { CustomerWarehouseService, type CustomerWarehouse } from '../../services/customerWarehouseService';
import { CustomerShipmentService, type CustomerShipmentDetail } from '../../services/customerShipmentService';
import { PickupEngine } from '../../services/pickupEngine';
import { ManifestEngine } from '../../services/manifestEngine';
import type { CreatePickupForm, PickupRequest } from '../../types/pickups';
import { formatCurrency } from '../../utils/formatters';
import { useTenant } from '../../context/TenantContext';

export const CreatePickupWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [warehouses, setWarehouses] = useState<CustomerWarehouse[]>([]);
  const [shipments, setShipments] = useState<CustomerShipmentDetail[]>([]);

  // Load real warehouses & shipments from persistent services
  useEffect(() => {
    CustomerWarehouseService.syncFromSupabase(tenantId).catch(() => {});
    CustomerShipmentService.syncFromSupabase(tenantId).catch(() => {});

    const whList = CustomerWarehouseService.getWarehouses(tenantId);
    setWarehouses(whList);

    const shpList = CustomerShipmentService.getShipments(tenantId);
    setShipments(shpList);
  }, [tenantId]);

  const defaultWh = warehouses.find((w) => w.isDefault) || warehouses[0] || null;

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [formData, setFormData] = useState<CreatePickupForm>({
    warehouseId: defaultWh?.id || '',
    selectedShipmentIds: [],
    courierId: 'delhivery',
    pickupDate: todayStr,
    timeSlot: '02:00 PM – 06:00 PM',
    contactPerson: defaultWh.contactPerson || 'Mohit Sharma',
    contactPhone: defaultWh.contactPhone || '+91 70091 74879',
    specialInstructions: 'Courier van dispatch to main loading dock. Contact warehouse manager before arrival.',
  });

  // Keep contact info updated if warehouse selection changes
  useEffect(() => {
    const selected = warehouses.find((w) => w.id === formData.warehouseId) || defaultWh;
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        contactPerson: selected.contactPerson || 'Mohit Sharma',
        contactPhone: selected.contactPhone || '+91 70091 74879',
      }));
    }
  }, [formData.warehouseId, warehouses]);

  // Ready-to-Ship Booked Shipments
  const eligibleShipments = useMemo(() => {
    return shipments.filter((s) => {
      const st = (s.bookingStatus || '').toUpperCase();
      const cf = (s.customerFacingStatus || '').toLowerCase();
      return (
        st === 'BOOKING_CONFIRMED' ||
        st === 'AWB_ASSIGNED' ||
        st === 'BOOKED' ||
        st === 'READY_TO_SHIP' ||
        cf === 'booked' ||
        cf === 'booking confirmed'
      );
    });
  }, [shipments]);

  // Auto-select eligible shipments if none currently checked
  useEffect(() => {
    if (eligibleShipments.length > 0 && formData.selectedShipmentIds.length === 0) {
      setFormData((prev) => ({
        ...prev,
        selectedShipmentIds: eligibleShipments.map((s) => s.shipmentId || s.id),
      }));
    }
  }, [eligibleShipments]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdPickupResult, setCreatedPickupResult] = useState<PickupRequest | null>(null);
  const [createdManifestId, setCreatedManifestId] = useState<string | null>(null);

  const steps = [
    { num: 1, label: 'Warehouse', icon: Warehouse },
    { num: 2, label: 'Parcels', icon: Package },
    { num: 3, label: 'Courier Partner', icon: Truck },
    { num: 4, label: 'Schedule', icon: Calendar },
    { num: 5, label: 'Review & Dispatch', icon: CheckCircle2 },
  ];

  // Selected Shipments Summary
  const selectedSummary = useMemo(() => {
    const selectedList = eligibleShipments.filter((s) =>
      formData.selectedShipmentIds.includes(s.shipmentId || s.id)
    );
    const shipmentCount = selectedList.length;
    const totalWeightKg = selectedList.reduce(
      (acc, s) => acc + Number(s.chargeableWeightKg || s.actualWeightKg || 1.0),
      0
    );
    const totalPackages = selectedList.length;
    const codValue = selectedList
      .filter((s) => String(s.paymentMode).toUpperCase() === 'COD')
      .reduce((acc, s) => acc + Number(s.codAmountINR || 0), 0);

    return { shipmentCount, totalWeightKg, totalPackages, codValue };
  }, [eligibleShipments, formData.selectedShipmentIds]);

  const toggleSelectShipment = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedShipmentIds: prev.selectedShipmentIds.includes(id)
        ? prev.selectedShipmentIds.filter((item) => item !== id)
        : [...prev.selectedShipmentIds, id],
    }));
  };

  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1 && !formData.warehouseId) {
      errs.warehouse = 'Please select a pickup origin warehouse.';
    } else if (step === 2 && formData.selectedShipmentIds.length === 0) {
      errs.shipments = 'Please select at least one booked parcel for courier pickup.';
    } else if (step === 3 && !formData.courierId) {
      errs.courier = 'Please select a courier dispatch partner.';
    } else if (step === 4) {
      if (!formData.pickupDate) errs.date = 'Pickup Date is required.';
      if (!formData.contactPerson.trim()) errs.contact = 'Contact Person name is required.';
      if (!formData.contactPhone.trim()) errs.phone = 'Contact Phone number is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirmCreatePickup = async () => {
    setIsSubmitting(true);

    try {
      const res = await PickupEngine.createPickupRequest({
        warehouseId: formData.warehouseId,
        shipmentIds: formData.selectedShipmentIds,
        courierId: formData.courierId,
        pickupDate: formData.pickupDate,
        pickupSlot: formData.timeSlot,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        specialInstructions: formData.specialInstructions,
        tenantId,
      });

      if (res.success && res.pickup) {
        setCreatedPickupResult(res.pickup);
        // Pre-generate manifest record for 1-click handover sheet
        const manifest = await ManifestEngine.generateManifest(res.pickup.id);
        if (manifest) {
          setCreatedManifestId(manifest.id);
        }
      } else {
        setErrors({ submit: res.failureReason || 'Failed to schedule pickup request with courier.' });
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

  const selectedWarehouse =
    warehouses.find((w) => w.id === formData.warehouseId) || defaultWh;

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Pickups & Manifests', path: '/app/pickups' },
    { label: 'Schedule Pickup', path: '/app/pickups/create' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Header */}
      <PageHeader
        title="Schedule Courier Pickup Dispatch"
        description="Select booked shipments and request official vehicle collection from your registered hub."
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

      {/* Stepper Card */}
      <Card style={{ padding: '16px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 'max-content', width: '100%', gap: '8px' }}>
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
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: isCurrent ? '#f0f9ff' : isCompleted ? '#f0fdf4' : 'transparent',
                    color: isCurrent ? '#0284c7' : isCompleted ? '#16a34a' : '#64748b',
                    fontWeight: isCurrent ? '800' : '600',
                    fontSize: '12px',
                    cursor: isCompleted || isCurrent ? 'pointer' : 'default',
                  }}
                >
                  <Icon size={14} />
                  <span>{st.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <div style={{ flex: 1, height: '2px', backgroundColor: isCompleted ? '#16a34a' : '#e2e8f0', minWidth: '16px' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      {/* Validation Error Alert */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="danger" title="Please resolve required fields">
          {Object.values(errors).join(' • ')}
        </Alert>
      )}

      {/* STEP CONTENT CARDS */}
      <Card style={{ padding: '24px' }}>
        {/* STEP 1: WAREHOUSE SELECTION */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                Step 1: Select Origin Dispatch Warehouse
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Select the warehouse location where Delhivery pickup executives will arrive for parcel collection.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {warehouses.map((wh) => {
                const isSelected = formData.warehouseId === wh.id;
                return (
                  <div
                    key={wh.id}
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        warehouseId: wh.id,
                        contactPerson: wh.contactPerson || 'Mohit Sharma',
                        contactPhone: wh.contactPhone || '+91 70091 74879',
                      }))
                    }
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.12)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>{wh.warehouseName}</strong>
                      {isSelected && <Badge variant="brand">Selected Hub</Badge>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
                      {wh.addressLine1}, {wh.city}, {wh.state} - <strong>{wh.pincode}</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                      👤 Contact: {wh.contactPerson || 'Mohit Sharma'} ({wh.contactPhone || '+91 70091 74879'})
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: MULTI-SHIPMENT SELECTION */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                Step 2: Select Booked Parcels for Handover
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Select shipments with generated AWBs to be assigned to this pickup vehicle dispatch.
              </p>
            </div>

            {eligibleShipments.length === 0 ? (
              <Alert variant="warning" title="No unassigned booked shipments found">
                All currently booked shipments are either already assigned or none exist yet.{' '}
                <button
                  onClick={() => navigate('/app/shipments/create')}
                  style={{ textDecoration: 'underline', fontWeight: 'bold', background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer' }}
                >
                  Click here to Book a Shipment first
                </button>
              </Alert>
            ) : (
              <>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px', width: '36px' }}>
                          <Checkbox
                            checked={
                              formData.selectedShipmentIds.length === eligibleShipments.length &&
                              eligibleShipments.length > 0
                            }
                            onChange={() => {
                              if (formData.selectedShipmentIds.length === eligibleShipments.length) {
                                setFormData((p) => ({ ...p, selectedShipmentIds: [] }));
                              } else {
                                setFormData((p) => ({
                                  ...p,
                                  selectedShipmentIds: eligibleShipments.map((s) => s.shipmentId || s.id),
                                }));
                              }
                            }}
                          />
                        </th>
                        <th style={{ padding: '10px' }}>AWB Number</th>
                        <th style={{ padding: '10px' }}>Order ID</th>
                        <th style={{ padding: '10px' }}>Consignee Destination</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Weight</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eligibleShipments.map((s) => {
                        const sid = s.shipmentId || s.id;
                        const isChecked = formData.selectedShipmentIds.includes(sid);
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
                              <Checkbox
                                checked={isChecked}
                                onChange={() => toggleSelectShipment(sid)}
                              />
                            </td>
                            <td style={{ padding: '10px', fontWeight: '800', fontFamily: 'monospace', color: '#0284c7' }}>
                              {s.awbNumber || 'AWB-ASSIGNED'}
                            </td>
                            <td style={{ padding: '10px' }}>{s.orderId}</td>
                            <td style={{ padding: '10px' }}>
                              <strong>{s.deliveryContact}</strong>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {s.deliveryCity} ({s.deliveryPincode})
                              </div>
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>
                              {s.chargeableWeightKg || 1.0} KG
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <Badge variant={String(s.paymentMode).toUpperCase() === 'COD' ? 'warning' : 'info'}>
                                {s.paymentMode}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Calculation Bar */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: '800', textTransform: 'uppercase' }}>
                      Selected Handover Parcels
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0c4a6e', margin: '2px 0 0 0' }}>
                      {selectedSummary.shipmentCount} Shipments ({selectedSummary.totalWeightKg.toFixed(1)} KG)
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#0369a1' }}>
                    <div>Packages: <strong>{selectedSummary.totalPackages} Box(es)</strong></div>
                    <div>COD Value: <strong>₹{selectedSummary.codValue.toFixed(2)}</strong></div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 3: COURIER PARTNER */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                Step 3: Select Courier Dispatch Carrier
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Delhivery First Mile (FM) fleet is authorized for direct warehouse dispatch.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {[
                {
                  id: 'delhivery',
                  name: 'Delhivery Surface Express',
                  type: 'Standard Fleet Van Dispatch',
                  eta: 'Same Day Pickup Guaranteed',
                  tag: 'Recommended Partner',
                },
                {
                  id: 'delhivery_air',
                  name: 'Delhivery Priority Air Cargo',
                  type: 'Express Dedicated Van',
                  eta: 'Priority Slot Dispatch',
                  tag: 'Air Cargo',
                },
              ].map((c) => {
                const isSelected = formData.courierId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setFormData((p) => ({ ...p, courierId: c.id }))}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>{c.name}</strong>
                      {isSelected ? <Badge variant="brand">Active</Badge> : <Badge variant="neutral">{c.tag}</Badge>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>{c.type}</div>
                    <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700', marginTop: '6px' }}>
                      ⚡ {c.eta}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: SCHEDULE & CONTACT */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                Step 4: Select Pickup Date & Slot
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Specify pickup date, convenient time window, and origin hub dispatch contact.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Pickup Date *
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, pickupDate: todayStr }))}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      border: formData.pickupDate === todayStr ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: formData.pickupDate === todayStr ? '#f0f9ff' : '#ffffff',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    📅 Today ({new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, pickupDate: tomorrowStr }))}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      border: formData.pickupDate === tomorrowStr ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: formData.pickupDate === tomorrowStr ? '#f0f9ff' : '#ffffff',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    📅 Tomorrow ({tomorrow.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Preferred Time Slot *
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['10:00 AM – 01:00 PM', '02:00 PM – 06:00 PM'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, timeSlot: slot }))}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '6px',
                        border: formData.timeSlot === slot ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        backgroundColor: formData.timeSlot === slot ? '#f0f9ff' : '#ffffff',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      ⏰ {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Input
                  label="Dispatch Contact Person *"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData((p) => ({ ...p, contactPerson: e.target.value }))}
                  placeholder="e.g. Mohit Sharma"
                />
              </div>

              <div>
                <Input
                  label="Contact Phone Number *"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData((p) => ({ ...p, contactPhone: e.target.value }))}
                  placeholder="e.g. +91 70091 74879"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & DISPATCH */}
        {currentStep === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                Step 5: Final Review & Schedule Dispatch
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Verify pickup origin, scheduled date, and package counts before dispatching to Delhivery fleet.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>ORIGIN WAREHOUSE</span>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>{selectedWarehouse.warehouseName}</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>{selectedWarehouse.city} - {selectedWarehouse.pincode}</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>COURIER FLEET</span>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0284c7', marginTop: '2px' }}>DELHIVERY SURFACE</div>
                <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700' }}>First-Mile (FM) Fleet Collection</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>SCHEDULED SLOT</span>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>{formData.pickupDate}</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>{formData.timeSlot}</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>TOTAL PARCELS</span>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#16a34a', marginTop: '2px' }}>
                  {selectedSummary.shipmentCount} Parcels ({selectedSummary.totalWeightKg.toFixed(1)} KG)
                </div>
              </div>
            </div>

            <Alert variant="info" title="Direct Delhivery Fleet Integration">
              Clicking <strong>Confirm & Dispatch Pickup</strong> sends a First-Mile scheduling request directly to Delhivery HQ. You will immediately receive a PRQ Reference number and can generate the Handover Manifest.
            </Alert>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          <Button
            variant="outline"
            disabled={currentStep === 1 || isSubmitting}
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
            style={{
              backgroundColor: currentStep === 5 ? '#16a34a' : '#0284c7',
              borderColor: currentStep === 5 ? '#16a34a' : '#0284c7',
              fontWeight: '800',
            }}
          >
            {currentStep === 5 ? (isSubmitting ? 'Dispatching...' : 'Confirm & Dispatch Pickup') : 'Continue'}
          </Button>
        </div>
      </Card>

      {/* SUCCESS CONFIRMATION DIALOG */}
      {createdPickupResult && (
        <ConfirmationDialog
          isOpen={!!createdPickupResult}
          onClose={() => navigate('/app/pickups')}
          onConfirm={() => {
            if (createdManifestId) {
              navigate(`/app/manifests/${createdManifestId}`);
            } else {
              navigate('/app/pickups');
            }
          }}
          title="Courier Pickup Scheduled Successfully!"
          description={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              <Alert variant="success" title="Delhivery Pickup Request Confirmed">
                Pickup vehicle request dispatched to Delhivery network. A courier field executive will arrive at your Panchkula hub during the scheduled window.
              </Alert>

              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Pickup Reference (PRQ): <strong style={{ color: '#0284c7', fontSize: '14px', fontFamily: 'monospace' }}>{createdPickupResult.pickupNumber}</strong></div>
                <div>Warehouse Hub: <strong>{createdPickupResult.warehouseName}</strong></div>
                <div>Scheduled Date & Slot: <strong>{createdPickupResult.pickupDate} ({createdPickupResult.timeSlot})</strong></div>
                <div>Parcels Count: <strong>{createdPickupResult.shipmentCount} Packages ({createdPickupResult.totalWeightKg} KG)</strong></div>
              </div>
            </div>
          }
          confirmLabel="📑 View & Print Handover Manifest"
          cancelLabel="Go to Pickups & Manifests"
          variant="primary"
        />
      )}
    </div>
  );
};
