import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Printer,
  Download,
  CheckCircle2,
  ArrowLeft,
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

export const ManifestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  useEffect(() => {
    const targetId = id || 'man-9840192';
    setManifest(ManifestEngine.getManifest(targetId));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!manifest) return;
    const element = document.createElement('a');
    const file = new Blob([`DEMO MANIFEST PDF FOR MANIFEST NUMBER: ${manifest.manifestNumber}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${manifest.manifestNumber}-shipping-manifest.pdf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleMarkHandover = async () => {
    if (!manifest) return;
    const updated = await ManifestEngine.markHandover(manifest.id, 'Operations Manager', 'Handed over parcels to courier associate');
    if (updated) {
      setManifest({ ...updated });
      setActionAlert(`Manifest ${updated.manifestNumber} successfully marked as HANDED_OVER!`);
    }
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Shipping Manifests', path: '/app/manifests' },
    { label: manifest?.manifestNumber || id || 'Detail', path: `/app/manifests/${id}` },
  ];

  if (!manifest) {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <Alert variant="danger" title="Manifest Not Found">
          The requested shipping manifest reference does not exist.
        </Alert>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/manifests')} style={{ marginTop: 'var(--space-4)' }}>
          Back to Manifests
        </Button>
      </div>
    );
  }

  const statusConfig = MANIFEST_STATUS_CONFIG.find((c) => c.key === manifest.status) || {
    label: manifest.status,
    variant: 'info' as const,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Embedded Print CSS Rules */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-manifest-document, .printable-manifest-document * {
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

      {/* PAGE HEADER (Hidden during print) */}
      <div className="no-print">
        <PageHeader
          title={`Shipping Manifest ${manifest.manifestNumber}`}
          description={`Courier: ${manifest.courierName} • Warehouse: ${manifest.warehouseName} • Status: ${manifest.status}`}
          breadcrumbs={breadcrumbs}
          actions={
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Button variant="outline" size="sm" onClick={() => navigate('/app/manifests')} leftIcon={<ArrowLeft size={16} />}>
                Back to Manifests
              </Button>

              <Button variant="outline" size="sm" onClick={handleDownload} leftIcon={<Download size={16} />}>
                Download PDF
              </Button>

              {manifest.status === 'GENERATED' && (
                <Button variant="primary" size="sm" onClick={handleMarkHandover} leftIcon={<CheckCircle2 size={16} />}>
                  Mark as Handed Over
                </Button>
              )}

              <Button variant="primary" size="sm" onClick={handlePrint} leftIcon={<Printer size={16} />}>
                Print Manifest
              </Button>
            </div>
          }
        />
      </div>

      {actionAlert && (
        <div className="no-print">
          <Alert variant="success" title="Handover Status Updated">
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
            maxWidth: '900px',
            padding: '32px',
            backgroundColor: '#ffffff',
            color: '#000000',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* MANIFEST DOCUMENT HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000000', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>
                COURIER HANDOVER SHIPPING MANIFEST
              </h1>
              <div style={{ fontSize: '13px', color: '#555555', marginTop: '4px' }}>
                Platform Handover & Dispatch Document • Multi-Tenant SaaS Engine
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-violet-main)', margin: 0 }}>
                {manifest.manifestNumber}
              </h2>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Date: <strong>{manifest.generatedAt}</strong></div>
              <Badge variant={statusConfig.variant} style={{ marginTop: '6px' }}>{statusConfig.label}</Badge>
            </div>
          </div>

          {/* COURIER & WAREHOUSE METADATA */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderBottom: '1px solid #cccccc', paddingBottom: '16px', marginBottom: '20px', fontSize: '13px' }}>
            <div>
              <strong style={{ fontSize: '14px', textTransform: 'uppercase' }}>COURIER PARTNER DETAILS:</strong>
              <div style={{ marginTop: '4px' }}>Carrier: <strong>{manifest.courierName}</strong></div>
              <div>Pickup Ref: <strong>{manifest.pickupRequestId}</strong></div>
            </div>
            <div>
              <strong style={{ fontSize: '14px', textTransform: 'uppercase' }}>PICKUP WAREHOUSE LOCATION:</strong>
              <div style={{ marginTop: '4px' }}>Location: <strong>{manifest.warehouseName}</strong></div>
              <div>Address: Plot 42, MIDC Area, Bhiwandi, Thane, MH - 421302</div>
            </div>
          </div>

          {/* SHIPMENT ITEMS TABLE */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase' }}>
              Handover Parcel Specifications ({manifest.items.length} Shipments)
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2', borderBottom: '2px solid #000000', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>#</th>
                  <th style={{ padding: '8px' }}>AWB Tracking Number</th>
                  <th style={{ padding: '8px' }}>Order Ref</th>
                  <th style={{ padding: '8px' }}>Recipient & Destination</th>
                  <th style={{ padding: '8px' }}>Pkgs</th>
                  <th style={{ padding: '8px' }}>Weight</th>
                  <th style={{ padding: '8px' }}>Mode</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>COD Amount</th>
                </tr>
              </thead>
              <tbody>
                {manifest.items.map((item, idx) => (
                  <tr key={item.shipmentId} style={{ borderBottom: '1px solid #eeeeee' }}>
                    <td style={{ padding: '8px' }}>{idx + 1}</td>
                    <td style={{ padding: '8px', fontWeight: 'bold', fontFamily: 'monospace' }}>{item.awb}</td>
                    <td style={{ padding: '8px' }}>{item.orderRef}</td>
                    <td style={{ padding: '8px' }}>{item.recipientName} ({item.recipientCity})</td>
                    <td style={{ padding: '8px' }}>{item.packageCount}</td>
                    <td style={{ padding: '8px' }}>{(item.weightGrams / 1000).toFixed(2)} kg</td>
                    <td style={{ padding: '8px' }}>{item.paymentMode}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                      {item.paymentMode === 'COD' ? `₹${(item.codAmountMinor / 100).toFixed(2)}` : '₹0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#f9f9f9', borderTop: '2px solid #000000', fontWeight: 'bold' }}>
                  <td colSpan={4} style={{ padding: '10px', textAlign: 'right' }}>TOTAL MANIFEST SUMMARY:</td>
                  <td style={{ padding: '10px' }}>{manifest.totalPackages} Pkgs</td>
                  <td style={{ padding: '10px' }}>{(manifest.totalWeightGrams / 1000).toFixed(2)} kg</td>
                  <td style={{ padding: '10px' }}>-</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: 'var(--color-violet-main)' }}>
                    ₹{(manifest.totalCodAmountMinor / 100).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* DRIVER SIGNATURE & HANDOVER SIGN-OFF BOX */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', border: '1.5px solid #000000', padding: '16px', borderRadius: '4px', fontSize: '12px' }}>
            <div>
              <strong style={{ fontSize: '13px', textTransform: 'uppercase' }}>WAREHOUSE DISPATCH SIGN-OFF:</strong>
              <div style={{ marginTop: '8px' }}>Handover Manager: <strong>{manifest.handoverBy || 'Rajesh Kumar'}</strong></div>
              <div style={{ marginTop: '4px' }}>Timestamp: <strong>{manifest.handedOverAt || manifest.generatedAt}</strong></div>
              <div style={{ marginTop: '24px', borderTop: '1px dashed #000000', paddingTop: '4px' }}>
                Authorized Warehouse Signature
              </div>
            </div>

            <div>
              <strong style={{ fontSize: '13px', textTransform: 'uppercase' }}>CARRIER DRIVER HANDOVER ACKNOWLEDGEMENT:</strong>
              <div style={{ marginTop: '8px' }}>Carrier Driver Name: _______________________</div>
              <div style={{ marginTop: '4px' }}>Driver Phone Number: _______________________</div>
              <div style={{ marginTop: '24px', borderTop: '1px dashed #000000', paddingTop: '4px' }}>
                Carrier Driver Signature & Stamp
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
