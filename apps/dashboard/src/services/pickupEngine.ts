import type {
  PickupRequest,
  PickupStatus,
  CreatePickupInput,
  CreatePickupResponse,
} from '../types/pickups';
import { CourierAdapterFactory } from './courierAdapter';
import type { CourierCode } from '../types/couriers';

const PICKUPS_STORE: Map<string, PickupRequest> = new Map();

// PRE-POPULATE INITIAL MOCK PICKUP
const INITIAL_PICKUP: PickupRequest = {
  id: 'DEMO-9840192',
  pickupNumber: 'PICKUP-2026-849201',
  pickupReference: 'PICKUP-2026-849201',
  warehouseId: 'wh-001',
  warehouseName: 'Mumbai MIDC Logistics Hub',
  warehouseAddress: 'Plot 42, MIDC Industrial Area, Bhiwandi, Thane, MH - 421302',
  courierId: 'delhivery',
  courierName: 'Delhivery Surface',
  shipmentIds: ['SHP-9840192'],
  shipmentCount: 1,
  totalWeightKg: 1.5,
  pickupDate: '2026-08-21',
  timeSlot: '10:00 AM - 01:00 PM',
  contactPerson: 'Rajesh Kumar',
  contactPhone: '+91 98200 11223',
  status: 'SCHEDULED',
  statusText: 'Scheduled for Pickup',
  createdAt: '2026-08-20 16:35 PM',
  updatedAt: '2026-08-20 16:35 PM',
  tenantId: 'tenant-demo-01',
  events: [
    {
      id: 'evt-pk-1',
      pickupId: 'DEMO-9840192',
      status: 'REQUESTED',
      title: 'Pickup Request Submitted',
      description: 'Pickup dispatch requested for 1 parcel via Delhivery Surface',
      timestamp: '2026-08-20 16:35 PM',
    },
    {
      id: 'evt-pk-2',
      pickupId: 'DEMO-9840192',
      status: 'SCHEDULED',
      title: 'Pickup Scheduled',
      description: 'Carrier associate assigned for pickup slot 10:00 AM - 01:00 PM',
      timestamp: '2026-08-20 17:00 PM',
    },
  ],
};

PICKUPS_STORE.set(INITIAL_PICKUP.id, INITIAL_PICKUP);

export const PickupStateMachine = {
  canTransition: (current: PickupStatus, next: PickupStatus): boolean => {
    const validMap: Record<string, string[]> = {
      DRAFT: ['REQUESTED', 'CANCELLED'],
      REQUESTED: ['SCHEDULED', 'FAILED', 'CANCELLED'],
      SCHEDULED: ['PICKUP_IN_PROGRESS', 'PICKED_UP', 'FAILED', 'CANCELLED'],
      PICKUP_IN_PROGRESS: ['PICKED_UP', 'FAILED', 'CANCELLED'],
      PICKED_UP: [],
      FAILED: ['REQUESTED', 'CANCELLED'],
      CANCELLED: [],
    };
    const allowed = validMap[current] || [];
    return allowed.includes(next);
  },
};

