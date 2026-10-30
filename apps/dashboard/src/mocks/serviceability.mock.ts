import type {
  PinMasterItem,
  ZoneScheme,
  CourierZone,
  ZoneMappingItem,
  ServiceabilityImportLog,
} from '../types/serviceability';

// 1. PIN Master Store (Canonical Indian Postal Codes)
export const DEMO_PIN_MASTER: PinMasterItem[] = [
  { id: 'pin-110001', country: 'IN', postalCode: '110001', city: 'New Delhi', district: 'Central Delhi', state: 'Delhi', stateCode: 'DL', countryCode: 'IN', status: 'ACTIVE', createdAt: '2026-01-01', updatedAt: '2026-08-01' },
  { id: 'pin-110002', country: 'IN', postalCode: '110002', city: 'New Delhi', district: 'Central Delhi', state: 'Delhi', stateCode: 'DL', countryCode: 'IN', status: 'ACTIVE', createdAt: '2026-01-01', updatedAt: '2026-08-01' },
  { id: 'pin-400001', country: 'IN', postalCode: '400001', city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', stateCode: 'MH', countryCode: 'IN', status: 'ACTIVE', createdAt: '2026-01-01', updatedAt: '2026-08-01' },
  { id: 'pin-400002', country: 'IN', postalCode: '400002', city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', stateCode: 'MH', countryCode: 'IN', status: 'ACTIVE', createdAt: '2026-01-01', updatedAt: '2026-08-01' },
  { id: 'pin-560001', country: 'IN', postalCode: '560001', city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', stateCode: 'KA', countryCode: 'IN', status: 'ACTIVE', createdAt: '2026-01-01', updatedAt: '2026-08-01' },
  { id: 'pin-560038', country: 'IN', postalCode: '560038', city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', stateCode: 'KA', countryCode: 'IN', status: 'ACTIVE', createdAt: '2026-01-01', updatedAt: '2026-08-01' },
  { id: 'pin-700001', country: 'IN', postalCode: '700001', city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', stateCode: 'WB', countryCode: 'IN', status: 'ACTIVE', createdAt: '2026-01-01', updatedAt: '2026-08-01' },
  { id: 'pin-600001', country: 'IN', postalCode: '600001', city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', stateCode: 'TN', countryCode: 'IN', status: 'ACTIVE', createdAt: '2026-01-01', updatedAt: '2026-08-01' },
  { id: 'pin-160001', country: 'IN', postalCode: '160001', city: 'Chandigarh', district: 'Chandigarh', state: 'Punjab', stateCode: 'PB', countryCode: 'IN', status: 'ACTIVE', createdAt: '2026-01-01', updatedAt: '2026-08-01' },
  { id: 'pin-382445', country: 'IN', postalCode: '382445', city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', stateCode: 'GJ', countryCode: 'IN', status: 'ACTIVE', createdAt: '2026-01-01', updatedAt: '2026-08-01' },
];

// 2. Zone Schemes Store
export const DEMO_ZONE_SCHEMES: ZoneScheme[] = [
  {
    id: 'zs-del-b2c',
    name: 'Delhivery B2C Surface Zone Scheme 2026',
    code: 'DEL_B2C_2026',
    courierId: 'delhivery',
    courierName: 'Delhivery Surface & Express',
    courierAccountId: 'acc-del-01',
    serviceId: 'srv-del-01',
    serviceCode: 'DEL_SURFACE_B2C',
    mode: 'B2C',
    version: 'v1.0',
    status: 'ACTIVE',
    createdAt: '2026-01-10',
    updatedAt: '2026-08-20',
  },
  {
    id: 'zs-del-b2b',
    name: 'Delhivery B2B Freight Commercial Zone Scheme 2026',
    code: 'DEL_B2B_2026',
    courierId: 'delhivery',
    courierName: 'Delhivery Surface & Express',
    courierAccountId: 'acc-del-01',
    serviceId: 'srv-del-03',
    serviceCode: 'DEL_SURFACE_B2B',
    mode: 'B2B',
    version: 'v1.0',
    status: 'ACTIVE',
    createdAt: '2026-02-01',
    updatedAt: '2026-08-15',
  },
  {
    id: 'zs-bd-b2c',
    name: 'BlueDart Air Express Zone Scheme 2026',
    code: 'BD_AIR_2026',
    courierId: 'bluedart',
    courierName: 'BlueDart Air Express',
    courierAccountId: 'acc-bd-01',
    serviceId: 'srv-bd-01',
    serviceCode: 'BD_AIR_EXPRESS',
    mode: 'B2C',
    version: 'v1.0',
    status: 'ACTIVE',
    createdAt: '2026-01-15',
    updatedAt: '2026-08-21',
  },
];

// 3. Courier Zones Store
export const DEMO_COURIER_ZONES: CourierZone[] = [
  { id: 'zone-del-n1', schemeId: 'zs-del-b2c', code: 'N1', name: 'North Zone 1 (NCR & Metro)', pinCount: 3, status: 'ACTIVE', createdAt: '2026-01-10' },
  { id: 'zone-del-w1', schemeId: 'zs-del-b2c', code: 'W1', name: 'West Zone 1 (Mumbai & Pune)', pinCount: 2, status: 'ACTIVE', createdAt: '2026-01-10' },
  { id: 'zone-del-s1', schemeId: 'zs-del-b2c', code: 'S1', name: 'South Zone 1 (Bengaluru)', pinCount: 2, status: 'ACTIVE', createdAt: '2026-01-10' },
  { id: 'zone-del-e1', schemeId: 'zs-del-b2c', code: 'E1', name: 'East Zone 1 (Kolkata)', pinCount: 1, status: 'ACTIVE', createdAt: '2026-01-10' },
  { id: 'zone-del-b2b-n1', schemeId: 'zs-del-b2b', code: 'N1_COMMERCIAL', name: 'North Commercial Freight', pinCount: 3, status: 'ACTIVE', createdAt: '2026-02-01' },
  { id: 'zone-bd-n1', schemeId: 'zs-bd-b2c', code: 'AIR_NORTH', name: 'Air Express North Hub', pinCount: 3, status: 'ACTIVE', createdAt: '2026-01-15' },
];

// 4. Zone Mapping Items (Courier + Account + Service + Mode + Zone + PIN)
export const DEMO_ZONE_MAPPINGS: ZoneMappingItem[] = [
  // Delhivery B2C Mappings
  { id: 'zm-01', schemeId: 'zs-del-b2c', zoneId: 'zone-del-n1', zoneCode: 'N1', postalCode: '110001', courierId: 'delhivery', courierAccountId: 'acc-del-01', serviceId: 'srv-del-01', mode: 'B2C', forward: true, cod: true, prepaid: true, pickup: true, rto: true, status: 'ACTIVE', createdAt: '2026-01-10', updatedAt: '2026-08-20' },
  { id: 'zm-02', schemeId: 'zs-del-b2c', zoneId: 'zone-del-n1', zoneCode: 'N1', postalCode: '110002', courierId: 'delhivery', courierAccountId: 'acc-del-01', serviceId: 'srv-del-01', mode: 'B2C', forward: true, cod: true, prepaid: true, pickup: true, rto: true, status: 'ACTIVE', createdAt: '2026-01-10', updatedAt: '2026-08-20' },
  { id: 'zm-03', schemeId: 'zs-del-b2c', zoneId: 'zone-del-w1', zoneCode: 'W1', postalCode: '400001', courierId: 'delhivery', courierAccountId: 'acc-del-01', serviceId: 'srv-del-01', mode: 'B2C', forward: true, cod: true, prepaid: true, pickup: true, rto: true, status: 'ACTIVE', createdAt: '2026-01-10', updatedAt: '2026-08-20' },
  { id: 'zm-04', schemeId: 'zs-del-b2c', zoneId: 'zone-del-s1', zoneCode: 'S1', postalCode: '560038', courierId: 'delhivery', courierAccountId: 'acc-del-01', serviceId: 'srv-del-01', mode: 'B2C', forward: true, cod: true, prepaid: true, pickup: true, rto: true, status: 'ACTIVE', createdAt: '2026-01-10', updatedAt: '2026-08-20' },
  { id: 'zm-05', schemeId: 'zs-del-b2c', zoneId: 'zone-del-s1', zoneCode: 'S1', postalCode: '560001', courierId: 'delhivery', courierAccountId: 'acc-del-01', serviceId: 'srv-del-01', mode: 'B2C', forward: true, cod: false, prepaid: true, pickup: true, rto: true, status: 'ACTIVE', createdAt: '2026-01-10', updatedAt: '2026-08-20' },

  // Delhivery B2B Mappings
  { id: 'zm-06', schemeId: 'zs-del-b2b', zoneId: 'zone-del-b2b-n1', zoneCode: 'N1_COMMERCIAL', postalCode: '110001', courierId: 'delhivery', courierAccountId: 'acc-del-01', serviceId: 'srv-del-03', mode: 'B2B', forward: true, cod: false, prepaid: true, pickup: true, rto: true, status: 'ACTIVE', createdAt: '2026-02-01', updatedAt: '2026-08-15' },
  { id: 'zm-07', schemeId: 'zs-del-b2b', zoneId: 'zone-del-b2b-n1', zoneCode: 'N1_COMMERCIAL', postalCode: '382445', courierId: 'delhivery', courierAccountId: 'acc-del-01', serviceId: 'srv-del-03', mode: 'B2B', forward: true, cod: false, prepaid: true, pickup: true, rto: true, status: 'ACTIVE', createdAt: '2026-02-01', updatedAt: '2026-08-15' },

  // BlueDart Air Mappings
  { id: 'zm-08', schemeId: 'zs-bd-b2c', zoneId: 'zone-bd-n1', zoneCode: 'AIR_NORTH', postalCode: '110001', courierId: 'bluedart', courierAccountId: 'acc-bd-01', serviceId: 'srv-bd-01', mode: 'B2C', forward: true, cod: true, prepaid: true, pickup: true, rto: true, status: 'ACTIVE', createdAt: '2026-01-15', updatedAt: '2026-08-21' },
  { id: 'zm-09', schemeId: 'zs-bd-b2c', zoneId: 'zone-bd-n1', zoneCode: 'AIR_NORTH', postalCode: '400001', courierId: 'bluedart', courierAccountId: 'acc-bd-01', serviceId: 'srv-bd-01', mode: 'B2C', forward: true, cod: true, prepaid: true, pickup: true, rto: true, status: 'ACTIVE', createdAt: '2026-01-15', updatedAt: '2026-08-21' },
];

// 5. Bulk Serviceability Import History Logs
export const DEMO_IMPORT_LOGS: ServiceabilityImportLog[] = [
  {
    id: 'log-001',
    filename: 'delhivery_b2c_pincodes_aug2026.csv',
    courierId: 'delhivery',
    courierName: 'Delhivery Surface & Express',
    serviceId: 'srv-del-01',
    mode: 'B2C',
    uploadedBy: 'Admin User (admin@apexshipping.com)',
    totalRows: 150,
    validRows: 148,
    errorRows: 2,
    newRows: 120,
    updatedRows: 28,
    status: 'PUBLISHED',
    createdAt: '2026-08-20 02:30 PM',
  },
  {
    id: 'log-002',
    filename: 'bluedart_air_pincodes_q3.csv',
    courierId: 'bluedart',
    courierName: 'BlueDart Air Express',
    serviceId: 'srv-bd-01',
    mode: 'B2C',
    uploadedBy: 'Admin User (admin@apexshipping.com)',
    totalRows: 85,
    validRows: 85,
    errorRows: 0,
    newRows: 85,
    updatedRows: 0,
    status: 'PUBLISHED',
    createdAt: '2026-08-21 09:15 AM',
  },
];
