import type {
  CostRateCard,
  WeightSlab,
  ZoneRateMatrixItem,
  CostRateImportLog,
} from '../types/costRates';

// 1. Cost Rate Cards Store (Platform Cost Rates for Couriers)
export const DEMO_COST_RATE_CARDS: CostRateCard[] = [
  {
    id: 'crc-del-b2c-v1',
    name: 'Delhivery B2C Surface Cost Rate Card 2026',
    code: 'CRC_DEL_B2C_2026',
    courierId: 'delhivery',
    courierName: 'Delhivery Surface & Express',
    courierAccountId: 'acc-del-01',
    accountCode: 'DEL-ACC-001',
    serviceId: 'srv-del-01',
    serviceCode: 'DEL_SURFACE_B2C',
    serviceName: 'Delhivery Surface B2C Standard',
    mode: 'B2C',
    zoneSchemeId: 'zs-del-b2c',
    zoneSchemeName: 'Delhivery B2C Surface Zone Scheme 2026',
    zoneType: 'DESTINATION_ZONE',
    currency: 'INR',
    version: 'v1.0',
    status: 'ACTIVE',
    effectiveFrom: '2026-01-01',
    createdAt: '2026-01-10',
    updatedAt: '2026-08-20',
  },
  {
    id: 'crc-del-b2b-v1',
    name: 'Delhivery B2B Commercial Freight Cost Rate Card 2026',
    code: 'CRC_DEL_B2B_2026',
    courierId: 'delhivery',
    courierName: 'Delhivery Surface & Express',
    courierAccountId: 'acc-del-01',
    accountCode: 'DEL-ACC-001',
    serviceId: 'srv-del-03',
    serviceCode: 'DEL_SURFACE_B2B',
    serviceName: 'Delhivery B2B Freight Commercial',
    mode: 'B2B',
    zoneSchemeId: 'zs-del-b2b',
    zoneSchemeName: 'Delhivery B2B Freight Commercial Zone Scheme 2026',
    zoneType: 'DESTINATION_ZONE',
    currency: 'INR',
    version: 'v1.0',
    status: 'ACTIVE',
    effectiveFrom: '2026-02-01',
    createdAt: '2026-02-01',
    updatedAt: '2026-08-15',
  },
  {
    id: 'crc-bd-b2c-v1',
    name: 'BlueDart Air Apex Cost Rate Card 2026',
    code: 'CRC_BD_AIR_2026',
    courierId: 'bluedart',
    courierName: 'BlueDart Air Express',
    courierAccountId: 'acc-bd-01',
    accountCode: 'BD-ACC-9041',
    serviceId: 'srv-bd-01',
    serviceCode: 'BD_AIR_EXPRESS',
    serviceName: 'BlueDart Air Apex Priority',
    mode: 'B2C',
    zoneSchemeId: 'zs-bd-b2c',
    zoneSchemeName: 'BlueDart Air Express Zone Scheme 2026',
    zoneType: 'DESTINATION_ZONE',
    currency: 'INR',
    version: 'v1.0',
    status: 'ACTIVE',
    effectiveFrom: '2026-01-15',
    createdAt: '2026-01-15',
    updatedAt: '2026-08-21',
  },
];

// 2. Weight Slabs Store
export const DEMO_WEIGHT_SLABS: WeightSlab[] = [
  // Delhivery B2C Slabs
  { id: 'slab-del-01', rateCardId: 'crc-del-b2c-v1', minWeightGrams: 0, maxWeightGrams: 500, label: '0–500g', slabType: 'BASE', sequence: 1, status: 'ACTIVE' },
  { id: 'slab-del-02', rateCardId: 'crc-del-b2c-v1', minWeightGrams: 501, maxWeightGrams: 1000, label: '501g–1kg', slabType: 'BASE', sequence: 2, status: 'ACTIVE' },
  { id: 'slab-del-03', rateCardId: 'crc-del-b2c-v1', minWeightGrams: 1001, maxWeightGrams: 2000, label: '1–2kg', slabType: 'BASE', sequence: 3, status: 'ACTIVE' },
  { id: 'slab-del-04', rateCardId: 'crc-del-b2c-v1', minWeightGrams: 2001, maxWeightGrams: 999999, label: 'Additional KG', slabType: 'ADDITIONAL', sequence: 4, status: 'ACTIVE' },

  // Delhivery B2B Slabs
  { id: 'slab-b2b-01', rateCardId: 'crc-del-b2b-v1', minWeightGrams: 0, maxWeightGrams: 5000, label: '0–5kg Freight Base', slabType: 'BASE', sequence: 1, status: 'ACTIVE' },
  { id: 'slab-b2b-02', rateCardId: 'crc-del-b2b-v1', minWeightGrams: 5001, maxWeightGrams: 20000, label: '5–20kg Freight Medium', slabType: 'BASE', sequence: 2, status: 'ACTIVE' },
  { id: 'slab-b2b-03', rateCardId: 'crc-del-b2b-v1', minWeightGrams: 20001, maxWeightGrams: 999999, label: 'Additional KG Freight', slabType: 'ADDITIONAL', sequence: 3, status: 'ACTIVE' },

  // BlueDart Air Slabs
  { id: 'slab-bd-01', rateCardId: 'crc-bd-b2c-v1', minWeightGrams: 0, maxWeightGrams: 500, label: '0–500g Air Base', slabType: 'BASE', sequence: 1, status: 'ACTIVE' },
  { id: 'slab-bd-02', rateCardId: 'crc-bd-b2c-v1', minWeightGrams: 501, maxWeightGrams: 1000, label: '501g–1kg Air', slabType: 'BASE', sequence: 2, status: 'ACTIVE' },
  { id: 'slab-bd-03', rateCardId: 'crc-bd-b2c-v1', minWeightGrams: 1001, maxWeightGrams: 999999, label: 'Additional KG Air', slabType: 'ADDITIONAL', sequence: 3, status: 'ACTIVE' },
];

