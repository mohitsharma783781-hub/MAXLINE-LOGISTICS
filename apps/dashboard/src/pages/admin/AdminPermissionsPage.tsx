import React, { useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, Select } from '../../components/ui';
import { useRbac } from '../../context/RbacContext';
import {
  PERMISSION_CATEGORIES,
  PERMISSION_TYPES,
} from '../../services/rbacService';
import type {
  PermissionCategory,
  PermissionType,
  PortalType,
} from '../../services/rbacService';

export const AdminPermissionsPage: React.FC = () => {
  const { roles, editRole } = useRbac();
  const [selectedPortal, setSelectedPortal] = useState<PortalType>('ADMIN');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const portalRoles = roles.filter((r) => r.portal === selectedPortal);

  const displayedCategories =
    selectedCategory === 'ALL'
      ? PERMISSION_CATEGORIES
      : PERMISSION_CATEGORIES.filter((c) => c === selectedCategory);

  const handleToggleCell = (roleId: string, cat: PermissionCategory, type: PermissionType) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role || role.isSystemRole) return;

    const currentVal = Boolean(role.permissions?.[cat]?.[type]);
    const updatedPermissions = {
      ...role.permissions,
      [cat]: {
        ...role.permissions?.[cat],
        [type]: !currentVal,
      },
    };

    editRole(roleId, { permissions: updatedPermissions });
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Access Control', path: '/admin/roles' },
    { label: 'Master Permissions Matrix', path: '/admin/permissions' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      <PageHeader
        title="Master Permissions Matrix View"
        description="Comprehensive audit grid comparing role capabilities across all 16 permission categories and 8 action types."
        breadcrumbs={breadcrumbs}
      />

      <Card style={{ padding: 'var(--space-6)' }}>
        {/* Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <button
              onClick={() => setSelectedPortal('ADMIN')}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 'bold',
                fontSize: '13px',
                border: 'none',
                backgroundColor: selectedPortal === 'ADMIN' ? 'var(--color-violet-main)' : 'var(--color-bg-secondary)',
                color: selectedPortal === 'ADMIN' ? '#ffffff' : 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              Super Admin Roles
            </button>
            <button
              onClick={() => setSelectedPortal('SELLER')}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 'bold',
                fontSize: '13px',
                border: 'none',
                backgroundColor: selectedPortal === 'SELLER' ? 'var(--color-violet-main)' : 'var(--color-bg-secondary)',
                color: selectedPortal === 'SELLER' ? '#ffffff' : 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              Seller Portal Roles
            </button>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ width: '220px' }}>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={[
                  { label: 'All 16 Categories', value: 'ALL' },
                  ...PERMISSION_CATEGORIES.map((c) => ({ label: c, value: c })),
                ]}
              />
            </div>
          </div>
        </div>

        {/* Master Matrix Grid Table */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', minWidth: '180px' }}>
                  Permission Category
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', width: '100px' }}>
                  Action Type
                </th>
                {portalRoles.map((role) => (
                  <th
                    key={role.id}
                    style={{
                      padding: '12px 8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      minWidth: '120px',
                      color: 'var(--color-violet-main)',
                      borderLeft: '1px solid var(--color-border)',
                    }}
                  >
                    <div>{role.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 'normal' }}>
                      {role.isSystemRole ? '(System)' : '(Custom)'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedCategories.map((cat, catIdx) => (
                <React.Fragment key={cat}>
                  {PERMISSION_TYPES.map((type, typeIdx) => (
                    <tr
                      key={`${cat}-${type}`}
                      style={{
                        borderBottom: typeIdx === PERMISSION_TYPES.length - 1 ? '2px solid #cbd5e1' : '1px solid var(--color-border)',
                        backgroundColor: catIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      }}
                    >
                      {typeIdx === 0 && (
                        <td
                          rowSpan={PERMISSION_TYPES.length}
                          style={{
                            padding: '12px',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            verticalAlign: 'top',
                            backgroundColor: catIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                            borderRight: '1px solid var(--color-border)',
                          }}
                        >
                          {cat}
                        </td>
                      )}
                      <td style={{ padding: '6px 12px', fontWeight: '500', color: 'var(--color-text-secondary)' }}>
                        {type}
                      </td>
                      {portalRoles.map((role) => {
                        const isChecked = Boolean(role.permissions?.[cat]?.[type]);
                        return (
                          <td
                            key={role.id}
                            onClick={() => handleToggleCell(role.id, cat, type)}
                            style={{
                              padding: '6px 8px',
                              textAlign: 'center',
                              borderLeft: '1px solid var(--color-border)',
                              cursor: role.isSystemRole ? 'default' : 'pointer',
                            }}
                          >
                            {isChecked ? (
                              <CheckSquare size={16} style={{ color: 'var(--color-violet-main)', margin: 'auto' }} />
                            ) : (
                              <Square size={16} style={{ color: '#e2e8f0', margin: 'auto' }} />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
