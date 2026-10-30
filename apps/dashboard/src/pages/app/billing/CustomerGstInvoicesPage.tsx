import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Eye,
  IndianRupee,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Building,
  Package,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatCard } from '../../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Input,
} from '../../../components/ui';
import {
  GstInvoiceService,
  DEMO_CREDIT_NOTES,
} from '../../../services/gstInvoiceService';
import type {
  MonthlyGstInvoiceRecord,
  AWBLedgerRecord,
  CreditDebitNoteRecord,
} from '../../../types/gstInvoice';
import { formatCurrency } from '../../../utils/formatters';

export const CustomerGstInvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const tenantId = 'tenant-demo-01';

  // Navigation Tabs: DASHBOARD | B2B_INVOICES | B2C_INVOICES | AWB_LEDGER | STATEMENTS | CREDIT_NOTES
  const [activeTab, setActiveTab] = useState<
    'DASHBOARD' | 'B2B_INVOICES' | 'B2C_INVOICES' | 'AWB_LEDGER' | 'STATEMENTS' | 'CREDIT_NOTES'
  >('DASHBOARD');

  // Data Stores
  const [invoices, setInvoices] = useState<MonthlyGstInvoiceRecord[]>(() =>
    GstInvoiceService.getInvoices(tenantId)
  );

  // AWB Ledger State & Filters
  const [modeFilter, setModeFilter] = useState('all');
  const [billingStatusFilter, setBillingStatusFilter] = useState('all');
  const [ledgerSearch, setLedgerSearch] = useState('');

  const [ledgerItems] = useState<AWBLedgerRecord[]>(() =>
    GstInvoiceService.getAwbLedger()
  );

  const [creditNotes] = useState<CreditDebitNoteRecord[]>(DEMO_CREDIT_NOTES);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Calculations for KPI Cards
  const b2bInvoices = invoices.filter((i) => i.invoiceType === 'B2B');
  const b2cInvoices = invoices.filter((i) => i.invoiceType === 'B2C');

  const b2bOutstanding = b2bInvoices.filter((i) => i.status !== 'PAID').reduce((s, i) => s + i.grandTotalINR, 0);
  const b2cOutstanding = b2cInvoices.filter((i) => i.status !== 'PAID').reduce((s, i) => s + i.grandTotalINR, 0);

  const currentMonthBilling = invoices.reduce((s, i) => s + i.grandTotalINR, 0);
  const totalGstPaid = invoices.reduce((s, i) => s + i.totalGstAmountINR, 0);

  const paidInvoicesCount = invoices.filter((i) => i.status === 'PAID').length;
  const pendingInvoicesCount = invoices.filter((i) => i.status !== 'PAID').length;

  // Filtered AWB Ledger
  const filteredLedger = ledgerItems.filter((item) => {
    if (modeFilter !== 'all' && item.mode !== modeFilter) return false;
    if (billingStatusFilter !== 'all' && item.billingStatus !== billingStatusFilter) return false;
    if (ledgerSearch.trim()) {
      const q = ledgerSearch.toLowerCase().trim();
      const matchAwb = item.awbNumber.toLowerCase().includes(q);
      const matchLrn = item.lrnNumber.toLowerCase().includes(q);
      const matchCourier = item.courierName.toLowerCase().includes(q);
      const matchInvoice = item.invoiceNumber?.toLowerCase().includes(q);
      if (!matchAwb && !matchLrn && !matchCourier && !matchInvoice) return false;
    }
    return true;
  });

  // Export GST Reconciliation CSV
  const handleExportGstCsv = () => {
    const csvContent = GstInvoiceService.exportGstrCsvData(invoices);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GST_Tax_Invoices_${tenantId}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export AWB Ledger CSV
  const handleExportLedgerCsv = () => {
    const csvContent = GstInvoiceService.exportAwbLedgerCsv(filteredLedger);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AWB_Shipment_Ledger_${tenantId}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger New Auto-Billing Invoice Generation
  const handleGenerateInvoice = (type: 'B2B' | 'B2C') => {
    const res = GstInvoiceService.generateMonthlyInvoices(type, 'August 2026', 'Merchant Self-Service');
    if (res.success && res.invoice) {
      setInvoices(GstInvoiceService.getInvoices(tenantId));
      setToastMsg(res.message);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Billing & Ledger Ecosystem', path: '/app/billing' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. Page Header */}
      <PageHeader
        title="Billing, Invoice & Ledger Center"
        description="Automated post-delivery billing, separate B2B vs B2C tax invoices, itemized AWB/LRN charge ledgers, Credit Notes, and GST ITC reconciliation."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={handleExportGstCsv}>
              Export GST Reconcile CSV
            </Button>
            <Button variant="primary" size="sm" onClick={() => handleGenerateInvoice('B2B')} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
              + Auto-Bill B2B Shipments
            </Button>
          </div>
        }
      />

      {toastMsg && (
        <Badge variant="success" style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '6px' }}>
          {toastMsg}
        </Badge>
      )}

      {/* 2. Top Navigation Tabs */}
      <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', overflowX: 'auto' }}>
          {[
            { id: 'DASHBOARD', label: 'Billing Dashboard' },
            { id: 'B2B_INVOICES', label: `B2B Invoices (${b2bInvoices.length})` },
            { id: 'B2C_INVOICES', label: `B2C Invoices (${b2cInvoices.length})` },
            { id: 'AWB_LEDGER', label: `AWB Ledger (${ledgerItems.length})` },
            { id: 'STATEMENTS', label: 'Statements & Downloads' },
            { id: 'CREDIT_NOTES', label: `Credit Notes (${creditNotes.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#0284c7' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#64748b',
                fontWeight: activeTab === tab.id ? '700' : '500',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: BILLING DASHBOARD */}
        {activeTab === 'DASHBOARD' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
            
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <StatCard label="B2B Outstanding" value={formatCurrency(b2bOutstanding)} subtext="Pending B2B bill settlements" icon={Building} />
              <StatCard label="B2C Outstanding" value={formatCurrency(b2cOutstanding)} subtext="Pending B2C bill settlements" icon={Package} />
              <StatCard label="Current Month Billing" value={formatCurrency(currentMonthBilling)} subtext="August 2026 total billed" icon={IndianRupee} />
              <StatCard label="Total GST Paid (ITC)" value={formatCurrency(totalGstPaid)} subtext="Eligible for Input Tax Credit" badgeText="GST 18%" badgeVariant="success" icon={ShieldCheck} />
              <StatCard label="Paid Invoices" value={paidInvoicesCount} subtext="Fully settled tax invoices" badgeText="SETTLED" badgeVariant="success" icon={CheckCircle2} />
              <StatCard label="Pending Invoices" value={pendingInvoicesCount} subtext="Awaiting wallet/credit debit" badgeText="PENDING" badgeVariant="warning" icon={Clock} />
            </div>

            {/* Billing Cycle Info Card */}
            <Card style={{ padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Automated Delivered Shipment Billing Cycle</h4>
                  <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0 0' }}>
                    Only <strong>Delivered</strong> shipments qualify for billing generation. Workflow: <code>Delivered</code> ➔ <code>Bill Pending</code> ➔ <code>Added To Invoice</code> ➔ <code>Invoice Generated</code> ➔ <code>Paid</code>.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="outline" size="sm" onClick={() => handleGenerateInvoice('B2C')}>
                    + Auto-Bill B2C
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleGenerateInvoice('B2B')} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                    + Auto-Bill B2B
                  </Button>
                </div>
              </div>
            </Card>

            {/* Recent Invoices Table */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>Recent Generated Invoices</h4>
              <Table<MonthlyGstInvoiceRecord>
                keyExtractor={(r) => r.id}
                columns={[
                  { key: 'invoiceNumber', header: 'Invoice Number', render: (r) => <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{r.invoiceNumber}</strong> },
                  { key: 'invoiceType', header: 'Type', render: (r) => <Badge variant={r.invoiceType === 'B2B' ? 'brand' : 'info'}>{r.invoiceType}</Badge> },
                  { key: 'issueDate', header: 'Issue Date', render: (r) => r.issueDate },
                  { key: 'shipmentCount', header: 'Parcels', render: (r) => <span>{r.shipmentCount} Delivered</span> },
                  { key: 'taxableValueINR', header: 'Taxable Amount', render: (r) => formatCurrency(r.taxableValueINR) },
                  { key: 'totalGstAmountINR', header: 'GST (18%)', render: (r) => formatCurrency(r.totalGstAmountINR) },
                  { key: 'grandTotalINR', header: 'Grand Total', render: (r) => <strong>{formatCurrency(r.grandTotalINR)}</strong> },
                  { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'PAID' ? 'success' : 'info'}>{r.status}</Badge> },
                  {
                    key: 'actions',
                    header: 'Action',
                    render: (r) => (
                      <Button variant="outline" size="sm" leftIcon={<Eye size={13} />} onClick={() => navigate(`/app/billing/invoices/${r.id}`)}>
                        View Details
                      </Button>
                    ),
                  },
                ]}
                data={invoices}
              />
            </div>

          </div>
        )}

        {/* TAB 2: B2B INVOICES */}
        {activeTab === 'B2B_INVOICES' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>B2B Freight & Cargo Invoices (Commercial Shipments Only)</h4>
              <Button variant="primary" size="sm" onClick={() => handleGenerateInvoice('B2B')} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                + Generate B2B Invoice
              </Button>
            </div>

            <Table<MonthlyGstInvoiceRecord>
              keyExtractor={(r) => r.id}
              columns={[
                { key: 'invoiceNumber', header: 'Invoice Number', render: (r) => <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{r.invoiceNumber}</strong> },
                { key: 'billingPeriodMonth', header: 'Billing Period', render: (r) => r.billingPeriodMonth },
                { key: 'issueDate', header: 'Issue Date', render: (r) => r.issueDate },
                { key: 'shipmentCount', header: 'Shipments', render: (r) => <span>{r.shipmentCount} Cargo Boxes</span> },
                { key: 'taxableValueINR', header: 'Taxable Freight', render: (r) => formatCurrency(r.taxableValueINR) },
                { key: 'totalGstAmountINR', header: 'IGST/GST 18%', render: (r) => formatCurrency(r.totalGstAmountINR) },
                { key: 'grandTotalINR', header: 'Grand Total', render: (r) => <strong>{formatCurrency(r.grandTotalINR)}</strong> },
                { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'PAID' ? 'success' : 'info'}>{r.status}</Badge> },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (r) => (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button variant="primary" size="sm" leftIcon={<Eye size={13} />} onClick={() => navigate(`/app/billing/invoices/${r.id}`)} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => window.print()}>
                        PDF
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={b2bInvoices}
              emptyText="No B2B invoices generated yet."
            />
          </div>
        )}

        {/* TAB 3: B2C INVOICES */}
        {activeTab === 'B2C_INVOICES' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>B2C Retail Parcel Invoices (E-Commerce Express Only)</h4>
              <Button variant="primary" size="sm" onClick={() => handleGenerateInvoice('B2C')} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                + Generate B2C Invoice
              </Button>
            </div>

            <Table<MonthlyGstInvoiceRecord>
              keyExtractor={(r) => r.id}
              columns={[
                { key: 'invoiceNumber', header: 'Invoice Number', render: (r) => <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{r.invoiceNumber}</strong> },
                { key: 'billingPeriodMonth', header: 'Billing Period', render: (r) => r.billingPeriodMonth },
                { key: 'issueDate', header: 'Issue Date', render: (r) => r.issueDate },
                { key: 'shipmentCount', header: 'Parcels', render: (r) => <span>{r.shipmentCount} Parcels</span> },
                { key: 'taxableValueINR', header: 'Taxable Freight', render: (r) => formatCurrency(r.taxableValueINR) },
                { key: 'totalGstAmountINR', header: 'IGST/GST 18%', render: (r) => formatCurrency(r.totalGstAmountINR) },
                { key: 'grandTotalINR', header: 'Grand Total', render: (r) => <strong>{formatCurrency(r.grandTotalINR)}</strong> },
                { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'PAID' ? 'success' : 'info'}>{r.status}</Badge> },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (r) => (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button variant="primary" size="sm" leftIcon={<Eye size={13} />} onClick={() => navigate(`/app/billing/invoices/${r.id}`)} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => window.print()}>
                        PDF
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={b2cInvoices}
              emptyText="No B2C invoices generated yet."
            />
          </div>
        )}

        {/* TAB 4: AWB LEDGER (RUNNING SHIPMENT CHARGE REGISTER) */}
        {activeTab === 'AWB_LEDGER' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Running AWB / LRN Shipment Ledger</h4>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Itemized freight, fuel, docket, COD, FM, ROV, ODA & GST per shipment</span>
              </div>
              <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={handleExportLedgerCsv}>
                Export AWB Ledger (CSV)
              </Button>
            </div>

            {/* Ledger Filter Controls */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <Input
                  placeholder="Search AWB, LRN, Courier, Invoice Ref..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                />
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <Filter size={13} style={{ color: '#64748b' }} />
                <span style={{ color: '#64748b', fontWeight: '600' }}>Mode:</span>
                {['all', 'B2B', 'B2C'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setModeFilter(m)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid ' + (modeFilter === m ? '#0284c7' : '#cbd5e1'),
                      backgroundColor: modeFilter === m ? '#f0f9ff' : '#ffffff',
                      color: modeFilter === m ? '#0284c7' : '#475569',
                      fontSize: '11px',
                      fontWeight: modeFilter === m ? '700' : '400',
                      cursor: 'pointer',
                    }}
                  >
                    {m === 'all' ? 'All' : m}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Billing Status:</span>
                {['all', 'Delivered', 'Bill Pending', 'Invoice Generated', 'Paid'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setBillingStatusFilter(st)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid ' + (billingStatusFilter === st ? '#0284c7' : '#cbd5e1'),
                      backgroundColor: billingStatusFilter === st ? '#f0f9ff' : '#ffffff',
                      color: billingStatusFilter === st ? '#0284c7' : '#475569',
                      fontSize: '11px',
                      fontWeight: billingStatusFilter === st ? '700' : '400',
                      cursor: 'pointer',
                    }}
                  >
                    {st === 'all' ? 'All' : st}
                  </button>
                ))}
              </div>
            </div>

            <Table<AWBLedgerRecord>
              keyExtractor={(r) => r.id}
              columns={[
                { key: 'awbNumber', header: 'AWB & LRN', render: (r) => <div><strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{r.awbNumber}</strong><div style={{ fontSize: '10px', color: '#64748b' }}>{r.lrnNumber}</div></div> },
                { key: 'bookingDate', header: 'Booking Date', render: (r) => r.bookingDate },
                { key: 'courierName', header: 'Courier & Mode', render: (r) => <div><strong>{r.courierName}</strong><div style={{ fontSize: '10px', color: '#64748b' }}>{r.mode} ({r.originCity} → {r.destinationCity})</div></div> },
                { key: 'chargeableWeightKg', header: 'Wt (KG)', render: (r) => <span>{r.chargeableWeightKg} KG</span> },
                { key: 'baseFreight', header: 'Freight', render: (r) => <span>₹{r.baseFreight.toFixed(2)}</span> },
                { key: 'fuelSurcharge', header: 'Fuel', render: (r) => <span>₹{r.fuelSurcharge.toFixed(2)}</span> },
                { key: 'docketCharges', header: 'Docket', render: (r) => <span>₹{r.docketCharges.toFixed(2)}</span> },
                { key: 'gstAmount', header: 'GST 18%', render: (r) => <span>₹{r.gstAmount.toFixed(2)}</span> },
                { key: 'totalAmount', header: 'Total (₹)', render: (r) => <strong>₹{r.totalAmount.toFixed(2)}</strong> },
                { key: 'billingStatus', header: 'Billing Status', render: (r) => <Badge variant={r.billingStatus === 'Paid' ? 'success' : r.billingStatus === 'Invoice Generated' ? 'info' : 'warning'}>{r.billingStatus}</Badge> },
                { key: 'invoiceNumber', header: 'Invoice Ref', render: (r) => r.invoiceNumber ? <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#0284c7' }}>{r.invoiceNumber}</span> : <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Unbilled</span> },
              ]}
              data={filteredLedger}
            />
          </div>
        )}

        {/* TAB 5: STATEMENTS CENTER */}
        {activeTab === 'STATEMENTS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Statement Downloads & GST ITC Reports</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
                <strong style={{ fontSize: '14px', color: '#0284c7', display: 'block', marginBottom: '4px' }}>Monthly Freight Statement</strong>
                <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 12px 0' }}>Comprehensive monthly summary of all shipped & billed parcels.</p>
                <Button variant="primary" size="sm" leftIcon={<Download size={13} />} onClick={handleExportGstCsv} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                  Download Monthly Statement
                </Button>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
                <strong style={{ fontSize: '14px', color: '#0284c7', display: 'block', marginBottom: '4px' }}>Running AWB Ledger Report</strong>
                <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 12px 0' }}>Itemized AWB/LRN charge breakdown with freight, fuel, docket & GST.</p>
                <Button variant="outline" size="sm" leftIcon={<Download size={13} />} onClick={handleExportLedgerCsv}>
                  Download AWB Ledger CSV
                </Button>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
                <strong style={{ fontSize: '14px', color: '#0284c7', display: 'block', marginBottom: '4px' }}>GST ITC Reconciliation Statement</strong>
                <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 12px 0' }}>Formatted GSTR-2B compatible tax register for claiming Input Tax Credit.</p>
                <Button variant="outline" size="sm" leftIcon={<Download size={13} />} onClick={handleExportGstCsv}>
                  Download GST ITC Report
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CREDIT NOTES */}
        {activeTab === 'CREDIT_NOTES' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Credit Notes & Adjustment Register</h4>
              <Badge variant="brand">ITC Compliant</Badge>
            </div>

            <Table<CreditDebitNoteRecord>
              keyExtractor={(r) => r.id}
              columns={[
                { key: 'noteNumber', header: 'Note Number', render: (r) => <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{r.noteNumber}</strong> },
                { key: 'originalInvoiceNumber', header: 'Original Invoice', render: (r) => <span style={{ fontFamily: 'monospace' }}>{r.originalInvoiceNumber}</span> },
                { key: 'adjustmentCategory', header: 'Category', render: (r) => <Badge variant="warning">{r.adjustmentCategory}</Badge> },
                { key: 'issueDate', header: 'Issue Date', render: (r) => r.issueDate },
                { key: 'reason', header: 'Adjustment Reason', render: (r) => <span style={{ fontSize: '12px' }}>{r.reason}</span> },
                { key: 'adjustedTaxableINR', header: 'Taxable (₹)', render: (r) => formatCurrency(r.adjustedTaxableINR) },
                { key: 'adjustedGstINR', header: 'GST (18%)', render: (r) => formatCurrency(r.adjustedGstINR) },
                { key: 'adjustedTotalINR', header: 'Credit Amount', render: (r) => <strong style={{ color: '#16a34a' }}>{formatCurrency(r.adjustedTotalINR)}</strong> },
                { key: 'status', header: 'Status', render: (r) => <Badge variant="success">{r.status}</Badge> },
              ]}
              data={creditNotes}
              emptyText="No credit notes issued yet."
            />
          </div>
        )}

      </Card>
    </div>
  );
};
