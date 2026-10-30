import type { ShipmentType, PaymentMode } from './shipments';

export interface OrderDetails {
  orderId: string;
  orderDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  companyName?: string;
  shipmentType: ShipmentType;
}

export interface AddressDetails {
  contactName: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface PackageDetails {
  packageType: 'parcel' | 'box' | 'document' | 'other';
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  packageCount: number;
  invoiceValue: number;
  description?: string;
  sku?: string;
}

export interface PaymentDetails {
  paymentMode: PaymentMode;
  codAmount?: number;
  invoiceNumber?: string;
}

export interface ShippingOption {
  id: string;
  courierName: string;
  courierLogoKey: string;
  serviceType: string;
  estimatedDays: string;
  rate: number;
  rating: number;
  badgeText?: string;
}

export interface CreateShipmentForm {
  order: OrderDetails;
  pickupAddress: AddressDetails;
  deliveryAddress: AddressDetails;
  package: PackageDetails;
  payment: PaymentDetails;
  selectedCourier?: ShippingOption;
}
