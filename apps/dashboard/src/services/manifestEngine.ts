import type { Manifest, ManifestItem } from '../types/manifests';
import { PickupEngine } from './pickupEngine';

const MANIFESTS_STORE: Map<string, Manifest> = new Map();

// PRE-POPULATE INITIAL DEMO MANIFEST
const INITIAL_MANIFEST: Manifest = {
  id: 'man-9840192',
  tenantId: 'tenant-demo-01',
  pickupRequestId: 'DEMO-9840192',
  courierId: 'delhivery',
  courierName: 'Delhivery Surface',
  warehouseId: 'wh-001',
  warehouseName: 'Mumbai MIDC Logistics Hub',
  manifestNumber: 'MAN-2026-849201',
  shipmentIds: ['SHP-9840192'],
  items: [
    {
      shipmentId: 'SHP-9840192',
      orderRef: 'ORD-9840192',
      awb: 'DELHIVERY-849201',
      recipientName: 'Rohan Sharma',
      recipientCity: 'Mumbai',
      packageCount: 1,
      weightGrams: 1500,
      paymentMode: 'COD',
      codAmountMinor: 150000,
    },
  ],
  shipmentCount: 1,
  totalPackages: 1,
  totalWeightGrams: 1500,
  totalCodAmountMinor: 150000,
  status: 'HANDED_OVER',
  generatedAt: '2026-08-20 16:40 PM',
  handedOverAt: '2026-08-20 17:15 PM',
  handoverBy: 'Rajesh Kumar (Warehouse Manager)',
  notes: 'Handed over 1 parcel to Delhivery associate Vijay Singh',
  createdAt: '2026-08-20 16:40 PM',
  updatedAt: '2026-08-20 17:15 PM',
};

MANIFESTS_STORE.set(INITIAL_MANIFEST.id, INITIAL_MANIFEST);

export const ManifestEngine = {
  generateManifest: async (pickupRequestId: string): Promise<Manifest> => {
    const pickup = PickupEngine.getPickup(pickupRequestId);
    const manifestId = `man-${Date.now()}`;
    const manifestNumber = `MAN-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowStr = new Date().toLocaleString();

    const items: ManifestItem[] = (pickup?.shipmentIds || ['SHP-9840192']).map((shpId, idx) => ({
      shipmentId: shpId,
      orderRef: `ORD-984019${idx + 2}`,
      awb: `DELHIVERY-84920${idx + 2}`,
      recipientName: 'Rohan Sharma',
      recipientCity: 'Mumbai',
      packageCount: 1,
      weightGrams: 1500,
      paymentMode: 'COD',
      codAmountMinor: 150000,
    }));

    const manifestObj: Manifest = {
      id: manifestId,
      tenantId: pickup?.tenantId || 'tenant-demo-01',
      pickupRequestId,
      courierId: pickup?.courierId || 'delhivery',
      courierName: pickup?.courierName || 'Delhivery Surface',
      warehouseId: pickup?.warehouseId || 'wh-001',
      warehouseName: pickup?.warehouseName || 'Mumbai MIDC Logistics Hub',
      manifestNumber,
      shipmentIds: pickup?.shipmentIds || ['SHP-9840192'],
      items,
      shipmentCount: items.length,
      totalPackages: items.reduce((acc, i) => acc + i.packageCount, 0),
      totalWeightGrams: items.reduce((acc, i) => acc + i.weightGrams, 0),
      totalCodAmountMinor: items.reduce((acc, i) => acc + i.codAmountMinor, 0),
      status: 'GENERATED',
      generatedAt: nowStr,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    MANIFESTS_STORE.set(manifestId, manifestObj);
    return manifestObj;
  },

  getManifest: (id: string): Manifest | null => {
    const match = MANIFESTS_STORE.get(id);
    if (match) return match;
    for (const m of Array.from(MANIFESTS_STORE.values())) {
      if (m.manifestNumber === id || m.pickupRequestId === id) return m;
    }
    return INITIAL_MANIFEST;
  },

  getAllManifests: (tenantId: string = 'tenant-demo-01'): Manifest[] => {
    return Array.from(MANIFESTS_STORE.values()).filter((m) => m.tenantId === tenantId || tenantId === 'all');
  },

  markHandover: async (
    manifestId: string,
    handoverBy: string = 'Operations Team',
    notes?: string
  ): Promise<Manifest | null> => {
    const manifest = ManifestEngine.getManifest(manifestId);
    if (!manifest) return null;

    manifest.status = 'HANDED_OVER';
    manifest.handedOverAt = new Date().toLocaleString();
    manifest.handoverBy = handoverBy;
    if (notes) manifest.notes = notes;
    manifest.updatedAt = manifest.handedOverAt;

    return manifest;
  },
};
