import { supabase } from '../../lib/supabaseClient';
import { toValidTenantUUID, generateUUID, isValidUUID } from '../../utils/uuidHelper';
import type { CustomerWarehouse, CustomerWarehouseInput } from '../customerWarehouseService';

export const SupabaseWarehouseService = {
  /**
   * Fetch all warehouses for a tenant from Supabase PostgreSQL.
   */
  async fetchWarehouses(tenantId?: string): Promise<CustomerWarehouse[]> {
    try {
      const validTid = toValidTenantUUID(tenantId);
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('merchant_id', validTid)
        .order('is_default', { ascending: false });

      if (error) {
        console.warn('[SupabaseWarehouseService] Fetch warehouses warning:', error.message);
        return [];
      }

      if (!data || !Array.isArray(data)) return [];

      return data.map((row: any) => ({
        id: row.id,
        tenantId: row.merchant_id,
        warehouseCode: row.warehouse_code || `WH-${row.id.slice(0, 4).toUpperCase()}`,
        warehouseName: row.name || 'Dispatch Warehouse',
        contactPerson: row.contact_person || 'Dispatch Manager',
        phone: row.phone || '',
        email: row.email,
        addressLine1: row.address_line1 || '',
        addressLine2: row.address_line2,
        landmark: row.landmark,
        pincode: row.pincode || '',
        city: row.city || '',
        state: row.state || '',
        country: row.country || 'India',
        pickupStartTime: row.pickup_start_time || '10:00 AM',
        pickupEndTime: row.pickup_end_time || '06:00 PM',
        isDefault: !!row.is_default,
        status: (row.status as any) || 'ACTIVE',
        totalShipmentsCount: 0,
        createdAt: row.created_at ? new Date(row.created_at).toLocaleString() : new Date().toLocaleString(),
        updatedAt: row.updated_at ? new Date(row.updated_at).toLocaleString() : new Date().toLocaleString(),
      }));
    } catch (err: any) {
      console.warn('[SupabaseWarehouseService] Fetch exception:', err.message);
      return [];
    }
  },

  /**
   * Save a new warehouse into Supabase PostgreSQL.
   */
  async saveWarehouse(input: CustomerWarehouseInput): Promise<{ success: boolean; message: string; warehouse?: CustomerWarehouse }> {
    try {
      const validTid = toValidTenantUUID(input.tenantId);
      const newId = generateUUID();

      // If set as default, reset other warehouses
      if (input.isDefault) {
        await supabase
          .from('warehouses')
          .update({ is_default: false })
          .eq('merchant_id', validTid);
      }

      const prefix = input.city ? input.city.slice(0, 3).toUpperCase() : 'WH';
      const generatedCode = `${prefix}-WH-${Math.floor(10 + Math.random() * 90)}`;

      const insertPayload: Record<string, any> = {
        id: newId,
        merchant_id: validTid,
        name: input.warehouseName,
        warehouse_code: generatedCode,
        address_line1: input.addressLine1,
        address_line2: input.addressLine2 || null,
        city: input.city,
        state: input.state,
        pincode: (input.pincode || '').replace(/\D/g, '').trim(),
        contact_person: input.contactPerson,
        phone: input.phone,
        pickup_start_time: input.pickupStartTime || '10:00 AM',
        pickup_end_time: input.pickupEndTime || '06:00 PM',
        is_default: !!input.isDefault,
        is_active: true,
      };

      const { data, error } = await supabase
        .from('warehouses')
        .insert([insertPayload])
        .select()
        .single();

      if (error) {
        console.warn('[SupabaseWarehouseService] Insert warning:', error.message);
        return { success: false, message: error.message };
      }

      const created: CustomerWarehouse = {
        id: data.id,
        tenantId: data.merchant_id,
        warehouseCode: data.warehouse_code || generatedCode,
        warehouseName: data.name,
        contactPerson: data.contact_person,
        phone: data.phone,
        email: input.email,
        addressLine1: data.address_line1,
        addressLine2: data.address_line2,
        landmark: input.landmark,
        pincode: data.pincode,
        city: data.city,
        state: data.state,
        country: 'India',
        pickupStartTime: data.pickup_start_time || '10:00 AM',
        pickupEndTime: data.pickup_end_time || '06:00 PM',
        isDefault: !!data.is_default,
        status: 'ACTIVE',
        totalShipmentsCount: 0,
        createdAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString(),
      };

      return { success: true, message: 'Warehouse created successfully in Supabase cloud DB.', warehouse: created };
    } catch (err: any) {
      return { success: false, message: err.message || 'Database error creating warehouse.' };
    }
  },

  /**
   * Update an existing warehouse in Supabase.
   */
  async updateWarehouse(id: string, updates: Partial<CustomerWarehouseInput>, tenantId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const validTid = toValidTenantUUID(tenantId);
      if (!isValidUUID(id)) {
        return { success: false, message: 'Invalid warehouse UUID for database update.' };
      }

      if (updates.isDefault) {
        await supabase
          .from('warehouses')
          .update({ is_default: false })
          .eq('merchant_id', validTid);
      }

      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.warehouseName) updatePayload.name = updates.warehouseName;
      if (updates.contactPerson) updatePayload.contact_person = updates.contactPerson;
      if (updates.phone) updatePayload.phone = updates.phone;
      if (updates.addressLine1) updatePayload.address_line1 = updates.addressLine1;
      if (updates.addressLine2 !== undefined) updatePayload.address_line2 = updates.addressLine2;
      if (updates.city) updatePayload.city = updates.city;
      if (updates.state) updatePayload.state = updates.state;
      if (updates.pincode) updatePayload.pincode = (updates.pincode || '').replace(/\D/g, '').trim();
      if (updates.pickupStartTime) updatePayload.pickup_start_time = updates.pickupStartTime;
      if (updates.pickupEndTime) updatePayload.pickup_end_time = updates.pickupEndTime;
      if (updates.isDefault !== undefined) updatePayload.is_default = updates.isDefault;
      if (updates.status) updatePayload.status = updates.status;

      const { error } = await supabase
        .from('warehouses')
        .update(updatePayload)
        .eq('id', id)
        .eq('merchant_id', validTid);

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Warehouse updated in Supabase cloud DB.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Database error updating warehouse.' };
    }
  },

  /**
   * Deactivate a warehouse in Supabase (soft-delete preserving historical shipment references).
   */
  async deactivateWarehouse(id: string, tenantId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const validTid = toValidTenantUUID(tenantId);
      if (!isValidUUID(id)) {
        return { success: false, message: 'Invalid warehouse UUID for database deactivation.' };
      }

      const { error } = await supabase
        .from('warehouses')
        .update({
          status: 'INACTIVE',
          is_default: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('merchant_id', validTid);

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Warehouse facility deactivated in Supabase cloud DB.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Database error deactivating warehouse.' };
    }
  },
};
