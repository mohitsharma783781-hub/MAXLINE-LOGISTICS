import { supabase } from '../lib/supabaseClient';

export interface B2BRateCardAuditLog extends Record<string, unknown> {
  id: string;
  action: string;
  actor: string;
  actor_id?: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface B2BSurcharge extends Record<string, unknown> {
  id: string;
  code: string;
  name: string;
  calcType:
    | 'FIXED'
    | 'PERCENTAGE'
    | 'PER_KG'
    | 'INVOICE_PERCENTAGE'
    | 'PERCENTAGE_OF_INVOICE'
    | 'PER_BOX'
    | 'PER_DAY_PER_KG'
    | 'HIGHER_OF_MIN_OR_VARIABLE'
    | string;
  value: number; // In minor units (paise) for fixed/per_kg, or % value
  minAmountMinor?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface B2BRateCard extends Record<string, unknown> {
  id: string;
  name: string;
  rate_card_code?: string;
  courier_id: string;
  courier_name: string;
  service_id: string;
  service_name: string;
  mode: 'B2B' | 'B2C';
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  is_active?: boolean;
  card_type?: 'BASE_COST' | 'MERCHANT_OVERRIDE' | 'SELLER_SELLING' | string;
  markup_type?: 'NONE' | 'PERCENTAGE' | 'FIXED_PER_KG' | 'FIXED_PER_DOCKET' | string;
  markup_value?: number;
  parent_cost_card_id?: string | null;
  zone_coverage?: Record<string, string[]>;
  pincode_zone_mapping?: Record<string, string>;
  volumetric_divisor: number;
  min_chargeable_weight_grams: number;
  min_freight_charge_minor: number;
  weight_rounding_rule: 'ROUND_UP_1KG' | 'ROUND_UP_500G' | 'EXACT' | 'CEIL';
  fuel_surcharge_percent: number;
  docket_charge_minor: number;
  gst_percent: number;
  zone_matrix: Record<string, Record<string, number>>; // originZone -> destZone -> ratePerKg in paise
  weight_slabs?: any[];
  surcharges: B2BSurcharge[];
  description?: string;
  effective_from: string;
  effective_to?: string | null;
  version: string | number;
  created_at: string;
  updated_at: string;
  recentAuditLogs?: B2BRateCardAuditLog[];
}

export interface B2BCourierQuote {
  quoteId: string;
  expiresAt: string;
  courierId: string;
  courierName: string;
  serviceId: string;
  serviceName: string;
  rateCardId: string;
  rateCardName: string;
  zoneRoute: string;
  originZone: string;
  destinationZone: string;
  chargeableWeightKg: number;
  customerRatePerKgINR: number;
  customerFreightINR: number;
  customerDocketChargeINR: number;
  customerFuelSurchargeINR: number;
  customerFuelSurchargePercent: number;
  customerApplicableCharges: Array<{ name: string; amountINR: number }>;
  gstPercent: number;
  gstAmountINR: number;
  finalPayableAmountINR: number;
  estimatedDeliveryDays: string;
  hasVerifiedTransitData?: boolean;
  isCheapest?: boolean;
  isFastest?: boolean;
  isRecommended?: boolean;
  serviceable: boolean;
}

export interface B2BCompareCouriersResult {
  success: boolean;
  originPincode?: string;
  destinationPincode?: string;
  deadWeightKg?: number;
  chargeableWeightKg?: number;
  quotes?: B2BCourierQuote[];
  unserviceableCouriers?: Array<{ courierName: string; reason: string }>;
  code?: string;
  message?: string;
}

export interface B2BQuoteValidationResult {
  success: boolean;
  valid: boolean;
  code?: string;
  message?: string;
  quote?: B2BCourierQuote;
}

export interface B2BRateCalculationResult {
  success: boolean;
  code?: string;
  message?: string;
  breakdown?: {
    rateCardId: string;
    rateCardName: string;
    courierId: string;
    courierName: string;
    serviceName: string;
    version: number;
    originPincode: string;
    destinationPincode: string;
    originZone: string;
    destinationZone: string;
    divisorUsed: number;
    totalDeadWeightKg: number;
    totalVolumetricWeightKg: number;
    rawChargeableWeightKg: number;
    roundingRuleApplied: string;
    finalChargeableWeightKg: number;
    ratePerKgMinor: number;
    ratePerKgINR: number;
    baseFreightBeforeMinRuleINR: number;
    minFreightChargeINR: number;
    baseFreightFinalINR: number;
    docketChargeINR: number;
    fuelSurchargePercent: number;
    fuelSurchargeINR: number;
    additionalSurcharges: Array<{
      code: string;
      name: string;
      amountINR: number;
      type: string;
    }>;
    subtotalBeforeGSTINR: number;
    gstPercent: number;
    gstAmountINR: number;
    grandTotalINR: number;
    grandTotalMinor: number;
  };
}

const API_BASE = '/api/v1';

async function getAuthHeaders(): Promise<HeadersInit> {
  let token = '';
  try {
    const { data } = await supabase.auth.getSession();
    token = data?.session?.access_token || '';
  } catch (err) {
    console.warn('[AdminB2BRateService] Failed to retrieve Supabase session token:', err);
  }

  if (!token && typeof window !== 'undefined' && window.localStorage) {
    token = localStorage.getItem('maxline_auth_token') || '';
  }

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export class AdminB2BRateService {
  /**
   * List all B2B Rate Cards from Supabase Postgres database.
   */
  static async listRateCards(params?: {
    courierId?: string;
    status?: string;
    search?: string;
  }): Promise<B2BRateCard[]> {
    const headers = await getAuthHeaders();
    const query = new URLSearchParams();
    if (params?.courierId) query.set('courierId', params.courierId);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE}/admin/b2b-rates?${query.toString()}`, {
      method: 'GET',
      headers
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to fetch B2B rate cards: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data || [];
  }

  /**
   * Get single B2B Rate Card with audit history.
   */
  static async getRateCard(id: string): Promise<B2BRateCard> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/b2b-rates/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to fetch rate card: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data;
  }

  /**
   * Create a new B2B Rate Card in Supabase Postgres.
   */
  static async createRateCard(card: Partial<B2BRateCard> & { changelog?: string }): Promise<B2BRateCard> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/b2b-rates`, {
      method: 'POST',
      headers,
      body: JSON.stringify(card)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to create B2B rate card: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data;
  }

  /**
   * Update existing B2B Rate Card configuration (bumps version and writes audit log).
   */
  static async updateRateCard(id: string, card: Partial<B2BRateCard> & { changelog?: string }): Promise<B2BRateCard> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/b2b-rates/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(card)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to update B2B rate card: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data;
  }

  /**
   * Toggle status of B2B Rate Card (ACTIVE / INACTIVE).
   */
  static async toggleStatus(id: string, status: 'ACTIVE' | 'INACTIVE', changelog?: string): Promise<B2BRateCard> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/b2b-rates/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status, changelog })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to update rate card status: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data;
  }

  /**
   * Delete B2B Rate Card.
   */
  static async deleteRateCard(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/b2b-rates/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to delete B2B rate card: ${res.statusText}`);
    }
  }

  /**
   * Get audit log history for a rate card.
   */
  static async getAuditLogs(id: string): Promise<B2BRateCardAuditLog[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/b2b-rates/${encodeURIComponent(id)}/audit-logs`, {
      method: 'GET',
      headers
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to fetch audit logs: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data || [];
  }

  /**
   * Authoritative backend B2B pricing calculation.
   * If rate card is missing or unconfigured, returns RATE_NOT_CONFIGURED.
   */
  static async calculateB2BRate(input: {
    courierId?: string;
    rateCardId?: string;
    originPincode: string;
    destinationPincode: string;
    deadWeightKg: number;
    boxes: Array<{ lengthCm: number; widthCm: number; heightCm: number; quantity?: number }>;
    invoiceValueMinor?: number;
  }): Promise<B2BRateCalculationResult> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/pricing/b2b/calculate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input)
    });

    const json = await res.json();
    return json;
  }

  /**
   * Compare all eligible active B2B couriers for a route with customer selling prices.
   * Internal purchase costs, profit margins, and divisors are hidden.
   */
  static async compareB2BCouriers(input: {
    originPincode: string;
    destinationPincode: string;
    deadWeightKg: number;
    boxes: Array<{ lengthCm: number; widthCm: number; heightCm: number; quantity?: number }>;
    invoiceValueMinor?: number;
    merchantId?: string;
  }): Promise<B2BCompareCouriersResult> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/pricing/b2b/compare`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });

    const json = await res.json();
    return json;
  }

  /**
   * Validate server-generated quote token prior to booking/wallet debit.
   */
  static async validateQuote(input: {
    quoteId: string;
    originPincode?: string;
    destinationPincode?: string;
    chargeableWeightKg?: number;
    courierId?: string;
    merchantId?: string;
    consume?: boolean;
    shipmentId?: string;
  }): Promise<B2BQuoteValidationResult> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/pricing/b2b/validate-quote`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });

    const json = await res.json();
    return json;
  }

  /**
   * Atomically validate and consume quote on server during booking execution to prevent double-booking.
   */
  static async consumeQuote(input: {
    quoteId: string;
    originPincode?: string;
    destinationPincode?: string;
    chargeableWeightKg?: number;
    courierId?: string;
    merchantId?: string;
    shipmentId: string;
  }): Promise<B2BQuoteValidationResult> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/pricing/b2b/consume-quote`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...input, consume: true }),
    });

    const json = await res.json();
    return json;
  }

  /**
   * Bulk import parsed Excel sheets as DRAFT rate cards
   */
  static async bulkImportDrafts(sheets: any[], makeActive: boolean = false): Promise<B2BRateCard[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/b2b-rates/bulk-import`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sheets, makeActive }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to bulk import sheets: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data || [];
  }

  /**
   * Safely activate a rate card (archives previous active versions for the same courier & service)
   */
  static async activateRateCard(id: string): Promise<B2BRateCard> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/b2b-rates/${encodeURIComponent(id)}/activate`, {
      method: 'PATCH',
      headers,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to activate rate card: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data;
  }

  /**
   * Rollback to a specific rate card version
   */
  static async rollbackRateCard(id: string): Promise<B2BRateCard> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/b2b-rates/${encodeURIComponent(id)}/rollback`, {
      method: 'POST',
      headers,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to rollback rate card: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data;
  }

  /**
   * Update markup configuration (Base cost vs Seller selling price)
   */
  static async updateMarkup(
    id: string,
    markup: { markup_type: string; markup_value: number; card_type?: string }
  ): Promise<B2BRateCard> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/b2b-rates/${encodeURIComponent(id)}/markup`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(markup),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to update markup: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data;
  }
}
