import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Truck,
  RotateCcw,
  CheckCircle2,
  Network,
  Zap,
  Settings,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  SearchInput,
  Select,
  Skeleton,
  EmptyState,
  Alert,
  ConfirmationDialog,
} from '../../components/ui';
import {
  COURIER_STATUS_CONFIG,
  type CourierFilterState,
} from '../../types/couriers';
import { DEMO_COURIER_CONNECTIONS, filterDemoCouriers } from '../../mocks/couriers.mock';

export const CouriersPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'demo' | 'empty' | 'loading' | 'error'>('demo');
  const [modalTitle, setModalTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter State
  const [filters, setFilters] = useState<CourierFilterState>({
    searchQuery: '',
    status: 'all',
    serviceType: 'all',
  });

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      status: 'all',
      serviceType: 'all',
    });
  };

  // Filtered Couriers Data
  const filteredData = useMemo(() => {
    if (viewMode === 'empty') return [];
    return filterDemoCouriers(DEMO_COURIER_CONNECTIONS, filters);
  }, [filters, viewMode]);

  const handleTriggerAction = (actionTitle: string) => {
    setModalTitle(actionTitle);
    setIsModalOpen(true);
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Courier Partners', path: '/app/couriers' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header & Action Controls */}
      <PageHeader
        title="Courier Partners"
        description="Connect and manage logistics partner integrations for your account."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* View Mode Simulator */}
            <Select
              value={viewMode}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setViewMode(e.target.value as any)}
              options={[
                { value: 'demo', label: 'View: Live Couriers Data' },
                { value: 'empty', label: 'View: Zero Integrations' },
                { value: 'loading', label: 'View: Loading Skeletons' },
                { value: 'error', label: 'View: Error State Banner' },
              ]}
              style={{ width: '200px' }}
            />

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => navigate('/app/couriers/add')}
            >
              + Add Courier
            </Button>
          </div>
        }
      />

      {/* 2. Error Banner State */}
      {viewMode === 'error' && (
        <Alert variant="danger" title="Unable to load courier connections">
          Failed to fetch courier integration registry. Click{' '}
          <button
            onClick={() => setViewMode('demo')}
            style={{ textDecoration: 'underline', fontWeight: 'bold', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            Try Again
          </button>{' '}
          to retry loading courier partners.
        </Alert>
      )}

      {/* 3. Summary KPI Cards Grid */}
      {viewMode === 'demo' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
          <StatCard
            label="Active Connections"
            value="2"
            subtext="BlueDart & FedEx active"
            badgeText="CONNECTED"
            badgeVariant="success"
            icon={CheckCircle2}
          />
          <StatCard
            label="Available Providers"
            value="4"
            subtext="Pre-integrated adapters"
            badgeText="CATALOG"
            badgeVariant="brand"
            icon={Network}
          />
          <StatCard
            label="Integration Health"
            value="0 Issues"
            subtext="All API endpoints operational"
            badgeText="HEALTHY"
            badgeVariant="info"
            icon={Zap}
          />
        </div>
      )}

      {/* 4. Filter & Search Controls Bar */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: '260px' }}>
            <SearchInput
              placeholder="Search courier partner, status..."
              value={filters.searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              onClear={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <Select
              value={filters.status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'connected', label: 'Connected' },
                { value: 'not_connected', label: 'Not Connected' },
                { value: 'disabled', label: 'Disabled' },
              ]}
              style={{ width: '160px' }}
            />

            <Select
              value={filters.serviceType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters((prev) => ({ ...prev, serviceType: e.target.value }))}
              options={[
                { value: 'all', label: 'All Services' },
                { value: 'express', label: 'Express Air' },
                { value: 'surface', label: 'Surface Parcel' },
                { value: 'hyperlocal', label: 'Hyperlocal' },
              ]}
              style={{ width: '160px' }}
            />

            <Button variant="ghost" size="sm" onClick={handleResetFilters} title="Reset All Filters">
              <RotateCcw size={14} />
            </Button>
          </div>
        </div>
      </Card>

      {/* 5. MAIN COURIER PARTNERS GRID AND STATES */}
      {viewMode === 'loading' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} style={{ padding: 'var(--space-6)' }}>
              <Skeleton height="28px" width="50%" style={{ marginBottom: '12px' }} />
              <Skeleton height="60px" width="100%" />
            </Card>
          ))}
        </div>
      ) : viewMode === 'empty' ? (
        /* Empty State */
        <Card style={{ padding: 'var(--space-10)' }}>
          <EmptyState
            title="No Courier Partners Connected"
            description="Connect your first courier partner to start allocating shipments and scheduling pickup dispatches."
            actionLabel="+ Add Courier Partner"
            onAction={() => navigate('/app/couriers/add')}
          />
        </Card>
      ) : filteredData.length === 0 ? (
        /* No Search Results */
        <Card style={{ padding: 'var(--space-10)' }}>
          <EmptyState
            title="No Couriers Found"
            description="No courier partners matched your search query or active filter criteria."
            actionLabel="Clear Filters"
            onAction={handleResetFilters}
          />
        </Card>
      ) : (
        /* Primary Courier Cards Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
          {filteredData.map((courier) => {
            const statusConfig = COURIER_STATUS_CONFIG.find((c) => c.key === courier.status) || {
              label: courier.statusText,
              variant: 'neutral' as const,
            };
            const isConnected = courier.status === 'connected';

            return (
              <Card key={courier.id} style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                {/* Provider Header */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-default)', backgroundColor: 'var(--color-violet-light)', color: 'var(--color-violet-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Truck size={20} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'var(--font-weight-bold)' }}>
                          {courier.courierName}
                        </h3>
                        {courier.accountId && (
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                            Account: {courier.accountId}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  </div>

                  {/* Service Capabilities Pills */}
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                    {courier.enabledServices.map((srv) => (
                      <Badge key={srv} variant="info" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                        {srv}
                      </Badge>
                    ))}
                    {courier.capabilities.codSupported && <Badge variant="neutral" style={{ fontSize: '10px' }}>COD</Badge>}
                    {courier.capabilities.trackingSupported && <Badge variant="neutral" style={{ fontSize: '10px' }}>Tracking Scan</Badge>}
                  </div>

                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Last Sync: {courier.lastSync}
                  </span>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                  {isConnected ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/app/couriers/${courier.courierId}`)} leftIcon={<Settings size={14} />}>
                        Configure
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleTriggerAction(`Simulating Test Connection for ${courier.courierName}`)}>
                        Test Connection
                      </Button>
                    </>
                  ) : (
                    <Button variant="primary" size="sm" fullWidth onClick={() => navigate('/app/couriers/add')}>
                      Connect Partner
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action Placeholder Confirmation Modal */}
      <ConfirmationDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => setIsModalOpen(false)}
        title={modalTitle}
        description="This UI action entry point is prepared for future backend courier API authentication and credentials storage. No live network calls were triggered."
        confirmLabel="Understood"
        cancelLabel="Close"
        variant="primary"
      />
    </div>
  );
};
