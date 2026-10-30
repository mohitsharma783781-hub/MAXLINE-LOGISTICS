export interface TenantProfile extends Record<string, unknown> {
  tenantId: string;
  companyName: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  planTier: 'Starter' | 'Growth' | 'Enterprise';
  createdAt: string;
  assignedRateCards: string[];
  assignedManager: string;
  contactEmail: string;
  contactMobile: string;
  gstNumber: string;
}

export interface TenantSecurityEvent extends Record<string, unknown> {
  id: string;
  date: string;
  time: string;
  tenantId: string;
  userEmail: string;
  eventType: 'Tenant Access' | 'Permission Violations' | 'Security Events' | 'Admin Overrides' | 'Cross-Tenant Access Blocked';
  targetResource: string;
  ipAddress: string;
  details: string;
}

export const INITIAL_TENANTS: TenantProfile[] = [
  {
    tenantId: 'TENANT-1001',
    companyName: 'Apex Logistics & Retail',
    slug: 'apex-logistics',
    status: 'ACTIVE',
    planTier: 'Enterprise',
    createdAt: '2026-01-01',
    assignedRateCards: ['RC-B2C-EXP-01', 'RC-B2B-HYD-01'],
    assignedManager: 'Vikram Singh (KAM)',
    contactEmail: 'owner@apexlogistics.com',
    contactMobile: '+91 98765 11111',
    gstNumber: '27AABCU9603R1ZM',
  },
  {
    tenantId: 'TENANT-1002',
    companyName: 'Velocity E-Commerce Pvt Ltd',
    slug: 'velocity-ecom',
    status: 'ACTIVE',
    planTier: 'Growth',
    createdAt: '2026-02-10',
    assignedRateCards: ['RC-B2C-STD-02'],
    assignedManager: 'Priya Sharma (KAM)',
    contactEmail: 'priya@velocityecom.com',
    contactMobile: '+91 98765 22222',
    gstNumber: '07AAACV4820K1ZX',
  },
  {
    tenantId: 'TENANT-1003',
    companyName: 'Acme Global Traders',
    slug: 'acme-global',
    status: 'ACTIVE',
    planTier: 'Enterprise',
    createdAt: '2026-03-01',
    assignedRateCards: ['RC-B2B-MUM-03'],
    assignedManager: 'Vikram Singh (KAM)',
    contactEmail: 'amit@acmetraders.in',
    contactMobile: '+91 98765 33333',
    gstNumber: '24AABCA5512B1Z6',
  },
  {
    tenantId: 'TENANT-1004',
    companyName: 'NextGen Direct Commerce',
    slug: 'nextgen-direct',
    status: 'TRIAL',
    planTier: 'Starter',
    createdAt: '2026-04-15',
    assignedRateCards: ['RC-B2C-STD-01'],
    assignedManager: 'Unassigned',
    contactEmail: 'sid@nextgencommerce.com',
    contactMobile: '+91 98765 44444',
    gstNumber: '06AAAAC1234F1Z2',
  },
];

export const INITIAL_SECURITY_EVENTS: TenantSecurityEvent[] = [
  {
    id: 'sec-001',
    date: '2026-09-04',
    time: '15:10:00',
    tenantId: 'TENANT-1001',
    userEmail: 'rahul.s@apexlogistics.com',
    eventType: 'Tenant Access',
    targetResource: 'Module: Wallet & Invoices',
    ipAddress: '106.210.44.12',
    details: 'Validated tenant session access for Apex Logistics',
  },
  {
    id: 'sec-002',
    date: '2026-09-04',
    time: '14:22:15',
    tenantId: 'TENANT-1001',
    userEmail: 'rahul.s@apexlogistics.com',
    eventType: 'Cross-Tenant Access Blocked',
    targetResource: 'URL: /app/shipments/SHP-VELOCITY-999',
    ipAddress: '106.210.44.12',
    details: 'Blocked attempt to access Velocity E-Commerce shipment record from Apex session',
  },
  {
    id: 'sec-003',
    date: '2026-09-03',
    time: '18:05:40',
    tenantId: 'TENANT-1002',
    userEmail: 'priya@velocityecom.com',
    eventType: 'Permission Violations',
    targetResource: 'Action: Export Bulk Financial Invoices',
    ipAddress: '106.210.44.18',
    details: 'Denied export attempt without Billing:Export permission',
  },
];

const STORAGE_KEYS = {
  TENANTS: 'courrier3_tenants_registry',
  EVENTS: 'courrier3_tenant_security_events',
  ACTIVE_TENANT: 'courrier3_active_tenant_id',
};

export const TenantService = {
  getTenants: (): TenantProfile[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TENANTS);
      return saved ? JSON.parse(saved) : INITIAL_TENANTS;
    } catch {
      return INITIAL_TENANTS;
    }
  },

  getSecurityEvents: (): TenantSecurityEvent[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return saved ? JSON.parse(saved) : INITIAL_SECURITY_EVENTS;
    } catch {
      return INITIAL_SECURITY_EVENTS;
    }
  },

  logSecurityEvent: (
    tenantId: string,
    userEmail: string,
    eventType: TenantSecurityEvent['eventType'],
    targetResource: string,
    details: string
  ) => {
    const events = TenantService.getSecurityEvents();
    const now = new Date();
    const newEvent: TenantSecurityEvent = {
      id: `sec-${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      tenantId,
      userEmail,
      eventType,
      targetResource,
      ipAddress: '127.0.0.1',
      details,
    };

    const updated = [newEvent, ...events].slice(0, 50);
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
    return newEvent;
  },

  scopeDataByTenant: <T extends Record<string, unknown>>(
    items: T[],
    activeTenantId: string,
    isSuperAdmin: boolean = false
  ): T[] => {
    if (isSuperAdmin && activeTenantId === 'ALL') {
      return items;
    }

    return items.filter((item, index) => {
      // 1. Explicit tenantId match
      if (item.tenantId && typeof item.tenantId === 'string') {
        return item.tenantId === activeTenantId;
      }

      // 2. Explicit customerId match
      if (item.customerId && typeof item.customerId === 'string') {
        if (item.customerId === 'CUST-1001' && activeTenantId === 'TENANT-1001') return true;
        if (item.customerId === 'CUST-1002' && activeTenantId === 'TENANT-1002') return true;
        if (item.customerId === 'CUST-1003' && activeTenantId === 'TENANT-1003') return true;
        if (item.customerId === 'CUST-1004' && activeTenantId === 'TENANT-1004') return true;
      }

      // 3. Fallback deterministic hash partitioning across tenants for demo datasets
      const hash = index % 3;
      if (activeTenantId === 'TENANT-1001' && hash === 0) return true;
      if (activeTenantId === 'TENANT-1002' && hash === 1) return true;
      if (activeTenantId === 'TENANT-1003' && hash === 2) return true;
      if (activeTenantId === 'TENANT-1004' && hash === 0) return true;

      return false;
    });
  },

  validateOwnership: (recordTenantId: string, activeTenantId: string, isSuperAdmin: boolean): boolean => {
    if (isSuperAdmin) return true;
    if (!recordTenantId) return true;
    return recordTenantId === activeTenantId;
  },
};
