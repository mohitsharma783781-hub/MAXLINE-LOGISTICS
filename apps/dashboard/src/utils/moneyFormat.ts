/**
 * Money formatting utility functions
 * Enforces integer minor units (paise) internally to prevent floating point inaccuracy.
 */

// Format integer paise to Indian Rupee (INR) string
export const formatMinorToINR = (minorAmount: number = 0): string => {
  const rupees = minorAmount / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
};

// Convert float/number INR amount to integer minor units (paise)
export const parseINRToMinor = (inrAmount: number = 0): number => {
  return Math.round(inrAmount * 100);
};
