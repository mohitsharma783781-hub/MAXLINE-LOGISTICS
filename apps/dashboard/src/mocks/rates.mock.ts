import type {
  RateCalculationInput,
  NormalizedRate,
  ServiceabilityCheckInput,
  NormalizedServiceability,
  WeightRoundingStrategy,
} from '../types/rates';

/**
 * Volumetric Weight Helper
 * Volumetric Weight = (Length * Width * Height) / Volumetric Divisor
 */
export const calculateVolumetricWeight = (
  length: number,
  width: number,
  height: number,
  packageCount: number = 1,
  divisor: number = 5000
): number => {
  if (length <= 0 || width <= 0 || height <= 0 || divisor <= 0) return 0;
  const singleVolumetric = (length * width * height) / divisor;
  return Number((singleVolumetric * packageCount).toFixed(2));
};

/**
 * Weight Rounding Strategy Helper
 */
export const roundWeight = (
  weight: number,
  strategy: WeightRoundingStrategy = 'UP_TO_NEXT_0_5'
): number => {
  if (weight <= 0) return 0.5;
  switch (strategy) {
    case 'UP_TO_NEXT_0_5':
      return Math.ceil(weight * 2) / 2;
    case 'UP_TO_NEXT_1':
      return Math.ceil(weight);
    case 'NONE':
      return Number(weight.toFixed(2));
    default:
      return Math.ceil(weight * 2) / 2;
  }
};

/**
 * Chargeable Weight Calculation
 * Chargeable Weight = MAX(Actual Weight * Count, Volumetric Weight)
 */
export const calculateChargeableWeight = (
  actualWeight: number,
  length: number,
  width: number,
  height: number,
  packageCount: number = 1,
  divisor: number = 5000,
  roundingStrategy: WeightRoundingStrategy = 'UP_TO_NEXT_0_5'
): { actualTotal: number; volumetricTotal: number; rawChargeable: number; roundedChargeable: number } => {
  const actualTotal = Number((actualWeight * packageCount).toFixed(2));
  const volumetricTotal = calculateVolumetricWeight(length, width, height, packageCount, divisor);
  const rawChargeable = Math.max(actualTotal, volumetricTotal);
  const roundedChargeable = roundWeight(rawChargeable, roundingStrategy);

  return {
    actualTotal,
    volumetricTotal,
    rawChargeable,
    roundedChargeable,
  };
};

/**
 * Demo Courier Rates Definition
 */
interface DemoCourierConfig {
  courierId: string;
  courierName: string;
  courierLogo: string;
  serviceId: string;
  serviceName: string;
  serviceType: 'Surface' | 'Express' | 'Air';
  baseRatePerKg: number;
  minBaseFreight: number;
  codPercent: number;
  minCodCharge: number;
  etaDaysMin: number;
  etaDaysMax: number;
  estimatedDays: string;
  cutoffTime: string;
  reliabilityScore: number;
}

