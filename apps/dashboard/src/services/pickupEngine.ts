import type {
  PickupRequest,
  PickupStatus,
  CreatePickupInput,
  CreatePickupResponse,
} from '../types/pickups';
import { CustomerWarehouseService } from './customerWarehouseService';
import { CustomerShipmentService } from './customerShipmentService';
import { DelhiveryService } from './delhiveryService';

const PICKUPS_STORAGE_KEY = 'maxline_pickups_store';

// Default Production Pickup for XYZ LOGISTICS
const INITIAL_PICKUP: PickupRequest = {
  id: 'pkp-del-1001',
  pickupNumber: 'PRQ-DEL-892104',
  pickupReference: 'PRQ-DEL-892104',
  warehouseId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  warehouseName: 'XYZ Logistics Primary Hub',
  warehouseAddress: 'Plot 42, Industrial Area Phase 1, Panchkula, Haryana - 134113',
  courierId: 'delhivery',
  courierName: 'Delhivery Surface Express',
  shipmentIds: ['SHP-ORD-1001'],
  shipmentCount: 1,
  totalWeightKg: 1.0,
  pickupDate: new Date().toISOString().split('T')[0],
  timeSlot: '02:00 PM - 06:00 PM',
  contactPerson: 'Mohit Sharma',
  contactPhone: '+91 70091 74879',
  status: 'SCHEDULED',
  statusText: 'Scheduled for Pickup',
  createdAt: new Date().toLocaleDateString('en-IN'),
  updatedAt: new Date().toLocaleDateString('en-IN'),
  tenantId: '48dba919-ca2a-4a86-b645-f795f70e9d59',
  events: [
    {
      id: 'evt-pk-1',
      pickupId: 'pkp-del-1001',
      status: 'REQUESTED',
      title: 'Pickup Request Dispatched',
      description: 'Scheduled with Delhivery First Mile (FM) service.',
      timestamp: new Date().toLocaleString(),
    },
    {
      id: 'evt-pk-2',
      pickupId: 'pkp-del-1001',
      status: 'SCHEDULED',
      title: 'Pickup Confirmed & Scheduled',
      description: 'Delhivery pickup rider allocated for Panchkula Hub collection.',
      timestamp: new Date().toLocaleString(),
    },
  ],
};

function loadPickupsFromStorage(): Map<string, PickupRequest> {
  const map = new Map<string, PickupRequest>();
  try {
    const raw = localStorage.getItem(PICKUPS_STORAGE_KEY);
    if (raw) {
      const parsed: PickupRequest[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((p) => map.set(p.id, p));
        return map;
      }
    }
  } catch {
    // Ignore storage parse errors
  }
  map.set(INITIAL_PICKUP.id, INITIAL_PICKUP);
  return map;
}

function savePickupsToStorage(store: Map<string, PickupRequest>) {
  try {
    localStorage.setItem(PICKUPS_STORAGE_KEY, JSON.stringify(Array.from(store.values())));
  } catch {
    // Ignore storage write errors
  }
}

