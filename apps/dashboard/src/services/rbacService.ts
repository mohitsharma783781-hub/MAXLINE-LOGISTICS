export type PortalType = 'ADMIN' | 'SELLER';

export type PermissionCategory =
  | 'Dashboard'
  | 'Orders'
  | 'Tracking'
  | 'NDR'
  | 'RTO'
  | 'Billing'
  | 'Wallet'
  | 'COD Remittance'
  | 'Rate Cards'
  | 'Warehouses'
  | 'Disputes'
  | 'Integrations'
  | 'Settings'
  | 'Customer Management'
  | 'Reports';

export type PermissionType =
  | 'View'
  | 'Create'
  | 'Edit'
  | 'Delete'
  | 'Approve'
  | 'Export'
  | 'Assign'
  | 'Manage';

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  'Dashboard',
  'Orders',
  'Tracking',
  'NDR',
  'RTO',
  'Billing',
  'Wallet',
  'COD Remittance',
  'Rate Cards',
  'Warehouses',
  'Disputes',
  'Integrations',
  'Settings',
  'Customer Management',
  'Reports',
];

export const PERMISSION_TYPES: PermissionType[] = [
  'View',
  'Create',
  'Edit',
  'Delete',
  'Approve',
  'Export',
  'Assign',
  'Manage',
];

export interface RolePermissionMap {
  [category: string]: {
    [action: string]: boolean;
  };
}

export interface RbacRole extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  portal: PortalType;
  description: string;
  isSystemRole?: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  assignedUsersCount: number;
  permissions: RolePermissionMap;
  createdAt: string;
  updatedAt: string;
}

export interface RbacUser extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  portal: PortalType;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLogin: string;
  ipAddress: string;
}

export interface RbacAuditLog extends Record<string, unknown> {
  id: string;
  date: string;
  time: string;
  user: string;
  email: string;
  role: string;
  action:
    | 'User Login'
    | 'Shipment Creation'
    | 'Wallet Recharge'
    | 'Profile Updates'
    | 'KYC Actions'
    | 'Role Created'
    | 'Permission Changed'
    | 'User Assigned'
    | 'User Status Changed'
    | 'Password Reset'
    | 'User Removed'
    | 'Access Denied Events'
    | 'Role Duplicated'
    | 'Role Deactivated';
  resource: string;
  ip: string;
  details: string;
}

const createFullMatrix = (granted: boolean): RolePermissionMap => {
  const map: RolePermissionMap = {};
  PERMISSION_CATEGORIES.forEach((cat) => {
    map[cat] = {};
    PERMISSION_TYPES.forEach((type) => {
      map[cat][type] = granted;
    });
  });
  return map;
};

const createCategoryMatrix = (allowedCats: PermissionCategory[], actions: PermissionType[]): RolePermissionMap => {
  const map: RolePermissionMap = {};
  PERMISSION_CATEGORIES.forEach((cat) => {
    map[cat] = {};
    const isCatAllowed = allowedCats.includes(cat);
    PERMISSION_TYPES.forEach((type) => {
      map[cat][type] = isCatAllowed && actions.includes(type);
    });
  });
  return map;
};

