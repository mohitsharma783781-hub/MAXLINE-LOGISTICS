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
    tenantId: '48dba919-ca2a-4a86-b645-f795f70e9d59',
    companyName: 'XYZ LOGISTICS',
    slug: 'xyz-logistics',
    status: 'ACTIVE',
    planTier: 'Enterprise',
    createdAt: '2026-09-01',
    assignedRateCards: ['RC-DELHIVERY-B2C-STD', 'RC-DELHIVERY-B2B-STD'],
    assignedManager: 'Maxline Platform Super Admin',
    contactEmail: 'mohitsharma99229@gmail.com',
    contactMobile: '+91 70091 74879',
    gstNumber: '06AAAAA0000A1Z5',
  },
];

export const INITIAL_SECURITY_EVENTS: TenantSecurityEvent[] = [];

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
