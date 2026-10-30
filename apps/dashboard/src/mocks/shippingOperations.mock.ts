import type {
  ShippingLabelItem,
  LabelFilterState,
  BulkLabelResult,
  LabelFormat,
  LabelSize,
  ManifestItem,
  ManifestFilterState,
  CreateManifestInput,
  CreateManifestResponse,
} from '../types/shippingOperations';
import { DEMO_WAREHOUSES } from './pickups.mock';

// --- DEMO LABELS DATA ---
export const DEMO_SHIPPING_LABELS: ShippingLabelItem[] = [
  {
    id: 'lbl-101',
    shipmentId: 'SHP-9840192',
    orderId: 'ORD-9840192',
    courierId: 'delhivery',
    courierName: 'Delhivery Surface',
    courierLogo: '📦',
    awb: 'DEMO-AWB-98401928',
    status: 'GENERATED',
    format: 'PDF',
    size: '4x6',
    labelReference: 'DEMO-LABEL-849201',
    labelUrl: 'https://demo.shipping-saas.com/labels/DEMO-AWB-98401928.pdf',
    originPincode: '110001',
    destinationPincode: '400001',
    destinationCity: 'Mumbai',
    weightKg: 1.5,
    paymentMode: 'COD',
    codAmount: 1500,
    generatedAt: '2026-08-20 16:31 PM',
  },
  {
    id: 'lbl-102',
    shipmentId: 'DEMO-9840193',
    orderId: 'ORD-9840193',
    courierId: 'fedex',
    courierName: 'FedEx Priority',
    courierLogo: '⚡',
    awb: 'DEMO-AWB-98401939',
    status: 'NOT_GENERATED',
    format: 'PDF',
    size: '4x6',
    labelReference: 'DEMO-LABEL-849202',
    originPincode: '110001',
    destinationPincode: '560001',
    destinationCity: 'Bengaluru',
    weightKg: 2.8,
    paymentMode: 'PREPAID',
  },
  {
    id: 'lbl-103',
    shipmentId: 'DEMO-9840197',
    orderId: 'ORD-9840197',
    courierId: 'bluedart',
    courierName: 'BlueDart Express',
    courierLogo: '✈️',
    awb: 'DEMO-AWB-98401971',
    status: 'GENERATED',
    format: 'PNG',
    size: '4x6',
    labelReference: 'DEMO-LABEL-849203',
    labelUrl: 'https://demo.shipping-saas.com/labels/DEMO-AWB-98401971.png',
    originPincode: '122015',
    destinationPincode: '700001',
    destinationCity: 'Kolkata',
    weightKg: 46.2,
    paymentMode: 'PREPAID',
    generatedAt: '2026-08-20 10:15 AM',
  },
  {
    id: 'lbl-104',
    shipmentId: 'DEMO-9840195',
    orderId: 'ORD-9840195',
    courierId: 'delhivery',
    courierName: 'Delhivery Surface',
    courierLogo: '📦',
    awb: 'DEMO-AWB-98401955',
    status: 'FAILED',
    format: 'PDF',
    size: 'A4',
    labelReference: 'DEMO-LABEL-849204',
    originPincode: '560058',
    destinationPincode: '600001',
    destinationCity: 'Chennai',
    weightKg: 2.5,
    paymentMode: 'COD',
    codAmount: 2200,
    failureReason: 'Carrier label layout renderer timed out. Click Retry to re-generate.',
  },
];

// In-Memory Label Store
const LABEL_STORE: Map<string, ShippingLabelItem> = new Map();
DEMO_SHIPPING_LABELS.forEach((l) => LABEL_STORE.set(l.shipmentId, l));