export const INITIAL_ROLES: RbacRole[] = [
  // ADMIN ROLES
  {
    id: 'role-admin-super',
    name: 'Super Admin',
    code: 'SUPER_ADMIN',
    portal: 'ADMIN',
    description: 'Full unrestricted platform control & security administration',
    isSystemRole: true,
    status: 'ACTIVE',
    assignedUsersCount: 3,
    permissions: createFullMatrix(true),
    createdAt: '2026-01-01',
    updatedAt: '2026-09-01',
  },
  {
    id: 'role-admin-ops',
    name: 'Operations Admin',
    code: 'OPERATIONS_ADMIN',
    portal: 'ADMIN',
    description: 'Manages shipments, NDRs, pickups, disputes and warehouses',
    isSystemRole: true,
    status: 'ACTIVE',
    assignedUsersCount: 8,
    permissions: createCategoryMatrix(['Dashboard', 'Orders', 'Tracking', 'NDR', 'RTO', 'Warehouses', 'Disputes', 'Reports'], ['View', 'Create', 'Edit', 'Approve', 'Export', 'Assign', 'Manage']),
    createdAt: '2026-01-05',
    updatedAt: '2026-08-15',
  },
  {
    id: 'role-admin-fin',
    name: 'Finance Admin',
    code: 'FINANCE_ADMIN',
    portal: 'ADMIN',
    description: 'Oversees customer wallets, COD remittances, billing & GST rate cards',
    isSystemRole: true,
    status: 'ACTIVE',
    assignedUsersCount: 4,
    permissions: createCategoryMatrix(['Dashboard', 'Billing', 'Wallet', 'COD Remittance', 'Rate Cards', 'Reports'], ['View', 'Edit', 'Approve', 'Export', 'Manage']),
    createdAt: '2026-01-10',
    updatedAt: '2026-08-20',
  },
  {
    id: 'role-admin-supp',
    name: 'Support Admin',
    code: 'SUPPORT_ADMIN',
    portal: 'ADMIN',
    description: 'View customer accounts, read-only tracking and dispute resolution',
    isSystemRole: true,
    status: 'ACTIVE',
    assignedUsersCount: 12,
    permissions: createCategoryMatrix(['Dashboard', 'Orders', 'Tracking', 'NDR', 'RTO', 'Disputes', 'Customer Management'], ['View', 'Export']),
    createdAt: '2026-02-01',
    updatedAt: '2026-08-25',
  },
  {
    id: 'role-admin-sales',
    name: 'Sales Admin',
    code: 'SALES_ADMIN',
    portal: 'ADMIN',
    description: 'Onboards accounts, manages rate card assignments and client reports',
    isSystemRole: true,
    status: 'ACTIVE',
    assignedUsersCount: 5,
    permissions: createCategoryMatrix(['Dashboard', 'Rate Cards', 'Customer Management', 'Reports'], ['View', 'Create', 'Edit', 'Export', 'Assign']),
    createdAt: '2026-02-10',
    updatedAt: '2026-08-28',
  },
  {
    id: 'role-admin-custom',
    name: 'Custom Admin Role',
    code: 'CUSTOM_ADMIN_ROLE',
    portal: 'ADMIN',
    description: 'Tailored administrative privileges for regional compliance leads',
    isSystemRole: false,
    status: 'ACTIVE',
    assignedUsersCount: 2,
    permissions: createCategoryMatrix(['Dashboard', 'Orders', 'Reports', 'Customer Management'], ['View', 'Create', 'Export']),
    createdAt: '2026-03-15',
    updatedAt: '2026-09-02',
  },

  // SELLER ROLES
  {
    id: 'role-seller-owner',
    name: 'Account Owner',
    code: 'ACCOUNT_OWNER',
    portal: 'SELLER',
    description: 'Full control over seller account, team management & wallet funds',
    isSystemRole: true,
    status: 'ACTIVE',
    assignedUsersCount: 1540,
    permissions: createFullMatrix(true),
    createdAt: '2026-01-01',
    updatedAt: '2026-09-01',
  },
  {
    id: 'role-seller-ops',
    name: 'Operations User',
    code: 'OPERATIONS_USER',
    portal: 'SELLER',
    description: 'Creates shipments, manages warehouses & processes NDR instructions',
    isSystemRole: true,
    status: 'ACTIVE',
    assignedUsersCount: 420,
    permissions: createCategoryMatrix(['Dashboard', 'Orders', 'Tracking', 'NDR', 'RTO', 'Warehouses', 'Disputes'], ['View', 'Create', 'Edit', 'Manage']),
    createdAt: '2026-01-15',
    updatedAt: '2026-08-10',
  },
  {
    id: 'role-seller-bill',
    name: 'Billing User',
    code: 'BILLING_USER',
    portal: 'SELLER',
    description: 'Recharges wallet, views GST invoices & monitors COD payouts',
    isSystemRole: true,
    status: 'ACTIVE',
    assignedUsersCount: 180,
    permissions: createCategoryMatrix(['Dashboard', 'Billing', 'Wallet', 'COD Remittance', 'Reports'], ['View', 'Export', 'Manage']),
    createdAt: '2026-01-20',
    updatedAt: '2026-08-12',
  },
  {
    id: 'role-seller-track',
    name: 'Tracking User',
    code: 'TRACKING_USER',
    portal: 'SELLER',
    description: 'Monitors shipment statuses, NDR alerts & customer tracking links',
    isSystemRole: true,
    status: 'ACTIVE',
    assignedUsersCount: 95,
    permissions: createCategoryMatrix(['Dashboard', 'Tracking', 'NDR', 'RTO'], ['View', 'Export']),
    createdAt: '2026-02-05',
    updatedAt: '2026-08-18',
  },
  {
    id: 'role-seller-wh',
    name: 'Warehouse User',
    code: 'WAREHOUSE_USER',
    portal: 'SELLER',
    description: 'Manages inventory dispatch, pickup requests & order packing',
    isSystemRole: true,
    status: 'ACTIVE',
    assignedUsersCount: 64,
    permissions: createCategoryMatrix(['Dashboard', 'Orders', 'Warehouses'], ['View', 'Create', 'Edit']),
    createdAt: '2026-02-15',
    updatedAt: '2026-08-22',
  },
  {
    id: 'role-seller-custom',
    name: 'Custom Role',
    code: 'CUSTOM_ROLE',
    portal: 'SELLER',
    description: 'Configurable staff permissions for third-party logistics managers',
    isSystemRole: false,
    status: 'ACTIVE',
    assignedUsersCount: 18,
    permissions: createCategoryMatrix(['Dashboard', 'Orders', 'Tracking', 'Reports'], ['View', 'Export']),
    createdAt: '2026-04-01',
    updatedAt: '2026-09-03',
  },
];

