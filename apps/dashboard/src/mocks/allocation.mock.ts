import type {
  AllocationRule,
  AllocationEngineInput,
  AllocationEvaluationResult,
  EligibleCourierResult,
  ExcludedCourierResult,
  DefaultAllocationStrategy,
} from '../types/allocation';
import { demoRateCalculator, demoServiceabilityProvider } from './rates.mock';
import { DEMO_COURIER_CONNECTIONS } from './couriers.mock';

/**
 * Initial Demo Allocation Rules
 */
export const INITIAL_DEMO_RULES: AllocationRule[] = [
  {
    id: 'rule-1',
    name: 'COD Priority Dispatch',
    description: 'Prefer couriers with dedicated COD remittance for cash on delivery orders',
    priority: 1,
    status: 'ACTIVE',
    conditions: [
      { field: 'paymentMode', operator: 'equals', value: 'COD' },
    ],
    actions: [
      { type: 'PREFER_COD_SUPPORT', value: 15 },
      { type: 'PREFER_COURIER', value: 'delhivery' },
    ],
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'rule-2',
    name: 'Heavy Parcel Surface Optimization',
    description: 'Route shipments over 3 KG to surface cargo partners to optimize freight cost',
    priority: 2,
    status: 'ACTIVE',
    conditions: [
      { field: 'actualWeight', operator: 'greaterThan', value: 3 },
    ],
    actions: [
      { type: 'PREFER_SERVICE', value: 'Surface' },
      { type: 'SET_MAX_COST', value: 400 },
    ],
    createdAt: '2026-08-05T14:30:00Z',
  },
  {
    id: 'rule-3',
    name: 'Air Express SLA Protection',
    description: 'Exclude surface couriers if estimated delivery time exceeds 4 days',
    priority: 3,
    status: 'ACTIVE',
    conditions: [
      { field: 'estimatedDays', operator: 'greaterThan', value: 4 },
    ],
    actions: [
      { type: 'EXCLUDE_COURIER', value: 'shadowfax' },
    ],
    createdAt: '2026-08-10T09:15:00Z',
  },
];

/**
 * Helper to evaluate a single rule condition against input
 */

const evaluateCondition = (
  condition: { field: string; operator: string; value: string | number },
  input: AllocationEngineInput,
  courierMeta?: { estimatedDaysMax?: number; cost?: number }
): boolean => {
  const { field, operator, value } = condition;
  let actualVal: any = (input as any)[field];

  if (field === 'estimatedDays' && courierMeta) {
    actualVal = courierMeta.estimatedDaysMax;
  }

  if (actualVal === undefined || actualVal === null) return false;

  switch (operator) {
    case 'equals':
      return String(actualVal).toLowerCase() === String(value).toLowerCase();
    case 'notEquals':
      return String(actualVal).toLowerCase() !== String(value).toLowerCase();
    case 'greaterThan':
      return Number(actualVal) > Number(value);
    case 'lessThan':
      return Number(actualVal) < Number(value);
    case 'greaterThanOrEqual':
      return Number(actualVal) >= Number(value);
    case 'lessThanOrEqual':
      return Number(actualVal) <= Number(value);
    case 'contains':
      return String(actualVal).toLowerCase().includes(String(value).toLowerCase());
    case 'in':
      return String(value).split(',').map((s) => s.trim().toLowerCase()).includes(String(actualVal).toLowerCase());
    default:
      return false;
  }
};

/**
 * Allocation Evaluation Engine
 */
