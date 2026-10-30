export interface ServiceabilityImportRecord extends Record<string, unknown> {
  id: string;
  courierId: string;
  serviceId: string;
  mode: 'B2C' | 'B2B';
  fileName: string;
  importedBy: string;
  importedAt: string;
  recordCount: number;
  updatedCount: number;
  newCount: number;
  errorCount: number;
  status: 'UPLOADED' | 'VALIDATED' | 'PUBLISHED' | 'FAILED' | 'ROLLED_BACK';
}

export interface ServiceablePincodeItem {
  id: string;
  courierId: string;
  serviceId: string;
  mode: 'B2C' | 'B2B';
  pincode: string;
  city: string;
  state: string;
  isServiceable: boolean;
  isCOD: boolean;
  isPrepaid: boolean;
  isODA: boolean;
  zoneCode: string;
  importVersionId: string;
}

export const INITIAL_IMPORT_VERSIONS: ServiceabilityImportRecord[] = [
  {
    id: 'imp-v1.2',
    courierId: 'delhivery',
    serviceId: 'express-surface',
    mode: 'B2C',
    fileName: 'Delhivery_B2C_Matrix_Aug2026.csv',
    importedBy: 'Super Admin',
    importedAt: '2026-08-20 14:30 PM',
    recordCount: 19450,
    updatedCount: 120,
    newCount: 45,
    errorCount: 0,
    status: 'PUBLISHED',
  },
  {
    id: 'imp-v1.1',
    courierId: 'bluedart',
    serviceId: 'express-air',
    mode: 'B2C',
    fileName: 'BlueDart_Air_Pincodes_v2.xlsx',
    importedBy: 'Super Admin',
    importedAt: '2026-08-15 10:15 AM',
    recordCount: 14200,
    updatedCount: 80,
    newCount: 12,
    errorCount: 0,
    status: 'PUBLISHED',
  },
];

export const INITIAL_PINCODE_DATA: ServiceablePincodeItem[] = [
  {
    id: 'pin-110001',
    courierId: 'delhivery',
    serviceId: 'express-surface',
    mode: 'B2C',
    pincode: '110001',
    city: 'New Delhi',
    state: 'Delhi',
    isServiceable: true,
    isCOD: true,
    isPrepaid: true,
    isODA: false,
    zoneCode: 'N1',
    importVersionId: 'imp-v1.2',
  },
  {
    id: 'pin-560038',
    courierId: 'delhivery',
    serviceId: 'express-surface',
    mode: 'B2C',
    pincode: '560038',
    city: 'Bengaluru',
    state: 'Karnataka',
    isServiceable: true,
    isCOD: true,
    isPrepaid: true,
    isODA: false,
    zoneCode: 'S1',
    importVersionId: 'imp-v1.2',
  },
  {
    id: 'pin-799001',
    courierId: 'delhivery',
    serviceId: 'express-surface',
    mode: 'B2C',
    pincode: '799001',
    city: 'Agartala',
    state: 'Tripura',
    isServiceable: true,
    isCOD: false,
    isPrepaid: true,
    isODA: true,
    zoneCode: 'NE1',
    importVersionId: 'imp-v1.2',
  },
];

let IMPORT_STORE = [...INITIAL_IMPORT_VERSIONS];
let PINCODE_STORE = [...INITIAL_PINCODE_DATA];

export const CourierServiceabilityService = {
  getImportVersions: (): ServiceabilityImportRecord[] => {
    return [...IMPORT_STORE];
  },

  getPincodes: (courierId = 'all', mode = 'all', searchQuery = ''): ServiceablePincodeItem[] => {
    return PINCODE_STORE.filter((item) => {
      if (courierId !== 'all' && item.courierId !== courierId) return false;
      if (mode !== 'all' && item.mode !== mode) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = item.pincode.includes(q) || item.city.toLowerCase().includes(q) || item.zoneCode.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  },

  validateAndImportFile: (
    courierId: string,
    serviceId: string,
    mode: 'B2C' | 'B2B',
    fileName: string,
    rawRows: Record<string, string>[]
  ): { success: boolean; importRecord: ServiceabilityImportRecord; errors: { row: number; pincode: string; error: string }[] } => {
    const errors: { row: number; pincode: string; error: string }[] = [];
    const seenPincodes = new Set<string>();

    let validCount = 0;
    let newCount = 0;
    let updatedCount = 0;

    rawRows.forEach((row, idx) => {
      const pin = (row.pincode || row.PINCODE || row.pin || '').trim();
      const rowNum = idx + 1;

      if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
        errors.push({ row: rowNum, pincode: pin || 'EMPTY', error: 'Invalid 6-digit pincode format' });
        return;
      }

      if (seenPincodes.has(pin)) {
        errors.push({ row: rowNum, pincode: pin, error: 'Duplicate pincode/service mapping in file' });
        return;
      }

      seenPincodes.add(pin);

      const existingIndex = PINCODE_STORE.findIndex((p) => p.courierId === courierId && p.serviceId === serviceId && p.pincode === pin);
      if (existingIndex >= 0) updatedCount++;
      else newCount++;

      validCount++;
    });

    const importId = `imp-${Date.now()}`;
    const importRecord: ServiceabilityImportRecord = {
      id: importId,
      courierId,
      serviceId,
      mode,
      fileName,
      importedBy: 'Super Admin',
      importedAt: new Date().toLocaleString(),
      recordCount: rawRows.length,
      updatedCount,
      newCount,
      errorCount: errors.length,
      status: errors.length > 0 ? 'VALIDATED' : 'PUBLISHED',
    };

    IMPORT_STORE.unshift(importRecord);
    return { success: true, importRecord, errors };
  },

  publishImportDataset: (importId: string): { success: boolean; message: string } => {
    const rec = IMPORT_STORE.find((i) => i.id === importId);
    if (!rec) return { success: false, message: 'Import record not found.' };

    rec.status = 'PUBLISHED';
    return { success: true, message: `Dataset ${importId} published successfully. Booking engine updated.` };
  },

  rollbackImportDataset: (importId: string): { success: boolean; message: string } => {
    const rec = IMPORT_STORE.find((i) => i.id === importId);
    if (!rec) return { success: false, message: 'Import record not found.' };

    rec.status = 'ROLLED_BACK';
    return { success: true, message: `Dataset ${importId} rolled back successfully to previous published state.` };
  },
};
