import crypto from 'crypto';
import { prisma } from '../db';

export interface StoredQuote {
  quoteId: string;
  expiresAt: string;
  createdAt: string;
  merchantId?: string;
  courierId: string;
  courierName: string;
  serviceId: string;
  serviceName: string;
  rateCardId: string;
  rateCardName: string;
  rateCardVersion: string;
  originPincode: string;
  destinationPincode: string;
  originZone: string;
  destinationZone: string;
  deadWeightKg: number;
  chargeableWeightKg: number;
  dimensions?: any[];
  invoiceValueINR?: number;
  customerRatePerKgINR: number;
  customerFreightINR: number;
  customerDocketChargeINR: number;
  customerFuelSurchargeINR: number;
  customerFuelSurchargePercent: number;
  customerApplicableCharges: Array<{ name: string; amountINR: number }>;
  gstPercent: number;
  gstAmountINR: number;
  finalPayableAmountINR: number;
  estimatedDeliveryDays?: string;
  hasVerifiedTransitData?: boolean;
  verifiedTransitDaysNum?: number;
  status?: string;
  usedAt?: string | null;
  shipmentId?: string | null;
  // Internal tracking (stored in database only; never leaked to merchants)
  baseCostINR?: number;
  markupAmountINR?: number;
  grossMarginPercent?: number;
}

const QUOTE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function mapDbQuoteToStoredQuote(q: any): StoredQuote {
  return {
    quoteId: q.quote_token,
    expiresAt: q.expires_at instanceof Date ? q.expires_at.toISOString() : String(q.expires_at),
    createdAt: q.created_at instanceof Date ? q.created_at.toISOString() : String(q.created_at),
    merchantId: q.merchant_id || undefined,
    courierId: q.courier_id,
    courierName: q.courier_name,
    serviceId: q.service_id,
    serviceName: q.service_name,
    rateCardId: q.rate_card_id,
    rateCardName: q.rate_card_name,
    rateCardVersion: q.rate_card_version,
    originPincode: q.origin_pincode,
    destinationPincode: q.destination_pincode,
    originZone: q.origin_zone,
    destinationZone: q.destination_zone,
    deadWeightKg: Number(q.dead_weight_kg),
    chargeableWeightKg: Number(q.chargeable_weight_kg),
    dimensions: (q.dimensions as any) || [],
    invoiceValueINR: Number(q.invoice_value_inr || 0),
    customerRatePerKgINR: Number(q.customer_rate_per_kg_inr),
    customerFreightINR: Number(q.customer_freight_inr),
    customerDocketChargeINR: Number(q.customer_docket_charge_inr),
    customerFuelSurchargeINR: Number(q.customer_fuel_surcharge_inr),
    customerFuelSurchargePercent: Number(q.customer_fuel_surcharge_pct),
    customerApplicableCharges: (q.customer_applicable_charges as any) || [],
    gstPercent: Number(q.gst_percent),
    gstAmountINR: Number(q.gst_amount_inr),
    finalPayableAmountINR: Number(q.final_payable_amount_inr),
    estimatedDeliveryDays: q.estimated_delivery_days || undefined,
    hasVerifiedTransitData: Boolean(q.has_verified_transit_data),
    status: q.status,
    usedAt: q.used_at ? (q.used_at instanceof Date ? q.used_at.toISOString() : String(q.used_at)) : null,
    shipmentId: q.shipment_id || null,
    baseCostINR: q.base_cost_inr !== null ? Number(q.base_cost_inr) : undefined,
    markupAmountINR: q.markup_amount_inr !== null ? Number(q.markup_amount_inr) : undefined,
    grossMarginPercent: q.gross_margin_percent !== null ? Number(q.gross_margin_percent) : undefined,
  };
}

