import type { Manifest, ManifestItem } from '../types/manifests';
import { PickupEngine } from './pickupEngine';
import { CustomerShipmentService } from './customerShipmentService';
import { CustomerWarehouseService } from './customerWarehouseService';

const MANIFESTS_STORAGE_KEY = 'maxline_manifests_store';

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
      warehouseId: pickup?.warehouseId || 'primary-hub',
      warehouseName: pickup?.warehouseName || 'Primary Fulfillment Warehouse',
      manifestNumber,
      shipmentIds,
      items,
      shipmentCount: items.length,
      totalPackages: items.reduce((acc, i) => acc + i.packageCount, 0),
      totalWeightGrams: items.reduce((acc, i) => acc + i.weightGrams, 0),
      totalCodAmountMinor: items.reduce((acc, i) => acc + i.codAmountMinor, 0),
      status: 'GENERATED',
      generatedAt: nowStr,
      handoverBy: 'Authorized Dispatch Officer',
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
    const tenantId = input.tenantId || '';
    const wh = CustomerWarehouseService.getWarehouseById(input.warehouseId, tenantId) || {
      warehouseName: 'Primary Warehouse',
      city: 'Delhi',
      pincode: '110001',
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
      handoverBy: 'Authorized Dispatch Officer',
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
    return null;
  },

  getAllManifests: (tenantId: string = ''): Manifest[] => {
    const list = Array.from(MANIFESTS_STORE.values());
    if (!tenantId || tenantId === 'all') return list;
    return list.filter((m) => m.tenantId === tenantId);
  },

  markHandover: async (
    manifestId: string,
    handoverBy: string = 'Authorized Dispatch Officer',
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
