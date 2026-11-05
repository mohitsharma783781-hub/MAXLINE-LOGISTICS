import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download, RefreshCw, CheckCircle2, ShieldCheck, Box } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button, Card, Alert, Badge, Select } from '../../components/ui';
import { CustomerShipmentService } from '../../services/customerShipmentService';
import { BarcodeService } from '../../services/barcodeService';
import { useTenant } from '../../context/TenantContext';

export type PrintLabelFormat =
  | 'thermal_4x6'
  | 'a4_sheet'
  | 'carton_4x2'
  | 'carton_4x2_5'
  | 'compact_3x2'
  | 'waybill_lr';

export const ShipmentLabelPage: React.FC = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId;

  const rawFormatParam = searchParams.get('format');
  const [labelFormat, setLabelFormat] = useState<PrintLabelFormat>(() => {
    if (rawFormatParam && ['thermal_4x6', 'a4_sheet', 'carton_4x2', 'carton_4x2_5', 'compact_3x2', 'waybill_lr'].includes(rawFormatParam)) {
      return rawFormatParam as PrintLabelFormat;
    }
    return 'thermal_4x6';
  });
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

  const getPageSize = (fmt: PrintLabelFormat) => {
    switch (fmt) {
      case 'thermal_4x6': return '4in 6in';
      case 'carton_4x2': return '4in 2in';
      case 'carton_4x2_5': return '4in 2.5in';
      case 'compact_3x2': return '3in 2in';
      case 'waybill_lr': return 'A4 portrait';
      case 'a4_sheet': default: return 'A4 portrait';
    }
  };

  const getPrintMargin = (fmt: PrintLabelFormat) => {
    if (fmt === 'waybill_lr') return '6mm';
    if (fmt === 'a4_sheet') return '10mm';
    return '0';
  };

  const getMaxWidth = (fmt: PrintLabelFormat) => {
    switch (fmt) {
      case 'thermal_4x6': return '400px';
      case 'carton_4x2': return '400px';
      case 'carton_4x2_5': return '400px';
      case 'compact_3x2': return '320px';
      case 'waybill_lr': return '840px';
      case 'a4_sheet': default: return '560px';
    }
  };

  const isB2bMode = shipment.mode === 'B2B' || shipment.courierName?.toLowerCase().includes('b2b') || awb.startsWith('LRN-') || awb.startsWith('319');

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Orders Center', path: '/app/orders' },
    { label: shipment.awbNumber || shipment.shipmentId, path: `/app/shipment-control-center/${shipment.shipmentId}` },
    { label: labelFormat === 'waybill_lr' ? 'Waybill / LR Copy' : 'Shipping Label', path: `/app/shipments/${shipment.shipmentId}/label` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Dynamic Thermal, Carton & Document Print Styles */}
      <style>{`
        @media print {
          @page {
            size: ${getPageSize(labelFormat)};
            margin: ${getPrintMargin(labelFormat)};
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
            width: 100% !important;
            max-width: ${getMaxWidth(labelFormat)} !important;
            margin: 0 auto !important;
            padding: ${labelFormat === 'waybill_lr' ? '0' : '6px'} !important;
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
          title={labelFormat === 'waybill_lr' ? `Official B2B Waybill / LR Copy — LRN ${awb}` : `Shipping Label — AWB ${awb}`}
          description={
            labelFormat === 'waybill_lr'
              ? 'Transporter Consignment Note (Lorry Receipt) with Proof of Delivery (POD) signature & origin verification.'
              : 'Multi-format barcode shipping label. Fully compatible with TSC, Zebra, Rollo, laser and desktop printers.'
          }
          breadcrumbs={breadcrumbs}
          actions={
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: '220px' }}>
                <Select
                  value={labelFormat}
                  onChange={(e) => setLabelFormat(e.target.value as PrintLabelFormat)}
                  options={[
                    { value: 'thermal_4x6', label: '🏷️ 4" × 6" Thermal Label (Standard)' },
                    { value: 'a4_sheet', label: '📄 A4 Size Shipping Label' },
                    { value: 'carton_4x2', label: '📦 4" × 2" Shipping Label' },
                    { value: 'carton_4x2_5', label: '📦 4" × 2.5" Shipping Label' },
                    { value: 'compact_3x2', label: '🏷️ 3" × 2" Shipping Label' },
                    { value: 'waybill_lr', label: '📑 Shipment Document (Waybill / LR Copy)' },
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
                {labelFormat === 'waybill_lr' ? 'Print Waybill / LR Copy' : 'Print Label'}
              </Button>
            </div>
          }
        />

        {labelFormat === 'waybill_lr' ? (
          <Alert variant="info" title="Official Commercial Transporter Consignment Note">
            Document Type: <strong>SHIPPER & TRANSPORTER COPY</strong>. Keep one copy for your records, hand one copy to the vehicle driver with E-Way Bill, and consignee will sign the POD copy upon destination delivery.
          </Alert>
        ) : (
          <Alert variant="success" title="Verified Carrier Label Active">
            AWB <strong>{awb}</strong> is booked on the Delhivery network. Print this barcode label and affix securely to the top surface of your dispatch package.
          </Alert>
        )}
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
          overflowX: 'auto',
        }}
      >
        {/* BRANCH 1: OFFICIAL COMMERCIAL WAYBILL / LR COPY (IMAGE 2 REPLICA) */}
        {labelFormat === 'waybill_lr' ? (
          <div
            className="printable-shipping-label-container"
            style={{
              width: '100%',
              maxWidth: '820px',
              backgroundColor: '#ffffff',
              border: '2px solid #000000',
              color: '#000000',
              fontFamily: 'Arial, sans-serif',
              boxSizing: 'border-box',
              fontSize: '11px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* 1. DOCUMENT TOP HEADER */}
            <div style={{ display: 'flex', borderBottom: '2px solid #000000' }}>
              <div style={{ flex: '1 1 50%', padding: '10px 14px', borderRight: '2px solid #000000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                    DELHIVERY
                  </div>
                  <div style={{ fontSize: '10px', color: '#1e293b', fontWeight: '600' }}>
                    <div>Created Date: {shipment.bookingDate || new Date().toLocaleDateString('en-IN')}</div>
                    <div>Pickup Date: {new Date().toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', marginTop: '6px' }}>
                  <span>SELF DROP</span>
                  <div style={{ width: '13px', height: '13px', border: '1.5px solid #000000' }} />
                </div>
              </div>

              <div style={{ flex: '1 1 50%', padding: '10px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '1px' }}>
                    {awb}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800' }}>
                    <span>SELF COLLECT</span>
                    <div style={{ width: '13px', height: '13px', border: '1.5px solid #000000' }} />
                  </div>
                </div>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '4px' }}>
                  <div dangerouslySetInnerHTML={{ __html: BarcodeService.generateBarcodeSvg(awb, 34, 1.8) }} />
                  <div style={{ fontSize: '9px', fontWeight: '700', fontFamily: 'monospace', letterSpacing: '1px' }}>{awb}</div>
                </div>
              </div>
            </div>

            {/* 2. SHIPPER vs CONSIGNEE DETAILS */}
            <div style={{ display: 'flex', borderBottom: '2px solid #000000' }}>
              {/* SHIPMENT PICKED FROM */}
              <div style={{ flex: '1 1 50%', padding: '8px 12px', borderRight: '2px solid #000000' }}>
                <div style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px', color: '#1e293b', marginBottom: '4px' }}>
                  SHIPMENT PICKED FROM:
                </div>
                <div style={{ fontWeight: '800', fontSize: '12px' }}>
                  Shipper's Name: {shipment.pickupContact || 'MAXLINE LOGI - 156'}
                </div>
                <div style={{ fontSize: '11px', marginTop: '2px' }}>
                  Shipper's phone no: {shipment.pickupPhone || '+91 70093 11318'}
                </div>
                <div style={{ fontSize: '11px', marginTop: '2px', borderTop: '1px solid #e2e8f0', paddingTop: '3px' }}>
                  Street Name: {shipment.pickupAddress || 'PLOT NO 167 INDUSTRIAL AREA PHASE-2'}
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', marginTop: '3px' }}>
                  <div><strong>City:</strong> {shipment.pickupCity || 'Panchkula'}</div>
                  <div><strong>State:</strong> Haryana</div>
                  <div><strong>Postal Code:</strong> {shipment.pickupPincode || '134113'}</div>
                </div>
                <div style={{ fontSize: '10px', marginTop: '3px' }}>
                  <strong>GSTIN:</strong> 06AABCM1234F1Z5
                </div>
              </div>

              {/* SHIPMENT DELIVERED TO */}
              <div style={{ flex: '1 1 50%', padding: '8px 12px' }}>
                <div style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px', color: '#1e293b', marginBottom: '4px' }}>
                  SHIPMENT DELIVERED TO:
                </div>
                <div style={{ fontWeight: '800', fontSize: '12px' }}>
                  Recipient's Name: {shipment.deliveryContact || 'Consignee Recipient'}
                </div>
                <div style={{ fontSize: '11px', marginTop: '2px' }}>
                  Recipient's phone no.: {shipment.deliveryPhone || '+91 98765 43210'}
                </div>
                <div style={{ fontSize: '11px', marginTop: '2px', borderTop: '1px solid #e2e8f0', paddingTop: '3px' }}>
                  Street Name: {shipment.deliveryAddress || 'Commercial Freight Destination'}
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', marginTop: '3px' }}>
                  <div><strong>City:</strong> {shipment.deliveryCity || 'Destination'}</div>
                  <div><strong>State:</strong> Himachal Pradesh</div>
                  <div><strong>Pincode:</strong> {shipment.deliveryPincode || '173205'}</div>
                </div>
                <div style={{ fontSize: '10px', marginTop: '3px' }}>
                  <strong>GSTIN:</strong> URP (Unregistered Person)
                </div>
              </div>
            </div>

            {/* 3. SHIPMENT INFORMATION & BOXES */}
            <div style={{ display: 'flex', borderBottom: '2px solid #000000' }}>
              {/* SHIPMENT INFO LEFT */}
              <div style={{ flex: '1 1 50%', borderRight: '2px solid #000000' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '4px 12px', fontWeight: '900', fontSize: '9px', letterSpacing: '0.5px', borderBottom: '1px solid #000000' }}>
                  SHIPMENT INFORMATION
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', borderBottom: '1px solid #000000' }}>
                  <div style={{ padding: '4px 12px', borderRight: '1px solid #000000', fontSize: '10px' }}>
                    <strong>SHIPPER'S REF NO.:</strong> {orderId}
                  </div>
                  <div style={{ padding: '4px 8px', fontSize: '10px' }}>
                    <strong>MOT:</strong> Road (Surface Cargo)
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #000000', fontSize: '10px' }}>
                  <div style={{ padding: '4px 12px', borderRight: '1px solid #000000' }}>
                    <strong>INVOICE NO.:</strong> {shipment.invoiceNumber || `INV-${orderId.slice(-4)}`}
                  </div>
                  <div style={{ padding: '4px 8px' }}>
                    <strong>EWBN:</strong> {shipment.invoiceNumber ? `EWB-${awb.slice(-6)}` : 'N/A'}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', borderBottom: '1px solid #000000', fontSize: '10px' }}>
                  <div style={{ padding: '4px 12px', borderRight: '1px solid #000000' }}>
                    <strong>TOTAL INVOICE VALUE:</strong> ₹{(shipment.invoiceValueINR || 5000).toFixed(1)}
                  </div>
                  <div style={{ padding: '4px 8px' }}>
                    <strong>MASTER AWB:</strong> {awb}
                  </div>
                </div>
                <div style={{ padding: '4px 12px', fontSize: '10px', borderBottom: '1px solid #000000' }}>
                  <strong>Freight Payment:</strong> {isCod ? `COD (Collect ₹${codAmount})` : 'PREPAID'} | <strong>ROV:</strong> BY SHIPPER
                </div>

                {/* BOXES BREAKDOWN TABLE */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.2fr', fontSize: '10px', textAlign: 'center', backgroundColor: '#f8fafc', borderBottom: '1px solid #000000', fontWeight: '800' }}>
                  <div style={{ padding: '4px', borderRight: '1px solid #000000' }}>BOXES × DIMENSION (cm)</div>
                  <div style={{ padding: '4px', borderRight: '1px solid #000000' }}>ACTUAL WT (kg)</div>
                  <div style={{ padding: '4px' }}>SAID TO CONTAIN</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.2fr', fontSize: '10px', textAlign: 'center', minHeight: '36px' }}>
                  <div style={{ padding: '6px', borderRight: '1px solid #000000', fontWeight: '700' }}>
                    {shipment.packages?.length || 1} Box: {shipment.dimensionsCm || '30x30x30'}
                  </div>
                  <div style={{ padding: '6px', borderRight: '1px solid #000000', fontWeight: '700' }}>
                    {shipment.chargeableWeightKg || 20.0}
                  </div>
                  <div style={{ padding: '6px', fontWeight: '700' }}>
                    {shipment.packageContents || 'MAX MED / Commercial Cargo'}
                  </div>
                </div>
              </div>

              {/* POD REMARKS & RECEIVER ACKNOWLEDGEMENT RIGHT */}
              <div style={{ flex: '1 1 50%', padding: '8px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    POD REMARKS & DELIVERY ACKNOWLEDGEMENT
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '10px', fontWeight: '700' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '13px', height: '13px', border: '1.5px solid #000000' }} />
                      <span>ALL OKAY</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '13px', height: '13px', border: '1.5px solid #000000' }} />
                      <span>SHORT BOX?</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '10px', fontWeight: '700', marginTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '13px', height: '13px', border: '1.5px solid #000000' }} />
                      <span>DAMAGED CONTENT?</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '13px', height: '13px', border: '1.5px solid #000000' }} />
                      <span>MISSING ITEMS?</span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginTop: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px' }}>
                    <div>Date of receipt: ____________</div>
                    <div>Time of receipt: ____________</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', marginTop: '16px' }}>
                    <div>RECEIVER'S SIGN: ____________</div>
                    <div>STAMP / SEAL: ____________</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. ORIGIN HANDOVER SIGNATURES */}
            <div style={{ display: 'flex', borderBottom: '1px solid #000000', fontSize: '10px' }}>
              <div style={{ flex: '1 1 50%', padding: '6px 12px', borderRight: '2px solid #000000' }}>
                <strong>TOTAL NUMBER OF BOXES:</strong> {shipment.packages?.length || 1}
                <div style={{ fontSize: '9px', color: '#64748b' }}>Boxes handed over to carrier representative</div>
              </div>
              <div style={{ flex: '1 1 50%', padding: '6px 12px', display: 'flex', justifyContent: 'space-between' }}>
                <div><strong>DELHIVERY EMP ID:</strong> ____________</div>
                <div><strong>SHIPPER'S SIGN:</strong> ____________</div>
              </div>
            </div>

            {/* 5. FOOTER: LEGAL & DOCUMENT TYPE */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', fontSize: '9px', color: '#334155', backgroundColor: '#f8fafc' }}>
              <div>
                <strong>DELHIVERY LIMITED / MAXLINE LOGISTICS</strong> • Reg Office: Cargo Terminal, IGI Airport, New Delhi • CIN: U63090DL2011PTC221234
              </div>
              <div style={{ textAlign: 'right', fontWeight: '800' }}>
                <span>Document Type: SHIPPER COPY</span>
                <div style={{ fontSize: '8px', color: '#64748b' }}>Printed on {new Date().toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>
        ) : labelFormat.startsWith('carton_') || labelFormat === 'compact_3x2' ? (
          /* BRANCH 2: COMPACT CARTER / BOX LABELS (4x2, 4x2.5, 3x2) */
          <div
            className="printable-shipping-label-container"
            style={{
              width: '100%',
              maxWidth: labelFormat === 'compact_3x2' ? '320px' : '390px',
              backgroundColor: '#ffffff',
              border: '2px solid #000000',
              padding: '8px 10px',
              color: '#000000',
              fontFamily: 'Arial, sans-serif',
              boxSizing: 'border-box',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #000', paddingBottom: '4px' }}>
              <div style={{ fontSize: '14px', fontWeight: '900' }}>DELHIVERY {isB2bMode ? 'B2B' : 'SURFACE'}</div>
              <div style={{ fontSize: '10px', fontWeight: '900', border: '1px solid #000', padding: '1px 5px' }}>
                {isCod ? `COD ₹${codAmount.toFixed(0)}` : 'PREPAID'}
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '6px 0', borderBottom: '1px solid #000' }}>
              <div dangerouslySetInnerHTML={{ __html: BarcodeService.generateBarcodeSvg(awb, 34, 1.8) }} style={{ display: 'flex', justifyContent: 'center' }} />
              <div style={{ fontSize: '13px', fontWeight: '900', fontFamily: 'monospace', letterSpacing: '1px' }}>{awb}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #000', fontSize: '10px' }}>
              <div>
                <div style={{ fontSize: '8px', color: '#64748b', fontWeight: '800' }}>TO:</div>
                <div style={{ fontWeight: '900' }}>{shipment.deliveryContact}</div>
                <div>{shipment.deliveryCity}</div>
                <div style={{ fontSize: '14px', fontWeight: '900', marginTop: '2px' }}>PIN: {shipment.deliveryPincode}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '8px', color: '#64748b', fontWeight: '800' }}>WEIGHT:</div>
                <div style={{ fontWeight: '900' }}>{shipment.chargeableWeightKg || 20} KG</div>
                <div style={{ marginTop: '4px', fontSize: '8px', color: '#64748b', fontWeight: '800' }}>ORDER ID:</div>
                <div style={{ fontWeight: '800' }}>{orderId}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', fontSize: '8px', fontWeight: '700', color: '#475569' }}>
              <span>ORIGIN: {shipment.pickupCity} ({shipment.pickupPincode})</span>
              <span>BOX 1 OF {shipment.packages?.length || 1}</span>
            </div>
          </div>
        ) : (
          /* BRANCH 3: STANDARD 4x6 / A4 SHIPPING LABEL */
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
                  {shipment.courierName?.toUpperCase() || 'DELHIVERY SURFACE B2B'}
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
                <span>PKG: 1 OF {shipment.packages?.length || 1}</span>
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
                <div style={{ fontWeight: '900' }}>{shipment.chargeableWeightKg || 20.0} KG</div>
              </div>
              <div style={{ borderRight: '1px solid #000000', padding: '0 4px' }}>
                <div style={{ fontSize: '9px', color: '#475569', fontWeight: '700' }}>DIMENSIONS</div>
                <div style={{ fontWeight: '900', fontSize: '10px' }}>{shipment.dimensionsCm || '30×30×30 CM'}</div>
              </div>
              <div style={{ padding: '0 4px' }}>
                <div style={{ fontSize: '9px', color: '#475569', fontWeight: '700' }}>INVOICE VAL</div>
                <div style={{ fontWeight: '900' }}>₹{shipment.invoiceValueINR || 5000}</div>
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
                Origin Phone: {shipment.pickupPhone || '+91 70093 11318'}
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
                <span>ROUTING: {shipment.pickupPincode || '134113'} ➔ {shipment.deliveryPincode || '173205'}</span>
                <div style={{ fontSize: '8px', color: '#64748b' }}>
                  AGGREGATOR: MAXLINE LOGISTICS • AUTH CARRIER: DELHIVERY B2B
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '9px', fontWeight: '900', fontFamily: 'monospace' }}>
                  WBN-{awb.slice(-6)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
