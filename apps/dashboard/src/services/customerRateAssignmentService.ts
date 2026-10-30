import type {
  CustomerRateAssignment,
  CustomerRateAssignmentInput,
  EligibleCourierResult,
} from '../types/customerRateAssignment';
export type { EligibleCourierResult };
import { B2BPricingEngine } from './b2bPricingEngine';
import { B2CPricingEngine } from './b2cPricingEngine';

export const INITIAL_RATE_ASSIGNMENTS: CustomerRateAssignment[] = [
  {
    id: 'assign-b2c-01',
    tenantId: 'tenant-demo-01',
    tenantName: 'Acme Logistics Pvt Ltd',
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
    tenantName: 'Acme Logistics Pvt Ltd',
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
    tenantName: 'Acme Logistics Pvt Ltd',
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

let ASSIGNMENT_STORE = [...INITIAL_RATE_ASSIGNMENTS];

export const CustomerRateAssignmentService = {
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
    // If setting as default, clear previous default flag for that mode
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

    return updated;
  },

  deactivateAssignment: (assignmentId: string): boolean => {
    const item = ASSIGNMENT_STORE.find((a) => a.id === assignmentId);
    if (!item) return false;

    item.status = 'INACTIVE';
    item.updatedAt = new Date().toISOString().split('T')[0];
    return true;
  },

  removeAssignment: (assignmentId: string): boolean => {
    const initialLen = ASSIGNMENT_STORE.length;
    ASSIGNMENT_STORE = ASSIGNMENT_STORE.filter((a) => a.id !== assignmentId);
    return ASSIGNMENT_STORE.length < initialLen;
  },

  // Eligible Couriers Filter Engine for Customer Booking
  getEligibleCouriersForCustomer: (
    tenantId: string,
    mode: 'B2B' | 'B2C',
    originPincode: string,
    destinationPincode: string,
    actualWeightGrams: number,
    paymentType: 'PREPAID' | 'COD' = 'PREPAID',
    codAmountPaise = 0
  ): EligibleCourierResult[] => {
    let activeAssignments = ASSIGNMENT_STORE.filter(
      (a) => a.tenantId === tenantId && a.mode === mode && a.status === 'ACTIVE'
    );

    if (activeAssignments.length === 0) {
      activeAssignments = ASSIGNMENT_STORE.filter(
        (a) => (a.tenantId === 'tenant-demo-01' || a.isDefault) && a.mode === mode && a.status === 'ACTIVE'
      );
    }

    const results: EligibleCourierResult[] = [];

    activeAssignments.forEach((assign) => {
      if (mode === 'B2C') {
        const priceRes = B2CPricingEngine.calculateB2CRate({
          tenantId,
          courierId: assign.courierId,
          serviceId: assign.serviceId,
          originPincode,
          destinationPincode,
          actualWeightGrams,
          paymentType,
          codAmountPaise,
          rateCardId: assign.rateCardId,
        });

        results.push({
          courierId: assign.courierId,
          courierName: assign.courierName,
          serviceId: assign.serviceId,
          serviceName: assign.serviceName,
          mode: 'B2C',
          isDefault: assign.isDefault,
          rateCardId: assign.rateCardId,
          rateCardName: assign.rateCardName,
          rateCardVersion: assign.rateCardVersion,
          serviceable: priceRes.serviceable,
          reasonCode: priceRes.serviceable ? 'SERVICEABLE' : 'NOT_SERVICEABLE',
          customerPriceINR: priceRes.totalAmountINR,
          estimatedDeliveryDays: assign.courierId === 'bluedart' ? '1–2 Days (Air)' : '2–4 Days (Surface)',
          rating: assign.courierId === 'bluedart' ? 4.9 : 4.8,
          reliabilityScore: assign.courierId === 'bluedart' ? '99.1% On-Time' : '98.4% On-Time',
          zoneRoute: originPincode.slice(0, 2) === destinationPincode.slice(0, 2) ? 'Zone A (Intra-City)' : 'Zone C (Metro-to-Metro)',
        });
      } else {
        const priceRes = B2BPricingEngine.calculateB2BRate({
          tenantId,
          courierId: assign.courierId,
          serviceId: assign.serviceId,
          originPincode,
          destinationPincode,
          actualWeightGrams,
          codAmountPaise,
          rateCardId: assign.rateCardId,
        });

        results.push({
          courierId: assign.courierId,
          courierName: assign.courierName,
          serviceId: assign.serviceId,
          serviceName: assign.serviceName,
          mode: 'B2B',
          isDefault: assign.isDefault,
          rateCardId: assign.rateCardId,
          rateCardName: assign.rateCardName,
          rateCardVersion: assign.rateCardVersion,
          serviceable: priceRes.serviceable,
          reasonCode: priceRes.serviceable ? 'SERVICEABLE' : 'NOT_SERVICEABLE',
          customerPriceINR: priceRes.totalAmountINR,
          estimatedDeliveryDays: '3–5 Days (Commercial Cargo)',
          rating: 4.7,
          reliabilityScore: '97.8% On-Time',
          zoneRoute: 'Zone C (Commercial Freight)',
        });
      }
    });

    // Evaluate Smart Recommendation Tags
    const serviceableResults = results.filter((r) => r.serviceable);
    if (serviceableResults.length > 0) {
      // 1. Lowest Price -> Cheapest
      let cheapest = serviceableResults[0];
      serviceableResults.forEach((r) => {
        if (r.customerPriceINR < cheapest.customerPriceINR) cheapest = r;
      });
      cheapest.isCheapest = true;

      // 2. Shortest Days -> Fastest
      let fastest = serviceableResults[0];
      serviceableResults.forEach((r) => {
        if (r.estimatedDeliveryDays.includes('1–2 Days') || r.estimatedDeliveryDays.includes('Air')) {
          fastest = r;
        }
      });
      fastest.isFastest = true;

      // 3. Recommended -> Highest Rating & Balanced Choice
      let recommended = serviceableResults.find((r) => r.isDefault) || cheapest;
      recommended.isRecommended = true;
    }

    return results;
  },
};