export const demoLabelProvider = {
  getLabels: (filters?: LabelFilterState): ShippingLabelItem[] => {
    const list = Array.from(LABEL_STORE.values());
    if (!filters) return list;

    return list.filter((item) => {
      if (filters.status !== 'all' && item.status !== filters.status) return false;
      if (filters.courier !== 'all' && item.courierId !== filters.courier) return false;
      if (filters.format !== 'all' && item.format !== filters.format) return false;
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchId = item.shipmentId.toLowerCase().includes(q) || item.awb.toLowerCase().includes(q) || item.orderId.toLowerCase().includes(q);
        if (!matchId) return false;
      }
      return true;
    });
  },

  getLabelByShipmentId: (shipmentId: string): ShippingLabelItem | null => {
    return LABEL_STORE.get(shipmentId) || null;
  },

  generateLabel: (shipmentId: string, format: LabelFormat = 'PDF', size: LabelSize = '4x6'): ShippingLabelItem => {
    let label = LABEL_STORE.get(shipmentId);
    const nowStr = new Date().toLocaleString();

    if (!label) {
      const randRef = Math.floor(100000 + Math.random() * 900000);
      label = {
        id: `lbl-${Date.now()}`,
        shipmentId,
        orderId: `ORD-${shipmentId.replace('SHP-', '')}`,
        courierId: 'delhivery',
        courierName: 'Delhivery Surface',
        courierLogo: '📦',
        awb: `DEMO-AWB-${randRef}`,
        status: 'GENERATED',
        format,
        size,
        labelReference: `DEMO-LABEL-${randRef}`,
        labelUrl: `https://demo.shipping-saas.com/labels/DEMO-AWB-${randRef}.${format.toLowerCase()}`,
        originPincode: '110001',
        destinationPincode: '400001',
        destinationCity: 'Mumbai',
        weightKg: 1.5,
        paymentMode: 'COD',
        codAmount: 1200,
        generatedAt: nowStr,
      };
    } else {
      label.status = 'GENERATED';
      label.format = format;
      label.size = size;
      label.labelUrl = `https://demo.shipping-saas.com/labels/${label.awb}.${format.toLowerCase()}`;
      label.generatedAt = nowStr;
      delete label.failureReason;
    }

    LABEL_STORE.set(shipmentId, label);
    return label;
  },

  bulkGenerateLabels: (shipmentIds: string[], format: LabelFormat = 'PDF', size: LabelSize = '4x6'): BulkLabelResult => {
    let generatedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const results: BulkLabelResult['results'] = [];

    for (const sId of shipmentIds) {
      const existing = LABEL_STORE.get(sId);
      if (existing && existing.status === 'GENERATED') {
        skippedCount++;
        results.push({ shipmentId: sId, success: true, labelReference: existing.labelReference });
        continue;
      }

      try {
        const generated = demoLabelProvider.generateLabel(sId, format, size);
        generatedCount++;
        results.push({ shipmentId: sId, success: true, labelReference: generated.labelReference });
      } catch (err) {
        failedCount++;
        results.push({ shipmentId: sId, success: false, failureReason: 'Label generation failed' });
      }
    }

    return { generatedCount, failedCount, skippedCount, results };
  },

  retryLabelGeneration: (shipmentId: string): ShippingLabelItem => {
    return demoLabelProvider.generateLabel(shipmentId, 'PDF', '4x6');
  },
};

