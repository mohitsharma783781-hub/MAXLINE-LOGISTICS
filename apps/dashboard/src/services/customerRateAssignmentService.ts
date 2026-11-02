import type {
  CustomerRateAssignment,
  CustomerRateAssignmentInput,
  EligibleCourierResult,
} from '../types/customerRateAssignment';
export type { EligibleCourierResult };
import { B2BPricingEngine } from './b2bPricingEngine';
import { B2CPricingEngine } from './b2cPricingEngine';
import { supabase } from '../lib/supabaseClient';
import { toValidTenantUUID } from '../utils/uuidHelper';

export const INITIAL_RATE_ASSIGNMENTS: CustomerRateAssignment[] = [
  {
    id: 'assign-b2c-01',
    tenantId: 'tenant-demo-01',
    tenantName: 'MAXLINE Partner Merchant',
    mode: 'B2C',
    courierId: 'delhivery',
    courierName: 'Delhivery Surface',
    serviceId: 'express-surface',
    serviceName: 'Express Surface Cargo',
    rateCardId: 'b2c-src-standard',
    rateCardName: 'Standard Customer B2C Selling Card',
    rateCardVersion: 'v1.2',
    isDefault: true,
    status: 'ACTIVE',
    effectiveFrom: '2026-08-01',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'assign-b2c-02',
    tenantId: 'tenant-demo-01',
    tenantName: 'MAXLINE Partner Merchant',
    mode: 'B2C',
    courierId: 'bluedart',
    courierName: 'Blue Dart Air',
    serviceId: 'express-air',
    serviceName: 'Express Priority Air',
    rateCardId: 'b2c-src-enterprise',
    rateCardName: 'Enterprise VIP B2C Rate Card',
    rateCardVersion: 'v2.0',
    isDefault: false,
    status: 'ACTIVE',
    effectiveFrom: '2026-08-10',
    createdAt: '2026-08-10',
    updatedAt: '2026-08-10',
  },
  {
    id: 'assign-b2b-01',
    tenantId: 'tenant-demo-01',
    tenantName: 'MAXLINE Partner Merchant',
    mode: 'B2B',
    courierId: 'delhivery',
    courierName: 'Delhivery Surface',
    serviceId: 'express-surface',
    serviceName: 'Express Surface Cargo',
    rateCardId: 'b2b-src-merchant-tier1',
    rateCardName: 'Tier 1 Standard Merchant B2B Card',
    rateCardVersion: 'v1.0',
    isDefault: true,
    status: 'ACTIVE',
    effectiveFrom: '2026-08-01',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
];

const STORAGE_KEY = 'MAXLINE_RATE_ASSIGNMENTS_STORE';

function loadAssignmentsFromStorage(): CustomerRateAssignment[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch {}
  return [...INITIAL_RATE_ASSIGNMENTS];
}

function saveAssignmentsToStorage(list: CustomerRateAssignment[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  } catch {}
}

let ASSIGNMENT_STORE = loadAssignmentsFromStorage();

export const CustomerRateAssignmentService = {
  syncFromSupabase: async (tenantId?: string): Promise<CustomerRateAssignment[]> => {
    try {
      let query = supabase
        .from('merchant_rate_assignments')
        .select('*, carrier_rate_cards(*)');

      if (tenantId && tenantId.toLowerCase() !== 'all') {
        const validTid = toValidTenantUUID(tenantId);
        query = query.eq('merchant_id', validTid);
      }

      const { data, error } = await query;
      if (!error && data && Array.isArray(data) && data.length > 0) {
        const cloudAssignments: CustomerRateAssignment[] = data.map((row: any) => {
          const card = row.carrier_rate_cards || {};
          return {
            id: row.id,
            tenantId: row.merchant_id,
            tenantName: 'MAXLINE Partner Merchant',
            mode: (row.mode as any) || 'B2C',
            courierId: card.courier_id || 'delhivery',
            courierName: card.courier_name || 'Delhivery Surface',
            serviceId: 'express-surface',
            serviceName: card.name || 'Express Cargo',
            rateCardId: row.rate_card_id,
            rateCardName: card.name || 'Assigned Rate Card',
            rateCardVersion: 'v1.0',
            isDefault: !!row.is_default,
            status: row.is_active ? 'ACTIVE' : 'INACTIVE',
            effectiveFrom: row.created_at ? row.created_at.split('T')[0] : '2026-08-01',
            createdAt: row.created_at ? row.created_at.split('T')[0] : '2026-08-01',
            updatedAt: row.updated_at ? row.updated_at.split('T')[0] : '2026-08-01',
          };
        });

        const seenIds = new Set(cloudAssignments.map((a) => a.id));
        const nonDup = ASSIGNMENT_STORE.filter((a) => !seenIds.has(a.id));
        ASSIGNMENT_STORE = [...cloudAssignments, ...nonDup];
        saveAssignmentsToStorage(ASSIGNMENT_STORE);
        return ASSIGNMENT_STORE;
      }
    } catch (err: any) {
      console.warn('[CustomerRateAssignmentService] Supabase sync warning:', err?.message);
    }
    return ASSIGNMENT_STORE;
  },

  getAssignments: (tenantId?: string, mode?: 'B2B' | 'B2C'): CustomerRateAssignment[] => {
    const list = ASSIGNMENT_STORE.filter((item) => {
      if (tenantId && tenantId !== 'all' && item.tenantId !== tenantId) return false;
      if (mode && item.mode !== mode) return false;
      return true;
    });
    if (list.length === 0 && tenantId && tenantId !== 'all') {
      return ASSIGNMENT_STORE.filter((item) => {
        if (item.tenantId !== 'tenant-demo-01') return false;
        if (mode && item.mode !== mode) return false;
        return true;
      });
    }
    return list;
  },

  assignRateCard: (input: CustomerRateAssignmentInput): CustomerRateAssignment => {
    if (input.isDefault) {
      ASSIGNMENT_STORE.forEach((item) => {
        if (item.tenantId === input.tenantId && item.mode === input.mode) {
          item.isDefault = false;
        }
      });
    }

    const newAssignment: CustomerRateAssignment = {
      id: `assign-${Date.now()}`,
      tenantId: input.tenantId,
      tenantName: input.tenantName,
      mode: input.mode,
      courierId: input.courierId,
      courierName: input.courierName,
      serviceId: input.serviceId,
      serviceName: input.serviceName,
      rateCardId: input.rateCardId,
      rateCardName: input.rateCardName,
      rateCardVersion: input.rateCardVersion,
      isDefault: !!input.isDefault,
      status: 'ACTIVE',
      effectiveFrom: input.effectiveFrom || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    ASSIGNMENT_STORE.unshift(newAssignment);
    saveAssignmentsToStorage(ASSIGNMENT_STORE);

    // Asynchronously synchronize assignment with Supabase
    if (input.tenantId && input.tenantId.length > 20) {
      const validTid = toValidTenantUUID(input.tenantId);
      Promise.resolve(
        supabase
          .from('merchant_rate_assignments')
          .insert({
            merchant_id: validTid,
            rate_card_id: input.rateCardId,
            mode: input.mode,
            is_default: !!input.isDefault,
            is_active: true,
          })
      ).catch(() => {});
    }

    return newAssignment;
  },

  setDefaultCourier: (tenantId: string, mode: 'B2B' | 'B2C', assignmentId: string): boolean => {
    let updated = false;

    ASSIGNMENT_STORE.forEach((item) => {
      if (item.tenantId === tenantId && item.mode === mode) {
        if (item.id === assignmentId) {
          item.isDefault = true;
          item.updatedAt = new Date().toISOString().split('T')[0];
          updated = true;
        } else {
          item.isDefault = false;
        }
      }
    });

    if (updated) {
      saveAssignmentsToStorage(ASSIGNMENT_STORE);
    }

    return updated;
  },

  deactivateAssignment: (assignmentId: string): boolean => {
    const item = ASSIGNMENT_STORE.find((a) => a.id === assignmentId);
    if (!item) return false;

    item.status = 'INACTIVE';
    item.updatedAt = new Date().toISOString().split('T')[0];
    saveAssignmentsToStorage(ASSIGNMENT_STORE);
    return true;
  },

  removeAssignment: (assignmentId: string): boolean => {
    const initialLen = ASSIGNMENT_STORE.length;
    ASSIGNMENT_STORE = ASSIGNMENT_STORE.filter((a) => a.id !== assignmentId);
    const removed = ASSIGNMENT_STORE.length < initialLen;
    if (removed) {
      saveAssignmentsToStorage(ASSIGNMENT_STORE);
    }
    return removed;
  },

  getEligibleCouriersForCustomer: (
    tenantId: string,
    mode: 'B2B' | 'B2C',
    originPincode: string,
    destinationPincode: string,
    actualWeightGrams: number,
    paymentType: 'PREPAID' | 'COD' = 'PREPAID',
    codAmountPaise = 0
  ): EligibleCourierResult[] => {
    const assignments = CustomerRateAssignmentService.getAssignments(tenantId, mode);
    const activeAssignments = assignments.filter((a) => a.status === 'ACTIVE');

    if (activeAssignments.length === 0) {
      return [];
    }

    const results: EligibleCourierResult[] = [];

    activeAssignments.forEach((assign) => {
      try {
        if (mode === 'B2C') {
          const calcRes = B2CPricingEngine.calculateB2CRate({
            originPincode,
            destinationPincode,
            actualWeightGrams,
            paymentType,
            codAmountPaise,
            courierId: assign.courierId,
            tenantId,
            rateCardId: assign.rateCardId,
          });

          if (calcRes.success && calcRes.serviceable) {
            results.push({
              courierId: assign.courierId,
              courierName: assign.courierName,
              serviceId: assign.serviceId,
              serviceName: assign.serviceName,
              rateCardId: assign.rateCardId,
              rateCardName: assign.rateCardName,
              rateCardVersion: assign.rateCardVersion || 'v1.0',
              mode: 'B2C',
              isDefault: assign.isDefault,
              customerPriceINR: calcRes.totalAmountINR,
              estimatedDeliveryDays: '2-3 Days',
              serviceable: true,
              reasonCode: 'SERVICEABLE',
            });
          }
        } else {
          const calcRes = B2BPricingEngine.calculateB2BPrice({
            originPincode,
            destinationPincode,
            actualWeightGrams,
            chargeableWeightGrams: actualWeightGrams,
            codAmountPaise,
            courierId: assign.courierId,
            tenantId,
            rateCardId: assign.rateCardId,
          });

          if (calcRes.success && calcRes.serviceable) {
            results.push({
              courierId: assign.courierId,
              courierName: assign.courierName,
              serviceId: assign.serviceId,
              serviceName: assign.serviceName,
              rateCardId: assign.rateCardId,
              rateCardName: assign.rateCardName,
              rateCardVersion: assign.rateCardVersion || 'v1.0',
              mode: 'B2B',
              isDefault: assign.isDefault,
              customerPriceINR: calcRes.totalAmountINR,
              estimatedDeliveryDays: '3-5 Days',
              serviceable: true,
              reasonCode: 'SERVICEABLE',
            });
          }
        }
      } catch (err: any) {
        console.warn(`[CustomerRateAssignmentService] Error calculating rate for ${assign.courierName}:`, err?.message);
      }
    });

    results.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.customerPriceINR - b.customerPriceINR;
    });

    return results;
  },
};
