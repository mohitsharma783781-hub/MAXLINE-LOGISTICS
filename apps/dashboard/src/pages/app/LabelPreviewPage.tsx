import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Printer,
  Download,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Alert,
  Select,
} from '../../components/ui';
import type { LabelDocument, LabelDataPayload, LabelFormat } from '../../types/labels';
import { LabelService } from '../../services/labelService';
import { BarcodeService } from '../../services/barcodeService';

export const LabelPreviewPage: React.FC = () => {
  const { shipmentId, id } = useParams<{ shipmentId?: string; id?: string }>();
  const navigate = useNavigate();

  const targetShipmentId = shipmentId || id || 'SHP-9840192';
  const [format, setFormat] = useState<LabelFormat>('THERMAL_4X6');
  const [labelDoc, setLabelDoc] = useState<LabelDocument | null>(null);
  const [multiLabels, setMultiLabels] = useState<LabelDataPayload[]>([]);
  const [selectedPkgIndex, setSelectedPkgIndex] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      LabelService.generateLabel(targetShipmentId, format).then((doc) => {
        setLabelDoc(doc);
        const labels = LabelService.getMultiPackageLabelData(targetShipmentId);
        setMultiLabels(labels);
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate shipping label.');
    }
  }, [targetShipmentId, format]);

  const labelData = multiLabels[selectedPkgIndex - 1] || multiLabels[0];

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!labelData) return;
    const element = document.createElement('a');
    const file = new Blob([`DEMO SHIPPING LABEL PDF FOR AWB: ${labelData.awb} (Pkg ${labelData.packageIndex} of ${labelData.packageCount})`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${labelData.awb}-pkg-${labelData.packageIndex}-of-${labelData.packageCount}.pdf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleRegenerate = async () => {
    try {
      const doc = await LabelService.regenerateLabel(targetShipmentId, format);
      setLabelDoc(doc);
      setMultiLabels(LabelService.getMultiPackageLabelData(targetShipmentId));
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to regenerate shipping label.');
    }
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Shipments', path: '/app/shipments' },
    { label: targetShipmentId, path: `/app/shipments/${targetShipmentId}` },
    { label: 'Shipping Label', path: `/app/shipments/${targetShipmentId}/label` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Embedded Print CSS Rules */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-shipping-label, .printable-shipping-label * {
            visibility: visible;
          }
          .printable-shipping-label {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* PAGE HEADER (Hidden during printing) */}
      <div className="no-print">
        <PageHeader
          title={`Shipping Label - ${labelData?.awb || targetShipmentId}`}
          description="4x6 Thermal & A4 printable shipping label with machine-readable Code 128 barcode."
          breadcrumbs={breadcrumbs}
          actions={
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              {multiLabels.length > 1 && (
                <Select
                  value={selectedPkgIndex.toString()}
                  onChange={(e) => setSelectedPkgIndex(Number(e.target.value))}
                  options={multiLabels.map((lbl) => ({
                    label: `Package ${lbl.packageIndex} of ${lbl.packageCount}`,
                    value: lbl.packageIndex.toString(),
                  }))}
                  style={{ width: '180px' }}
                />
              )}

              <Select
                value={format}
                onChange={(e) => setFormat(e.target.value as LabelFormat)}
                options={[
                  { label: 'Format: 4x6 Thermal Label', value: 'THERMAL_4X6' },
                  { label: 'Format: A4 Print Sheet', value: 'A4' },
                ]}
                style={{ width: '200px' }}
              />

              <Button variant="outline" size="sm" onClick={() => navigate(`/app/shipments/${targetShipmentId}`)} leftIcon={<ArrowLeft size={16} />}>
                Back to Shipment
              </Button>

              <Button variant="outline" size="sm" onClick={handleRegenerate} leftIcon={<RotateCcw size={16} />}>
                Regenerate
              </Button>

              <Button variant="outline" size="sm" onClick={handleDownload} leftIcon={<Download size={16} />}>
                Download PDF
              </Button>

              <Button variant="primary" size="sm" onClick={handlePrint} leftIcon={<Printer size={16} />}>
                Print Label
              </Button>
            </div>
          }
        />
      </div>

      {errorMsg && (
        <div className="no-print">
          <Alert variant="danger" title="Label Generation Failure">
            {errorMsg}
          </Alert>
        </div>
      )}

      {/* LABEL PREVIEW CONTAINER */}
      {labelData && (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '0 auto' }}>
          <div
            className="printable-shipping-label"
            style={{
              width: format === 'THERMAL_4X6' ? '420px' : '680px',
              backgroundColor: '#ffffff',
              color: '#000000',
              border: '2px solid #000000',
              borderRadius: '4px',
              padding: '16px',
              fontFamily: 'Arial, sans-serif',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              boxSizing: 'border-box',
            }}
          >
            {/* 1. TOP CARRIER HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000000', paddingBottom: '8px', marginBottom: '8px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>
                  {labelData.courierName}
                </h2>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{labelData.serviceName}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', border: '1px solid #000000', padding: '2px 6px' }}>
                  Pkg {labelData.packageIndex} of {labelData.packageCount}
                </span>
              </div>
            </div>

            {/* 2. PRIMARY AWB BARCODE SECTION */}
            <div style={{ textAlign: 'center', padding: '8px 0', borderBottom: '2px solid #000000', marginBottom: '8px' }}>
              <div
                dangerouslySetInnerHTML={{
                  __html: BarcodeService.generateBarcodeSvg(labelData.awb, 55, 2),
                }}
              />
            </div>

            {/* 3. RECIPIENT (SHIP TO) SECTION */}
            <div style={{ borderBottom: '2px solid #000000', paddingBottom: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#444' }}>
                SHIP TO:
              </span>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '2px' }}>{labelData.recipientName}</div>
              <div style={{ fontSize: '13px', marginTop: '2px', lineHeight: 1.3 }}>{labelData.recipientAddress}</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>Phone: {labelData.recipientPhone}</div>
            </div>

            {/* 4. SENDER (SHIP FROM) SECTION */}
            <div style={{ borderBottom: '2px solid #000000', paddingBottom: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#444' }}>
                SHIP FROM:
              </span>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{labelData.senderName}</div>
              <div style={{ fontSize: '11px', lineHeight: 1.2 }}>{labelData.senderAddress}</div>
              <div style={{ fontSize: '11px' }}>Ph: {labelData.senderPhone}</div>
            </div>

            {/* 5. PAYMENT & WEIGHT SPECIFICATIONS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderBottom: '2px solid #000000', paddingBottom: '8px', marginBottom: '8px' }}>
              <div style={{ borderRight: '1px solid #000000', paddingRight: '4px' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase' }}>PAYMENT MODE:</span>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {labelData.paymentMode} {labelData.paymentMode === 'COD' ? `₹${labelData.codAmount}` : ''}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase' }}>WEIGHT / ORD:</span>
                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Chg Wt: {labelData.chargeableWeightKg} KG</div>
                <div style={{ fontSize: '11px' }}>Ord Ref: {labelData.orderRef}</div>
              </div>
            </div>

            {/* 6. FOOTER QR & TRACKING */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
              <div>
                <div>Shipment Ref: <strong>{labelData.shipmentRef}</strong></div>
                <div>Generated: {labelDoc?.generatedAt || 'Live Platform'}</div>
              </div>
              {labelData.qrCodeUrl && (
                <img src={labelData.qrCodeUrl} alt="QR Tracking" style={{ width: '45px', height: '45px' }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
