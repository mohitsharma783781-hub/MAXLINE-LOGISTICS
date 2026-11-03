import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  FileText,
  Plus,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  Warehouse,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Alert,
} from '../../components/ui';
import { PickupEngine } from '../../services/pickupEngine';
import { ManifestEngine } from '../../services/manifestEngine';
import type { PickupRequest } from '../../types/pickups';
import type { Manifest } from '../../types/manifests';
import { useTenant } from '../../context/TenantContext';

export const CustomerPickupRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeTenant, activeTenantId } = useTenant();
  const tenantId = activeTenantId;

  const [activeTab, setActiveTab] = useState<'pickups' | 'manifests'>('pickups');
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  const loadData = () => {
    setPickups(PickupEngine.getAllPickups(tenantId));
    setManifests(ManifestEngine.getAllManifests(tenantId));
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const handleGenerateManifestForPickup = async (pickupId: string) => {
    const manifest = await ManifestEngine.generateManifest(pickupId);
    if (manifest) {
      loadData();
      navigate(`/app/manifests/${manifest.id}`);
    }
  };

  const handleMarkHandover = async (manifestId: string) => {
    const handoverName = activeTenant?.companyName ? `${activeTenant.companyName} Dispatch Team` : 'Authorized Dispatch Officer';
    const updated = await ManifestEngine.markHandover(manifestId, handoverName);
    if (updated) {
      loadData();
      setActionAlert(`Manifest ${updated.manifestNumber} marked as HANDED OVER! Included parcels updated to Picked Up.`);
    }
  };

  // Operational metrics
  const pendingPickupsCount = pickups.filter((p) => p.status === 'SCHEDULED' || p.status === 'REQUESTED').length;
  const handedOverParcelsCount = manifests
    .filter((m) => m.status === 'HANDED_OVER')
    .reduce((acc, m) => acc + m.shipmentCount, 0);

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Pickups & Manifests', path: '/app/pickups' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Pickups & Manifests Center"
        description="Schedule carrier vehicle collections from your Panchkula hub and generate official handover run sheets."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileText size={16} />}
              onClick={() => navigate('/app/manifests/create')}
            >
              + Create Manifest
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Truck size={16} />}
              onClick={() => navigate('/app/pickups/create')}
              style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: '700' }}
            >
              + Schedule Courier Pickup
            </Button>
          </div>
        }
      />

      {/* 2. Key Operational Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <StatCard
          title="Scheduled Pickups"
          value={pickups.length.toString()}
          subtitle="Total vehicle requests"
          icon={Truck}
        />
        <StatCard
          title="Pending Collection"
          value={pendingPickupsCount.toString()}
          subtitle="Awaiting courier rider"
          icon={Clock}
        />
        <StatCard
          title="Active Manifests"
          value={manifests.length.toString()}
          subtitle="Handover run sheets"
          icon={FileText}
        />
        <StatCard
          title="Parcels Handed Over"
          value={handedOverParcelsCount.toString()}
          subtitle="Successfully dispatched"
          icon={CheckCircle2}
        />
      </div>

      {actionAlert && (
        <Alert variant="success" title="Status Updated">
          {actionAlert}
        </Alert>
      )}

      {/* 3. Tabbed Operations Switcher */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', paddingBottom: '4px' }}>
        <button
          onClick={() => setActiveTab('pickups')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: '800',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'pickups' ? '3px solid #0284c7' : '3px solid transparent',
            color: activeTab === 'pickups' ? '#0284c7' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Truck size={16} />
          <span>Pickup Requests ({pickups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('manifests')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: '800',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'manifests' ? '3px solid #0284c7' : '3px solid transparent',
            color: activeTab === 'manifests' ? '#0284c7' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FileText size={16} />
          <span>Handover Manifests ({manifests.length})</span>
        </button>
      </div>

      {/* 4. Tab 1: Pickup Requests Table */}
      {activeTab === 'pickups' && (
        <Card style={{ padding: '0px', overflow: 'hidden' }}>
          <Table<PickupRequest>
            keyExtractor={(r) => r.id}
            columns={[
              {
                key: 'pickupNumber',
                header: 'Pickup PRQ Ref',
                render: (r) => (
                  <div>
                    <strong style={{ color: '#0284c7', fontFamily: 'monospace', fontSize: '13px' }}>
                      {r.pickupNumber || r.pickupReference}
                    </strong>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      {r.courierName || 'Delhivery Surface'}
                    </div>
                  </div>
                ),
              },
              {
                key: 'schedule',
                header: 'Scheduled Slot',
                render: (r) => (
                  <div>
                    <strong style={{ color: '#0f172a' }}>{r.pickupDate}</strong>
                    <div style={{ fontSize: '11px', color: '#475569' }}>{r.timeSlot}</div>
                  </div>
                ),
              },
              {
                key: 'warehouse',
                header: 'Origin Hub (Shipper)',
                render: (r) => (
                  <div>
                    <strong style={{ color: '#0f172a' }}>{r.warehouseName}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Panchkula (134113) • Contact: {r.contactPerson}
                    </div>
                  </div>
                ),
              },
              {
                key: 'shipments',
                header: 'Parcels',
                render: (r) => (
                  <div>
                    <strong>{r.shipmentCount} Parcel(s)</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{r.totalWeightKg} KG Total</div>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Dispatch Status',
                render: (r) => (
                  <Badge variant={r.status === 'SCHEDULED' ? 'info' : r.status === 'PICKED_UP' ? 'success' : 'neutral'}>
                    {r.statusText || r.status}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (r) => (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateManifestForPickup(r.id)}
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        color: '#0284c7',
                        borderColor: '#0284c7',
                        backgroundColor: '#f0f9ff',
                        fontWeight: '700',
                      }}
                    >
                      <FileText size={12} style={{ marginRight: '4px' }} />
                      Generate Manifest
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      title="View Details"
                      onClick={() => navigate(`/app/pickups/${r.id}`)}
                      style={{ padding: '4px 8px', color: '#64748b' }}
                    >
                      <Eye size={14} />
                    </Button>
                  </div>
                ),
              },
            ]}
            data={pickups}
          />
        </Card>
      )}

      {/* 5. Tab 2: Manifests Table */}
      {activeTab === 'manifests' && (
        <Card style={{ padding: '0px', overflow: 'hidden' }}>
          <Table<Manifest>
            keyExtractor={(r) => r.id}
            columns={[
              {
                key: 'manifestNumber',
                header: 'Manifest Number',
                render: (r) => (
                  <div>
                    <strong style={{ color: '#0284c7', fontFamily: 'monospace', fontSize: '13px' }}>
                      {r.manifestNumber}
                    </strong>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      PRQ: {r.pickupRequestId}
                    </div>
                  </div>
                ),
              },
              {
                key: 'carrier',
                header: 'Carrier Fleet',
                render: (r) => (
                  <div>
                    <strong>{r.courierName}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Delhivery First-Mile Fleet</div>
                  </div>
                ),
              },
              {
                key: 'warehouse',
                header: 'Origin Hub',
                render: (r) => (
                  <div>
                    <strong>{r.warehouseName}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Panchkula, Haryana - 134113</div>
                  </div>
                ),
              },
              {
                key: 'parcels',
                header: 'Total Parcels',
                render: (r) => (
                  <div>
                    <strong>{r.shipmentCount} Packages</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {(r.totalWeightGrams / 1000).toFixed(2)} KG Total
                    </div>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Handover Status',
                render: (r) => (
                  <Badge variant={r.status === 'HANDED_OVER' ? 'success' : 'info'}>
                    {r.status === 'HANDED_OVER' ? 'HANDED OVER TO COURIER' : 'MANIFEST GENERATED'}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (r) => (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/app/manifests/${r.id}?autoPrint=1`)}
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        color: '#0284c7',
                        borderColor: '#0284c7',
                        backgroundColor: '#f0f9ff',
                        fontWeight: '700',
                      }}
                    >
                      <Printer size={12} style={{ marginRight: '4px' }} />
                      Print Run Sheet
                    </Button>

                    {r.status === 'GENERATED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Confirm Handover to Rider"
                        onClick={() => handleMarkHandover(r.id)}
                        style={{ padding: '4px 8px', color: '#16a34a' }}
                      >
                        <CheckCircle2 size={14} />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      title="View Handover Details"
                      onClick={() => navigate(`/app/manifests/${r.id}`)}
                      style={{ padding: '4px 8px', color: '#64748b' }}
                    >
                      <Eye size={14} />
                    </Button>
                  </div>
                ),
              },
            ]}
            data={manifests}
          />
        </Card>
      )}
    </div>
  );
};
