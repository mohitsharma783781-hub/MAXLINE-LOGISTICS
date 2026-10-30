export interface CourierAdapterServiceabilityInput extends Record<string, unknown> {
  originPostalCode: string;
  destinationPostalCode: string;
  mode: 'B2C' | 'B2B';
  paymentMode: 'PREPAID' | 'COD';
  weightGrams?: number;
}

export interface CourierAdapterServiceabilityResult extends Record<string, unknown> {
  courierId: string;
  serviceId: string;
  serviceable: boolean;
  isODA: boolean;
  zoneCode?: string;
  reasonMessage?: string;
}

export type InternalTrackingStatus =
  | 'BOOKED'
  | 'PICKUP_REQUESTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'NDR'
  | 'RTO'
  | 'CANCELLED'
  | 'UNKNOWN';

export interface CourierTrackingEvent extends Record<string, unknown> {
  status: InternalTrackingStatus;
  location?: string;
  timestamp: string;
  description: string;
  providerEventCode?: string;
}

export interface CourierProviderAdapter {
  providerId: string;
  providerName: string;
  checkServiceability: (input: CourierAdapterServiceabilityInput) => Promise<CourierAdapterServiceabilityResult>;
  createShipment: (payload: Record<string, unknown>) => Promise<{ success: boolean; awb: string; bookingRef: string; message?: string }>;
  generateAWB: (payload: Record<string, unknown>) => Promise<{ success: boolean; awb: string }>;
  generateLabel: (awb: string) => Promise<{ success: boolean; labelUrl: string }>;
  requestPickup: (payload: Record<string, unknown>) => Promise<{ success: boolean; pickupRef: string }>;
  trackShipment: (awb: string) => Promise<{ success: boolean; currentStatus: InternalTrackingStatus; events: CourierTrackingEvent[] }>;
  getShipmentStatus: (awb: string) => Promise<{ success: boolean; status: InternalTrackingStatus }>;
  cancelShipment: (awb: string) => Promise<{ success: boolean; message: string }>;
}

// 1. Delhivery Carrier Adapter Placeholder
export const DelhiveryAdapter: CourierProviderAdapter = {
  providerId: 'delhivery',
  providerName: 'Delhivery Integration Adapter',

  checkServiceability: async (input) => {
    const isServiceable = input.destinationPostalCode !== '999999';
    const isODA = input.destinationPostalCode.startsWith('799') || input.destinationPostalCode.startsWith('190');
    return {
      courierId: 'delhivery',
      serviceId: 'express-surface',
      serviceable: isServiceable,
      isODA,
      zoneCode: isODA ? 'ODA_ZONE' : 'N1',
      reasonMessage: isServiceable ? 'Serviceable via Delhivery network' : 'Out of coverage',
    };
  },

  createShipment: async (payload) => {
    const orderId = (payload.orderId as string) || 'ORD-2026-9041';
    return {
      success: true,
      awb: `DEL${Math.floor(100000000 + Math.random() * 900000000)}`,
      bookingRef: `DEL-REF-${orderId}`,
    };
  },

  generateAWB: async () => ({ success: true, awb: `DEL${Math.floor(100000000 + Math.random() * 900000000)}` }),
  generateLabel: async (awb) => ({ success: true, labelUrl: `/labels/${awb}.pdf` }),
  requestPickup: async () => ({ success: true, pickupRef: `DEL-PKP-${Date.now()}` }),

  trackShipment: async (_awb) => ({
    success: true,
    currentStatus: 'IN_TRANSIT',
    events: [
      { status: 'BOOKED', location: 'Delhi Hub', timestamp: new Date().toISOString(), description: 'Manifest created' },
      { status: 'IN_TRANSIT', location: 'Bengaluru Hub', timestamp: new Date().toISOString(), description: 'In transit' },
    ],
  }),

  getShipmentStatus: async () => ({ success: true, status: 'IN_TRANSIT' }),
  cancelShipment: async (awb) => ({ success: true, message: `Delhivery AWB ${awb} cancelled.` }),
};

// 2. DTDC Carrier Adapter Placeholder
export const DTDCAdapter: CourierProviderAdapter = {
  providerId: 'dtdc',
  providerName: 'DTDC Express Adapter',

  checkServiceability: async (input) => ({
    courierId: 'dtdc',
    serviceId: 'express-cargo',
    serviceable: input.destinationPostalCode !== '999999',
    isODA: false,
    zoneCode: 'ZONE_DTDC_1',
  }),

  createShipment: async (payload) => ({
    success: true,
    awb: `DTDC${Math.floor(10000000 + Math.random() * 90000000)}`,
    bookingRef: `DTDC-REF-${payload.orderId || '9041'}`,
  }),

  generateAWB: async () => ({ success: true, awb: `DTDC${Math.floor(10000000 + Math.random() * 90000000)}` }),
  generateLabel: async (awb) => ({ success: true, labelUrl: `/labels/${awb}.pdf` }),
  requestPickup: async () => ({ success: true, pickupRef: `DTDC-PKP-${Date.now()}` }),

  trackShipment: async () => ({
    success: true,
    currentStatus: 'BOOKED',
    events: [{ status: 'BOOKED', location: 'Origin Hub', timestamp: new Date().toISOString(), description: 'Order booked with DTDC' }],
  }),

  getShipmentStatus: async () => ({ success: true, status: 'BOOKED' }),
  cancelShipment: async (awb) => ({ success: true, message: `DTDC AWB ${awb} cancelled.` }),
};

