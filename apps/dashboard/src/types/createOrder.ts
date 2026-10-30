export interface CustomerDetails {
  customerName: string;
  phone: string;
  email: string;
  customerReference?: string;
  companyName?: string;
}

export interface LineItem extends Record<string, unknown> {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  description?: string;
}

export interface DeliveryDetails {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  areaLocality?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  landmark?: string;
  sameAsDeliveryForBilling?: boolean;
}

export interface BillingDetails {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface PackageDetails {
  packageCount: number;
  actualWeightKg: number;
  weightUnit: 'kg' | 'g';
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
}

export interface PaymentDetails {
  paymentMode: 'prepaid' | 'cod';
  codAmount?: number;
}

export interface B2BDetails {
  companyName?: string;
  gstin?: string;
  businessContact?: string;
  businessReference?: string;
}

export interface OrderSummary {
  subtotal: number;
  discount: number;
  shippingCharge: number;
  tax: number;
  grandTotal: number;
}

export interface CreateOrderForm {
  customer: CustomerDetails;
  items: LineItem[];
  deliveryAddress: DeliveryDetails;
  billingAddress: BillingDetails;
  packageDetails: PackageDetails;
  payment: PaymentDetails;
  shipmentType: 'b2c' | 'b2b';
  b2bDetails: B2BDetails;
  summary: OrderSummary;
}
