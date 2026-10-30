import type {
  PricingRule,
  PricingCalculationInput,
  PricingCalculationResult,
  PricedRateQuote,
} from '../types/pricing';
import type { RateQuote } from '../types/rates';
import { DEMO_PRICING_RULES } from '../mocks/pricing.mock';

export const PricingEngine = {
  // Main Pricing Engine Calculation
  calculateSellingPrice: (
    input: PricingCalculationInput,
    rulesList: PricingRule[] = DEMO_PRICING_RULES
  ): PricingCalculationResult => {
    const baseCost = Math.max(0, Math.round(input.courierCostMinor));
    const courierCodFee = Math.max(0, Math.round(input.courierCodFeeMinor || 0));

    // 1. Filter and Match Active Rules
    const matchingRules = rulesList.filter((rule) => {
      if (!rule.enabled || rule.status !== 'ACTIVE') return false;

      // Shipment Type Filter
      if (rule.shipmentType !== 'BOTH' && rule.shipmentType !== input.shipmentType) {
        return false;
      }

      // Payment Mode Filter
      if (rule.paymentMode !== 'BOTH' && rule.paymentMode !== input.paymentMode) {
        return false;
      }

      // Courier Filter
      if (rule.courierId && input.courierId && rule.courierId.toLowerCase() !== input.courierId.toLowerCase()) {
        return false;
      }

      // Customer / Customer Group Filter
      if (rule.scope === 'CUSTOMER' && rule.customerId && rule.customerId !== input.customerId) {
        return false;
      }
      if (rule.scope === 'CUSTOMER_GROUP' && rule.customerGroupId && rule.customerGroupId !== input.customerGroupId) {
        return false;
      }

      // Weight Range Filter
      if (rule.minWeightGrams !== undefined && input.weightGrams < rule.minWeightGrams) {
        return false;
      }
      if (rule.maxWeightGrams !== undefined && input.weightGrams > rule.maxWeightGrams) {
        return false;
      }

      return true;
    });

    // 2. Sort by Scope Precedence & Priority
    const scopePrecedence: Record<string, number> = {
      CUSTOMER: 1,
      CUSTOMER_GROUP: 2,
      SERVICE: 3,
      COURIER: 4,
      GLOBAL: 5,
    };

    matchingRules.sort((a, b) => {
      const scopeRankA = scopePrecedence[a.scope] || 99;
      const scopeRankB = scopePrecedence[b.scope] || 99;
      if (scopeRankA !== scopeRankB) return scopeRankA - scopeRankB;
      return (a.priority || 10) - (b.priority || 10);
    });

    // Select Top Primary Rule or default to fallback calculation
    const appliedRule = matchingRules.length > 0 ? matchingRules[0] : null;

    let markupMinor = 0;
    let discountMinor = 0;
    let merchantCodFeeMinor = courierCodFee;
    let minMarginMinor = 0;
    let minSellingPriceMinor = 0;

    if (appliedRule) {
      // Calculate Markup
      if (appliedRule.markupType === 'FIXED') {
        markupMinor = Math.max(0, Math.round(appliedRule.markupValue));
      } else if (appliedRule.markupType === 'PERCENTAGE') {
        markupMinor = Math.max(0, Math.round((baseCost * appliedRule.markupValue) / 100));
      }

      // Calculate Discount
      if (appliedRule.discountType === 'FIXED') {
        discountMinor = Math.max(0, Math.round(appliedRule.discountValue));
      } else if (appliedRule.discountType === 'PERCENTAGE') {
        discountMinor = Math.max(0, Math.round(((baseCost + markupMinor) * appliedRule.discountValue) / 100));
      }

      // COD Surcharge Markup
      if (input.paymentMode === 'COD' && appliedRule.codMarkupMinor) {
        merchantCodFeeMinor = courierCodFee + Math.max(0, Math.round(appliedRule.codMarkupMinor));
      }

      minMarginMinor = appliedRule.minimumMarginMinor || 0;
      minSellingPriceMinor = appliedRule.minimumSellingPriceMinor || 0;
    } else {
      // Default 10% markup if zero rules match
      markupMinor = Math.round(baseCost * 0.1);
    }

    // Initial Selling Price Calculation
    let sellingPriceMinor = baseCost + markupMinor - discountMinor + (merchantCodFeeMinor - courierCodFee);

    let minimumMarginEnforced = false;
    let minimumPriceEnforced = false;

    // Enforce Minimum Margin Protection
    const currentMargin = sellingPriceMinor - baseCost;
    if (minMarginMinor > 0 && currentMargin < minMarginMinor) {
      sellingPriceMinor = baseCost + minMarginMinor + (merchantCodFeeMinor - courierCodFee);
      minimumMarginEnforced = true;
    }

    // Enforce Minimum Selling Price Protection
    if (minSellingPriceMinor > 0 && sellingPriceMinor < minSellingPriceMinor) {
      sellingPriceMinor = minSellingPriceMinor;
      minimumPriceEnforced = true;
    }

    // Strictly Block Negative Margins
    if (sellingPriceMinor < baseCost) {
      sellingPriceMinor = baseCost;
    }

    // Final Margin & Percentage Calculation
    const marginMinor = sellingPriceMinor - baseCost;
    const marginPercentage = sellingPriceMinor > 0 ? Number(((marginMinor / sellingPriceMinor) * 100).toFixed(2)) : 0;

    return {
      courierCostMinor: baseCost,
      markupMinor,
      discountMinor,
      merchantCodFeeMinor,
      sellingPriceMinor,
      marginMinor,
      marginPercentage,
      appliedRuleIds: appliedRule ? [appliedRule.id] : [],
      appliedRules: appliedRule ? [appliedRule] : [],
      minimumMarginEnforced,
      minimumPriceEnforced,
      currency: 'INR',
    };
  },

  // Attach Pricing to Rate Quote
  attachPricingToQuote: (
    quote: RateQuote,
    inputOverrides?: Partial<PricingCalculationInput>
  ): PricedRateQuote => {
    const input: PricingCalculationInput = {
      tenantId: quote.tenantId || 'tenant-demo-01',
      courierCostMinor: quote.baseFreightMinor + quote.fuelSurchargeMinor + quote.taxMinor,
      courierCodFeeMinor: quote.codFeeMinor,
      courierId: quote.courierId,
      serviceId: quote.serviceId,
      shipmentType: 'B2C',
      paymentMode: quote.paymentMode,
      weightGrams: quote.chargeableWeightGrams,
      ...inputOverrides,
    };

    const res = PricingEngine.calculateSellingPrice(input);

    return {
      rateQuoteId: quote.id,
      courierCostMinor: res.courierCostMinor,
      markupMinor: res.markupMinor,
      discountMinor: res.discountMinor,
      merchantCodFeeMinor: res.merchantCodFeeMinor,
      sellingPriceMinor: res.sellingPriceMinor,
      marginMinor: res.marginMinor,
      marginPercentage: res.marginPercentage,
      appliedRuleIds: res.appliedRuleIds,
      expiresAt: quote.expiresAt,
    };
  },

  // Overlap Detection Helper
  detectOverlappingRules: (rules: PricingRule[]): Array<{ ruleAId: string; ruleBId: string; message: string }> => {
    const overlaps: Array<{ ruleAId: string; ruleBId: string; message: string }> = [];

    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const a = rules[i];
        const b = rules[j];

        if (a.scope === b.scope && a.enabled && b.enabled) {
          if (
            (a.courierId === b.courierId || !a.courierId || !b.courierId) &&
            (a.shipmentType === b.shipmentType || a.shipmentType === 'BOTH' || b.shipmentType === 'BOTH') &&
            (a.paymentMode === b.paymentMode || a.paymentMode === 'BOTH' || b.paymentMode === 'BOTH')
          ) {
            overlaps.push({
              ruleAId: a.id,
              ruleBId: b.id,
              message: `Potentially overlapping rules in scope '${a.scope}': "${a.name}" and "${b.name}" share identical criteria.`,
            });
          }
        }
      }
    }

    return overlaps;
  },
};
