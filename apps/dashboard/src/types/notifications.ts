import type { StatusType } from './component';

export type NotificationChannel = 'WHATSAPP' | 'SMS' | 'EMAIL';

export type NotificationStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type NotificationEvent =
  | 'ORDER_CONFIRMED'
  | 'SHIPMENT_BOOKED'
  | 'PICKUP_SCHEDULED'
  | 'SHIPMENT_PICKED_UP'
  | 'SHIPMENT_IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERY_ATTEMPT_FAILED'
  | 'NDR_CREATED'
  | 'REATTEMPT_SCHEDULED'
  | 'DELIVERED'
  | 'RTO_INITIATED'
  | 'RTO_DELIVERED';

export type TemplateStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

export interface NotificationVariable {
  key: string;
  label: string;
  sampleValue: string;
}

export const ALLOWED_NOTIFICATION_VARIABLES: NotificationVariable[] = [
  { key: '{{customer_name}}', label: 'Customer Name', sampleValue: 'Rahul Sharma' },
  { key: '{{order_id}}', label: 'Order Reference', sampleValue: 'ORD-9840192' },
  { key: '{{shipment_id}}', label: 'Shipment ID', sampleValue: 'SHP-9840192' },
  { key: '{{awb}}', label: 'AWB Number', sampleValue: 'DEMO-AWB-98401928' },
  { key: '{{courier_name}}', label: 'Courier Partner', sampleValue: 'Delhivery Surface' },
  { key: '{{tracking_url}}', label: 'Tracking Link', sampleValue: 'https://demo.shipping-saas.com/track/DEMO-AWB-98401928' },
  { key: '{{current_status}}', label: 'Current Status', sampleValue: 'IN_TRANSIT' },
  { key: '{{estimated_delivery}}', label: 'Estimated Delivery', sampleValue: '22 Aug 2026' },
  { key: '{{support_phone}}', label: 'Support Phone', sampleValue: '+91 1800 123 4567' },
  { key: '{{support_email}}', label: 'Support Email', sampleValue: 'support@shipping-saas.com' },
];

export interface NotificationStatusConfig {
  key: NotificationStatus;
  label: string;
  variant: StatusType;
}

export const NOTIFICATION_STATUS_CONFIG: NotificationStatusConfig[] = [
  { key: 'PENDING', label: 'Pending', variant: 'warning' },
  { key: 'QUEUED', label: 'Queued', variant: 'info' },
  { key: 'SENT', label: 'Sent', variant: 'brand' },
  { key: 'DELIVERED', label: 'Delivered', variant: 'success' },
  { key: 'FAILED', label: 'Failed', variant: 'danger' },
  { key: 'CANCELLED', label: 'Cancelled', variant: 'neutral' },
];

export interface NotificationTemplate extends Record<string, unknown> {
  id: string;
  tenantId: string;
  name: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  status: TemplateStatus;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RuleCondition {
  field: string;
  operator: 'EQUALS' | 'CONTAINS' | 'GREATER_THAN';
  value: string;
}

export interface NotificationRule extends Record<string, unknown> {
  id: string;
  tenantId: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  templateId: string;
  templateName: string;
  enabled: boolean;
  conditions?: RuleCondition[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog extends Record<string, unknown> {
  id: string;
  tenantId: string;
  shipmentId: string;
  orderId: string;
  awb: string;
  notificationEvent: NotificationEvent;
  channel: NotificationChannel;
  templateId: string;
  templateName: string;
  recipientMasked: string;
  status: NotificationStatus;
  provider: string;
  providerReference?: string;
  errorMessage?: string;
  renderedContent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelProviderConfig {
  channel: NotificationChannel;
  providerName: string;
  connected: boolean;
  statusText: string;
}

export interface NotificationFilterState {
  searchQuery: string;
  channel: string;
  status: string;
  event: string;
}
