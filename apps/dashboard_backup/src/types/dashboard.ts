export type NavigationKey =
  | 'overview'
  | 'orders'
  | 'shipments'
  | 'rate-calculator'
  | 'rate-card'
  | 'courier-partners'
  | 'pickup'
  | 'ndr-rto'
  | 'cod-wallet'
  | 'reports'
  | 'business-profile'
  | 'support'
  | 'create-order' // backward compatibility alias
  | 'settings'; // backward compatibility alias

export interface NavItemConfig {
  key: NavigationKey;
  label: string;
  badge?: string;
  badgeStyle?: string;
}

export interface NavGroupConfig {
  groupTitle: string;
  items: NavItemConfig[];
}

export interface MetricSummary {
  id: string;
  label: string;
  value: string;
  description: string;
  changeNote?: string;
  type: 'wallet' | 'total' | 'transit' | 'delivered' | 'cod';
}

export type OrderStatus =
  | 'Delivered'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Pending Pickup'
  | 'Ready to Ship'
  | 'RTO';

export type SalesChannel = 'Shopify' | 'WooCommerce' | 'Amazon' | 'Manual' | 'Custom API';

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  destinationCity: string;
  destinationPin: string;
  courierName: string;
  courierLogo?: string;
  status: OrderStatus;
  date: string;
  amount: string;
  paymentMode: 'Prepaid' | 'COD';
  weightKg?: number;
  originCity?: string;
  channel?: SalesChannel;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: string;
  itemsCount?: number;
  itemName?: string;
  awbNumber?: string;
}

export interface StatusDistributionItem {
  label: string;
  count: number;
  percentage: number;
  colorClass: string;
}

// Rate calculation result model
export interface RateEstimate {
  courierId: string;
  courierName: string;
  serviceType: 'Surface' | 'Air' | 'Express';
  expectedDays: number;
  baseFreight: number;
  fuelSurcharge: number;
  codFee: number;
  gstAmount: number;
  totalCost: number;
  rating: number;
  badge?: 'Fastest' | 'Best Value' | 'Economy';
}

// Rate Card Zone Tariff model
export interface ZoneTariff {
  zoneCode: 'A' | 'B' | 'C' | 'D' | 'E';
  zoneName: string;
  description: string;
  baseWeightGrams: number;
  baseRateInr: number;
  addlWeightGrams: number;
  addlRateInr: number;
  codMinFeeInr: number;
  codPercent: number;
}

// NDR exception model
export interface NdrCase {
  id: string;
  awb: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  destinationCity: string;
  courierName: string;
  attemptNumber: number;
  lastAttemptDate: string;
  exceptionReason: string;
  status: 'Action Required' | 'Reattempt Scheduled' | 'Buyer Contacted' | 'RTO In Progress';
}

// Pickup schedule model
export interface PickupRequestRecord {
  id: string;
  pickupId: string;
  warehouseName: string;
  warehouseCity: string;
  courierName: string;
  scheduledDate: string;
  timeSlot: string;
  estimatedPackages: number;
  status: 'Scheduled' | 'Driver Assigned' | 'Picked Up' | 'Delayed';
  contactPerson: string;
  contactPhone: string;
}

// Wallet & Ledger transaction model
export interface WalletTransaction {
  id: string;
  txnId: string;
  date: string;
  description: string;
  type: 'CREDIT' | 'DEBIT';
  category: 'RECHARGE' | 'FREIGHT_DEDUCTION' | 'COD_REMITTANCE' | 'REFUND';
  amount: number;
  runningBalance: number;
  status: 'Completed' | 'Pending' | 'Failed';
}
