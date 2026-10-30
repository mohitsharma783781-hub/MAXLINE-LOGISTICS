export interface CourierPartnerMaster extends Record<string, unknown> {
  courierId: string;
  courierName: string;
  code: string;
  logoUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
  b2bEnabled: boolean;
  b2cEnabled: boolean;
  codEnabled: boolean;
  multiPackageEnabled: boolean;
  trackingEnabled: boolean;
  apiStatus: 'NOT_CONNECTED' | 'CONNECTED' | 'ERROR';
  createdAt: string;
  updatedAt: string;
}

export interface CourierServiceMaster extends Record<string, unknown> {
  serviceId: string;
  courierId: string;
  serviceName: string;
  serviceCode: string;
  mode: 'B2B' | 'B2C';
  transportMode: 'SURFACE' | 'AIR' | 'EXPRESS' | 'OTHER';
  codSupported: boolean;
  multiPackageSupported: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export const INITIAL_COURIER_PARTNERS: CourierPartnerMaster[] = [
  {
    courierId: 'delhivery',
    courierName: 'Delhivery Surface & Express',
    code: 'DELHIVERY',
    status: 'ACTIVE',
    b2bEnabled: true,
    b2cEnabled: true,
    codEnabled: true,
    multiPackageEnabled: true,
    trackingEnabled: true,
    apiStatus: 'NOT_CONNECTED',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    courierId: 'bluedart',
    courierName: 'Blue Dart Air Priority',
    code: 'BLUEDART',
    status: 'ACTIVE',
    b2bEnabled: true,
    b2cEnabled: true,
    codEnabled: true,
    multiPackageEnabled: true,
    trackingEnabled: true,
    apiStatus: 'NOT_CONNECTED',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    courierId: 'dtdc',
    courierName: 'DTDC Express Cargo',
    code: 'DTDC',
    status: 'ACTIVE',
    b2bEnabled: true,
    b2cEnabled: true,
    codEnabled: true,
    multiPackageEnabled: true,
    trackingEnabled: true,
    apiStatus: 'NOT_CONNECTED',
    createdAt: '2026-08-05',
    updatedAt: '2026-08-05',
  },
  {
    courierId: 'xpressbees',
    courierName: 'Xpressbees Surface',
    code: 'XPRESSBEES',
    status: 'ACTIVE',
    b2bEnabled: true,
    b2cEnabled: true,
    codEnabled: true,
    multiPackageEnabled: false,
    trackingEnabled: true,
    apiStatus: 'NOT_CONNECTED',
    createdAt: '2026-08-10',
    updatedAt: '2026-08-10',
  },
];

export const INITIAL_COURIER_SERVICES: CourierServiceMaster[] = [
  {
    serviceId: 'express-surface',
    courierId: 'delhivery',
    serviceName: 'Express Surface Cargo',
    serviceCode: 'DEL_SURFACE',
    mode: 'B2C',
    transportMode: 'SURFACE',
    codSupported: true,
    multiPackageSupported: true,
    status: 'ACTIVE',
  },
  {
    serviceId: 'express-air',
    courierId: 'bluedart',
    serviceName: 'Express Priority Air',
    serviceCode: 'BD_AIR',
    mode: 'B2C',
    transportMode: 'AIR',
    codSupported: true,
    multiPackageSupported: true,
    status: 'ACTIVE',
  },
  {
    serviceId: 'b2b-surface-cargo',
    courierId: 'delhivery',
    serviceName: 'B2B Heavy Cargo Surface',
    serviceCode: 'DEL_B2B_SURFACE',
    mode: 'B2B',
    transportMode: 'SURFACE',
    codSupported: true,
    multiPackageSupported: true,
    status: 'ACTIVE',
  },
];

let COURIERS_STORE = [...INITIAL_COURIER_PARTNERS];
let SERVICES_STORE = [...INITIAL_COURIER_SERVICES];

export const CourierMasterService = {
  getCouriers: (statusFilter = 'all'): CourierPartnerMaster[] => {
    return COURIERS_STORE.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      return true;
    });
  },

  getCourierById: (id: string): CourierPartnerMaster | null => {
    return COURIERS_STORE.find((c) => c.courierId === id) || null;
  },

  getServices: (courierId?: string): CourierServiceMaster[] => {
    return SERVICES_STORE.filter((s) => {
      if (courierId && s.courierId !== courierId) return false;
      return true;
    });
  },

  toggleCourierStatus: (courierId: string): boolean => {
    const courier = COURIERS_STORE.find((c) => c.courierId === courierId);
    if (!courier) return false;
    courier.status = courier.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    courier.updatedAt = new Date().toISOString().split('T')[0];
    return true;
  },
};
