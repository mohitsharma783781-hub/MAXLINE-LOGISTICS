import type { B2BRateCard, B2BSurchargeConfig, B2BZoneCode } from '../types/b2bPricing';
import { B2B_ZONES } from '../types/b2bPricing';

export const DEMO_ORIGIN_ZONES: B2BZoneCode[] = B2B_ZONES;
export const DEMO_DEST_ZONES: B2BZoneCode[] = B2B_ZONES;

export const DEMO_B2B_SURCHARGES: B2BSurchargeConfig[] = [
  { id: 'sur-docket', name: 'Docket Charge', code: 'DOCKET', calcType: 'PER_DOCKET', value: 2500, status: 'ACTIVE' }, // ₹25
  { id: 'sur-fuel', name: 'Fuel Surcharge', code: 'FUEL', calcType: 'PERCENTAGE', value: 10, status: 'ACTIVE' }, // 10%
  { id: 'sur-rov', name: 'ROV Charge', code: 'ROV', calcType: 'PERCENTAGE_OF_INVOICE_VALUE', value: 0.2, minAmountPaise: 5000, status: 'ACTIVE' },
  { id: 'sur-insurance', name: 'Insurance Charge', code: 'INSURANCE', calcType: 'PERCENTAGE_OF_INVOICE_VALUE', value: 0.1, minAmountPaise: 2500, status: 'ACTIVE' },
  { id: 'sur-cod', name: 'COD Fee', code: 'COD', calcType: 'PERCENTAGE_OF_COD', value: 1.5, minAmountPaise: 3000, status: 'ACTIVE' },
  { id: 'sur-handling', name: 'Handling Charge', code: 'HANDLING', calcType: 'PER_KG', value: 100, status: 'ACTIVE' },
  { id: 'sur-fm', name: 'First Mile (FM) Charge', code: 'FM', calcType: 'PER_SHIPMENT', value: 2500, status: 'ACTIVE' },
  { id: 'sur-appointment', name: 'Appointment Delivery Charge', code: 'APPOINTMENT', calcType: 'PER_SHIPMENT', value: 5000, status: 'ACTIVE' },
  { id: 'sur-other', name: 'Other Freight Charge', code: 'OTHER', calcType: 'FIXED', value: 1000, status: 'ACTIVE' },
];

// Helper to build realistic 16x16 B2B rate matrix (rate in paise per KG, e.g., 530 = ₹5.30/KG)
const buildFullMatrixMap = (multiplier: number): Record<string, Record<string, number>> => {
  const map: Record<string, Record<string, number>> = {};

  B2B_ZONES.forEach((oz, i) => {
    map[oz] = {};
    B2B_ZONES.forEach((dz, j) => {
      let basePriceINR = 5.3; // Default ₹5.30/KG
      if (oz === dz) {
        basePriceINR = 4.8;
      } else if (oz === 'N2' && dz === 'N3') {
        basePriceINR = 5.3; // Explicit ₹5.30/KG for N2 -> N3
      } else if (Math.abs(i - j) <= 2) {
        basePriceINR = 6.2;
      } else if (Math.abs(i - j) <= 5) {
        basePriceINR = 8.5;
      } else {
        basePriceINR = 12.0;
      }
      map[oz][dz] = Math.round(basePriceINR * multiplier * 100);
    });
  });

  return map;
};

export const DEMO_B2B_RATE_CARDS: B2BRateCard[] = [
  {
    id: 'b2b-src-merchant-tier1',
    name: 'Delhivery B2B Freight Surface Rate Card',
    code: 'DEL_B2B_SURFACE_2026',
    courierId: 'delhivery',
    courierName: 'Delhivery B2B Express',
    serviceId: 'DEL_SURFACE_B2B',
    serviceName: 'Delhivery B2B Freight Surface',
    tenantId: 'tenant-demo-01',
    merchantName: 'Apex Logistics & Retail',
    isCustomerSellingCard: true,
    volumetricDivisor: 5000,
    minBillableWeightGrams: 20000, // 20 KG min
    minFreightPaise: 35000, // ₹350 minimum freight rule
    gstPercent: 18,
    additionalKgRatePaise: 530,
    matrixMap: buildFullMatrixMap(1.0),
    weightSlabs: [],
    matrixCells: [],
    surcharges: DEMO_B2B_SURCHARGES,
    versions: [
      { version: 'v1.0', updatedBy: 'Super Admin', updatedAt: '2026-08-01 10:00 AM', changelog: 'Initial baseline B2B Freight Card' },
      { version: 'v1.1', updatedBy: 'Super Admin', updatedAt: '2026-08-05 02:00 PM', changelog: 'Updated N1->N2 cell rate from ₹6.60 to ₹6.80' },
      { version: 'v1.2', updatedBy: 'Super Admin', updatedAt: '2026-08-15 11:30 AM', changelog: 'Configured 5000 Divisor, ₹350 Min Freight & Docket Charges' },
    ],
    currency: 'INR',
    version: 'v1.2',
    status: 'ACTIVE',
    effectiveFrom: '2026-08-01',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-15',
  },
  {
    id: 'b2b-src-bluedart-v2',
    name: 'Blue Dart Air Cargo Rate Card',
    code: 'BD_B2B_AIR_2026',
    courierId: 'bluedart',
    courierName: 'Blue Dart Air Express',
    serviceId: 'BD_AIR_B2B',
    serviceName: 'Blue Dart B2B Air Freight',
    tenantId: 'tenant-demo-03',
    merchantName: 'Nova Enterprise Solutions',
    isCustomerSellingCard: true,
    volumetricDivisor: 4500,
    minBillableWeightGrams: 20000, // 20 KG min
    minFreightPaise: 45000, // ₹450 minimum freight rule
    gstPercent: 18,
    additionalKgRatePaise: 1200,
    matrixMap: buildFullMatrixMap(1.5),
    weightSlabs: [],
    matrixCells: [],
    surcharges: DEMO_B2B_SURCHARGES,
    versions: [
      { version: 'v1.0', updatedBy: 'Super Admin', updatedAt: '2026-08-05 12:00 PM', changelog: 'Initial B2B Air Express Card' },
    ],
    currency: 'INR',
    version: 'v1.0',
    status: 'ACTIVE',
    effectiveFrom: '2026-08-05',
    createdAt: '2026-08-05',
    updatedAt: '2026-08-05',
  },
];
