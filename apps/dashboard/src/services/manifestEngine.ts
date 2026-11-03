import type { Manifest, ManifestItem } from '../types/manifests';
import { PickupEngine } from './pickupEngine';
import { CustomerShipmentService } from './customerShipmentService';
import { CustomerWarehouseService } from './customerWarehouseService';

const MANIFESTS_STORAGE_KEY = 'maxline_manifests_store';

// Default Production Manifest for XYZ LOGISTICS
const INITIAL_MANIFEST: Manifest = {
  id: 'man-del-1001',
  tenantId: '48dba919-ca2a-4a86-b645-f795f70e9d59',
  pickupRequestId: 'PRQ-DEL-892104',
  courierId: 'delhivery',
  courierName: 'Delhivery Surface Express',
  warehouseId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  warehouseName: 'XYZ Logistics Primary Hub',
  manifestNumber: 'MAN-2026-104921',
  shipmentIds: ['SHP-ORD-1001'],
  items: [
    {
      shipmentId: 'SHP-ORD-1001',
      orderRef: 'ORD-1001',
      awb: '474740192831',
      recipientName: 'Rohan Sharma',
      recipientCity: 'Bengaluru (560038)',
      packageCount: 1,
      weightGrams: 1000,
      paymentMode: 'PREPAID',
      codAmountMinor: 0,
    },
  ],
  shipmentCount: 1,
  totalPackages: 1,
  totalWeightGrams: 1000,
  totalCodAmountMinor: 0,
  status: 'GENERATED',
  generatedAt: new Date().toLocaleDateString('en-IN'),
  handoverBy: 'Mohit Sharma (XYZ LOGISTICS)',
  notes: 'Handover run sheet for Delhivery pickup van',
  createdAt: new Date().toLocaleDateString('en-IN'),
  updatedAt: new Date().toLocaleDateString('en-IN'),
};

function loadManifestsFromStorage(): Map<string, Manifest> {
  const map = new Map<string, Manifest>();
  try {
    const raw = localStorage.getItem(MANIFESTS_STORAGE_KEY);
    if (raw) {
      const parsed: Manifest[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((m) => map.set(m.id, m));
        return map;
      }
    }
  } catch {
    // Ignore storage parse errors
  }
  map.set(INITIAL_MANIFEST.id, INITIAL_MANIFEST);
  return map;
}

function saveManifestsToStorage(store: Map<string, Manifest>) {
  try {
    localStorage.setItem(MANIFESTS_STORAGE_KEY, JSON.stringify(Array.from(store.values())));
  } catch {
    // Ignore storage write errors
  }
}

const MANIFESTS_STORE: Map<string, Manifest> = loadManifestsFromStorage();

