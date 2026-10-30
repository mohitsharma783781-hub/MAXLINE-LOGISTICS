import type { StatusType } from './component';

export type ShipmentStatus =
  | 'all'
  | 'ready_to_ship'
  | 'booked'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'ndr'
  | 'rto'
  | 'cancelled';

export type ShipmentType = 'b2c' | 'b2b';
export type PaymentMode = 'prepaid' | 'cod';

export interface ShipmentStatusConfig {
  key: ShipmentStatus;
  label: string;
  variant: StatusType;
}

export const SHIPMENT_STATUS_CONFIG: ShipmentStatusConfig[] = [
  { key: 'all', label: 'All', variant: 'neutral' },
  { key: 'ready_to_ship', label: 'Ready to Ship', variant: 'info' },
  { key: 'booked', label: 'Booked', variant: 'neutral' },
  { key: 'picked_up', label: 'Picked Up', variant: 'info' },
  { key: 'in_transit', label: 'In Transit', variant: 'info' },
  { key: 'out_for_delivery', label: 'Out for Delivery', variant: 'brand' },
  { key: 'delivered', label: 'Delivered', variant: 'success' },
  { key: 'ndr', label: 'NDR', variant: 'warning' },
  { key: 'rto', label: 'RTO', variant: 'danger' },
  { key: 'cancelled', label: 'Cancelled', variant: 'neutral' },
];

export interface ShipmentItem extends Record<string, unknown> {
  id: string;
  awb: string;
  orderId: string;
  customerName: string;
  customerPhone?: string;
  courierId: string;
  courierName: string;
  shipmentType: ShipmentType;
  paymentMode: PaymentMode;
  amount: number;
  destination: string;
  status: ShipmentStatus;
  statusText: string;
  createdAt: string;
  packageWeight?: string;
  itemCount?: number;
}

export interface ShipmentFilterState {
  searchQuery: string;
  status: ShipmentStatus;
  courier: string;
  paymentMode: string;
  shipmentType: string;
  dateRange: string;
  destination: string;
}
