import type {
  Invoice,
  BillingSettings,
  BillingFilterState,
} from '../types/billing';

// TAX SERVICE ENGINE
export const TaxService = {
  calculateTaxBreakdown: (taxableAmountMinor: number, isIntraState: boolean = true) => {
    if (isIntraState) {
      // 9% CGST + 9% SGST
      const cgstMinor = Math.round(taxableAmountMinor * 0.09);
      const sgstMinor = Math.round(taxableAmountMinor * 0.09);
      return {
        cgstMinor,
        sgstMinor,
        igstMinor: 0,
        totalTaxMinor: cgstMinor + sgstMinor,
      };
    } else {
      // 18% IGST
      const igstMinor = Math.round(taxableAmountMinor * 0.18);
      return {
        cgstMinor: 0,
        sgstMinor: 0,
        igstMinor,
        totalTaxMinor: igstMinor,
      };
    }
  },
};

// DEFAULT BILLING SETTINGS
export const DEFAULT_BILLING_SETTINGS: BillingSettings = {
  tenantId: 'tenant-demo-01',
  legalBusinessName: 'Apex Shipping Aggregation SaaS Pvt Ltd',
  displayBusinessName: 'Shipping SaaS Logistics',
  gstin: '27AAAAA0000A1Z5',
  pan: 'AAAAA0000A',
  businessAddress: 'Plot 42, Logistics Hub, MIDC Industrial Area',
  city: 'Mumbai',
  state: 'Maharashtra',
  postalCode: '400093',
  email: 'billing@shipping-saas.com',
  phone: '+91 1800 123 4567',
  invoicePrefix: 'INV-2026-',
  startingNumber: 1001,
  taxMode: 'TAX_EXCLUSIVE',
  footerText: 'Thank you for shipping with us! This is a computer-generated tax invoice.',
};

// INITIAL DEMO INVOICES
export const INITIAL_INVOICES: Invoice[] = [];

// STORES
let SETTINGS_STORE: BillingSettings = { ...DEFAULT_BILLING_SETTINGS };
const INVOICE_STORE: Map<string, Invoice> = new Map();
let INVOICE_COUNTER = 3;

INITIAL_INVOICES.forEach((inv) => INVOICE_STORE.set(inv.id, inv));

