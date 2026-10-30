import type {
  CostRateLookupInput,
  CostRateResult,
} from '../types/costRates';
import { ServiceabilityEngine } from './serviceabilityEngine';
import {
  DEMO_COST_RATE_CARDS,
  DEMO_WEIGHT_SLABS,
  DEMO_ZONE_RATES,
} from '../mocks/costRates.mock';

export const CostRateEngine = {
  getCourierCost: (input: CostRateLookupInput): CostRateResult[] => {
    const results: CostRateResult[] = [];

    // 1. Run Serviceability Check First
    const serviceabilityList = ServiceabilityEngine.checkServiceability({
      originPostalCode: input.originPostalCode,
      destinationPostalCode: input.destinationPostalCode,
      courierAccountId: input.courierAccountId,
      courierId: input.courierId,
      serviceId: input.serviceId,
      mode: input.mode,
      paymentMode: 'PREPAID',
    });

    for (const sres of serviceabilityList) {
      if (!sres.serviceable) {
        results.push({
          serviceable: false,
          courierId: sres.courierId,
          courierName: sres.courierName,
          serviceId: sres.serviceId,
          serviceName: sres.serviceName,
          chargeableWeightGrams: input.chargeableWeightGrams,
          baseFreightPaise: 0,
          additionalWeightPaise: 0,
          totalCostPaise: 0,
          currency: 'INR',
          reasonMessage: sres.reasonMessage || 'Unserviceable destination PIN',
        });
        continue;
      }

      // 2. Find matching active Cost Rate Card
      const rateCard = DEMO_COST_RATE_CARDS.find(
        (rc) =>
          (rc.courierId === sres.courierId || rc.courierId === sres.courierCode.toLowerCase()) &&
          rc.mode === input.mode &&
          rc.status === 'ACTIVE'
      );

      if (!rateCard) {
        results.push({
          serviceable: false,
          courierId: sres.courierId,
          courierName: sres.courierName,
          serviceId: sres.serviceId,
          serviceName: sres.serviceName,
          chargeableWeightGrams: input.chargeableWeightGrams,
          baseFreightPaise: 0,
          additionalWeightPaise: 0,
          totalCostPaise: 0,
          currency: 'INR',
          reasonMessage: `No active cost rate card configured for ${sres.courierName} (${input.mode})`,
        });
        continue;
      }

      const destZoneCode = (sres.destinationZone as string) || 'N1';
      const slabs = DEMO_WEIGHT_SLABS.filter((s) => s.rateCardId === rateCard.id);

      // 3. Find matching weight slab
      const weightGrams = input.chargeableWeightGrams;
      let matchedSlab = slabs.find(
        (s) => weightGrams >= s.minWeightGrams && weightGrams <= s.maxWeightGrams && s.slabType === 'BASE'
      );

      if (!matchedSlab) {
        matchedSlab = slabs.find((s) => s.slabType === 'BASE') || slabs[0];
      }

      // Look up base rate item
      const baseRateItem = DEMO_ZONE_RATES.find(
        (zr) => zr.rateCardId === rateCard.id && zr.zoneCode === destZoneCode && zr.slabId === matchedSlab?.id
      );

      let baseFreightPaise = baseRateItem ? baseRateItem.baseRatePaise : 4000;
      let additionalWeightPaise = 0;

      // Handle additional weight if chargeable weight exceeds base slab max
      if (matchedSlab && weightGrams > matchedSlab.maxWeightGrams) {
        const additionalSlab = slabs.find((s) => s.slabType === 'ADDITIONAL');
        const addlRateItem = DEMO_ZONE_RATES.find(
          (zr) => zr.rateCardId === rateCard.id && zr.zoneCode === destZoneCode && zr.slabId === additionalSlab?.id
        );

        if (addlRateItem && addlRateItem.additionalKgRatePaise) {
          const extraWeightGrams = weightGrams - matchedSlab.maxWeightGrams;
          const extraKg = Math.ceil(extraWeightGrams / 1000);
          additionalWeightPaise = extraKg * addlRateItem.additionalKgRatePaise;
        }
      }

      const totalCostPaise = baseFreightPaise + additionalWeightPaise;

      results.push({
        serviceable: true,
        courierId: sres.courierId,
        courierName: sres.courierName,
        serviceId: sres.serviceId,
        serviceName: sres.serviceName,
        rateCardId: rateCard.id,
        rateCardCode: rateCard.code,
        rateCardVersion: rateCard.version,
        originZone: sres.originZone as string,
        destinationZone: destZoneCode,
        weightSlabLabel: matchedSlab?.label || 'Base Slab',
        chargeableWeightGrams: weightGrams,
        baseFreightPaise,
        additionalWeightPaise,
        totalCostPaise,
        currency: 'INR',
        reasonMessage: 'Courier cost rate resolved',
      });
    }

    return results;
  },
};