const DEMO_COURIER_CONFIGS: DemoCourierConfig[] = [
  {
    courierId: 'delhivery',
    courierName: 'Delhivery',
    courierLogo: '📦',
    serviceId: 'delhivery-surface',
    serviceName: 'Surface Standard',
    serviceType: 'Surface',
    baseRatePerKg: 45,
    minBaseFreight: 60,
    codPercent: 0.018,
    minCodCharge: 35,
    etaDaysMin: 2,
    etaDaysMax: 4,
    estimatedDays: '2–4 days',
    cutoffTime: '17:00 PM',
    reliabilityScore: 94,
  },
  {
    courierId: 'delhivery',
    courierName: 'Delhivery',
    courierLogo: '📦',
    serviceId: 'delhivery-express',
    serviceName: 'Air Express',
    serviceType: 'Express',
 baseRatePerKg: 85,
    minBaseFreight: 110,
    codPercent: 0.02,
    minCodCharge: 45,
    etaDaysMin: 1,
    etaDaysMax: 2,
    estimatedDays: '1–2 days',
    cutoffTime: '18:30 PM',
    reliabilityScore: 98,
  },
  {
    courierId: 'bluedart',
    courierName: 'Blue Dart',
    courierLogo: '⚡',
    serviceId: 'bluedart-air',
    serviceName: 'Apex Air Express',
    serviceType: 'Express',
    baseRatePerKg: 95,
    minBaseFreight: 130,
    codPercent: 0.022,
    minCodCharge: 50,
    etaDaysMin: 1,
    etaDaysMax: 2,
    estimatedDays: '1–2 days',
    cutoffTime: '19:00 PM',
    reliabilityScore: 99,
  },
  {
    courierId: 'bluedart',
    courierName: 'Blue Dart',
    courierLogo: '⚡',
    serviceId: 'bluedart-surface',
    serviceName: 'Surface Cargo',
    serviceType: 'Surface',
    baseRatePerKg: 52,
    minBaseFreight: 75,
    codPercent: 0.02,
    minCodCharge: 40,
    etaDaysMin: 3,
    etaDaysMax: 5,
    estimatedDays: '3–5 days',
    cutoffTime: '16:30 PM',
    reliabilityScore: 95,
  },
  {
    courierId: 'shadowfax',
    courierName: 'Shadowfax',
    courierLogo: '🏍️',
    serviceId: 'shadowfax-surface',
    serviceName: 'Hyper Surface',
    serviceType: 'Surface',
    baseRatePerKg: 38,
    minBaseFreight: 50,
    codPercent: 0.015,
    minCodCharge: 30,
    etaDaysMin: 3,
    etaDaysMax: 5,
    estimatedDays: '3–5 days',
    cutoffTime: '16:00 PM',
    reliabilityScore: 90,
  },
  {
    courierId: 'xpressbees',
    courierName: 'Xpressbees',
    courierLogo: '🐝',
    serviceId: 'xpressbees-surface',
    serviceName: 'Surface Prime',
    serviceType: 'Surface',
    baseRatePerKg: 42,
    minBaseFreight: 55,
    codPercent: 0.016,
    minCodCharge: 32,
    etaDaysMin: 2,
    etaDaysMax: 4,
    estimatedDays: '2–4 days',
    cutoffTime: '17:30 PM',
    reliabilityScore: 92,
  },
  {
    courierId: 'dtdc',
    courierName: 'DTDC',
    courierLogo: '🚀',
    serviceId: 'dtdc-express',
    serviceName: 'Lite Express',
    serviceType: 'Express',
    baseRatePerKg: 78,
    minBaseFreight: 95,
    codPercent: 0.019,
    minCodCharge: 40,
    etaDaysMin: 2,
    etaDaysMax: 3,
    estimatedDays: '2–3 days',
    cutoffTime: '18:00 PM',
    reliabilityScore: 93,
  },
  {
    courierId: 'ecomexpress',
    courierName: 'Ecom Express',
    courierLogo: '🚚',
    serviceId: 'ecom-surface',
    serviceName: 'Ecom Direct',
    serviceType: 'Surface',
    baseRatePerKg: 40,
    minBaseFreight: 52,
    codPercent: 0.015,
    minCodCharge: 30,
    etaDaysMin: 3,
    etaDaysMax: 5,
    estimatedDays: '3–5 days',
    cutoffTime: '17:00 PM',
    reliabilityScore: 91,
  },
];

/**
 * Demo Rate Calculator Provider Engine
 */
