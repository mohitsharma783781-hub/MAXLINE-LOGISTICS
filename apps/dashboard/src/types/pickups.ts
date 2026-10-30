import type { StatusType } from './component';

export type PickupStatus =
  | 'REQUESTED'
  | 'SCHEDULED'
  | 'PICKUP_IN_PROGRESS'
  | 'PICKED_UP'
  | 'FAILED'
  | 'CANCELLED'
  // Legacy alias support
  | 'draft'
  | 'requested'
  | 'pending'
  | 'scheduled'
  | 'attempted'
  | 'picked_up'
  | 'failed'
  | 'cancelled';

export interface PickupStatusConfig {
  key: PickupStatus;
  label: string;
  variant: StatusType;
}

export const PICKUP_STATUS_CONFIG: PickupStatusConfig[] = [
  { key: 'REQUESTED', label: 'Requested', variant: 'brand' },
  { key: 'SCHEDULED', label: 'Scheduled', variant: 'info' },
  { key: 'PICKUP_IN_PROGRESS', label: 'Pickup In Progress', variant: 'warning' },
  { key: 'PICKED_UP', label: 'Picked Up', variant: 'success' },
  { key: 'FAILED', label: 'Pickup Failed', variant: 'danger' },
  { key: 'CANCELLED', label: 'Cancelled', variant: 'neutral' },
  // Legacy fallback configs
  { key: 'draft', label: 'Draft', variant: 'neutral' },
  { key: 'requested', label: 'Requested', variant: 'brand' },
  { key: 'pending', label: 'Pending Dispatch', variant: 'info' },
  { key: 'scheduled', label: 'Scheduled', variant: 'info' },
  { key: 'attempted', label: 'Pickup Attempted', variant: 'warning' },
  { key: 'picked_up', label: 'Picked Up', variant: 'success' },
  { key: 'failed', label: 'Pickup Failed', variant: 'danger' },
  { key: 'cancelled', label: 'Cancelled', variant: 'neutral' },
];

export interface PickupEvent extends Record<string, unknown> {
  id: string;
  pickupId: string;
  status: PickupStatus;
  title: string;
  description: string;
  timestamp: string;
}

export interface WarehouseInfo {
  id: string;
  name: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  contactPerson: string;
  phone: string;
}

export interface PickupRequest extends Record<string, unknown> {
  id: string;
  pickupNumber: string;
  pickupReference: string;
  warehouseId: string;
  warehouseName: string;
  warehouseAddress: string;
  courierId: string;
  courierName: string;
  shipmentIds: string[];
  shipmentCount: number;
  totalWeightKg: number;
  pickupDate: string;
  timeSlot: string;
  contactPerson: string;
  contactPhone: string;
  status: PickupStatus;
  statusText: string;
  failureReason?: string;
  createdAt: string;
  updatedAt?: string;
  events: PickupEvent[];
  tenantId?: string;
}

export interface PickupFilterState {
  searchQuery: string;
  status: string;
  warehouse: string;
  courier: string;
  dateRange: string;
}

export interface CreatePickupForm {
  warehouseId: string;
  selectedShipmentIds: string[];
  courierId: string;
  pickupDate: string;
  timeSlot: string;
  contactPerson: string;
  contactPhone: string;
  specialInstructions?: string;
}

export interface CreatePickupInput {
  warehouseId: string;
  shipmentIds: string[];
  courierId: string;
  pickupDate: string;
  pickupSlot: string;
  contactPerson: string;
  contactPhone: string;
  specialInstructions?: string;
  tenantId?: string;
}

export interface CreatePickupResponse {
  success: boolean;
  pickupReference: string;
  status: PickupStatus;
  pickupDate: string;
  pickupSlot: string;
  failureReason?: string;
  pickup?: PickupRequest;
}