export const B2BQuoteManagerService = {
  /**
   * Creates a cryptographically unique quote token and stores it in Supabase Postgres.
   * Survives API server restarts and is durable.
   */
  createQuote: async (
    data: Omit<StoredQuote, 'quoteId' | 'expiresAt' | 'createdAt' | 'status'> & {
      merchantId?: string;
      dimensions?: any[];
      invoiceValueINR?: number;
    }
  ): Promise<StoredQuote> => {
    const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    const quoteId = `B2B-QTE-${data.courierId.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}-${randomSuffix}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + QUOTE_TTL_MS);

    const dbRecord = await prisma.b2b_quotes.create({
      data: {
        quote_token: quoteId,
        merchant_id: data.merchantId ? String(data.merchantId) : null,
        courier_id: data.courierId,
        courier_name: data.courierName,
        service_id: data.serviceId,
        service_name: data.serviceName,
        rate_card_id: data.rateCardId,
        rate_card_name: data.rateCardName,
        rate_card_version: data.rateCardVersion || 'v1.0',
        origin_pincode: data.originPincode,
        destination_pincode: data.destinationPincode,
        origin_zone: data.originZone,
        destination_zone: data.destinationZone,
        dead_weight_kg: data.deadWeightKg,
        chargeable_weight_kg: data.chargeableWeightKg,
        dimensions: data.dimensions || [],
        invoice_value_inr: data.invoiceValueINR || 0,
        customer_rate_per_kg_inr: data.customerRatePerKgINR,
        customer_freight_inr: data.customerFreightINR,
        customer_docket_charge_inr: data.customerDocketChargeINR,
        customer_fuel_surcharge_inr: data.customerFuelSurchargeINR,
        customer_fuel_surcharge_pct: data.customerFuelSurchargePercent,
        customer_applicable_charges: data.customerApplicableCharges || [],
        gst_percent: data.gstPercent,
        gst_amount_inr: data.gstAmountINR,
        final_payable_amount_inr: data.finalPayableAmountINR,
        estimated_delivery_days: data.estimatedDeliveryDays || null,
        has_verified_transit_data: Boolean(data.hasVerifiedTransitData),
        base_cost_inr: data.baseCostINR !== undefined ? data.baseCostINR : null,
        markup_amount_inr: data.markupAmountINR !== undefined ? data.markupAmountINR : null,
        gross_margin_percent: data.grossMarginPercent !== undefined ? data.grossMarginPercent : null,
        status: 'PENDING',
        expires_at: expiresAt,
        created_at: now,
        updated_at: now,
      },
    });

    return mapDbQuoteToStoredQuote(dbRecord);
  },

  /**
   * Retrieves a quote from Supabase Postgres by quote token.
   */
  getQuote: async (quoteId: string): Promise<StoredQuote | undefined> => {
    if (!quoteId || typeof quoteId !== 'string') return undefined;
    const record = await prisma.b2b_quotes.findUnique({
      where: { quote_token: quoteId.trim() },
    });
    return record ? mapDbQuoteToStoredQuote(record) : undefined;
  },

  /**
   * Validates a quote from Supabase Postgres before booking:
   * 1. Checks token existence.
   * 2. Checks merchant ownership (prevents cross-merchant quote hijack).
   * 3. Checks status (rejects already BOOKED, EXPIRED, CANCELLED).
   * 4. Checks 30-minute expiration.
   * 5. Checks courier match.
   * 6. Checks rate card validity in DB (must be active and matching version).
   * 7. Checks shipment parameters (corridor and weight integrity).
   */
  validateQuote: async (
    quoteId: string,
    expectedParams?: {
      originPincode?: string;
      destinationPincode?: string;
      chargeableWeightKg?: number;
      courierId?: string;
      merchantId?: string;
    }
  ): Promise<{
    valid: boolean;
    quote?: StoredQuote;
    code?: string;
    message?: string;
  }> => {
    if (!quoteId || typeof quoteId !== 'string') {
      return {
        valid: false,
        code: 'MISSING_QUOTE_ID',
        message: 'A valid server quote ID is required for B2B booking verification.',
      };
    }

    const record = await prisma.b2b_quotes.findUnique({
      where: { quote_token: quoteId.trim() },
    });

    if (!record) {
      return {
        valid: false,
        code: 'QUOTE_NOT_FOUND',
        message: `Quote '${quoteId}' was not found in the database. Please refresh and re-query courier rates.`,
      };
    }

    // 1. Merchant Ownership Validation (Requirement 3 & 9)
    if (expectedParams?.merchantId && record.merchant_id) {
      const cleanExpected = expectedParams.merchantId.trim();
      const cleanOwner = record.merchant_id.trim();
      if (cleanExpected !== cleanOwner) {
        return {
          valid: false,
          code: 'UNAUTHORIZED_QUOTE_ACCESS',
          message: 'Merchant authorization mismatch: You do not own this rate quote.',
        };
      }
    }

    // 2. Double-Booking Prevention (Requirement 4 & 9)
    if (record.status === 'BOOKED') {
      return {
        valid: false,
        code: 'QUOTE_ALREADY_USED',
        message: `This rate quote has already been consumed for booking '${record.shipment_id || 'confirmed'}'. Quotes cannot be reused for multiple bookings.`,
      };
    }

    if (record.status !== 'PENDING') {
      return {
        valid: false,
        code: 'QUOTE_INVALID_STATUS',
        message: `Quote '${quoteId}' is marked as ${record.status} and cannot be booked.`,
      };
    }

    // 3. Expiration Check (Requirement 3 & 9)
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return {
        valid: false,
        code: 'EXPIRED_QUOTE',
        message: `Quote '${quoteId}' has expired (30-minute validity exceeded). Please re-calculate shipping rates.`,
      };
    }

    // 4. Selected Courier Match (Requirement 3)
    if (
      expectedParams?.courierId &&
      expectedParams.courierId.toLowerCase().trim() !== record.courier_id.toLowerCase().trim()
    ) {
      return {
        valid: false,
        code: 'COURIER_MISMATCH',
        message: `Selected courier '${expectedParams.courierId}' does not match the quoted carrier '${record.courier_name}' (${record.courier_id}).`,
      };
    }

    // 5. Rate Card Active Status in Database (Requirement 3 & 9)
    const card = await prisma.carrier_rate_cards.findUnique({
      where: { id: record.rate_card_id },
    });

    if (!card || !card.is_active || card.mode !== 'B2B') {
      return {
        valid: false,
        code: 'RATE_CARD_INACTIVE',
        message: `The commercial rate card for '${record.courier_name}' is no longer active in the system.`,
      };
    }

    // 6. Rate Card Version Integrity (Requirement 9: rate-card changes)
    if (card.version && record.rate_card_version && card.version !== record.rate_card_version) {
      return {
        valid: false,
        code: 'RATE_CARD_VERSION_CHANGED',
        message: `The commercial rate card for '${record.courier_name}' was updated to ${card.version} (quoted on ${record.rate_card_version}). Please re-calculate rates.`,
      };
    }

    // 7. Shipment Parameter Integrity (Requirement 3 & 9: tampering prevention)
    if (expectedParams) {
      if (
        expectedParams.originPincode &&
        expectedParams.originPincode.replace(/\D/g, '') !== record.origin_pincode.replace(/\D/g, '')
      ) {
        return {
          valid: false,
          code: 'PARAM_MISMATCH',
          message: `Origin pincode (${expectedParams.originPincode}) does not match the generated quote (${record.origin_pincode}).`,
        };
      }

      if (
        expectedParams.destinationPincode &&
        expectedParams.destinationPincode.replace(/\D/g, '') !== record.destination_pincode.replace(/\D/g, '')
      ) {
        return {
          valid: false,
          code: 'PARAM_MISMATCH',
          message: `Destination pincode (${expectedParams.destinationPincode}) does not match the generated quote (${record.destination_pincode}).`,
        };
      }

      if (
        expectedParams.chargeableWeightKg !== undefined &&
        Math.abs(expectedParams.chargeableWeightKg - Number(record.chargeable_weight_kg)) > 0.1
      ) {
        return {
          valid: false,
          code: 'WEIGHT_MISMATCH',
          message: `Chargeable weight (${expectedParams.chargeableWeightKg} KG) does not match quote (${Number(record.chargeable_weight_kg)} KG).`,
        };
      }
    }

    return {
      valid: true,
      quote: mapDbQuoteToStoredQuote(record),
    };
  },

  /**
   * Atomically consumes a quote in Postgres for a successful booking.
   * Guarantees that a quote cannot be used twice (atomic update of PENDING status).
   */
  consumeQuote: async (
    quoteId: string,
    options: {
      originPincode?: string;
      destinationPincode?: string;
      chargeableWeightKg?: number;
      courierId?: string;
      merchantId?: string;
      shipmentId: string;
    }
  ): Promise<{
    valid: boolean;
    quote?: StoredQuote;
    code?: string;
    message?: string;
  }> => {
    // Run full validation first
    const validation = await B2BQuoteManagerService.validateQuote(quoteId, options);
    if (!validation.valid) {
      return validation;
    }

    // Atomic update in database: status must be PENDING
    const now = new Date();
    const updated = await prisma.b2b_quotes.updateMany({
      where: {
        quote_token: quoteId.trim(),
        status: 'PENDING',
        expires_at: { gt: now },
      },
      data: {
        status: 'BOOKED',
        used_at: now,
        shipment_id: options.shipmentId,
        updated_at: now,
      },
    });

    if (updated.count === 0) {
      return {
        valid: false,
        code: 'QUOTE_ALREADY_USED',
        message: 'Concurrent booking conflict: This rate quote has already been consumed.',
      };
    }

    const consumed = await prisma.b2b_quotes.findUnique({
      where: { quote_token: quoteId.trim() },
    });

    return {
      valid: true,
      quote: consumed ? mapDbQuoteToStoredQuote(consumed) : validation.quote,
    };
  },
};
