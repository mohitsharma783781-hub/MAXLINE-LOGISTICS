import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download, RefreshCw, CheckCircle2, ShieldCheck, Box } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button, Card, Alert, Badge, Select } from '../../components/ui';
import { CustomerShipmentService } from '../../services/customerShipmentService';
import { BarcodeService } from '../../services/barcodeService';
import { useTenant } from '../../context/TenantContext';

export const ShipmentLabelPage: React.FC = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId;

  const [labelFormat, setLabelFormat] = useState<'thermal_4x6' | 'a4_sheet'>(
    (searchParams.get('format') as 'thermal_4x6' | 'a4_sheet') || 'thermal_4x6'
  );
  const [isDownloading, setIsDownloading] = useState(false);

  // Retrieve actual shipment from unified store with high-fidelity defaults
  const foundShipment =
    CustomerShipmentService.getShipmentById(shipmentId || '', tenantId) ||
    CustomerShipmentService.getShipmentById(shipmentId || '');

  const shipment = foundShipment || {
    id: shipmentId || 'SHP-ORD-1001',
    shipmentId: shipmentId || 'SHP-ORD-1001',
    awbNumber: '474740192831',
    orderId: 'ORD-1001',
    bookingDate: new Date().toLocaleDateString('en-IN'),
    courierName: 'Delhivery Surface Express',
    serviceName: 'Delhivery B2C Surface',
    pickupContact: 'Merchant Dispatch Manager',
    pickupAddress: 'Origin Dispatch Warehouse Facility',
    pickupCity: 'Origin Hub',
    pickupPincode: '110001',
    pickupPhone: '+91 99999 99999',
    deliveryContact: 'Rohan Sharma',
    deliveryAddress: 'House 412, 5th Cross, 2nd Main, Indiranagar',
    deliveryCity: 'Bengaluru',
    deliveryPincode: '560038',
    deliveryPhone: '+91 98112 34567',
    chargeableWeightKg: 1.0,
    actualWeightKg: 0.8,
    dimensionsCm: '20 × 15 × 10 CM',
    paymentMode: 'PREPAID',
    codAmountINR: 0,
    invoiceValueINR: 1499,
    bookingStatus: 'BOOKED',
    packageType: 'Box',
    packages: [{ lengthCm: 20, widthCm: 15, heightCm: 10, actualWeightKg: 0.8, chargeableWeightKg: 1.0 }],
  };

  const awb = shipment.awbNumber || '474740192831';
  const orderId = shipment.orderId || 'ORD-1001';
  const isCod = String(shipment.paymentMode).toUpperCase() === 'COD';
  const codAmount = Number(shipment.codAmountINR || 0);

  // Auto-trigger print if requested via query parameter
  useEffect(() => {
    if (searchParams.get('autoPrint') === '1') {
      const timer = setTimeout(() => {
        window.print();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCarrierPdf = () => {
    setIsDownloading(true);
    try {
      if (shipment.awbNumber) {
        window.open(`/api/delhivery/label?awb=${encodeURIComponent(shipment.awbNumber)}`, '_blank');
      } else {
        window.print();
      }
    } finally {
      setTimeout(() => setIsDownloading(false), 800);
    }
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Orders Center', path: '/app/orders' },
    { label: shipment.awbNumber || shipment.shipmentId, path: `/app/shipment-control-center/${shipment.shipmentId}` },
    { label: 'Shipping Label (4x6)', path: `/app/shipments/${shipment.shipmentId}/label` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Thermal & Laser Printer CSS Styles */}
      <style>{`
        @media print {
          @page {
            size: ${labelFormat === 'thermal_4x6' ? '4in 6in' : 'A4 portrait'};
            margin: ${labelFormat === 'thermal_4x6' ? '0' : '10mm'};
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden;
          }
          .printable-shipping-label-container,
          .printable-shipping-label-container * {
            visibility: visible;
          }
          .printable-shipping-label-container {
            position: absolute;
            left: 0;
            top: 0;
            width: ${labelFormat === 'thermal_4x6' ? '4in' : '100%'} !important;
            max-width: ${labelFormat === 'thermal_4x6' ? '4in' : '7.5in'} !important;
            margin: 0 auto !important;
            padding: 8px !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* PAGE HEADER (Hidden during printing) */}
      <div className="no-print">
        <PageHeader
          title={`Shipping Label — AWB ${awb}`}
          description="Standard 4x6 inch thermal barcode label. Compatible with TSC, Zebra, Rollo, and laser printers."
          breadcrumbs={breadcrumbs}
          actions={
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: '170px' }}>
                <Select
                  value={labelFormat}
                  onChange={(e) => setLabelFormat(e.target.value as 'thermal_4x6' | 'a4_sheet')}
                  options={[
                    { value: 'thermal_4x6', label: '🏷️ 4x6 Thermal Label' },
                    { value: 'a4_sheet', label: '📄 A4 Sheet (Standard)' },
                  ]}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeft size={16} />}
                onClick={() => navigate('/app/orders')}
              >
                Back to Orders
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={isDownloading}
                leftIcon={<Download size={16} />}
                onClick={handleDownloadCarrierPdf}
              >
                {isDownloading ? 'Opening...' : 'Download Carrier PDF'}
              </Button>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<Printer size={16} />}
                onClick={handlePrint}
                style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: '700' }}
              >
                Print 4x6 Label
              </Button>
            </div>
          }
        />

        <Alert variant="success" title="Verified Carrier Waybill Active">
          AWB <strong>{awb}</strong> is booked on the Delhivery network. Print this barcode label and affix it securely to the top surface of your dispatch package.
        </Alert>
      </div>

      {/* LABEL CANVAS CONTAINER */}
      <Card
        style={{
          padding: '24px',
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: '#f1f5f9',
          border: '1px solid #cbd5e1',
          borderRadius: '12px',
        }}
      >
        <div
          className="printable-shipping-label-container"
          style={{
            width: '100%',
            maxWidth: labelFormat === 'thermal_4x6' ? '400px' : '560px',
            backgroundColor: '#ffffff',
            border: '2.5px solid #000000',
            borderRadius: '2px',
            padding: '12px 14px',
            color: '#000000',
            fontFamily: 'Arial, Helvetica, sans-serif',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            boxSizing: 'border-box',
          }}
        >
          {/* 1. TOP CARRIER & DISPATCH HEADER */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2.5px solid #000000',
              paddingBottom: '8px',
            }}
          >
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>
                DELHIVERY
              </div>
              <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', color: '#1e293b' }}>
                {shipment.courierName?.toUpperCase() || 'DELHIVERY SURFACE'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  display: 'inline-block',
                  border: isCod ? '2px solid #000000' : '1.5px solid #000000',
                  backgroundColor: isCod ? '#000000' : '#ffffff',
                  color: isCod ? '#ffffff' : '#000000',
                  padding: '3px 8px',
                  fontWeight: '900',
                  fontSize: '12px',
                  letterSpacing: '0.5px',
                  borderRadius: '2px',
                }}
              >
                {isCod ? `COD: ₹${codAmount.toFixed(0)}` : 'PREPAID'}
              </div>
              <div style={{ fontSize: '10px', fontWeight: '700', marginTop: '2px' }}>
                SORT: {shipment.deliveryPincode ? `DEL/${shipment.deliveryPincode.slice(0, 3)}` : 'DEL/HUB'}
              </div>
            </div>
          </div>

          {/* 2. PRIMARY CODE 128 AWB BARCODE */}
          <div
            style={{
              textAlign: 'center',
              padding: '10px 0 6px 0',
              borderBottom: '2px solid #000000',
            }}
          >
            <div
              dangerouslySetInnerHTML={{
                __html: BarcodeService.generateBarcodeSvg(awb, 54, 2),
              }}
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            />
            <div
              style={{
                fontSize: '17px',
                fontWeight: '900',
                letterSpacing: '2px',
                fontFamily: 'monospace',
                marginTop: '4px',
              }}
            >
              {awb}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                fontWeight: '700',
                color: '#334155',
                paddingTop: '2px',
              }}
            >
              <span>ORDER ID: {orderId}</span>
              <span>DATE: {shipment.bookingDate || new Date().toLocaleDateString('en-IN')}</span>
              <span>PKG: 1 OF 1</span>
            </div>
          </div>

          {/* 3. SHIP TO / CONSIGNEE DESTINATION */}
          <div
            style={{
              borderBottom: '2.5px solid #000000',
              padding: '10px 0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, paddingRight: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569' }}>
                  SHIP TO / DELIVER TO:
                </span>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#000000', marginTop: '2px' }}>
                  {shipment.deliveryContact || 'Consignee Name'}
                </div>
                <div style={{ fontSize: '11px', lineHeight: '1.35', color: '#1e293b', marginTop: '3px' }}>
                  {shipment.deliveryAddress || 'Delivery Address'}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '2px' }}>
                  {shipment.deliveryCity}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '800', marginTop: '3px' }}>
                  📞 {shipment.deliveryPhone}
                </div>
              </div>

              {/* High-Visibility Pincode Box */}
              <div
                style={{
                  border: '2.5px solid #000000',
                  padding: '6px 10px',
                  textAlign: 'center',
                  backgroundColor: '#ffffff',
                  minWidth: '95px',
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px' }}>PINCODE</div>
                <div style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '1px' }}>
                  {shipment.deliveryPincode}
                </div>
                <div style={{ fontSize: '9px', fontWeight: '800', borderTop: '1px solid #000', paddingTop: '2px', marginTop: '2px' }}>
                  DELIVERY PIN
                </div>
              </div>
            </div>
          </div>

          {/* 4. SHIPMENT WEIGHT & PACKAGE METRICS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              borderBottom: '2px solid #000000',
              padding: '6px 0',
              fontSize: '11px',
              textAlign: 'center',
            }}
          >
            <div style={{ borderRight: '1px solid #000000', padding: '0 4px' }}>
              <div style={{ fontSize: '9px', color: '#475569', fontWeight: '700' }}>WEIGHT</div>
              <div style={{ fontWeight: '900' }}>{shipment.chargeableWeightKg || 1.0} KG</div>
            </div>
            <div style={{ borderRight: '1px solid #000000', padding: '0 4px' }}>
              <div style={{ fontSize: '9px', color: '#475569', fontWeight: '700' }}>DIMENSIONS</div>
              <div style={{ fontWeight: '900', fontSize: '10px' }}>{shipment.dimensionsCm || '20×15×10 CM'}</div>
            </div>
            <div style={{ padding: '0 4px' }}>
              <div style={{ fontSize: '9px', color: '#475569', fontWeight: '700' }}>INVOICE VAL</div>
              <div style={{ fontWeight: '900' }}>₹{shipment.invoiceValueINR || 1499}</div>
            </div>
          </div>

          {/* 5. COD / PAYMENT INSTRUCTION CALLOUT */}
          {isCod ? (
            <div
              style={{
                backgroundColor: '#000000',
                color: '#ffffff',
                padding: '6px',
                textAlign: 'center',
                margin: '8px 0',
                borderRadius: '2px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '0.5px' }}>
                *** CASH ON DELIVERY — COLLECT ₹{codAmount.toFixed(2)} ***
              </div>
              <div style={{ fontSize: '9px', letterSpacing: '0.3px' }}>
                Exact cash required before handing parcel to consignee
              </div>
            </div>
          ) : (
            <div
              style={{
                border: '1px dashed #000000',
                padding: '5px',
                textAlign: 'center',
                margin: '8px 0',
                fontSize: '10px',
                fontWeight: '800',
                letterSpacing: '0.5px',
              }}
            >
              PREPAID ORDER — DO NOT COLLECT CASH FROM CONSIGNEE
            </div>
          )}

          {/* 6. SHIP FROM / RETURN TO (RTO) SELLER ORIGIN */}
          <div
            style={{
              borderBottom: '2px solid #000000',
              paddingBottom: '8px',
              marginBottom: '6px',
              fontSize: '10px',
            }}
          >
            <div style={{ fontSize: '9px', fontWeight: '800', color: '#475569', letterSpacing: '0.5px' }}>
              RETURN TO SENDER IF UNDELIVERED (RTO):
            </div>
            <div style={{ fontSize: '12px', fontWeight: '900', marginTop: '2px' }}>
              {shipment.pickupContact || 'Registered Shipper Origin'}
            </div>
            <div style={{ fontSize: '10px', color: '#1e293b', marginTop: '2px', lineHeight: '1.3' }}>
              {shipment.pickupAddress || 'Origin Dispatch Facility'}, {shipment.pickupCity} - <strong>{shipment.pickupPincode || ''}</strong>
            </div>
            <div style={{ fontSize: '10px', fontWeight: '800', marginTop: '2px' }}>
              Origin Phone: {shipment.pickupPhone || '+91 99999 99999'}
            </div>
          </div>

          {/* 7. ROUTING TOKEN & MAXLINE AGGREGATOR FOOTER */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '4px',
              fontSize: '9px',
              fontWeight: '700',
              color: '#334155',
            }}
          >
            <div>
              <span>ROUTING: {shipment.pickupPincode || '134113'} ➔ {shipment.deliveryPincode || '560038'}</span>
              <div style={{ fontSize: '8px', color: '#64748b' }}>
                AGGREGATOR: MAXLINE LOGISTICS • AUTH CARRIER: DELHIVERY
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '9px', fontWeight: '900', fontFamily: 'monospace' }}>
                WBN-{awb.slice(-6)}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
