import { supabase } from '../../lib/supabaseClient';
import { toValidTenantUUID, generateUUID, isValidUUID } from '../../utils/uuidHelper';
import type { CustomerShipmentDetail, InternalShipmentStatus } from '../customerShipmentService';

export const SupabaseShipmentService = {
  /**
   * Fetch all shipments for a merchant from Supabase PostgreSQL.
   */
  async fetchShipments(tenantId?: string): Promise<CustomerShipmentDetail[]> {
    try {
      const validTid = toValidTenantUUID(tenantId);
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('merchant_id', validTid)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[SupabaseShipmentService] Fetch shipments warning:', error.message);
        return [];
      }

      if (!data || !Array.isArray(data)) return [];

      return data.map((row: any): CustomerShipmentDetail => {
        const bookingDateStr = (row.booked_at || row.created_at)
          ? new Date(row.booked_at || row.created_at).toLocaleString()
          : new Date().toLocaleString();
        return {
          id: row.id,
          shipmentId: row.shipment_number,
          tenantId: row.merchant_id,
          orderId: row.order_id,
          awbNumber: row.awb_number,
          bookingDate: bookingDateStr,
          courierId: row.courier_id,
          courierName: row.courier_name,
          serviceName: row.service_type || 'Standard',
          mode: row.mode || 'B2C',
          pickupWarehouseId: row.pickup_warehouse_id || undefined,
          pickupContact: row.pickup_contact_person,
          pickupPhone: row.pickup_phone,
          pickupAddress: row.pickup_address_line1,
          pickupCity: row.pickup_city,
          pickupPincode: row.pickup_pincode,
          deliveryContact: row.delivery_contact_name,
          deliveryPhone: row.delivery_phone,
          deliveryEmail: row.delivery_email,
          deliveryAddress: row.delivery_address_line1,
          deliveryCity: row.delivery_city,
          deliveryPincode: row.delivery_pincode,
          actualWeightKg: Number(row.actual_weight_kg || 0.5),
          chargeableWeightKg: Number(row.chargeable_weight_kg || 0.5),
          dimensionsCm: row.package_contents_summary || '20 × 15 × 10 CM',
          invoiceValueINR: Number(row.invoice_value_minor ? Number(row.invoice_value_minor) / 100 : 0),
          invoiceNumber: row.invoice_number,
          paymentMode: row.payment_mode || 'PREPAID',
          codAmountINR: Number(row.cod_amount_minor ? Number(row.cod_amount_minor) / 100 : 0),
          baseFreightINR: Number(row.freight_charge_minor ? Number(row.freight_charge_minor) / 100 : 0),
          fuelSurchargeINR: Number(row.fuel_surcharge_minor ? Number(row.fuel_surcharge_minor) / 100 : 0),
          codFeeINR: Number(row.cod_fee_minor ? Number(row.cod_fee_minor) / 100 : 0),
          totalCustomerChargeINR: Number(row.total_charge_minor ? Number(row.total_charge_minor) / 100 : 0),
          bookingStatus: (row.status as InternalShipmentStatus) || 'BOOKING_CONFIRMED',
          customerFacingStatus: row.carrier_status_raw || 'Booking Confirmed',
          trackingStatus: row.status || 'Booked',
          labelUrl: row.label_download_url,
          statusHistory: [
            {
              id: `hist-${row.id.slice(0, 8)}`,
              shipmentId: row.shipment_number,
              oldStatus: 'DRAFT',
              newStatus: (row.status as InternalShipmentStatus) || 'BOOKING_CONFIRMED',
              source: 'SYSTEM',
              timestamp: bookingDateStr,
              userOrAdmin: 'Merchant User',
              reason: 'Shipment recorded in Supabase cloud DB',
            },
          ],
          trackingTimeline: [
            {
              statusKey: row.status || 'BOOKED',
              statusTitle: row.carrier_status_raw || 'Shipment Booked',
              location: `${row.pickup_city || 'Origin'} Hub`,
              timestamp: bookingDateStr,
              description: 'Shipment created and synchronized with cloud DB.',
              completed: true,
            },
          ],
        };
      });
    } catch (err: any) {
      console.warn('[SupabaseShipmentService] Fetch exception:', err.message);
      return [];
    }
  },

  /**
   * Insert a new shipment and initial audit status log into Supabase.
   */
  async insertShipment(shipment: CustomerShipmentDetail): Promise<{ success: boolean; message: string; recordId?: string }> {
    try {
      const validTid = toValidTenantUUID(shipment.tenantId);
      const rowId = isValidUUID(shipment.id) ? shipment.id : generateUUID();

      const insertPayload: Record<string, any> = {
        id: rowId,
        merchant_id: validTid,
        shipment_number: shipment.shipmentId,
        booking_reference_id: shipment.shipmentId,
        order_id: shipment.orderId,
        awb_number: shipment.awbNumber || null,
        courier_id: shipment.courierId,
        courier_name: shipment.courierName,
        service_type: shipment.serviceName || 'Surface',
        mode: shipment.mode || 'B2C',
        pickup_warehouse_id: isValidUUID(shipment.pickupWarehouseId) ? shipment.pickupWarehouseId : null,
        pickup_contact_person: shipment.pickupContact || 'Sender',
        pickup_phone: shipment.pickupPhone || '9999999999',
        pickup_address_line1: shipment.pickupAddress || 'Address line 1',
        pickup_city: shipment.pickupCity || 'City',
        pickup_state: (shipment as any).pickupState || 'State',
        pickup_pincode: (shipment.pickupPincode || '').replace(/\D/g, '').trim(),
        delivery_contact_name: shipment.deliveryContact || 'Recipient',
        delivery_phone: shipment.deliveryPhone || '9999999999',
        delivery_email: (shipment as any).deliveryEmail || null,
        delivery_address_line1: shipment.deliveryAddress || 'Address line 1',
        delivery_city: shipment.deliveryCity || 'City',
        delivery_state: (shipment as any).deliveryState || 'State',
        delivery_pincode: (shipment.deliveryPincode || '').replace(/\D/g, '').trim(),
        total_packages_count: 1,
        actual_weight_kg: Number(shipment.actualWeightKg) || 0.5,
        chargeable_weight_kg: Number(shipment.chargeableWeightKg) || 0.5,
        package_contents_summary: shipment.dimensionsCm || 'Package',
        invoice_value_minor: Math.round(Number(shipment.invoiceValueINR || 0) * 100),
        invoice_number: shipment.invoiceNumber || null,
        payment_mode: shipment.paymentMode || 'PREPAID',
        cod_amount_minor: Math.round(Number(shipment.codAmountINR || 0) * 100),
        freight_charge_minor: Math.round(Number(shipment.baseFreightINR || 0) * 100),
        fuel_surcharge_minor: Math.round(Number(shipment.fuelSurchargeINR || 0) * 100),
        cod_fee_minor: Math.round(Number(shipment.codFeeINR || 0) * 100),
        insurance_fee_minor: 0,
        gst_amount_minor: 0,
        total_charge_minor: Math.round(Number(shipment.totalCustomerChargeINR || 0) * 100),
        status: 'BOOKED',
        carrier_status_raw: 'Booking Confirmed',
        label_generated: !!shipment.labelUrl,
        label_download_url: shipment.labelUrl || null,
      };

      const { data, error } = await supabase
        .from('shipments')
        .insert([insertPayload])
        .select()
        .single();

      if (error) {
        console.warn('[SupabaseShipmentService] Insert warning:', error.message);
        return { success: false, message: error.message };
      }

      // Append initial tracking event entry
      try {
        await supabase.from('shipment_tracking_events').insert([
          {
            shipment_id: data.id,
            carrier_raw_status: 'BOOKED',
            standard_status: 'BOOKED',
            location_city: shipment.pickupCity || null,
            event_description: 'Shipment created via portal wizard',
            source: 'PORTAL',
            event_timestamp: new Date().toISOString(),
          },
        ]);
      } catch {
        // history insert is non-blocking
      }

      return { success: true, message: 'Shipment saved to Supabase cloud DB.', recordId: data.id };
    } catch (err: any) {
      return { success: false, message: err.message || 'Database error inserting shipment.' };
    }
  },

  /**
   * Update shipment status and tracking events in Supabase.
   */
  async updateShipmentStatus(
    shipmentNumber: string,
    newStatus: InternalShipmentStatus,
    customerFacingStatus: string,
    reason: string,
    source = 'ADMIN',
    tenantId?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const validTid = toValidTenantUUID(tenantId);
      const platformStatus = (newStatus === 'BOOKING_CONFIRMED' ? 'BOOKED' : newStatus) as any;
      const { data, error } = await supabase
        .from('shipments')
        .update({
          status: platformStatus,
          carrier_status_raw: customerFacingStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('shipment_number', shipmentNumber)
        .eq('merchant_id', validTid)
        .select()
        .maybeSingle();

      if (error) {
        return { success: false, message: error.message };
      }

      if (data) {
        try {
          await supabase.from('shipment_tracking_events').insert([
            {
              shipment_id: data.id,
              carrier_raw_status: customerFacingStatus,
              standard_status: platformStatus,
              location_city: data.pickup_city || null,
              event_description: reason || 'Status updated in portal',
              source,
              event_timestamp: new Date().toISOString(),
            },
          ]);
        } catch {
          // history insert is non-blocking
        }
      }

      return { success: true, message: 'Status updated in Supabase cloud DB.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Database error updating status.' };
    }
  },
};