// --- DEMO MANIFESTS DATA ---
export const DEMO_MANIFESTS: ManifestItem[] = [
  {
    id: 'mnf-101',
    manifestNumber: 'MNF-DEMO-001',
    manifestReference: 'DEMO-MANIFEST-849201',
    courierId: 'bluedart',
    courierName: 'BlueDart Express',
    warehouseId: 'wh-001',
    warehouseName: 'Gurugram Main Logistics Hub',
    warehouseAddress: 'Plot 42, Sector 18, Gurugram, HR - 122015',
    shipmentIds: ['DEMO-9840192', 'DEMO-9840197'],
    shipmentCount: 2,
    totalWeightKg: 47.7,
    status: 'CLOSED',
    statusText: 'Manifest Closed',
    createdAt: '2026-08-20 09:30 AM',
    closedAt: '2026-08-20 10:00 AM',
    events: [
      {
        id: 'mevt-1',
        manifestId: 'mnf-101',
        status: 'CLOSED',
        title: 'Manifest Closed',
        description: 'Manifest locked with 2 verified parcels for courier handover.',
        timestamp: '20 Aug 2026, 10:00 AM',
      },
      {
        id: 'mevt-2',
        manifestId: 'mnf-101',
        status: 'DRAFT',
        title: 'Manifest Created',
        description: 'Draft manifest created for BlueDart Express at Gurugram Hub.',
        timestamp: '20 Aug 2026, 09:30 AM',
      },
    ],
  },
  {
    id: 'mnf-102',
    manifestNumber: 'MNF-DEMO-002',
    manifestReference: 'DEMO-MANIFEST-849202',
    courierId: 'delhivery',
    courierName: 'Delhivery Surface',
    warehouseId: 'wh-002',
    warehouseName: 'Mumbai Central Fulfillment Center',
    warehouseAddress: 'Bldg A3, Bhiwandi Warehousing Zone, Mumbai, MH - 421302',
    shipmentIds: ['DEMO-9840193', 'DEMO-9840198'],
    shipmentCount: 2,
    totalWeightKg: 5.3,
    status: 'DRAFT',
    statusText: 'Draft',
    createdAt: '2026-08-21 08:15 AM',
    events: [
      {
        id: 'mevt-1',
        manifestId: 'mnf-102',
        status: 'DRAFT',
        title: 'Manifest Created',
        description: 'Draft manifest initialized for Delhivery Surface.',
        timestamp: '21 Aug 2026, 08:15 AM',
      },
    ],
  },
  {
    id: 'mnf-103',
    manifestNumber: 'MNF-DEMO-003',
    manifestReference: 'DEMO-MANIFEST-849203',
    courierId: 'delhivery',
    courierName: 'Delhivery Surface',
    warehouseId: 'wh-003',
    warehouseName: 'Bengaluru South Cargo Terminal',
    warehouseAddress: 'Gate 4, Peenya Industrial Area, Bengaluru, KA - 560058',
    shipmentIds: ['DEMO-9840195', 'DEMO-9840199'],
    shipmentCount: 2,
    totalWeightKg: 2.5,
    status: 'HANDED_OVER',
    statusText: 'Handed Over',
    createdAt: '2026-08-19 08:30 AM',
    closedAt: '2026-08-19 09:00 AM',
    handedOverAt: '2026-08-19 11:30 AM',
    events: [
      {
        id: 'mevt-1',
        manifestId: 'mnf-103',
        status: 'HANDED_OVER',
        title: 'Handover Completed',
        description: 'Handed over 2 parcels to Delhivery pickup executive.',
        timestamp: '19 Aug 2026, 11:30 AM',
      },
      {
        id: 'mevt-2',
        manifestId: 'mnf-103',
        status: 'CLOSED',
        title: 'Manifest Closed',
        description: 'Manifest closed and locked.',
        timestamp: '19 Aug 2026, 09:00 AM',
      },
    ],
  },
];

// In-Memory Manifest Store
const MANIFEST_STORE: Map<string, ManifestItem> = new Map();
DEMO_MANIFESTS.forEach((m) => MANIFEST_STORE.set(m.manifestNumber, m));

