import type { StatusType } from './component';

export type UniversalTrackingStatus =
  | 'CREATED'
  | 'BOOKED'
  | 'PICKUP_REQUESTED'
  | 'PICKUP_SCHEDULED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'ARRIVED_AT_HUB'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_ATTEMPTED'
  | 'NDR'
  | 'RTO_INITIATED'
  | 'RTO_IN_TRANSIT'
  | 'RTO_DELIVERED'
  | 'CANCELLED'
  | 'LOST'
  | 'DAMAGED'
  | 'EXCEPTION'
  | 'UNKNOWN';

export type TrackingStatus = UniversalTrackingStatus | 'LABEL_GENERATED';

export interface TrackingStatusConfig {
  key: TrackingStatus;
  label: string;
  variant: StatusType;
  description: string;
}

export const TRACKING_STATUS_CONFIG: TrackingStatusConfig[] = [
  { key: 'CREATED', label: 'Draft Created', variant: 'neutral', description: 'Shipment created in system' },
  { key: 'BOOKED', label: 'Shipment Booked', variant: 'info', description: 'AWB assigned & carrier booked' },
  { key: 'LABEL_GENERATED', label: 'Label Generated', variant: 'info', description: 'Shipping label printed' },
  { key: 'PICKUP_REQUESTED', label: 'Pickup Requested', variant: 'warning', description: 'Pickup dispatch requested' },
  { key: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled', variant: 'warning', description: 'Pickup slot scheduled with carrier' },
  { key: 'PICKED_UP', label: 'Picked Up', variant: 'brand', description: 'Parcel collected from warehouse' },
  { key: 'IN_TRANSIT', label: 'In Transit', variant: 'brand', description: 'Parcel in transit between hubs' },
  { key: 'ARRIVED_AT_HUB', label: 'Arrived at Hub', variant: 'info', description: 'Parcel arrived at local sorting facility' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', variant: 'warning', description: 'Delivery executive assigned for doorstep delivery' },
  { key: 'DELIVERED', label: 'Delivered', variant: 'success', description: 'Parcel successfully delivered to buyer' },
  { key: 'DELIVERY_ATTEMPTED', label: 'Delivery Attempted', variant: 'warning', description: 'Doorstep delivery attempted' },
  { key: 'NDR', label: 'NDR Exception', variant: 'danger', description: 'Delivery attempt failed / NDR raised' },
  { key: 'RTO_INITIATED', label: 'RTO Initiated', variant: 'danger', description: 'Return to origin initiated' },
  { key: 'RTO_IN_TRANSIT', label: 'RTO In Transit', variant: 'warning', description: 'Parcel returning to warehouse origin' },
  { key: 'RTO_DELIVERED', label: 'RTO Delivered', variant: 'success', description: 'Parcel returned to origin hub' },
  { key: 'CANCELLED', label: 'Cancelled', variant: 'neutral', description: 'Shipment booking cancelled' },
  { key: 'LOST', label: 'Parcel Lost', variant: 'danger', description: 'Parcel reported lost in transit' },
  { key: 'DAMAGED', label: 'Parcel Damaged', variant: 'danger', description: 'Parcel damaged during transit' },
  { key: 'EXCEPTION', label: 'Operational Exception', variant: 'danger', description: 'Unresolved operational issue' },
  { key: 'UNKNOWN', label: 'Unknown Status', variant: 'neutral', description: 'Unmapped provider status' },
];

export type TrackingEventCode =
  | 'SHIPMENT_CREATED'
  | 'SHIPMENT_BOOKED'
  | 'LABEL_GENERATED'
  | 'PICKUP_REQUESTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'ARRIVED_AT_HUB'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERY_ATTEMPT_FAILED'
  | 'NDR_CREATED'
  | 'REATTEMPT_SCHEDULED'
  | 'DELIVERED'
  | 'RTO_INITIATED'
  | 'RTO_IN_TRANSIT'
  | 'RTO_DELIVERED'
  | 'SHIPMENT_CANCELLED'
  | 'EXCEPTION';

export type TrackingEventSource = 'SYSTEM' | 'COURIER_API' | 'COURIER_WEBHOOK' | 'MANUAL' | 'DEMO' | 'COURIER' | 'MERCHANT';

export interface TrackingEvent extends Record<string, unknown> {
  id: string;
  shipmentId: string;
  awb: string;
  courierId: string;
  courierName: string;
  status: TrackingStatus;
  providerStatus?: string;
  providerEventCode?: string;
  eventCode?: TrackingEventCode;
  eventTitle?: string;
  description: string;
  location?: string;
  eventTime: string;
  receivedAt?: string;
  source: TrackingEventSource;
  providerEventId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  tenantId?: string;
}

export interface ShipmentTrackingSummary extends Record<string, unknown> {
  shipmentId: string;
  orderId: string;
  awb: string;
  courierId: string;
  courierName: string;
  courierLogo: string;
  originCity: string;
  destinationCity: string;
  recipientName: string;
  currentStatus: TrackingStatus;
  lastUpdated: string;
  estimatedDeliveryDate?: string;
  events: TrackingEvent[];
  tenantId?: string;
}
