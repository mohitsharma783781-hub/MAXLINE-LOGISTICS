import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Table,
  Input,
} from '../../components/ui';

export interface AuditLogItem extends Record<string, unknown> {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  details: string;
  ipAddress: string;
}

export const DEMO_AUDIT_LOGS: AuditLogItem[] = [
  { id: 'aud-101', timestamp: '2026-08-21 12:45 PM', actor: 'Super Admin (admin@shipping-saas.com)', role: 'SUPER_ADMIN', action: 'COST_RATE_CARD_PUBLISHED', target: 'RateCard: CRC_DEL_B2C_2026', details: 'Published Delhivery B2C Surface Rate Card v1.0', ipAddress: '192.168.1.10' },
  { id: 'aud-102', timestamp: '2026-08-21 11:30 AM', actor: 'Billing Service', role: 'SYSTEM', action: 'WALLET_CREDIT_ADJUSTMENT', target: 'Tenant: tenant-demo-01', details: 'Credited ₹50,000 to Apex Retail Merchant Wallet', ipAddress: '10.0.0.1' },
  { id: 'aud-103', timestamp: '2026-08-21 10:15 AM', actor: 'Courier Admin', role: 'PLATFORM_ADMIN', action: 'COURIER_SERVICE_UPDATED', target: 'CourierService: DEL_EXPRESS_B2C', details: 'Enabled Express Air for DTDC Account DTDC-ACC-1102', ipAddress: '192.168.1.14' },
  { id: 'aud-104', timestamp: '2026-08-21 09:00 AM', actor: 'Tenant Manager', role: 'PLATFORM_ADMIN', action: 'CUSTOMER_CREATED', target: 'Tenant: tenant-demo-04', details: 'Registered new merchant: Urban Krafts Handicrafts', ipAddress: '192.168.1.22' },
  { id: 'aud-105', timestamp: '2026-08-20 04:20 PM', actor: 'Super Admin (admin@shipping-saas.com)', role: 'SUPER_ADMIN', action: 'ZONE_SCHEME_CREATED', target: 'ZoneScheme: DEL_B2B_2026', details: 'Created Delhivery B2B Freight Commercial Zone Scheme v1.0', ipAddress: '192.168.1.10' },
];

export const AdminAuditLogsPage: React.FC = () => {
  const [logs] = useState<AuditLogItem[]>(DEMO_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((l) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchActor = l.actor.toLowerCase().includes(q);
      const matchAction = l.action.toLowerCase().includes(q);
      const matchDetails = l.details.toLowerCase().includes(q);
      if (!matchActor && !matchAction && !matchDetails) return false;
    }
    return true;
  });

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Audit Logs', path: '/admin/audit-logs' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      <PageHeader
        title="Platform Audit Logs"
        description="Immutable audit trail of all platform administrative actions, rate changes, tenant creation, and financial adjustments."
        breadcrumbs={breadcrumbs}
      />

      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <Input
              placeholder="Search Actor, Action, or Details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
            Reset
          </Button>
        </div>
      </Card>

      <Card style={{ padding: 'var(--space-6)' }}>
        <Table<AuditLogItem>
          keyExtractor={(item) => item.id}
          columns={[
            { key: 'timestamp', header: 'Timestamp', render: (row) => <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{row.timestamp}</span> },
            { key: 'actor', header: 'Actor / User', render: (row) => <strong>{row.actor}</strong> },
            { key: 'action', header: 'Action', render: (row) => <span>{row.action}</span> },
            { key: 'target', header: 'Target Entity', render: (row) => <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{row.target}</span> },
            { key: 'details', header: 'Details', render: (row) => <span style={{ fontSize: '12px' }}>{row.details}</span> },
            { key: 'ipAddress', header: 'IP Address', render: (row) => <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{row.ipAddress}</span> },
          ]}
          data={filteredLogs}
        />
      </Card>
    </div>
  );
};
