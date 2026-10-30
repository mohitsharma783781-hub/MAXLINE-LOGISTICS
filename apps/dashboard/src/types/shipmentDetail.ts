import type { ShipmentStatus, ShipmentType } from './shipments';
import type { AddressDetails, PackageDetails, PaymentDetails } from './createShipment';

export interface NormalizedCourierInfo {
  id: string;
  name: string;
  serviceType: string;
  trackingNumber: string;
  statusText: string;
  logoKey?: string;
}

export interface NormalizedTrackingEvent {
  id: string;
  status: ShipmentStatus;
  title: string;
  description: string;
  location: string;
  timestamp: string;
  completed: boolean;
}

export interface ShipmentActivityLog {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface ShipmentDetail {
  id: string;
  awb: string;
  orderId: string;
  orderDate: string;
  orderValue: number;
  itemCount: number;
  shipmentType: ShipmentType;
  status: ShipmentStatus;
  statusText: string;
  createdAt: string;
  estimatedDelivery: string;
  courier: NormalizedCourierInfo;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  pickupAddress: AddressDetails;
  deliveryAddress: AddressDetails;
  package: PackageDetails;
  payment: PaymentDetails;
  ndrDetails?: {
    reason: string;
    attemptNumber: number;
    actionRequired: string;
  };
  rtoDetails?: {
    reason: string;
    initiatedDate: string;
  };
  trackingEvents: NormalizedTrackingEvent[];
  activityLogs: ShipmentActivityLog[];
}
