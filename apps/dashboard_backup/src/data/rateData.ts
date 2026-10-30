import { ZoneTariff } from '../types/dashboard';

export interface WarehouseHub {
  id: string;
  name: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export const DEMO_WAREHOUSES: WarehouseHub[] = [
  {
    id: 'wh-1',
    name: 'Bhiwandi Central Fulfillment Hub',
    city: 'Bhiwandi (Mumbai MMR)',
    state: 'Maharashtra',
    pincode: '421302',
    isDefault: true
  },
  {
    id: 'wh-2',
    name: 'Okhla Phase-3 Logistics Park',
    city: 'New Delhi',
    state: 'Delhi NCR',
    pincode: '110020',
    isDefault: false
  },
  {
    id: 'wh-3',
    name: 'Peenya Industrial Logistics Hub',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560058',
    isDefault: false
  }
];

export const DEMO_ZONE_TARIFFS: ZoneTariff[] = [
  {
    zoneCode: 'A',
    zoneName: 'Within City (Intra-City)',
    description: 'Local shipments within the same metropolitan boundary (e.g., Mumbai to Mumbai)',
    baseWeightGrams: 500,
    baseRateInr: 38,
    addlWeightGrams: 500,
    addlRateInr: 28,
    codMinFeeInr: 35,
    codPercent: 1.5
  },
  {
    zoneCode: 'B',
    zoneName: 'Within State / Regional Zone',
    description: 'Shipments within the same state or regional cluster (e.g., Mumbai to Pune / Nashik)',
    baseWeightGrams: 500,
    baseRateInr: 45,
    addlWeightGrams: 500,
    addlRateInr: 35,
    codMinFeeInr: 35,
    codPercent: 1.5
  },
  {
    zoneCode: 'C',
    zoneName: 'Metro to Metro',
    description: 'Primary metropolitan corridors (Delhi, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad)',
    baseWeightGrams: 500,
    baseRateInr: 54,
    addlWeightGrams: 500,
    addlRateInr: 42,
    codMinFeeInr: 35,
    codPercent: 1.5
  },
  {
    zoneCode: 'D',
    zoneName: 'Rest of India',
    description: 'All Tier-2 and Tier-3 cities across mainland India',
    baseWeightGrams: 500,
    baseRateInr: 68,
    addlWeightGrams: 500,
    addlRateInr: 55,
    codMinFeeInr: 35,
    codPercent: 1.5
  },
  {
    zoneCode: 'E',
    zoneName: 'Special Destinations & Remote',
    description: 'Jammu & Kashmir, North Eastern states, Andaman & Nicobar, and remote hill areas',
    baseWeightGrams: 500,
    baseRateInr: 85,
    addlWeightGrams: 500,
    addlRateInr: 72,
    codMinFeeInr: 40,
    codPercent: 1.75
  }
];

export const CARRIER_CATALOG = [
  {
    id: 'delhivery-surface',
    name: 'Delhivery Surface',
    courierLogo: 'DL',
    mode: 'Surface' as const,
    multiplier: 1.0,
    baseDays: 3,
    rating: 4.6,
    badge: 'Best Value' as const
  },
  {
    id: 'bluedart-air',
    name: 'Blue Dart Air Express',
    courierLogo: 'BD',
    mode: 'Air' as const,
    multiplier: 1.55,
    baseDays: 1,
    rating: 4.8,
    badge: 'Fastest' as const
  },
  {
    id: 'dtdc-express',
    name: 'DTDC Priority Express',
    courierLogo: 'DT',
    mode: 'Express' as const,
    multiplier: 1.15,
    baseDays: 2,
    rating: 4.4,
    badge: undefined
  },
  {
    id: 'xpressbees-surface',
    name: 'Xpressbees Standard',
    courierLogo: 'XB',
    mode: 'Surface' as const,
    multiplier: 0.92,
    baseDays: 4,
    rating: 4.3,
    badge: 'Economy' as const
  }
];

export interface ValueAddedServiceRule {
  title: string;
  rate: string;
  detail: string;
}

export const VALUE_ADDED_SERVICES: ValueAddedServiceRule[] = [
  {
    title: 'Cash On Delivery (COD) Handling Fee',
    rate: '1.5% or ₹35 min',
    detail: 'Charged per delivered COD order. Remitted to your registered bank account on daily T+1 schedule.'
  },
  {
    title: 'RTO (Return to Origin) Freight',
    rate: '100% of Forward Tariff',
    detail: 'Standard reverse transit fee charged if a consignment is returned undelivered after all buyer re-attempts.'
  },
  {
    title: 'Transit Risk Cover / Insurance',
    rate: '0.2% of Declared Value',
    detail: 'Optional freight insurance protecting high-value consignments up to ₹50,000 against transit loss or damage.'
  },
  {
    title: 'Volumetric Conversion Factor',
    rate: '5000 Divisor',
    detail: 'Volumetric weight calculated as (Length × Width × Height in cm) / 5000 in accordance with standard IATA rules.'
  },
  {
    title: 'Goods & Services Tax (GST)',
    rate: '18% Flat',
    detail: 'Applied to total freight and docket charges. Fully claimable via B2B Input Tax Credit (ITC).'
  }
];
