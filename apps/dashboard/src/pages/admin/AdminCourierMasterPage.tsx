import React, { useState } from 'react';
import { Truck, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
} from '../../components/ui';
import { CourierMasterService, type CourierPartnerMaster } from '../../services/courierMasterService';

export const AdminCourierMasterPage: React.FC = () => {
  const [couriers, setCouriers] = useState<CourierPartnerMaster[]>(() =>
    CourierMasterService.getCouriers()
  );

  const refreshData = () => {
    setCouriers(CourierMasterService.getCouriers());
  };

  const handleToggleStatus = (courierId: string) => {
    CourierMasterService.toggleCourierStatus(courierId);
    refreshData();
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Courier Partner Master', path: '/admin/couriers' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Courier Partner Master & Service Configuration Control Center"
        description="Configure active logistics courier partners, B2B/B2C commercial capabilities, COD support, multi-package flags, and API integration statuses."
        breadcrumbs={breadcrumbs}
      />

      {/* 2. Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Total Couriers" value={couriers.length} subtext="Partner carriers" icon={Truck} />
        <StatCard label="Active Couriers" value={couriers.filter((c) => c.status === 'ACTIVE').length} subtext="Selectable for booking" icon={CheckCircle2} />
        <StatCard label="Multi-Package Enabled" value={couriers.filter((c) => c.multiPackageEnabled).length} subtext="B2B Multi-box ready" icon={ShieldAlert} />
      </div>

      {/* 3. Couriers Table */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <Table<CourierPartnerMaster>
          keyExtractor={(r) => r.courierId}
          columns={[
            {
              key: 'courierName',
              header: 'Courier Name & Code',
              render: (r) => (
                <div>
                  <strong style={{ color: 'var(--color-violet-main)' }}>{r.courierName}</strong>
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>CODE: {r.code}</div>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <Badge variant={r.status === 'ACTIVE' ? 'success' : 'neutral'}>{r.status}</Badge>,
            },
            {
              key: 'b2bEnabled',
              header: 'Modes',
              render: (r) => (
                <div style={{ fontSize: '12px' }}>
                  {r.b2bEnabled && <Badge variant="brand" style={{ marginRight: '4px' }}>B2B</Badge>}
                  {r.b2cEnabled && <Badge variant="info">B2C</Badge>}
                </div>
              ),
            },
            {
              key: 'codEnabled',
              header: 'Capabilities',
              render: (r) => (
                <div style={{ fontSize: '12px' }}>
                  {r.codEnabled && <span>COD • </span>}
                  {r.multiPackageEnabled && <span>Multi-Pkg • </span>}
                  {r.trackingEnabled && <span>Tracking</span>}
                </div>
              ),
            },
            {
              key: 'apiStatus',
              header: 'API Integration Status',
              render: (r) => <Badge variant="neutral">{r.apiStatus}</Badge>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (r) => (
                <Button
                  variant="outline"
                  size="sm"
                  style={{ color: r.status === 'ACTIVE' ? 'var(--color-danger)' : 'var(--color-success)' }}
                  onClick={() => handleToggleStatus(r.courierId)}
                >
                  {r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </Button>
              ),
            },
          ]}
          data={couriers}
        />
      </Card>
    </div>
  );
};
