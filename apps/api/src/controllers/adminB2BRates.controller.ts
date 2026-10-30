import { Request, Response } from 'express';
import { prisma } from '../db';
import { B2BPricingEngineService, WeightRoundingRule } from '../services/b2bPricingEngine.service';
import { B2BQuoteManagerService } from '../services/b2bQuoteManager.service';

// Helper to safely serialize BigInts to standard JSON numbers or strings
const serializeBigInts = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(serializeBigInts);
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const res: any = {};
    for (const [key, val] of Object.entries(obj)) {
      res[key] = serializeBigInts(val);
    }
    return res;
  }
  return obj;
};

export const listB2BRateCards = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courierId, status, search } = req.query;

    const whereClause: any = {
      mode: 'B2B',
    };

    if (courierId && courierId !== 'all') {
      whereClause.courier_id = String(courierId).toLowerCase();
    }

    if (status === 'ACTIVE') {
      whereClause.is_active = true;
    } else if (status === 'INACTIVE') {
      whereClause.is_active = false;
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { rate_card_code: { contains: q, mode: 'insensitive' } },
        { courier_name: { contains: q, mode: 'insensitive' } },
        { service_name: { contains: q, mode: 'insensitive' } },
      ];
    }

    const cards = await prisma.carrier_rate_cards.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: {
        merchant_rate_assignments: {
          select: {
            id: true,
            merchant_id: true,
            is_active: true,
          },
        },
      },
    });

    const mappedCards = cards.map((c) => ({
      ...c,
      status: c.is_active ? 'ACTIVE' : (c.version?.includes('draft') || c.name?.includes('Draft')) ? 'DRAFT' : 'INACTIVE',
    }));

    res.status(200).json({
      success: true,
      data: serializeBigInts(mappedCards),
      totalCount: mappedCards.length,
    });
  } catch (error: any) {
    console.error('[listB2BRateCards Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to list B2B rate cards' },
    });
  }
};

export const getB2BRateCardById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const card = await prisma.carrier_rate_cards.findUnique({
      where: { id },
      include: {
        merchant_rate_assignments: {
          include: {
            merchants: {
              select: {
                id: true,
                business_name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!card || card.mode !== 'B2B') {
      res.status(404).json({
        success: false,
        error: { message: `B2B rate card not found with ID: ${id}` },
      });
      return;
    }

    // Retrieve audit history for this rate card
    const auditLogs = await prisma.audit_logs.findMany({
      where: {
        resource_type: 'B2B_RATE_CARD',
        resource_id: id,
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    const cardWithStatus = {
      ...card,
      status: card.is_active ? 'ACTIVE' : (card.version?.includes('draft') || card.name?.includes('Draft')) ? 'DRAFT' : 'INACTIVE',
      auditLogs,
    };

    res.status(200).json({
      success: true,
      data: serializeBigInts(cardWithStatus),
    });
  } catch (error: any) {
    console.error('[getB2BRateCardById Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to fetch B2B rate card' },
    });
  }
};

export const createB2BRateCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      rate_card_code,
      courier_id,
      courier_name,
      service_id,
      service_name,
      volumetric_divisor = 5000,
      min_chargeable_weight_grams = 20000,
      min_freight_charge_minor = 0,
      weight_rounding_rule = 'ROUND_UP_1KG',
      fuel_surcharge_percent = 0,
      docket_charge_minor = 0,
      gst_percent = 18.0,
      zone_matrix = {},
      weight_slabs = [],
      surcharges = [],
      description,
      effective_from,
      effective_to,
      version = 'v1.0',
      is_active = true,
    } = req.body;

    // Strict validation
    if (!name || String(name).trim().length < 3) {
      res.status(400).json({ success: false, error: { message: 'Rate card name must be at least 3 characters.' } });
      return;
    }
    if (!courier_id || !courier_name) {
      res.status(400).json({ success: false, error: { message: 'Courier ID and Courier Name are required.' } });
      return;
    }
    if (!service_id || !service_name) {
      res.status(400).json({ success: false, error: { message: 'Service ID and Service Name are required.' } });
      return;
    }

    const divisorNum = Number(volumetric_divisor);
    if (!divisorNum || divisorNum < 1000 || divisorNum > 10000) {
      res.status(400).json({ success: false, error: { message: 'Volumetric divisor must be between 1000 and 10000 (e.g. 5000, 4750, 4000).' } });
      return;
    }

    const generatedCode = (rate_card_code || `B2B-${String(courier_id).toUpperCase()}-${Date.now().toString().slice(-6)}`).trim();

    // Check code uniqueness
    const existingCode = await prisma.carrier_rate_cards.findUnique({
      where: { rate_card_code: generatedCode },
    });
    if (existingCode) {
      res.status(400).json({ success: false, error: { message: `Rate card code '${generatedCode}' is already in use. Please use a unique code.` } });
      return;
    }

    const newCard = await prisma.carrier_rate_cards.create({
      data: {
        rate_card_code: generatedCode,
        name: String(name).trim(),
        mode: 'B2B',
        courier_id: String(courier_id).toLowerCase().trim(),
        courier_name: String(courier_name).trim(),
        service_id: String(service_id).toLowerCase().trim(),
        service_name: String(service_name).trim(),
        volumetric_divisor: divisorNum,
        min_chargeable_weight_grams: Math.max(0, Number(min_chargeable_weight_grams) || 0),
        min_freight_charge_minor: BigInt(Math.max(0, Math.round(Number(min_freight_charge_minor) || 0))),
        weight_rounding_rule: String(weight_rounding_rule || 'ROUND_UP_1KG'),
        fuel_surcharge_percent: Number(fuel_surcharge_percent) || 0,
        docket_charge_minor: BigInt(Math.max(0, Math.round(Number(docket_charge_minor) || 0))),
        gst_percent: Number(gst_percent) || 18.0,
        zone_matrix: zone_matrix || {},
        weight_slabs: weight_slabs || [],
        surcharges: surcharges || [],
        description: description ? String(description).trim() : null,
        effective_from: effective_from ? new Date(effective_from) : new Date(),
        effective_to: effective_to ? new Date(effective_to) : null,
        version: String(version || 'v1.0'),
        is_active: Boolean(is_active),
        base_weight_grams: 500,
        base_rate_within_city_minor: BigInt(0),
        base_rate_within_state_minor: BigInt(0),
        base_rate_metro_minor: BigInt(0),
        base_rate_rest_of_india_minor: BigInt(0),
        base_rate_special_zone_minor: BigInt(0),
        additional_weight_grams: 500,
        additional_rate_within_city_minor: BigInt(0),
        additional_rate_within_state_minor: BigInt(0),
        additional_rate_metro_minor: BigInt(0),
        additional_rate_rest_of_india_minor: BigInt(0),
        additional_rate_special_zone_minor: BigInt(0),
      },
    });

    // Record Audit Log
    await prisma.audit_logs.create({
      data: {
        action: 'B2B_RATE_CARD_CREATED',
        resource_type: 'B2B_RATE_CARD',
        resource_id: newCard.id,
        actor_user_id: req.user?.userId || null,
        details_json: {
          name: newCard.name,
          code: newCard.rate_card_code,
          courier: newCard.courier_name,
          service: newCard.service_name,
          volumetricDivisor: newCard.volumetric_divisor,
          version: newCard.version,
          createdAt: newCard.created_at,
        },
      },
    }).catch((err) => console.warn('[AuditLog Warning]:', err.message));

    res.status(201).json({
      success: true,
      message: `B2B Rate card '${newCard.name}' successfully created.`,
      data: serializeBigInts(newCard),
    });
  } catch (error: any) {
    console.error('[createB2BRateCard Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to create B2B rate card' },
    });
  }
};

