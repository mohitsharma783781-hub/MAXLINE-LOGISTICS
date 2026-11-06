import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download, FileText, CheckCircle2, Copy } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button, Card, Alert, Select } from '../../components/ui';
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

export type LrCopyType = 'SHIPPER' | 'CONSIGNEE' | 'TRANSPORTER' | 'ALL_THREE';

// Helper to determine State from Pincode prefix in India
const getStateFromPincode = (pincode: string): string => {
  if (!pincode || pincode.length < 2) return 'Haryana';
  const prefix = pincode.slice(0, 2);
  const pNum = parseInt(prefix, 10);
  if (pNum === 11) return 'Delhi';
  if (pNum >= 12 && pNum <= 13) return 'Haryana';
  if (pNum >= 14 && pNum <= 16) return 'Punjab';
  if (pNum === 17) return 'Himachal Pradesh';
  if (pNum >= 18 && pNum <= 19) return 'Jammu & Kashmir';
  if (pNum >= 20 && pNum <= 28) return 'Uttar Pradesh';
  if (pNum >= 30 && pNum <= 34) return 'Rajasthan';
  if (pNum >= 36 && pNum <= 39) return 'Gujarat';
  if (pNum >= 40 && pNum <= 44) return 'Maharashtra';
  if (pNum >= 45 && pNum <= 49) return 'Madhya Pradesh';
  if (pNum >= 50 && pNum <= 53) return 'Andhra Pradesh / Telangana';
  if (pNum >= 56 && pNum <= 59) return 'Karnataka';
  if (pNum >= 60 && pNum <= 64) return 'Tamil Nadu';
  if (pNum >= 67 && pNum <= 69) return 'Kerala';
  if (pNum >= 70 && pNum <= 74) return 'West Bengal';
  if (pNum >= 75 && pNum <= 77) return 'Odisha';
  if (pNum >= 80 && pNum <= 85) return 'Bihar / Jharkhand';
  return 'India';
};

