export type PricingRuleScope = 'GLOBAL' | 'COURIER' | 'SERVICE' | 'CUSTOMER' | 'CUSTOMER_GROUP';

export type MarkupType = 'FIXED' | 'PERCENTAGE';

export type DiscountType = 'NONE' | 'FIXED' | 'PERCENTAGE';

export type PricingRuleStatus = 'ACTIVE' | 'INACTIVE';

export interface PricingRule extends Record<string, unknown> {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  status: PricingRuleStatus;
  priority: number; // Lower number = higher priority
  scope: PricingRuleScope;
  courierId?: string;
  serviceId?: string;
  customerId?: string;
  customerGroupId?: string;
  shipmentType: 'B2C' | 'B2B' | 'BOTH';
  paymentMode: 'PREPAID' | 'COD' | 'BOTH';
  minWeightGrams?: number;
  maxWeightGrams?: number;
  markupType: MarkupType;
  markupValue: number; // In paise if FIXED, percentage value if PERCENTAGE (e.g., 10 = 10%)
  discountType: DiscountType;
  discountValue: number; // In paise if FIXED, percentage value if PERCENTAGE
  codMarkupMinor: number; // Additional markup on COD fee in paise
  minimumSellingPriceMinor: number; // In paise
  minimumMarginMinor: number; // In paise
  enabled: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerGroup extends Record<string, unknown> {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  code: 'RETAIL' | 'WHOLESALE' | 'ENTERPRISE' | 'VIP';
  status: PricingRuleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPricingProfile extends Record<string, unknown> {
  id: string;
  tenantId: string;
  customerId: string;
  customerGroupId?: string;
  pricingRuleIds: string[];
  status: PricingRuleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PricingCalculationInput {
  tenantId: string;
  courierCostMinor: number; // In paise
  courierCodFeeMinor?: number; // In paise
  courierId?: string;
  serviceId?: string;
  customerId?: string;
  customerGroupId?: string;
  shipmentType: 'B2C' | 'B2B' | 'DOMESTIC' | 'INTERNATIONAL' | 'BOTH';
  paymentMode: 'PREPAID' | 'COD' | 'BOTH';
  weightGrams: number;
}

export interface PricingCalculationResult {
  courierCostMinor: number; // Courier cost in paise
  markupMinor: number; // Applied markup in paise
  discountMinor: number; // Applied discount in paise
  merchantCodFeeMinor: number; // Merchant COD fee in paise
  sellingPriceMinor: number; // Final merchant selling price in paise
  marginMinor: number; // Selling price minus courier cost in paise
  marginPercentage: number; // Margin percentage relative to selling price
  appliedRuleIds: string[];
  appliedRules: PricingRule[];
  minimumMarginEnforced: boolean;
  minimumPriceEnforced: boolean;
  currency: 'INR';
}

export interface PricedRateQuote {
  rateQuoteId: string;
  courierCostMinor: number;
  markupMinor: number;
  discountMinor: number;
  merchantCodFeeMinor: number;
  sellingPriceMinor: number;
  marginMinor: number;
  marginPercentage: number;
  appliedRuleIds: string[];
  expiresAt: string;
}

export interface PricingFilterState {
  searchQuery: string;
  scope: string;
  status: string;
}
