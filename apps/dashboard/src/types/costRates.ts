export type RateCardStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'ARCHIVED';
export type SlabType = 'BASE' | 'ADDITIONAL';
export type ZoneType = 'DESTINATION_ZONE' | 'ORIGIN_DESTINATION_ZONE';

export interface WeightSlab extends Record<string, unknown> {
  id: string;
  rateCardId: string;
  minWeightGrams: number;
  maxWeightGrams: number;
  label: string; // e.g. "0-500g", "501g-1kg", "1-2kg", "Additional KG"
  slabType: SlabType;
  sequence: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ZoneRateMatrixItem extends Record<string, unknown> {
  id: string;
  rateCardId: string;
  zoneCode: string;
  originZoneCode?: string;
  slabId: string;
  baseRatePaise: number; // Integer paise (1 INR = 100 paise)
  additionalKgRatePaise?: number; // Integer paise for additional weight
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CostRateCard extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  courierId: string;
  courierName: string;
  courierAccountId?: string;
  accountCode?: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  mode: 'B2C' | 'B2B';
  zoneSchemeId: string;
  zoneSchemeName: string;
  zoneType: ZoneType;
  currency: 'INR';
  version: string;
  status: RateCardStatus;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostRateLookupInput {
  courierAccountId?: string;
  courierId?: string;
  serviceId?: string;
  mode: 'B2C' | 'B2B';
  originPostalCode: string;
  destinationPostalCode: string;
  chargeableWeightGrams: number;
  effectiveDate?: string;
  tenantId?: string;
}

export interface CostRateResult extends Record<string, unknown> {
  serviceable: boolean;
  courierId: string;
  courierName: string;
  serviceId: string;
  serviceName: string;
  rateCardId?: string;
  rateCardCode?: string;
  rateCardVersion?: string;
  originZone?: string;
  destinationZone?: string;
  weightSlabLabel?: string;
  chargeableWeightGrams: number;
  baseFreightPaise: number;
  additionalWeightPaise: number;
  totalCostPaise: number;
  currency: 'INR';
  reasonMessage?: string;
}

export interface CostRateImportRow extends Record<string, unknown> {
  rowNumber: number;
  zoneCode: string;
  originZoneCode?: string;
  minWeightGrams: number;
  maxWeightGrams: number;
  rateINR: number;
  additionalRateINR?: number;
  isValid: boolean;
  errorReason?: string;
}

export interface CostRateImportLog extends Record<string, unknown> {
  id: string;
  filename: string;
  rateCardId: string;
  rateCardName: string;
  uploadedBy: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  status: 'DRAFT' | 'PUBLISHED';
  createdAt: string;
}