export const demoManifestProvider = {
  getManifests: (filters?: ManifestFilterState): ManifestItem[] => {
    const list = Array.from(MANIFEST_STORE.values());
    if (!filters) return list;

    return list.filter((item) => {
      if (filters.status !== 'all' && item.status !== filters.status) return false;
      if (filters.warehouse !== 'all' && item.warehouseId !== filters.warehouse) return false;
      if (filters.courier !== 'all' && item.courierId !== filters.courier) return false;
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchId = item.manifestNumber.toLowerCase().includes(q) || item.manifestReference.toLowerCase().includes(q) || item.courierName.toLowerCase().includes(q);
        if (!matchId) return false;
      }
      return true;
    });
  },

  getManifestById: (id: string): ManifestItem | null => {
    const match = MANIFEST_STORE.get(id) || Array.from(MANIFEST_STORE.values()).find((m) => m.id === id);
    return match || DEMO_MANIFESTS[0];
  },

  createManifest: async (input: CreateManifestInput): Promise<CreateManifestResponse> => {
    const { warehouseId, courierId, shipmentIds } = input;
    const warehouse = DEMO_WAREHOUSES.find((w) => w.id === warehouseId) || DEMO_WAREHOUSES[0];
    const randNum = Math.floor(100000 + Math.random() * 900000);
    const manifestNumber = `MNF-DEMO-${randNum}`;
    const manifestReference = `DEMO-MANIFEST-${randNum}`;
    const nowStr = new Date().toLocaleString();

    const newManifest: ManifestItem = {
      id: `mnf-${Date.now()}`,
      manifestNumber,
      manifestReference,
      courierId,
      courierName: courierId === 'bluedart' ? 'BlueDart Express' : courierId === 'delhivery' ? 'Delhivery Surface' : 'FedEx Priority',
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      warehouseAddress: `${warehouse.addressLine1}, ${warehouse.city}, ${warehouse.state} - ${warehouse.pincode}`,
      shipmentIds,
      shipmentCount: shipmentIds.length,
      totalWeightKg: Number((shipmentIds.length * 2.1).toFixed(1)),
      status: 'DRAFT',
      statusText: 'Draft',
      createdAt: nowStr,
      events: [
        {
          id: `mevt-${Date.now()}`,
          manifestId: manifestNumber,
          status: 'DRAFT',
          title: 'Manifest Created',
          description: `Draft manifest initialized with ${shipmentIds.length} parcels at ${warehouse.name}`,
          timestamp: nowStr,
        },
      ],
    };

    MANIFEST_STORE.set(manifestNumber, newManifest);

    return {
      success: true,
      manifestReference,
      status: 'DRAFT',
      manifest: newManifest,
    };
  },

  addShipmentsToManifest: (manifestId: string, newShipmentIds: string[]): ManifestItem | null => {
    const manifest = MANIFEST_STORE.get(manifestId) || Array.from(MANIFEST_STORE.values()).find((m) => m.id === manifestId);
    if (!manifest || manifest.status !== 'DRAFT') return null;

    manifest.shipmentIds = Array.from(new Set([...manifest.shipmentIds, ...newShipmentIds]));
    manifest.shipmentCount = manifest.shipmentIds.length;
    manifest.totalWeightKg = Number((manifest.shipmentCount * 2.1).toFixed(1));

    MANIFEST_STORE.set(manifest.manifestNumber, manifest);
    return manifest;
  },

  removeShipmentFromManifest: (manifestId: string, shipmentId: string): ManifestItem | null => {
    const manifest = MANIFEST_STORE.get(manifestId) || Array.from(MANIFEST_STORE.values()).find((m) => m.id === manifestId);
    if (!manifest || manifest.status !== 'DRAFT') return null;

    manifest.shipmentIds = manifest.shipmentIds.filter((id) => id !== shipmentId);
    manifest.shipmentCount = manifest.shipmentIds.length;
    manifest.totalWeightKg = Number((manifest.shipmentCount * 2.1).toFixed(1));

    MANIFEST_STORE.set(manifest.manifestNumber, manifest);
    return manifest;
  },

  closeManifest: (manifestId: string): ManifestItem | null => {
    const manifest = MANIFEST_STORE.get(manifestId) || Array.from(MANIFEST_STORE.values()).find((m) => m.id === manifestId);
    if (!manifest) return null;

    manifest.status = 'CLOSED';
    manifest.statusText = 'Manifest Closed';
    manifest.closedAt = new Date().toLocaleString();
    manifest.events.unshift({
      id: `mevt-${Date.now()}`,
      manifestId: manifest.manifestNumber,
      status: 'CLOSED',
      title: 'Manifest Closed',
      description: 'Manifest closed and locked for courier handover.',
      timestamp: manifest.closedAt,
    });

    MANIFEST_STORE.set(manifest.manifestNumber, manifest);
    return manifest;
  },

  handoverManifest: (manifestId: string): ManifestItem | null => {
    const manifest = MANIFEST_STORE.get(manifestId) || Array.from(MANIFEST_STORE.values()).find((m) => m.id === manifestId);
    if (!manifest) return null;

    manifest.status = 'HANDED_OVER';
    manifest.statusText = 'Handed Over';
    manifest.handedOverAt = new Date().toLocaleString();
    manifest.events.unshift({
      id: `mevt-${Date.now()}`,
      manifestId: manifest.manifestNumber,
      status: 'HANDED_OVER',
      title: 'Handover Completed',
      description: `Handed over ${manifest.shipmentCount} parcels to ${manifest.courierName} pickup executive.`,
      timestamp: manifest.handedOverAt,
    });

    MANIFEST_STORE.set(manifest.manifestNumber, manifest);
    return manifest;
  },
};