export const INITIAL_USERS: RbacUser[] = [
  {
    id: 'usr-admin-01',
    name: 'Super Admin User',
    email: 'admin@shippingaggregator.com',
    roleId: 'role-admin-super',
    roleName: 'Super Admin',
    portal: 'ADMIN',
    status: 'ACTIVE',
    lastLogin: '2026-09-04 15:45',
    ipAddress: '192.168.1.100',
  },
  {
    id: 'usr-admin-ops',
    name: 'Vikram Singh',
    email: 'vikram.ops@aggregator.com',
    roleId: 'role-admin-ops',
    roleName: 'Operations Admin',
    portal: 'ADMIN',
    status: 'ACTIVE',
    lastLogin: '2026-09-04 14:20',
    ipAddress: '192.168.1.102',
  },
  {
    id: 'usr-admin-fin',
    name: 'Priya Sharma',
    email: 'priya.finance@aggregator.com',
    roleId: 'role-admin-fin',
    roleName: 'Finance Admin',
    portal: 'ADMIN',
    status: 'ACTIVE',
    lastLogin: '2026-09-04 12:10',
    ipAddress: '192.168.1.105',
  },
  {
    id: 'usr-admin-supp',
    name: 'Rohan Verma',
    email: 'rohan.support@aggregator.com',
    roleId: 'role-admin-supp',
    roleName: 'Support Admin',
    portal: 'ADMIN',
    status: 'ACTIVE',
    lastLogin: '2026-09-03 18:30',
    ipAddress: '192.168.1.110',
  },
  {
    id: 'usr-seller-01',
    name: 'Apex Merchant (Owner)',
    email: 'owner@apexlogistics.com',
    roleId: 'role-seller-owner',
    roleName: 'Account Owner',
    portal: 'SELLER',
    status: 'ACTIVE',
    lastLogin: '2026-09-04 16:00',
    ipAddress: '106.210.44.12',
  },
  {
    id: 'usr-seller-02',
    name: 'Rahul Sharma',
    email: 'rahul.s@apexlogistics.com',
    roleId: 'role-seller-ops',
    roleName: 'Operations User',
    portal: 'SELLER',
    status: 'ACTIVE',
    lastLogin: '2026-09-04 14:15',
    ipAddress: '106.210.44.15',
  },
  {
    id: 'usr-seller-03',
    name: 'Priya Verma',
    email: 'priya.v@apexlogistics.com',
    roleId: 'role-seller-bill',
    roleName: 'Billing User',
    portal: 'SELLER',
    status: 'ACTIVE',
    lastLogin: '2026-09-03 16:40',
    ipAddress: '106.210.44.18',
  },
];

export const INITIAL_AUDIT_LOGS: RbacAuditLog[] = [
  {
    id: 'log-001',
    date: '2026-09-04',
    time: '15:45:22',
    user: 'Super Admin User',
    email: 'admin@shippingaggregator.com',
    role: 'Super Admin',
    action: 'Permission Changed',
    resource: 'Finance Admin Matrix',
    ip: '192.168.1.100',
    details: 'Granted Export permission to Rate Cards category for Finance Admin',
  },
  {
    id: 'log-002',
    date: '2026-09-04',
    time: '14:20:10',
    user: 'Vikram Singh',
    email: 'vikram.ops@aggregator.com',
    role: 'Operations Admin',
    action: 'User Assigned',
    resource: 'Rahul Sharma -> Operations User',
    ip: '192.168.1.102',
    details: 'Assigned Rahul Sharma to Operations User role in Apex Logistics',
  },
  {
    id: 'log-003',
    date: '2026-09-04',
    time: '13:10:05',
    user: 'Support User (Rohan)',
    email: 'rohan.support@aggregator.com',
    role: 'Support Admin',
    action: 'Access Denied Events',
    resource: 'URL: /admin/b2b-rates',
    ip: '192.168.1.110',
    details: 'Blocked attempt to modify master B2B rate cards without Rate Cards:Edit permission',
  },
  {
    id: 'log-004',
    date: '2026-09-03',
    time: '18:15:30',
    user: 'Super Admin User',
    email: 'admin@shippingaggregator.com',
    role: 'Super Admin',
    action: 'Role Created',
    resource: 'Custom Admin Role',
    ip: '192.168.1.100',
    details: 'Created custom admin role for Regional Compliance Leads',
  },
  {
    id: 'log-005',
    date: '2026-09-03',
    time: '16:40:00',
    user: 'Apex Merchant',
    email: 'owner@apexlogistics.com',
    role: 'Account Owner',
    action: 'Role Duplicated',
    resource: 'Operations User -> Ops Lead Custom',
    ip: '106.210.44.12',
    details: 'Duplicated Operations User role to create custom team role',
  },
];
