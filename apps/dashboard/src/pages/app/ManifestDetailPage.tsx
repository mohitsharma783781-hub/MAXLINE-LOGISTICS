import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Printer,
  Download,
  CheckCircle2,
  ArrowLeft,
  Truck,
  Building2,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Alert,
} from '../../components/ui';
import type { Manifest } from '../../types/manifests';
import { MANIFEST_STATUS_CONFIG } from '../../types/manifests';
import { ManifestEngine } from '../../services/manifestEngine';
import { BarcodeService } from '../../services/barcodeService';
import { useTenant } from '../../context/TenantContext';

export const ManifestDetailPage: React.FC = () => {
  const { manifestId, id } = useParams<{ manifestId?: string; id?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeTenant } = useTenant();

  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  const targetId = manifestId || id || 'man-del-1001';

  useEffect(() => {
    setManifest(ManifestEngine.getManifest(targetId));
  }, [targetId]);

  // Auto-print if query param present
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

  const handleMarkHandover = async () => {
    if (!manifest) return;
    const handoverName = activeTenant?.companyName ? `${activeTenant.companyName} Dispatch Team` : 'Authorized Dispatch Officer';
    const updated = await ManifestEngine.markHandover(
      manifest.id,
      handoverName,
      'Handed over parcels to courier collection executive'
    );
    if (updated) {
      setManifest({ ...updated });
      setActionAlert(`Manifest ${updated.manifestNumber} successfully marked as HANDED OVER! Included shipments updated to Picked Up.`);
    }
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Pickups & Manifests', path: '/app/pickups' },
    { label: manifest?.manifestNumber || targetId, path: `/app/manifests/${targetId}` },
  ];

  if (!manifest) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert variant="danger" title="Manifest Not Found">
          The requested shipping manifest reference does not exist or has been removed.
        </Alert>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/pickups')} style={{ marginTop: '16px' }}>
          Back to Pickups & Manifests
        </Button>
      </div>
    );
  }

  const statusConfig = MANIFEST_STATUS_CONFIG.find((c) => c.key === manifest.status) || {
    label: manifest.status,
    variant: 'info' as const,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Clean A4 Print Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
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
          .printable-manifest-document,
          .printable-manifest-document * {
            visibility: visible;
          }
          .printable-manifest-document {
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
          title={`Courier Manifest — ${manifest.manifestNumber}`}
          description={`Courier: ${manifest.courierName} • Warehouse: ${manifest.warehouseName} • Status: ${manifest.status}`}
          breadcrumbs={breadcrumbs}
          actions={
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/pickups')}
                leftIcon={<ArrowLeft size={16} />}
              >
                Back to Pickups & Manifests
              </Button>

              {manifest.status === 'GENERATED' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleMarkHandover}
                  leftIcon={<CheckCircle2 size={16} />}
                  style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                >
                  Confirm Physical Handover
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer size={16} />}
                style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: '700' }}
              >
                Print Manifest (A4 Sheet)
              </Button>
            </div>
          }
        />
      </div>

      {actionAlert && (
        <div className="no-print">
          <Alert variant="success" title="Status Updated">
            {actionAlert}
          </Alert>
        </div>
      )}

      {/* PRINTABLE MANIFEST CONTAINER */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Card
          className="printable-manifest-document"
          style={{
            width: '100%',
            maxWidth: '880px',
            padding: '28px 32px',
            backgroundColor: '#ffffff',
            color: '#000000',
            border: '2px solid #000000',
            borderRadius: '4px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          {/* 1. MANIFEST DOCUMENT HEADER */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2.5px solid #000000',
              paddingBottom: '14px',
              marginBottom: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>
                DELHIVERY COURIER HANDOVER MANIFEST
              </div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#334155', marginTop: '2px' }}>
                MAXLINE LOGISTICS AGGREGATOR NETWORK • FIRST-MILE DISPATCH RUN SHEET
              </div>
            </div>

            <div style={{ textAlign: 'right', minWidth: '220px' }}>
              <div
                dangerouslySetInnerHTML={{
                  __html: BarcodeService.generateBarcodeSvg(manifest.manifestNumber, 36, 1.8),
                }}
                style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}
              />
              <div style={{ fontSize: '14px', fontWeight: '900', fontFamily: 'monospace', marginTop: '2px' }}>
                {manifest.manifestNumber}
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                Date: <strong>{manifest.generatedAt}</strong>
              </div>
            </div>
          </div>

          {/* 2. DISPATCH & WAREHOUSE METADATA GRID */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              borderBottom: '2px solid #000000',
              paddingBottom: '14px',
              marginBottom: '16px',
              fontSize: '11px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#475569' }}>
                COURIER PARTNER & DISPATCH INFO
              </div>
              <div style={{ marginTop: '4px', fontSize: '13px', fontWeight: '900' }}>
                {manifest.courierName}
              </div>
              <div style={{ marginTop: '2px' }}>
                Pickup Request Ref (PRQ): <strong style={{ color: '#0284c7' }}>{manifest.pickupRequestId}</strong>
              </div>
              <div style={{ marginTop: '2px' }}>
                Handover Status: <strong style={{ textTransform: 'uppercase' }}>{manifest.status.replace('_', ' ')}</strong>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#475569' }}>
                ORIGIN DISPATCH HUB (SHIPPER)
              </div>
              <div style={{ marginTop: '4px', fontSize: '13px', fontWeight: '900' }}>
                {manifest.warehouseName || activeTenant?.companyName || 'Primary Fulfillment Warehouse'}
              </div>
              <div style={{ marginTop: '2px' }}>
                Plot 42, Industrial Area Phase 1, Panchkula, Haryana - <strong>134113</strong>
              </div>
              <div style={{ marginTop: '2px' }}>
                Contact: <strong>Mohit Sharma (+91 70091 74879)</strong>
              </div>
            </div>
          </div>

          {/* 3. SHIPMENT ITEMS SPECIFICATIONS TABLE */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px' }}>
              Handover Parcel Breakdown ({manifest.items.length} Shipments)
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #000000', textAlign: 'left' }}>
                  <th style={{ padding: '8px 6px', width: '32px' }}>#</th>
                  <th style={{ padding: '8px 6px' }}>AWB Number</th>
                  <th style={{ padding: '8px 6px' }}>Order ID</th>
                  <th style={{ padding: '8px 6px' }}>Recipient & Destination</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>Pkgs</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>Weight</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>Mode</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>COD Amount</th>
                </tr>
              </thead>
              <tbody>
                {manifest.items.map((item, idx) => (
                  <tr key={item.shipmentId || idx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '8px 6px' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 6px', fontWeight: '900', fontFamily: 'monospace', fontSize: '12px' }}>
                      {item.awb}
                    </td>
                    <td style={{ padding: '8px 6px' }}>{item.orderRef}</td>
                    <td style={{ padding: '8px 6px' }}>
                      <strong>{item.recipientName}</strong>
                      <div style={{ fontSize: '10px', color: '#475569' }}>{item.recipientCity}</div>
                    </td>
                    <td style={{ padding: '8px 6px', textAlign: 'center' }}>{item.packageCount}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: '700' }}>
                      {(item.weightGrams / 1000).toFixed(2)} KG
                    </td>
                    <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '2px',
                          fontSize: '10px',
                          fontWeight: '800',
                          backgroundColor: item.paymentMode === 'COD' ? '#fee2e2' : '#f0fdf4',
                          color: item.paymentMode === 'COD' ? '#b91c1c' : '#15803d',
                        }}
                      >
                        {item.paymentMode}
                      </span>
                    </td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: '900' }}>
                      {item.paymentMode === 'COD' ? `₹${(item.codAmountMinor / 100).toFixed(2)}` : '₹0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #000000', fontWeight: '900', fontSize: '12px' }}>
                  <td colSpan={4} style={{ padding: '10px 6px', textAlign: 'right' }}>
                    TOTAL MANIFEST DISPATCH SUMMARY:
                  </td>
                  <td style={{ padding: '10px 6px', textAlign: 'center' }}>{manifest.totalPackages} Box(es)</td>
                  <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                    {(manifest.totalWeightGrams / 1000).toFixed(2)} KG
                  </td>
                  <td style={{ padding: '10px 6px', textAlign: 'center' }}>-</td>
                  <td style={{ padding: '10px 6px', textAlign: 'right', color: '#16a34a' }}>
                    ₹{(manifest.totalCodAmountMinor / 100).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 4. DUAL VERIFICATION & SIGN-OFF BOXES */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              border: '2px solid #000000',
              padding: '14px 18px',
              borderRadius: '2px',
              fontSize: '11px',
              backgroundColor: '#fafafa',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: '#1e293b' }}>
                WAREHOUSE DISPATCH SIGN-OFF
              </div>
              <div style={{ marginTop: '8px' }}>
                Handed Over By: <strong>{manifest.handoverBy || (activeTenant?.companyName ? `${activeTenant.companyName} Dispatch Team` : 'Authorized Dispatch Officer')}</strong>
              </div>
              <div style={{ marginTop: '4px' }}>
                Date & Time: <strong>{manifest.handedOverAt || manifest.generatedAt}</strong>
              </div>
              <div style={{ marginTop: '28px', borderTop: '1px dashed #000000', paddingTop: '4px' }}>
                Shipper Signature & Warehouse Stamp
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: '#1e293b' }}>
                DELHIVERY RIDER HANDOVER ACKNOWLEDGEMENT
              </div>
              <div style={{ marginTop: '8px' }}>
                Field Executive (FE) Name: _______________________
              </div>
              <div style={{ marginTop: '4px' }}>
                FE Phone Number: _______________________
              </div>
              <div style={{ marginTop: '4px' }}>
                Verified Packets Received: [ {manifest.totalPackages} ]
              </div>
              <div style={{ marginTop: '12px', borderTop: '1px dashed #000000', paddingTop: '4px' }}>
                Courier Executive Signature & Vehicle No.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
