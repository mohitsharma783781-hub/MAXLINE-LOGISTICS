import type {
  B2CRateCard,
  B2CRateCalculateInput,
  B2CPricingResult,
} from '../types/b2cPricing';
import { DEMO_B2C_RATE_CARDS } from '../mocks/b2cPricing.mock';
import { ServiceabilityEngine } from './serviceabilityEngine';

export const B2CPricingEngine = {
  // Zone Resolution helper for B2C destination routes
  resolveB2CZone: (originPincode: string, destinationPincode: string, _courierId?: string): { zoneCode: string; zoneName: string } => {
    const orig = originPincode.trim();
    const dest = destinationPincode.trim();

    if (orig === dest) {
      return { zoneCode: 'LOCAL', zoneName: 'Within City (Local)' };
    }

    if (orig.substring(0, 2) === dest.substring(0, 2)) {
      return { zoneCode: 'WITHIN_STATE', zoneName: 'Within State' };
    }

    if (dest.startsWith('799') || dest.startsWith('190') || dest.startsWith('790')) {
      return { zoneCode: 'SPECIAL_ZONE', zoneName: 'Special / NE / J&K' };
    }

    if (
      (orig.startsWith('11') || orig.startsWith('40') || orig.startsWith('56') || orig.startsWith('70')) &&
      (dest.startsWith('11') || dest.startsWith('40') || dest.startsWith('56') || dest.startsWith('70'))
    ) {
      return { zoneCode: 'METRO', zoneName: 'Metro to Metro' };
    }

    if (orig.substring(0, 1) === dest.substring(0, 1)) {
      return { zoneCode: 'REGIONAL', zoneName: 'Regional Zone' };
    }

    return { zoneCode: 'REST_OF_INDIA', zoneName: 'Rest of India' };
  },

  // Calculate Volumetric Weight: (L * W * H * count) / divisor * 1000 grams
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

  // Core Reusable Server-Side B2C Calculation Service
  calculateB2CRate: (input: B2CRateCalculateInput): B2CPricingResult => {
    const b2cZone = B2CPricingEngine.resolveB2CZone(input.originPincode, input.destinationPincode, input.courierId);

    // 1. Check Serviceability
    const serviceabilityCheck = ServiceabilityEngine.checkServiceability({
      originPostalCode: input.originPincode,
      destinationPostalCode: input.destinationPincode,
      mode: 'B2C',
      paymentMode: input.paymentType,
    });

    const targetServiceable = serviceabilityCheck.find(
      (s) => (s.courierId === input.courierId || s.courierCode.toLowerCase() === input.courierId.toLowerCase()) && s.serviceable
    );

    if (!targetServiceable && serviceabilityCheck.every((s) => !s.serviceable)) {
      return {
        success: false,
        serviceable: false,
        reasonCode: 'SERVICE_NOT_AVAILABLE',
        rateCardId: '',
        rateCardName: 'N/A',
        rateCardVersion: '',
        isCustomerSellingCard: false,
        originPincode: input.originPincode,
        destinationPincode: input.destinationPincode,
        originZone: 'ORIGIN',
        destinationZone: 'DEST',
        matchedZoneCode: b2cZone.zoneCode,
        isODA: false,
        actualWeightGrams: input.actualWeightGrams,
        volumetricWeightGrams: 0,
        chargeableWeightGrams: input.actualWeightGrams,
        baseWeightGrams: 500,
        baseFreightPaise: 0,
        additionalWeightGrams: 500,
        additionalWeightUnits: 0,
        additionalWeightPaise: 0,
        codChargePaise: 0,
        fuelSurchargePaise: 0,
        odaChargePaise: 0,
        handlingChargePaise: 0,
        totalSurchargesPaise: 0,
        totalAmountPaise: 0,
        totalAmountINR: 0,
        currency: 'INR',
        snapshot: {},
        message: `Destination PIN ${input.destinationPincode} is not serviceable by courier ${input.courierId}`,
      };
    }

    // 2. Select Customer Assigned B2C Rate Card
    let rateCard: B2CRateCard | undefined;

    if (input.rateCardId) {
      rateCard = DEMO_B2C_RATE_CARDS.find((rc) => rc.id === input.rateCardId);
    } else if (input.tenantId) {
      rateCard = DEMO_B2C_RATE_CARDS.find(
        (rc) => rc.assignedTenantIds.includes(input.tenantId || '') || (rc.isCustomerSellingCard && rc.courierId === input.courierId)
      );
    }

    if (!rateCard) {
      rateCard = DEMO_B2C_RATE_CARDS.find((rc) => rc.courierId === input.courierId) || DEMO_B2C_RATE_CARDS[0];
    }

    // Protection against missing rate card
    if (!rateCard) {
      return {
        success: false,
        serviceable: false,
        reasonCode: 'NO_B2C_RATE_CARD_ASSIGNED',
        rateCardId: '',
        rateCardName: 'No B2C Rate Card Assigned',
        rateCardVersion: '',
        isCustomerSellingCard: false,
        originPincode: input.originPincode,
        destinationPincode: input.destinationPincode,
        originZone: 'ORIGIN',
        destinationZone: 'DEST',
        matchedZoneCode: b2cZone.zoneCode,
        isODA: false,
        actualWeightGrams: input.actualWeightGrams,
        volumetricWeightGrams: 0,
        chargeableWeightGrams: input.actualWeightGrams,
        baseWeightGrams: 500,
        baseFreightPaise: 0,
        additionalWeightGrams: 500,
        additionalWeightUnits: 0,
        additionalWeightPaise: 0,
        codChargePaise: 0,
        fuelSurchargePaise: 0,
        odaChargePaise: 0,
        handlingChargePaise: 0,
        totalSurchargesPaise: 0,
        totalAmountPaise: 0,
        totalAmountINR: 0,
        currency: 'INR',
        snapshot: {},
        message: 'No B2C rate card assigned to customer tenant.',
      };
    }

    // 3. Volumetric & Chargeable Weight Math
    const volumetricGrams = B2CPricingEngine.calculateVolumetricWeightGrams(
      input.lengthCm,
      input.widthCm,
      input.heightCm,
      input.packageCount,
      rateCard.volumetricDivisor
    );

    const chargeableWeightGrams = Math.max(input.actualWeightGrams, volumetricGrams);

    // 4. Lookup Zone Rate
    const matchedZoneRate = rateCard.zoneRates.find((zr) => zr.zoneCode === b2cZone.zoneCode) || rateCard.zoneRates[0];

    // 5. Base Freight & Additional Weight Increments
    const baseWeightGrams = rateCard.baseWeightGrams;
    const additionalWeightGrams = rateCard.additionalWeightGrams;

    const baseFreightPaise = matchedZoneRate.baseRatePaise;
    let additionalWeightUnits = 0;
    let additionalWeightPaise = 0;

    if (chargeableWeightGrams > baseWeightGrams) {
      const extraGrams = chargeableWeightGrams - baseWeightGrams;
      additionalWeightUnits = Math.ceil(extraGrams / additionalWeightGrams);
      additionalWeightPaise = additionalWeightUnits * matchedZoneRate.additionalRatePaise;
    }

    const subtotalFreightPaise = baseFreightPaise + additionalWeightPaise;

    // 6. COD Fee Math
    let codChargePaise = 0;
    if (input.paymentType === 'COD') {
      const codAmount = input.codAmountPaise || 0;
      let rawCod = 0;

      if (rateCard.codConfig.calcType === 'FIXED') {
        rawCod = rateCard.codConfig.value;
      } else if (rateCard.codConfig.calcType === 'PERCENTAGE' || rateCard.codConfig.calcType === 'HYBRID') {
        rawCod = Math.round((codAmount * rateCard.codConfig.value) / 100);
      }

      codChargePaise = Math.max(rawCod, rateCard.codConfig.minAmountPaise);
    }

    // 7. ODA Check & Charge
    const isODA = input.destinationPincode.startsWith('799') || input.destinationPincode.startsWith('190');
    const odaChargePaise = isODA ? rateCard.odaSurchargePaise : 0;

    // 8. Fuel Surcharge & Handling Fees
    const fuelSurchargePaise = Math.round((subtotalFreightPaise * rateCard.fuelSurchargePercent) / 100);
    const handlingChargePaise = rateCard.handlingChargePaise || 0;

    const totalSurchargesPaise = codChargePaise + odaChargePaise + fuelSurchargePaise + handlingChargePaise;
    const totalAmountPaise = subtotalFreightPaise + totalSurchargesPaise;

    // Build Immutable Snapshot
    const snapshot = {
      rateCardId: rateCard.id,
      rateCardName: rateCard.name,
      rateCardVersion: rateCard.version,
      matchedZoneCode: matchedZoneRate.zoneCode,
      matchedZoneName: matchedZoneRate.zoneName,
      isODA,
      actualWeightGrams: input.actualWeightGrams,
      volumetricWeightGrams: volumetricGrams,
      chargeableWeightGrams,
      baseWeightGrams,
      baseFreightPaise,
      additionalWeightGrams,
      additionalWeightUnits,
      additionalWeightPaise,
      codChargePaise,
      fuelSurchargePaise,
      odaChargePaise,
      handlingChargePaise,
      totalSurchargesPaise,
      totalAmountPaise,
      calculatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      serviceable: true,
      rateCardId: rateCard.id,
      rateCardName: rateCard.name,
      rateCardVersion: rateCard.version,
      isCustomerSellingCard: rateCard.isCustomerSellingCard,
      originPincode: input.originPincode,
      destinationPincode: input.destinationPincode,
      originZone: 'ORIGIN',
      destinationZone: 'DEST',
      matchedZoneCode: matchedZoneRate.zoneCode,
      isODA,
      actualWeightGrams: input.actualWeightGrams,
      volumetricWeightGrams: volumetricGrams,
      chargeableWeightGrams,
      baseWeightGrams,
      baseFreightPaise,
      additionalWeightGrams,
      additionalWeightUnits,
      additionalWeightPaise,
      codChargePaise,
      fuelSurchargePaise,
      odaChargePaise,
      handlingChargePaise,
      totalSurchargesPaise,
      totalAmountPaise,
      totalAmountINR: totalAmountPaise / 100,
      currency: 'INR',
      snapshot,
    };
  },
};
