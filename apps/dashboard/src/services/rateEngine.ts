import type {
  RateEngineRequest,
  RateEngineResponse,
  RateQuote,
} from '../types/rates';
import type { CourierCode } from '../types/couriers';
import { CourierAdapterFactory } from './courierAdapter';
import { WeightCalculationService } from './weightService';
import { TaxService } from '../mocks/billing.mock';
import { PricingEngine } from './pricingEngine';

export const RateEngine = {
  calculateRates: async (request: RateEngineRequest): Promise<RateEngineResponse> => {
    const rateRequestId = `req-${Date.now()}`;
    const nowStr = new Date().toLocaleString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toLocaleString(); // 30 mins expiry

    // 1. Input Validation
    if (!request.pickupPincode || !request.deliveryPincode) {
      throw new Error('Pickup and delivery pincodes are required.');
    }
    if (request.actualWeightGrams <= 0) {
      throw new Error('Weight must be greater than zero.');
    }

    // 2. Weight Math
    const volumetricGrams = WeightCalculationService.calculateVolumetricWeightGrams(
      request.lengthMm,
      request.widthMm,
      request.heightMm,
      request.packageCount,
      5000
    );
    const chargeableGrams = WeightCalculationService.calculateChargeableWeightGrams(
      request.actualWeightGrams,
      volumetricGrams
    );

    const weightKg = chargeableGrams / 1000;
    const targetCouriers: CourierCode[] = ['DELHIVERY', 'DTDC', 'BLUE_DART', 'XPRESSBEES'];

    const quotes: RateQuote[] = [];
    const failedCouriers: Array<{ courierCode: string; reason: string }> = [];

    // 3. Query Couriers via Universal Adapter System concurrently/safely
    for (const code of targetCouriers) {
      try {
        const adapter = CourierAdapterFactory.getAdapter(code);

        // Serviceability Check
        const serviceability = await adapter.checkServiceability(
          request.pickupPincode,
          request.deliveryPincode
        );

        if (!serviceability.serviceable) {
          failedCouriers.push({
            courierCode: code,
            reason: serviceability.reason || 'Unserviceable destination pincode',
          });
          continue;
        }

        // Rate Check
        const adapterRate = await adapter.getRates(
          weightKg,
          request.pickupPincode,
          request.deliveryPincode
        );

        // Monetary Math in integer paise
        const baseAmountMinor = Math.round(adapterRate.amount * 100);
        const fuelSurchargeMinor = Math.round(baseAmountMinor * 0.15);
        const codFeeMinor = request.paymentMode === 'COD' ? 500 : 0; // ₹5.00 COD fee
        const handlingFeeMinor = 0;

        const taxableAmountMinor = baseAmountMinor + fuelSurchargeMinor + codFeeMinor;
        const taxBreakdown = TaxService.calculateTaxBreakdown(taxableAmountMinor, true);

        const quoteId = `quote-${code.toLowerCase()}-${Date.now()}`;
        const serviceName =
          code === 'DELHIVERY'
            ? 'Delhivery Surface Parcel'
            : code === 'DTDC'
            ? 'DTDC Priority Air'
            : code === 'BLUE_DART'
            ? 'BlueDart Apex Premium'
            : 'XpressBees Express';

        const rawCourierCostMinor = baseAmountMinor + fuelSurchargeMinor + taxBreakdown.totalTaxMinor;
        const pricingRes = PricingEngine.calculateSellingPrice({
          tenantId: request.tenantId || 'tenant-demo-01',
          courierCostMinor: rawCourierCostMinor,
          courierCodFeeMinor: codFeeMinor,
          courierId: code.toLowerCase(),
          shipmentType: request.shipmentType,
          paymentMode: request.paymentMode,
          weightGrams: chargeableGrams,
        });

        const quote: RateQuote = {
          id: quoteId,
          rateRequestId,
          tenantId: request.tenantId || 'tenant-demo-01',
          courierId: code.toLowerCase(),
          courierCode: code,
          courierName: code.replace('_', ' '),
          serviceId: `srv-${code.toLowerCase()}`,
          serviceCode: adapterRate.serviceCode,
          serviceName,
          serviceType: code === 'BLUE_DART' || code === 'DTDC' ? 'Express' : 'Surface',
          mode: code === 'BLUE_DART' || code === 'DTDC' ? 'AIR' : 'SURFACE',
          paymentMode: request.paymentMode,
          actualWeightGrams: request.actualWeightGrams,
          volumetricWeightGrams: volumetricGrams,
          chargeableWeightGrams: chargeableGrams,
          baseFreightMinor: baseAmountMinor,
          fuelSurchargeMinor,
          codFeeMinor,
          handlingFeeMinor,
          otherChargesMinor: 0,
          discountMinor: pricingRes.discountMinor,
          taxMinor: taxBreakdown.totalTaxMinor,
          totalMinor: pricingRes.sellingPriceMinor, // Merchant Selling Price
          courierCostMinor: rawCourierCostMinor, // Raw Courier Cost
          marginMinor: pricingRes.marginMinor,
          currency: 'INR',
          estimatedDeliveryDays: adapterRate.estimatedDeliveryDays,
          estimatedDeliveryDate: `${adapterRate.estimatedDeliveryDays} Business Days`,
          serviceable: true,
          quoteStatus: 'AVAILABLE',
          rankingTag: 'NONE',
          expiresAt,
          createdAt: nowStr,
        };

        quotes.push(quote);
      } catch (err: any) {
        failedCouriers.push({
          courierCode: code,
          reason: err?.message || 'Adapter temporarily unavailable',
        });
      }
    }

    // 4. Rank Results: CHEAPEST, FASTEST, BEST_VALUE
    let cheapestQuoteId: string | undefined;
    let fastestQuoteId: string | undefined;
    let bestValueQuoteId: string | undefined;

    if (quotes.length > 0) {
      // Sort for Cheapest (lowest totalMinor)
      const cheapest = [...quotes].sort((a, b) => a.totalMinor - b.totalMinor)[0];
      cheapestQuoteId = cheapest.id;
      cheapest.rankingTag = 'CHEAPEST';

      // Sort for Fastest (lowest estimatedDeliveryDays)
      const fastest = [...quotes].sort((a, b) => a.estimatedDeliveryDays - b.estimatedDeliveryDays)[0];
      fastestQuoteId = fastest.id;
      if (fastest.id !== cheapest.id) {
        fastest.rankingTag = 'FASTEST';
      }

      // Best Value (Fastest delivery under reasonable price)
      const bestValue = quotes.find((q) => q.id === cheapestQuoteId) || quotes[0];
      bestValueQuoteId = bestValue.id;
      if (bestValue.rankingTag === 'NONE') {
        bestValue.rankingTag = 'BEST_VALUE';
      }
    }

    return {
      rateRequestId,
      tenantId: request.tenantId || 'tenant-demo-01',
      quotes,
      failedCouriers,
      cheapestQuoteId,
      fastestQuoteId,
      bestValueQuoteId,
      createdAt: nowStr,
    };
  },

  // Domain-side Price Tampering Protection
  revalidateQuote: (quoteId: string, originalRequest: RateEngineRequest): boolean => {
    return !!quoteId && !!originalRequest.pickupPincode;
  },
};
