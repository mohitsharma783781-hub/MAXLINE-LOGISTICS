export interface CustomerRateAssignment extends Record<string, unknown> {
  id: string;
  tenantId: string;
  tenantName: string;
  mode: 'B2B' | 'B2C';
  courierId: string;
  courierName: string;
  serviceId: string;
  serviceName: string;
  rateCardId: string;
  rateCardName: string;
  rateCardVersion: string;
  isDefault: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRateAssignmentInput extends Record<string, unknown> {
  tenantId: string;
  tenantName: string;
  mode: 'B2B' | 'B2C';
  courierId: string;
  courierName: string;
  serviceId: string;
  serviceName: string;
  rateCardId: string;
  rateCardName: string;
  rateCardVersion: string;
  isDefault?: boolean;
  effectiveFrom?: string;
}

export interface EligibleCourierResult extends Record<string, unknown> {
  courierId: string;
  courierName: string;
  serviceId: string;
  serviceName: string;
  mode: 'B2B' | 'B2C';
  isDefault: boolean;
  rateCardId: string;
  rateCardName: string;
  rateCardVersion: string;
  serviceable: boolean;
  reasonCode?: 'SERVICEABLE' | 'RATE_CARD_NOT_ASSIGNED' | 'NOT_SERVICEABLE' | 'COURIER_INACTIVE';
  customerPriceINR: number;
  estimatedDeliveryDays: string;
  isCheapest?: boolean;
  isFastest?: boolean;
  isRecommended?: boolean;
  rating?: number;
  reliabilityScore?: string;
  zoneRoute?: string;
}