// 3. BlueDart Carrier Adapter Placeholder
export const BlueDartAdapter: CourierProviderAdapter = {
  providerId: 'bluedart',
  providerName: 'Blue Dart Air Express Adapter',

  checkServiceability: async (input) => ({
    courierId: 'bluedart',
    serviceId: 'express-air',
    serviceable: input.destinationPostalCode !== '999999',
    isODA: false,
  }),

  createShipment: async (payload) => ({
    success: true,
    awb: `BD${Math.floor(100000000 + Math.random() * 900000000)}`,
    bookingRef: `BD-REF-${payload.orderId || '9041'}`,
  }),

  generateAWB: async () => ({ success: true, awb: `BD${Math.floor(100000000 + Math.random() * 900000000)}` }),
  generateLabel: async (awb) => ({ success: true, labelUrl: `/labels/${awb}.pdf` }),
  requestPickup: async () => ({ success: true, pickupRef: `BD-PKP-${Date.now()}` }),

  trackShipment: async () => ({
    success: true,
    currentStatus: 'IN_TRANSIT',
    events: [{ status: 'IN_TRANSIT', location: 'Airport Cargo Hub', timestamp: new Date().toISOString(), description: 'Flight departed' }],
  }),

  getShipmentStatus: async () => ({ success: true, status: 'IN_TRANSIT' }),
  cancelShipment: async (awb) => ({ success: true, message: `Blue Dart AWB ${awb} cancelled.` }),
};

// 4. Xpressbees Carrier Adapter Placeholder
export const XpressbeesAdapter: CourierProviderAdapter = {
  providerId: 'xpressbees',
  providerName: 'Xpressbees Logistics Adapter',

  checkServiceability: async (input) => ({
    courierId: 'xpressbees',
    serviceId: 'express-surface',
    serviceable: input.destinationPostalCode !== '999999',
    isODA: false,
  }),

  createShipment: async (payload) => ({
    success: true,
    awb: `XB${Math.floor(100000000 + Math.random() * 900000000)}`,
    bookingRef: `XB-REF-${payload.orderId || '9041'}`,
  }),

  generateAWB: async () => ({ success: true, awb: `XB${Math.floor(100000000 + Math.random() * 900000000)}` }),
  generateLabel: async (awb) => ({ success: true, labelUrl: `/labels/${awb}.pdf` }),
  requestPickup: async () => ({ success: true, pickupRef: `XB-PKP-${Date.now()}` }),

  trackShipment: async () => ({
    success: true,
    currentStatus: 'BOOKED',
    events: [{ status: 'BOOKED', location: 'Sorting Center', timestamp: new Date().toISOString(), description: 'Manifest generated' }],
  }),

  getShipmentStatus: async () => ({ success: true, status: 'BOOKED' }),
  cancelShipment: async (awb) => ({ success: true, message: `Xpressbees AWB ${awb} cancelled.` }),
};

// 5. Development Mock Adapter
export const MockCourierProviderAdapter: CourierProviderAdapter = {
  providerId: 'mock-courier-adapter',
  providerName: '[DEVELOPMENT / MOCK] Carrier Integration Adapter',

  checkServiceability: async (input) => {
    const isServiceable = input.destinationPostalCode !== '999999';
    const isODA = input.destinationPostalCode.startsWith('799') || input.destinationPostalCode.startsWith('190');

    return {
      courierId: 'delhivery',
      serviceId: 'express-surface',
      serviceable: isServiceable,
      isODA,
      zoneCode: isODA ? 'ODA_ZONE' : 'ZONE_NORTH',
      reasonMessage: isServiceable ? (isODA ? 'Serviceable (ODA Destination)' : 'Serviceable Direct Coverage') : 'Out of delivery coverage',
    };
  },

  createShipment: async (payload) => {
    const orderId = (payload.orderId as string) || 'ORD-2026-9041';
    return {
      success: true,
      awb: `DEL${Math.floor(100000000 + Math.random() * 900000000)}`,
      bookingRef: `MOCK-REF-${orderId}`,
    };
  },

  generateAWB: async () => ({ success: true, awb: `DEL${Math.floor(100000000 + Math.random() * 900000000)}` }),
  generateLabel: async (awb) => ({ success: true, labelUrl: `/labels/${awb}.pdf` }),
  requestPickup: async () => ({ success: true, pickupRef: `PKP-${Math.floor(100000 + Math.random() * 900000)}` }),

  trackShipment: async () => ({
    success: true,
    currentStatus: 'IN_TRANSIT',
    events: [
      { status: 'BOOKED', location: 'Origin Hub', timestamp: new Date().toISOString(), description: 'Booked in Development Mode' },
      { status: 'IN_TRANSIT', location: 'Transit Hub', timestamp: new Date().toISOString(), description: 'In transit simulation' },
    ],
  }),

  getShipmentStatus: async () => ({ success: true, status: 'IN_TRANSIT' }),
  cancelShipment: async (awb) => ({ success: true, message: `Mock shipment AWB ${awb} cancelled successfully.` }),
};

// Factory Resolver
export const getCourierAdapter = (courierId: string): CourierProviderAdapter => {
  const id = courierId.toLowerCase();
  if (id === 'delhivery') return DelhiveryAdapter;
  if (id === 'dtdc') return DTDCAdapter;
  if (id === 'bluedart') return BlueDartAdapter;
  if (id === 'xpressbees') return XpressbeesAdapter;
  return MockCourierProviderAdapter;
};
