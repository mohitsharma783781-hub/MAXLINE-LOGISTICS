import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Key,
  ShieldAlert,
  UserCheck,
  UserX,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button, Card, Badge, Alert, Table, Modal, Input, Select } from '../../../components/ui';
import { useRbac } from '../../../context/RbacContext';
import type { RbacUser } from '../../../services/rbacService';

export const SellerStaffUsersPage: React.FC = () => {
  const {
    users,
    roles,
    currentRole,
    createTeamUser,
    toggleUserStatus,
    resetUserPassword,
    assignUserRole,
  } = useRbac();

  const isAccountOwner = currentRole?.code === 'ACCOUNT_OWNER' || currentRole?.code === 'SUPER_ADMIN';
  const sellerUsers = users.filter((u) => u.portal === 'SELLER');
  const sellerRoles = roles.filter((r) => r.portal === 'SELLER');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRoleId, setEditRoleId] = useState<string>('');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState(sellerRoles[1]?.id || sellerRoles[0]?.id || 'role-seller-ops');

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const matchedRole = sellerRoles.find((r) => r.id === selectedRoleId) || sellerRoles[0];

    createTeamUser({
      name,
      email,
      phone,
      roleId: matchedRole.id,
      roleName: matchedRole.name,
      portal: 'SELLER',
    });

    setIsAddModalOpen(false);
    setAlertMessage(`Team member ${name} invited successfully with role "${matchedRole.name}".`);
    setTimeout(() => setAlertMessage(null), 4000);
    setName('');
    setEmail('');
    setPhone('');
  };

  const handleToggleStatus = (userId: string, userName: string, currentStatus: string) => {
    toggleUserStatus(userId);
    const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    setAlertMessage(`User "${userName}" status updated to ${newStatus}.`);
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const handleResetPassword = (userId: string, userName: string) => {
    resetUserPassword(userId);
    setAlertMessage(`Password reset link dispatched to ${userName}.`);
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const handleAssignRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId || !editRoleId) return;
    assignUserRole(editingUserId, editRoleId);
    setEditingUserId(null);
    setAlertMessage('User role permissions updated successfully.');
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Account', path: '/app/settings/profile' },
    { label: 'Team Management & Roles', path: '/app/settings/team' },
  ];

  if (!isAccountOwner) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <Card style={{ padding: '32px', borderTop: '4px solid #ef4444' }}>
          <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            Account Owner Privileges Required
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            Only the <strong>Account Owner</strong> can manage team members, assign roles, disable users, or reset credentials.
          </p>
          <Badge variant="warning">Current Role: {currentRole?.name}</Badge>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      <PageHeader
        title="Team Members & Access Control"
        description="Manage merchant portal users, assign role-based permissions, disable inactive accounts, and control credential resets."
        breadcrumbs={breadcrumbs}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsAddModalOpen(true)}
            style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
          >
            Add Team User
          </Button>
        }
      />

      {alertMessage && (
        <Alert variant="success" title="Team Management Action">
          {alertMessage}
        </Alert>
      )}

      {/* SUMMARY STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>TOTAL TEAM MEMBERS</span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{sellerUsers.length} Members</div>
        </Card>

        <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>ACTIVE ACCOUNTS</span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#16a34a' }}>
            {sellerUsers.filter((u) => u.status === 'ACTIVE').length} Active
          </div>
        </Card>

        <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>DISABLED / INACTIVE</span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#dc2626' }}>
            {sellerUsers.filter((u) => u.status !== 'ACTIVE').length} Inactive
          </div>
        </Card>
      </div>

      {/* TEAM USERS DATA TABLE */}
      <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>
          Authorized Portal Users & Assigned Roles
        </h3>

        <Table<RbacUser>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'name',
              header: 'User & Email',
              render: (r) => (
                <div>
                  <strong style={{ color: '#0f172a', fontSize: '13px', display: 'block' }}>{r.name}</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{r.email}</span>
                </div>
              ),
            },
            {
              key: 'roleName',
              header: 'Assigned Role',
              render: (r) => (
                <Badge variant={r.roleName === 'Account Owner' ? 'brand' : r.roleName === 'Operations User' ? 'info' : 'success'}>
                  {r.roleName}
                </Badge>
              ),
            },
            {
              key: 'status',
              header: 'Account Status',
              render: (r) => (
                <Badge variant={r.status === 'ACTIVE' ? 'success' : 'danger'}>
                  {r.status === 'ACTIVE' ? 'Active' : 'Disabled'}
                </Badge>
              ),
            },
            {
              key: 'lastLogin',
              header: 'Last Authenticated',
              render: (r) => <span style={{ fontSize: '11px', color: '#64748b' }}>{r.lastLogin || 'Never'}</span>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (r) => (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                    onClick={() => {
                      setEditingUserId(r.id);
                      setEditRoleId(r.roleId);
                    }}
                  >
                    <Edit2 size={12} style={{ marginRight: '4px' }} /> Change Role
                  </Button>

                  <Button
                    variant={r.status === 'ACTIVE' ? 'outline' : 'success'}
                    size="sm"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                    onClick={() => handleToggleStatus(r.id, r.name, r.status)}
                  >
                    {r.status === 'ACTIVE' ? (
                      <>
                        <UserX size={12} style={{ marginRight: '4px', color: '#ef4444' }} /> Disable
                      </>
                    ) : (
                      <>
                        <UserCheck size={12} style={{ marginRight: '4px' }} /> Enable
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    style={{ padding: '4px 8px', fontSize: '11px', borderColor: '#cbd5e1' }}
                    onClick={() => handleResetPassword(r.id, r.name)}
                  >
                    <Key size={12} style={{ marginRight: '4px' }} /> Reset Password
                  </Button>
                </div>
              ),
            },
          ]}
          data={sellerUsers}
        />
      </Card>

      {/* ADD STAFF USER MODAL */}
      {isAddModalOpen && (
        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Merchant Team User" maxWidth="540px">
          <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px' }}>
            <Input label="Full Name *" placeholder="e.g. Rahul Sharma" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email Address *" type="email" placeholder="rahul@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Mobile Phone Number" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />

            <Select
              label="Assign Portal Role *"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              options={sellerRoles.map((r) => ({
                label: `${r.name} — ${r.description}`,
                value: r.id,
              }))}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}>
                Create Team Account
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT ROLE MODAL */}
      {editingUserId && (
        <Modal isOpen={Boolean(editingUserId)} onClose={() => setEditingUserId(null)} title="Change Team Member Role" maxWidth="480px">
          <form onSubmit={handleAssignRoleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px' }}>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Reassign permissions for user: <strong>{sellerUsers.find((u) => u.id === editingUserId)?.name}</strong>
            </p>

            <Select
              label="Select New Role *"
              value={editRoleId}
              onChange={(e) => setEditRoleId(e.target.value)}
              options={sellerRoles.map((r) => ({
                label: `${r.name} (${r.description})`,
                value: r.id,
              }))}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Button variant="outline" onClick={() => setEditingUserId(null)}>Cancel</Button>
              <Button type="submit" variant="primary" style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}>
                Save Role Assignment
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
