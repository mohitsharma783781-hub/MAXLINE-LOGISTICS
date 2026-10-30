import type {
  CourierCode,
  NormalizedRate,
  NormalizedServiceabilityResult,
  NormalizedBookingResult,
  NormalizedTrackingResult,
  UniversalAdapterError,
  CourierServiceItem,
  CourierHealth,
  CourierActivityLog,
} from '../types/couriers';

// UNIVERSAL COURIER ADAPTER INTERFACE
export interface CourierAdapter {
  getRates(weightKg: number, originPincode: string, destPincode: string): Promise<NormalizedRate>;
  checkServiceability(originPincode: string, destPincode: string): Promise<NormalizedServiceabilityResult>;
  createShipment(payload: { shipmentId: string; orderId?: string; destPincode: string }): Promise<NormalizedBookingResult>;
  trackShipment(awb: string): Promise<NormalizedTrackingResult>;
  requestPickup(shipmentIds: string[]): Promise<{ success: boolean; pickupReference: string }>;
}

// 1. DEMO DELHIVERY ADAPTER
export const DemoDelhiveryAdapter: CourierAdapter = {
  getRates: async (weightKg, _originPincode, _destPincode) => {
    return {
      success: true,
      courierCode: 'DELHIVERY',
      serviceCode: 'DELHIVERY_SURFACE',
      amount: 60 + weightKg * 15,
      currency: 'INR',
      estimatedDeliveryDays: 3,
    };
  },

  checkServiceability: async (_originPincode, destPincode) => {
    const serviceable = destPincode !== '000000';
    return {
      success: true,
      serviceable,
      courierCode: 'DELHIVERY',
      serviceCode: 'DELHIVERY_SURFACE',
      estimatedDeliveryDays: 3,
      reason: serviceable ? 'Pincode covered by Delhivery Surface network' : 'Unserviceable pincode',
    };
  },

  createShipment: async (payload) => {
    return {
      success: true,
      courierCode: 'DELHIVERY',
      shipmentReference: payload.shipmentId,
      awb: `DELHIVERY-${Math.floor(10000000 + Math.random() * 90000000)}`,
      status: 'BOOKED',
    };
  },

  trackShipment: async (awb) => {
    return {
      success: true,
      courierCode: 'DELHIVERY',
      awb,
      status: 'IN_TRANSIT',
      events: [
        { status: 'BOOKED', description: 'Manifest created at origin warehouse', eventTime: '2026-08-20 10:00 AM', location: 'Mumbai MIDC' },
        { status: 'IN_TRANSIT', description: 'Arrived at Delhivery Sorting Facility', eventTime: '2026-08-21 04:30 AM', location: 'Bhiwandi Hub' },
      ],
    };
  },

  requestPickup: async (_shipmentIds) => {
    return {
      success: true,
      pickupReference: `PICKUP-DELHIVERY-${Math.floor(100000 + Math.random() * 900000)}`,
    };
  },
};

// 2. DEMO DTDC ADAPTER
export const DemoDTDCAdapter: CourierAdapter = {
  getRates: async (weightKg) => {
    return {
      success: true,
      courierCode: 'DTDC',
      serviceCode: 'DTDC_EXPRESS',
      amount: 75 + weightKg * 18,
      currency: 'INR',
      estimatedDeliveryDays: 2,
    };
  },

  checkServiceability: async () => {
    return {
      success: true,
      serviceable: true,
      courierCode: 'DTDC',
      serviceCode: 'DTDC_EXPRESS',
      estimatedDeliveryDays: 2,
      reason: 'Pincode covered by DTDC Express Air',
    };
  },

  createShipment: async (payload) => {
    return {
      success: true,
      courierCode: 'DTDC',
      shipmentReference: payload.shipmentId,
      awb: `DTDC-${Math.floor(10000000 + Math.random() * 90000000)}`,
      status: 'BOOKED',
    };
  },

  trackShipment: async (awb) => {
    return {
      success: true,
      courierCode: 'DTDC',
      awb,
      status: 'OUT_FOR_DELIVERY',
      events: [
        { status: 'BOOKED', description: 'Shipment handed over to DTDC courier', eventTime: '2026-08-20 11:00 AM', location: 'Jaipur Hub' },
        { status: 'OUT_FOR_DELIVERY', description: 'Out for delivery with delivery associate', eventTime: '2026-08-21 09:00 AM', location: 'Jaipur Central' },
      ],
    };
  },

  requestPickup: async () => ({ success: true, pickupReference: `PICKUP-DTDC-${Math.floor(100000 + Math.random() * 900000)}` }),
};