export const updateB2BRateCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.carrier_rate_cards.findUnique({
      where: { id },
    });

    if (!existing || existing.mode !== 'B2B') {
      res.status(404).json({
        success: false,
        error: { message: `B2B rate card not found with ID: ${id}` },
      });
      return;
    }

    const {
      name,
      courier_id,
      courier_name,
      service_id,
      service_name,
      volumetric_divisor,
      min_chargeable_weight_grams,
      min_freight_charge_minor,
      weight_rounding_rule,
      fuel_surcharge_percent,
      docket_charge_minor,
      gst_percent,
      zone_matrix,
      weight_slabs,
      surcharges,
      description,
      effective_from,
      effective_to,
      version,
      is_active,
      changelog,
    } = req.body;

    const updateData: any = {
      updated_at: new Date(),
    };

    if (name !== undefined) updateData.name = String(name).trim();
    if (courier_id !== undefined) updateData.courier_id = String(courier_id).toLowerCase().trim();
    if (courier_name !== undefined) updateData.courier_name = String(courier_name).trim();
    if (service_id !== undefined) updateData.service_id = String(service_id).toLowerCase().trim();
    if (service_name !== undefined) updateData.service_name = String(service_name).trim();
    if (volumetric_divisor !== undefined) updateData.volumetric_divisor = Number(volumetric_divisor);
    if (min_chargeable_weight_grams !== undefined) updateData.min_chargeable_weight_grams = Number(min_chargeable_weight_grams);
    if (min_freight_charge_minor !== undefined) updateData.min_freight_charge_minor = BigInt(Math.round(Number(min_freight_charge_minor)));
    if (weight_rounding_rule !== undefined) updateData.weight_rounding_rule = String(weight_rounding_rule);
    if (fuel_surcharge_percent !== undefined) updateData.fuel_surcharge_percent = Number(fuel_surcharge_percent);
    if (docket_charge_minor !== undefined) updateData.docket_charge_minor = BigInt(Math.round(Number(docket_charge_minor)));
    if (gst_percent !== undefined) updateData.gst_percent = Number(gst_percent);
    if (zone_matrix !== undefined) updateData.zone_matrix = zone_matrix;
    if (weight_slabs !== undefined) updateData.weight_slabs = weight_slabs;
    if (surcharges !== undefined) updateData.surcharges = surcharges;
    if (description !== undefined) updateData.description = description ? String(description).trim() : null;
    if (effective_from !== undefined) updateData.effective_from = effective_from ? new Date(effective_from) : null;
    if (effective_to !== undefined) updateData.effective_to = effective_to ? new Date(effective_to) : null;
    if (version !== undefined) updateData.version = String(version);
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const updatedCard = await prisma.carrier_rate_cards.update({
      where: { id },
      data: updateData,
    });

    // Record Audit Log
    await prisma.audit_logs.create({
      data: {
        action: 'B2B_RATE_CARD_UPDATED',
        resource_type: 'B2B_RATE_CARD',
        resource_id: id,
        actor_user_id: req.user?.userId || null,
        details_json: {
          changelog: changelog || 'Administrative update to B2B rate configuration',
          updatedFields: Object.keys(updateData),
          version: updatedCard.version,
          updatedAt: updatedCard.updated_at,
        },
      },
    }).catch((err) => console.warn('[AuditLog Warning]:', err.message));

    res.status(200).json({
      success: true,
      message: `B2B Rate card '${updatedCard.name}' successfully updated.`,
      data: serializeBigInts(updatedCard),
    });
  } catch (error: any) {
    console.error('[updateB2BRateCard Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to update B2B rate card' },
    });
  }
};

export const toggleB2BRateCardStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.carrier_rate_cards.findUnique({
      where: { id },
    });

    if (!existing || existing.mode !== 'B2B') {
      res.status(404).json({
        success: false,
        error: { message: `B2B rate card not found with ID: ${id}` },
      });
      return;
    }

    const newStatus = !existing.is_active;

    const updated = await prisma.carrier_rate_cards.update({
      where: { id },
      data: {
        is_active: newStatus,
        updated_at: new Date(),
      },
    });

    await prisma.audit_logs.create({
      data: {
        action: 'B2B_RATE_CARD_STATUS_TOGGLED',
        resource_type: 'B2B_RATE_CARD',
        resource_id: id,
        actor_user_id: req.user?.userId || null,
        details_json: {
          previousStatus: existing.is_active,
          newStatus: updated.is_active,
          name: updated.name,
        },
      },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: `Rate card status changed to ${newStatus ? 'ACTIVE' : 'INACTIVE'}.`,
      data: serializeBigInts(updated),
    });
  } catch (error: any) {
    console.error('[toggleB2BRateCardStatus Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to toggle status' },
    });
  }
};

