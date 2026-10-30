import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, QrCode } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button, Card, Alert, Badge } from '../../components/ui';
import { CustomerShipmentService } from '../../services/customerShipmentService';
import { useTenant } from '../../context/TenantContext';

export const ShipmentLabelPage: React.FC = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const navigate = useNavigate();
  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId;

  const shipment =
    CustomerShipmentService.getShipmentById(shipmentId || '', tenantId) ||
    CustomerShipmentService.getShipmentById(shipmentId || '') || {
    shipmentId: shipmentId || 'SHP-ORD-2026-9041',
    awbNumber: 'DEL847192031',
    orderId: 'ORD-2026-9041',
    courierName: 'Delhivery Surface',
    serviceName: 'Express Surface',
    pickupContact: 'Rajesh Sharma',
    pickupAddress: 'Plot 42, Industrial Area Phase 1',
    pickupCity: 'New Delhi',
    pickupPincode: '110001',
    deliveryContact: 'Ankit Mehta',
    deliveryAddress: 'Block C, MG Road',
    deliveryCity: 'Bengaluru',
    deliveryPincode: '560038',
    chargeableWeightKg: 1.5,
    paymentMode: 'PREPAID',
    codAmountINR: 0,
    bookingStatus: 'BOOKED',
  };

  const [isDownloading, setIsDownloading] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCarrierPdf = () => {
    window.print();
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Shipments', path: '/app/shipments' },
    { label: shipment.awbNumber || shipment.shipmentId, path: `/app/shipments/${shipment.shipmentId}` },
    { label: 'Shipping Label', path: `/app/shipments/${shipment.shipmentId}/label` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      <PageHeader
        title={`Shipping Label - ${shipment.awbNumber}`}
        description="Print-ready 4x6 thermal shipping barcode label."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isDownloading}
              leftIcon={<Download size={16} />}
              onClick={handleDownloadCarrierPdf}
            >
              {isDownloading ? 'Downloading...' : 'Download PDF Label'}
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Printer size={16} />} onClick={handlePrint}>
              Print Label
            </Button>
          </div>
        }
      />

      <Alert variant="info" title="Thermal 4x6 Barcode Shipping Label">
        Official courier dispatch barcode. Compatible with TSC, Zebra, Rollo, and laser printers. Click Print Label or Download PDF to generate physical package slips.
      </Alert>

      <Card style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--color-surface-secondary)' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: '#ffffff',
            border: '2px solid #000000',
            borderRadius: '4px',
            padding: '20px',
            color: '#000000',
            fontFamily: 'monospace',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Label Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #000', paddingBottom: '10px' }}>
            <strong style={{ fontSize: '18px' }}>{shipment.courierName}</strong>
            <Badge variant="brand">{shipment.paymentMode}</Badge>
          </div>

          {/* Barcode & AWB */}
          <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '2px dashed #000' }}>
            <QrCode size={64} style={{ margin: '0 auto' }} />
            <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px', marginTop: '8px' }}>
              {shipment.awbNumber}
            </div>
            <div style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>
              ORDER REF: {shipment.orderId}
            </div>
          </div>

          {/* Addresses */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '11px', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '12px', marginBottom: '2px' }}>SHIP FROM:</strong>
              <div>{shipment.pickupContact}</div>
              <div>{shipment.pickupAddress}</div>
              <div>{shipment.pickupCity} - {shipment.pickupPincode}</div>
            </div>

            <div>
              <strong style={{ display: 'block', fontSize: '12px', marginBottom: '2px' }}>SHIP TO:</strong>
              <div>{shipment.deliveryContact}</div>
              <div>{shipment.deliveryAddress}</div>
              <div>{shipment.deliveryCity} - <strong>{shipment.deliveryPincode}</strong></div>
            </div>
          </div>

          {/* Footer details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
            <span>WEIGHT: {shipment.chargeableWeightKg} KG</span>
            <span>TYPE: {shipment.paymentMode}</span>
          </div>

          <div style={{ textAlign: 'center', fontSize: '10px', color: '#666', borderTop: '1px solid #ccc', paddingTop: '8px' }}>
            AGGREGATOR PLATFORM • DEMO LABEL PLACEHOLDER
          </div>
        </div>
      </Card>
    </div>
  );
};
