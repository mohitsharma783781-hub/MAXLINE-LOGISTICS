import React, { useState } from 'react';
import { FileText, Printer, CheckCircle2, Clock } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Drawer,
} from '../../components/ui';
import { ManifestEngine } from '../../services/manifestEngine';
import type { Manifest } from '../../types/manifests';
import { formatCurrency } from '../../utils/formatters';

export const CustomerManifestsPage: React.FC = () => {
  const tenantId = 'tenant-demo-01';
  const manifests = ManifestEngine.getAllManifests(tenantId);
  const [selectedManifest, setSelectedManifest] = useState<Manifest | null>(null);

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Carrier Pickup Manifests', path: '/app/manifests' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title="Carrier Pickup Manifests"
        description="View and download daily pickup handover manifests for courier drivers."
        breadcrumbs={breadcrumbs}
      />

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Total Manifests" value={manifests.length} subtext="Pickup batches" icon={FileText} />
        <StatCard label="Total Shipments Handed Over" value={manifests.reduce((s, m) => s + m.shipmentCount, 0)} subtext="Dispatched parcels" icon={CheckCircle2} />
        <StatCard label="Total Weight" value={`${(manifests.reduce((s, m) => s + m.totalWeightGrams, 0) / 1000).toFixed(1)} KG`} subtext="Gross manifest weight" icon={Clock} />
      </div>

      {/* Manifests Table */}
      <Card style={{ padding: '16px' }}>
        <Table<Manifest>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'manifestNumber',
              header: 'Manifest Number',
              render: (r) => (
                <div>
                  <strong style={{ color: 'var(--color-violet-main)', fontFamily: 'monospace' }}>{r.manifestNumber}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    Pickup Ref: {r.pickupRequestId}
                  </div>
                </div>
              ),
            },
            { key: 'courierName', header: 'Courier Partner', render: (r) => <Badge variant="brand">{r.courierName}</Badge> },
            { key: 'warehouseName', header: 'Pickup Warehouse', render: (r) => <span>{r.warehouseName}</span> },
            { key: 'shipmentCount', header: 'Shipments', render: (r) => <strong>{r.shipmentCount} Parcels ({r.totalPackages} Boxes)</strong> },
            { key: 'totalWeightGrams', header: 'Total Weight', render: (r) => <span>{(r.totalWeightGrams / 1000).toFixed(1)} KG</span> },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <Badge variant={r.status === 'HANDED_OVER' ? 'success' : 'warning'}>{r.status}</Badge>,
            },
            { key: 'generatedAt', header: 'Date/Time', render: (r) => <span style={{ fontSize: '11px' }}>{r.generatedAt}</span> },
            {
              key: 'actions',
              header: 'Actions',
              render: (r) => (
                <Button variant="outline" size="sm" leftIcon={<Printer size={13} />} onClick={() => setSelectedManifest(r)}>
                  View & Print PDF
                </Button>
              ),
            },
          ]}
          data={manifests}
        />
      </Card>

      {/* MANIFEST PRINT PDF MODAL / DRAWER */}
      {selectedManifest && (
        <Drawer
          isOpen={!!selectedManifest}
          onClose={() => setSelectedManifest(null)}
          title={`Carrier Pickup Manifest — ${selectedManifest.manifestNumber}`}
          position="right"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <div>
                <strong style={{ fontSize: '16px', color: 'var(--color-violet-main)' }}>{selectedManifest.manifestNumber}</strong>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{selectedManifest.courierName} &bull; {selectedManifest.generatedAt}</div>
              </div>
              <Button size="sm" variant="primary" onClick={() => window.print()} leftIcon={<Printer size={14} />}>
                Print Carrier Copy
              </Button>
            </div>

            {/* Summary Details */}
            <div style={{ backgroundColor: 'var(--color-surface-secondary)', padding: '12px', borderRadius: '6px', fontSize: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>Warehouse: <strong>{selectedManifest.warehouseName}</strong></div>
              <div>Total Shipments: <strong>{selectedManifest.shipmentCount} Orders</strong></div>
              <div>Total Packages: <strong>{selectedManifest.totalPackages} Boxes</strong></div>
              <div>Total Weight: <strong>{(selectedManifest.totalWeightGrams / 1000).toFixed(1)} KG</strong></div>
              <div>COD Total: <strong>{formatCurrency(selectedManifest.totalCodAmountMinor / 100)}</strong></div>
              <div>Status: <Badge variant="success">{selectedManifest.status}</Badge></div>
            </div>

            {/* Included Shipments List */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '10px' }}>
              <strong style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Manifested Dispatches List</strong>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-surface-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '4px' }}>AWB</th>
                    <th style={{ padding: '4px' }}>Order ID</th>
                    <th style={{ padding: '4px' }}>Recipient</th>
                    <th style={{ padding: '4px' }}>Pay Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedManifest.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '4px', fontFamily: 'monospace' }}>{item.awb}</td>
                      <td style={{ padding: '4px' }}>{item.orderRef}</td>
                      <td style={{ padding: '4px' }}>{item.recipientName} ({item.recipientCity})</td>
                      <td style={{ padding: '4px' }}>{item.paymentMode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Courier Driver Signature Handover Section */}
            <div style={{ border: '1px dashed var(--color-border)', padding: '12px', borderRadius: '6px', marginTop: '12px', fontSize: '12px' }}>
              <strong>Courier Driver Pickup Handover Confirmation</strong>
              <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>Driver Name: _________________</div>
                <div>Driver Signature: _______________</div>
                <div>Pickup Date/Time: ______________</div>
                <div>Vehicle Number: ______________</div>
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