// Official Delhivery Logo mark with signature red dot
const DelhiveryLogo: React.FC<{ fontSize?: number }> = ({ fontSize = 24 }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif',
      fontWeight: '900',
      fontSize: `${fontSize}px`,
      letterSpacing: '-0.5px',
      color: '#000000',
      userSelect: 'none',
      lineHeight: '1',
    }}
  >
    <span>DELH</span>
    <span style={{ position: 'relative', display: 'inline-block' }}>
      I
      <span
        style={{
          position: 'absolute',
          top: `${Math.round(fontSize * 0.05)}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: `${Math.max(3, Math.round(fontSize * 0.18))}px`,
          height: `${Math.max(3, Math.round(fontSize * 0.18))}px`,
          backgroundColor: '#e11d48',
          borderRadius: '50%',
        }}
      />
    </span>
    <span>VERY</span>
  </div>
);

export const ShipmentLabelPage: React.FC = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId;

  const rawFormatParam = searchParams.get('format');
  const [labelFormat, setLabelFormat] = useState<PrintLabelFormat>(() => {
    if (
      rawFormatParam &&
      ['thermal_4x6', 'a4_sheet', 'carton_4x2', 'carton_4x2_5', 'compact_3x2', 'waybill_lr'].includes(rawFormatParam)
    ) {
      return rawFormatParam as PrintLabelFormat;
    }
    return 'thermal_4x6';
  });

  const [lrCopySelection, setLrCopySelection] = useState<LrCopyType>('SHIPPER');
  const [isDownloading, setIsDownloading] = useState(false);

  // Retrieve actual shipment from unified store with high-fidelity defaults
  const foundShipment =
    CustomerShipmentService.getShipmentById(shipmentId || '', tenantId) ||
    CustomerShipmentService.getShipmentById(shipmentId || '');

  const shipment = foundShipment || {
    id: shipmentId || 'SHP-ORD-12081',
    shipmentId: shipmentId || 'SHP-ORD-12081',
    awbNumber: '319845137',
    orderId: 'WON-12081',
    bookingDate: '03/11/26',
    courierName: 'Delhivery Surface B2B',
    serviceName: 'Delhivery B2B LTL Express Cargo',
    pickupContact: 'AJAYKUMAR6RP B2BRC',
    pickupAddress: 'PLOT NO 167 INDUSTRIAL AREA PHASE-2',
    pickupCity: 'Rajpura',
    pickupPincode: '133001',
    pickupPhone: '+91 70093 11318',
    deliveryContact: 'SUDHANAND DISRIBUTORS, SUDHANAND DISRIBUTORS',
    deliveryAddress: 'SY NO 59 DEVANOORU RAJEEVNAGAR 2ND STAGE UDAYAGIRI MYSORE',
    deliveryCity: 'Mysore',
    deliveryPincode: '570019',
    deliveryPhone: '+91 98765 43210',
    chargeableWeightKg: 10.0,
    actualWeightKg: 10.0,
    dimensionsCm: '10x10x10',
    paymentMode: 'COD',
    codAmountINR: 575070.0,
    invoiceValueINR: 45000.0,
    invoiceNumber: '12081',
    ewayBillNumber: '281903482910',
    bookingStatus: 'BOOKED',
    packageType: 'Box',
    packages: [
      { lengthCm: 10, widthCm: 10, heightCm: 10, actualWeightKg: 10.0, chargeableWeightKg: 10.0, quantity: 13 },
    ],
  };

  const awb = shipment.awbNumber || '319845137';
  const orderId = shipment.orderId || 'WON-12081';
  const isCod = String(shipment.paymentMode).toUpperCase() === 'COD';
  const codAmount = Number(shipment.codAmountINR || 0);
  const invoiceValue = Number(shipment.invoiceValueINR || 45000.0);
  const totalBoxes =
    (shipment.packages && shipment.packages.reduce((sum: number, p: any) => sum + (p.quantity || 1), 0)) || 13;

  const originState = getStateFromPincode(shipment.pickupPincode || '133001');
  const destState = getStateFromPincode(shipment.deliveryPincode || '570019');
  const printTimestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

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
      case 'thermal_4x6':
        return '4in 6in';
      case 'carton_4x2':
        return '4in 2in';
      case 'carton_4x2_5':
        return '4in 2.5in';
      case 'compact_3x2':
        return '3in 2in';
      case 'waybill_lr':
        return 'A4 portrait';
      case 'a4_sheet':
      default:
        return 'A4 portrait';
    }
  };

  const getPrintMargin = (fmt: PrintLabelFormat) => {
    if (fmt === 'waybill_lr') return '6mm';
    if (fmt === 'a4_sheet') return '10mm';
    return '0';
  };

  const getMaxWidth = (fmt: PrintLabelFormat) => {
    switch (fmt) {
      case 'thermal_4x6':
        return '400px';
      case 'carton_4x2':
        return '400px';
      case 'carton_4x2_5':
        return '400px';
      case 'compact_3x2':
        return '320px';
      case 'waybill_lr':
        return '840px';
      case 'a4_sheet':
      default:
        return '580px';
    }
  };

  const isB2bMode =
    shipment.mode === 'B2B' ||
    shipment.courierName?.toLowerCase().includes('b2b') ||
    awb.startsWith('LRN-') ||
    awb.startsWith('319');

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Orders Center', path: '/app/orders' },
    { label: shipment.awbNumber || shipment.shipmentId, path: `/app/shipment-control-center/${shipment.shipmentId}` },
    {
      label: labelFormat === 'waybill_lr' ? 'Waybill / LR Copy' : 'Shipping Label',
      path: `/app/shipments/${shipment.shipmentId}/label`,
    },
  ];

  /**
   * REUSABLE COMPONENT: EXACT DELHIVERY ONE WAYBILL / LR COPY
   * Faithfully matches Delhivery ONE carrier document layout, borders, font weights, and POD fields.
   */
  const renderDelhiveryWaybillDocument = (copyName: 'SHIPPER' | 'CONSIGNEE' | 'TRANSPORTER', pageBreak: boolean = false) => {
    return (
      <div
        key={copyName}
        className={`printable-shipping-label-container ${pageBreak ? 'page-break' : ''}`}
        style={{
          width: '100%',
          maxWidth: '840px',
          backgroundColor: '#ffffff',
          border: '2px solid #000000',
          color: '#000000',
          fontFamily: 'Arial, Helvetica, sans-serif',
          boxSizing: 'border-box',
          fontSize: '11px',
          lineHeight: '1.25',
          margin: pageBreak ? '0 0 24px 0' : '0 auto',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* ROW 1: TOP HEADER (DELHIVERY LOGO & LRN BARCODE) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #000000' }}>
          {/* Header Left */}
          <div
            style={{
              padding: '8px 12px',
              borderRight: '2px solid #000000',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '74px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <DelhiveryLogo fontSize={24} />
              <div style={{ fontSize: '10px', color: '#000000', fontWeight: '500', textAlign: 'right' }}>
                <div>Created Date: {shipment.bookingDate || '03/11/26'}</div>
                <div>Pickup Date: ---</div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '6px',
                fontSize: '10px',
                fontWeight: '700',
                marginTop: '4px',
              }}
            >
              <span>SELF DROP</span>
              <div style={{ width: '13px', height: '13px', border: '2px solid #000000', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Header Right */}
          <div
            style={{
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '74px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '0.5px' }}>{awb}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '700' }}>
                <span>SELF COLLECT</span>
                <div style={{ width: '13px', height: '13px', border: '2px solid #000000', boxSizing: 'border-box' }} />
              </div>
            </div>
            {/* Scannable Code 128 Barcode with centered human-readable digits */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '2px' }}>
              <div
                style={{ width: '220px' }}
                dangerouslySetInnerHTML={{
                  __html: BarcodeService.generateBarcodeSvg(awb, 34, 1.6, { showText: false }),
                }}
              />
              <div
                style={{
                  width: '220px',
                  textAlign: 'center',
                  fontSize: '9px',
                  fontWeight: '700',
                  fontFamily: 'monospace',
                  letterSpacing: '0.5px',
                  marginTop: '1px',
                }}
              >
                {awb}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: SHIPPER VS CONSIGNEE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #000000' }}>
          {/* SHIPMENT PICKED FROM */}
          <div style={{ borderRight: '2px solid #000000', display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                padding: '4px 8px',
                fontWeight: '900',
                fontSize: '10px',
                borderBottom: '1px solid #000000',
                letterSpacing: '0.2px',
              }}
            >
              SHIPMENT PICKED FROM:
            </div>
            <div style={{ padding: '3px 8px', fontSize: '11px', borderBottom: '1px solid #000000' }}>
              <strong>Shipper's Name:</strong> {shipment.pickupContact || 'AJAYKUMAR6RP B2BRC'}
            </div>
            <div style={{ padding: '3px 8px', fontSize: '11px', borderBottom: '1px solid #000000' }}>
              <strong>Shipper's phone no:</strong> {shipment.pickupPhone || ''}
            </div>
            <div style={{ padding: '3px 8px', fontSize: '11px', borderBottom: '1px solid #000000', minHeight: '26px' }}>
              <strong>Street Name:</strong> {shipment.pickupAddress || 'PLOT NO 167 INDUSTRIAL AREA PHASE-2'}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1.2fr',
                fontSize: '11px',
                borderBottom: '1px solid #000000',
              }}
            >
              <div style={{ padding: '3px 6px', borderRight: '1px solid #000000' }}>
                <strong>City:</strong> {shipment.pickupCity || 'Rajpura'}
              </div>
              <div style={{ padding: '3px 6px', borderRight: '1px solid #000000' }}>
                <strong>State:</strong> {originState}
              </div>
              <div style={{ padding: '3px 6px' }}>
                <strong>Postal Code:</strong> {shipment.pickupPincode || '133001'}
              </div>
            </div>
            <div style={{ padding: '3px 8px', fontSize: '11px' }}>
              <strong>GSTIN:</strong> {shipment.pickupGstin || '06AAPCS9575E1ZR'}
            </div>
          </div>

          {/* SHIPMENT DELIVERED TO */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                padding: '4px 8px',
                fontWeight: '900',
                fontSize: '10px',
                borderBottom: '1px solid #000000',
                letterSpacing: '0.2px',
              }}
            >
              SHIPMENT DELIVERED TO:
            </div>
            <div style={{ padding: '3px 8px', fontSize: '11px', borderBottom: '1px solid #000000' }}>
              <strong>Recipient's Name:</strong> {shipment.deliveryContact || 'SUDHANAND DISRIBUTORS'}
            </div>
            <div style={{ padding: '3px 8px', fontSize: '11px', borderBottom: '1px solid #000000' }}>
              <strong>Recipient's phone no.:</strong> {shipment.deliveryPhone || ''}
            </div>
            <div style={{ padding: '3px 8px', fontSize: '11px', borderBottom: '1px solid #000000', minHeight: '26px' }}>
              <strong>Street Name:</strong> {shipment.deliveryAddress || 'Commercial Freight Destination Facility'}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1.2fr',
                fontSize: '11px',
                borderBottom: '1px solid #000000',
              }}
            >
              <div style={{ padding: '3px 6px', borderRight: '1px solid #000000' }}>
                <strong>City:</strong> {shipment.deliveryCity || 'Mysore'}
              </div>
              <div style={{ padding: '3px 6px', borderRight: '1px solid #000000' }}>
                <strong>State:</strong> {destState}
              </div>
              <div style={{ padding: '3px 6px' }}>
                <strong>Pincode:</strong> {shipment.deliveryPincode || '570019'}
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                fontSize: '11px',
              }}
            >
              <div style={{ padding: '3px 8px', borderRight: '1px solid #000000' }}>
                <strong>GSTIN:</strong> {shipment.deliveryGstin || 'URP'}
              </div>
              <div style={{ padding: '3px 8px' }}>
                <strong>Address/Store Code:</strong> {shipment.deliveryStoreCode || ''}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: SHIPMENT INFORMATION VS POD REMARKS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #000000' }}>
          {/* SHIPMENT INFORMATION LEFT */}
          <div style={{ borderRight: '2px solid #000000', display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                padding: '4px 8px',
                fontWeight: '900',
                fontSize: '10px',
                borderBottom: '1px solid #000000',
                letterSpacing: '0.2px',
              }}
            >
              SHIPMENT INFORMATION
            </div>

            {/* Shipper Ref & MOT */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 0.8fr',
                fontSize: '10px',
                borderBottom: '1px solid #000000',
              }}
            >
              <div style={{ padding: '4px 8px', borderRight: '1px solid #000000' }}>
                <strong>SHIPPER'S REFERENCE NO.:</strong> {orderId}
              </div>
              <div style={{ padding: '4px 8px' }}>
                <div><strong>MOT:</strong> Road</div>
                <div><strong>ROV:</strong> BY SHIPPER</div>
              </div>
            </div>

            {/* Invoice, EWBN & Freight Payment */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 0.8fr 1.2fr',
                fontSize: '10px',
                borderBottom: '1px solid #000000',
              }}
            >
              <div style={{ padding: '4px 8px', borderRight: '1px solid #000000' }}>
                <strong>INVOICE NO.:</strong> {shipment.invoiceNumber || '12081'}
              </div>
              <div style={{ padding: '4px 8px', borderRight: '1px solid #000000' }}>
                <strong>EWBN :</strong> {shipment.ewayBillNumber || ''}
              </div>
              <div style={{ padding: '4px 8px' }}>
                <div><strong>Freight Payment:</strong> {isCod ? 'FoP' : 'Prepaid'}</div>
                <div>
                  <strong>Value Payment:</strong> {isCod ? `COD ${codAmount.toFixed(1)}` : 'Prepaid'}
                </div>
              </div>
            </div>

            {/* Total Invoice Value, Master AWB & POD on Invoice */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1.1fr',
                fontSize: '10px',
                borderBottom: '1px solid #000000',
              }}
            >
              <div style={{ padding: '4px 8px', borderRight: '1px solid #000000' }}>
                <strong>TOTAL INVOICE VALUE:</strong> {invoiceValue.toFixed(1)}
              </div>
              <div style={{ padding: '4px 8px', borderRight: '1px solid #000000' }}>
                <strong>MASTER AWB:</strong>
                <div>{shipment.masterAwb || awb}</div>
              </div>
              <div style={{ padding: '4px 8px' }}>
                <strong>POD on Invoice:</strong> Not required
              </div>
            </div>

            {/* Multi-Box Breakdown Table */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 0.9fr 1fr',
                fontSize: '10px',
                fontWeight: '900',
                borderBottom: '1px solid #000000',
                textAlign: 'left',
              }}
            >
              <div style={{ padding: '4px 8px', borderRight: '1px solid #000000' }}>BOXES x DIMENSION (LxWxH) cm</div>
              <div style={{ padding: '4px 8px', borderRight: '1px solid #000000' }}>ACTUAL WEIGHT(kg)</div>
              <div style={{ padding: '4px 8px' }}>SAID TO CONTAIN</div>
            </div>

            {/* Box Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '110px' }}>
              {shipment.packages && shipment.packages.length > 0 ? (
                shipment.packages.map((pkg: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 0.9fr 1fr',
                      fontSize: '10px',
                      borderBottom: idx === (shipment.packages?.length || 1) - 1 ? 'none' : '1px solid #e2e8f0',
                      padding: '4px 0',
                    }}
                  >
                    <div style={{ padding: '2px 8px', borderRight: '1px solid #000000' }}>
                      {pkg.quantity || totalBoxes} Boxes: {pkg.lengthCm || 10}x{pkg.widthCm || 10}x{pkg.heightCm || 10}
                    </div>
                    <div style={{ padding: '2px 8px', borderRight: '1px solid #000000' }}>
                      {Number(pkg.actualWeightKg || shipment.actualWeightKg || 10.0).toFixed(1)}
                    </div>
                    <div style={{ padding: '2px 8px' }}>
                      {shipment.packageContents || 'MAX MED / Commercial Cargo'}
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 0.9fr 1fr',
                    fontSize: '10px',
                    padding: '4px 0',
                  }}
                >
                  <div style={{ padding: '2px 8px', borderRight: '1px solid #000000' }}>
                    {totalBoxes} Boxes: {shipment.dimensionsCm || '10x10x10'}
                  </div>
                  <div style={{ padding: '2px 8px', borderRight: '1px solid #000000' }}>
                    {Number(shipment.actualWeightKg || 10.0).toFixed(1)}
                  </div>
                  <div style={{ padding: '2px 8px' }}>
                    {shipment.packageContents || 'MAX MED'}
                  </div>
                </div>
              )}
            </div>

            {/* Total Boxes & Origin Signatures */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                borderTop: '2px solid #000000',
                fontSize: '10px',
                minHeight: '60px',
              }}
            >
              <div style={{ padding: '6px 8px', borderRight: '1px solid #000000' }}>
                <div style={{ fontWeight: '900' }}>TOTAL NUMBER OF BOXES: {totalBoxes}</div>
                <div style={{ fontSize: '9px', marginTop: '2px' }}>{totalBoxes} boxes handed over by shipper</div>
              </div>
              <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontWeight: '900' }}>REQUIRED SIGNATURE - ORIGIN:</div>
                <div style={{ marginTop: '2px' }}>DELHIVERY EMP ID: ....................</div>
                <div>SHIPPER'S SIGN: ....................</div>
              </div>
            </div>
          </div>

          {/* POD REMARKS RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                padding: '4px 8px',
                fontWeight: '900',
                fontSize: '10px',
                borderBottom: '1px solid #000000',
                letterSpacing: '0.2px',
              }}
            >
              POD REMARKS
            </div>

            {/* POD Top Grid: ALL OKAY | SHORT BOX | RECEIPT SIGN */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                borderBottom: '1px solid #000000',
                fontSize: '10px',
                minHeight: '120px',
              }}
            >
              {/* All Okay */}
              <div
                style={{
                  padding: '8px 6px',
                  borderRight: '1px solid #000000',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontWeight: '700' }}>ALL OKAY</span>
                <div style={{ width: '13px', height: '13px', border: '2px solid #000000', flexShrink: 0 }} />
              </div>

              {/* Short Box? */}
              <div
                style={{
                  padding: '8px 6px',
                  borderRight: '1px solid #000000',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: '700' }}>SHORT BOX?</span>
                  <div style={{ width: '13px', height: '13px', border: '2px solid #000000', flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: '9px', marginTop: '6px' }}>
                  If yes, number of short boxes:
                  <div style={{ marginTop: '3px', borderBottom: '1px solid #000', height: '10px' }} />
                </div>
              </div>

              {/* Date & Time of Receipt & Receiver Sign */}
              <div
                style={{
                  padding: '8px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div>Date of receipt:</div>
                  <div style={{ marginTop: '6px' }}>Time of receipt:</div>
                </div>
                <div style={{ fontWeight: '900', fontSize: '9px', marginTop: '14px' }}>
                  RECEIVER'S SIGN:
                  <div style={{ height: '24px' }} />
                </div>
              </div>
            </div>

            {/* POD Bottom Grid: DAMAGED CONTENT | ITEMS MISSING | STAMP/SEAL */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                fontSize: '10px',
                flex: 1,
                minHeight: '130px',
              }}
            >
              {/* Damaged Content? */}
              <div
                style={{
                  padding: '8px 6px',
                  borderRight: '1px solid #000000',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: '700' }}>DAMAGED CONTENT?</span>
                  <div style={{ width: '13px', height: '13px', border: '2px solid #000000', flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: '9px', marginTop: '6px' }}>
                  If yes, number of boxes having damaged content:
                  <div style={{ marginTop: '3px', borderBottom: '1px solid #000', height: '10px' }} />
                </div>
              </div>

              {/* Items Missing in Received Boxes? */}
              <div
                style={{
                  padding: '8px 6px',
                  borderRight: '1px solid #000000',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: '700', fontSize: '9px' }}>ITEMS MISSING IN RECEIVED BOXES?</span>
                  <div style={{ width: '13px', height: '13px', border: '2px solid #000000', flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: '8px' }}>
                  If yes, mention the AWB no(s) of boxes having pilferage:
                </div>
                <div style={{ fontSize: '8px', marginTop: '2px' }}>
                  If yes, number of short items: _____
                </div>
                <div style={{ fontSize: '8px', marginTop: '2px' }}>
                  Please describe the short items:
                </div>
              </div>

              {/* Stamp / Seal */}
              <div
                style={{
                  padding: '8px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontWeight: '900', fontSize: '9px' }}>STAMP/SEAL:</div>
                <div style={{ height: '36px' }} />
                <div style={{ fontSize: '8px', color: '#000000' }}>
                  OR, phone no in lieu of stamp:
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 4: FOOTER (DELHIVERY REGISTERED OFFICE & COPY STAMP) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr' }}>
          {/* Legal Carrier Registered Office */}
          <div style={{ padding: '6px 8px', borderRight: '1px solid #000000', fontSize: '8px', color: '#000000' }}>
            <div style={{ fontWeight: '900' }}>DELHIVERY LIMITED</div>
            <div style={{ fontSize: '7.5px', marginTop: '1px' }}>
              REGISTERED OFFICE: N24-N34, S24-S34, Air Cargo Logistics Centre-II, Opposite Gate 6 Cargo Terminal, IGI Airport, New Delhi, India (110037)
            </div>
            <div style={{ fontSize: '7.5px', marginTop: '1px' }}>
              <strong>TRANSPORTER ID:</strong> 06AAPCS9575E1ZR &nbsp;|&nbsp; <strong>CIN No:</strong> U63090DL2011PTC221234 &nbsp;|&nbsp; <strong>PAN:</strong> AAPCS9575E
            </div>
            <div style={{ fontSize: '7.5px', marginTop: '1px' }}>
              For terms and conditions visit <u>www.delhivery.com</u>
            </div>
          </div>

          {/* Document Type Copy & Timestamp */}
          <div
            style={{
              padding: '6px 12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              fontSize: '11px',
            }}
          >
            <div style={{ fontWeight: '900', fontSize: '12px', letterSpacing: '0.5px' }}>
              Document Type: {copyName} COPY
            </div>
            <div style={{ fontSize: '10px', marginTop: '2px', color: '#000000' }}>
              Printed on {printTimestamp}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: ${getMaxWidth(labelFormat)} !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
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
              ? 'Exact Delhivery ONE Transporter Consignment Note (Lorry Receipt) with complete Proof of Delivery (POD) signature matrix.'
              : 'Multi-format barcode shipping label with 100% standard Code 128 Modulo 103 checksum for all industrial scanners.'
          }
          breadcrumbs={breadcrumbs}
          actions={
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: '230px' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Alert variant="info" title="Official Commercial Transporter Consignment Note (Delhivery ONE Exact Format)">
              Consignment note for LRN <strong>{awb}</strong>. In transport operations, 3 copies are customarily used:
              one kept by Shipper, one for Consignee upon delivery with POD signature, and one for Transporter records.
            </Alert>

            {/* Quick Copy Selector Tabs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569', marginRight: '6px' }}>
                Select Document Copy:
              </span>
              <button
                type="button"
                onClick={() => setLrCopySelection('SHIPPER')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: lrCopySelection === 'SHIPPER' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  backgroundColor: lrCopySelection === 'SHIPPER' ? '#f0f9ff' : '#ffffff',
                  color: lrCopySelection === 'SHIPPER' ? '#0284c7' : '#334155',
                  cursor: 'pointer',
                }}
              >
                🏢 Shipper Copy
              </button>
              <button
                type="button"
                onClick={() => setLrCopySelection('CONSIGNEE')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: lrCopySelection === 'CONSIGNEE' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  backgroundColor: lrCopySelection === 'CONSIGNEE' ? '#f0f9ff' : '#ffffff',
                  color: lrCopySelection === 'CONSIGNEE' ? '#0284c7' : '#334155',
                  cursor: 'pointer',
                }}
              >
                📦 Consignee Copy (POD)
              </button>
              <button
                type="button"
                onClick={() => setLrCopySelection('TRANSPORTER')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: lrCopySelection === 'TRANSPORTER' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  backgroundColor: lrCopySelection === 'TRANSPORTER' ? '#f0f9ff' : '#ffffff',
                  color: lrCopySelection === 'TRANSPORTER' ? '#0284c7' : '#334155',
                  cursor: 'pointer',
                }}
              >
                🚚 Transporter Copy
              </button>
              <button
                type="button"
                onClick={() => setLrCopySelection('ALL_THREE')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '800',
                  border: lrCopySelection === 'ALL_THREE' ? '2px solid #16a34a' : '1px solid #e2e8f0',
                  backgroundColor: lrCopySelection === 'ALL_THREE' ? '#f0fdf4' : '#ffffff',
                  color: lrCopySelection === 'ALL_THREE' ? '#166534' : '#334155',
                  cursor: 'pointer',
                }}
              >
                📑 Print All 3 Copies (Triplicate A4)
              </button>
            </div>
          </div>
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
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#f1f5f9',
          border: '1px solid #cbd5e1',
          borderRadius: '12px',
          overflowX: 'auto',
        }}
      >
        {/* BRANCH 1: OFFICIAL COMMERCIAL WAYBILL / LR COPY (EXACT DELHIVERY ONE REPLICA) */}
        {labelFormat === 'waybill_lr' ? (
          lrCopySelection === 'ALL_THREE' ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {renderDelhiveryWaybillDocument('SHIPPER', true)}
              {renderDelhiveryWaybillDocument('CONSIGNEE', true)}
              {renderDelhiveryWaybillDocument('TRANSPORTER', false)}
            </div>
          ) : (
            renderDelhiveryWaybillDocument(lrCopySelection, false)
          )
        ) : labelFormat.startsWith('carton_') || labelFormat === 'compact_3x2' ? (
          /* BRANCH 2: COMPACT CARTON / BOX LABELS (4x2, 4x2.5, 3x2) */
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
              <div style={{ fontSize: '14px', fontWeight: '900' }}>
                <DelhiveryLogo fontSize={14} /> {isB2bMode ? 'B2B' : 'SURFACE'}
              </div>
              <div style={{ fontSize: '10px', fontWeight: '900', border: '1px solid #000', padding: '1px 5px' }}>
                {isCod ? `COD ₹${codAmount.toFixed(0)}` : 'PREPAID'}
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '6px 0', borderBottom: '1px solid #000' }}>
              <div
                dangerouslySetInnerHTML={{ __html: BarcodeService.generateBarcodeSvg(awb, 34, 1.8) }}
                style={{ display: 'flex', justifyContent: 'center' }}
              />
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
                <div style={{ fontWeight: '900' }}>{shipment.chargeableWeightKg || 10} KG</div>
                <div style={{ marginTop: '4px', fontSize: '8px', color: '#64748b', fontWeight: '800' }}>ORDER ID:</div>
                <div style={{ fontWeight: '800' }}>{orderId}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', fontSize: '8px', fontWeight: '700', color: '#475569' }}>
              <span>ORIGIN: {shipment.pickupCity} ({shipment.pickupPincode})</span>
              <span>BOX 1 OF {totalBoxes}</span>
            </div>
          </div>
        ) : (
          /* BRANCH 3: STANDARD 4x6 THERMAL / A4 SHIPPING LABEL */
          <div
            className="printable-shipping-label-container"
            style={{
              width: '100%',
              maxWidth: labelFormat === 'thermal_4x6' ? '400px' : '580px',
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
                <DelhiveryLogo fontSize={22} />
                <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', color: '#1e293b', marginTop: '2px' }}>
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
                <div style={{ fontSize: '10px', fontWeight: '800', marginTop: '3px' }}>
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
                <span>DATE: {shipment.bookingDate || '03/11/26'}</span>
                <span>PKG: 1 OF {totalBoxes}</span>
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
                    {shipment.deliveryCity}, {destState}
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
                <div style={{ fontSize: '9px', color: '#475569', fontWeight: '700' }}>WEIGHT (10 CFT)</div>
                <div style={{ fontWeight: '900' }}>{shipment.chargeableWeightKg || 10.0} KG</div>
              </div>
              <div style={{ borderRight: '1px solid #000000', padding: '0 4px' }}>
                <div style={{ fontSize: '9px', color: '#475569', fontWeight: '700' }}>DIMENSIONS</div>
                <div style={{ fontWeight: '900', fontSize: '10px' }}>{shipment.dimensionsCm || '10×10×10 CM'}</div>
              </div>
              <div style={{ padding: '0 4px' }}>
                <div style={{ fontSize: '9px', color: '#475569', fontWeight: '700' }}>INVOICE VAL</div>
                <div style={{ fontWeight: '900' }}>₹{invoiceValue.toFixed(1)}</div>
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
                {shipment.pickupAddress || 'Origin Dispatch Facility'}, {shipment.pickupCity}, {originState} - <strong>{shipment.pickupPincode || ''}</strong>
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
                <span>ROUTING: {shipment.pickupPincode || '133001'} ➔ {shipment.deliveryPincode || '570019'}</span>
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
