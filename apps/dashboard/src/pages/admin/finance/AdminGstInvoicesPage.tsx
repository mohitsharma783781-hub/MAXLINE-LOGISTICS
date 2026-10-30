import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Eye,
  IndianRupee,
  PlusCircle,
  ShieldCheck,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatCard } from '../../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Modal,
  Alert,
  Input,
  Select,
  Textarea,
} from '../../../components/ui';
import {
  GstInvoiceService,
} from '../../../services/gstInvoiceService';
import type { MonthlyGstInvoiceRecord, CreditDebitNoteRecord } from '../../../types/gstInvoice';
import { formatCurrency } from '../../../utils/formatters';

export const AdminGstInvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'CREDIT_NOTES' | 'AUTO_BILLING'>('INVOICES');

  // Invoices Data Store
  const [invoices, setInvoices] = useState<MonthlyGstInvoiceRecord[]>(() =>
    GstInvoiceService.getInvoices('all')
  );

  const [creditNotes, setCreditNotes] = useState<CreditDebitNoteRecord[]>(() =>
    GstInvoiceService.getCreditNotes()
  );

  // Filters
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Invoice & Modals
  const [selectedInvoice, setSelectedInvoice] = useState<MonthlyGstInvoiceRecord | null>(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);

  // Monthly / Custom Billing Generation Modal
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billingInvoiceType, setBillingInvoiceType] = useState<'B2B' | 'B2C'>('B2B');
  const [billingMonthInput, setBillingMonthInput] = useState('August 2026');

  // Credit Note Modal State
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  const [cnInvoiceNoInput, setCnInvoiceNoInput] = useState('B2B-2026-000001');
  const [cnCategoryInput, setCnCategoryInput] = useState<'Weight Dispute Adjustment' | 'Manual Discount' | 'Refund' | 'Courier Adjustment'>('Weight Dispute Adjustment');
  const [cnTaxableInput, setCnTaxableInput] = useState<number>(200);
  const [cnReasonInput, setCnReasonInput] = useState('Courier reweigh audit discrepancy refund');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const refreshData = () => {
    setInvoices([...GstInvoiceService.getInvoices('all')]);
    setCreditNotes([...GstInvoiceService.getCreditNotes()]);
  };

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (filterType !== 'all' && inv.invoiceType !== filterType) return false;
      if (filterStatus !== 'all' && inv.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchInv = inv.invoiceNumber.toLowerCase().includes(q);
        const matchGstin = inv.customerSnapshot.customerGstin.toLowerCase().includes(q);
        const matchName = inv.customerSnapshot.customerLegalName.toLowerCase().includes(q);
        if (!matchInv && !matchGstin && !matchName) return false;
      }

      return true;
    });
  }, [invoices, filterType, filterStatus, searchQuery]);

  // Statistics Summary
  const stats = useMemo(() => {
    const totalCount = invoices.length;
    const b2bCount = invoices.filter((i) => i.invoiceType === 'B2B').length;
    const b2cCount = invoices.filter((i) => i.invoiceType === 'B2C').length;
    const totalTaxable = invoices.reduce((s, i) => s + i.taxableValueINR, 0);
    const totalGst = invoices.reduce((s, i) => s + i.totalGstAmountINR, 0);
    const totalGrand = invoices.reduce((s, i) => s + i.grandTotalINR, 0);

    return { totalCount, b2bCount, b2cCount, totalTaxable, totalGst, totalGrand };
  }, [invoices]);

  // Execute Automated Monthly Billing Generation
  const handleExecuteBillingRun = () => {
    const res = GstInvoiceService.generateMonthlyInvoices(billingInvoiceType, billingMonthInput, 'Super Admin Finance');
    setIsBillingModalOpen(false);
    if (res.success) {
      refreshData();
      setToastMsg(res.message);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  // Execute Credit Note Generation
  const handleExecuteCreditNote = () => {
    const res = GstInvoiceService.createCreditNote({
      invoiceNumber: cnInvoiceNoInput,
      adjustmentCategory: cnCategoryInput,
      adjustedTaxableINR: cnTaxableInput,
      reason: cnReasonInput,
      adminUser: 'Super Admin Finance',
    });

    setIsCreditNoteModalOpen(false);
    if (res.success) {
      refreshData();
      setToastMsg(res.message);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  // Cancel Invoice Action
  const handleCancelInvoice = (invoiceNumber: string) => {
    const inv = GstInvoiceService.getInvoiceById(invoiceNumber);
    if (inv) {
      inv.status = 'CANCELLED';
      refreshData();
      setToastMsg(`Invoice ${invoiceNumber} marked as CANCELLED.`);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  // Export GSTR Summary CSV
  const handleExportGstrSummary = () => {
    const csvContent = GstInvoiceService.exportGstrCsvData(filteredInvoices);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Admin_GSTR1_Monthly_Export_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Finance Engine', path: '/admin/wallets' },
    { label: 'Admin Billing & Invoice Engine', path: '/admin/billing' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. Page Header */}
      <PageHeader
        title="Admin Billing, Invoice & Ledger Engine"
        description="Supervise automated delivered shipment billing runs, issue B2B & B2C tax invoices, create Credit Notes, and manage adjustments."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={handleExportGstrSummary}>
              <Download size={14} style={{ marginRight: '6px' }} /> Export GSTR Summary CSV
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsBillingModalOpen(true)} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
              <PlusCircle size={14} style={{ marginRight: '6px' }} /> Generate Monthly Invoice
            </Button>
          </div>
        }
      />

      {toastMsg && (
        <Alert variant="success" title="Admin Finance Action Executed">
          {toastMsg}
        </Alert>
      )}

      {/* 2. Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Invoices Issued" value={stats.totalCount} subtext={`B2B: ${stats.b2bCount} • B2C: ${stats.b2cCount}`} icon={FileText} />
        <StatCard label="Total Taxable Freight" value={formatCurrency(stats.totalTaxable)} subtext="Eligible shipping charges" icon={IndianRupee} />
        <StatCard label="Total GST Collected" value={formatCurrency(stats.totalGst)} subtext="IGST / CGST / SGST 18%" badgeText="GST 18%" badgeVariant="success" icon={ShieldCheck} />
        <StatCard label="Grand Total Billed" value={formatCurrency(stats.totalGrand)} subtext="Taxable + GST Amount" icon={IndianRupee} />
      </div>

      {/* 3. Main Navigation Tabs */}
      <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('INVOICES')}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === 'INVOICES' ? '#0284c7' : 'transparent',
              color: activeTab === 'INVOICES' ? '#ffffff' : '#64748b',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Issued Tax Invoices ({invoices.length})
          </button>

          <button
            onClick={() => setActiveTab('CREDIT_NOTES')}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === 'CREDIT_NOTES' ? '#0284c7' : 'transparent',
              color: activeTab === 'CREDIT_NOTES' ? '#ffffff' : '#64748b',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Credit Notes Register ({creditNotes.length})
          </button>

          <button
            onClick={() => setActiveTab('AUTO_BILLING')}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === 'AUTO_BILLING' ? '#0284c7' : 'transparent',
              color: activeTab === 'AUTO_BILLING' ? '#ffffff' : '#64748b',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Automated Billing Cycle Rules
          </button>
        </div>

        {/* TAB 1: INVOICES MASTER LIST */}
        {activeTab === 'INVOICES' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>Invoice Type</label>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  options={[
                    { label: 'All Types (B2B & B2C)', value: 'all' },
                    { label: 'B2B Commercial Freight', value: 'B2B' },
                    { label: 'B2C Retail Parcels', value: 'B2C' },
                  ]}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>Status</label>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  options={[
                    { label: 'All Statuses', value: 'all' },
                    { label: 'ISSUED', value: 'ISSUED' },
                    { label: 'PAID', value: 'PAID' },
                    { label: 'ADJUSTED', value: 'ADJUSTED' },
                    { label: 'CANCELLED', value: 'CANCELLED' },
                  ]}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>Search</label>
                <Input
                  placeholder="Invoice No, GSTIN, Legal Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button variant="outline" onClick={() => setIsCreditNoteModalOpen(true)} style={{ width: '100%' }}>
                  <RotateCcw size={14} style={{ marginRight: '4px' }} /> Issue Credit Note
                </Button>
              </div>
            </div>

            <Table<MonthlyGstInvoiceRecord>
              keyExtractor={(r) => r.id}
              columns={[
                { key: 'invoiceNumber', header: 'Invoice Number', render: (r) => <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{r.invoiceNumber}</strong> },
                { key: 'invoiceType', header: 'Type', render: (r) => <Badge variant={r.invoiceType === 'B2B' ? 'brand' : 'info'}>{r.invoiceType}</Badge> },
                { key: 'merchant', header: 'Merchant Legal Name & GSTIN', render: (r) => <div><strong>{r.customerSnapshot.customerLegalName}</strong><div style={{ fontSize: '11px', color: '#64748b' }}>GSTIN: {r.customerSnapshot.customerGstin}</div></div> },
                { key: 'shipmentCount', header: 'Shipments', render: (r) => <span>{r.shipmentCount} Parcels</span> },
                { key: 'taxableValueINR', header: 'Taxable Freight', render: (r) => formatCurrency(r.taxableValueINR) },
                { key: 'totalGstAmountINR', header: 'GST (18%)', render: (r) => formatCurrency(r.totalGstAmountINR) },
                { key: 'grandTotalINR', header: 'Grand Total', render: (r) => <strong>{formatCurrency(r.grandTotalINR)}</strong> },
                { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'PAID' ? 'success' : r.status === 'CANCELLED' ? 'danger' : 'info'}>{r.status}</Badge> },
                {
                  key: 'actions',
                  header: 'Admin Actions',
                  render: (r) => (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedInvoice(r); setIsInspectModalOpen(true); }}>
                        <Eye size={13} />
                      </Button>
                      {r.status !== 'CANCELLED' && (
                        <Button size="sm" variant="ghost" style={{ color: '#ef4444' }} onClick={() => handleCancelInvoice(r.invoiceNumber)} title="Cancel Invoice">
                          <XCircle size={13} />
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
              data={filteredInvoices}
            />
          </div>
        )}

        {/* TAB 2: CREDIT NOTES REGISTER */}
        {activeTab === 'CREDIT_NOTES' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Issued Credit Notes Audit Register</h4>
              <Button variant="primary" size="sm" onClick={() => setIsCreditNoteModalOpen(true)} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                + Issue Credit Note
              </Button>
            </div>

            <Table<CreditDebitNoteRecord>
              keyExtractor={(r) => r.id}
              columns={[
                { key: 'noteNumber', header: 'Credit Note No', render: (r) => <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{r.noteNumber}</strong> },
                { key: 'originalInvoiceNumber', header: 'Original Invoice', render: (r) => <span style={{ fontFamily: 'monospace' }}>{r.originalInvoiceNumber}</span> },
                { key: 'merchantName', header: 'Merchant Account', render: (r) => <span>{r.merchantName}</span> },
                { key: 'adjustmentCategory', header: 'Category', render: (r) => <Badge variant="warning">{r.adjustmentCategory}</Badge> },
                { key: 'issueDate', header: 'Issue Date', render: (r) => r.issueDate },
                { key: 'reason', header: 'Reason', render: (r) => <span style={{ fontSize: '12px' }}>{r.reason}</span> },
                { key: 'adjustedTotalINR', header: 'Credit Total', render: (r) => <strong style={{ color: '#16a34a' }}>{formatCurrency(r.adjustedTotalINR)}</strong> },
                { key: 'status', header: 'Status', render: (r) => <Badge variant="success">{r.status}</Badge> },
              ]}
              data={creditNotes}
            />
          </div>
        )}

        {/* TAB 3: AUTOMATED BILLING CYCLE RULES */}
        {activeTab === 'AUTO_BILLING' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Alert variant="info" title="Delivered Shipment Billing Automation">
              The automated billing engine queries delivered shipments every billing cycle. Delivered parcels transition automatically: <code>Delivered</code> ➔ <code>Bill Pending</code> ➔ <code>Added To Invoice</code> ➔ <code>Invoice Generated</code> ➔ <code>Paid</code>.
            </Alert>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Card style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <strong style={{ fontSize: '14px', color: '#0284c7', display: 'block', marginBottom: '8px' }}>B2B Freight Billing Rule</strong>
                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>Cycle: <strong>30-Day Monthly Invoice (First of Month)</strong></div>
                  <div>Invoice Prefix: <strong>B2B-2026-******</strong></div>
                  <div>Qualification: <strong>B2B Mode + Status Delivered</strong></div>
                </div>
              </Card>

              <Card style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <strong style={{ fontSize: '14px', color: '#0284c7', display: 'block', marginBottom: '8px' }}>B2C Express Billing Rule</strong>
                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>Cycle: <strong>Bi-Weekly 15-Day Invoice Cycle</strong></div>
                  <div>Invoice Prefix: <strong>B2C-2026-******</strong></div>
                  <div>Qualification: <strong>B2C Mode + Status Delivered</strong></div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </Card>

      {/* GENERATE MONTHLY BILLING MODAL */}
      <Modal isOpen={isBillingModalOpen} onClose={() => setIsBillingModalOpen(false)} title="Generate Monthly Logistics Tax Invoice" maxWidth="480px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Invoice Type</label>
            <Select
              value={billingInvoiceType}
              onChange={(e) => setBillingInvoiceType(e.target.value as any)}
              options={[
                { label: 'B2B Commercial Heavy Cargo Invoice', value: 'B2B' },
                { label: 'B2C Retail Express Parcel Invoice', value: 'B2C' },
              ]}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Billing Period Month</label>
            <Select
              value={billingMonthInput}
              onChange={(e) => setBillingMonthInput(e.target.value)}
              options={[
                { label: 'August 2026', value: 'August 2026' },
                { label: 'September 2026', value: 'September 2026' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Button variant="outline" onClick={() => setIsBillingModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleExecuteBillingRun} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
              Generate Invoice
            </Button>
          </div>
        </div>
      </Modal>

      {/* ISSUE CREDIT NOTE MODAL */}
      <Modal isOpen={isCreditNoteModalOpen} onClose={() => setIsCreditNoteModalOpen(false)} title="Issue Tax Credit Note" maxWidth="500px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Original Invoice Number</label>
            <Input value={cnInvoiceNoInput} onChange={(e) => setCnInvoiceNoInput(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Adjustment Category</label>
            <Select
              value={cnCategoryInput}
              onChange={(e) => setCnCategoryInput(e.target.value as any)}
              options={[
                { label: 'Weight Dispute Adjustment', value: 'Weight Dispute Adjustment' },
                { label: 'Manual Discount', value: 'Manual Discount' },
                { label: 'Refund', value: 'Refund' },
                { label: 'Courier Adjustment', value: 'Courier Adjustment' },
              ]}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Adjusted Taxable Refund (₹)</label>
            <Input type="number" value={cnTaxableInput} onChange={(e) => setCnTaxableInput(Number(e.target.value))} />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Reason / Remarks</label>
            <Textarea rows={2} value={cnReasonInput} onChange={(e) => setCnReasonInput(e.target.value)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Button variant="outline" onClick={() => setIsCreditNoteModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleExecuteCreditNote} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
              Issue Credit Note
            </Button>
          </div>
        </div>
      </Modal>

      {/* INSPECT INVOICE MODAL */}
      {selectedInvoice && (
        <Modal isOpen={isInspectModalOpen} onClose={() => setIsInspectModalOpen(false)} title={`Admin Supervise Invoice — ${selectedInvoice.invoiceNumber}`} maxWidth="750px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <strong>Buyer Account:</strong>
                <div>{selectedInvoice.customerSnapshot.customerLegalName}</div>
                <div>GSTIN: {selectedInvoice.customerSnapshot.customerGstin}</div>
              </div>
              <div>
                <strong>Tax Breakdown:</strong>
                <div>Taxable Value: {formatCurrency(selectedInvoice.taxableValueINR)}</div>
                <div>Total GST (18%): {formatCurrency(selectedInvoice.totalGstAmountINR)}</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0284c7' }}>Grand Total: {formatCurrency(selectedInvoice.grandTotalINR)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <Button variant="outline" onClick={() => setIsInspectModalOpen(false)}>Close</Button>
              <Button variant="primary" onClick={() => navigate(`/app/billing/invoices/${selectedInvoice.id}`)} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                Open Full Document View
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
