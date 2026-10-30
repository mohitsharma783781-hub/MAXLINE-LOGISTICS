import type { StatusType } from './component';

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'REFUNDED'
  | 'VOID'
  | 'CANCELLED';

export type InvoiceType = 'TAX_INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE';

export type TaxType = 'CGST' | 'SGST' | 'IGST' | 'CESS';

export type TaxMode = 'TAX_INCLUSIVE' | 'TAX_EXCLUSIVE';

export interface InvoiceStatusConfig {
  key: InvoiceStatus;
  label: string;
  variant: StatusType;
}

export const INVOICE_STATUS_CONFIG: InvoiceStatusConfig[] = [
  { key: 'DRAFT', label: 'Draft', variant: 'neutral' },
  { key: 'ISSUED', label: 'Issued', variant: 'info' },
  { key: 'PAID', label: 'Paid', variant: 'success' },
  { key: 'PARTIALLY_PAID', label: 'Partially Paid', variant: 'warning' },
  { key: 'REFUNDED', label: 'Refunded', variant: 'brand' },
  { key: 'VOID', label: 'Void', variant: 'danger' },
  { key: 'CANCELLED', label: 'Cancelled', variant: 'neutral' },
];

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPriceMinor: number;
  taxableAmountMinor: number;
  taxRate: number; // e.g. 18 for 18% GST
  taxAmountMinor: number;
  totalMinor: number;
  referenceType: 'SHIPMENT' | 'SERVICE' | 'FEE';
  referenceId: string;
}

export interface Invoice extends Record<string, unknown> {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  type: InvoiceType;
  status: InvoiceStatus;
  customerId: string;
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  shippingAddress: string;
  currency: 'INR';
  subtotalMinor: number;
  discountMinor: number;
  taxableAmountMinor: number;
  taxMinor: number;
  totalMinor: number;
  lineItems: InvoiceLineItem[];
  walletTransactionId?: string;
  originalInvoiceId?: string;
  issuedAt?: string;
  dueAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingRecord extends Record<string, unknown> {
  id: string;
  tenantId: string;
  invoiceId: string;
  shipmentId: string;
  orderId: string;
  walletTransactionId: string;
  currency: 'INR';
  subtotalMinor: number;
  discountMinor: number;
  taxableAmountMinor: number;
  taxMinor: number;
  totalMinor: number;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TaxConfiguration extends Record<string, unknown> {
  id: string;
  tenantId: string;
  name: string;
  taxType: TaxType;
  rateBasisPoints: number; // e.g. 900 for 9.00%
  enabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface BillingSettings {
  tenantId: string;
  legalBusinessName: string;
  displayBusinessName: string;
  gstin: string;
  pan: string;
  businessAddress: string;
  city: string;
  state: string;
  postalCode: string;
  email: string;
  phone: string;
  invoicePrefix: string;
  startingNumber: number;
  taxMode: TaxMode;
  footerText: string;
}

export interface BillingFilterState {
  searchQuery: string;
  status: string;
  type: string;
}
