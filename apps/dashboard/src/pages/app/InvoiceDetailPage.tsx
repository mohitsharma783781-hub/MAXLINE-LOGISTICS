import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  RotateCcw,
  ListFilter,
  Copy,
  Check,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Alert,
  Modal,
  Input,
} from '../../components/ui';
import {
  GstInvoiceService,
  SUPPLIER_PROFILE,
} from '../../services/gstInvoiceService';
import type { MonthlyGstInvoiceRecord } from '../../types/gstInvoice';
import { formatCurrency } from '../../utils/formatters';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<MonthlyGstInvoiceRecord | null>(null);
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  // Credit Note Modal State
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  const [cnReason, setCnReason] = useState('Weight dispute refund after factory dimension verification');
  const [cnAmount, setCnAmount] = useState<number>(150);
  const [cnCategory, setCnCategory] = useState<'Weight Dispute Adjustment' | 'Manual Discount' | 'Refund' | 'Courier Adjustment'>('Weight Dispute Adjustment');

  useEffect(() => {
    const targetId = id || 'B2B-2026-000001';
    const match = GstInvoiceService.getInvoiceById(targetId) || GstInvoiceService.getInvoices('all')[0];
    setInvoice(match ? { ...match } : null);
  }, [id]);

  const handleCopyNo = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedInvoice(num);
    setTimeout(() => setCopiedInvoice(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCreateCreditNote = () => {
    if (!invoice) return;
    const res = GstInvoiceService.createCreditNote({
      invoiceNumber: invoice.invoiceNumber,
      adjustmentCategory: cnCategory,
      adjustedTaxableINR: cnAmount,
      reason: cnReason,
    });

    setIsCreditNoteModalOpen(false);
    if (res.success && res.creditNote) {
      setActionAlert(res.message);
      const updated = GstInvoiceService.getInvoiceById(invoice.invoiceNumber);
      if (updated) setInvoice({ ...updated });
    }
  };

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Billing & Ledger', path: '/app/billing' },
    { label: invoice?.invoiceNumber || id || 'Invoice Details', path: `/app/billing/invoices/${id}` },
  ];

  if (!invoice) {
    return (
      <div style={{ padding: '24px' }}>
        <PageHeader title="Invoice Not Found" breadcrumbs={breadcrumbs} />
        <Alert variant="danger" title="Missing Invoice Record">
          The requested invoice record could not be found in your merchant workspace.
        </Alert>
        <Button variant="outline" style={{ marginTop: '16px' }} onClick={() => navigate('/app/billing')}>
          Back to Billing & Invoices
        </Button>
      </div>
    );
  }

  const isB2B = invoice.invoiceType === 'B2B';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. Page Header */}
      <PageHeader
        title={`Logistics Tax Invoice #${invoice.invoiceNumber}`}
        description={`Type: ${invoice.invoiceType} • Issued: ${invoice.issueDate} • Period: ${invoice.billingPeriodMonth}`}
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/app/billing')}>
              Back to Billing
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Printer size={14} />} onClick={handlePrint}>
              Print / PDF
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<RotateCcw size={14} />} onClick={() => setIsCreditNoteModalOpen(true)}>
              Issue Credit Note
            </Button>
          </div>
        }
      />

      {actionAlert && (
        <Alert variant="success" title="Credit Note Generated">
          {actionAlert}
        </Alert>
      )}

      {/* 2. FORMAL INVOICE CARD */}
      <Card style={{ padding: '28px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        
        {/* INVOICE HEADER ROW */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', borderBottom: '2px solid #0f172a', paddingBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge variant={isB2B ? 'brand' : 'info'}>{invoice.invoiceType} INVOICE</Badge>
              <Badge variant={invoice.status === 'PAID' ? 'success' : invoice.status === 'ADJUSTED' ? 'warning' : 'info'}>
                {invoice.status}
              </Badge>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0284c7', margin: '6px 0 2px 0' }}>
              {SUPPLIER_PROFILE.legalName}
            </h2>
            <div style={{ fontSize: '12px', color: '#475569' }}>
              <div>{SUPPLIER_PROFILE.address}, {SUPPLIER_PROFILE.city}, {SUPPLIER_PROFILE.state} - {SUPPLIER_PROFILE.pincode}</div>
              <div><strong>GSTIN:</strong> {SUPPLIER_PROFILE.gstin} | <strong>PAN:</strong> {SUPPLIER_PROFILE.pan}</div>
              <div>Email: {SUPPLIER_PROFILE.supportEmail} | Phone: {SUPPLIER_PROFILE.supportPhone}</div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>TAX INVOICE</h3>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#0284c7', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
              <span>{invoice.invoiceNumber}</span>
              <button
                onClick={() => handleCopyNo(invoice.invoiceNumber)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedInvoice === invoice.invoiceNumber ? '#16a34a' : '#94a3b8' }}
              >
                {copiedInvoice === invoice.invoiceNumber ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              <div>Issue Date: <strong>{invoice.issueDate}</strong></div>
              <div>Due Date: <strong>{invoice.dueDate}</strong></div>
              <div>Period: <strong>{invoice.billingPeriodMonth}</strong></div>
            </div>
          </div>
        </div>

        {/* CUSTOMER BILL TO BOX */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', margin: '20px 0', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div>
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Billed Customer Details (Bill To)
            </span>
            <strong style={{ fontSize: '14px', color: '#0f172a' }}>{invoice.customerSnapshot.customerLegalName}</strong>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
              <div>{invoice.customerSnapshot.customerAddress}, {invoice.customerSnapshot.customerCity}, {invoice.customerSnapshot.customerState} - {invoice.customerSnapshot.customerPincode}</div>
              <div><strong>GSTIN:</strong> {invoice.customerSnapshot.customerGstin} | <strong>PAN:</strong> {invoice.customerSnapshot.customerPan}</div>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Tax & Place of Supply Specs
            </span>
            <div style={{ fontSize: '12px', color: '#475569' }}>
              <div>Place of Supply: <strong>{invoice.customerSnapshot.customerState} ({invoice.customerSnapshot.customerStateCode})</strong></div>
              <div>Tax Type: <strong>{invoice.isInterState ? 'IGST Inter-State (18%)' : 'CGST (9%) + SGST (9%) Intra-State'}</strong></div>
              <div>SAC Code: <strong>{invoice.sacCode} (Goods Transport Logistics)</strong></div>
            </div>
          </div>
        </div>

        {/* 3. CRITICAL FEATURE: ITEMISED AWB / LRN CHARGE BREAKDOWN TABLE */}
        <div style={{ marginTop: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ListFilter size={16} style={{ color: '#0284c7' }} /> Itemized AWB & LRN Charge Breakdown ({invoice.annexureItems.length} Delivered Shipments)
            </h4>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Every charge line itemized for complete transparency</span>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                  <th style={{ padding: '8px 10px' }}>AWB No</th>
                  <th style={{ padding: '8px 10px' }}>LRN No</th>
                  <th style={{ padding: '8px 10px' }}>Date</th>
                  <th style={{ padding: '8px 10px' }}>Courier</th>
                  <th style={{ padding: '8px 10px' }}>Route</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Wt (KG)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Freight</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Fuel</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Docket</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>COD</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>FM</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>ROV</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>ODA</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>GST</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.annexureItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '8px 10px', fontWeight: '700', color: '#0284c7', fontFamily: 'monospace' }}>{item.awbNumber}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{item.lrnNumber}</td>
                    <td style={{ padding: '8px 10px' }}>{item.bookingDate}</td>
                    <td style={{ padding: '8px 10px', fontWeight: '600' }}>{item.courierName}</td>
                    <td style={{ padding: '8px 10px' }}>{item.originCity} → {item.destinationCity}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{item.chargeableWeightKg}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{item.baseFreightINR.toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{item.fuelSurchargeINR.toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{item.docketChargesINR.toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{item.codChargesINR.toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{item.firstMileFeeINR.toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{item.rovCoverFeeINR.toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{item.odaFeeINR.toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{item.gstAmountINR.toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>₹{item.totalAmountINR.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. TOTAL TAX & AMOUNT IN WORDS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '2px solid #0f172a', paddingTop: '16px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <strong style={{ fontSize: '11px', color: '#64748b' }}>AMOUNT IN WORDS:</strong>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0284c7', marginTop: '2px' }}>
              {invoice.amountInWords}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
              Reverse Charge Applicable: <strong>NO</strong> | Tax Is Payable On Reverse Charge: <strong>NO</strong>
            </div>

            {invoice.creditNotes && invoice.creditNotes.length > 0 && (
              <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#fff7ed', border: '1px solid #fdba74', borderRadius: '6px' }}>
                <strong style={{ fontSize: '11px', color: '#c2410c' }}>Linked Credit Note(s):</strong>
                {invoice.creditNotes.map((cn) => (
                  <div key={cn.id} style={{ fontSize: '11px', color: '#9a3412', marginTop: '2px' }}>
                    • {cn.noteNumber} ({cn.adjustmentCategory}): -₹{cn.adjustedTotalINR.toFixed(2)} ({cn.reason})
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ width: '280px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
              <span style={{ color: '#64748b' }}>Taxable Freight Charges:</span>
              <strong>{formatCurrency(invoice.taxableValueINR)}</strong>
            </div>

            {invoice.isInterState ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span style={{ color: '#64748b' }}>Integrated IGST (18%):</span>
                <strong>{formatCurrency(invoice.igstAmountINR)}</strong>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: '#64748b' }}>Central CGST (9%):</span>
                  <strong>{formatCurrency(invoice.cgstAmountINR)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: '#64748b' }}>State SGST (9%):</span>
                  <strong>{formatCurrency(invoice.sgstAmountINR)}</strong>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #0f172a', marginTop: '6px', fontSize: '16px', fontWeight: '800', color: '#0284c7' }}>
              <span>Grand Total Amount:</span>
              <span>{formatCurrency(invoice.grandTotalINR)}</span>
            </div>
          </div>
        </div>

      </Card>

      {/* CREATE CREDIT NOTE MODAL */}
      <Modal isOpen={isCreditNoteModalOpen} onClose={() => setIsCreditNoteModalOpen(false)} title={`Issue Credit Note for Invoice ${invoice.invoiceNumber}`} maxWidth="500px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
            Issue a credit note against this invoice for weight disputes, carrier refunds, or volume discounts:
          </p>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Adjustment Category</label>
            <select
              value={cnCategory}
              onChange={(e) => setCnCategory(e.target.value as any)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            >
              <option value="Weight Dispute Adjustment">Weight Dispute Adjustment</option>
              <option value="Manual Discount">Manual Discount</option>
              <option value="Refund">Refund</option>
              <option value="Courier Adjustment">Courier Adjustment</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Adjusted Taxable Amount (₹)</label>
            <Input type="number" value={cnAmount} onChange={(e) => setCnAmount(Number(e.target.value))} />
            <span style={{ fontSize: '11px', color: '#64748b' }}>GST 18% (₹{(cnAmount * 0.18).toFixed(2)}) will be added automatically. Total CN: ₹{(cnAmount * 1.18).toFixed(2)}</span>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Reason / Remarks</label>
            <Input value={cnReason} onChange={(e) => setCnReason(e.target.value)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Button variant="outline" onClick={() => setIsCreditNoteModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateCreditNote} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
              Issue Credit Note
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
