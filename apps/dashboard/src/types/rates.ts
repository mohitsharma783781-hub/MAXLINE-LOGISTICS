import type { CourierCode } from './couriers';

export type ShipmentType = 'DOMESTIC' | 'INTERNATIONAL';
export type PaymentMode = 'PREPAID' | 'COD';
export type WeightRoundingStrategy = 'NONE' | 'UP_TO_NEXT_0_5' | 'UP_TO_NEXT_1' | 'CUSTOM';
export type ServiceType = 'ALL' | 'Surface' | 'Express' | 'Air';

export type QuoteRankingTag = 'CHEAPEST' | 'FASTEST' | 'BEST_VALUE' | 'NONE';
export type QuoteStatus = 'AVAILABLE' | 'NOT_SERVICEABLE' | 'ERROR' | 'EXPIRED';

export interface RateCalculationInput {
  originPincode: string;
  destinationPincode: string;
  shipmentType: ShipmentType;
  paymentMode: PaymentMode;
  actualWeight: number; // in KG
  length: number; // in CM
  width: number; // in CM
  height: number; // in CM
  packageCount: number;
  declaredValue?: number;
  codAmount?: number;
  volumetricDivisor?: number; // default 5000
  roundingStrategy?: WeightRoundingStrategy;
  tenantId?: string;
}

export interface RateBreakdown {
  baseFreight: number;
  codCharge: number;
  fuelSurcharge: number;
  otherCharges: number;
  taxAmount: number;
  totalAmount: number;
}

export interface NormalizedRate extends Record<string, unknown> {
  id: string;
  courierId: string;
  courierName: string;
  courierLogo?: string;
  serviceId: string;
  serviceName: string;
  serviceType: 'Surface' | 'Express' | 'Air';
  actualWeight: number;
  volumetricWeight: number;
  chargeableWeight: number;
  breakdown: RateBreakdown;
  totalAmount: number;
  currency: string;
  estimatedDays: string;
  etaDaysMin: number;
  etaDaysMax: number;
  serviceable: boolean;
  recommended: boolean;
  recommendationReason?: string;
  cutoffTime?: string;
  ranking?: QuoteRankingTag;
  rateRequestId?: string;
  expiresAt?: string;
}

export interface RateQuote extends Record<string, unknown> {
  id: string;
  rateRequestId: string;
  tenantId: string;
  courierId: string;
  courierCode: CourierCode;
  courierName: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  serviceType: 'Surface' | 'Express' | 'Air';
  mode: 'SURFACE' | 'AIR';
  paymentMode: PaymentMode;
  actualWeightGrams: number;
  volumetricWeightGrams: number;
  chargeableWeightGrams: number;
  baseFreightMinor: number;
  fuelSurchargeMinor: number;
  codFeeMinor: number;
  handlingFeeMinor: number;
  otherChargesMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  currency: 'INR';
  estimatedDeliveryDays: number;
  estimatedDeliveryDate: string;
  serviceable: boolean;
  quoteStatus: QuoteStatus;
  rankingTag: QuoteRankingTag;
  expiresAt: string;
  createdAt: string;
}

export interface RateEngineRequest {
  tenantId: string;
  pickupPincode: string;
  deliveryPincode: string;
  actualWeightGrams: number;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  paymentMode: PaymentMode;
  shipmentType: ShipmentType;
  invoiceValueMinor: number;
  packageCount: number;
}

export interface RateEngineResponse {
  rateRequestId: string;
  tenantId: string;
  quotes: RateQuote[];
  failedCouriers: Array<{ courierCode: string; reason: string }>;
  cheapestQuoteId?: string;
  fastestQuoteId?: string;
  bestValueQuoteId?: string;
  createdAt: string;
}

export interface ServiceabilityCheckInput {
  originPincode: string;
  destinationPincode: string;
  actualWeight: number;
  paymentMode: PaymentMode;
  tenantId?: string;
}

export interface NormalizedServiceability {
  courierId: string;
  courierName: string;
  courierLogo?: string;
  serviceId: string;
  serviceName: string;
  serviceType: 'Surface' | 'Express' | 'Air';
  available: boolean;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  estimatedDays: string;
  pickupAvailable: boolean;
  message: string;
  status: 'Serviceable' | 'Not Serviceable' | 'Partially Serviceable';
}

export type RateSortOption = 'recommended' | 'price_low' | 'fastest' | 'courier_name';

export interface RateFilterState {
  serviceType: ServiceType;
  paymentMode: 'ALL' | PaymentMode;
  searchQuery: string;
}