export const deleteB2BRateCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.carrier_rate_cards.findUnique({
      where: { id },
    });

    if (!existing || existing.mode !== 'B2B') {
      res.status(404).json({
        success: false,
        error: { message: `B2B rate card not found with ID: ${id}` },
      });
      return;
    }

    // Delete rate card
    await prisma.carrier_rate_cards.delete({
      where: { id },
    });

    await prisma.audit_logs.create({
      data: {
        action: 'B2B_RATE_CARD_DELETED',
        resource_type: 'B2B_RATE_CARD',
        resource_id: id,
        actor_user_id: req.user?.userId || null,
        details_json: {
          name: existing.name,
          code: existing.rate_card_code,
          courier: existing.courier_name,
        },
      },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: `B2B Rate card '${existing.name}' has been permanently deleted.`,
    });
  } catch (error: any) {
    console.error('[deleteB2BRateCard Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to delete rate card' },
    });
  }
};

export const getB2BRateCardAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const logs = await prisma.audit_logs.findMany({
      where: {
        resource_type: 'B2B_RATE_CARD',
        resource_id: id,
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    console.error('[getB2BRateCardAuditLogs Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to fetch audit logs' },
    });
  }
};

/**
 * Authoritative Backend B2B Rate Calculation Endpoint
 * POST /api/v1/pricing/calculate-b2b or /api/v1/admin/b2b-rates/calculate
 */