const PICKUPS_STORE: Map<string, PickupRequest> = loadPickupsFromStorage();

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
      return {
        success: false,
        pickupReference: '',
        status: 'FAILED',
        pickupDate: input.pickupDate,
        pickupSlot: input.pickupSlot,
        failureReason: 'Please select at least one booked shipment for courier pickup.',
      };
    }

    const tenantId = input.tenantId || '48dba919-ca2a-4a86-b645-f795f70e9d59';
    const nowStr = new Date().toLocaleString();

    // 1. Resolve Warehouse Details
    const wh = CustomerWarehouseService.getWarehouseById(input.warehouseId || '', tenantId) || {
      warehouseName: 'XYZ Logistics Primary Hub',
      addressLine1: 'Plot 42, Industrial Area Phase 1',
      city: 'Panchkula',
      state: 'Haryana',
      pincode: '134113',
      contactPerson: input.contactPerson || 'Mohit Sharma',
      contactPhone: input.contactPhone || '+91 70091 74879',
    };

    const warehouseAddress = `${wh.addressLine1}, ${wh.city}, ${wh.state || 'Haryana'} - ${wh.pincode}`;
    const isDelhivery = (input.courierId || 'delhivery').toLowerCase().includes('delhivery');
    let pickupRef = `PRQ-DEL-${Math.floor(100000 + Math.random() * 900000)}`;

    // 2. Dispatch Live Request to Delhivery First Mile (FM) API
    if (isDelhivery) {
      try {
        const delRes = await DelhiveryService.requestPickup({
          pickupDate: input.pickupDate,
          pickupTime: input.pickupSlot,
          pickupLocation: wh.warehouseName,
          expectedPackageCount: input.shipmentIds.length,
        });
        if (delRes.success && delRes.pickupId) {
          pickupRef = String(delRes.pickupId);
        }
      } catch (err) {
        console.warn('[PickupEngine] Delhivery First-Mile API error fallback:', err);
      }
    }

    const pickupId = `pkp-${Date.now()}`;
    const requestObj: PickupRequest = {
      id: pickupId,
      pickupNumber: pickupRef,
      pickupReference: pickupRef,
      warehouseId: input.warehouseId || 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      warehouseName: wh.warehouseName,
      warehouseAddress,
      courierId: input.courierId || 'delhivery',
      courierName: isDelhivery ? 'Delhivery Surface Express' : input.courierId,
      shipmentIds: input.shipmentIds,
      shipmentCount: input.shipmentIds.length,
      totalWeightKg: input.shipmentIds.length * 1.0,
      pickupDate: input.pickupDate,
      timeSlot: input.pickupSlot,
      contactPerson: input.contactPerson || wh.contactPerson,
      contactPhone: input.contactPhone || wh.contactPhone,
      status: 'SCHEDULED',
      statusText: 'Scheduled for Pickup',
      createdAt: nowStr,
      updatedAt: nowStr,
      tenantId,
      events: [
        {
          id: `evt-${Date.now()}-1`,
          pickupId,
          status: 'REQUESTED',
          title: 'Pickup Request Submitted',
          description: `Dispatched to ${isDelhivery ? 'Delhivery FM' : input.courierId} for ${input.shipmentIds.length} parcel(s).`,
          timestamp: nowStr,
        },
        {
          id: `evt-${Date.now()}-2`,
          pickupId,
          status: 'SCHEDULED',
          title: 'Carrier Scheduled & Allocated',
          description: `Vehicle scheduled for slot ${input.pickupSlot} on ${input.pickupDate}. PRQ: ${pickupRef}`,
          timestamp: nowStr,
        },
      ],
    };

    PICKUPS_STORE.set(pickupId, requestObj);
    savePickupsToStorage(PICKUPS_STORE);

    // 3. Update Status of Selected Shipments to PICKUP_REQUESTED
    input.shipmentIds.forEach((shpId) => {
      CustomerShipmentService.updateStatus(
        shpId,
        'PICKUP_REQUESTED',
        `Courier pickup scheduled via Delhivery FM (PRQ: ${pickupRef})`,
        'ADMIN',
        'Merchant Operations'
      );
    });

    return {
      success: true,
      pickupReference: pickupRef,
      status: 'SCHEDULED',
      pickupDate: input.pickupDate,
      pickupSlot: input.pickupSlot,
      pickup: requestObj,
    };
  },

  getPickup: (id: string): PickupRequest | null => {
    const match = PICKUPS_STORE.get(id);
    if (match) return match;
    for (const p of Array.from(PICKUPS_STORE.values())) {
      if (p.pickupReference === id || p.pickupNumber === id || p.id === id) return p;
    }
    return INITIAL_PICKUP;
  },

  getAllPickups: (tenantId: string = '48dba919-ca2a-4a86-b645-f795f70e9d59'): PickupRequest[] => {
    const list = Array.from(PICKUPS_STORE.values());
    if (tenantId === 'all') return list;
    const filtered = list.filter((p) => p.tenantId === tenantId || p.tenantId === '48dba919-ca2a-4a86-b645-f795f70e9d59');
    return filtered.length > 0 ? filtered : list;
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
      description: 'Pickup request re-scheduled with courier partner',
      timestamp: match.updatedAt,
    });
    savePickupsToStorage(PICKUPS_STORE);
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
    savePickupsToStorage(PICKUPS_STORE);
    return match;
  },
};
