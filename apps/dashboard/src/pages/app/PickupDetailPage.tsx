import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Alert,
  Table,
} from '../../components/ui';
import type { PickupRequest, PickupEvent } from '../../types/pickups';
import { PICKUP_STATUS_CONFIG } from '../../types/pickups';
import { PickupEngine } from '../../services/pickupEngine';
import { ManifestEngine } from '../../services/manifestEngine';

export const PickupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pickup, setPickup] = useState<PickupRequest | null>(null);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  useEffect(() => {
    const targetId = id || 'DEMO-9840192';
    setPickup(PickupEngine.getPickup(targetId));
  }, [id]);

  const handleGenerateManifest = async () => {
    if (!pickup) return;
    const manifest = await ManifestEngine.generateManifest(pickup.id);
    navigate(`/app/manifests/${manifest.id}`);
  };

  const handleCancelPickup = () => {
    if (!pickup) return;
    const updated = PickupEngine.cancelPickup(pickup.id);
    if (updated) {
      setPickup({ ...updated });
      setActionAlert('Pickup request cancelled successfully.');
    }
  };

  const handleRetryPickup = async () => {
    if (!pickup) return;
    const updated = await PickupEngine.retryPickup(pickup.id);
    if (updated) {
      setPickup({ ...updated });
      setActionAlert('Pickup request re-scheduled with carrier partner.');
    }
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Pickup Requests', path: '/app/pickups' },
    { label: pickup?.pickupReference || id || 'Detail', path: `/app/pickups/${id}` },
  ];

  if (!pickup) {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <Alert variant="danger" title="Pickup Request Not Found">
          The requested pickup dispatch reference does not exist.
        </Alert>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/pickups')} style={{ marginTop: 'var(--space-4)' }}>
          Back to Pickups
        </Button>
      </div>
    );
  }

  const statusConfig = PICKUP_STATUS_CONFIG.find((c) => c.key === pickup.status) || {
    label: pickup.statusText || pickup.status,
    variant: 'info' as const,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title={`Pickup Request ${pickup.pickupReference}`}
        description={`Courier: ${pickup.courierName} • Location: ${pickup.warehouseName} • Scheduled Date: ${pickup.pickupDate}`}
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/pickups')} leftIcon={<ArrowLeft size={16} />}>
              Back to Pickups
            </Button>

            <Button variant="primary" size="sm" onClick={handleGenerateManifest} leftIcon={<FileText size={16} />}>
              Generate Shipping Manifest
            </Button>

            {pickup.status === 'FAILED' && (
              <Button variant="outline" size="sm" onClick={handleRetryPickup} leftIcon={<RotateCcw size={16} />}>
                Re-schedule Pickup
              </Button>
            )}

            {pickup.status !== 'CANCELLED' && pickup.status !== 'PICKED_UP' && (
              <Button variant="outline" size="sm" onClick={handleCancelPickup} style={{ color: 'var(--color-danger)' }}>
                Cancel Pickup
              </Button>
            )}
          </div>
        }
      />

      {actionAlert && (
        <Alert variant="success" title="Pickup Action Complete">
          {actionAlert}
        </Alert>
      )}

      {/* HEADER CARD */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-default)', backgroundColor: 'var(--color-violet-light)', color: 'var(--color-violet-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold' }}>{pickup.pickupReference}</h3>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>
              <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>
                Courier: <strong>{pickup.courierName}</strong> • Parcels Count: <strong>{pickup.shipmentCount}</strong>
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>Scheduled Time Slot:</div>
            <div style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold', color: 'var(--color-violet-main)' }}>
              {pickup.timeSlot}
            </div>
          </div>
        </div>
      </Card>

      {/* INFORMATION GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
        <Card style={{ padding: 'var(--space-6)' }}>
          <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>
            Warehouse Pickup Address
          </h4>
          <div style={{ fontSize: 'var(--font-size-small)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div>Location: <strong>{pickup.warehouseName}</strong></div>
            <div>Address: <strong>{pickup.warehouseAddress}</strong></div>
            <div>Contact Manager: <strong>{pickup.contactPerson} ({pickup.contactPhone})</strong></div>
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-6)' }}>
          <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>
            Shipment Dispatch Package Summary
          </h4>
          <div style={{ fontSize: 'var(--font-size-small)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div>Total Shipments: <strong>{pickup.shipmentCount} Parcels</strong></div>
            <div>Total Chargeable Weight: <strong>{pickup.totalWeightKg} KG</strong></div>
            <div>Pickup Date: <strong>{pickup.pickupDate}</strong></div>
          </div>
        </Card>
      </div>

      {/* EVENT TIMELINE TABLE */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
          Pickup Dispatch Timeline Audit
        </h4>
        <Table<PickupEvent>
          keyExtractor={(e) => e.id}
          columns={[
            {
              key: 'title',
              header: 'Event',
              render: (row) => <strong>{row.title}</strong>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge variant="info">{row.status}</Badge>,
            },
            {
              key: 'description',
              header: 'Description',
              render: (row) => <span>{row.description}</span>,
            },
            {
              key: 'timestamp',
              header: 'Timestamp',
              render: (row) => <span>{row.timestamp}</span>,
            },
          ]}
          data={pickup.events || []}
        />
      </Card>
    </div>
  );
};