export const calculateB2BRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      originPincode,
      destinationPincode,
      actualWeightKg,
      deadWeightKg,
      dimensions = [],
      boxes,
      courierId,
      serviceId,
      rateCardId,
      invoiceValueINR = 0,
      invoiceValueMinor,
      merchantId,
    } = req.body;

    if (!originPincode || !destinationPincode) {
      res.status(400).json({
        success: false,
        error: { message: 'Origin and Destination pincodes are required.' },
      });
      return;
    }

    const weightNum = Number(actualWeightKg ?? deadWeightKg);
    if (!weightNum || isNaN(weightNum) || weightNum <= 0) {
      res.status(400).json({
        success: false,
        error: { message: 'Actual weight (KG) must be greater than 0.' },
      });
      return;
    }

    const resolvedDimensions = Array.isArray(dimensions) && dimensions.length > 0
      ? dimensions
      : Array.isArray(boxes)
      ? boxes.map((b: any) => ({
          lengthCm: Number(b.lengthCm) || 0,
          widthCm: Number(b.widthCm) || 0,
          heightCm: Number(b.heightCm) || 0,
          packageCount: Number(b.quantity || b.packageCount) || 1,
        }))
      : [];

    // 1. Look up authoritative Rate Card from Database
    let rateCard: any = null;

    if (rateCardId) {
      rateCard = await prisma.carrier_rate_cards.findFirst({
        where: { id: rateCardId, mode: 'B2B', is_active: true },
      });
    } else if (merchantId) {
      // Check merchant assignment
      const assignment = await prisma.merchant_rate_assignments.findFirst({
        where: {
          merchant_id: merchantId,
          mode: 'B2B',
          is_active: true,
        },
        include: { carrier_rate_cards: true },
      });
      if (assignment?.carrier_rate_cards && assignment.carrier_rate_cards.is_active) {
        rateCard = assignment.carrier_rate_cards;
      }
    }

    // If still not found, check by courierId / serviceId
    if (!rateCard && courierId) {
      rateCard = await prisma.carrier_rate_cards.findFirst({
        where: {
          courier_id: String(courierId).toLowerCase().trim(),
          mode: 'B2B',
          is_active: true,
          ...(serviceId ? { service_id: String(serviceId).toLowerCase().trim() } : {}),
        },
      });
    }

    // 2. REQUIREMENT 7 & 8: If no valid rate card is configured, return RATE_NOT_CONFIGURED!
    // NEVER invent fake prices or divisors!
    if (!rateCard) {
      res.status(200).json({
        success: false,
        code: 'RATE_NOT_CONFIGURED',
        message: 'Commercial B2B rate card is not configured for this courier partner. Please configure a rate card in Platform Admin.',
        originPincode,
        destinationPincode,
        courierId,
      });
      return;
    }

    // 3. Perform calculation using authoritative database configuration
    try {
      const calcResult = B2BPricingEngineService.calculate({
        originPincode: String(originPincode),
        destinationPincode: String(destinationPincode),
        actualWeightKg: weightNum,
        dimensions: resolvedDimensions,
        volumetricDivisor: rateCard.volumetric_divisor || 5000,
        minChargeableWeightKg: (rateCard.min_chargeable_weight_grams || 20000) / 1000,
        minFreightChargePaise: Number(rateCard.min_freight_charge_minor || 0),
        weightRoundingRule: (rateCard.weight_rounding_rule as WeightRoundingRule) || 'ROUND_UP_1KG',
        fuelSurchargePercent: Number(rateCard.fuel_surcharge_percent || 0),
        docketChargePaise: Number(rateCard.docket_charge_minor || 0),
        gstPercent: Number(rateCard.gst_percent || 18.0),
        zoneMatrix: (rateCard.zone_matrix as any) || {},
        surcharges: (rateCard.surcharges as any) || [],
        invoiceValueINR: Number(invoiceValueINR) || (Number(invoiceValueMinor || 0) / 100),
        markupType: (rateCard.markup_type as any) || 'NONE',
        markupValue: Number(rateCard.markup_value || 0),
        courierId: rateCard.courier_id,
        pincodeZoneMapping: (rateCard.pincode_zone_mapping as any) || undefined,
      });

      const isPlatformAdmin = Boolean(
        req.user?.isPlatformAdmin === true ||
        req.user?.role === 'SUPER_ADMIN' ||
        req.user?.role === 'ADMIN_OPERATOR'
      );

      const markupAmtINR = calcResult.markupDetails?.markupAmountINR || 0;
      const customerFreightINR = Math.round((calcResult.baseFreightINR + markupAmtINR) * 100) / 100;

      const effectiveMerchantId = req.user?.merchantId || req.user?.userId || merchantId || undefined;
      const verifiedTransitDays = (rateCard.zone_coverage as any)?.transit_days || (rateCard.zone_coverage as any)?.verified_delivery_days || undefined;
      const hasVerifiedTransitData = Boolean(verifiedTransitDays);
      const estimatedDeliveryDays = hasVerifiedTransitData ? String(verifiedTransitDays) : 'Standard Cargo';

      const storedQuote = await B2BQuoteManagerService.createQuote({
        merchantId: effectiveMerchantId,
        courierId: rateCard.courier_id,
        courierName: rateCard.courier_name,
        serviceId: rateCard.service_id || 'surface_cargo',
        serviceName: rateCard.service_name || 'Commercial Freight Surface',
        rateCardId: rateCard.id,
        rateCardName: rateCard.name,
        rateCardVersion: rateCard.version || 'v1.0',
        originPincode: String(originPincode),
        destinationPincode: String(destinationPincode),
        originZone: calcResult.originZone,
        destinationZone: calcResult.destinationZone,
        deadWeightKg: weightNum,
        chargeableWeightKg: calcResult.chargeableWeightKg,
        dimensions: resolvedDimensions,
        invoiceValueINR: Number(invoiceValueINR) || (Number(invoiceValueMinor || 0) / 100),
        customerRatePerKgINR: calcResult.ratePerKgINR,
        customerFreightINR,
        customerDocketChargeINR: calcResult.docketChargeINR,
        customerFuelSurchargeINR: calcResult.fuelSurchargeINR,
        customerFuelSurchargePercent: Number(rateCard.fuel_surcharge_percent || 0),
        customerApplicableCharges: calcResult.additionalSurcharges.map((s) => ({
          name: s.name,
          amountINR: s.amountINR,
        })),
        gstPercent: calcResult.gstPercentUsed,
        gstAmountINR: calcResult.gstAmountINR,
        finalPayableAmountINR: calcResult.totalAmountINR,
        estimatedDeliveryDays,
        hasVerifiedTransitData,
        baseCostINR: calcResult.markupDetails?.baseCostINR,
        markupAmountINR: calcResult.markupDetails?.markupAmountINR,
        grossMarginPercent: calcResult.markupDetails?.grossMarginPercent,
      });

      // Customer-safe breakdown: if user is not platform admin, hide internal costs & divisor!
      const breakdown: any = {
        quoteId: storedQuote.quoteId,
        expiresAt: storedQuote.expiresAt,
        rateCardId: rateCard.id,
        rateCardName: rateCard.name,
        courierId: rateCard.courier_id,
        courierName: rateCard.courier_name,
        serviceName: rateCard.service_name,
        version: rateCard.version,
        originPincode: String(originPincode),
        destinationPincode: String(destinationPincode),
        originZone: calcResult.originZone,
        destinationZone: calcResult.destinationZone,
        chargeableWeightKg: calcResult.chargeableWeightKg,
        customerFreightINR,
        baseFreightFinalINR: customerFreightINR,
        docketChargeINR: calcResult.docketChargeINR,
        fuelSurchargePercent: Number(rateCard.fuel_surcharge_percent || 0),
        fuelSurchargeINR: calcResult.fuelSurchargeINR,
        additionalSurcharges: calcResult.additionalSurcharges.map((s) => ({
          name: s.name,
          amountINR: s.amountINR,
        })),
        accessorialRulesSchedule: calcResult.accessorialRulesSchedule,
        gstPercent: calcResult.gstPercentUsed,
        gstAmountINR: calcResult.gstAmountINR,
        grandTotalINR: calcResult.totalAmountINR,
        grandTotalMinor: calcResult.totalAmountPaise,
      };

      // Expose internal commercial metrics only to verified platform administrators
      if (isPlatformAdmin) {
        breakdown.divisorUsed = calcResult.volumetricDivisorUsed;
        breakdown.totalDeadWeightKg = calcResult.totalDeadWeightKg;
        breakdown.totalVolumetricWeightKg = calcResult.volumetricWeightKg;
        breakdown.roundingRuleApplied = calcResult.roundingRuleUsed;
        breakdown.ratePerKgINR = calcResult.ratePerKgINR;
        breakdown.rawFreightPaise = calcResult.rawFreightPaise;
        breakdown.markupDetails = calcResult.markupDetails;
      }

      res.status(200).json({
        success: true,
        code: 'RATE_CALCULATED',
        quoteId: storedQuote.quoteId,
        expiresAt: storedQuote.expiresAt,
        rateCard: {
          id: rateCard.id,
          name: rateCard.name,
          code: rateCard.rate_card_code,
          courierId: rateCard.courier_id,
          courierName: rateCard.courier_name,
          serviceId: rateCard.service_id,
          serviceName: rateCard.service_name,
          version: rateCard.version,
          ...(isPlatformAdmin
            ? {
                cardType: rateCard.card_type,
                markupType: rateCard.markup_type,
                markupValue: rateCard.markup_value,
              }
            : {}),
        },
        pricing: isPlatformAdmin ? calcResult : undefined,
        breakdown,
      });
    } catch (calcErr: any) {
      if (calcErr.message && calcErr.message.includes('ZONE_ROUTE_NOT_CONFIGURED')) {
        res.status(200).json({
          success: false,
          code: 'RATE_NOT_CONFIGURED',
          message: calcErr.message,
          rateCardId: rateCard.id,
          rateCardName: rateCard.name,
        });
        return;
      }
      throw calcErr;
    }
  } catch (error: any) {
    console.error('[calculateB2BRate Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error executing B2B pricing engine' },
    });
  }
};

/**
 * Compare all eligible active B2B couriers for a route and shipment parameters.
 * POST /api/v1/pricing/b2b/compare
 * Requirements:
 * 1. Shows all eligible B2B couriers with final customer selling prices, NOT internal purchase costs.
 * 2. Hides internal purchase rates, profit margins, divisors, and formula descriptions.
 * 3. Applies merchant markup consistently.
 * 4. Only shows couriers with valid, active rate cards.
 * 5. Generates server quote ID valid for 30 minutes.
 * 6. Returns RATE_NOT_CONFIGURED if no couriers are serviceable.
 */