export const PickupEngine = {
  createPickupRequest: async (input: CreatePickupInput): Promise<CreatePickupResponse> => {
    if (!input.shipmentIds || input.shipmentIds.length === 0) {
      return { success: false, pickupReference: '', status: 'FAILED', pickupDate: input.pickupDate, pickupSlot: input.pickupSlot, failureReason: 'No shipments selected' };
    }

    const nowStr = new Date().toLocaleString();
    const pickupId = `pk-${Date.now()}`;
    const pickupRef = `PICKUP-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const code: CourierCode = (input.courierId.toUpperCase() === 'BLUEDART' ? 'BLUE_DART' : input.courierId.toUpperCase()) as CourierCode;
    
    try {
      const adapter = CourierAdapterFactory.getAdapter(code);
      await adapter.requestPickup(input.shipmentIds);

      const requestObj: PickupRequest = {
        id: pickupId,
        pickupNumber: pickupRef,
        pickupReference: pickupRef,
        warehouseId: input.warehouseId || 'wh-001',
        warehouseName: input.warehouseId === 'wh-002' ? 'Delhi Air Cargo Hub' : 'Mumbai MIDC Logistics Hub',
        warehouseAddress: 'MIDC Industrial Area, Bhiwandi, Thane, MH - 421302',
        courierId: input.courierId,
        courierName: code.replace('_', ' '),
        shipmentIds: input.shipmentIds,
        shipmentCount: input.shipmentIds.length,
        totalWeightKg: input.shipmentIds.length * 1.5,
        pickupDate: input.pickupDate,
        timeSlot: input.pickupSlot,
        contactPerson: input.contactPerson,
        contactPhone: input.contactPhone,
        status: 'SCHEDULED',
        statusText: 'Scheduled for Pickup',
        createdAt: nowStr,
        updatedAt: nowStr,
        tenantId: input.tenantId || 'tenant-demo-01',
        events: [
          {
            id: `evt-${Date.now()}-1`,
            pickupId,
            status: 'REQUESTED',
            title: 'Pickup Requested',
            description: `Pickup request created for ${input.shipmentIds.length} parcels via Demo Adapter`,
            timestamp: nowStr,
          },
          {
            id: `evt-${Date.now()}-2`,
            pickupId,
            status: 'SCHEDULED',
            title: 'Carrier Scheduled',
            description: `Carrier scheduled for slot ${input.pickupSlot} on ${input.pickupDate}`,
            timestamp: nowStr,
          },
        ],
      };

      PICKUPS_STORE.set(pickupId, requestObj);

      return {
        success: true,
        pickupReference: pickupRef,
        status: 'SCHEDULED',
        pickupDate: input.pickupDate,
        pickupSlot: input.pickupSlot,
        pickup: requestObj,
      };
    } catch (err: any) {
      return {
        success: false,
        pickupReference: pickupRef,
        status: 'FAILED',
        pickupDate: input.pickupDate,
        pickupSlot: input.pickupSlot,
        failureReason: err?.message || 'Carrier pickup adapter failed',
      };
    }
  },

  getPickup: (id: string): PickupRequest | null => {
    const match = PICKUPS_STORE.get(id);
    if (match) return match;
    for (const p of Array.from(PICKUPS_STORE.values())) {
      if (p.pickupReference === id || p.pickupNumber === id) return p;
    }
    return INITIAL_PICKUP;
  },

  getAllPickups: (tenantId: string = 'tenant-demo-01'): PickupRequest[] => {
    return Array.from(PICKUPS_STORE.values()).filter((p) => p.tenantId === tenantId || tenantId === 'all');
  },

  retryPickup: async (id: string): Promise<PickupRequest | null> => {
    const match = PickupEngine.getPickup(id);
    if (!match) return null;
    match.status = 'SCHEDULED';
    match.statusText = 'Re-scheduled for Pickup';
    match.updatedAt = new Date().toLocaleString();
    match.events.push({
      id: `evt-${Date.now()}`,
      pickupId: match.id,
      status: 'SCHEDULED',
      title: 'Pickup Retried',
      description: 'Pickup request re-scheduled with carrier partner',
      timestamp: match.updatedAt,
    });
    return match;
  },

  cancelPickup: (id: string): PickupRequest | null => {
    const match = PickupEngine.getPickup(id);
    if (!match) return null;
    match.status = 'CANCELLED';
    match.statusText = 'Cancelled by Merchant';
    match.updatedAt = new Date().toLocaleString();
    match.events.push({
      id: `evt-${Date.now()}`,
      pickupId: match.id,
      status: 'CANCELLED',
      title: 'Pickup Cancelled',
      description: 'Pickup request cancelled by merchant',
      timestamp: match.updatedAt,
    });
    return match;
  },
};