// 3. DEMO BLUEDART ADAPTER
export const DemoBlueDartAdapter: CourierAdapter = {
  getRates: async (weightKg) => {
    return {
      success: true,
      courierCode: 'BLUE_DART',
      serviceCode: 'BLUEDART_AIR_PRIORITY',
      amount: 110 + weightKg * 25,
      currency: 'INR',
      estimatedDeliveryDays: 1,
    };
  },

  checkServiceability: async () => {
    return {
      success: true,
      serviceable: true,
      courierCode: 'BLUE_DART',
      serviceCode: 'BLUEDART_AIR_PRIORITY',
      estimatedDeliveryDays: 1,
      reason: 'Pincode covered by BlueDart Air Express',
    };
  },

  createShipment: async (payload) => {
    return {
      success: true,
      courierCode: 'BLUE_DART',
      shipmentReference: payload.shipmentId,
      awb: `BD-${Math.floor(10000000 + Math.random() * 90000000)}`,
      status: 'BOOKED',
    };
  },

  trackShipment: async (awb) => {
    return {
      success: true,
      courierCode: 'BLUE_DART',
      awb,
      status: 'DELIVERED',
      events: [
        { status: 'DELIVERED', description: 'Delivered and signed by recipient', eventTime: '2026-08-21 12:30 PM', location: 'Delhi Airport Hub' },
      ],
    };
  },

  requestPickup: async () => ({ success: true, pickupReference: `PICKUP-BD-${Math.floor(100000 + Math.random() * 900000)}` }),
};

// 4. DEMO XPRESSBEES ADAPTER
export const DemoXpressBeesAdapter: CourierAdapter = {
  getRates: async (weightKg) => {
    return {
      success: true,
      courierCode: 'XPRESSBEES',
      serviceCode: 'XB_SURFACE',
      amount: 55 + weightKg * 12,
      currency: 'INR',
      estimatedDeliveryDays: 4,
    };
  },

  checkServiceability: async () => {
    return {
      success: true,
      serviceable: true,
      courierCode: 'XPRESSBEES',
      serviceCode: 'XB_SURFACE',
      estimatedDeliveryDays: 4,
      reason: 'Pincode covered by XpressBees Surface',
    };
  },

  createShipment: async (payload) => {
    return {
      success: true,
      courierCode: 'XPRESSBEES',
      shipmentReference: payload.shipmentId,
      awb: `XB-${Math.floor(10000000 + Math.random() * 90000000)}`,
      status: 'BOOKED',
    };
  },

  trackShipment: async (awb) => {
    return {
      success: true,
      courierCode: 'XPRESSBEES',
      awb,
      status: 'IN_TRANSIT',
      events: [
        { status: 'BOOKED', description: 'Shipment created', eventTime: '2026-08-20 02:00 PM', location: 'Pune Gateway' },
      ],
    };
  },

  requestPickup: async () => ({ success: true, pickupReference: `PICKUP-XB-${Math.floor(100000 + Math.random() * 900000)}` }),
};

// ADAPTER FACTORY
export const CourierAdapterFactory = {
  getAdapter: (courierCode: CourierCode): CourierAdapter => {
    switch (courierCode) {
      case 'DELHIVERY':
        return DemoDelhiveryAdapter;
      case 'DTDC':
        return DemoDTDCAdapter;
      case 'BLUE_DART':
        return DemoBlueDartAdapter;
      case 'XPRESSBEES':
        return DemoXpressBeesAdapter;
      default:
        throw {
          code: 'COURIER_ADAPTER_NOT_FOUND',
          message: `No adapter implementation registered for courier code: ${courierCode}`,
        } as UniversalAdapterError;
    }
  },
};