export const compareB2BRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      originPincode,
      destinationPincode,
      actualWeightKg,
      deadWeightKg,
      dimensions = [],
      boxes = [],
      invoiceValueINR = 0,
      invoiceValueMinor = 0,
      merchantId,
    } = req.body;

    if (!originPincode || !destinationPincode) {
      res.status(400).json({
        success: false,
        error: { message: 'Origin and Destination pincodes are required.' },
      });
      return;
    }

    const weightNum = Number(actualWeightKg ?? deadWeightKg);
    if (!weightNum || isNaN(weightNum) || weightNum <= 0) {
      res.status(400).json({
        success: false,
        error: { message: 'Actual weight (KG) must be greater than 0.' },
      });
      return;
    }

    const resolvedDimensions = Array.isArray(dimensions) && dimensions.length > 0
      ? dimensions
      : Array.isArray(boxes)
      ? boxes.map((b: any) => ({
          lengthCm: Number(b.lengthCm) || 0,
          widthCm: Number(b.widthCm) || 0,
          heightCm: Number(b.heightCm) || 0,
          packageCount: Number(b.quantity || b.packageCount) || 1,
        }))
      : [];

    const effectiveInvoiceValue = Number(invoiceValueINR) || (Number(invoiceValueMinor || 0) / 100);

    // 1. Fetch all ACTIVE B2B Rate Cards from Supabase Postgres
    const activeRateCards = await prisma.carrier_rate_cards.findMany({
      where: {
        mode: 'B2B',
        is_active: true,
      },
      orderBy: { created_at: 'desc' },
    });

    if (activeRateCards.length === 0) {
      res.status(200).json({
        success: false,
        code: 'RATE_NOT_CONFIGURED',
        message: 'No active B2B commercial rate cards configured in the system. Please configure an active rate card in Platform Admin.',
        originPincode: String(originPincode),
        destinationPincode: String(destinationPincode),
        quotes: [],
      });
      return;
    }

    const quotes: any[] = [];
    const unserviceableCouriers: Array<{ courierName: string; reason: string }> = [];

    // Deduplicate cards by courier_id + service_id (taking the most recent active one)
    const processedCouriers = new Set<string>();

    for (const card of activeRateCards) {
      const key = `${card.courier_id}_${card.service_id || 'surface'}`;
      if (processedCouriers.has(key)) continue;
      processedCouriers.add(key);

      try {
        const originZone = B2BPricingEngineService.resolveZoneFromPincode(
          String(originPincode),
          card.courier_id,
          (card.pincode_zone_mapping as any) || undefined
        );
        const destinationZone = B2BPricingEngineService.resolveZoneFromPincode(
          String(destinationPincode),
          card.courier_id,
          (card.pincode_zone_mapping as any) || undefined
        );

        const matrix = (card.zone_matrix as any) || {};
        if (!matrix[originZone] || matrix[originZone][destinationZone] === undefined) {
          unserviceableCouriers.push({
            courierName: card.courier_name,
            reason: `Route Zone ${originZone} → Zone ${destinationZone} is not serviceable or rate is unconfigured.`,
          });
          continue;
        }

        // Calculate authoritative price quote
        const calcResult = B2BPricingEngineService.calculate({
          originPincode: String(originPincode),
          destinationPincode: String(destinationPincode),
          actualWeightKg: weightNum,
          dimensions: resolvedDimensions,
          volumetricDivisor: card.volumetric_divisor || 5000,
          minChargeableWeightKg: (card.min_chargeable_weight_grams || 20000) / 1000,
          minFreightChargePaise: Number(card.min_freight_charge_minor || 0),
          weightRoundingRule: (card.weight_rounding_rule as WeightRoundingRule) || 'ROUND_UP_1KG',
          fuelSurchargePercent: Number(card.fuel_surcharge_percent || 0),
          docketChargePaise: Number(card.docket_charge_minor || 0),
          gstPercent: Number(card.gst_percent || 18.0),
          zoneMatrix: matrix,
          surcharges: (card.surcharges as any) || [],
          invoiceValueINR: effectiveInvoiceValue,
          markupType: (card.markup_type as any) || 'NONE',
          markupValue: Number(card.markup_value || 0),
          courierId: card.courier_id,
          pincodeZoneMapping: (card.pincode_zone_mapping as any) || undefined,
        });

        // Determine Customer Selling Freight (includes markup)
        const markupAmtINR = calcResult.markupDetails?.markupAmountINR || 0;
        const customerFreightINR = Math.round((calcResult.baseFreightINR + markupAmtINR) * 100) / 100;

        const effectiveMerchantId = req.user?.merchantId || req.user?.userId || merchantId || undefined;

        // Requirement 5: Do not display Fastest or delivery-time claims unless supported by verified courier transit-time data.
        const verifiedTransitDays = (card.zone_coverage as any)?.transit_days ||
          (card.zone_coverage as any)?.verified_delivery_days ||
          undefined;
        const hasVerifiedTransitData = Boolean(verifiedTransitDays);
        const estimatedDeliveryDays = hasVerifiedTransitData
          ? String(verifiedTransitDays)
          : 'Standard Commercial Cargo';

        let verifiedTransitDaysNum: number | undefined = undefined;
        if (hasVerifiedTransitData) {
          const match = String(verifiedTransitDays).match(/\d+/);
          if (match) verifiedTransitDaysNum = parseInt(match[0], 10);
        }

        // Create secure database-backed server quote token (30-minute validity)
        const storedQuote = await B2BQuoteManagerService.createQuote({
          merchantId: effectiveMerchantId,
          courierId: card.courier_id,
          courierName: card.courier_name,
          serviceId: card.service_id || 'surface_cargo',
          serviceName: card.service_name || 'Commercial Freight Surface',
          rateCardId: card.id,
          rateCardName: card.name,
          rateCardVersion: card.version || 'v1.0',
          originPincode: String(originPincode),
          destinationPincode: String(destinationPincode),
          originZone,
          destinationZone,
          deadWeightKg: weightNum,
          chargeableWeightKg: calcResult.chargeableWeightKg,
          dimensions: resolvedDimensions,
          invoiceValueINR: effectiveInvoiceValue,
          customerRatePerKgINR: calcResult.ratePerKgINR,
          customerFreightINR,
          customerDocketChargeINR: calcResult.docketChargeINR,
          customerFuelSurchargeINR: calcResult.fuelSurchargeINR,
          customerFuelSurchargePercent: Number(card.fuel_surcharge_percent || 0),
          customerApplicableCharges: calcResult.additionalSurcharges.map((s) => ({
            name: s.name,
            amountINR: s.amountINR,
          })),
          gstPercent: calcResult.gstPercentUsed,
          gstAmountINR: calcResult.gstAmountINR,
          finalPayableAmountINR: calcResult.totalAmountINR,
          estimatedDeliveryDays,
          hasVerifiedTransitData,
          baseCostINR: calcResult.markupDetails?.baseCostINR,
          markupAmountINR: calcResult.markupDetails?.markupAmountINR,
          grossMarginPercent: calcResult.markupDetails?.grossMarginPercent,
        });

        // Customer-facing quote representation (Zero internal secrets)
        quotes.push({
          quoteId: storedQuote.quoteId,
          expiresAt: storedQuote.expiresAt,
          courierId: storedQuote.courierId,
          courierName: storedQuote.courierName,
          serviceId: storedQuote.serviceId,
          serviceName: storedQuote.serviceName,
          rateCardId: storedQuote.rateCardId,
          rateCardName: storedQuote.rateCardName,
          zoneRoute: `${originZone} → ${destinationZone}`,
          originZone,
          destinationZone,
          chargeableWeightKg: storedQuote.chargeableWeightKg,
          customerRatePerKgINR: storedQuote.customerRatePerKgINR,
          customerFreightINR: storedQuote.customerFreightINR,
          customerDocketChargeINR: storedQuote.customerDocketChargeINR,
          customerFuelSurchargeINR: storedQuote.customerFuelSurchargeINR,
          customerFuelSurchargePercent: storedQuote.customerFuelSurchargePercent,
          customerApplicableCharges: storedQuote.customerApplicableCharges,
          gstPercent: storedQuote.gstPercent,
          gstAmountINR: storedQuote.gstAmountINR,
          finalPayableAmountINR: storedQuote.finalPayableAmountINR,
          estimatedDeliveryDays: storedQuote.estimatedDeliveryDays,
          hasVerifiedTransitData: storedQuote.hasVerifiedTransitData,
          verifiedTransitDaysNum,
          serviceable: true,
        });
      } catch (err: any) {
        unserviceableCouriers.push({
          courierName: card.courier_name,
          reason: err.message || 'Rate calculation error for corridor',
        });
      }
    }

    if (quotes.length === 0) {
      res.status(200).json({
        success: false,
        code: 'RATE_NOT_CONFIGURED',
        message: `No active courier partners service route ${originPincode} → ${destinationPincode}.`,
        originPincode: String(originPincode),
        destinationPincode: String(destinationPincode),
        quotes: [],
        unserviceableCouriers,
      });
      return;
    }

    // Rank quotes for smart recommendations
    // Cheapest is ALWAYS calculated from actual configured selling prices (Requirement 5)
    quotes.sort((a, b) => a.finalPayableAmountINR - b.finalPayableAmountINR);
    const cheapestId = quotes[0]?.quoteId;

    // Fastest is ONLY calculated if verified transit-time data is configured (Requirement 5)
    const quotesWithVerifiedTransit = quotes.filter((q) => q.hasVerifiedTransitData && q.verifiedTransitDaysNum);
    let fastestId: string | null = null;
    if (quotesWithVerifiedTransit.length > 0) {
      quotesWithVerifiedTransit.sort((a, b) => a.verifiedTransitDaysNum! - b.verifiedTransitDaysNum!);
      fastestId = quotesWithVerifiedTransit[0].quoteId;
    }

    quotes.forEach((q) => {
      q.isCheapest = q.quoteId === cheapestId;
      q.isFastest = Boolean(fastestId && q.quoteId === fastestId && q.hasVerifiedTransitData);
      q.isRecommended = q.isCheapest || q.isFastest;
    });

    res.status(200).json({
      success: true,
      originPincode: String(originPincode),
      destinationPincode: String(destinationPincode),
      deadWeightKg: weightNum,
      chargeableWeightKg: quotes[0].chargeableWeightKg,
      quotes,
      unserviceableCouriers,
    });
  } catch (error: any) {
    console.error('[compareB2BRates Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error executing B2B courier comparison engine' },
    });
  }
};

