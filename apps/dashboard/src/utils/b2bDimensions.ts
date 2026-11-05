/**
 * MAXLINE LOGISTICS — Authoritative Delhivery B2B 10 CFT Dimensional Density Engine
 * 
 * Commercial freight volumetric conversion:
 * 1 CFT = 1,728 cubic inches = 28,316.85 cm³
 * Under Delhivery Commercial Freight Contract standards (10 CFT density):
 * Weight Factor = 10 kg per CFT
 * Standard Logistics Divisor = 27,000 cm³ per CFT
 * Volumetric Weight (kg) = (Length_cm * Width_cm * Height_cm / 27,000) * 10
 *                        = (Length_cm * Width_cm * Height_cm) / 2,700
 * Minimum Chargeable Billing Slab = 20 KG (Commercial B2B Freight standard)
 */

export interface B2BBoxCalculationItem {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  actualWeightKg: number;
  boxCount?: number;
  quantity?: number;
  description?: string;
}

export interface B2BCalculationSummary {
  totalBoxes: number;
  totalActualWeightKg: number;
  totalVolumetricWeightKg: number;
  rawChargeableWeightKg: number;
  minSlabKg: number;
  chargeableWeightKg: number;
  volumetricDivisor: number; // 2700 (equivalent to 27000 with 10kg factor)
  isMinSlabApplied: boolean;
  boxBreakdown: Array<{
    boxIndex: number;
    count: number;
    dimensions: string;
    actualKgPerBox: number;
    volumetricKgPerBox: number;
    totalActualKg: number;
    totalVolumetricKg: number;
  }>;
}

export const B2B_10CFT_CONFIG = {
  CFT_DIVISOR_CM3: 27000,
  CFT_WEIGHT_FACTOR_KG: 10,
  EFFECTIVE_DIVISOR: 2700, // 27000 / 10
  MIN_SLAB_KG: 20,
};

/**
 * Calculate 10 CFT Volumetric Weight in KG for a single box
 * Formula: (L * W * H / 27000) * 10
 */
export function calculate10CftBoxVolumetricKg(lengthCm: number, widthCm: number, heightCm: number): number {
  const l = Math.max(0, Number(lengthCm) || 0);
  const w = Math.max(0, Number(widthCm) || 0);
  const h = Math.max(0, Number(heightCm) || 0);
  const volumeCm3 = l * w * h;
  const volKg = (volumeCm3 / B2B_10CFT_CONFIG.CFT_DIVISOR_CM3) * B2B_10CFT_CONFIG.CFT_WEIGHT_FACTOR_KG;
  return Math.round(volKg * 100) / 100;
}

/**
 * Compute aggregate consignment metrics across multiple cartons
 * Enforces the 20 KG minimum chargeable weight slab
 */
export function computeB2B10CftConsignment(boxes: B2BBoxCalculationItem[]): B2BCalculationSummary {
  let totalBoxes = 0;
  let totalActualWeightKg = 0;
  let totalVolumetricWeightKg = 0;

  const validBoxes = (boxes && boxes.length > 0) ? boxes : [];

  const boxBreakdown = validBoxes.map((b, idx) => {
    const count = Math.max(1, Number(b.boxCount || b.quantity || 1));
    const l = Math.max(1, Number(b.lengthCm || 10));
    const w = Math.max(1, Number(b.widthCm || 10));
    const h = Math.max(1, Number(b.heightCm || 10));
    const act = Math.max(0.1, Number(b.actualWeightKg || 1));
    const vol = calculate10CftBoxVolumetricKg(l, w, h);

    const lineActual = act * count;
    const lineVolumetric = vol * count;

    totalBoxes += count;
    totalActualWeightKg += lineActual;
    totalVolumetricWeightKg += lineVolumetric;

    return {
      boxIndex: idx + 1,
      count,
      dimensions: `${l} × ${w} × ${h} cm`,
      actualKgPerBox: Math.round(act * 100) / 100,
      volumetricKgPerBox: vol,
      totalActualKg: Math.round(lineActual * 100) / 100,
      totalVolumetricKg: Math.round(lineVolumetric * 100) / 100,
    };
  });

  const totalActRounded = Math.round(totalActualWeightKg * 100) / 100;
  const totalVolRounded = Math.round(totalVolumetricWeightKg * 100) / 100;
  const rawChargeable = Math.max(totalActRounded, totalVolRounded);
  const chargeableWeightKg = Math.max(B2B_10CFT_CONFIG.MIN_SLAB_KG, Math.round(rawChargeable * 100) / 100);

  return {
    totalBoxes,
    totalActualWeightKg: totalActRounded,
    totalVolumetricWeightKg: totalVolRounded,
    rawChargeableWeightKg: rawChargeable,
    minSlabKg: B2B_10CFT_CONFIG.MIN_SLAB_KG,
    chargeableWeightKg,
    volumetricDivisor: B2B_10CFT_CONFIG.EFFECTIVE_DIVISOR,
    isMinSlabApplied: chargeableWeightKg === B2B_10CFT_CONFIG.MIN_SLAB_KG && rawChargeable < B2B_10CFT_CONFIG.MIN_SLAB_KG,
    boxBreakdown,
  };
}
