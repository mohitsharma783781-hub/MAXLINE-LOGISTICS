/**
 * Authoritative B2B Commercial Freight Pricing & Weight Engine
 * MAXLINE LOGISTICS
 */

export type WeightRoundingRule = 'ROUND_UP_1KG' | 'ROUND_UP_500G' | 'EXACT' | 'CEIL';

export type SurchargeCalcType =
  | 'FIXED'
  | 'PER_KG'
  | 'PERCENTAGE'
  | 'PERCENTAGE_OF_INVOICE'
  | 'PER_BOX'
  | 'PER_DAY_PER_KG'
  | 'HIGHER_OF_MIN_OR_VARIABLE'
  | 'INVOICE_PERCENTAGE';

export interface B2BDimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  packageCount?: number;
  weightPerBoxKg?: number;
}

export interface B2BZoneMatrix {
  [originZone: string]: {
    [destinationZone: string]: number; // Rate per KG in paise (e.g. 580 = ₹5.80/KG)
  };
}

export interface B2BSurchargeDefinition {
  id: string;
  name: string;
  code: string;
  calcType: SurchargeCalcType;
  value: number; // Percentage (e.g. 10 for 10%) or minor paise (e.g. 5000 for ₹50)
  minAmountPaise?: number;
  minAmountMinor?: number;
  maxAmountPaise?: number;
  status: 'ACTIVE' | 'INACTIVE';
  isPostShipment?: boolean;
  condition?: string;
  formulaDescription?: string;
}

export interface B2BEngineCalculationInput {
  originPincode: string;
  destinationPincode: string;
  actualWeightKg: number;
  dimensions?: B2BDimensions[];
  volumetricDivisor: number; // e.g. 5000, 4500, 4750, 4000
  minChargeableWeightKg: number; // e.g. 20 (20 KG min)
  minFreightChargePaise: number; // e.g. 35000 (₹350 min freight)
  weightRoundingRule: WeightRoundingRule;
  fuelSurchargePercent: number; // e.g. 13.5, 15.0
  docketChargePaise: number; // e.g. 6500 (₹65), 7500 (₹75)
  gstPercent: number; // e.g. 18.0
  zoneMatrix: B2BZoneMatrix;
  surcharges?: B2BSurchargeDefinition[];
  invoiceValueINR?: number;
  courierId?: string;
  pincodeZoneMapping?: Record<string, string>;
  markupType?: 'NONE' | 'PERCENTAGE' | 'FIXED_PER_KG' | 'FIXED_PER_DOCKET';
  markupValue?: number;
  isAppointmentRequested?: boolean;
  isOdaDelivery?: boolean;
}

export interface SurchargeBreakdownItem {
  code: string;
  name: string;
  amountPaise: number;
  amountINR: number;
  formula: string;
  isPostShipment?: boolean;
}

export interface AccessorialRuleSchedule {
  code: string;
  name: string;
  calcType: string;
  formulaDescription: string;
  isPostShipment: boolean;
  condition?: string;
}

export interface B2BEngineCalculationResult {
  originZone: string;
  destinationZone: string;
  totalBoxes: number;
  totalDeadWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  volumetricDivisorUsed: number;
  roundingRuleUsed: WeightRoundingRule;
  minWeightApplied: boolean;
  ratePerKgPaise: number;
  ratePerKgINR: number;
  rawFreightPaise: number;
  baseFreightPaise: number;
  baseFreightINR: number;
  minFreightApplied: boolean;
  docketChargePaise: number;
  docketChargeINR: number;
  fuelSurchargePaise: number;
  fuelSurchargeINR: number;
  additionalSurcharges: SurchargeBreakdownItem[];
  accessorialRulesSchedule: AccessorialRuleSchedule[];
  totalSurchargesPaise: number;
  totalSurchargesINR: number;
  subtotalPaise: number;
  subtotalINR: number;
  gstPercentUsed: number;
  gstAmountPaise: number;
  gstAmountINR: number;
  totalAmountPaise: number;
  totalAmountINR: number;
  markupDetails?: {
    markupType: string;
    markupValue: number;
    markupAmountINR: number;
    baseCostINR: number;
    sellingRateINR: number;
    grossMarginPercent: number;
  };
}

