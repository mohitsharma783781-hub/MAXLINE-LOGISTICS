import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Truck,
  CheckCircle2,
  Eye,
  Building2,
  Printer,
  Plus,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Select,
  Table,
  Alert,
  Modal,
  Input,
} from '../../components/ui';
import type { Manifest } from '../../types/manifests';
import { MANIFEST_STATUS_CONFIG } from '../../types/manifests';
import { ManifestEngine } from '../../services/manifestEngine';

export const ManifestsPage: React.FC = () => {
  const navigate = useNavigate();

  // Submenu Manifest Type Tabs: ALL | DAILY | COURIER_WISE | WAREHOUSE_WISE | PICKUP
  const [activeManifestTab, setActiveManifestTab] = useState<'ALL' | 'DAILY' | 'COURIER_WISE' | 'WAREHOUSE_WISE' | 'PICKUP'>('ALL');

  const [manifests, setManifests] = useState<Manifest[]>(() => ManifestEngine.getAllManifests());
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  // Selected Manifest Preview Modal
  const [selectedManifest, setSelectedManifest] = useState<Manifest | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const filteredManifests = useMemo(() => {
    return manifests.filter((m) => {
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = m.manifestNumber.toLowerCase().includes(q);
        const matchCourier = m.courierName.toLowerCase().includes(q);
        const matchWh = m.warehouseName.toLowerCase().includes(q);
        if (!matchNum && !matchCourier && !matchWh) return false;
      }
      return true;
    });
  }, [manifests, statusFilter, searchQuery]);

  const handleMarkHandover = async (manifestId: string) => {
    const updated = await ManifestEngine.markHandover(manifestId, 'Operations Manager', 'Handed over parcels to courier associate');
    if (updated) {
      setActionAlert(`Manifest ${updated.manifestNumber} marked HANDED_OVER successfully.`);
      setManifests(ManifestEngine.getAllManifests());
    }
  };

  const handleOpenInspect = (manifest: Manifest) => {
    setSelectedManifest(manifest);
    setIsPreviewOpen(true);
  };

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Bulk Operations Center', path: '/app/orders/bulk-upload' },
    { label: 'Carrier Manifest Center', path: '/app/manifests' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. Page Header */}
      <PageHeader
        title="Carrier Dispatch Manifest Center"
        description="Generate daily courier handover manifests, warehouse dispatches, print driver sign-off sheets, and track parcel handover logs."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/pickups')} leftIcon={<Truck size={14} />}>
              Pickup Requests
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/app/manifests/create')} leftIcon={<Plus size={16} />} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
              + Generate New Manifest
            </Button>
          </div>
        }
      />

      {actionAlert && (
        <Alert variant="success" title="Manifest Status Updated">
          {actionAlert}
        </Alert>
      )}

      {/* 2. STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Shipping Manifests" value={manifests.length} subtext="Generated handover documents" icon={FileText} />
        <StatCard label="Handed Over Dispatches" value={manifests.filter((m) => m.status === 'HANDED_OVER').length} subtext="Carrier driver sign-offs" badgeText="COMPLETED" badgeVariant="success" icon={CheckCircle2} />
        <StatCard label="Active Warehouses" value={2} subtext="Bhiwandi & Delhi FC hubs" icon={Building2} />
      </div>

      {/* 3. Submenu Navigation & Search Filter Card */}
      <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        
        {/* SUBMENU MANIFEST TYPE TABS */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px', overflowX: 'auto' }}>
          {[
            { id: 'ALL', label: `All Manifests (${manifests.length})` },
            { id: 'DAILY', label: 'Daily Manifests' },
            { id: 'COURIER_WISE', label: 'Courier Wise Manifests' },
            { id: 'WAREHOUSE_WISE', label: 'Warehouse Dispatches' },
            { id: 'PICKUP', label: 'Pickup Manifests' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveManifestTab(tab.id as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeManifestTab === tab.id ? '#0284c7' : 'transparent',
                color: activeManifestTab === tab.id ? '#ffffff' : '#64748b',
                fontWeight: activeManifestTab === tab.id ? '700' : '500',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SEARCH & FILTERS TOOLBAR */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <Input
              placeholder="Search by Manifest Number, Courier, Warehouse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All Handover Statuses', value: 'ALL' },
              { label: 'GENERATED', value: 'GENERATED' },
              { label: 'HANDED_OVER', value: 'HANDED_OVER' },
              { label: 'CLOSED', value: 'CLOSED' },
            ]}
          />
        </div>

        {/* MANIFESTS TABLE */}
        <Table<Manifest>
          keyExtractor={(m) => m.id}
          columns={[
            {
              key: 'manifestNumber',
              header: 'Manifest Number',
              render: (row) => (
                <div>
                  <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{row.manifestNumber}</strong>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Pickup Ref: {row.pickupRequestId}</div>
                </div>
              ),
            },
            {
              key: 'courierName',
              header: 'Courier Partner',
              render: (row) => <strong>{row.courierName}</strong>,
            },
            {
              key: 'warehouseName',
              header: 'Pickup Warehouse',
              render: (row) => <span>{row.warehouseName}</span>,
            },
            {
              key: 'shipmentCount',
              header: 'Dispatches & Weight',
              render: (row) => <Badge variant="neutral">{row.shipmentCount} Parcels ({(row.totalWeightGrams / 1000).toFixed(1)} KG)</Badge>,
            },
            {
              key: 'totalCodAmountMinor',
              header: 'Total COD Value',
              render: (row) => <strong>₹{(row.totalCodAmountMinor / 100).toFixed(2)}</strong>,
            },
            {
              key: 'status',
              header: 'Handover Status',
              render: (row) => {
                const conf = MANIFEST_STATUS_CONFIG.find((c) => c.key === row.status) || {
                  label: row.status,
                  variant: 'info' as const,
                };
                return <Badge variant={conf.variant}>{conf.label}</Badge>;
              },
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Eye size={14} />}
                    onClick={() => handleOpenInspect(row)}
                  >
                    Inspect & Print
                  </Button>
                  {row.status === 'GENERATED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<CheckCircle2 size={14} />}
                      onClick={() => handleMarkHandover(row.id)}
                      style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                    >
                      Mark Handover
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={filteredManifests}
        />

      </Card>

      {/* 4. PRINTABLE MANIFEST SHEET PREVIEW MODAL */}
      {selectedManifest && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Official Courier Handover Manifest Sheet — ${selectedManifest.manifestNumber}`}
          maxWidth="850px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* OFFICIAL PRINTABLE MANIFEST SHEET BOX */}
            <div
              style={{
                border: '2px solid #000000',
                padding: '24px',
                backgroundColor: '#ffffff',
                color: '#000000',
                fontFamily: 'Arial, sans-serif',
                borderRadius: '6px',
              }}
            >
              {/* MANIFEST HEADER */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #000', paddingBottom: '12px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '22px', textTransform: 'uppercase' }}>{selectedManifest.courierName} DISPATCH MANIFEST</h2>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>OFFICIAL CARRIER HANDOVER DOCUMENT</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace' }}>{selectedManifest.manifestNumber}</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>DATE: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              {/* LOCATION & SUMMARY METRICS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '16px 0', borderBottom: '1px solid #000', paddingBottom: '12px', fontSize: '12px' }}>
                <div>
                  <strong>PICKUP WAREHOUSE ADDRESS:</strong>
                  <div>{selectedManifest.warehouseName}</div>
                  <div>Plot 42 MIDC Area, Bhiwandi, Thane - 421302</div>
                  <div>Contact: 9820011223</div>
                </div>
                <div>
                  <strong>HANDOVER DISPATCH SUMMARY:</strong>
                  <div>Total Dispatches: <strong>{selectedManifest.shipmentCount} Parcels</strong></div>
                  <div>Total Actual Weight: <strong>{(selectedManifest.totalWeightGrams / 1000).toFixed(2)} KG</strong></div>
                  <div>Total COD Value: <strong>₹{(selectedManifest.totalCodAmountMinor / 100).toFixed(2)}</strong></div>
                </div>
              </div>

              {/* AWB LIST TABLE */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #000', textAlign: 'left' }}>
                    <th style={{ padding: '6px' }}>#</th>
                    <th style={{ padding: '6px' }}>AWB Number</th>
                    <th style={{ padding: '6px' }}>Order ID</th>
                    <th style={{ padding: '6px' }}>Destination City</th>
                    <th style={{ padding: '6px' }}>Payment Mode</th>
                    <th style={{ padding: '6px' }}>Weight</th>
                    <th style={{ padding: '6px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {((selectedManifest as any).shipments || []).map((s: any, idx: number) => (
                    <tr key={s.id || idx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                      <td style={{ padding: '6px' }}>{idx + 1}</td>
                      <td style={{ padding: '6px', fontWeight: 'bold', fontFamily: 'monospace' }}>{s.awbNumber}</td>
                      <td style={{ padding: '6px' }}>{s.orderId}</td>
                      <td style={{ padding: '6px' }}>{s.destinationCity} ({s.destinationPincode})</td>
                      <td style={{ padding: '6px' }}>{s.paymentMode}</td>
                      <td style={{ padding: '6px' }}>{s.weightKg} KG</td>
                      <td style={{ padding: '6px' }}>{s.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* SIGNATURE SIGN-OFF ZONE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', borderTop: '2px solid #000', paddingTop: '16px', fontSize: '11px' }}>
                <div>
                  <strong style={{ display: 'block', marginBottom: '30px' }}>MERCHANT / WAREHOUSE EXECUTIVE SIGNATURE:</strong>
                  <div style={{ borderTop: '1px dashed #000', paddingTop: '4px' }}>Name & Date: ____________________</div>
                </div>

                <div>
                  <strong style={{ display: 'block', marginBottom: '30px' }}>COURIER PICKUP DRIVER / ASSOCIATE SIGNATURE:</strong>
                  <div style={{ borderTop: '1px dashed #000', paddingTop: '4px' }}>Driver Name & Vehicle #: ____________________</div>
                </div>
              </div>

            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                Close
              </Button>
              <Button variant="primary" leftIcon={<Printer size={16} />} onClick={() => setIsPreviewOpen(false)} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                Print Courier Handover Sheet
              </Button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
};