export const ManifestEngine = {
  // Generate Manifest from an existing Pickup Request
  generateManifest: async (pickupRequestId: string): Promise<Manifest> => {
    const pickup = PickupEngine.getPickup(pickupRequestId);
    const manifestId = `man-${Date.now()}`;
    const manifestNumber = `MAN-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowStr = new Date().toLocaleString();
    const tenantId = pickup?.tenantId || '48dba919-ca2a-4a86-b645-f795f70e9d59';

    const shipmentIds = pickup?.shipmentIds || ['SHP-ORD-1001'];
    const items: ManifestItem[] = shipmentIds.map((shpId, idx) => {
      const shipment = CustomerShipmentService.getShipmentById(shpId, tenantId) || CustomerShipmentService.getShipmentById(shpId);
      const isCod = (shipment?.paymentMode || 'PREPAID').toUpperCase() === 'COD';
      const codVal = shipment?.codAmountINR || 0;

      return {
        shipmentId: shpId,
        orderRef: shipment?.orderId || `ORD-100${idx + 1}`,
        awb: shipment?.awbNumber || `47474019283${idx + 1}`,
        recipientName: shipment?.deliveryContact || 'Rohan Sharma',
        recipientCity: `${shipment?.deliveryCity || 'Bengaluru'} (${shipment?.deliveryPincode || '560038'})`,
        packageCount: 1,
        weightGrams: Math.round((shipment?.chargeableWeightKg || 1.0) * 1000),
        paymentMode: isCod ? 'COD' : 'PREPAID',
        codAmountMinor: Math.round(codVal * 100),
      };
    });

    const manifestObj: Manifest = {
      id: manifestId,
      tenantId,
      pickupRequestId: pickup?.pickupNumber || pickupRequestId,
      courierId: pickup?.courierId || 'delhivery',
      courierName: pickup?.courierName || 'Delhivery Surface Express',
      warehouseId: pickup?.warehouseId || 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      warehouseName: pickup?.warehouseName || 'XYZ Logistics Primary Hub',
      manifestNumber,
      shipmentIds,
      items,
      shipmentCount: items.length,
      totalPackages: items.reduce((acc, i) => acc + i.packageCount, 0),
      totalWeightGrams: items.reduce((acc, i) => acc + i.weightGrams, 0),
      totalCodAmountMinor: items.reduce((acc, i) => acc + i.codAmountMinor, 0),
      status: 'GENERATED',
      generatedAt: nowStr,
      handoverBy: 'Mohit Sharma (XYZ LOGISTICS)',
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    MANIFESTS_STORE.set(manifestId, manifestObj);
    saveManifestsToStorage(MANIFESTS_STORE);
    return manifestObj;
  },

  // Generate Manifest directly from shipment IDs & warehouse selection
  createManifestFromShipments: async (input: {
    warehouseId: string;
    courierId: string;
    shipmentIds: string[];
    tenantId?: string;
  }): Promise<Manifest> => {
    const tenantId = input.tenantId || '48dba919-ca2a-4a86-b645-f795f70e9d59';
    const wh = CustomerWarehouseService.getWarehouseById(input.warehouseId, tenantId) || {
      warehouseName: 'XYZ Logistics Primary Hub',
      city: 'Panchkula',
      pincode: '134113',
    };

    const manifestId = `man-${Date.now()}`;
    const manifestNumber = `MAN-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowStr = new Date().toLocaleString();

    const items: ManifestItem[] = input.shipmentIds.map((shpId, idx) => {
      const shipment = CustomerShipmentService.getShipmentById(shpId, tenantId) || CustomerShipmentService.getShipmentById(shpId);
      const isCod = (shipment?.paymentMode || 'PREPAID').toUpperCase() === 'COD';
      const codVal = shipment?.codAmountINR || 0;

      return {
        shipmentId: shpId,
        orderRef: shipment?.orderId || `ORD-100${idx + 1}`,
        awb: shipment?.awbNumber || `47474019283${idx + 1}`,
        recipientName: shipment?.deliveryContact || 'Rohan Sharma',
        recipientCity: `${shipment?.deliveryCity || 'Bengaluru'} (${shipment?.deliveryPincode || '560038'})`,
        packageCount: 1,
        weightGrams: Math.round((shipment?.chargeableWeightKg || 1.0) * 1000),
        paymentMode: isCod ? 'COD' : 'PREPAID',
        codAmountMinor: Math.round(codVal * 100),
      };
    });

    const manifestObj: Manifest = {
      id: manifestId,
      tenantId,
      pickupRequestId: `PRQ-DEL-${Math.floor(100000 + Math.random() * 900000)}`,
      courierId: input.courierId || 'delhivery',
      courierName: (input.courierId || '').toLowerCase().includes('delhivery') ? 'Delhivery Surface Express' : input.courierId,
      warehouseId: input.warehouseId,
      warehouseName: wh.warehouseName,
      manifestNumber,
      shipmentIds: input.shipmentIds,
      items,
      shipmentCount: items.length,
      totalPackages: items.reduce((acc, i) => acc + i.packageCount, 0),
      totalWeightGrams: items.reduce((acc, i) => acc + i.weightGrams, 0),
      totalCodAmountMinor: items.reduce((acc, i) => acc + i.codAmountMinor, 0),
      status: 'GENERATED',
      generatedAt: nowStr,
      handoverBy: 'Mohit Sharma (XYZ LOGISTICS)',
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    MANIFESTS_STORE.set(manifestId, manifestObj);
    saveManifestsToStorage(MANIFESTS_STORE);
    return manifestObj;
  },

  getManifest: (id: string): Manifest | null => {
    const match = MANIFESTS_STORE.get(id);
    if (match) return match;
    for (const m of Array.from(MANIFESTS_STORE.values())) {
      if (m.manifestNumber === id || m.pickupRequestId === id || m.id === id) return m;
    }
    return INITIAL_MANIFEST;
  },

  getAllManifests: (tenantId: string = '48dba919-ca2a-4a86-b645-f795f70e9d59'): Manifest[] => {
    const list = Array.from(MANIFESTS_STORE.values());
    if (tenantId === 'all') return list;
    const filtered = list.filter((m) => m.tenantId === tenantId || m.tenantId === '48dba919-ca2a-4a86-b645-f795f70e9d59');
    return filtered.length > 0 ? filtered : list;
  },

  markHandover: async (
    manifestId: string,
    handoverBy: string = 'Mohit Sharma (XYZ LOGISTICS)',
    notes?: string
  ): Promise<Manifest | null> => {
    const manifest = ManifestEngine.getManifest(manifestId);
    if (!manifest) return null;

    manifest.status = 'HANDED_OVER';
    manifest.handedOverAt = new Date().toLocaleString();
    manifest.handoverBy = handoverBy;
    if (notes) manifest.notes = notes;
    manifest.updatedAt = manifest.handedOverAt;

    // Transition all included shipments to PICKED_UP in CustomerShipmentService
    manifest.shipmentIds.forEach((shpId) => {
      CustomerShipmentService.updateStatus(
        shpId,
        'PICKED_UP',
        `Physical handover completed for manifest ${manifest.manifestNumber}`,
        'ADMIN',
        handoverBy
      );
    });

    saveManifestsToStorage(MANIFESTS_STORE);
    return manifest;
  },
};
