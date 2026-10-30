import type { StatusType } from './component';

export type ExceptionType =
  | 'NDR'
  | 'RTO'
  | 'DELIVERY_EXCEPTION'
  | 'PICKUP_EXCEPTION'
  | 'OTHER';

export type NDRStatus =
  | 'OPEN'
  | 'ACTION_REQUIRED'
  | 'CUSTOMER_CONTACTED'
  | 'REATTEMPT_SCHEDULED'
  | 'RESOLVED'
  | 'RTO_INITIATED'
  | 'CLOSED';

export type RTOStatus =
  | 'NOT_INITIATED'
  | 'INITIATED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type NDRReasonCode =
  | 'CUSTOMER_UNAVAILABLE'
  | 'CUSTOMER_REFUSED'
  | 'WRONG_ADDRESS'
  | 'ADDRESS_INCOMPLETE'
  | 'PHONE_UNREACHABLE'
  | 'PHONE_SWITCHED_OFF'
  | 'OUT_OF_COVERAGE'
  | 'DELIVERY_DELAY'
  | 'COD_PAYMENT_NOT_READY'
  | 'CUSTOMER_RESCHEDULE_REQUEST'
  | 'OTHER';

export interface NDRReasonConfig {
  code: NDRReasonCode;
  label: string;
  description: string;
}

export const NDR_REASON_CONFIG: NDRReasonConfig[] = [
  { code: 'CUSTOMER_UNAVAILABLE', label: 'Customer Unavailable', description: 'Customer was not available at the delivery location' },
  { code: 'CUSTOMER_REFUSED', label: 'Customer Refused Delivery', description: 'Customer declined to accept the parcel' },
  { code: 'WRONG_ADDRESS', label: 'Wrong / Invalid Address', description: 'Street or house number does not exist' },
  { code: 'ADDRESS_INCOMPLETE', label: 'Incomplete Address', description: 'Landmark or door number missing' },
  { code: 'PHONE_UNREACHABLE', label: 'Phone Unreachable', description: 'Courier agent could not connect to buyer phone' },
  { code: 'PHONE_SWITCHED_OFF', label: 'Phone Switched Off', description: 'Buyer phone was switched off during delivery attempt' },
  { code: 'OUT_OF_COVERAGE', label: 'Out of Delivery Area', description: 'Location temporarily out of courier delivery zone' },
  { code: 'DELIVERY_DELAY', label: 'Delivery Delay', description: 'Shipment delayed due to operational issues' },
  { code: 'COD_PAYMENT_NOT_READY', label: 'COD Cash Not Ready', description: 'Buyer did not have COD cash ready for payment' },
  { code: 'CUSTOMER_RESCHEDULE_REQUEST', label: 'Buyer Requested Reschedule', description: 'Buyer asked to deliver on a future date' },
  { code: 'OTHER', label: 'Other Operational Exception', description: 'Miscellaneous courier delivery exception' },
];

export type CustomerResponse =
  | 'NO_RESPONSE'
  | 'CONFIRMED_DELIVERY'
  | 'REQUEST_REATTEMPT'
  | 'REQUEST_RESCHEDULE'
  | 'REFUSED'
  | 'WRONG_ADDRESS'
  | 'OTHER';

export type MerchantAction =
  | 'NO_ACTION'
  | 'CONTACT_CUSTOMER'
  | 'REATTEMPT'
  | 'RESCHEDULE'
  | 'CORRECT_ADDRESS'
  | 'CANCEL_SHIPMENT'
  | 'INITIATE_RTO';

export type RTOReason =
  | 'MAX_ATTEMPTS_REACHED'
  | 'CUSTOMER_REFUSED'
  | 'CUSTOMER_UNREACHABLE'
  | 'ADDRESS_INVALID'
  | 'MERCHANT_REQUEST'
  | 'OTHER';

export interface NDRStatusConfig {
  key: NDRStatus;
  label: string;
  variant: StatusType;
}