/**
 * Validate a server-generated quote token prior to booking or wallet debit.
 * POST /api/v1/pricing/b2b/validate-quote
 * Supports atomic consumption via consume: true (prevents double booking).
 */
export const validateB2BQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      quoteId,
      originPincode,
      destinationPincode,
      chargeableWeightKg,
      courierId,
      consume = false,
      shipmentId,
    } = req.body;

    const callerMerchantId = req.user?.merchantId || req.user?.userId || req.body.merchantId;

    if (consume) {
      if (!shipmentId) {
        res.status(400).json({
          success: false,
          valid: false,
          code: 'SHIPMENT_ID_REQUIRED',
          message: 'shipmentId is required to consume a quote upon booking.',
        });
        return;
      }

      const consumeResult = await B2BQuoteManagerService.consumeQuote(quoteId, {
        originPincode,
        destinationPincode,
        chargeableWeightKg: chargeableWeightKg ? Number(chargeableWeightKg) : undefined,
        courierId,
        merchantId: callerMerchantId,
        shipmentId,
      });

      if (!consumeResult.valid) {
        res.status(200).json({
          success: false,
          valid: false,
          code: consumeResult.code,
          message: consumeResult.message,
        });
        return;
      }

      const q = consumeResult.quote!;
      res.status(200).json({
        success: true,
        valid: true,
        code: 'QUOTE_CONSUMED',
        message: 'Rate quote verified and successfully bound to shipment.',
        quote: {
          quoteId: q.quoteId,
          expiresAt: q.expiresAt,
          courierId: q.courierId,
          courierName: q.courierName,
          serviceName: q.serviceName,
          rateCardName: q.rateCardName,
          zoneRoute: `${q.originZone} → ${q.destinationZone}`,
          chargeableWeightKg: q.chargeableWeightKg,
          customerFreightINR: q.customerFreightINR,
          customerDocketChargeINR: q.customerDocketChargeINR,
          customerFuelSurchargeINR: q.customerFuelSurchargeINR,
          customerApplicableCharges: q.customerApplicableCharges,
          gstPercent: q.gstPercent,
          gstAmountINR: q.gstAmountINR,
          finalPayableAmountINR: q.finalPayableAmountINR,
          status: 'BOOKED',
          shipmentId: q.shipmentId,
        },
      });
      return;
    }

    const validation = await B2BQuoteManagerService.validateQuote(quoteId, {
      originPincode,
      destinationPincode,
      chargeableWeightKg: chargeableWeightKg ? Number(chargeableWeightKg) : undefined,
      courierId,
      merchantId: callerMerchantId,
    });

    if (!validation.valid) {
      res.status(200).json({
        success: false,
        valid: false,
        code: validation.code,
        message: validation.message,
      });
      return;
    }

    const q = validation.quote!;
    res.status(200).json({
      success: true,
      valid: true,
      quote: {
        quoteId: q.quoteId,
        expiresAt: q.expiresAt,
        courierId: q.courierId,
        courierName: q.courierName,
        serviceName: q.serviceName,
        rateCardName: q.rateCardName,
        zoneRoute: `${q.originZone} → ${q.destinationZone}`,
        chargeableWeightKg: q.chargeableWeightKg,
        customerFreightINR: q.customerFreightINR,
        customerDocketChargeINR: q.customerDocketChargeINR,
        customerFuelSurchargeINR: q.customerFuelSurchargeINR,
        customerApplicableCharges: q.customerApplicableCharges,
        gstPercent: q.gstPercent,
        gstAmountINR: q.gstAmountINR,
        finalPayableAmountINR: q.finalPayableAmountINR,
      },
    });
  } catch (error: any) {
    console.error('[validateB2BQuote Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error validating quote' },
    });
  }
};

