import { MetricSummary, RecentOrder, StatusDistributionItem } from '../types/dashboard';

export const DEMO_DATE_RANGE = {
  label: 'Last 30 Days (25 Sep – 24 Oct 2026)',
  startDate: '25 Sep 2026',
  endDate: '24 Oct 2026',
  totalDays: 30
};

export const DEMO_NOTICE = {
  title: 'DEMO PREVIEW ENVIRONMENT',
  subtitle: 'All statistics, orders, and balances below represent mock sample data for UI evaluation. No live courier APIs or database records are connected.',
  badge: 'Sample Merchant Account',
  merchantName: 'Acme Retail Innovations Ltd',
  merchantId: 'MCH-DEMO-7841'
};

export const DEMO_METRICS: MetricSummary[] = [
  {
    id: 'wallet-balance',
    label: 'Wallet Balance',
    value: '₹ 14,250.00',
    description: 'Available shipping funds',
    changeNote: 'Active Prepaid Funds',
    type: 'wallet'
  },
  {
    id: 'total-orders',
    label: "Today's Orders",
    value: '12',
    description: 'Dispatched today',
    changeNote: '12 total booked',
    type: 'total'
  },
  {
    id: 'in-transit',
    label: 'In Transit',
    value: '312',
    description: 'Parcels on the move',
    changeNote: '312 in transit',
    type: 'transit'
  },
  {
    id: 'delivered',
    label: 'Delivered',
    value: '1,048',
    description: 'Successfully fulfilled',
    changeNote: '1,048 delivered',
    type: 'delivered'
  },
  {
    id: 'cod-pending',
    label: 'COD Pending',
    value: '₹ 48,650',
    description: 'Pending cash payouts',
    changeNote: '84 consignments',
    type: 'cod'
  }
];

export const DEMO_STATUS_DISTRIBUTION: StatusDistributionItem[] = [
  { label: 'Delivered', count: 1048, percentage: 73.4, colorClass: 'bg-emerald-600' },
  { label: 'In Transit', count: 312, percentage: 21.8, colorClass: 'bg-blue-600' },
  { label: 'Out for Delivery', count: 46, percentage: 3.2, colorClass: 'bg-sky-500' },
  { label: 'Pending Pickup', count: 22, percentage: 1.6, colorClass: 'bg-amber-500' }
];

export const DEMO_RECENT_ORDERS: RecentOrder[] = [
  {
    id: 'ord-101',
    orderNumber: 'ML-2026-9041',
    customerName: 'Rahul Verma',
    destinationCity: 'Bengaluru, KA',
    destinationPin: '560001',
    courierName: 'Delhivery Surface',
    status: 'In Transit',
    date: '24 Oct 2026, 04:15 PM',
    amount: '₹ 2,450',
    paymentMode: 'Prepaid'
  },
  {
    id: 'ord-102',
    orderNumber: 'ML-2026-9040',
    customerName: 'Priya Sharma',
    destinationCity: 'Mumbai, MH',
    destinationPin: '400050',
    courierName: 'Blue Dart Air',
    status: 'Out for Delivery',
    date: '24 Oct 2026, 02:30 PM',
    amount: '₹ 4,120',
    paymentMode: 'COD'
  },
  {
    id: 'ord-103',
    orderNumber: 'ML-2026-9039',
    customerName: 'Amit Patel',
    destinationCity: 'Ahmedabad, GJ',
    destinationPin: '380015',
    courierName: 'Xpressbees',
    status: 'Delivered',
    date: '24 Oct 2026, 11:45 AM',
    amount: '₹ 1,890',
    paymentMode: 'Prepaid'
  },
  {
    id: 'ord-104',
    orderNumber: 'ML-2026-9038',
    customerName: 'Sunita Reddy',
    destinationCity: 'Hyderabad, TS',
    destinationPin: '500081',
    courierName: 'DTDC Priority',
    status: 'Delivered',
    date: '23 Oct 2026, 06:10 PM',
    amount: '₹ 3,750',
    paymentMode: 'Prepaid'
  },
  {
    id: 'ord-105',
    orderNumber: 'ML-2026-9037',
    customerName: 'Vikram Joshi',
    destinationCity: 'Pune, MH',
    destinationPin: '411004',
    courierName: 'Delhivery Air',
    status: 'In Transit',
    date: '23 Oct 2026, 01:20 PM',
    amount: '₹ 5,600',
    paymentMode: 'COD'
  },
  {
    id: 'ord-106',
    orderNumber: 'ML-2026-9036',
    customerName: 'Neha Kapoor',
    destinationCity: 'Chandigarh, PB',
    destinationPin: '160017',
    courierName: 'Shadowfax',
    status: 'Pending Pickup',
    date: '23 Oct 2026, 09:05 AM',
    amount: '₹ 1,299',
    paymentMode: 'Prepaid'
  }
];