export const B2BPricingEngineService = {
  /**
   * Resolves B2B Zone from 6-digit Indian PIN code, with courier-specific overrides
   */
  resolveZoneFromPincode: (
    pincode: string,
    courierId?: string,
    customMapping?: Record<string, string>
  ): string => {
    const pin = (pincode || '').trim();
    if (!pin) return 'N1';

    // 1. Check exact custom pin mapping
    if (customMapping) {
      if (customMapping[pin]) return customMapping[pin].toUpperCase();
      const prefix2 = `prefix_${pin.slice(0, 2)}`;
      if (customMapping[prefix2]) return customMapping[prefix2].toUpperCase();
      const prefix3 = `prefix_${pin.slice(0, 3)}`;
      if (customMapping[prefix3]) return customMapping[prefix3].toUpperCase();
    }

    // 2. Standard 16-Zone Pincode Resolution
    if (pin.startsWith('173') || pin.startsWith('14') || pin.startsWith('16')) return 'N2';
    if (pin.startsWith('30') || pin.startsWith('31') || pin.startsWith('32')) return 'N3';
    if (pin.startsWith('11')) return 'N1'; // Delhi NCR
    if (pin.startsWith('17') || pin.startsWith('18') || pin.startsWith('19')) return 'N3';
    if (pin.startsWith('12') || pin.startsWith('13') || pin.startsWith('20')) return 'N4';
    if (pin.startsWith('45') || pin.startsWith('46')) return 'C1';
    if (pin.startsWith('49')) return 'C2';
    if (pin.startsWith('38') || pin.startsWith('39')) return 'W1'; // Gujarat
    if (pin.startsWith('40') || pin.startsWith('41')) return 'W2'; // Maharashtra / Mumbai
    if (pin.startsWith('56') || pin.startsWith('50')) return 'S1'; // Bangalore / Hyderabad
    if (pin.startsWith('68') || pin.startsWith('69')) return 'S2'; // Kerala
    if (pin.startsWith('60') || pin.startsWith('62')) return 'S3'; // Tamil Nadu / Chennai
    if (pin.startsWith('52') || pin.startsWith('53')) return 'S4'; // Andhra
    if (pin.startsWith('70') || pin.startsWith('71')) return 'E1'; // West Bengal / Kolkata
    if (pin.startsWith('75') || pin.startsWith('80')) return 'E2'; // Odisha / Bihar
    if (pin.startsWith('781')) return 'NE1'; // Assam / Guwahati
    if (pin.startsWith('78') || pin.startsWith('79')) return 'NE2'; // North East

    return 'N1';
  },

  /**
   * Calculate total volumetric weight in KG across all boxes:
   * Volumetric Weight (KG) = (Length × Width × Height × Quantity) / Volumetric Divisor
   */
  calculateVolumetricWeightKg: (
    dimensions: B2BDimensions[] = [],
    divisor = 4500
  ): { totalVolumetricKg: number; totalBoxes: number; hasBoxOver100Kg: boolean } => {
    const validDivisor = divisor > 0 ? divisor : 4500;
    let totalCm3 = 0;
    let totalBoxes = 0;
    let hasBoxOver100Kg = false;

    for (const box of dimensions) {
      const qty = Math.max(1, Number(box.packageCount) || 1);
      const l = Math.max(0, Number(box.lengthCm) || 0);
      const w = Math.max(0, Number(box.widthCm) || 0);
      const h = Math.max(0, Number(box.heightCm) || 0);
      const boxWeight = Number(box.weightPerBoxKg || 0);

      if (boxWeight > 100) {
        hasBoxOver100Kg = true;
      }

      totalBoxes += qty;
      totalCm3 += l * w * h * qty;
    }

    const totalVolumetricKg = totalCm3 > 0 ? Math.round((totalCm3 / validDivisor) * 100) / 100 : 0;

    return {
      totalVolumetricKg,
      totalBoxes: totalBoxes || 1,
      hasBoxOver100Kg
    };
  },

  /**
   * Apply weight rounding rule
   */
  applyWeightRounding: (weightKg: number, rule: WeightRoundingRule): number => {
    switch (rule) {
      case 'ROUND_UP_1KG':
      case 'CEIL':
        return Math.ceil(weightKg);
      case 'ROUND_UP_500G':
        return Math.ceil(weightKg * 2) / 2;
      case 'EXACT':
      default:
        return Math.round(weightKg * 100) / 100;
    }
  },

  /**
   * Calculate Authoritative B2B Freight, Additional Surcharges, GST, and Merchant Markups
   */
  calculate: (input: B2BEngineCalculationInput): B2BEngineCalculationResult => {
    const originZone = B2BPricingEngineService.resolveZoneFromPincode(
      input.originPincode,
      input.courierId,
      input.pincodeZoneMapping
    );
    const destinationZone = B2BPricingEngineService.resolveZoneFromPincode(
      input.destinationPincode,
      input.courierId,
      input.pincodeZoneMapping
    );

    // 1. Weight Math
    const { totalVolumetricKg, totalBoxes, hasBoxOver100Kg } = B2BPricingEngineService.calculateVolumetricWeightKg(
      input.dimensions || [],
      input.volumetricDivisor
    );

    const deadWeightKg = Math.max(0, Number(input.actualWeightKg) || 0);
    const higherWeightKg = Math.max(deadWeightKg, totalVolumetricKg);
    const roundedWeightKg = B2BPricingEngineService.applyWeightRounding(
      higherWeightKg,
      input.weightRoundingRule
    );

    const minChargeableKg = Math.max(0, input.minChargeableWeightKg || 0);
    const minWeightApplied = roundedWeightKg < minChargeableKg;
    const chargeableWeightKg = Math.max(roundedWeightKg, minChargeableKg);

    // 2. Zone Matrix Rate per KG Lookup
    const originMap = input.zoneMatrix?.[originZone];
    const ratePerKgPaise = originMap?.[destinationZone] ?? 0;

    if (!ratePerKgPaise || ratePerKgPaise <= 0) {
      throw new Error(`ZONE_ROUTE_NOT_CONFIGURED: Route ${originZone} → ${destinationZone} has no rate per kg configured in this rate card.`);
    }

    // 3. Freight Math
    const rawFreightPaise = Math.round(chargeableWeightKg * ratePerKgPaise);
    const minFreightPaise = Math.max(0, input.minFreightChargePaise || 0);
    const minFreightApplied = rawFreightPaise < minFreightPaise;
    const baseFreightPaise = Math.max(rawFreightPaise, minFreightPaise);

    // 4. Fixed Docket Charge
    const docketChargePaise = Math.max(0, input.docketChargePaise || 0);

    // 5. Fuel Surcharge
    const fuelPercent = Math.max(0, input.fuelSurchargePercent || 0);
    const fuelSurchargePaise = Math.round(baseFreightPaise * (fuelPercent / 100));

    // 6. Additional Configurable Surcharges & Accessorial Fees
    const additionalSurcharges: SurchargeBreakdownItem[] = [];
    const accessorialRulesSchedule: AccessorialRuleSchedule[] = [];
    let extraSurchargesPaise = 0;

    if (Array.isArray(input.surcharges)) {
      for (const sur of input.surcharges) {
        if (sur.status !== 'ACTIVE') continue;

        // Skip docket and fuel surcharge if they were already handled above to avoid duplicate charging
        if (sur.code === 'DOCKET' || sur.code === 'FUEL') {
          continue;
        }

        const isPost = !!sur.isPostShipment;
        const minAmountPaise = sur.minAmountMinor ?? sur.minAmountPaise ?? 0;

        // Always add to accessorial schedule
        accessorialRulesSchedule.push({
          code: sur.code,
          name: sur.name,
          calcType: sur.calcType,
          formulaDescription: sur.formulaDescription || `${sur.calcType}: ${sur.value}`,
          isPostShipment: isPost,
          condition: sur.condition
        });

        // If post-shipment (e.g. Demurrage, Reattempts, Return labels, Address correction), do NOT bill in upfront quote
        if (isPost) {
          continue;
        }

        // Check conditional charges
        if (sur.condition === 'ODA_DESTINATION' && !input.isOdaDelivery) {
          continue;
        }
        if (sur.condition === 'APPOINTMENT_REQUESTED' && !input.isAppointmentRequested) {
          continue;
        }
        if (sur.condition === 'SINGLE_BOX_EXCEEDS_100KG' && !hasBoxOver100Kg) {
          continue;
        }

        let chargePaise = 0;
        let formula = '';

        if (sur.calcType === 'FIXED') {
          chargePaise = sur.value;
          formula = `₹${(sur.value / 100).toFixed(2)} Flat`;
        } else if (sur.calcType === 'PER_KG') {
          chargePaise = Math.round(chargeableWeightKg * sur.value);
          formula = `₹${(sur.value / 100).toFixed(2)}/KG × ${chargeableWeightKg} KG`;
        } else if (sur.calcType === 'PER_BOX') {
          chargePaise = Math.round(totalBoxes * sur.value);
          formula = `₹${(sur.value / 100).toFixed(2)}/box × ${totalBoxes} boxes`;
        } else if (sur.calcType === 'PERCENTAGE') {
          chargePaise = Math.round(baseFreightPaise * (sur.value / 100));
          formula = `${sur.value}% of Base Freight`;
        } else if (sur.calcType === 'PERCENTAGE_OF_INVOICE' || sur.calcType === 'INVOICE_PERCENTAGE') {
          const invPaise = (input.invoiceValueINR || 0) * 100;
          chargePaise = Math.round(invPaise * (sur.value / 100));
          formula = `${sur.value}% of Invoice Value`;
        } else if (sur.calcType === 'HIGHER_OF_MIN_OR_VARIABLE') {
          // If code is FOV, variable is invoice value %
          if (sur.code === 'FOV' || sur.name.toLowerCase().includes('fov') || sur.name.toLowerCase().includes('insurance')) {
            const invPaise = (input.invoiceValueINR || 0) * 100;
            const variablePaise = Math.round(invPaise * (sur.value / 100));
            chargePaise = Math.max(minAmountPaise, variablePaise);
            formula = `Higher of ₹${(minAmountPaise / 100).toFixed(2)} or ${sur.value}% invoice (₹${(variablePaise / 100).toFixed(2)})`;
          } else {
            // Variable is per-KG
            const variablePaise = Math.round(chargeableWeightKg * sur.value);
            chargePaise = Math.max(minAmountPaise, variablePaise);
            formula = `Higher of ₹${(minAmountPaise / 100).toFixed(2)} or ₹${(sur.value / 100).toFixed(2)}/KG (₹${(variablePaise / 100).toFixed(2)})`;
          }
        }

        // Apply min/max bounds if defined
        if (minAmountPaise > 0 && chargePaise < minAmountPaise) {
          chargePaise = minAmountPaise;
          formula += ` (Min Applied: ₹${(minAmountPaise / 100).toFixed(2)})`;
        }
        if (sur.maxAmountPaise && chargePaise > sur.maxAmountPaise) {
          chargePaise = sur.maxAmountPaise;
          formula += ` (Max Capped: ₹${(sur.maxAmountPaise / 100).toFixed(2)})`;
        }

        if (chargePaise > 0) {
          extraSurchargesPaise += chargePaise;
          additionalSurcharges.push({
            code: sur.code,
            name: sur.name,
            amountPaise: chargePaise,
            amountINR: chargePaise / 100,
            formula,
            isPostShipment: false
          });
        }
      }
    }

    const totalSurchargesPaise = docketChargePaise + fuelSurchargePaise + extraSurchargesPaise;

    // 7. Base Subtotal before GST
    let subtotalPaise = baseFreightPaise + totalSurchargesPaise;

    // 8. Merchant Markup Layer (Cost vs Selling Rate)
    let markupPaise = 0;
    let markupDetails: B2BEngineCalculationResult['markupDetails'] = undefined;

    if (input.markupType && input.markupType !== 'NONE' && input.markupValue && input.markupValue > 0) {
      if (input.markupType === 'PERCENTAGE') {
        markupPaise = Math.round(baseFreightPaise * (input.markupValue / 100));
      } else if (input.markupType === 'FIXED_PER_KG') {
        markupPaise = Math.round(chargeableWeightKg * (input.markupValue * 100));
      } else if (input.markupType === 'FIXED_PER_DOCKET') {
        markupPaise = Math.round(input.markupValue * 100);
      }

      const baseCostINR = subtotalPaise / 100;
      subtotalPaise += markupPaise;
      const sellingRateINR = subtotalPaise / 100;
      const markupAmountINR = markupPaise / 100;
      const grossMarginPercent = sellingRateINR > 0 ? Math.round((markupAmountINR / sellingRateINR) * 10000) / 100 : 0;

      markupDetails = {
        markupType: input.markupType,
        markupValue: input.markupValue,
        markupAmountINR,
        baseCostINR,
        sellingRateINR,
        grossMarginPercent
      };
    }

    // 9. Authoritative GST
    const gstPercentUsed = Math.max(0, input.gstPercent || 0);
    const gstAmountPaise = Math.round(subtotalPaise * (gstPercentUsed / 100));

    // 10. Grand Total
    const totalAmountPaise = subtotalPaise + gstAmountPaise;

    return {
      originZone,
      destinationZone,
      totalBoxes,
      totalDeadWeightKg: deadWeightKg,
      volumetricWeightKg: totalVolumetricKg,
      chargeableWeightKg,
      volumetricDivisorUsed: input.volumetricDivisor,
      roundingRuleUsed: input.weightRoundingRule,
      minWeightApplied,
      ratePerKgPaise,
      ratePerKgINR: ratePerKgPaise / 100,
      rawFreightPaise,
      baseFreightPaise,
      baseFreightINR: baseFreightPaise / 100,
      minFreightApplied,
      docketChargePaise,
      docketChargeINR: docketChargePaise / 100,
      fuelSurchargePaise,
      fuelSurchargeINR: fuelSurchargePaise / 100,
      additionalSurcharges,
      accessorialRulesSchedule,
      totalSurchargesPaise,
      totalSurchargesINR: totalSurchargesPaise / 100,
      subtotalPaise,
      subtotalINR: subtotalPaise / 100,
      gstPercentUsed,
      gstAmountPaise,
      gstAmountINR: gstAmountPaise / 100,
      totalAmountPaise,
      totalAmountINR: totalAmountPaise / 100,
      markupDetails
    };
  }
};
