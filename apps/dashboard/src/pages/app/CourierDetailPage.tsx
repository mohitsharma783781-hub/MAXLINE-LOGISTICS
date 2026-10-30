import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  Zap,
  Lock,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Skeleton,
  EmptyState,
  Alert,
  Select,
  Table,
} from '../../components/ui';
import { getCourierConnectionDetail } from '../../mocks/couriers.mock';
import type { CourierConnection, CourierCode, CourierHealth, CourierActivityLog, CourierServiceItem } from '../../types/couriers';
import { COURIER_STATUS_CONFIG } from '../../types/couriers';
import { CourierRegistry } from '../../services/courierAdapter';

export const CourierDetailPage: React.FC = () => {
  const { courierId } = useParams<{ courierId: string }>();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'demo' | 'loading' | 'error' | 'not_found'>('demo');
  const [detail, setDetail] = useState<CourierConnection | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'capabilities' | 'configuration' | 'health' | 'activity'>('overview');

  const [healthData, setHealthData] = useState<CourierHealth | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [services, setServices] = useState<CourierServiceItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<CourierActivityLog[]>([]);

  useEffect(() => {
    if (viewMode === 'loading' || viewMode === 'error' || viewMode === 'not_found') return;

    const targetId = courierId || 'bluedart';
    getCourierConnectionDetail(targetId).then((res) => {
      setDetail(res);
      setServices(CourierRegistry.getServices(targetId));
      setActivityLogs(CourierRegistry.getActivityLogs(targetId));
    });
  }, [courierId, viewMode]);

  const handleTestConnection = async () => {
    if (!detail) return;
    const code: CourierCode = (detail.courierId.toUpperCase() === 'BLUEDART' ? 'BLUE_DART' : detail.courierId.toUpperCase()) as CourierCode;
    const res = await CourierRegistry.testConnection(code);
    setTestResult(res.message);
  };

  const handleRunHealthCheck = async () => {
    if (!detail) return;
    const code: CourierCode = (detail.courierId.toUpperCase() === 'BLUEDART' ? 'BLUE_DART' : detail.courierId.toUpperCase()) as CourierCode;
    const health = await CourierRegistry.healthCheck(code);
    setHealthData(health);
  };

  const handleToggleService = (serviceId: string, currentEnabled: boolean) => {
    CourierRegistry.toggleService(serviceId, !currentEnabled);
    if (detail) setServices(CourierRegistry.getServices(detail.courierId));
  };

  const statusConfig = COURIER_STATUS_CONFIG.find((c) => c.key === detail?.status) || {
    label: detail?.statusText || 'Connected',
    variant: 'success' as const,
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Courier Partners', path: '/app/couriers' },
    { label: detail?.courierName || courierId || 'Configuration', path: `/app/couriers/${courierId}` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title={detail ? `${detail.courierName} Universal Adapter` : 'Courier Configuration'}
        description={
          detail
            ? `Universal Courier Adapter • Code: ${detail.courierId.toUpperCase()} • Account Ref: ${detail.accountId || 'API-DIRECT'}`
            : 'Loading courier workspace...'
        }
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <Select
              value={viewMode}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setViewMode(e.target.value as any)}
              options={[
                { value: 'demo', label: 'View: Live Courier Workspace' },
                { value: 'loading', label: 'View: Loading Skeletons' },
                { value: 'error', label: 'View: Error State Banner' },
                { value: 'not_found', label: 'View: 404 Not Found' },
              ]}
              style={{ width: '220px' }}
            />

            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/app/couriers')}>
              Back to Couriers
            </Button>
          </div>
        }
      />

      {viewMode === 'error' && (
        <Alert variant="danger" title="Unable to load courier settings">
          Failed to fetch courier partner parameters.
        </Alert>
      )}

      {viewMode === 'not_found' ? (
        <Card style={{ padding: 'var(--space-10)' }}>
          <EmptyState
            title="Courier Configuration Not Found"
            description="The requested courier partner integration does not exist."
            actionLabel="Back to Courier Partners"
            onAction={() => navigate('/app/couriers')}
          />
        </Card>
      ) : viewMode === 'loading' || !detail ? (
        <Card style={{ padding: 'var(--space-6)' }}>
          <Skeleton height="200px" width="100%" />
        </Card>
      ) : (
        <>
          {/* HEADER CONTROL BAR */}
          <Card style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-default)', backgroundColor: 'var(--color-violet-light)', color: 'var(--color-violet-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold' }}>{detail.displayName}</h3>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  </div>
                  <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>
                    Universal Adapter Class: <strong>Demo{detail.courierName.replace(/\s+/g, '')}Adapter</strong>
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <Button variant="primary" size="sm" leftIcon={<Zap size={14} />} onClick={handleTestConnection}>
                  Test Connection (Demo)
                </Button>
                <Button variant="outline" size="sm" leftIcon={<Activity size={14} />} onClick={handleRunHealthCheck}>
                  Health Check
                </Button>
              </div>
            </div>
          </Card>

          {testResult && (
            <Alert variant="success" title="Demo Connection Result">
              {testResult}
            </Alert>
          )}

          {/* TAB CONTROLS */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
            {(['overview', 'services', 'capabilities', 'configuration', 'health', 'activity'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-default)',
                  fontSize: 'var(--font-size-small)',
                  fontWeight: 'bold',
                  border: 'none',
                  backgroundColor: activeTab === tab ? 'var(--color-violet-main)' : 'transparent',
                  color: activeTab === tab ? '#ffffff' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TAB CONTENT: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
              <Card style={{ padding: 'var(--space-6)' }}>
                <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>
                  Integration Summary
                </h4>
                <div style={{ fontSize: 'var(--font-size-small)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div>Code: <strong>{detail.courierId.toUpperCase()}</strong></div>
                  <div>Account ID: <strong>{detail.accountId || 'API-DIRECT'}</strong></div>
                  <div>Last Sync: <strong>{detail.lastSync}</strong></div>
                  <div>Default Warehouse: <strong>{detail.warehouseId || 'wh-001'}</strong></div>
                </div>
              </Card>

              <Card style={{ padding: 'var(--space-6)' }}>
                <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>
                  Supported Services Count
                </h4>
                <div style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'bold', color: 'var(--color-violet-main)' }}>
                  {detail.enabledServices.length} Active Services
                </div>
              </Card>
            </div>
          )}

          {/* TAB CONTENT: SERVICES */}
          {activeTab === 'services' && (
            <Card style={{ padding: 'var(--space-6)' }}>
              <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
                Courier Service Mapping
              </h4>
              <Table<CourierServiceItem>
                keyExtractor={(r) => r.id}
                columns={[
                  {
                    key: 'name',
                    header: 'Service Name',
                    render: (row) => <strong>{row.name}</strong>,
                  },
                  {
                    key: 'code',
                    header: 'Service Code',
                    render: (row) => <Badge variant="neutral">{row.code}</Badge>,
                  },
                  {
                    key: 'mode',
                    header: 'Transport Mode',
                    render: (row) => <Badge variant="info">{row.mode}</Badge>,
                  },
                  {
                    key: 'enabled',
                    header: 'Status',
                    render: (row) => (
                      <Badge variant={row.enabled ? 'success' : 'neutral'}>
                        {row.enabled ? 'ENABLED' : 'DISABLED'}
                      </Badge>
                    ),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (row) => (
                      <Button
                        variant={row.enabled ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleService(row.id, row.enabled)}
                      >
                        {row.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    ),
                  },
                ]}
                data={services}
              />
            </Card>
          )}

          {/* TAB CONTENT: CAPABILITIES */}
          {activeTab === 'capabilities' && (
            <Card style={{ padding: 'var(--space-6)' }}>
              <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
                Universal Adapter Capabilities
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                {['RATE', 'SERVICEABILITY', 'BOOKING', 'AWB', 'LABEL', 'PICKUP', 'TRACKING', 'NDR', 'RTO', 'CANCEL', 'COD', 'MANIFEST'].map((cap) => (
                  <div key={cap} style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-default)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <CheckCircle2 size={16} color="var(--color-success)" />
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{cap}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* TAB CONTENT: CONFIGURATION */}
          {activeTab === 'configuration' && (
            <Card style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <Lock size={18} style={{ color: 'var(--color-violet-main)' }} />
                <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold' }}>
                  Masked Credentials & Security
                </h4>
              </div>
              <div style={{ fontSize: 'var(--font-size-small)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>License Key:</span>
                  <span style={{ fontFamily: 'monospace' }}>••••••••••••90812</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Client Token:</span>
                  <span style={{ fontFamily: 'monospace' }}>••••••••••••••••</span>
                </div>
              </div>
            </Card>
          )}

          {/* TAB CONTENT: HEALTH */}
          {activeTab === 'health' && (
            <Card style={{ padding: 'var(--space-6)' }}>
              <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
                Adapter Health Check
              </h4>
              {healthData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Badge variant={healthData.status === 'HEALTHY' ? 'success' : 'danger'}>{healthData.status}</Badge>
                    <span>Response Time: <strong>{healthData.responseTimeMs} ms</strong></span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {healthData.message} (Checked at {healthData.checkedAt})
                  </div>
                </div>
              ) : (
                <div>Click "Health Check" button above to run diagnostic test.</div>
              )}
            </Card>
          )}

          {/* TAB CONTENT: ACTIVITY LOG */}
          {activeTab === 'activity' && (
            <Card style={{ padding: 'var(--space-6)' }}>
              <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
                Adapter Activity Log
              </h4>
              <Table<CourierActivityLog>
                keyExtractor={(r) => r.id}
                columns={[
                  {
                    key: 'action',
                    header: 'Action',
                    render: (row) => <Badge variant="neutral">{row.action}</Badge>,
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (row) => <Badge variant="success">{row.status}</Badge>,
                  },
                  {
                    key: 'message',
                    header: 'Log Message',
                    render: (row) => <span>{row.message}</span>,
                  },
                  {
                    key: 'createdAt',
                    header: 'Timestamp',
                    render: (row) => <span>{row.createdAt}</span>,
                  },
                ]}
                data={activityLogs}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
};
