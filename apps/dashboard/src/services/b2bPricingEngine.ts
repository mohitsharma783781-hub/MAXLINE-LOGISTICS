import type {
  B2BRateCard,
  B2BPricingInput,
  B2BPricingResult,
  B2BSurchargeLineItem,
} from '../types/b2bPricing';
import { DEMO_B2B_RATE_CARDS } from '../mocks/b2bPricing.mock';
import { ServiceabilityEngine } from './serviceabilityEngine';

export interface B2BRateCalculateInput {
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
  invoiceValuePaise?: number;
  codAmountPaise?: number;
  enableInsurance?: boolean;
  rateCardId?: string;
}

export const B2BPricingEngine = {
  // Pincode to 16-Zone Resolution Helper
  resolveZoneFromPincode: (pincode: string, _courierId?: string): string => {
    const cleanPin = pincode.trim();

    if (cleanPin.startsWith('173') || cleanPin.startsWith('14') || cleanPin.startsWith('16')) return 'N2';
    if (cleanPin.startsWith('30') || cleanPin.startsWith('31') || cleanPin.startsWith('32')) return 'N3';
    if (cleanPin.startsWith('11')) return 'N1';
    if (cleanPin.startsWith('17') || cleanPin.startsWith('18') || cleanPin.startsWith('19')) return 'N3';
    if (cleanPin.startsWith('12') || cleanPin.startsWith('13') || cleanPin.startsWith('20')) return 'N4';
    if (cleanPin.startsWith('45') || cleanPin.startsWith('46')) return 'C1';
    if (cleanPin.startsWith('49')) return 'C2';
    if (cleanPin.startsWith('38') || cleanPin.startsWith('39')) return 'W1';
    if (cleanPin.startsWith('40') || cleanPin.startsWith('41')) return 'W2';
    if (cleanPin.startsWith('56') || cleanPin.startsWith('50')) return 'S1';
    if (cleanPin.startsWith('68') || cleanPin.startsWith('69')) return 'S2';
    if (cleanPin.startsWith('60') || cleanPin.startsWith('62')) return 'S3';
    if (cleanPin.startsWith('52') || cleanPin.startsWith('53')) return 'S4';
    if (cleanPin.startsWith('70') || cleanPin.startsWith('71')) return 'E1';
    if (cleanPin.startsWith('75') || cleanPin.startsWith('80')) return 'E2';
    if (cleanPin.startsWith('781')) return 'NE1';
    if (cleanPin.startsWith('78') || cleanPin.startsWith('79')) return 'NE2';

    return 'N1';
  },

  // Volumetric Weight Calculation: (L * W * H * count) / divisor * 1000 grams
  calculateVolumetricWeightGrams: (
    lengthCm = 10,
    widthCm = 10,
    heightCm = 10,
    packageCount = 1,
    divisor = 5000
  ): number => {
    const cm3 = lengthCm * widthCm * heightCm * packageCount;
    return Math.round((cm3 / divisor) * 1000);
  },

  // Calculate B2B Freight + Surcharges Rate Engine
  calculateB2BRate: (input: B2BRateCalculateInput): B2BPricingResult => {
    const originZone = B2BPricingEngine.resolveZoneFromPincode(input.originPincode, input.courierId);
    const destinationZone = B2BPricingEngine.resolveZoneFromPincode(input.destinationPincode, input.courierId);

    // 1. Check Serviceability & ODA Status
    const isODA = input.destinationPincode.startsWith('799') || input.destinationPincode.startsWith('190');
    const serviceabilityCheck = ServiceabilityEngine.checkServiceability({
      originPostalCode: input.originPincode,
      destinationPostalCode: input.destinationPincode,
      mode: 'B2B',
      paymentMode: input.codAmountPaise && input.codAmountPaise > 0 ? 'COD' : 'PREPAID',
    });

    const isServiceable = serviceabilityCheck.some((s) => s.serviceable);

    // 2. Select Customer Assigned Rate Card
    let rateCard: B2BRateCard | undefined;

    if (input.rateCardId) {
      rateCard = DEMO_B2B_RATE_CARDS.find((rc) => rc.id === input.rateCardId);
    } else if (input.tenantId) {
      rateCard = DEMO_B2B_RATE_CARDS.find(
        (rc) => rc.tenantId === input.tenantId || (rc.isCustomerSellingCard && rc.courierId === input.courierId)
      );
    }

    if (!rateCard) {
      rateCard = DEMO_B2B_RATE_CARDS.find((rc) => rc.courierId === input.courierId) || DEMO_B2B_RATE_CARDS[0];
    }

    if (!rateCard) {
      return {
        success: false,
        serviceable: false,
        rateCardId: '',
        rateCardName: 'No B2B Rate Card Assigned',
        rateCardVersion: '',
        isCustomerSellingCard: false,
        originPincode: input.originPincode,
        originZone,
        destinationPincode: input.destinationPincode,
        destinationZone,
        actualWeightGrams: input.actualWeightGrams,
        chargeableWeightGrams: input.actualWeightGrams,
        billableWeightGrams: input.actualWeightGrams,
        volumetricDivisor: 5000,
        matchedSlabLabel: 'None',
        baseRatePerKgPaise: 0,
        baseFreightPaise: 0,
        additionalWeightPaise: 0,
        surcharges: [],
        totalSurchargesPaise: 0,
        totalAmountPaise: 0,
        totalAmountINR: 0,
        currency: 'INR',
        snapshot: {},
        message: 'No B2B rate card assigned to customer tenant.',
      };
    }

    const divisor = rateCard.volumetricDivisor || 5000;

    // 3. Volumetric & Chargeable Weight Math
    const volumetricGrams = B2BPricingEngine.calculateVolumetricWeightGrams(
      input.lengthCm || 0,
      input.widthCm || 0,
      input.heightCm || 0,
      input.packageCount || 1,
      divisor
    );

    const chargeableGrams = Math.max(input.actualWeightGrams, volumetricGrams);
    const chargeableKg = chargeableGrams / 1000;

    // 4. Lookup Matrix Map (Origin Zone × Destination Zone) Rate Per KG
    let ratePerKgPaise = 530; // default ₹5.30/KG
    if (rateCard.matrixMap && rateCard.matrixMap[originZone] && rateCard.matrixMap[originZone][destinationZone]) {
      ratePerKgPaise = rateCard.matrixMap[originZone][destinationZone];
    }

    // 5. Basic Freight & Minimum Freight (Minimum Bilty) Rule Evaluation
    // Raw calculated freight = Chargeable KG * Rate per KG
    const rawFreightPaise = Math.round(chargeableKg * ratePerKgPaise);
    const minFreightPaise = rateCard.minFreightPaise || 35000; // ₹350 minimum freight rule
    const baseFreightPaise = Math.max(rawFreightPaise, minFreightPaise);

    const additionalWeightPaise = 0;

    // 6. Surcharges Evaluation in Exact Order
    const invoiceValuePaise = input.invoiceValuePaise || 5000;
    const codAmountPaise = input.codAmountPaise || 0;
    const surchargeLines: B2BSurchargeLineItem[] = [];

    rateCard.surcharges.forEach((sur) => {
      if (sur.status !== 'ACTIVE') return;

      // Filter ROV / Insurance if not enabled by user
      if ((sur.code === 'ROV' || sur.code === 'INSURANCE') && !input.enableInsurance) {
        return;
      }

      let rawAmount = 0;
      let details = '';

      if (sur.calcType === 'PER_DOCKET' || sur.calcType === 'FIXED') {
        rawAmount = sur.value;
        details = `Flat ${sur.name}`;
      } else if (sur.calcType === 'PER_KG' || sur.code === 'HANDLING') {
        rawAmount = Math.round(chargeableKg * sur.value);
        details = `₹${(sur.value / 100).toFixed(2)}/KG × ${chargeableKg} KG`;
      } else if (sur.calcType === 'PERCENTAGE' || sur.code === 'FUEL') {
        rawAmount = Math.round((baseFreightPaise * sur.value) / 100);
        details = `${sur.value}% of base freight`;
      } else if (sur.calcType === 'PERCENTAGE_OF_INVOICE_VALUE' || sur.code === 'ROV' || sur.code === 'INSURANCE') {
        rawAmount = Math.round((invoiceValuePaise * sur.value) / 100);
        details = `${sur.value}% of invoice value`;
      } else if (sur.calcType === 'PERCENTAGE_OF_COD' || sur.code === 'COD') {
        if (codAmountPaise > 0) {
          rawAmount = Math.round((codAmountPaise * sur.value) / 100);
          details = `${sur.value}% of COD amount`;
        }
      } else if (sur.calcType === 'PER_SHIPMENT' || sur.code === 'FM') {
        rawAmount = sur.value;
        details = `First Mile pickup charge`;
      }

      // Apply Minimum Rule for Surcharge
      let finalAmount = rawAmount;
      if (sur.minAmountPaise && finalAmount < sur.minAmountPaise && (rawAmount > 0 || sur.calcType === 'PER_DOCKET' || sur.calcType === 'PER_SHIPMENT')) {
        finalAmount = sur.minAmountPaise;
        details += ` (Min ₹${(sur.minAmountPaise / 100).toFixed(2)})`;
      }

      if (finalAmount > 0) {
        surchargeLines.push({
          name: sur.name,
          code: sur.code,
          calcType: sur.calcType,
          computedAmountPaise: finalAmount,
          details,
        });
      }
    });

    if (isODA) {
      surchargeLines.push({
        name: 'ODA (Out of Delivery Area) Surcharge',
        code: 'ODA',
        calcType: 'FIXED',
        computedAmountPaise: 7500,
        details: 'Destination PIN is in ODA list',
      });
    }

    const totalSurchargesPaise = surchargeLines.reduce((sum, line) => sum + line.computedAmountPaise, 0);
    const taxableSubtotalPaise = baseFreightPaise + additionalWeightPaise + totalSurchargesPaise;

    // 7. GST Calculation
    const gstPercent = rateCard.gstPercent || 18;
    const taxAmountPaise = Math.round((taxableSubtotalPaise * gstPercent) / 100);
    const totalAmountPaise = taxableSubtotalPaise + taxAmountPaise;

    // Build Immutable Snapshot
    const snapshot = {
      rateCardId: rateCard.id,
      rateCardName: rateCard.name,
      rateCardVersion: rateCard.version,
      volumetricDivisor: divisor,
      originZone,
      destinationZone,
      isODA,
      billableWeightGrams: chargeableGrams,
      baseRatePerKgPaise: ratePerKgPaise,
      rawFreightPaise,
      minFreightPaise,
      baseFreightPaise,
      additionalWeightPaise,
      surcharges: surchargeLines,
      totalSurchargesPaise,
      taxableSubtotalPaise,
      gstPercent,
      taxAmountPaise,
      totalAmountPaise,
      calculatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      serviceable: isServiceable,
      rateCardId: rateCard.id,
      rateCardName: rateCard.name,
      rateCardVersion: rateCard.version,
      isCustomerSellingCard: rateCard.isCustomerSellingCard,
      originPincode: input.originPincode,
      originZone,
      destinationPincode: input.destinationPincode,
      destinationZone,
      actualWeightGrams: input.actualWeightGrams,
      chargeableWeightGrams: chargeableGrams,
      billableWeightGrams: chargeableGrams,
      volumetricDivisor: divisor,
      matchedSlabLabel: `${chargeableKg} KG Chargeable`,
      baseRatePerKgPaise: ratePerKgPaise,
      baseFreightPaise,
      additionalWeightPaise,
      surcharges: surchargeLines,
      totalSurchargesPaise,
      totalAmountPaise,
      totalAmountINR: totalAmountPaise / 100,
      currency: 'INR',
      snapshot,
    };
  },

  calculateB2BPrice: (input: B2BPricingInput): B2BPricingResult => {
    return B2BPricingEngine.calculateB2BRate({
      rateCardId: input.rateCardId,
      tenantId: input.tenantId,
      courierId: input.courierId,
      originPincode: input.originPincode,
      destinationPincode: input.destinationPincode,
      actualWeightGrams: input.actualWeightGrams,
      invoiceValuePaise: input.invoiceValuePaise,
      codAmountPaise: input.codAmountPaise,
      packageCount: input.packageCount,
    });
  },
};
