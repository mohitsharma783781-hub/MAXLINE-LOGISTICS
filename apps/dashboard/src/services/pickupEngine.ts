import type {
  PickupRequest,
  PickupStatus,
  CreatePickupInput,
  CreatePickupResponse,
} from '../types/pickups';
import { CustomerWarehouseService } from './customerWarehouseService';
import { CustomerShipmentService } from './customerShipmentService';
import { DelhiveryService } from './delhiveryService';
import { DelhiveryB2bService } from './delhiveryB2bService';

const PICKUPS_STORAGE_KEY = 'maxline_pickups_store';

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

    const tenantId = input.tenantId || '';
    const nowStr = new Date().toLocaleString();

    // 1. Resolve Warehouse Details
    const wh = CustomerWarehouseService.getWarehouseById(input.warehouseId || '', tenantId) || {
      warehouseName: 'Primary Warehouse',
      addressLine1: 'Warehouse Address',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      contactPerson: input.contactPerson || 'Dispatch Officer',
      contactPhone: input.contactPhone || '',
    };

    const warehouseAddress = `${wh.addressLine1}, ${wh.city}, ${wh.state || 'Haryana'} - ${wh.pincode}`;
    
    // Detect B2B shipments
    const targetShipments = input.shipmentIds
      .map((id) => CustomerShipmentService.getShipmentById(id, tenantId) || CustomerShipmentService.getShipmentById(id))
      .filter(Boolean);
    const hasB2b = targetShipments.some((s) => s?.mode === 'B2B' || s?.courierName?.toLowerCase().includes('b2b'));
    const isDelhiveryB2b = hasB2b || (input.courierId || '').toLowerCase().includes('b2b');
    const isDelhivery = (input.courierId || 'delhivery').toLowerCase().includes('delhivery');
    
    let pickupRef = isDelhiveryB2b
      ? `PRQ-B2B-${Math.floor(100000 + Math.random() * 900000)}`
      : `PRQ-DEL-${Math.floor(100000 + Math.random() * 900000)}`;

    let computedTotalWeight = targetShipments.reduce((sum, s) => sum + (Number(s?.chargeableWeightKg) || 1), 0);
    if (isDelhiveryB2b && computedTotalWeight < 20) computedTotalWeight = 20;

    const consignments = targetShipments.map((s) => s?.awbNumber).filter(Boolean) as string[];

    // 2. Dispatch Live Request to Delhivery B2B Freight vs B2C Express API
    if (isDelhiveryB2b) {
      try {
        const b2bRes = await DelhiveryB2bService.requestPickup({
          pickupWarehouse: wh.warehouseName || 'AJAYKUMAR10RP B2BRC',
          pickupDate: input.pickupDate,
          pickupTime: input.pickupSlot,
          expectedPackageCount: input.shipmentIds.length,
          totalWeightKg: computedTotalWeight,
          consignments,
          contactPerson: input.contactPerson || wh.contactPerson,
          contactPhone: input.contactPhone || wh.contactPhone,
          vehicleType: 'Commercial Cargo Van / Tata Ace',
          specialInstructions: input.specialInstructions,
        });
        if (b2bRes.success && b2bRes.pickupId) {
          pickupRef = String(b2bRes.pickupId);
        } else {
          return {
            success: false,
            pickupReference: '',
            status: 'FAILED',
            pickupDate: input.pickupDate,
            pickupSlot: input.pickupSlot,
            failureReason: b2bRes.message || 'Delhivery B2B Freight pickup scheduling was rejected by carrier gateway.',
          };
        }
      } catch (b2bErr: any) {
        return {
          success: false,
          pickupReference: '',
          status: 'FAILED',
          pickupDate: input.pickupDate,
          pickupSlot: input.pickupSlot,
          failureReason: `Delhivery B2B Pickup Exception: ${b2bErr?.message || 'Network error'}`,
        };
      }
    } else if (isDelhivery) {
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
    const courierNameDisplay = isDelhiveryB2b
      ? 'Delhivery Surface B2B'
      : isDelhivery
      ? 'Delhivery Surface Express'
      : input.courierId;

    const requestObj: PickupRequest = {
      id: pickupId,
      pickupNumber: pickupRef,
      pickupReference: pickupRef,
      warehouseId: input.warehouseId || 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      warehouseName: wh.warehouseName,
      warehouseAddress,
      courierId: input.courierId || (isDelhiveryB2b ? 'delhivery-b2b' : 'delhivery'),
      courierName: courierNameDisplay,
      shipmentIds: input.shipmentIds,
      shipmentCount: input.shipmentIds.length,
      totalWeightKg: computedTotalWeight,
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