export const NDR_STATUS_CONFIG: NDRStatusConfig[] = [
  { key: 'OPEN', label: 'Open NDR', variant: 'warning' },
  { key: 'ACTION_REQUIRED', label: 'Action Required', variant: 'danger' },
  { key: 'CUSTOMER_CONTACTED', label: 'Customer Contacted', variant: 'info' },
  { key: 'REATTEMPT_SCHEDULED', label: 'Reattempt Scheduled', variant: 'brand' },
  { key: 'RESOLVED', label: 'Resolved', variant: 'success' },
  { key: 'RTO_INITIATED', label: 'RTO Initiated', variant: 'danger' },
  { key: 'CLOSED', label: 'Closed', variant: 'neutral' },
];

export interface RTOStatusConfig {
  key: RTOStatus;
  label: string;
  variant: StatusType;
}

export const RTO_STATUS_CONFIG: RTOStatusConfig[] = [
  { key: 'NOT_INITIATED', label: 'Not Initiated', variant: 'neutral' },
  { key: 'INITIATED', label: 'RTO Initiated', variant: 'warning' },
  { key: 'IN_TRANSIT', label: 'RTO In Transit', variant: 'info' },
  { key: 'DELIVERED', label: 'RTO Delivered to Origin', variant: 'success' },
  { key: 'FAILED', label: 'RTO Delivery Failed', variant: 'danger' },
  { key: 'CANCELLED', label: 'Cancelled', variant: 'neutral' },
];

export interface ShipmentException extends Record<string, unknown> {
  id: string;
  shipmentId: string;
  orderId: string;
  awb: string;
  courierId: string;
  courierName: string;
  customerName: string;
  customerPhone: string;
  maskedPhone: string;
  destinationCity: string;
  type: ExceptionType;
  reasonCode: NDRReasonCode;
  reason: string;
  status: NDRStatus;
  attemptNumber: number;
  createdAt: string;
  updatedAt: string;
  tenantId?: string;
}

export interface NDRCase extends Record<string, unknown> {
  id: string;
  shipmentId: string;
  orderId: string;
  awb: string;
  courierId: string;
  courierName: string;
  customerName: string;
  customerPhone: string;
  maskedPhone: string;
  destinationCity: string;
  attemptNumber: number;
  reasonCode: NDRReasonCode;
  reason: string;
  status: NDRStatus;
  customerResponse: CustomerResponse;
  merchantAction: MerchantAction;
  nextActionAt?: string;
  reattemptDate?: string;
  reattemptSlot?: string;
  createdAt: string;
  updatedAt: string;
  tenantId?: string;
}

export interface RTOCase extends Record<string, unknown> {
  id: string;
  shipmentId: string;
  orderId: string;
  awb: string;
  courierId: string;
  courierName: string;
  customerName: string;
  maskedPhone: string;
  destinationCity: string;
  reason: RTOReason;
  reasonText: string;
  status: RTOStatus;
  initiatedAt: string;
  inTransitAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  tenantId?: string;
}

export interface DeliveryAttempt {
  id: string;
  shipmentId: string;
  attemptNumber: number;
  attemptedAt: string;
  status: 'SUCCESSFUL' | 'FAILED';
  reasonCode: NDRReasonCode;
  reason: string;
  notes?: string;
}

export interface ExceptionEvent {
  id: string;
  shipmentId: string;
  eventType:
    | 'DELIVERY_ATTEMPT_FAILED'
    | 'NDR_CREATED'
    | 'ACTION_REQUIRED'
    | 'CUSTOMER_CONTACTED'
    | 'REATTEMPT_SCHEDULED'
    | 'RTO_INITIATED'
    | 'RTO_IN_TRANSIT'
    | 'RTO_DELIVERED';
  status: NDRStatus | RTOStatus;
  message: string;
  timestamp: string;
}

export interface ExceptionFilterState {
  searchQuery: string;
  status: string;
  courier: string;
  reason: string;
}