// 3. Zone Rate Matrix (Rates in Integer Paise to avoid floating-point errors. 4000 = ₹40.00)
export const DEMO_ZONE_RATES: ZoneRateMatrixItem[] = [
  // Delhivery B2C Rates
  // Zone N1
  { id: 'zr-01', rateCardId: 'crc-del-b2c-v1', zoneCode: 'N1', slabId: 'slab-del-01', baseRatePaise: 4000, status: 'ACTIVE' }, // ₹40.00
  { id: 'zr-02', rateCardId: 'crc-del-b2c-v1', zoneCode: 'N1', slabId: 'slab-del-02', baseRatePaise: 4500, status: 'ACTIVE' }, // ₹45.00
  { id: 'zr-03', rateCardId: 'crc-del-b2c-v1', zoneCode: 'N1', slabId: 'slab-del-03', baseRatePaise: 5500, status: 'ACTIVE' }, // ₹55.00
  { id: 'zr-04', rateCardId: 'crc-del-b2c-v1', zoneCode: 'N1', slabId: 'slab-del-04', baseRatePaise: 0, additionalKgRatePaise: 2000, status: 'ACTIVE' }, // ₹20.00 / addl KG

  // Zone W1
  { id: 'zr-05', rateCardId: 'crc-del-b2c-v1', zoneCode: 'W1', slabId: 'slab-del-01', baseRatePaise: 5000, status: 'ACTIVE' }, // ₹50.00
  { id: 'zr-06', rateCardId: 'crc-del-b2c-v1', zoneCode: 'W1', slabId: 'slab-del-02', baseRatePaise: 5500, status: 'ACTIVE' }, // ₹55.00
  { id: 'zr-07', rateCardId: 'crc-del-b2c-v1', zoneCode: 'W1', slabId: 'slab-del-03', baseRatePaise: 6500, status: 'ACTIVE' }, // ₹65.00
  { id: 'zr-08', rateCardId: 'crc-del-b2c-v1', zoneCode: 'W1', slabId: 'slab-del-04', baseRatePaise: 0, additionalKgRatePaise: 2500, status: 'ACTIVE' }, // ₹25.00 / addl KG

  // Zone S1
  { id: 'zr-09', rateCardId: 'crc-del-b2c-v1', zoneCode: 'S1', slabId: 'slab-del-01', baseRatePaise: 6000, status: 'ACTIVE' }, // ₹60.00
  { id: 'zr-10', rateCardId: 'crc-del-b2c-v1', zoneCode: 'S1', slabId: 'slab-del-02', baseRatePaise: 6500, status: 'ACTIVE' }, // ₹65.00
  { id: 'zr-11', rateCardId: 'crc-del-b2c-v1', zoneCode: 'S1', slabId: 'slab-del-03', baseRatePaise: 7500, status: 'ACTIVE' }, // ₹75.00
  { id: 'zr-12', rateCardId: 'crc-del-b2c-v1', zoneCode: 'S1', slabId: 'slab-del-04', baseRatePaise: 0, additionalKgRatePaise: 3000, status: 'ACTIVE' }, // ₹30.00 / addl KG

  // Delhivery B2B Rates
  { id: 'zr-b2b-01', rateCardId: 'crc-del-b2b-v1', zoneCode: 'N1_COMMERCIAL', slabId: 'slab-b2b-01', baseRatePaise: 25000, status: 'ACTIVE' }, // ₹250.00
  { id: 'zr-b2b-02', rateCardId: 'crc-del-b2b-v1', zoneCode: 'N1_COMMERCIAL', slabId: 'slab-b2b-02', baseRatePaise: 65000, status: 'ACTIVE' }, // ₹650.00
  { id: 'zr-b2b-03', rateCardId: 'crc-del-b2b-v1', zoneCode: 'N1_COMMERCIAL', slabId: 'slab-b2b-03', baseRatePaise: 0, additionalKgRatePaise: 1800, status: 'ACTIVE' }, // ₹18.00 / addl KG

  // BlueDart Air Rates
  { id: 'zr-bd-01', rateCardId: 'crc-bd-b2c-v1', zoneCode: 'AIR_NORTH', slabId: 'slab-bd-01', baseRatePaise: 9000, status: 'ACTIVE' }, // ₹90.00
  { id: 'zr-bd-02', rateCardId: 'crc-bd-b2c-v1', zoneCode: 'AIR_NORTH', slabId: 'slab-bd-02', baseRatePaise: 11000, status: 'ACTIVE' }, // ₹110.00
  { id: 'zr-bd-03', rateCardId: 'crc-bd-b2c-v1', zoneCode: 'AIR_NORTH', slabId: 'slab-bd-03', baseRatePaise: 0, additionalKgRatePaise: 4500, status: 'ACTIVE' }, // ₹45.00 / addl KG
];

// 4. Rate Import History Logs
export const DEMO_COST_RATE_IMPORT_LOGS: CostRateImportLog[] = [
  {
    id: 'crlog-001',
    filename: 'delhivery_cost_rates_q3_2026.csv',
    rateCardId: 'crc-del-b2c-v1',
    rateCardName: 'Delhivery B2C Surface Cost Rate Card 2026',
    uploadedBy: 'Super Admin (admin@apexshipping.com)',
    totalRows: 16,
    validRows: 16,
    errorRows: 0,
    status: 'PUBLISHED',
    createdAt: '2026-08-20 03:45 PM',
  },
];