export const allocateShipment = (
  input: AllocationEngineInput,
  rules: AllocationRule[] = INITIAL_DEMO_RULES,
  strategy: DefaultAllocationStrategy = 'BALANCED'
): AllocationEvaluationResult => {
  const {
    originPincode,
    destinationPincode,
    actualWeight,
    length = 20,
    width = 15,
    height = 10,
    packageCount = 1,
    paymentMode,
    shipmentType,
    declaredValue = 1000,
    preferredCourierId,
  } = input;

  // 1. Get Serviceability Results (STEP 3I)
  const serviceabilityData = demoServiceabilityProvider.checkServiceability({
    originPincode,
    destinationPincode,
    actualWeight,
    paymentMode,
  });

  // 2. Get Calculated Rates (STEP 3I)
  const calculatedRates = demoRateCalculator.getRates({
    originPincode,
    destinationPincode,
    shipmentType,
    paymentMode,
    actualWeight,
    length,
    width,
    height,
    packageCount,
    declaredValue,
  });

  // Active rules sorted by priority (1 -> 2 -> 3)
  const activeRules = rules
    .filter((r) => r.status === 'ACTIVE')
    .sort((a, b) => a.priority - b.priority);

  const eligibleCouriers: EligibleCourierResult[] = [];
  const excludedCouriers: ExcludedCourierResult[] = [];
  const appliedRules: AllocationRule[] = [];

  // Iterate over calculated rate options to determine eligibility & scoring
  calculatedRates.forEach((rate) => {
    // Check connection status in STEP 3H connections
    const connection = DEMO_COURIER_CONNECTIONS.find((c) => c.courierId === rate.courierId);
    if (connection && (connection.status === 'disabled' || connection.status === 'not_connected')) {
      excludedCouriers.push({
        courierId: rate.courierId,
        courierName: rate.courierName,
        courierLogo: rate.courierLogo || '📦',
        serviceName: rate.serviceName,
        reason: `Courier integration is currently ${connection.status === 'disabled' ? 'disabled' : 'not connected'} in Courier Settings.`,
      });
      return;
    }

    // Check serviceability
    const servItem = serviceabilityData.results.find((s) => s.serviceId === rate.serviceId);
    if (!servItem || !servItem.available) {
      excludedCouriers.push({
        courierId: rate.courierId,
        courierName: rate.courierName,
        courierLogo: rate.courierLogo || '📦',
        serviceName: rate.serviceName,
        reason: servItem ? servItem.message : `Destination pincode ${destinationPincode} not serviced by carrier.`,
      });
      return;
    }

    if (paymentMode === 'COD' && !servItem.codAvailable) {
      excludedCouriers.push({
        courierId: rate.courierId,
        courierName: rate.courierName,
        courierLogo: rate.courierLogo || '📦',
        serviceName: rate.serviceName,
        reason: `COD payment mode not supported for this pincode by carrier.`,
      });
      return;
    }

    // Check rule exclusions
    let isExcludedByRule = false;
    let ruleExclusionReason = '';

    activeRules.forEach((rule) => {
      const matchConditions = rule.conditions.every((c) =>
        evaluateCondition(c, input, { estimatedDaysMax: rate.etaDaysMax, cost: rate.totalAmount })
      );

      if (matchConditions) {
        if (!appliedRules.some((r) => r.id === rule.id)) {
          appliedRules.push(rule);
        }

        rule.actions.forEach((act) => {
          if (act.type === 'EXCLUDE_COURIER' && String(act.value).toLowerCase() === rate.courierId.toLowerCase()) {
            isExcludedByRule = true;
            ruleExclusionReason = `Excluded by Priority Rule #${rule.priority}: ${rule.name}`;
          }
          if (act.type === 'SET_MAX_COST' && rate.totalAmount > Number(act.value)) {
            isExcludedByRule = true;
            ruleExclusionReason = `Shipping cost (₹${rate.totalAmount}) exceeds maximum rule limit (₹${act.value}).`;
          }
          if (act.type === 'SET_MAX_ETA' && rate.etaDaysMax > Number(act.value)) {
            isExcludedByRule = true;
            ruleExclusionReason = `Estimated delivery (${rate.etaDaysMax} days) exceeds maximum rule SLA (${act.value} days).`;
          }
        });
      }
    });

    if (isExcludedByRule) {
      excludedCouriers.push({
        courierId: rate.courierId,
        courierName: rate.courierName,
        courierLogo: rate.courierLogo || '📦',
        serviceName: rate.serviceName,
        reason: ruleExclusionReason,
      });
      return;
    }

    // 3. Compute Composite Score (0-100)
    // Cost score: normalized against min cost
    const costScore = Math.max(10, Math.min(50, 50 - (rate.totalAmount - 100) * 0.1));
    const speedScore = Math.max(10, Math.min(40, 40 - rate.etaDaysMin * 5));

    let ruleBonus = 0;
    activeRules.forEach((rule) => {
      const matchConditions = rule.conditions.every((c) =>
        evaluateCondition(c, input, { estimatedDaysMax: rate.etaDaysMax, cost: rate.totalAmount })
      );
      if (matchConditions) {
        rule.actions.forEach((act) => {
          if (act.type === 'PREFER_COURIER' && String(act.value).toLowerCase() === rate.courierId.toLowerCase()) {
            ruleBonus += 15;
          }
          if (act.type === 'PREFER_SERVICE' && String(act.value).toLowerCase() === rate.serviceType.toLowerCase()) {
            ruleBonus += 10;
          }
          if (act.type === 'PREFER_COD_SUPPORT' && paymentMode === 'COD') {
            ruleBonus += 10;
          }
        });
      }
    });

    let preferenceBonus = 0;
    if (preferredCourierId && rate.courierId.toLowerCase() === preferredCourierId.toLowerCase()) {
      preferenceBonus = 20;
    }

    // Strategy Weighting
    let totalScore = 0;
    if (strategy === 'LOWEST_COST') {
      totalScore = costScore * 1.5 + speedScore * 0.5 + ruleBonus + preferenceBonus;
    } else if (strategy === 'FASTEST') {
      totalScore = speedScore * 1.8 + costScore * 0.4 + ruleBonus + preferenceBonus;
    } else if (strategy === 'PREFERRED_COURIER') {
      totalScore = preferenceBonus * 2 + costScore * 0.5 + speedScore * 0.5 + ruleBonus;
    } else {
      // BALANCED
      totalScore = costScore + speedScore + ruleBonus + preferenceBonus;
    }

    const finalScore = Math.min(100, Math.round(totalScore));

    eligibleCouriers.push({
      courierId: rate.courierId,
      courierName: rate.courierName,
      courierLogo: rate.courierLogo || '📦',
      serviceId: rate.serviceId,
      serviceName: rate.serviceName,
      serviceType: rate.serviceType,
      totalCost: rate.totalAmount,
      etaDaysMin: rate.etaDaysMin,
      etaDaysMax: rate.etaDaysMax,
      estimatedDays: rate.estimatedDays,
      codSupported: servItem ? servItem.codAvailable : true,
      score: finalScore,
      scoreBreakdown: {
        costScore: Math.round(costScore),
        speedScore: Math.round(speedScore),
        ruleBonus,
        preferenceBonus,
      },
    });
  });

  // Sort eligible couriers by Score descending
  eligibleCouriers.sort((a, b) => b.score - a.score);

  const recommendedCourier = eligibleCouriers.length > 0 ? eligibleCouriers[0] : null;

  // Generate explainability string
  let recommendationReason = 'No eligible courier partner found matching the criteria.';
  if (recommendedCourier) {
    const reasonsList: string[] = [];
    reasonsList.push(`Fully serviceable for route ${originPincode} → ${destinationPincode}`);

    if (paymentMode === 'COD') {
      reasonsList.push(`supports COD payment collection`);
    }

    if (strategy === 'LOWEST_COST') {
      reasonsList.push(`lowest estimated cost (₹${recommendedCourier.totalCost})`);
    } else if (strategy === 'FASTEST') {
      reasonsList.push(`fastest delivery SLA (${recommendedCourier.estimatedDays})`);
    } else {
      reasonsList.push(`highest composite score (${recommendedCourier.score}/100) balancing cost (₹${recommendedCourier.totalCost}), speed (${recommendedCourier.estimatedDays}), and carrier performance`);
    }

    if (appliedRules.length > 0) {
      reasonsList.push(`matched active priority rule "${appliedRules[0].name}"`);
    }

    recommendationReason = `Selected ${recommendedCourier.courierName} (${recommendedCourier.serviceName}): ${reasonsList.join(', ')}.`;
  }

  return {
    recommendedCourier,
    recommendationReason,
    strategyUsed: strategy,
    eligibleCouriers,
    excludedCouriers,
    appliedRules,
  };
};