// REGISTRY MOCK DATA & SERVICES
const COURIER_SERVICES_STORE: CourierServiceItem[] = [
  {
    id: 'srv-101',
    courierId: 'delhivery',
    tenantId: 'tenant-demo-01',
    code: 'DELHIVERY_SURFACE',
    name: 'Delhivery Surface Parcel',
    serviceType: 'surface',
    mode: 'SURFACE',
    deliveryType: 'B2C',
    paymentModes: ['PREPAID', 'COD'],
    enabled: true,
    status: 'ACTIVE',
    capabilities: ['RATE', 'SERVICEABILITY', 'BOOKING', 'AWB', 'LABEL', 'TRACKING', 'NDR', 'RTO'],
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'srv-102',
    courierId: 'delhivery',
    tenantId: 'tenant-demo-01',
    code: 'DELHIVERY_EXPRESS',
    name: 'Delhivery Air Express',
    serviceType: 'express',
    mode: 'AIR',
    deliveryType: 'BOTH',
    paymentModes: ['PREPAID', 'COD'],
    enabled: true,
    status: 'ACTIVE',
    capabilities: ['RATE', 'SERVICEABILITY', 'BOOKING', 'AWB', 'LABEL', 'TRACKING'],
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'srv-103',
    courierId: 'dtdc',
    tenantId: 'tenant-demo-01',
    code: 'DTDC_EXPRESS',
    name: 'DTDC Priority Air',
    serviceType: 'express',
    mode: 'AIR',
    deliveryType: 'BOTH',
    paymentModes: ['PREPAID', 'COD'],
    enabled: true,
    status: 'ACTIVE',
    capabilities: ['RATE', 'SERVICEABILITY', 'BOOKING', 'AWB', 'LABEL', 'TRACKING'],
    createdAt: '2026-08-05',
    updatedAt: '2026-08-05',
  },
  {
    id: 'srv-104',
    courierId: 'bluedart',
    tenantId: 'tenant-demo-01',
    code: 'BLUEDART_AIR_PRIORITY',
    name: 'BlueDart Apex Premium',
    serviceType: 'air',
    mode: 'AIR',
    deliveryType: 'B2C',
    paymentModes: ['PREPAID', 'COD'],
    enabled: true,
    status: 'ACTIVE',
    capabilities: ['RATE', 'SERVICEABILITY', 'BOOKING', 'AWB', 'LABEL', 'TRACKING'],
    createdAt: '2026-08-05',
    updatedAt: '2026-08-05',
  },
];

const COURIER_ACTIVITY_LOGS: CourierActivityLog[] = [
  {
    id: 'act-101',
    tenantId: 'tenant-demo-01',
    courierId: 'delhivery',
    action: 'BOOKING',
    status: 'SUCCESS',
    referenceType: 'SHIPMENT',
    referenceId: 'SHP-9840192',
    message: 'AWB DELHIVERY-849201 generated via DemoDelhiveryAdapter',
    createdAt: '2026-08-20 16:35 PM',
  },
  {
    id: 'act-102',
    tenantId: 'tenant-demo-01',
    courierId: 'dtdc',
    action: 'RATE_CHECK',
    status: 'SUCCESS',
    referenceType: 'RATE',
    referenceId: 'RATE-904',
    message: 'Rate check completed: ₹75.00 (2 days)',
    createdAt: '2026-08-21 09:00 AM',
  },
];

export const CourierRegistry = {
  getServices: (courierId: string): CourierServiceItem[] => {
    return COURIER_SERVICES_STORE.filter((s) => s.courierId === courierId);
  },

  toggleService: (serviceId: string, enabled: boolean): CourierServiceItem | null => {
    const match = COURIER_SERVICES_STORE.find((s) => s.id === serviceId);
    if (!match) return null;
    match.enabled = enabled;
    match.updatedAt = new Date().toLocaleString();
    return { ...match };
  },

  testConnection: async (courierCode: CourierCode): Promise<{ success: boolean; message: string; responseTimeMs: number }> => {
    const startTime = Date.now();
    const adapter = CourierAdapterFactory.getAdapter(courierCode);
    const serviceability = await adapter.checkServiceability('110001', '400001');
    const responseTimeMs = Date.now() - startTime + Math.floor(15 + Math.random() * 35);

    return {
      success: serviceability.success,
      message: `Demo adapter connection test for ${courierCode} successful! Universal Adapter response verified.`,
      responseTimeMs,
    };
  },

  healthCheck: async (courierCode: CourierCode): Promise<CourierHealth> => {
    const res = await CourierRegistry.testConnection(courierCode);
    return {
      courierId: courierCode.toLowerCase(),
      status: res.success ? 'HEALTHY' : 'DOWN',
      checkedAt: new Date().toLocaleString(),
      responseTimeMs: res.responseTimeMs,
      message: res.message,
    };
  },

  getActivityLogs: (courierId: string): CourierActivityLog[] => {
    return COURIER_ACTIVITY_LOGS.filter((a) => a.courierId === courierId || courierId === 'all');
  },
};
