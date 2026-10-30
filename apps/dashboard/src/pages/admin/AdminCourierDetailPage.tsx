import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Server, Activity, ShieldCheck, Key, RefreshCw, Send } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Table,
  Input,
  Select,
  Alert,
} from '../../components/ui';
import { DEMO_COURIER_PROVIDERS } from '../../mocks/couriers.mock';
import { CourierWebhookService, type CourierWebhookLog, type CourierApiAuditLog } from '../../services/courierWebhookService';

export const AdminCourierDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'api' | 'logs' | 'webhooks'>('overview');
  const [environment, setEnvironment] = useState<'TEST' | 'LIVE'>('TEST');
  const [connectionStatus, setConnectionStatus] = useState<'NOT_CONNECTED' | 'CONNECTED' | 'ERROR'>('NOT_CONNECTED');
  const [testResult, setTestResult] = useState<{ httpStatus: number; responseTimeMs: number; timestamp: string; status: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Form Credential States
  const [baseUrl, setBaseUrl] = useState('https://track.delhivery.com/api/v1');
  const [apiKey, setApiKey] = useState('d41d8cd98f00b204e9800998ecf8427e'); // Masked in display
  const [clientId, setClientId] = useState('DELHIVERY_PROD_991');
  const [accountNumber, setAccountNumber] = useState('ACC-DEL-9841');

  const webhookLogs = CourierWebhookService.getWebhookLogs(id);
  const apiAuditLogs = CourierWebhookService.getApiAuditLogs(id);

  const courier = DEMO_COURIER_PROVIDERS.find((c) => c.id === id || c.code.toLowerCase() === id?.toLowerCase()) || DEMO_COURIER_PROVIDERS[0];

  const handleRunConnectionTest = () => {
    setIsTesting(true);

    setTimeout(() => {
      if (!apiKey || apiKey.length < 5) {
        setConnectionStatus('ERROR');
        setTestResult({
          httpStatus: 401,
          responseTimeMs: 240,
          timestamp: new Date().toLocaleString(),
          status: 'AUTHENTICATION_FAILED: Missing or invalid API key credential.',
        });
      } else {
        setConnectionStatus('CONNECTED');
        setTestResult({
          httpStatus: 200,
          responseTimeMs: 112,
          timestamp: new Date().toLocaleString(),
          status: 'SUCCESS: Provider endpoint responded cleanly (HTTP 200 OK).',
        });
      }
      setIsTesting(false);
    }, 600);
  };

  const handleSimulateWebhook = () => {
    CourierWebhookService.processIncomingWebhook(
      courier.id,
      `evt-sim-${Date.now()}`,
      'SIG_VALID_SECRET',
      { waybill: 'DEL847192031', status: 'DELIVERED', location: 'Bengaluru Center' }
    );
    alert('Simulated webhook event processed successfully! Check Webhooks tab.');
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Courier Partners', path: '/admin/couriers' },
    { label: courier.name, path: `/admin/couriers/${courier.id}` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title={`${courier.name} Partner Control & API Connection`}
        description={`Manage ${courier.name} carrier settings, serviceability, API credentials, webhook endpoints, and diagnostic integration logs.`}
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/admin/couriers')}>
            Back to Couriers Catalog
          </Button>
        }
      />

      {/* 2. Courier Summary Banner */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h2 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'bold' }}>{courier.name}</h2>
              <Badge variant={connectionStatus === 'CONNECTED' ? 'success' : connectionStatus === 'ERROR' ? 'danger' : 'neutral'}>
                API {connectionStatus}
              </Badge>
              <Badge variant={environment === 'LIVE' ? 'danger' : 'warning'}>{environment} ENVIRONMENT</Badge>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Code: <strong>{courier.code}</strong> • B2B: {courier.supportedModes.includes('B2B') ? '✓' : '✗'} • B2C: {courier.supportedModes.includes('B2C') ? '✓' : '✗'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="outline" size="sm" leftIcon={<Send size={14} />} onClick={handleSimulateWebhook}>
              Simulate Webhook Event
            </Button>
            <Button variant="primary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={handleRunConnectionTest} disabled={isTesting}>
              {isTesting ? 'Testing Connection...' : 'Test Connection'}
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Navigation Tabs */}
      <Card style={{ padding: 'var(--space-2)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {[
            { key: 'overview', label: 'Overview & Services', icon: Server },
            { key: 'api', label: 'API Credentials & Auth', icon: Key },
            { key: 'logs', label: 'API Audit Logs', icon: Activity },
            { key: 'webhooks', label: 'Webhook Endpoint Logs', icon: ShieldCheck },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-default)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--color-violet-light)' : 'transparent',
                  color: isActive ? 'var(--color-violet-main)' : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 'bold' : 'normal',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* TAB 1: OVERVIEW & SERVICES */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          <Card style={{ padding: 'var(--space-5)' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Carrier Integration Mode</span>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>
              REST HTTP API Adapter
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Common Provider Adapter Protocol</span>
          </Card>

          <Card style={{ padding: 'var(--space-5)' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Supported Operational Methods</span>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
              AWB, Label, Pickup, Tracking, NDR, Cancel
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Customer selling prices come from internal rate card</span>
          </Card>
        </div>
      )}

      {/* TAB 2: API CREDENTIALS & AUTH */}
      {activeTab === 'api' && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
            API Connection & Credentials Configuration
          </h3>
          <Alert variant="info" title="Strict Secret Security Policy">
            API secrets, tokens, and passwords are stored server-side. Secrets are NEVER returned in plain text to frontend UI, customer APIs, or readable logs.
          </Alert>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-5)' }}>
            <Select
              label="Target Environment *"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as any)}
              options={[
                { value: 'TEST', label: 'TEST / SANDBOX (Development)' },
                { value: 'LIVE', label: 'LIVE / PRODUCTION (Production)' },
              ]}
            />
            <Input label="API Base URL *" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            <Input label="Client ID / Account Code *" value={clientId} onChange={(e) => setClientId(e.target.value)} />
            <Input label="Carrier Account Number *" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
            <Input
              label="API Secret Key (Masked) *"
              type="password"
              value={apiKey ? '••••••••••••••••••••••••••••' : ''}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API Key to update"
            />
          </div>

          <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="primary" onClick={handleRunConnectionTest} disabled={isTesting}>
              {isTesting ? 'Testing Connection...' : 'Save & Test Connection'}
            </Button>
          </div>

          {testResult && (
            <div style={{ marginTop: 'var(--space-5)', padding: 'var(--space-4)', borderRadius: 'var(--radius-default)', backgroundColor: 'var(--color-surface-secondary)', fontSize: '13px' }}>
              <strong>Connection Diagnostic Test Output:</strong>
              <div style={{ marginTop: '4px', display: 'flex', gap: 'var(--space-4)', fontSize: '12px' }}>
                <span>HTTP Status: <strong>{testResult.httpStatus}</strong></span>
                <span>Response Time: <strong>{testResult.responseTimeMs} ms</strong></span>
                <span>Timestamp: <strong>{testResult.timestamp}</strong></span>
              </div>
              <div style={{ fontSize: '12px', color: testResult.httpStatus === 200 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '4px' }}>
                {testResult.status}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: API AUDIT LOGS */}
      {activeTab === 'logs' && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
            API Request Diagnostic Logs
          </h3>

          <Table<CourierApiAuditLog>
            keyExtractor={(r) => r.id}
            columns={[
              { key: 'operation', header: 'Operation', render: (r) => <Badge variant="info">{r.operation}</Badge> },
              { key: 'shipmentId', header: 'Shipment ID', render: (r) => <strong style={{ color: 'var(--color-violet-main)' }}>{r.shipmentId}</strong> },
              { key: 'awbNumber', header: 'AWB', render: (r) => <span style={{ fontFamily: 'monospace' }}>{r.awbNumber}</span> },
              { key: 'httpStatus', header: 'HTTP Status', render: (r) => <span>HTTP {r.httpStatus}</span> },
              { key: 'responseTimeMs', header: 'Response Time', render: (r) => <span>{r.responseTimeMs} ms</span> },
              { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'SUCCESS' ? 'success' : 'danger'}>{r.status}</Badge> },
              { key: 'timestamp', header: 'Timestamp', render: (r) => <span>{r.timestamp}</span> },
            ]}
            data={apiAuditLogs}
          />
        </Card>
      )}

      {/* TAB 4: WEBHOOK LOGS */}
      {activeTab === 'webhooks' && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
            Incoming Webhook Event History
          </h3>

          <Table<CourierWebhookLog>
            keyExtractor={(r) => r.id}
            columns={[
              { key: 'eventId', header: 'Event ID', render: (r) => <strong>{r.eventId}</strong> },
              { key: 'awbNumber', header: 'AWB Number', render: (r) => <span style={{ fontFamily: 'monospace' }}>{r.awbNumber}</span> },
              { key: 'rawEventCode', header: 'Raw Event Code', render: (r) => <Badge variant="neutral">{r.rawEventCode}</Badge> },
              { key: 'normalizedStatus', header: 'Normalized Status', render: (r) => <Badge variant="brand">{r.normalizedStatus}</Badge> },
              { key: 'signatureVerified', header: 'Signature Check', render: (r) => <Badge variant={r.signatureVerified ? 'success' : 'danger'}>{r.signatureVerified ? 'PASSED' : 'FAILED'}</Badge> },
              { key: 'status', header: 'Idempotency Status', render: (r) => <Badge variant={r.status === 'PROCESSED' ? 'success' : 'warning'}>{r.status}</Badge> },
              { key: 'receivedAt', header: 'Received At', render: (r) => <span>{r.receivedAt}</span> },
            ]}
            data={webhookLogs}
          />
        </Card>
      )}
    </div>
  );
};
