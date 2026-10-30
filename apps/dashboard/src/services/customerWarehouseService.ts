import { SupabaseWarehouseService } from './supabase/supabaseWarehouseService';

export interface PickupWarehouseSnapshot extends Record<string, unknown> {
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  pincode: string;
  city: string;
  state: string;
  pickupStartTime?: string;
  pickupEndTime?: string;
  frozenAt: string;
}

export interface CustomerWarehouse extends Record<string, unknown> {
  id: string;
  tenantId: string;
  warehouseCode: string; // e.g. MUM-WH-01 (unique, immutable code)
  warehouseName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  pickupStartTime: string; // e.g. "10:00 AM"
  pickupEndTime: string;   // e.g. "06:00 PM"
  isDefault: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  totalShipmentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerWarehouseInput extends Record<string, unknown> {
  tenantId: string;
  warehouseName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  pincode: string;
  city: string;
  state: string;
  country?: string;
  pickupStartTime?: string;
  pickupEndTime?: string;
  isDefault?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
}

// Initial Demo Multi-Warehouse Locations (Delhi, Mumbai, Bangalore)
export const INITIAL_CUSTOMER_WAREHOUSES: CustomerWarehouse[] = [
  {
    id: 'wh-01',
    tenantId: 'tenant-demo-01',
    warehouseCode: 'DEL-WH-01',
    warehouseName: 'Delhi Connaught Primary Warehouse',
    contactPerson: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'delhi.wh@acmestore.com',
    addressLine1: 'Plot 42, Block B, Connaught Place',
    addressLine2: 'Near Central Park Ring Road',
    pincode: '110001',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    pickupStartTime: '10:00 AM',
    pickupEndTime: '06:00 PM',
    isDefault: true, // Delhi is Default
    status: 'ACTIVE',
    totalShipmentsCount: 420,
    createdAt: '2026-08-01 10:00 AM',
    updatedAt: '2026-08-01 10:00 AM',
  },
  {
    id: 'wh-02',
    tenantId: 'tenant-demo-01',
    warehouseCode: 'MUM-WH-01',
    warehouseName: 'Mumbai Lower Parel Fulfillment Center',
    contactPerson: 'Rahul Sharma',
    phone: '+91 98112 99887',
    email: 'mumbai.wh@acmestore.com',
    addressLine1: 'Unit 102, Gala Industrial Estate, Lower Parel',
    addressLine2: 'Opposite Railway Station West',
    pincode: '400001',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    pickupStartTime: '09:30 AM',
    pickupEndTime: '07:00 PM',
    isDefault: false,
    status: 'ACTIVE',
    totalShipmentsCount: 310,
    createdAt: '2026-08-10 14:30 PM',
    updatedAt: '2026-08-10 14:30 PM',
  },
  {
    id: 'wh-03',
    tenantId: 'tenant-demo-01',
    warehouseCode: 'BLR-WH-01',
    warehouseName: 'Bangalore Electronic City Warehouse',
    contactPerson: 'Venkatesh Rao',
    phone: '+91 99001 12233',
    email: 'blr.wh@acmestore.com',
    addressLine1: 'Plot 88, Phase 2, Electronic City Tech Zone',
    pincode: '560001',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    pickupStartTime: '10:00 AM',
    pickupEndTime: '05:30 PM',
    isDefault: false,
    status: 'ACTIVE',
    totalShipmentsCount: 150,
    createdAt: '2026-08-15 11:00 AM',
    updatedAt: '2026-08-15 11:00 AM',
  },
];

const WAREHOUSE_KEY = 'COURRIER3_WAREHOUSE_STORE';

function loadWarehousesFromStorage(): CustomerWarehouse[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(WAREHOUSE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {}
  return [...INITIAL_CUSTOMER_WAREHOUSES];
}

function saveWarehousesToStorage(store: CustomerWarehouse[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(WAREHOUSE_KEY, JSON.stringify(store));
    }
  } catch {}
}

let WAREHOUSE_STORE = loadWarehousesFromStorage();

// Pincode Lookup Auto-population Service
export function lookupPincodeDetails(pincode: string): { city: string; state: string; zone: string } {
  const clean = pincode.trim();

  if (clean.startsWith('11') || clean === '110001' || clean === '110020') {
    return { city: 'New Delhi', state: 'Delhi', zone: 'N1' };
  }
  if (clean.startsWith('40') || clean === '400001' || clean === '400013') {
    return { city: 'Mumbai', state: 'Maharashtra', zone: 'W1' };
  }
  if (clean.startsWith('56') || clean === '560001' || clean === '560100') {
    return { city: 'Bangalore', state: 'Karnataka', zone: 'S1' };
  }
  if (clean.startsWith('70') || clean === '700001') {
    return { city: 'Kolkata', state: 'West Bengal', zone: 'E1' };
  }
  if (clean.startsWith('60') || clean === '600001') {
    return { city: 'Chennai', state: 'Tamil Nadu', zone: 'S2' };
  }
  if (clean.startsWith('30') || clean === '302020') {
    return { city: 'Jaipur', state: 'Rajasthan', zone: 'N2' };
  }

  return { city: 'Metropolitan City', state: 'State Region', zone: 'N1' };
}

export const CustomerWarehouseService = {
  getWarehouses: (tenantId: string, statusFilter = 'all'): CustomerWarehouse[] => {
    if (!tenantId) return [];
    return WAREHOUSE_STORE.filter((w) => {
      if (w.tenantId !== tenantId) return false;
      if (statusFilter !== 'all' && w.status !== statusFilter) return false;
      return true;
    });
  },

  getActiveWarehouses: (tenantId: string): CustomerWarehouse[] => {
    if (!tenantId) return [];
    return WAREHOUSE_STORE.filter((w) => w.tenantId === tenantId && w.status === 'ACTIVE');
  },

  getDefaultWarehouse: (tenantId: string): CustomerWarehouse | null => {
    if (!tenantId) return null;
    const active = CustomerWarehouseService.getActiveWarehouses(tenantId);
    return active.find((w) => w.isDefault) || active[0] || null;
  },

  getWarehouseById: (id: string, tenantId: string): CustomerWarehouse | null => {
    if (!tenantId) return null;
    return WAREHOUSE_STORE.find((w) => (w.id === id || w.warehouseCode === id) && (tenantId === 'all' || w.tenantId === tenantId)) || null;
  },

  checkDuplicateWarehouse: (tenantId: string, pincode: string, addressLine1: string): boolean => {
    if (!tenantId) return false;
    return WAREHOUSE_STORE.some(
      (w) =>
        w.tenantId === tenantId &&
        w.status === 'ACTIVE' &&
        w.pincode === pincode.trim() &&
        w.addressLine1.toLowerCase().trim() === addressLine1.toLowerCase().trim()
    );
  },

  addWarehouse: (input: CustomerWarehouseInput): { success: boolean; message: string; warehouse: CustomerWarehouse } => {
    const existingForTenant = WAREHOUSE_STORE.filter((w) => w.tenantId === input.tenantId);

    // Auto-generate Warehouse Code (e.g., DEL-WH-01 or MUM-WH-02)
    const prefix = input.city ? input.city.slice(0, 3).toUpperCase() : 'WH';
    const code = `${prefix}-WH-${(existingForTenant.length + 1).toString().padStart(2, '0')}`;

    // Transactional Default Rule: If new is set as default, reset old defaults
    const isFirstWarehouse = existingForTenant.length === 0;
    const shouldBeDefault = input.isDefault ?? isFirstWarehouse;

    if (shouldBeDefault) {
      WAREHOUSE_STORE.forEach((w) => {
        if (w.tenantId === input.tenantId) w.isDefault = false;
      });
    }

    const newWh: CustomerWarehouse = {
      id: `wh-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      tenantId: input.tenantId,
      warehouseCode: code,
      warehouseName: input.warehouseName,
      contactPerson: input.contactPerson,
      phone: input.phone,
      email: input.email,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      landmark: input.landmark,
      pincode: (input.pincode || '').replace(/\D/g, '').trim(),
      city: input.city,
      state: input.state,
      country: input.country || 'India',
      pickupStartTime: input.pickupStartTime || '10:00 AM',
      pickupEndTime: input.pickupEndTime || '06:00 PM',
      isDefault: shouldBeDefault,
      status: 'ACTIVE',
      totalShipmentsCount: 0,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
    };

    WAREHOUSE_STORE.unshift(newWh);
    saveWarehousesToStorage(WAREHOUSE_STORE);

    // Asynchronously synchronize with Supabase Cloud DB
    SupabaseWarehouseService.saveWarehouse(input).then((res) => {
      if (res.success && res.warehouse) {
        newWh.id = res.warehouse.id;
        saveWarehousesToStorage(WAREHOUSE_STORE);
      }
    }).catch(() => {});

    return {
      success: true,
      message: `Warehouse ${newWh.warehouseCode} (${newWh.warehouseName}) created successfully!`,
      warehouse: newWh,
    };
  },

  addWarehouseAsync: async (input: CustomerWarehouseInput): Promise<{ success: boolean; message: string; warehouse?: CustomerWarehouse }> => {
    if (!input.tenantId) {
      return { success: false, message: 'Invalid tenant identifier.' };
    }

    const cloudRes = await SupabaseWarehouseService.saveWarehouse(input);
    if (cloudRes.success && cloudRes.warehouse) {
      if (cloudRes.warehouse.isDefault) {
        WAREHOUSE_STORE.forEach((w) => {
          if (w.tenantId === input.tenantId) w.isDefault = false;
        });
      }
      WAREHOUSE_STORE.unshift(cloudRes.warehouse);
      saveWarehousesToStorage(WAREHOUSE_STORE);
      return { success: true, message: cloudRes.message, warehouse: cloudRes.warehouse };
    }

    // Fallback to local store if cloud error
    return CustomerWarehouseService.addWarehouse(input);
  },

  updateWarehouse: (
    id: string,
    updates: Partial<CustomerWarehouseInput>,
    tenantId: string
  ): { success: boolean; message: string; warehouse?: CustomerWarehouse } => {
    const wh = CustomerWarehouseService.getWarehouseById(id, tenantId);
    if (!wh) return { success: false, message: 'Warehouse record not found.' };

    if (updates.isDefault) {
      WAREHOUSE_STORE.forEach((w) => {
        if (w.tenantId === tenantId) w.isDefault = false;
      });
    }

    Object.assign(wh, updates);
    wh.updatedAt = new Date().toLocaleString();
    saveWarehousesToStorage(WAREHOUSE_STORE);

    // Asynchronously synchronize update with Supabase Cloud DB
    SupabaseWarehouseService.updateWarehouse(id, updates, tenantId).catch(() => {});

    return {
      success: true,
      message: `Warehouse ${wh.warehouseCode} updated successfully.`,
      warehouse: wh,
    };
  },

  updateWarehouseAsync: async (
    id: string,
    updates: Partial<CustomerWarehouseInput>,
    tenantId: string
  ): Promise<{ success: boolean; message: string; warehouse?: CustomerWarehouse }> => {
    if (!tenantId) return { success: false, message: 'Invalid tenant identifier.' };

    await SupabaseWarehouseService.updateWarehouse(id, updates, tenantId);
    return CustomerWarehouseService.updateWarehouse(id, updates, tenantId);
  },

  setDefaultWarehouse: (id: string, tenantId: string): { success: boolean; message: string } => {
    const target = CustomerWarehouseService.getWarehouseById(id, tenantId);
    if (!target) return { success: false, message: 'Warehouse not found.' };

    WAREHOUSE_STORE.forEach((w) => {
      if (w.tenantId === tenantId) {
        w.isDefault = w.id === id;
      }
    });
    saveWarehousesToStorage(WAREHOUSE_STORE);
    SupabaseWarehouseService.updateWarehouse(id, { isDefault: true }, tenantId).catch(() => {});

    return {
      success: true,
      message: `${target.warehouseName} (${target.warehouseCode}) set as primary default pickup facility.`,
    };
  },

  setDefaultWarehouseAsync: async (id: string, tenantId: string): Promise<{ success: boolean; message: string }> => {
    if (!tenantId) return { success: false, message: 'Invalid tenant identifier.' };
    await SupabaseWarehouseService.updateWarehouse(id, { isDefault: true }, tenantId);
    return CustomerWarehouseService.setDefaultWarehouse(id, tenantId);
  },

  deactivateWarehouse: (id: string, tenantId: string): { success: boolean; message: string } => {
    const wh = CustomerWarehouseService.getWarehouseById(id, tenantId);
    if (!wh) return { success: false, message: 'Warehouse record not found.' };

    wh.status = 'INACTIVE';
    wh.isDefault = false;

    // Auto-reassign next active as default if needed
    const remainingActive = CustomerWarehouseService.getActiveWarehouses(tenantId);
    if (remainingActive.length > 0 && !remainingActive.some((w) => w.isDefault)) {
      remainingActive[0].isDefault = true;
    }

    saveWarehousesToStorage(WAREHOUSE_STORE);
    SupabaseWarehouseService.deactivateWarehouse(id, tenantId).catch(() => {});

    return {
      success: true,
      message: `Warehouse ${wh.warehouseCode} deactivated. It can no longer be selected for new bookings, but historical shipments remain intact.`,
    };
  },

  deactivateWarehouseAsync: async (id: string, tenantId: string): Promise<{ success: boolean; message: string }> => {
    if (!tenantId) return { success: false, message: 'Invalid tenant identifier.' };
    await SupabaseWarehouseService.deactivateWarehouse(id, tenantId);
    return CustomerWarehouseService.deactivateWarehouse(id, tenantId);
  },

  // Sync latest warehouse records from Supabase PostgreSQL Cloud DB
  syncFromSupabase: async (tenantId: string): Promise<CustomerWarehouse[]> => {
    if (!tenantId) return [];
    try {
      const cloudWarehouses = await SupabaseWarehouseService.fetchWarehouses(tenantId);
      if (Array.isArray(cloudWarehouses)) {
        const existingOtherTenants = WAREHOUSE_STORE.filter((w) => w.tenantId !== tenantId);
        WAREHOUSE_STORE = [...cloudWarehouses, ...existingOtherTenants];
        saveWarehousesToStorage(WAREHOUSE_STORE);
        return cloudWarehouses;
      }
    } catch (err: any) {
      console.warn('[CustomerWarehouseService] Supabase sync warning:', err?.message);
    }
    return CustomerWarehouseService.getWarehouses(tenantId);
  },

  // Freeze Pickup Warehouse Snapshot for Shipment Booking
  createWarehouseSnapshot: (warehouseId: string, tenantId: string): PickupWarehouseSnapshot | null => {
    const wh = CustomerWarehouseService.getWarehouseById(warehouseId, tenantId) || CustomerWarehouseService.getDefaultWarehouse(tenantId);
    if (!wh) return null;
    return {
      warehouseId: wh.id,
      warehouseCode: wh.warehouseCode,
      warehouseName: wh.warehouseName,
      contactPerson: wh.contactPerson,
      phone: wh.phone,
      email: wh.email,
      addressLine1: wh.addressLine1,
      addressLine2: wh.addressLine2,
      landmark: wh.landmark,
      pincode: wh.pincode,
      city: wh.city,
      state: wh.state,
      pickupStartTime: wh.pickupStartTime,
      pickupEndTime: wh.pickupEndTime,
      frozenAt: new Date().toLocaleString(),
    };
  },
};
