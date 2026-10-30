import React, { useState } from 'react';
import { ShieldAlert, FileText } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Card, Badge, Table, Input, Select } from '../../components/ui';
import { useRbac } from '../../context/RbacContext';
import type { RbacAuditLog } from '../../services/rbacService';

export const AdminAccessLogsPage: React.FC = () => {
  const { auditLogs } = useRbac();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchesSearch =
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip.includes(searchQuery);

    return matchesAction && matchesSearch;
  });

  const accessDeniedCount = auditLogs.filter((l) => l.action === 'Access Denied Events').length;

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Access Control', path: '/admin/roles' },
    { label: 'User Access & Audit Logs', path: '/admin/access-logs' },
  ];

  const getActionBadgeVariant = (action: RbacAuditLog['action']) => {
    switch (action) {
      case 'Access Denied Events':
        return 'danger';
      case 'Role Created':
      case 'Role Duplicated':
        return 'success';
      case 'Permission Changed':
        return 'warning';
      case 'User Assigned':
      case 'User Removed':
        return 'brand';
      default:
        return 'neutral';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      <PageHeader
        title="User Access & Security Audit Logs"
        description="Comprehensive audit trail tracking RBAC policy changes, role creation, user assignments, and unauthorized access attempts."
        breadcrumbs={breadcrumbs}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Total Audit Logs" value={auditLogs.length} subtext="Logged security events" icon={FileText} />
        <StatCard label="Access Denied Events" value={accessDeniedCount} subtext="Blocked HTTP 403 attempts" icon={ShieldAlert} />
        <StatCard label="Permission Modifications" value={auditLogs.filter((l) => l.action === 'Permission Changed').length} subtext="Matrix updates" icon={FileText} />
      </div>

      <Card style={{ padding: 'var(--space-6)' }}>
        {/* Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ width: '240px' }}>
              <Select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                options={[
                  { label: 'All Event Actions', value: 'ALL' },
                  { label: 'Access Denied Events', value: 'Access Denied Events' },
                  { label: 'Role Created', value: 'Role Created' },
                  { label: 'Permission Changed', value: 'Permission Changed' },
                  { label: 'User Assigned', value: 'User Assigned' },
                  { label: 'User Removed', value: 'User Removed' },
                ]}
              />
            </div>
          </div>

          <div style={{ width: '280px' }}>
            <Input
              placeholder="Search user, email, resource or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Audit Log Table */}
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
              header: 'User & Role',
              render: (l) => (
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{l.user}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    {l.email} • <Badge variant="neutral">{l.role}</Badge>
                  </div>
                </div>
              ),
            },
            {
              key: 'action',
              header: 'Action Event',
              render: (l) => (
                <Badge variant={getActionBadgeVariant(l.action)}>
                  {l.action}
                </Badge>
              ),
            },
            {
              key: 'resource',
              header: 'Target Resource',
              render: (l) => (
                <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-violet-main)' }}>
                  {l.resource}
                </span>
              ),
            },
            {
              key: 'ip',
              header: 'IP Address',
              render: (l) => <code>{l.ip}</code>,
            },
            {
              key: 'details',
              header: 'Event Details',
              render: (l) => (
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {l.details}
                </span>
              ),
            },
          ]}
          data={filteredLogs}
        />
      </Card>
    </div>
  );
};
