import type { StatusType } from './component';

export type DateRangeOption = 'today' | 'yesterday' | '7d' | '30d' | 'custom';

export interface DashboardKpiMetrics {
  totalShipments: number;
  inTransit: number;
  delivered: number;
  ndrActionNeeded: number;
  rtoReturned: number;
  codPendingRemittance: number;
}

export interface ShipmentTrendPoint {
  day: string;
  count: number;
}

export interface ShipmentStatusDistribution {
  status: string;
  label: string;
  count: number;
  percentage: number;
  variant: StatusType;
}

export interface RecentShipment extends Record<string, unknown> {
  awb: string;
  orderId: string;
  courier: string;
  status: StatusType;
  statusText: string;
  destination: string;
  date: string;
  amount: string;
}
