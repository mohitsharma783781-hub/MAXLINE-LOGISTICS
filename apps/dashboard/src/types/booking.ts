import type { StatusType } from './component';
import type { PaymentMode } from './rates';
import type { CourierCode } from './couriers';

export type BookingStatus =
  | 'DRAFT'
  | 'READY'
  | 'PENDING'
  | 'PROCESSING'
  | 'BOOKING'
  | 'BOOKED'
  | 'FAILED'
  | 'CANCELLED';

export type AWBStatus = 'NOT_ASSIGNED' | 'ASSIGNED' | 'FAILED';
export type LabelStatus = 'NOT_GENERATED' | 'GENERATING' | 'GENERATED' | 'FAILED';
export type LabelFormat = 'PDF' | 'PNG';

export interface BookingStatusConfig {
  key: BookingStatus;
  label: string;
  variant: StatusType;
  description: string;
}

export const BOOKING_STATUS_CONFIG: BookingStatusConfig[] = [
  { key: 'PENDING', label: 'Pending Booking', variant: 'info', description: 'Booking request created and queued for provider dispatch' },
  { key: 'PROCESSING', label: 'Processing...', variant: 'warning', description: 'Booking request sent to carrier adapter' },
  { key: 'BOOKED', label: 'Booked', variant: 'success', description: 'Shipment successfully booked with AWB assigned' },
  { key: 'FAILED', label: 'Booking Failed', variant: 'danger', description: 'Booking attempt failed or rejected by carrier' },
  { key: 'CANCELLED', label: 'Booking Cancelled', variant: 'neutral', description: 'Booking was voided or cancelled by merchant' },
];

export interface AddressInfo {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface PackageDetail {
  weightGrams: number;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  quantity: number;
}

export interface BookingRequest {
  tenantId: string;
  orderId: string;
  shipmentId: string;
  rateQuoteId: string;
  courierId: string;
  courierCode: CourierCode;
  courierServiceId: string;
  pickupAddress: AddressInfo;
  deliveryAddress: AddressInfo;
  sender: AddressInfo;
  recipient: AddressInfo;
  packages: PackageDetail[];
  paymentMode: PaymentMode;
  invoiceValueMinor: number;
  declaredValueMinor: number;
  customerReference?: string;
  idempotencyKey?: string;
}

export interface BookingAttempt extends Record<string, unknown> {
  id: string;
  bookingId: string;
  attemptNumber: number;
  status: BookingStatus;
  requestId: string;
  providerReference?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface BookingRecord extends Record<string, unknown> {
  id: string;
  tenantId: string;
  orderId: string;
  shipmentId: string;
  rateQuoteId: string;
  courierId: string;
  courierCode: CourierCode;
  courierName: string;
  serviceId: string;
  serviceName: string;
  courierAccountId?: string;
  idempotencyKey: string;
  bookingReference: string;
  providerReference?: string;
  awb?: string;
  awbStatus: AWBStatus;
  status: BookingStatus;
  failureCode?: string;
  failureMessage?: string;
  totalCostMinor: number;
  paymentMode: PaymentMode;
  originPincode: string;
  destinationPincode: string;
  requestedAt: string;
  bookedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentBooking extends Record<string, unknown> {
  id: string;
  shipmentId: string;
  orderId?: string;
  courierId: string;
  courierName: string;
  courierLogo?: string;
  serviceId: string;
  serviceName: string;
  serviceType: 'Surface' | 'Express' | 'Air';
  status: BookingStatus;
  bookingReference: string;
  courierShipmentId?: string;
  awb?: string;
  awbStatus: AWBStatus;
  labelStatus: LabelStatus;
  labelUrl?: string;
  labelFormat?: LabelFormat;
  chargeableWeight: number;
  estimatedCost: number;
  estimatedDays: string;
  paymentMode: PaymentMode;
  originPincode: string;
  destinationPincode: string;
  declaredValue?: number;
  createdAt: string;
  updatedAt: string;
  failureReason?: string;
  tenantId?: string;
}

export interface BookingInput {
  shipmentId: string;
  orderId?: string;
  courierId: string;
  serviceId: string;
  courierName: string;
  serviceName: string;
  serviceType?: 'Surface' | 'Express' | 'Air';
  courierLogo?: string;
  originPincode: string;
  destinationPincode: string;
  paymentMode: PaymentMode;
  actualWeight: number;
  chargeableWeight: number;
  estimatedCost: number;
  estimatedDays: string;
  declaredValue?: number;
  tenantId?: string;
}

export interface BookingResponse {
  success: boolean;
  bookingReference: string;
  courierShipmentId: string;
  awb: string;
  awbStatus: AWBStatus;
  labelStatus: LabelStatus;
  failureReason?: string;
  booking?: ShipmentBooking;
}

export interface BookingEvent extends Record<string, unknown> {
  id: string;
  shipmentId: string;
  bookingId: string;
  eventType:
    | 'BOOKING_STARTED'
    | 'BOOKING_SUCCESS'
    | 'BOOKING_FAILED'
    | 'BOOKING_CANCELLED'
    | 'AWB_ASSIGNED'
    | 'LABEL_GENERATED';
  status: BookingStatus;
  message: string;
  timestamp: string;
}