/**
 * Endpoint for consuming a quote atomically on booking.
 * POST /api/v1/pricing/b2b/consume-quote
 */
export const consumeB2BQuote = async (req: Request, res: Response): Promise<void> => {
  req.body.consume = true;
  return validateB2BQuote(req, res);
};

/**
 * Bulk import B2B Rate Cards parsed from Excel (.xlsx) sheets
 * POST /api/v1/admin/b2b-rates/bulk-import
 * All imported cards are saved with is_active = false (DRAFT status by default)
 */
export const bulkImportDraftRateCards = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sheets, makeActive = false } = req.body;

    if (!Array.isArray(sheets) || sheets.length === 0) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid payload: "sheets" array is required.' },
      });
      return;
    }

    const createdCards: any[] = [];
    const userId = req.user?.userId || null;

    for (const sheet of sheets) {
      const {
        courierId,
        courierName,
        serviceId,
        serviceName,
        volumetricDivisor = 4500,
        minChargeableWeightKg = 20,
        minFreightChargeINR = 0,
        weightRoundingRule = 'ROUND_UP_1KG',
        fuelSurchargePercent = 0,
        docketChargeINR = 65,
        gstPercent = 18.0,
        zoneMatrix = {},
        surcharges = [],
        zoneCoverage = {},
        pincodeZoneMapping = {},
        sheetName,
        totalRatesFound,
      } = sheet;

      const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const generatedCode = `B2B-${String(courierId || 'EXP').toUpperCase()}-${Date.now().toString().slice(-4)}-${codeSuffix}`;
      const cardName = `${courierName || 'Courier'} B2B Standard (Draft - ${sheetName || 'Sheet'})`;

      const card = await prisma.carrier_rate_cards.create({
        data: {
          rate_card_code: generatedCode,
          name: cardName,
          mode: 'B2B',
          courier_id: String(courierId).toLowerCase().trim(),
          courier_name: String(courierName).trim(),
          service_id: String(serviceId || 'surface_cargo').toLowerCase().trim(),
          service_name: String(serviceName || 'Surface Cargo Standard').trim(),
          volumetric_divisor: Number(volumetricDivisor) || 4500,
          min_chargeable_weight_grams: Math.round((Number(minChargeableWeightKg) || 20) * 1000),
          min_freight_charge_minor: BigInt(Math.round((Number(minFreightChargeINR) || 0) * 100)),
          weight_rounding_rule: String(weightRoundingRule || 'ROUND_UP_1KG'),
          fuel_surcharge_percent: Number(fuelSurchargePercent) || 0,
          docket_charge_minor: BigInt(Math.round((Number(docketChargeINR) || 0) * 100)),
          gst_percent: Number(gstPercent) || 18.0,
          zone_matrix: zoneMatrix || {},
          surcharges: surcharges || [],
          zone_coverage: zoneCoverage || {},
          pincode_zone_mapping: pincodeZoneMapping || {},
          card_type: 'BASE_COST',
          markup_type: 'NONE',
          markup_value: 0,
          version: 'v1.0-draft',
          is_active: Boolean(makeActive),
          description: `Imported from Excel workbook sheet '${sheetName || 'Unknown'}'. Matrix size: ${Object.keys(zoneMatrix).length} origin zones, ${totalRatesFound || 0} zone-pair rates. Status: DRAFT (Pending admin approval).`,
          base_weight_grams: 500,
          base_rate_within_city_minor: BigInt(0),
          base_rate_within_state_minor: BigInt(0),
          base_rate_metro_minor: BigInt(0),
          base_rate_rest_of_india_minor: BigInt(0),
          base_rate_special_zone_minor: BigInt(0),
          additional_weight_grams: 500,
          additional_rate_within_city_minor: BigInt(0),
          additional_rate_within_state_minor: BigInt(0),
          additional_rate_metro_minor: BigInt(0),
          additional_rate_rest_of_india_minor: BigInt(0),
          additional_rate_special_zone_minor: BigInt(0),
        },
      });

      // Audit log
      await prisma.audit_logs.create({
        data: {
          action: 'B2B_RATE_CARD_EXCEL_IMPORTED',
          resource_type: 'B2B_RATE_CARD',
          resource_id: card.id,
          actor_user_id: userId,
          details_json: {
            sheetName,
            courierName: card.courier_name,
            serviceName: card.service_name,
            totalRates: totalRatesFound,
            divisor: card.volumetric_divisor,
            status: card.is_active ? 'ACTIVE' : 'DRAFT',
          },
        },
      }).catch(() => {});

      createdCards.push(card);
    }

    res.status(201).json({
      success: true,
      message: `Successfully imported ${createdCards.length} rate cards in DRAFT status.`,
      data: serializeBigInts(createdCards),
    });
  } catch (error: any) {
    console.error('[bulkImportDraftRateCards Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to bulk import rate cards' },
    });
  }
};