export const BillingService = {
  getBillingSettings: (): BillingSettings => {
    return { ...SETTINGS_STORE };
  },

  updateBillingSettings: (input: Partial<BillingSettings>): BillingSettings => {
    SETTINGS_STORE = { ...SETTINGS_STORE, ...input };
    return { ...SETTINGS_STORE };
  },

  getInvoices: (filters?: BillingFilterState): Invoice[] => {
    const list = Array.from(INVOICE_STORE.values());
    if (!filters) return list;

    return list.filter((item) => {
      if (filters.status !== 'all' && item.status !== filters.status) return false;
      if (filters.type !== 'all' && item.type !== filters.type) return false;
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          item.invoiceNumber.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  },

  getInvoiceById: (id: string): Invoice | null => {
    return INVOICE_STORE.get(id) || Array.from(INVOICE_STORE.values()).find((i) => i.invoiceNumber === id) || null;
  },

  issueInvoice: (id: string): { success: boolean; message: string; invoice: Invoice | null } => {
    const inv = INVOICE_STORE.get(id);
    if (!inv) return { success: false, message: 'Invoice not found.', invoice: null };

    if (inv.status !== 'DRAFT') {
      return { success: false, message: `Cannot issue invoice in ${inv.status} state.`, invoice: inv };
    }

    inv.status = 'ISSUED';
    inv.issuedAt = new Date().toLocaleString();
    inv.updatedAt = new Date().toLocaleString();
    INVOICE_STORE.set(inv.id, inv);

    return { success: true, message: `Invoice ${inv.invoiceNumber} issued successfully.`, invoice: inv };
  },

  voidInvoice: (id: string): { success: boolean; message: string; invoice: Invoice | null } => {
    const inv = INVOICE_STORE.get(id);
    if (!inv) return { success: false, message: 'Invoice not found.', invoice: null };

    if (inv.status === 'PAID' || inv.status === 'VOID') {
      return { success: false, message: `Cannot void invoice in ${inv.status} state.`, invoice: inv };
    }

    inv.status = 'VOID';
    inv.updatedAt = new Date().toLocaleString();
    INVOICE_STORE.set(inv.id, inv);

    return { success: true, message: `Invoice ${inv.invoiceNumber} has been voided.`, invoice: inv };
  },

  createCreditNote: (
    originalInvoiceId: string,
    amountMinor: number,
    reason: string
  ): { success: boolean; message: string; creditNote: Invoice | null } => {
    const original = INVOICE_STORE.get(originalInvoiceId);
    if (!original) return { success: false, message: 'Original invoice not found.', creditNote: null };

    INVOICE_COUNTER += 1;
    const numStr = String(INVOICE_COUNTER).padStart(6, '0');
    const id = `inv-${Date.now()}`;
    const nowStr = new Date().toLocaleString();

    const taxableAmountMinor = Math.round(amountMinor / 1.18);
    const taxMinor = amountMinor - taxableAmountMinor;

    const creditNote: Invoice = {
      id,
      tenantId: original.tenantId,
      invoiceNumber: `CN-2026-${numStr}`,
      type: 'CREDIT_NOTE',
      status: 'ISSUED',
      customerId: original.customerId,
      customerName: original.customerName,
      customerEmail: original.customerEmail,
      billingAddress: original.billingAddress,
      shippingAddress: original.shippingAddress,
      currency: 'INR',
      subtotalMinor: taxableAmountMinor,
      discountMinor: 0,
      taxableAmountMinor,
      taxMinor,
      totalMinor: amountMinor,
      lineItems: [
        {
          id: `li-${id}-1`,
          invoiceId: id,
          description: `Credit Note / Refund for ${original.invoiceNumber} (${reason})`,
          quantity: 1,
          unitPriceMinor: taxableAmountMinor,
          taxableAmountMinor,
          taxRate: 18,
          taxAmountMinor: taxMinor,
          totalMinor: amountMinor,
          referenceType: 'SERVICE',
          referenceId: original.invoiceNumber,
        },
      ],
      originalInvoiceId: original.id,
      issuedAt: nowStr,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    INVOICE_STORE.set(id, creditNote);
    return { success: true, message: `Credit Note ${creditNote.invoiceNumber} generated.`, creditNote };
  },

  createDebitNote: (
    originalInvoiceId: string,
    amountMinor: number,
    reason: string
  ): { success: boolean; message: string; debitNote: Invoice | null } => {
    const original = INVOICE_STORE.get(originalInvoiceId);
    if (!original) return { success: false, message: 'Original invoice not found.', debitNote: null };

    INVOICE_COUNTER += 1;
    const numStr = String(INVOICE_COUNTER).padStart(6, '0');
    const id = `inv-${Date.now()}`;
    const nowStr = new Date().toLocaleString();

    const taxableAmountMinor = Math.round(amountMinor / 1.18);
    const taxMinor = amountMinor - taxableAmountMinor;

    const debitNote: Invoice = {
      id,
      tenantId: original.tenantId,
      invoiceNumber: `DN-2026-${numStr}`,
      type: 'DEBIT_NOTE',
      status: 'ISSUED',
      customerId: original.customerId,
      customerName: original.customerName,
      customerEmail: original.customerEmail,
      billingAddress: original.billingAddress,
      shippingAddress: original.shippingAddress,
      currency: 'INR',
      subtotalMinor: taxableAmountMinor,
      discountMinor: 0,
      taxableAmountMinor,
      taxMinor,
      totalMinor: amountMinor,
      lineItems: [
        {
          id: `li-${id}-1`,
          invoiceId: id,
          description: `Debit Note / Supplementary Charge for ${original.invoiceNumber} (${reason})`,
          quantity: 1,
          unitPriceMinor: taxableAmountMinor,
          taxableAmountMinor,
          taxRate: 18,
          taxAmountMinor: taxMinor,
          totalMinor: amountMinor,
          referenceType: 'SERVICE',
          referenceId: original.invoiceNumber,
        },
      ],
      originalInvoiceId: original.id,
      issuedAt: nowStr,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    INVOICE_STORE.set(id, debitNote);
    return { success: true, message: `Debit Note ${debitNote.invoiceNumber} generated.`, debitNote };
  },

  createDemoInvoice: (customerName = 'Rahul Sharma', totalINR = 150.0): Invoice => {
    INVOICE_COUNTER += 1;
    const numStr = String(INVOICE_COUNTER).padStart(6, '0');
    const id = `inv-${Date.now()}`;
    const nowStr = new Date().toLocaleString();

    const totalMinor = Math.round(totalINR * 100);
    const taxableAmountMinor = Math.round(totalMinor / 1.18);
    const taxMinor = totalMinor - taxableAmountMinor;

    const newInvoice: Invoice = {
      id,
      tenantId: 'tenant-demo-01',
      invoiceNumber: `INV-2026-${numStr}`,
      type: 'TAX_INVOICE',
      status: 'ISSUED',
      customerId: `cust-${Date.now()}`,
      customerName,
      customerEmail: `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      billingAddress: 'Plot 18, Business Park, Andheri East, Mumbai, MH - 400069',
      shippingAddress: 'Plot 18, Business Park, Andheri East, Mumbai, MH - 400069',
      currency: 'INR',
      subtotalMinor: taxableAmountMinor,
      discountMinor: 0,
      taxableAmountMinor,
      taxMinor,
      totalMinor,
      lineItems: [
        {
          id: `li-${id}-1`,
          invoiceId: id,
          description: 'Shipment Freight Charge (Delhivery Surface • DEMO-AWB-98401955)',
          quantity: 1,
          unitPriceMinor: taxableAmountMinor,
          taxableAmountMinor,
          taxRate: 18,
          taxAmountMinor: taxMinor,
          totalMinor,
          referenceType: 'SHIPMENT',
          referenceId: 'SHP-9840195',
        },
      ],
      issuedAt: nowStr,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    INVOICE_STORE.set(id, newInvoice);
    return newInvoice;
  },
};
