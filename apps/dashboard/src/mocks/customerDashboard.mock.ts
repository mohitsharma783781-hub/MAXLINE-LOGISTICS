import type {
  DashboardKpiMetrics,
  ShipmentTrendPoint,
  ShipmentStatusDistribution,
  RecentShipment,
} from '../types/customerDashboard';

export const DEMO_MERCHANT_PROFILE = {
  companyName: 'Apex Retail Store',
  userName: 'Alex Mercer',
  userRole: 'Merchant Administrator',
  tenantId: 'tnt-demo-apex-01',
};

export const DEMO_KPI_METRICS: DashboardKpiMetrics = {
  totalShipments: 0,
  inTransit: 0,
  delivered: 0,
  ndrActionNeeded: 0,
  rtoReturned: 0,
  codPendingRemittance: 0,
};

export const DEMO_TREND_MAP: Record<string, ShipmentTrendPoint[]> = {
  '7d': [
    { day: 'Mon', count: 0 },
    { day: 'Tue', count: 0 },
    { day: 'Wed', count: 0 },
    { day: 'Thu', count: 0 },
    { day: 'Fri', count: 0 },
    { day: 'Sat', count: 0 },
    { day: 'Sun', count: 0 },
  ],
  '30d': [
    { day: 'Week 1', count: 0 },
    { day: 'Week 2', count: 0 },
    { day: 'Week 3', count: 0 },
    { day: 'Week 4', count: 0 },
  ],
  '90d': [
    { day: 'Jun', count: 0 },
    { day: 'Jul', count: 0 },
    { day: 'Aug', count: 0 },
  ],
};

export const DEMO_STATUS_DISTRIBUTION: ShipmentStatusDistribution[] = [
  { status: 'booked', label: 'Booked', count: 0, percentage: 0, variant: 'neutral' },
  { status: 'picked_up', label: 'Picked Up', count: 0, percentage: 0, variant: 'info' },
  { status: 'in_transit', label: 'In Transit', count: 0, percentage: 0, variant: 'info' },
  { status: 'out_for_delivery', label: 'Out for Delivery', count: 0, percentage: 0, variant: 'brand' },
  { status: 'delivered', label: 'Delivered', count: 0, percentage: 0, variant: 'success' },
  { status: 'ndr', label: 'NDR Exception', count: 0, percentage: 0, variant: 'warning' },
  { status: 'rto', label: 'RTO Returned', count: 0, percentage: 0, variant: 'danger' },
];

export const DEMO_RECENT_SHIPMENTS: RecentShipment[] = [];

export const fetchDashboardMetrics = async (): Promise<DashboardKpiMetrics> => {
  return new Promise((resolve) => setTimeout(() => resolve(DEMO_KPI_METRICS), 400));
};

export const fetchRecentShipments = async (): Promise<RecentShipment[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(DEMO_RECENT_SHIPMENTS), 400));
};
