export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATIONS' | 'FINANCE' | 'SUPPORT';

export interface AdminUserRecord extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: 'ACTIVE' | 'INACTIVE';
  lastLoginAt: string;
  createdAt: string;
}

export const INITIAL_ADMIN_USERS: AdminUserRecord[] = [
  {
    id: 'usr-admin-01',
    name: 'Super Admin User',
    email: 'admin@shippingaggregator.com',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    lastLoginAt: '2026-08-21 21:30 PM',
    createdAt: '2026-01-01',
  },
  {
    id: 'usr-ops-01',
    name: 'Vikram Singh (Operations)',
    email: 'ops@shippingaggregator.com',
    role: 'OPERATIONS',
    status: 'ACTIVE',
    lastLoginAt: '2026-08-21 18:45 PM',
    createdAt: '2026-02-15',
  },
  {
    id: 'usr-fin-01',
    name: 'Priya Sharma (Finance)',
    email: 'finance@shippingaggregator.com',
    role: 'FINANCE',
    status: 'ACTIVE',
    lastLoginAt: '2026-08-21 19:10 PM',
    createdAt: '2026-02-20',
  },
  {
    id: 'usr-supp-01',
    name: 'Rohan Verma (Support Desk)',
    email: 'support@shippingaggregator.com',
    role: 'SUPPORT',
    status: 'ACTIVE',
    lastLoginAt: '2026-08-20 14:20 PM',
    createdAt: '2026-03-01',
  },
];

const PERMISSION_MATRIX: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ['*'], // Full platform access
  ADMIN: ['customers:*', 'orders:*', 'shipments:*', 'courier:*', 'reports:*', 'wallet:read'],
  OPERATIONS: ['orders:*', 'shipments:*', 'pickups:*', 'ndr:*', 'rto:*', 'tracking:*'],
  FINANCE: ['wallet:*', 'transactions:*', 'reports:*', 'billing:*', 'invoices:*'],
  SUPPORT: ['customers:read', 'orders:read', 'shipments:read', 'tracking:read', 'ndr:read'],
};

export const AdminRoleService = {
  getAdminUsers: (): AdminUserRecord[] => {
    return [...INITIAL_ADMIN_USERS];
  },

  hasPermission: (role: AdminRole, resource: string, action: string): boolean => {
    const permissions = PERMISSION_MATRIX[role] || [];
    if (permissions.includes('*')) return true;

    const targetKey = `${resource}:${action}`;
    const wildcardKey = `${resource}:*`;

    return permissions.includes(targetKey) || permissions.includes(wildcardKey);
  },
};