/**
 * Safely activate a rate card:
 * 1. Checks if card exists.
 * 2. Archives (sets is_active=false) any currently active cards for that courier_id and service_id.
 * 3. Sets this card's is_active=true.
 * 4. Logs audit entry with previous active card IDs.
 */
export const activateRateCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.userId || null;

    const targetCard = await prisma.carrier_rate_cards.findUnique({
      where: { id },
    });

    if (!targetCard || targetCard.mode !== 'B2B') {
      res.status(404).json({ success: false, error: { message: 'B2B rate card not found' } });
      return;
    }

    // Find currently active cards for this courier and service to safely replace/archive
    const activeCards = await prisma.carrier_rate_cards.findMany({
      where: {
        courier_id: targetCard.courier_id,
        service_id: targetCard.service_id,
        mode: 'B2B',
        is_active: true,
        id: { not: targetCard.id },
      },
    });

    // Deactivate previous active cards
    if (activeCards.length > 0) {
      await prisma.carrier_rate_cards.updateMany({
        where: {
          id: { in: activeCards.map((c) => c.id) },
        },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });

      for (const oldCard of activeCards) {
        await prisma.audit_logs.create({
          data: {
            action: 'B2B_RATE_CARD_ARCHIVED',
            resource_type: 'B2B_RATE_CARD',
            resource_id: oldCard.id,
            actor_user_id: userId,
            details_json: {
              reason: `Archived automatically upon activation of rate card ${targetCard.name} (${targetCard.rate_card_code})`,
              replacedByRateCardId: targetCard.id,
            },
          },
        }).catch(() => {});
      }
    }

    // Activate this card
    const activated = await prisma.carrier_rate_cards.update({
      where: { id },
      data: {
        is_active: true,
        updated_at: new Date(),
      },
    });

    await prisma.audit_logs.create({
      data: {
        action: 'B2B_RATE_CARD_ACTIVATED',
        resource_type: 'B2B_RATE_CARD',
        resource_id: id,
        actor_user_id: userId,
        details_json: {
          rateCardName: activated.name,
          courier: activated.courier_name,
          service: activated.service_name,
          replacedActiveCardIds: activeCards.map((c) => c.id),
        },
      },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: `Rate card '${activated.name}' is now ACTIVE. ${activeCards.length} previous card(s) safely archived.`,
      data: serializeBigInts(activated),
    });
  } catch (error: any) {
    console.error('[activateRateCard Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to activate rate card' },
    });
  }
};

/**
 * Rollback to a specific rate card version:
 * Re-activates this card and deactivates any other active card for the courier/service.
 */
export const rollbackRateCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.userId || null;

    const targetCard = await prisma.carrier_rate_cards.findUnique({
      where: { id },
    });

    if (!targetCard || targetCard.mode !== 'B2B') {
      res.status(404).json({ success: false, error: { message: 'B2B rate card not found' } });
      return;
    }

    // Safely deactivate currently active cards for this courier/service
    const activeCards = await prisma.carrier_rate_cards.findMany({
      where: {
        courier_id: targetCard.courier_id,
        service_id: targetCard.service_id,
        mode: 'B2B',
        is_active: true,
        id: { not: targetCard.id },
      },
    });

    if (activeCards.length > 0) {
      await prisma.carrier_rate_cards.updateMany({
        where: {
          id: { in: activeCards.map((c) => c.id) },
        },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });
    }

    const rolledBack = await prisma.carrier_rate_cards.update({
      where: { id },
      data: {
        is_active: true,
        updated_at: new Date(),
      },
    });

    await prisma.audit_logs.create({
      data: {
        action: 'B2B_RATE_CARD_ROLLBACK',
        resource_type: 'B2B_RATE_CARD',
        resource_id: id,
        actor_user_id: userId,
        details_json: {
          rateCardName: rolledBack.name,
          version: rolledBack.version,
          deactivatedIds: activeCards.map((c) => c.id),
        },
      },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: `Successfully rolled back to rate card version '${rolledBack.version}' (${rolledBack.name}).`,
      data: serializeBigInts(rolledBack),
    });
  } catch (error: any) {
    console.error('[rollbackRateCard Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to rollback rate card' },
    });
  }
};

/**
 * Update merchant markup configuration on a rate card
 * PATCH /api/v1/admin/b2b-rates/:id/markup
 */
export const updateMerchantMarkup = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { markup_type, markup_value, card_type } = req.body;
    const userId = req.user?.userId || null;

    const existing = await prisma.carrier_rate_cards.findUnique({
      where: { id },
    });

    if (!existing || existing.mode !== 'B2B') {
      res.status(404).json({ success: false, error: { message: 'B2B rate card not found' } });
      return;
    }

    const updated = await prisma.carrier_rate_cards.update({
      where: { id },
      data: {
        markup_type: markup_type !== undefined ? String(markup_type) : existing.markup_type,
        markup_value: markup_value !== undefined ? Number(markup_value) : existing.markup_value,
        card_type: card_type !== undefined ? String(card_type) : existing.card_type,
        updated_at: new Date(),
      },
    });

    await prisma.audit_logs.create({
      data: {
        action: 'B2B_RATE_CARD_MARKUP_UPDATED',
        resource_type: 'B2B_RATE_CARD',
        resource_id: id,
        actor_user_id: userId,
        details_json: {
          rateCardName: updated.name,
          markup_type: updated.markup_type,
          markup_value: updated.markup_value,
          card_type: updated.card_type,
        },
      },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: `Markup updated successfully for '${updated.name}'.`,
      data: serializeBigInts(updated),
    });
  } catch (error: any) {
    console.error('[updateMerchantMarkup Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to update markup' },
    });
  }
};
