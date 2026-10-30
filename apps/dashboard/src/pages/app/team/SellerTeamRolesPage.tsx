import React, { useState } from 'react';
import { Plus, Edit2, Power, CheckSquare, Square } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button, Card, Badge, Table, Modal, Input } from '../../../components/ui';
import { useRbac } from '../../../context/RbacContext';
import {
  PERMISSION_CATEGORIES,
  PERMISSION_TYPES,
} from '../../../services/rbacService';
import type {
  RbacRole,
  PermissionCategory,
  PermissionType,
  RolePermissionMap,
} from '../../../services/rbacService';

export const SellerTeamRolesPage: React.FC = () => {
  const { roles, createRole, editRole, toggleRoleStatus } = useRbac();
  const sellerRoles = roles.filter((r) => r.portal === 'SELLER');

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [matrixPermissions, setMatrixPermissions] = useState<RolePermissionMap>({});

  const initBlankMatrix = (): RolePermissionMap => {
    const map: RolePermissionMap = {};
    PERMISSION_CATEGORIES.forEach((cat) => {
      map[cat] = {};
      PERMISSION_TYPES.forEach((type) => {
        map[cat][type] = false;
      });
    });
    return map;
  };

  const handleOpenCreateModal = () => {
    setEditingRoleId(null);
    setRoleName('');
    setRoleDescription('');
    setMatrixPermissions(initBlankMatrix());
    setIsRoleModalOpen(true);
  };

  const handleOpenEditModal = (role: RbacRole) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleDescription(role.description);

    const map: RolePermissionMap = {};
    PERMISSION_CATEGORIES.forEach((cat) => {
      map[cat] = {};
      PERMISSION_TYPES.forEach((type) => {
        map[cat][type] = Boolean(role.permissions?.[cat]?.[type]);
      });
    });
    setMatrixPermissions(map);
    setIsRoleModalOpen(true);
  };

  const handleToggleCell = (cat: PermissionCategory, type: PermissionType) => {
    setMatrixPermissions((prev) => ({
      ...prev,
      [cat]: {
        ...prev[cat],
        [type]: !prev[cat]?.[type],
      },
    }));
  };

  const handleSaveRole = () => {
    if (!roleName.trim()) return;

    if (editingRoleId) {
      editRole(editingRoleId, {
        name: roleName.trim(),
        description: roleDescription.trim(),
        permissions: matrixPermissions,
      });
    } else {
      createRole({
        name: roleName.trim(),
        code: roleName.trim().toUpperCase().replace(/\s+/g, '_'),
        portal: 'SELLER',
        description: roleDescription.trim() || 'Custom staff role',
        status: 'ACTIVE',
        permissions: matrixPermissions,
      });
    }
    setIsRoleModalOpen(false);
  };

  const breadcrumbs = [
    { label: 'Seller Portal', path: '/app' },
    { label: 'Team Management', path: '/app/team' },
    { label: 'Staff Roles', path: '/app/team/roles' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      <PageHeader
        title="Seller Staff Roles & Access Controls"
        description="Define staff roles (Operations User, Billing User, Tracking User, Warehouse User, Custom Role) and permission matrices."
        breadcrumbs={breadcrumbs}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={handleOpenCreateModal}
          >
            + Create Custom Role
          </Button>
        }
      />

      <Card style={{ padding: 'var(--space-6)' }}>
        <Table<RbacRole>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'name',
              header: 'Staff Role Name',
              render: (r) => (
                <div>
                  <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{r.name}</strong>
                  {r.isSystemRole && <Badge variant="neutral" style={{ marginLeft: '6px' }}>Default Role</Badge>}
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Code: {r.code}</div>
                </div>
              ),
            },
            {
              key: 'description',
              header: 'Role Responsibilities',
              render: (r) => <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{r.description}</span>,
            },
            {
              key: 'assignedUsersCount',
              header: 'Assigned Staff',
              render: (r) => <Badge variant="brand">{r.assignedUsersCount} staff users</Badge>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <Badge variant={r.status === 'ACTIVE' ? 'success' : 'neutral'}>{r.status}</Badge>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (r) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Edit2 size={12} />}
                    onClick={() => handleOpenEditModal(r)}
                  >
                    Edit Matrix
                  </Button>

                  {!r.isSystemRole && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Power size={12} />}
                      onClick={() => toggleRoleStatus(r.id)}
                    >
                      {r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={sellerRoles}
        />
      </Card>

      {/* Role Matrix Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={editingRoleId ? `Edit Staff Role: ${roleName}` : 'Create New Seller Staff Role'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '75vh', overflowY: 'auto' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
              Staff Role Name *
            </label>
            <Input
              placeholder="e.g. Senior Logistics Assistant"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
              Description
            </label>
            <Input
              placeholder="Describe staff responsibilities..."
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
            />
          </div>

          {/* Matrix Grid */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginTop: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 'bold' }}>Category</th>
                  {PERMISSION_TYPES.map((t) => (
                    <th key={t} style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 'bold' }}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_CATEGORIES.map((cat, idx) => (
                  <tr key={cat} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '600' }}>{cat}</td>
                    {PERMISSION_TYPES.map((type) => {
                      const checked = Boolean(matrixPermissions[cat]?.[type]);
                      return (
                        <td
                          key={type}
                          onClick={() => handleToggleCell(cat, type)}
                          style={{ padding: '8px 6px', textAlign: 'center', cursor: 'pointer' }}
                        >
                          {checked ? (
                            <CheckSquare size={16} style={{ color: 'var(--color-violet-main)', margin: 'auto' }} />
                          ) : (
                            <Square size={16} style={{ color: '#cbd5e1', margin: 'auto' }} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveRole}>
              Save Staff Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