export const demoRateCalculator = {
  getRates: (input: RateCalculationInput): NormalizedRate[] => {
    const {
      actualWeight,
      length,
      width,
      height,
      packageCount,
      paymentMode,
      declaredValue = 1000,
      codAmount = declaredValue,
      volumetricDivisor = 5000,
      roundingStrategy = 'UP_TO_NEXT_0_5',
    } = input;

    const { actualTotal, volumetricTotal, roundedChargeable } = calculateChargeableWeight(
      actualWeight,
      length,
      width,
      height,
      packageCount,
      volumetricDivisor,
      roundingStrategy
    );

    const calculatedRates: NormalizedRate[] = DEMO_COURIER_CONFIGS.map((cfg) => {
      // Base Freight calculation
      const calculatedBase = cfg.baseRatePerKg * roundedChargeable;
      const baseFreight = Math.max(cfg.minBaseFreight, Math.round(calculatedBase));

      // COD charge
      let codCharge = 0;
      if (paymentMode === 'COD') {
        const calculatedCod = codAmount * cfg.codPercent;
        codCharge = Math.max(cfg.minCodCharge, Math.round(calculatedCod));
      }

      // Fuel Surcharge (12%)
      const fuelSurcharge = Math.round(baseFreight * 0.12);

      // Other Charges (Handling / Docket)
      const otherCharges = 15;

      // Subtotal before tax
      const subtotal = baseFreight + codCharge + fuelSurcharge + otherCharges;

      // GST Tax (18%)
      const taxAmount = Math.round(subtotal * 0.18);

      const totalAmount = subtotal + taxAmount;

      return {
        id: `rate-${cfg.serviceId}-${Date.now()}`,
        courierId: cfg.courierId,
        courierName: cfg.courierName,
        courierLogo: cfg.courierLogo,
        serviceId: cfg.serviceId,
        serviceName: cfg.serviceName,
        serviceType: cfg.serviceType,
        actualWeight: actualTotal,
        volumetricWeight: volumetricTotal,
        chargeableWeight: roundedChargeable,
        breakdown: {
          baseFreight,
          codCharge,
          fuelSurcharge,
          otherCharges,
          taxAmount,
          totalAmount,
        },
        totalAmount,
        currency: 'INR',
        estimatedDays: cfg.estimatedDays,
        etaDaysMin: cfg.etaDaysMin,
        etaDaysMax: cfg.etaDaysMax,
        serviceable: true,
        recommended: false,
        cutoffTime: cfg.cutoffTime,
      };
    });

    // Mark recommendation based on balanced algorithm (price vs speed vs reliability)
    if (calculatedRates.length > 0) {
      // Find lowest cost and fastest
      let bestIndex = 0;
      let lowestScore = Infinity;

      calculatedRates.forEach((rate, idx) => {
        const cfg = DEMO_COURIER_CONFIGS.find((c) => c.serviceId === rate.serviceId);
        const rel = cfg ? cfg.reliabilityScore : 90;
        // Composite score: lower totalAmount + 30*etaDaysMin - 0.5*rel
        const score = rate.totalAmount + rate.etaDaysMin * 35 - rel * 0.5;
        if (score < lowestScore) {
          lowestScore = score;
          bestIndex = idx;
        }
      });

      calculatedRates[bestIndex].recommended = true;
      calculatedRates[bestIndex].recommendationReason = 'Optimal balance of fast delivery, high reliability rating, and cost efficiency.';
    }

    return calculatedRates;
  },
};

/**
 * Demo Serviceability Engine
 */
export const demoServiceabilityProvider = {
  checkServiceability: (input: ServiceabilityCheckInput): {
    results: NormalizedServiceability[];
    status: 'Serviceable' | 'Not Serviceable' | 'Partially Serviceable';
    message: string;
  } => {
    const { destinationPincode, paymentMode } = input;

    // Simulated non-serviceable pin rule (e.g. starting with 999 or 000)
    const isNonServiceable = destinationPincode.startsWith('999') || destinationPincode.startsWith('000');
    const isPartialServiceable = destinationPincode.startsWith('888');

    const results: NormalizedServiceability[] = DEMO_COURIER_CONFIGS.map((cfg) => {
      let available = !isNonServiceable;
      let codAvailable = available && paymentMode === 'COD';
      let prepaidAvailable = available;
      let message = 'Available for pickup & delivery';

      if (isNonServiceable) {
        available = false;
        codAvailable = false;
        prepaidAvailable = false;
        message = 'Destination pincode is outside courier delivery network.';
      } else if (isPartialServiceable && cfg.serviceType === 'Express') {
        available = false;
        codAvailable = false;
        prepaidAvailable = false;
        message = 'Express air delivery not available for remote location. Use Surface.';
      } else if (paymentMode === 'COD' && cfg.courierId === 'ecomexpress' && destinationPincode.endsWith('9')) {
        codAvailable = false;
        message = 'Prepaid orders only. COD not available for this pincode.';
      }

      return {
        courierId: cfg.courierId,
        courierName: cfg.courierName,
        courierLogo: cfg.courierLogo,
        serviceId: cfg.serviceId,
        serviceName: cfg.serviceName,
        serviceType: cfg.serviceType,
        available,
        codAvailable,
        prepaidAvailable,
        estimatedDays: cfg.estimatedDays,
        pickupAvailable: available,
        message,
        status: available ? 'Serviceable' : 'Not Serviceable',
      };
    });

    const availableCount = results.filter((r) => r.available).length;
    let status: 'Serviceable' | 'Not Serviceable' | 'Partially Serviceable' = 'Serviceable';
    let message = `Destination ${destinationPincode} is fully serviceable by ${availableCount} courier services.`;

    if (availableCount === 0) {
      status = 'Not Serviceable';
      message = `No courier partners currently service destination pincode ${destinationPincode}.`;
    } else if (availableCount < results.length) {
      status = 'Partially Serviceable';
      message = `Destination ${destinationPincode} is partially serviceable (${availableCount} of ${results.length} couriers available).`;
    }

    return {
      results,
      status,
      message,
    };
  },
};
