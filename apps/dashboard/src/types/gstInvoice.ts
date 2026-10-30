export type GstRegistrationType = 'REGISTERED' | 'UNREGISTERED' | 'SEZ' | 'COMPOSITION';

export type InvoiceStatus = 'DRAFT' | 'GENERATED' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'ISSUED' | 'ADJUSTED';

export type InvoiceType = 'B2B' | 'B2C';

export type AdjustmentType = 'CREDIT_NOTE' | 'DEBIT_NOTE';

export type BillingCycleType = '30_DAY' | 'CUSTOM';

export interface CustomerGstProfile extends Record<string, unknown> {
  tenantId: string;
  legalBusinessName: string;
  tradeName?: string;
  registrationType: GstRegistrationType;
  gstin: string; // 15 chars (e.g., 07AAAAA0000A1Z5)
  pan: string; // 10 chars
  billingAddress: string;
  city: string;
  state: string;
  stateCode: string; // e.g., "07" for Delhi, "27" for Maharashtra
  pincode: string;
  email: string;
  phone: string;
  isVerified?: boolean;
  verifiedAt?: string;
  updatedAt: string;
}

export interface TaxCategoryConfig extends Record<string, unknown> {
  id: string;
  categoryName: string;
  sacCode: string;
  gstRatePercent: number;
  description: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SupplierGstProfile extends Record<string, unknown> {
  legalName: string;
  tradeName: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  supportEmail: string;
  supportPhone: string;
}

export interface InvoiceSnapshotProfile {
  customerLegalName: string;
  customerTradeName?: string;
  customerGstin: string;
  customerPan: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerStateCode: string;
  customerPincode: string;
  customerEmail: string;
  customerPhone: string;
}

// CRITICAL AWB / LRN ITEMIZATION BREAKDOWN
export interface ShipmentAnnexureItem extends Record<string, unknown> {
  shipmentId: string;
  awbNumber: string;
  lrnNumber: string; // Logistics Reference Number
  bookingDate: string;
  courierName: string;
  mode: 'B2B' | 'B2C';
  originCity: string;
  destinationCity: string;
  deadWeightKg: number;
  chargeableWeightKg: number;
  baseFreightINR: number;
  fuelSurchargeINR: number;
  docketChargesINR: number;
  codChargesINR: number;
  firstMileFeeINR: number; // FM
  rovCoverFeeINR: number; // ROV
  odaFeeINR: number; // ODA
  taxableValueINR: number;
  gstAmountINR: number;
  totalAmountINR: number;
  ledgerTxnRef: string;
}

export interface InvoiceLineItem extends Record<string, unknown> {
  srNo: number;
  description: string;
  sacCode: string;
  quantity: number;
  taxableValueINR: number;
  gstRatePercent: number;
  cgstRatePercent: number;
  cgstAmountINR: number;
  sgstRatePercent: number;
  sgstAmountINR: number;
  igstRatePercent: number;
  igstAmountINR: number;
  totalAmountINR: number;
}

export interface CreditDebitNoteRecord extends Record<string, unknown> {
  id: string;
  noteNumber: string; // e.g., CN-2026-000001
  noteType: AdjustmentType;
  adjustmentCategory: 'Weight Dispute Adjustment' | 'Manual Discount' | 'Refund' | 'Courier Adjustment';
  originalInvoiceNumber: string;
  disputeRef?: string;
  tenantId: string;
  merchantName: string;
  issueDate: string;
  reason: string;
  adjustedTaxableINR: number;
  adjustedGstINR: number;
  adjustedTotalINR: number;
  status: 'ISSUED' | 'CANCELLED';
  createdBy: string;
}

export interface MonthlyGstInvoiceRecord extends Record<string, unknown> {
  id: string;
  invoiceNumber: string; // e.g. B2B-2026-000001 or B2C-2026-000001
  invoiceType: InvoiceType;
  billingRunId: string;
  billingPeriodMonth: string;
  billingPeriodStartDate: string;
  billingPeriodEndDate: string;
  issueDate: string;
  dueDate: string;
  tenantId: string;

  // Frozen Snapshots
  supplierSnapshot: SupplierGstProfile;
  customerSnapshot: InvoiceSnapshotProfile;

  // Tax Breakdown
  isInterState: boolean;
  sacCode: string;
  taxableValueINR: number;
  cgstAmountINR: number;
  sgstAmountINR: number;
  igstAmountINR: number;
  totalGstAmountINR: number;
  roundOffINR: number;
  grandTotalINR: number;
  amountInWords: string;

  // Status & References
  status: InvoiceStatus;
  shipmentCount: number;
  lineItems: InvoiceLineItem[];
  annexureItems: ShipmentAnnexureItem[];
  creditNotes?: CreditDebitNoteRecord[];

  createdAt: string;
  issuedBy: string;
}

// Running Shipment AWB Ledger Record
export interface AWBLedgerRecord extends Record<string, unknown> {
  id: string;
  awbNumber: string;
  lrnNumber: string;
  bookingDate: string;
  courierName: string;
  mode: 'B2B' | 'B2C';
  originCity: string;
  destinationCity: string;
  deadWeightKg: number;
  chargeableWeightKg: number;
  baseFreight: number;
  fuelSurcharge: number;
  docketCharges: number;
  codCharges: number;
  firstMileFee: number;
  rovCoverFee: number;
  odaFee: number;
  taxableValue: number;
  gstAmount: number;
  totalAmount: number;
  billingStatus: 'Delivered' | 'Bill Pending' | 'Added To Invoice' | 'Invoice Generated' | 'Paid';
  invoiceNumber?: string;
}

export interface BillingRunRecord extends Record<string, unknown> {
  billingRunId: string;
  billingMonth: string;
  startedAt: string;
  completedAt?: string;
  startedBy: string;
  totalCustomersProcessed: number;
  successfulInvoicesCount: number;
  failedInvoicesCount: number;
  totalTaxableValueINR: number;
  totalGstAmountINR: number;
  totalGrandValueINR: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  failedCustomers?: { tenantId: string; merchantName: string; reason: string }[];
}
