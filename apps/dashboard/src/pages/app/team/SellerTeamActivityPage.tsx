import React, { useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card, Badge, Table, Input } from '../../../components/ui';
import { useRbac } from '../../../context/RbacContext';
import type { RbacAuditLog } from '../../../services/rbacService';

export const SellerTeamActivityPage: React.FC = () => {
  const { auditLogs } = useRbac();
  const [searchQuery, setSearchQuery] = useState('');

  const sellerLogs = auditLogs.filter(
    (log) =>
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const breadcrumbs = [
    { label: 'Seller Portal', path: '/app' },
    { label: 'Team Management', path: '/app/team' },
    { label: 'Activity Logs', path: '/app/team/activity' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      <PageHeader
        title="Seller Team Activity & Security Audit Logs"
        description="Monitor staff logins, role changes, shipment creation actions, and security events across your seller account."
        breadcrumbs={breadcrumbs}
      />

      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
          <div style={{ width: '280px' }}>
            <Input
              placeholder="Search team activity by user, action, IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table<RbacAuditLog>
          keyExtractor={(l) => l.id}
          columns={[
            {
              key: 'timestamp',
              header: 'Date & Time',
              render: (l) => (
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>{l.date}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{l.time}</div>
                </div>
              ),
            },
            {
              key: 'user',
              header: 'Staff Member & Role',
              render: (l) => (
                <div>
                  <strong style={{ fontSize: '13px' }}>{l.user}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    {l.email} • <Badge variant="neutral">{l.role}</Badge>
                  </div>
                </div>
              ),
            },
            {
              key: 'action',
              header: 'Event Action',
              render: (l) => (
                <Badge variant={l.action === 'Access Denied Events' ? 'danger' : 'brand'}>
                  {l.action}
                </Badge>
              ),
            },
            {
              key: 'resource',
              header: 'Target Module',
              render: (l) => <span style={{ fontSize: '12px', fontWeight: '500' }}>{l.resource}</span>,
            },
            {
              key: 'ip',
              header: 'IP Address',
              render: (l) => <code>{l.ip}</code>,
            },
            {
              key: 'details',
              header: 'Details',
              render: (l) => <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{l.details}</span>,
            },
          ]}
          data={sellerLogs}
        />
      </Card>
    </div>
  );
};
