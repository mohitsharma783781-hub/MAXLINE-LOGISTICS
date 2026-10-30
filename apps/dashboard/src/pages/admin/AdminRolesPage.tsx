import React, { useState } from 'react';
import { ShieldCheck, Plus, UserCheck, Key, CheckSquare, Square, Edit2, Copy, Power, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Modal,
  Input,
  Select,
} from '../../components/ui';
import { useRbac } from '../../context/RbacContext';
import {
  PERMISSION_CATEGORIES,
  PERMISSION_TYPES,
} from '../../services/rbacService';
import type {
  RbacRole,
  PermissionCategory,
  PermissionType,
  RolePermissionMap,
} from '../../services/rbacService';

export const AdminRolesPage: React.FC = () => {
  const {
    roles,
    users,
    createRole,
    duplicateRole,
    editRole,
    toggleRoleStatus,
    deleteRole,
    assignUserRole,
  } = useRbac();

  const [activeTab, setActiveTab] = useState<'ADMIN' | 'SELLER'>('ADMIN');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [rolePortal, setRolePortal] = useState<'ADMIN' | 'SELLER'>('ADMIN');
  const [matrixPermissions, setMatrixPermissions] = useState<RolePermissionMap>({});

  // Duplicate Modal State
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [dupRoleId, setDupRoleId] = useState<string | null>(null);
  const [dupRoleName, setDupRoleName] = useState('');

  // User Assign Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetUserId, setAssignTargetUserId] = useState('');
  const [assignTargetRoleId, setAssignTargetRoleId] = useState('');

  const filteredRoles = roles
    .filter((r) => r.portal === activeTab)
    .filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

  const handleOpenCreateModal = (portal: 'ADMIN' | 'SELLER') => {
    setEditingRoleId(null);
    setRoleName('');
    setRoleDescription('');
    setRolePortal(portal);
    setMatrixPermissions(initBlankMatrix());
    setIsRoleModalOpen(true);
  };

  const handleOpenEditModal = (role: RbacRole) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleDescription(role.description);
    setRolePortal(role.portal);

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

  const handleToggleRow = (cat: PermissionCategory) => {
    const currentRow = matrixPermissions[cat] || {};
    const allChecked = PERMISSION_TYPES.every((t) => currentRow[t]);

    const newRowState: Record<string, boolean> = {};
    PERMISSION_TYPES.forEach((t) => {
      newRowState[t] = !allChecked;
    });

    setMatrixPermissions((prev) => ({
      ...prev,
      [cat]: newRowState,
    }));
  };

  const handleToggleColumn = (type: PermissionType) => {
    const allChecked = PERMISSION_CATEGORIES.every((cat) => matrixPermissions[cat]?.[type]);

    setMatrixPermissions((prev) => {
      const updated = { ...prev };
      PERMISSION_CATEGORIES.forEach((cat) => {
        updated[cat] = {
          ...updated[cat],
          [type]: !allChecked,
        };
      });
      return updated;
    });
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
        portal: rolePortal,
        description: roleDescription.trim() || 'Custom created security role',
        status: 'ACTIVE',
        permissions: matrixPermissions,
      });
    }

    setIsRoleModalOpen(false);
  };

  const handleConfirmDuplicate = () => {
    if (dupRoleId && dupRoleName.trim()) {
      duplicateRole(dupRoleId, dupRoleName.trim());
      setIsDuplicateOpen(false);
      setDupRoleId(null);
      setDupRoleName('');
    }
  };

  const handleConfirmAssign = () => {
    if (assignTargetUserId && assignTargetRoleId) {
      assignUserRole(assignTargetUserId, assignTargetRoleId);
      setIsAssignModalOpen(false);
    }
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Access Control', path: '/admin/roles' },
    { label: 'Roles & RBAC Center', path: '/admin/roles' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Role & Permission Management Center (RBAC)"
        description="Configure role-based access control policies, system permission matrices, and user assignments across Super Admin & Seller portals."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<UserCheck size={16} />}
              onClick={() => setIsAssignModalOpen(true)}
            >
              Assign Users to Role
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => handleOpenCreateModal(activeTab)}
            >
              + Create New Role
            </Button>
          </div>
        }
      />

      {/* 2. Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Total Defined Roles" value={roles.length} subtext="System & Custom roles" icon={ShieldCheck} />
        <StatCard label="Admin Portal Roles" value={roles.filter((r) => r.portal === 'ADMIN').length} subtext="Super Admin to Support Desk" icon={Key} />
        <StatCard label="Seller Portal Roles" value={roles.filter((r) => r.portal === 'SELLER').length} subtext="Account Owner to Warehouse" icon={UserCheck} />
        <StatCard label="Permission Actions" value="16 x 8 Grid" subtext="128 Granular controls" icon={ShieldCheck} />
      </div>

      {/* 3. Portal Tab Filter & Search */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              onClick={() => setActiveTab('ADMIN')}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 'bold',
                fontSize: '14px',
                border: 'none',
                backgroundColor: activeTab === 'ADMIN' ? 'var(--color-violet-main)' : 'var(--color-bg-secondary)',
                color: activeTab === 'ADMIN' ? '#ffffff' : 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              Super Admin Roles ({roles.filter((r) => r.portal === 'ADMIN').length})
            </button>
            <button
              onClick={() => setActiveTab('SELLER')}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 'bold',
                fontSize: '14px',
                border: 'none',
                backgroundColor: activeTab === 'SELLER' ? 'var(--color-violet-main)' : 'var(--color-bg-secondary)',
                color: activeTab === 'SELLER' ? '#ffffff' : 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              Seller Portal Roles ({roles.filter((r) => r.portal === 'SELLER').length})
            </button>
          </div>

          <div style={{ minWidth: '260px' }}>
            <Input
              placeholder="Search roles by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Roles Table */}
        <Table<RbacRole>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'name',
              header: 'Role Name & Code',
              render: (r) => (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{r.name}</strong>
                    {r.isSystemRole && <Badge variant="neutral">System</Badge>}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    Code: <code>{r.code}</code>
                  </div>
                </div>
              ),
            },
            {
              key: 'description',
              header: 'Description & Scope',
              render: (r) => (
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {r.description}
                </span>
              ),
            },
            {
              key: 'assignedUsersCount',
              header: 'Assigned Users',
              render: (r) => (
                <Badge variant="brand">
                  {r.assignedUsersCount} users
                </Badge>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => (
                <Badge variant={r.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {r.status}
                </Badge>
              ),
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
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Copy size={12} />}
                    onClick={() => {
                      setDupRoleId(r.id);
                      setDupRoleName(`${r.name} (Copy)`);
                      setIsDuplicateOpen(true);
                    }}
                  >
                    Duplicate
                  </Button>

                  {!r.isSystemRole && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Power size={12} />}
                        onClick={() => toggleRoleStatus(r.id)}
                      >
                        {r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 size={12} />}
                        onClick={() => deleteRole(r.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
          data={filteredRoles}
        />
      </Card>

      {/* 4. Role Modal with Permission Matrix Grid */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={editingRoleId ? `Edit Role: ${roleName}` : `Create New ${rolePortal} Role`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '75vh', overflowY: 'auto', paddingRight: '4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                Role Name *
              </label>
              <Input
                placeholder="e.g. Regional Operations Lead"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                Portal Target
              </label>
              <Select
                value={rolePortal}
                onChange={(e) => setRolePortal(e.target.value as 'ADMIN' | 'SELLER')}
                options={[
                  { label: 'Super Admin Portal', value: 'ADMIN' },
                  { label: 'Seller Portal', value: 'SELLER' },
                ]}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
              Role Description
            </label>
            <Input
              placeholder="Describe access privileges and responsibilities..."
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

          {/* PERMISSION MATRIX CHECKBOX GRID */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0 }}>
                  Permission Matrix Grid (16 Categories x 8 Types)
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                  Click row titles to toggle category or column headers to toggle action type across all categories.
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 'bold', minWidth: '160px' }}>
                      Category
                    </th>
                    {PERMISSION_TYPES.map((type) => (
                      <th
                        key={type}
                        onClick={() => handleToggleColumn(type)}
                        style={{
                          padding: '8px 6px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          userSelect: 'none',
                          color: 'var(--color-violet-main)',
                        }}
                        title={`Toggle ${type} across all categories`}
                      >
                        {type}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_CATEGORIES.map((cat, idx) => {
                    const rowPerms = matrixPermissions[cat] || {};
                    return (
                      <tr
                        key={cat}
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : 'var(--color-bg-secondary)',
                        }}
                      >
                        <td
                          onClick={() => handleToggleRow(cat)}
                          style={{
                            padding: '8px 12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            color: 'var(--color-text-primary)',
                            userSelect: 'none',
                          }}
                          title={`Toggle all actions for ${cat}`}
                        >
                          {cat}
                        </td>
                        {PERMISSION_TYPES.map((type) => {
                          const isChecked = Boolean(rowPerms[type]);
                          return (
                            <td
                              key={type}
                              onClick={() => handleToggleCell(cat, type)}
                              style={{
                                padding: '8px 6px',
                                textAlign: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              {isChecked ? (
                                <CheckSquare size={16} style={{ color: 'var(--color-violet-main)', margin: 'auto' }} />
                              ) : (
                                <Square size={16} style={{ color: '#cbd5e1', margin: 'auto' }} />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveRole}>
              {editingRoleId ? 'Save Permission Matrix' : 'Create Role'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 5. Duplicate Role Modal */}
      <Modal
        isOpen={isDuplicateOpen}
        onClose={() => setIsDuplicateOpen(false)}
        title="Duplicate Security Role"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Create a copy of this role including all 128 category x permission type settings.
          </p>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
              New Role Name *
            </label>
            <Input
              value={dupRoleName}
              onChange={(e) => setDupRoleName(e.target.value)}
              placeholder="e.g. Senior Operations Lead"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button variant="outline" onClick={() => setIsDuplicateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmDuplicate}>
              Confirm Duplicate
            </Button>
          </div>
        </div>
      </Modal>

      {/* 6. Assign User to Role Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign User to Security Role"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
              Select User *
            </label>
            <Select
              value={assignTargetUserId}
              onChange={(e) => setAssignTargetUserId(e.target.value)}
              options={[
                { label: '-- Select User --', value: '' },
                ...users.map((u) => ({
                  label: `${u.name} (${u.email}) - Current: ${u.roleName}`,
                  value: u.id,
                })),
              ]}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
              Target Role *
            </label>
            <Select
              value={assignTargetRoleId}
              onChange={(e) => setAssignTargetRoleId(e.target.value)}
              options={[
                { label: '-- Select Target Role --', value: '' },
                ...roles.map((r) => ({
                  label: `${r.name} [${r.portal}]`,
                  value: r.id,
                })),
              ]}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmAssign}>
              Assign Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
