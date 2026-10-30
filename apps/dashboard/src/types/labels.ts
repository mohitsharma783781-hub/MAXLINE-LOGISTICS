import type { PaymentMode } from './rates';
import type { CourierCode } from './couriers';

export type LabelFormat = 'THERMAL_4X6' | 'A4';

export type LabelTemplate = 'DEFAULT_4X6' | 'DEFAULT_A4' | 'COURIER_SPECIFIC';

export type LabelStatus = 'PENDING' | 'GENERATED' | 'FAILED' | 'EXPIRED';

export interface LabelDocument extends Record<string, unknown> {
  id: string;
  tenantId: string;
  shipmentId: string;
  bookingId: string;
  awb: string;
  format: LabelFormat;
  template: LabelTemplate;
  status: LabelStatus;
  fileReference: string;
  generatedAt: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LabelDataPayload {
  awb: string;
  courierName: string;
  courierCode: CourierCode;
  serviceName: string;
  senderName: string;
  senderAddress: string;
  senderPhone: string;
  recipientName: string;
  recipientAddress: string;
  recipientPhone: string;
  shipmentType: 'B2C' | 'B2B';
  paymentMode: PaymentMode;
  codAmount: number;
  invoiceValue: number;
  packageCount: number;
  packageIndex: number;
  actualWeightKg: number;
  chargeableWeightKg: number;
  orderRef: string;
  shipmentRef: string;
  trackingRef: string;
  qrCodeUrl?: string;
  brandLogoUrl?: string;
  brandName?: string;
}
