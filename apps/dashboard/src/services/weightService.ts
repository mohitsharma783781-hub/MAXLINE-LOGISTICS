/**
 * Centralized Weight & Dimension Calculation Service
 * Standardizes actual and volumetric weight handling in integer grams and millimeters.
 */

export const WeightCalculationService = {
  // Convert KG to integer grams
  normalizeWeightToGrams: (weightKg: number = 0): number => {
    return Math.max(0, Math.round(weightKg * 1000));
  },

  // Convert CM to integer millimeters
  normalizeDimensionsToMm: (cm: number = 0): number => {
    return Math.max(0, Math.round(cm * 10));
  },

  // Calculate volumetric weight in grams: (L_mm * W_mm * H_mm * count) / divisor_mm3_per_gram
  // Default divisor = 5000 cm3/kg = 5,000,000 mm3/kg => 5000 mm3/g
  calculateVolumetricWeightGrams: (
    lengthMm: number = 0,
    widthMm: number = 0,
    heightMm: number = 0,
    packageCount: number = 1,
    divisorCm3PerKg: number = 5000
  ): number => {
    if (lengthMm <= 0 || widthMm <= 0 || heightMm <= 0) return 0;
    const totalVolumeMm3 = lengthMm * widthMm * heightMm * Math.max(1, packageCount);
    // 1 cm3 = 1000 mm3. Divisor in mm3/g = divisorCm3PerKg * 1000 / 1000 = divisorCm3PerKg
    const weightGrams = Math.round(totalVolumeMm3 / divisorCm3PerKg);
    return Math.max(0, weightGrams);
  },

  // Calculate chargeable weight in grams
  calculateChargeableWeightGrams: (actualGrams: number, volumetricGrams: number): number => {
    return Math.max(actualGrams, volumetricGrams);
  },
};
