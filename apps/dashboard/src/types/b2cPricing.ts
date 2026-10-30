export interface B2CZoneRateItem extends Record<string, unknown> {
  zoneCode: string; // e.g. "ZONE_A", "ZONE_B", "ZONE_C1", "ZONE_C2", "ZONE_C3", "ZONE_D", "ZONE_E"
  zoneName: string;
  baseRatePaise: number; // Rate for first base weight (e.g. 2700 = ₹27.00)
  additionalRatePaise: number; // Rate for each additional weight unit (e.g. 2500 = ₹25.00)
}

export interface B2CWeightSlabConfig extends Record<string, unknown> {
  id: string;
  weightKg: number; // e.g. 0.5, 1, 2, 3, 5, 10
  label: string; // e.g. "0.5 KG", "1.0 KG"
  sequence: number;
  ratesByZone: Record<string, { baseRatePaise: number; additionalRatePaise: number }>;
}

export interface B2CSurchargeRule extends Record<string, unknown> {
  id: string;
  code: string; // e.g. "FUEL", "COD", "RTO", "HANDLING", "PICKUP", "INSURANCE", "ODA"
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'PER_KG' | 'PER_SHIPMENT';
  value: number; // e.g. 15 for 15% fuel, or 3000 paise for ₹30 flat COD
  minPaise?: number;
  maxPaise?: number;
  enabled: boolean;
}

export interface B2CCODConfig extends Record<string, unknown> {
  calcType: 'FIXED' | 'PERCENTAGE' | 'HYBRID';
  value: number; // e.g. 3000 = ₹30 flat, or 2 = 2% of COD amount
  minAmountPaise: number; // e.g. 3000 = ₹30 minimum
}

export interface B2CRateCardVersionHistory extends Record<string, unknown> {
  version: string; // e.g. "v1.0", "v1.1"
  updatedBy: string;
  updatedAt: string;
  changelog: string;
}

export interface B2CRateCard extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  courierId: string;
  courierName: string;
  serviceId: string;
  serviceName: string;
  serviceType: 'Surface' | 'Air';
  version: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isCustomerSellingCard: boolean;
  assignedTenantIds: string[];
  baseWeightGrams: number; // e.g. 500g
  additionalWeightGrams: number; // e.g. 500g
  volumetricDivisor: number; // e.g. 5000
  weightSlabs: B2CWeightSlabConfig[];
  zoneRates: B2CZoneRateItem[];
  surcharges: B2CSurchargeRule[];
  codConfig: B2CCODConfig;
  fuelSurchargePercent: number; // e.g. 15 for 15%
  odaSurchargePaise: number; // e.g. 7500 for ₹75 ODA
  handlingChargePaise: number; // e.g. 1000 for ₹10 handling
  versions: B2CRateCardVersionHistory[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface B2CRateCalculateInput extends Record<string, unknown> {
  tenantId?: string;
  courierId: string;
  serviceId?: string;
  originPincode: string;
  destinationPincode: string;
  actualWeightGrams: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  packageCount?: number;
  paymentType: 'PREPAID' | 'COD';
  codAmountPaise?: number;
  invoiceValuePaise?: number;
  rateCardId?: string;
}

export interface B2CPricingResult extends Record<string, unknown> {
  success: boolean;
  serviceable: boolean;
  reasonCode?: string;
  rateCardId: string;
  rateCardName: string;
  rateCardVersion: string;
  isCustomerSellingCard: boolean;
  originPincode: string;
  destinationPincode: string;
  originZone: string;
  destinationZone: string;
  matchedZoneCode: string;
  isODA: boolean;
  actualWeightGrams: number;
  volumetricWeightGrams: number;
  chargeableWeightGrams: number;
  baseWeightGrams: number;
  baseFreightPaise: number;
  additionalWeightGrams: number;
  additionalWeightUnits: number;
  additionalWeightPaise: number;
  codChargePaise: number;
  fuelSurchargePaise: number;
  odaChargePaise: number;
  handlingChargePaise: number;
  totalSurchargesPaise: number;
  totalAmountPaise: number;
  totalAmountINR: number;
  currency: 'INR';
  snapshot: Record<string, unknown>;
  message?: string;
}
