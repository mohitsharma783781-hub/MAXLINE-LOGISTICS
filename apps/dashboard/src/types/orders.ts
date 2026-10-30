import type { StatusType } from './component';

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'processing'
  | 'ready_to_ship'
  | 'partially_shipped'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type OrderShipmentStatus =
  | 'unshipped'
  | 'ready_to_ship'
  | 'in_transit'
  | 'delivered'
  | 'ndr'
  | 'rto'
  | 'cancelled';

export interface OrderStatusConfig {
  key: OrderStatus;
  label: string;
  variant: StatusType;
}

export const ORDER_STATUS_CONFIG: OrderStatusConfig[] = [
  { key: 'new', label: 'New', variant: 'brand' },
  { key: 'confirmed', label: 'Confirmed', variant: 'info' },
  { key: 'processing', label: 'Processing', variant: 'info' },
  { key: 'ready_to_ship', label: 'Ready to Ship', variant: 'info' },
  { key: 'partially_shipped', label: 'Partially Shipped', variant: 'warning' },
  { key: 'shipped', label: 'Shipped', variant: 'info' },
  { key: 'delivered', label: 'Delivered', variant: 'success' },
  { key: 'cancelled', label: 'Cancelled', variant: 'neutral' },
  { key: 'returned', label: 'Returned', variant: 'danger' },
];

export interface OrderItem extends Record<string, unknown> {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CustomerOrder extends Record<string, unknown> {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  companyName?: string;
  items: OrderItem[];
  totalItemCount: number;
  orderValue: number;
  paymentMode: 'prepaid' | 'cod';
  orderStatus: OrderStatus;
  orderStatusText: string;
  shipmentStatus: OrderShipmentStatus;
  shipmentStatusText: string;
  createdAt: string;
  shippingAddress: {
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export interface OrderFilterState {
  searchQuery: string;
  orderStatus: string;
  paymentMode: string;
  shipmentStatus: string;
  dateRange: string;
}
