import React, { useState } from 'react';
import { UserCheck, ShieldCheck, Plus } from 'lucide-react';
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
import { AdminRoleService, type AdminUserRecord, type AdminRole } from '../../services/adminRoleService';

export const AdminUsersRolesPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserRecord[]>(() => AdminRoleService.getAdminUsers());

  // Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('OPERATIONS');

  const handleCreateUser = () => {
    if (!name.trim() || !email.trim()) return;

    const newUser: AdminUserRecord = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      status: 'ACTIVE',
      lastLoginAt: 'Never',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers((prev) => [newUser, ...prev]);
    setName('');
    setEmail('');
    setIsAddOpen(false);
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'System & Security', path: '/admin/settings' },
    { label: 'Admin Users & Roles', path: '/admin/users-roles' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Admin Users & Role-Based Access Control (RBAC)"
        description="Manage platform administrator accounts, security roles (Super Admin, Operations, Finance, Support), and server-side authorization matrices."
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={() => setIsAddOpen(true)}>
            + Add Admin User
          </Button>
        }
      />

      {/* 2. Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Admin Users" value={users.length} subtext="Active platform administrators" icon={UserCheck} />
        <StatCard label="Security Roles" value="5 Roles" subtext="Super Admin to Support Desk" icon={ShieldCheck} />
        <StatCard label="Server Authorization" value="Enforced" subtext="Zero client-only bypass" icon={ShieldCheck} />
      </div>

      {/* 3. Admin Users Table */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
          Platform Administrator Accounts
        </h4>

        <Table<AdminUserRecord>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'name',
              header: 'Administrator Name & Email',
              render: (r) => (
                <div>
                  <strong style={{ color: 'var(--color-violet-main)' }}>{r.name}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{r.email}</div>
                </div>
              ),
            },
            {
              key: 'role',
              header: 'Security Role',
              render: (r) => (
                <Badge variant={r.role === 'SUPER_ADMIN' ? 'danger' : r.role === 'FINANCE' ? 'warning' : 'brand'}>
                  {r.role}
                </Badge>
              ),
            },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'ACTIVE' ? 'success' : 'neutral'}>{r.status}</Badge> },
            { key: 'lastLoginAt', header: 'Last Login', render: (r) => <span>{r.lastLoginAt}</span> },
            { key: 'createdAt', header: 'Created Date', render: (r) => <span>{r.createdAt}</span> },
          ]}
          data={users}
        />
      </Card>

      {/* Modal */}
      {isAddOpen && (
        <ConfirmationDialog
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onConfirm={handleCreateUser}
          title="Add Platform Administrator Account"
          description="Create a new administrator account with role-based access permissions."
          confirmLabel="Create Admin Account"
          cancelLabel="Cancel"
          variant="primary"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Input label="Full Name *" placeholder="e.g. Vikram Singh" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email Address *" type="email" placeholder="vikram@shippingaggregator.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Select
              label="Assigned Role *"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              options={[
                { value: 'SUPER_ADMIN', label: 'SUPER_ADMIN (Full Platform Control)' },
                { value: 'ADMIN', label: 'ADMIN (Customers, Rates, Orders)' },
                { value: 'OPERATIONS', label: 'OPERATIONS (Orders, Shipments, Pickups)' },
                { value: 'FINANCE', label: 'FINANCE (Wallet, Ledgers, Reports)' },
                { value: 'SUPPORT', label: 'SUPPORT (Read-only Help Desk)' },
              ]}
            />
          </div>
        </ConfirmationDialog>
      )}
    </div>
  );
};
