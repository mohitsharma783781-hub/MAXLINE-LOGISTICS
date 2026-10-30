export type B2BZoneCode =
  | 'N1'
  | 'N2'
  | 'N3'
  | 'N4'
  | 'C1'
  | 'C2'
  | 'W1'
  | 'W2'
  | 'S1'
  | 'S2'
  | 'S3'
  | 'S4'
  | 'E1'
  | 'E2'
  | 'NE1'
  | 'NE2';

export const B2B_ZONES: B2BZoneCode[] = [
  'N1', 'N2', 'N3', 'N4', 'C1', 'C2', 'W1', 'W2',
  'S1', 'S2', 'S3', 'S4', 'E1', 'E2', 'NE1', 'NE2'
];

export type B2BSurchargeCalcType =
  | 'FIXED'
  | 'PER_KG'
  | 'PERCENTAGE'
  | 'PERCENTAGE_OF_COD'
  | 'PERCENTAGE_OF_INVOICE_VALUE'
  | 'PER_DOCKET'
  | 'PER_SHIPMENT'
  | 'PER_UNIT';

export interface B2BWeightSlabItem extends Record<string, unknown> {
  id: string;
  minWeightGrams: number;
  maxWeightGrams: number;
  label: string; // e.g. "60 KG Min"
  sequence: number;
}

export interface B2BZoneMatrixCell extends Record<string, unknown> {
  slabId: string;
  originZone: string;
  destinationZone: string;
  ratePaise: number; // Integer paise per KG (e.g. 580 = ₹5.80 per KG)
}

export interface B2BSurchargeConfig extends Record<string, unknown> {
  id: string;
  name: string;
  code: string; // e.g. "DOCKET", "FUEL", "ROV", "INSURANCE", "COD", "HANDLING", "FM", "APPOINTMENT", "OTHER"
  calcType: B2BSurchargeCalcType;
  value: number; // e.g. 18 for 18% fuel, or 5000 paise for ₹50 docket
  minAmountPaise?: number; // e.g. 7500 paise (₹75 minimum)
  maxAmountPaise?: number;
  applicableTo?: 'ALL' | 'COD_ONLY' | 'HIGH_VALUE_ONLY';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface B2BRateCardVersionHistory extends Record<string, unknown> {
  version: string;
  updatedBy: string;
  updatedAt: string;
  changelog: string;
}

export interface B2BRateCard extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  courierId: string;
  courierName: string;
  courierAccountId?: string;
  serviceId: string;
  serviceName: string;
  tenantId?: string; // Customer-specific selling rate card if set
  merchantName?: string;
  isCustomerSellingCard: boolean;
  volumetricDivisor: number; // e.g. 5000, 4000, 4500
  minBillableWeightGrams: number; // e.g. 20000 (20 KG min)
  minFreightPaise: number; // e.g. 35000 (₹350 minimum freight / Bilty)
  gstPercent: number; // e.g. 18
  additionalKgRatePaise: number;
  matrixMap: Record<string, Record<string, number>>; // originZone -> destinationZone -> ratePaise
  weightSlabs: B2BWeightSlabItem[];
  matrixCells: B2BZoneMatrixCell[];
  surcharges: B2BSurchargeConfig[];
  versions: B2BRateCardVersionHistory[];
  currency: 'INR';
  version: string;
  status: 'DRAFT' | 'ACTIVE' | 'SCHEDULED' | 'ARCHIVED';
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface B2BPricingInput extends Record<string, unknown> {
  rateCardId?: string;
  tenantId?: string;
  courierId: string;
  originPincode: string;
  destinationPincode: string;
  actualWeightGrams: number;
  chargeableWeightGrams: number;
  invoiceValuePaise?: number;
  codAmountPaise?: number;
  packageCount?: number;
}

export interface B2BSurchargeLineItem extends Record<string, unknown> {
  name: string;
  code: string;
  calcType: B2BSurchargeCalcType;
  computedAmountPaise: number;
  details: string;
}

export interface B2BPricingResult extends Record<string, unknown> {
  success: boolean;
  serviceable: boolean;
  rateCardId: string;
  rateCardName: string;
  rateCardVersion: string;
  isCustomerSellingCard: boolean;
  originPincode: string;
  originZone: string;
  destinationPincode: string;
  destinationZone: string;
  actualWeightGrams: number;
  chargeableWeightGrams: number;
  billableWeightGrams: number;
  volumetricDivisor: number;
  matchedSlabLabel: string;
  baseRatePerKgPaise: number;
  baseFreightPaise: number;
  additionalWeightPaise: number;
  surcharges: B2BSurchargeLineItem[];
  totalSurchargesPaise: number;
  totalAmountPaise: number;
  totalAmountINR: number;
  currency: 'INR';
  snapshot: Record<string, unknown>;
  message?: string;
}
