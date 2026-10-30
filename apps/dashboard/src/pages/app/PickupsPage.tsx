import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Plus,
  Clock,
  CheckCircle2,
  Eye,
  FileText,
  Building2,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Input,
  Select,
  Table,
  Alert,
  ConfirmationDialog,
} from '../../components/ui';
import type { PickupRequest } from '../../types/pickups';
import { PICKUP_STATUS_CONFIG } from '../../types/pickups';
import { PickupEngine } from '../../services/pickupEngine';
import { ManifestEngine } from '../../services/manifestEngine';

export const PickupsPage: React.FC = () => {
  const navigate = useNavigate();

  const [pickups, setPickups] = useState<PickupRequest[]>(() => PickupEngine.getAllPickups());
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  // New Pickup Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('wh-001');
  const [selectedCourier, setSelectedCourier] = useState<string>('delhivery');
  const [pickupDate, setPickupDate] = useState<string>('2026-08-22');
  const [timeSlot, setTimeSlot] = useState<string>('10:00 AM - 01:00 PM');
  const [contactPerson, setContactPerson] = useState<string>('Rajesh Kumar');
  const [contactPhone, setContactPhone] = useState<string>('9820011223');

  const filteredPickups = useMemo(() => {
    return pickups.filter((p) => (statusFilter === 'ALL' ? true : p.status === statusFilter));
  }, [pickups, statusFilter]);

  const handleCreatePickup = async () => {
    const res = await PickupEngine.createPickupRequest({
      warehouseId: selectedWarehouse,
      shipmentIds: ['SHP-9840192'],
      courierId: selectedCourier,
      pickupDate,
      pickupSlot: timeSlot,
      contactPerson,
      contactPhone,
      tenantId: 'tenant-demo-01',
    });

    if (res.success) {
      setActionAlert(`Pickup Request ${res.pickupReference} created successfully! Carrier scheduled for ${res.pickupDate}.`);
      setPickups(PickupEngine.getAllPickups());
      setIsAddModalOpen(false);
    }
  };

  const handleGenerateManifest = async (pickupId: string) => {
    const manifest = await ManifestEngine.generateManifest(pickupId);
    navigate(`/app/manifests/${manifest.id}`);
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Pickup Requests', path: '/app/pickups' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title="Courier Pickup Requests"
        description="Schedule and manage carrier pickup dispatches for booked shipments across warehouse locations."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={() => setIsAddModalOpen(true)}>
              + Schedule Pickup Request
            </Button>
          </div>
        }
      />

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard
          label="Total Pickup Requests"
          value={pickups.length}
          subtext="Lifetime pickup dispatches"
          icon={Truck}
        />
        <StatCard
          label="Scheduled Dispatches"
          value={pickups.filter((p) => p.status === 'SCHEDULED').length}
          subtext="Awaiting carrier pickup"
          icon={Clock}
        />
        <StatCard
          label="Picked Up Parcels"
          value={pickups.filter((p) => p.status === 'PICKED_UP').length}
          subtext="Handed over to carrier"
          icon={CheckCircle2}
        />
        <StatCard
          label="Active Warehouses"
          value={2}
          subtext="Mumbai MIDC & Delhi Hub"
          icon={Building2}
        />
      </div>

      {actionAlert && (
        <Alert variant="success" title="Pickup Dispatch Status">
          {actionAlert}
        </Alert>
      )}

      {/* CONTROLS CARD */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All Pickup Statuses', value: 'ALL' },
              { label: 'SCHEDULED', value: 'SCHEDULED' },
              { label: 'REQUESTED', value: 'REQUESTED' },
              { label: 'PICKED_UP', value: 'PICKED_UP' },
              { label: 'FAILED', value: 'FAILED' },
              { label: 'CANCELLED', value: 'CANCELLED' },
            ]}
            style={{ width: '220px' }}
          />

          <Button variant="outline" size="sm" onClick={() => navigate('/app/manifests')} leftIcon={<FileText size={14} />}>
            View Shipping Manifests
          </Button>
        </div>
      </Card>

      {/* PICKUPS TABLE */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <Table<PickupRequest>
          keyExtractor={(p) => p.id}
          columns={[
            {
              key: 'pickupReference',
              header: 'Pickup Reference',
              render: (row) => (
                <div>
                  <strong style={{ color: 'var(--color-violet-main)' }}>{row.pickupReference}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>ID: {row.id}</div>
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
              header: 'Pickup Location',
              render: (row) => (
                <div>
                  <div>{row.warehouseName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{row.warehouseAddress}</div>
                </div>
              ),
            },
            {
              key: 'shipmentCount',
              header: 'Shipments',
              render: (row) => <Badge variant="neutral">{row.shipmentCount} Parcels ({row.totalWeightKg} kg)</Badge>,
            },
            {
              key: 'pickupDate',
              header: 'Scheduled Date & Slot',
              render: (row) => (
                <div>
                  <div>{row.pickupDate}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{row.timeSlot}</div>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => {
                const conf = PICKUP_STATUS_CONFIG.find((c) => c.key === row.status) || {
                  label: row.statusText || row.status,
                  variant: 'info' as const,
                };
                return <Badge variant={conf.variant}>{conf.label}</Badge>;
              },
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Eye size={14} />}
                    onClick={() => navigate(`/app/pickups/${row.id}`)}
                  >
                    Details
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<FileText size={14} />}
                    onClick={() => handleGenerateManifest(row.id)}
                  >
                    Manifest
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredPickups}
        />
      </Card>

      {/* CREATE PICKUP MODAL */}
      <ConfirmationDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleCreatePickup}
        title="Schedule Carrier Pickup Request"
        description="Select pickup location, courier partner, and dispatch date."
        confirmLabel="Schedule Pickup"
        cancelLabel="Cancel"
        variant="primary"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
          <Select
            label="Pickup Location Warehouse"
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            options={[
              { label: 'Mumbai MIDC Logistics Hub (wh-001)', value: 'wh-001' },
              { label: 'Delhi Air Cargo Hub (wh-002)', value: 'wh-002' },
            ]}
          />
          <Select
            label="Courier Partner"
            value={selectedCourier}
            onChange={(e) => setSelectedCourier(e.target.value)}
            options={[
              { label: 'Delhivery Surface Parcel', value: 'delhivery' },
              { label: 'BlueDart Air Express', value: 'bluedart' },
              { label: 'DTDC Priority Express', value: 'dtdc' },
              { label: 'XpressBees Surface', value: 'xpressbees' },
            ]}
          />
          <Input
            label="Pickup Date"
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
          />
          <Select
            label="Preferred Time Slot"
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            options={[
              { label: '10:00 AM - 01:00 PM (Morning Slot)', value: '10:00 AM - 01:00 PM' },
              { label: '02:00 PM - 05:00 PM (Afternoon Slot)', value: '02:00 PM - 05:00 PM' },
            ]}
          />
          <Input
            label="Contact Manager Name"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
          />
          <Input
            label="Contact Manager Phone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </div>
      </ConfirmationDialog>
    </div>
  );
};
