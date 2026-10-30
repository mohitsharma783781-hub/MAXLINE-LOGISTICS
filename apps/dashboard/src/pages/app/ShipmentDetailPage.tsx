import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  XCircle,
  Wallet,
  Copy,
  Check,
  Printer,
  Download,
  ShieldCheck,
  Clock,
  User,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Alert,
  ConfirmationDialog,
} from '../../components/ui';
import { CustomerShipmentService, type CustomerShipmentDetail } from '../../services/customerShipmentService';
import { WeightDiscrepancyService, type WeightDiscrepancyRecord } from '../../services/weightDiscrepancyService';
import { useTenant } from '../../context/TenantContext';

export const JOURNEY_STEPS = [
  'Order Created',
  'Pickup Scheduled',
  'Picked Up',
  'In Transit',
  'Reached Hub',
  'Out For Delivery',
  'Delivered',
];

export const ShipmentDetailPage: React.FC = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const navigate = useNavigate();
  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId;

  const [shipment, setShipment] = useState<CustomerShipmentDetail | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [, setDiscrepancy] = useState<WeightDiscrepancyRecord | null>(null);
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  useEffect(() => {
    const targetId = shipmentId || 'SHP-ORD-2026-9041';
    const detail = CustomerShipmentService.getShipmentById(targetId, tenantId) || CustomerShipmentService.getShipmentById(targetId);
    setShipment(detail);

    if (detail && detail.awbNumber) {
      const disc = WeightDiscrepancyService.getDiscrepancyByAwb(detail.awbNumber);
      setDiscrepancy(disc);
    }
  }, [shipmentId, tenantId]);

  const handleCopyAwb = (awb: string) => {
    navigator.clipboard.writeText(awb);
    setCopiedAwb(awb);
    setTimeout(() => setCopiedAwb(null), 2000);
  };

  const handleConfirmCancel = () => {
    if (!shipment) return;
    const res = CustomerShipmentService.cancelShipment(shipment.shipmentId, 'Merchant requested cancellation', tenantId);
    setIsCancelModalOpen(false);
    if (res.success) {
      const updated = CustomerShipmentService.getShipmentById(shipment.shipmentId, tenantId) || CustomerShipmentService.getShipmentById(shipment.shipmentId);
      setShipment(updated);
    }
    setActionAlert(res.message);
    setTimeout(() => setActionAlert(null), 5000);
  };

  const isCancellable = shipment ? ['BOOKED', 'PICKUP_REQUESTED'].includes(shipment.bookingStatus) : false;

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Shipments Center', path: '/app/orders' },
    { label: shipment?.awbNumber || shipmentId || 'Shipment Details', path: `/app/shipments/${shipmentId}` },
  ];

  if (!shipment) {
    return (
      <div style={{ padding: '24px' }}>
        <PageHeader title="Shipment Not Found" breadcrumbs={breadcrumbs} />
        <Alert variant="danger" title="Shipment Record Missing">
          The requested shipment details could not be located in your merchant workspace.
        </Alert>
        <Button variant="outline" style={{ marginTop: '16px' }} onClick={() => navigate('/app/orders')}>
          Back to Orders & Shipments
        </Button>
      </div>
    );
  }

  // Calculate current journey step index
  const getJourneyStepIndex = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 6;
      case 'OUT_FOR_DELIVERY':
        return 5;
      case 'IN_TRANSIT':
        return 3;
      case 'PICKED_UP':
        return 2;
      case 'PICKUP_REQUESTED':
        return 1;
      case 'BOOKED':
      default:
        return 0;
    }
  };

  const currentStepIdx = getJourneyStepIndex(shipment.bookingStatus);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. Page Header */}
      <PageHeader
        title={`Shipment Details — AWB #${shipment.awbNumber}`}
        description={`Order Ref: ${shipment.orderId} • Courier: ${shipment.courierName} • Booked: ${shipment.bookingDate}`}
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft size={14} />}
              onClick={() => navigate('/app/orders')}
            >
              Back to Orders
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Search size={14} />}
              onClick={() => navigate(`/app/tracking?query=${shipment.awbNumber}`)}
              style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            >
              Open Full Tracking Center
            </Button>
          </div>
        }
      />

      {actionAlert && (
        <Alert variant="info" title="Shipment Status Updated">
          {actionAlert}
        </Alert>
      )}

      {/* 2. Top Header Summary & Action Toolbar */}
      <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px' }}>
              {shipment.courierName.charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{shipment.courierName}</h3>
                <Badge variant={shipment.bookingStatus === 'CANCELLED' ? 'danger' : shipment.bookingStatus === 'DELIVERED' ? 'success' : 'brand'}>
                  {shipment.bookingStatus}
                </Badge>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>AWB: <strong style={{ fontFamily: 'monospace', color: '#0284c7' }}>{shipment.awbNumber}</strong></span>
                <button
                  onClick={() => handleCopyAwb(shipment.awbNumber || '')}
                  title="Copy AWB"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedAwb === shipment.awbNumber ? '#16a34a' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '2px' }}
                >
                  {copiedAwb === shipment.awbNumber ? <Check size={12} /> : <Copy size={12} />}
                  <span style={{ fontSize: '10px' }}>{copiedAwb === shipment.awbNumber ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer size={13} />}
              onClick={() => navigate(`/app/shipments/${shipment.shipmentId || shipment.id}/label`)}
            >
              Print Label
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download size={13} />}
              onClick={() => alert(`Downloading Invoice for Order ${shipment.orderId}...`)}
            >
              Download Invoice
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<ShieldCheck size={13} />}
              onClick={() => alert(`Downloading Proof of Delivery (POD)...`)}
            >
              Download POD
            </Button>

            {isCancellable && (
              <Button
                variant="ghost"
                size="sm"
                style={{ color: '#ef4444' }}
                onClick={() => setIsCancelModalOpen(true)}
              >
                <XCircle size={13} /> Cancel & Refund
              </Button>
            )}
          </div>
        </div>

        {/* SHIPMENT JOURNEY PROGRESS BAR */}
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '12px', textTransform: 'uppercase' }}>
            Shipment Journey Progress
          </h4>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflowX: 'auto' }}>
            <div style={{ position: 'absolute', top: '12px', left: '16px', right: '16px', height: '3px', backgroundColor: '#e2e8f0', zIndex: 0 }} />

            {JOURNEY_STEPS.map((stepName, idx) => {
              const isCompleted = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 1, minWidth: '85px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: isCurrent ? '#0284c7' : isCompleted ? '#16a34a' : '#ffffff',
                      border: '2px solid ' + (isCurrent ? '#0284c7' : isCompleted ? '#16a34a' : '#cbd5e1'),
                      color: isCurrent || isCompleted ? '#ffffff' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: '800',
                    }}
                  >
                    {isCompleted ? <Check size={12} /> : idx + 1}
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: isCurrent ? '800' : isCompleted ? '600' : '400', color: isCurrent ? '#0284c7' : isCompleted ? '#0f172a' : '#94a3b8', textAlign: 'center' }}>
                    {stepName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* 3. VERTICAL TIMELINE & SPECS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* LEFT: Tracking Timeline */}
        <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} style={{ color: '#0284c7' }} /> Visual Tracking Timeline
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', paddingLeft: '20px' }}>
            <div style={{ position: 'absolute', left: '6px', top: '6px', bottom: '6px', width: '2px', backgroundColor: '#cbd5e1' }} />

            {shipment.trackingTimeline.map((evt, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '-20px',
                    top: '2px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: evt.completed ? '#16a34a' : '#cbd5e1',
                    border: '2px solid #ffffff',
                  }}
                />

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>{evt.statusTitle}</strong>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{evt.timestamp}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#475569', margin: '2px 0 0 0' }}>{evt.description}</p>
                  <div style={{ fontSize: '10px', color: '#0284c7', fontWeight: '600', marginTop: '2px' }}>Location: {evt.location}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* RIGHT: Financial Breakdown & Weight Audit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Financial Breakdown */}
          <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wallet size={16} style={{ color: '#0284c7' }} /> Financial & Charge Breakdown
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Base Freight Charge:</span>
                <span>₹ {shipment.baseFreightINR.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Fuel Surcharge:</span>
                <span>₹ {shipment.fuelSurchargeINR.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Payment Mode:</span>
                <Badge variant={shipment.paymentMode === 'COD' ? 'warning' : 'info'}>{shipment.paymentMode}</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '8px', fontWeight: '800', fontSize: '15px', color: '#0284c7' }}>
                <span>Total Freight Amount:</span>
                <span>₹ {shipment.totalCustomerChargeINR.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Receiver & Destination Info */}
          <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={16} style={{ color: '#0284c7' }} /> Receiver Contact & Destination
            </h4>

            <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>Consignee: <strong>{shipment.deliveryContact}</strong></div>
              <div>Phone: <strong>{shipment.deliveryPhone}</strong></div>
              <div>Address: {shipment.deliveryAddress}, {shipment.deliveryCity} - <strong>{shipment.deliveryPincode}</strong></div>
            </div>
          </Card>

        </div>
      </div>

      <ConfirmationDialog
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Shipment Booking?"
        description={`Are you sure you want to cancel shipment #${shipment.awbNumber}? Base freight charges will be refunded to your wallet.`}
        confirmLabel="Confirm Cancellation"
        variant="danger"
      />

    </div>
  );
};
