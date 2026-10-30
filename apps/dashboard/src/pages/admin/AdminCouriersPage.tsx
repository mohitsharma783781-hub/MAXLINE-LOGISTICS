import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Truck,
  Layers,
  ShieldCheck,
  Eye,
  RotateCcw,
  Key,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Input,
  Select,
  ConfirmationDialog,
} from '../../components/ui';
import type { CourierProvider, CourierAccount } from '../../types/couriers';
import {
  DEMO_COURIER_PROVIDERS,
  DEMO_COURIER_ACCOUNTS,
  DEMO_COURIER_SERVICES,
} from '../../mocks/couriers.mock';

export const AdminCouriersPage: React.FC = () => {
  const navigate = useNavigate();

  const [couriers, setCouriers] = useState<CourierProvider[]>(DEMO_COURIER_PROVIDERS);
  const [accounts] = useState<CourierAccount[]>(DEMO_COURIER_ACCOUNTS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New Courier Form State
  const [newCourierName, setNewCourierName] = useState('');
  const [newCourierCode, setNewCourierCode] = useState('');
  const [newCourierMode, setNewCourierMode] = useState<'B2C' | 'B2B' | 'BOTH'>('B2C');

  // Filtered Couriers
  const filteredCouriers = useMemo(() => {
    return couriers.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (modeFilter !== 'all' && !c.supportedModes.includes(modeFilter as any)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchCode = c.code.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      return true;
    });
  }, [couriers, searchQuery, statusFilter, modeFilter]);

  const handleToggleCourierStatus = (id: string) => {
    setCouriers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : c))
    );
  };

  const handleCreateCourier = () => {
    if (!newCourierName.trim() || !newCourierCode.trim()) return;
    const cleanCode = newCourierCode.trim().toUpperCase().replace(/\s+/g, '_');
    const newMaster: CourierProvider = {
      id: `c-master-${Date.now()}`,
      code: cleanCode,
      name: newCourierName.trim(),
      displayName: newCourierName.trim(),
      logo: '🚚',
      type: 'CARRIER',
      integrationType: 'API',
      supportedModes: newCourierMode === 'BOTH' ? ['B2C', 'B2B'] : [newCourierMode],
      serviceTypes: ['surface', 'express'],
      adapterType: 'DEMO',
      status: 'ACTIVE',
      integrationStatus: 'CONNECTED',
      authSchema: [{ key: 'apiKey', label: 'API Key Token', type: 'password', required: true, secret: true }],
      capabilities: {
        serviceTypes: ['surface', 'express'],
        paymentModes: ['prepaid', 'cod'],
        maxWeightKg: 50,
        codSupported: true,
        prepaidSupported: true,
        trackingSupported: true,
        labelSupported: true,
        pickupSupported: true,
        serviceabilitySupported: true,
      },
      description: 'Master courier partner integration registered by Super Admin.',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setCouriers((p) => [newMaster, ...p]);
    setNewCourierName('');
    setNewCourierCode('');
    setIsAddModalOpen(false);
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Courier API Hub', path: '/admin/couriers' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Courier Master & Account Hub"
        description="Manage master courier partners, account instances, priority rules, and capabilities."
        breadcrumbs={breadcrumbs}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            + Register Courier Partner
          </Button>
        }
      />

      {/* 2. Overview Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard
          label="Courier Masters"
          value={couriers.length}
          subtext={`${couriers.filter((c) => c.status === 'ACTIVE').length} Active Partners`}
          icon={Truck}
        />
        <StatCard
          label="Active Accounts"
          value={accounts.length}
          subtext="Platform & Merchant credentials"
          icon={Key}
        />
        <StatCard
          label="Configured Services"
          value={DEMO_COURIER_SERVICES.length}
          subtext="Surface & Express offerings"
          icon={Layers}
        />
        <StatCard
          label="Integration Health"
          value="100% Operational"
          subtext="Universal Adapter active"
          icon={ShieldCheck}
        />
      </div>

      {/* 3. Filter & Search Controls */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <Input
              placeholder="Search Courier Name or Unique Code (e.g. DELHIVERY, DTDC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
              style={{ width: '140px' }}
            />

            <Select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Modes' },
                { value: 'B2C', label: 'B2C Mode' },
                { value: 'B2B', label: 'B2B Mode' },
              ]}
              style={{ width: '140px' }}
            />

            <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('all'); setModeFilter('all'); }} title="Reset">
              <RotateCcw size={14} />
            </Button>
          </div>
        </div>
      </Card>

      {/* 4. Courier Master Data Table */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <Table<CourierProvider>
          keyExtractor={(item) => item.id}
          columns={[
            {
              key: 'name',
              header: 'Courier Partner',
              render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ fontSize: '20px' }}>{row.logo || '🚚'}</div>
                  <div>
                    <strong
                      style={{ color: 'var(--color-violet-main)', cursor: 'pointer' }}
                      onClick={() => navigate(`/admin/couriers/${row.id}`)}
                    >
                      {row.name}
                    </strong>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{row.description}</div>
                  </div>
                </div>
              ),
            },
            {
              key: 'code',
              header: 'Unique Code',
              render: (row) => (
                <Badge variant="brand">
                  <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{row.code}</span>
                </Badge>
              ),
            },
            {
              key: 'supportedModes',
              header: 'Supported Modes',
              render: (row) => (
                <div style={{ display: 'flex', gap: '4px' }}>
                  {row.supportedModes.map((m) => (
                    <Badge key={m} variant={m === 'B2B' ? 'warning' : 'info'}>
                      {m}
                    </Badge>
                  ))}
                </div>
              ),
            },
            {
              key: 'accountsCount',
              header: 'Accounts',
              render: (row) => {
                const count = accounts.filter((a) => a.courierId === row.id).length;
                return <strong>{count} Accounts</strong>;
              },
            },
            {
              key: 'adapterType',
              header: 'Adapter',
              render: (row) => <Badge variant="neutral">{row.adapterType}</Badge>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <Badge variant={row.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {row.status}
                </Badge>
              ),
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
                    onClick={() => navigate(`/admin/couriers/${row.id}`)}
                  >
                    Manage
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleCourierStatus(row.id)}
                    style={{ color: row.status === 'ACTIVE' ? 'var(--color-warning)' : 'var(--color-success)' }}
                  >
                    {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredCouriers}
        />
      </Card>

      {/* 5. Add Courier Modal */}
      {isAddModalOpen && (
        <ConfirmationDialog
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onConfirm={handleCreateCourier}
          title="Register Master Courier Partner"
          description="Register a new courier master record with a unique internal integration code."
          confirmLabel="Create Courier Partner"
          cancelLabel="Cancel"
          variant="primary"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Input
              label="Courier Name *"
              placeholder="e.g. Shadowfax Local"
              value={newCourierName}
              onChange={(e) => setNewCourierName(e.target.value)}
            />
            <Input
              label="Unique Code (Uppercase, e.g. SHADOWFAX) *"
              placeholder="SHADOWFAX"
              value={newCourierCode}
              onChange={(e) => setNewCourierCode(e.target.value)}
            />
            <Select
              label="Supported Commercial Modes *"
              value={newCourierMode}
              onChange={(e) => setNewCourierMode(e.target.value as any)}
              options={[
                { value: 'B2C', label: 'B2C Only' },
                { value: 'B2B', label: 'B2B Only' },
                { value: 'BOTH', label: 'Both B2C & B2B' },
              ]}
            />
          </div>
        </ConfirmationDialog>
      )}
    </div>
  );
};
