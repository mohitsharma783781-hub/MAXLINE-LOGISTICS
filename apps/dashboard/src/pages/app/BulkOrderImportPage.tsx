import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  RotateCcw,
  Printer,
  Package,
  ArrowRight,
  XCircle,
  FileCheck,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Alert,
} from '../../components/ui';
import {
  BulkOrderService,
  B2C_BULK_CSV_TEMPLATE,
  B2B_BULK_CSV_TEMPLATE,
  type BulkOrderImportRow,
  type BulkImportSummary,
  type BulkUploadRecord,
} from '../../services/bulkOrderService';
import { WalletService } from '../../mocks/wallet.mock';
import { formatCurrency } from '../../utils/formatters';

export const BulkOrderImportPage: React.FC = () => {
  const navigate = useNavigate();
  const tenantId = 'tenant-demo-01';

  // Submenu Tabs: UPLOAD | HISTORY | LABELS | MANIFESTS | FAILED
  const [activeSubmenu, setActiveSubmenu] = useState<'UPLOAD' | 'HISTORY' | 'LABELS' | 'MANIFESTS' | 'FAILED'>('UPLOAD');

  // Wizard Step: 1 = File Upload, 2 = Pre-Upload Validation Result, 3 = Live Progress, 4 = Final Summary
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // File & Upload Data State
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<BulkOrderImportRow[]>([]);
  const [validationSummary, setValidationSummary] = useState<BulkImportSummary | null>(null);

  // Progress & Booking Result State
  const [bookingProgress, setBookingProgress] = useState<number>(0);
  const [bookingResult, setBookingResult] = useState<{ successful: number; failed: number } | null>(null);
  const [warningBanner, setWarningBanner] = useState<string | null>(null);

  // Wallet Balance
  const walletBalanceINR = WalletService.getWallet(tenantId).availableBalanceMinor / 100;
  const metrics = useMemo(() => BulkOrderService.getBulkMetrics(tenantId), [wizardStep]);

  // Upload History List
  const uploadHistory = useMemo(() => BulkOrderService.getUploadHistory(tenantId), [wizardStep]);

  // Download B2C Template CSV
  const handleDownloadB2cTemplate = () => {
    const blob = new Blob([B2C_BULK_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'B2C_Bulk_Shipment_Import_Template.csv';
    link.click();
  };

  // Download B2B Template CSV
  const handleDownloadB2bTemplate = () => {
    const blob = new Blob([B2B_BULK_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'B2B_Bulk_Cargo_Import_Template.csv';
    link.click();
  };

  // Handle File Drag & Upload
  const processUploadedFile = (file: File) => {
    setUploadedFileName(file.name);
    setUploadedFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const res = BulkOrderService.parseAndValidateCsv(text, tenantId);
      setParsedRows(res.rows);
      setValidationSummary(res.summary);
      setWizardStep(2);
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
  };

  // Download Error Report CSV
  const handleDownloadErrorReport = () => {
    if (parsedRows.length === 0) return;
    const errorCsv = BulkOrderService.generateErrorReportCsv(parsedRows);
    const blob = new Blob([errorCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Bulk_Import_Error_Report_${validationSummary?.bulkUploadId || 'Batch'}.csv`;
    link.click();
  };

  // Execute Live Progress Bulk Booking
  const handleConfirmBulkBooking = async () => {
    if (!validationSummary || parsedRows.length === 0) return;
    setWarningBanner(null);

    if (walletBalanceINR < validationSummary.estimatedTotalPayableINR) {
      setWarningBanner(
        `Insufficient Wallet Balance. Required ${formatCurrency(validationSummary.estimatedTotalPayableINR)}, Available ${formatCurrency(walletBalanceINR)}. Please recharge wallet to proceed.`
      );
      return;
    }

    setWizardStep(3);
    setBookingProgress(25);

    setTimeout(() => {
      setBookingProgress(50);
    }, 500);

    setTimeout(() => {
      setBookingProgress(75);
    }, 1000);

    setTimeout(async () => {
      const res = await BulkOrderService.executeBulkBooking(parsedRows, validationSummary, tenantId);
      setBookingProgress(100);
      setBookingResult({ successful: res.successfulShipments, failed: res.failedShipments });
      setWizardStep(4);
    }, 1500);
  };

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Bulk Operations Center', path: '/app/orders/bulk-upload' },
    { label: 'Bulk Order Upload & Dispatch Wizard', path: '/app/orders/bulk-upload' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. Page Header */}
      <PageHeader
        title="Bulk Operations & Dispatch Operations Center"
        description="Batch upload dispatches via CSV/XLSX, execute pre-upload data validation, book bulk shipments, print thermal 4x6 labels, and generate courier manifests."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={handleDownloadB2cTemplate} leftIcon={<Download size={14} />}>
              Download B2C CSV Template
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadB2bTemplate} leftIcon={<Download size={14} />}>
              Download B2B CSV Template
            </Button>
          </div>
        }
      />

      {warningBanner && (
        <Alert variant="danger" title="Wallet Balance Notice">
          {warningBanner}
        </Alert>
      )}

      {/* 2. Top Reporting Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <StatCard label="Orders Uploaded" value={metrics.ordersUploaded} subtext="Total batch dispatches" icon={FileSpreadsheet} />
        <StatCard label="Orders Created" value={metrics.ordersCreated} subtext="Successful bookings" badgeText="SUCCESS" badgeVariant="success" icon={CheckCircle2} />
        <StatCard label="Orders Failed" value={metrics.ordersFailed} subtext="Validation / booking errors" badgeText={metrics.ordersFailed > 0 ? 'ERRORS' : 'CLEAR'} badgeVariant={metrics.ordersFailed > 0 ? 'warning' : 'success'} icon={XCircle} />
        <StatCard label="Labels Generated" value={metrics.labelsGenerated} subtext="Thermal 4x6 ready" icon={Printer} />
        <StatCard label="Manifests Generated" value={metrics.manifestsGenerated} subtext="Courier handover records" icon={FileCheck} />
      </div>

      {/* 3. Submenu Navigation & Step Banner */}
      <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        
        {/* SUBMENU NAVIGATION TABS */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px', overflowX: 'auto' }}>
          {[
            { id: 'UPLOAD', label: 'Bulk Order Upload' },
            { id: 'HISTORY', label: `Upload History (${uploadHistory.length})` },
            { id: 'LABELS', label: 'Bulk Labels Center', action: () => navigate('/app/labels') },
            { id: 'MANIFESTS', label: 'Manifest Center', action: () => navigate('/app/manifests') },
            { id: 'FAILED', label: `Failed Uploads (${uploadHistory.filter((h) => h.invalidRows > 0 || h.failedShipments > 0).length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.action) tab.action();
                else setActiveSubmenu(tab.id as any);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeSubmenu === tab.id ? '#0284c7' : 'transparent',
                color: activeSubmenu === tab.id ? '#ffffff' : '#64748b',
                fontWeight: activeSubmenu === tab.id ? '700' : '500',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* WIZARD STEP INDICATORS (IF IN UPLOAD TAB) */}
        {activeSubmenu === 'UPLOAD' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            {[
              { step: 1, label: '1. Select File & Drag Upload' },
              { step: 2, label: '2. Pre-Upload Validation' },
              { step: 3, label: '3. Bulk Booking Progress' },
              { step: 4, label: '4. Summary & Labels' },
            ].map((item) => {
              const isActive = wizardStep === item.step;
              const isDone = wizardStep > item.step;
              return (
                <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: isActive ? '#0284c7' : isDone ? '#16a34a' : '#94a3b8', fontWeight: isActive || isDone ? '700' : '500' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: isActive ? '#0284c7' : isDone ? '#16a34a' : '#e2e8f0', color: isActive || isDone ? '#ffffff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                    {isDone ? '✓' : item.step}
                  </div>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBMENU: UPLOAD TAB */}
        {/* ========================================================================= */}
        {activeSubmenu === 'UPLOAD' && (
          <>
            {/* STEP 1: DRAG & DROP UPLOAD CENTER */}
            {wizardStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 0' }}>
                
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) processUploadedFile(file);
                  }}
                  style={{
                    border: '2px dashed #0284c7',
                    borderRadius: '12px',
                    padding: '40px',
                    backgroundColor: '#f0f9ff',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Upload size={48} style={{ color: '#0284c7', margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px', color: '#0f172a' }}>
                    Drag & Drop CSV / XLSX Batch Shipment File
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 auto 20px', maxWidth: '540px' }}>
                    Supports batch dispatches up to <strong>500 shipments per file</strong>. Multi-package dispatches will automatically be validated and grouped.
                  </p>

                  <label htmlFor="bulk-file-input">
                    <input
                      id="bulk-file-input"
                      type="file"
                      accept=".csv,.xlsx,.txt"
                      onChange={handleFileInputChange}
                      style={{ display: 'none' }}
                    />
                    <Button variant="primary" size="lg" leftIcon={<FileSpreadsheet size={18} />} onClick={() => document.getElementById('bulk-file-input')?.click()} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                      Browse & Upload File
                    </Button>
                  </label>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '24px', fontSize: '12px', color: '#475569' }}>
                    <span>✓ Supported Formats: CSV, XLSX</span>
                    <span>✓ Pre-Upload Validation Rules</span>
                    <span>✓ Indian Pincode & Mobile Verification</span>
                  </div>
                </div>

                {/* Templates Box */}
                <Card style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                    Download Official Bulk Upload Templates
                  </h4>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Button variant="outline" size="sm" onClick={handleDownloadB2cTemplate} leftIcon={<Download size={14} />}>
                      Download B2C Order Template (CSV)
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadB2bTemplate} leftIcon={<Download size={14} />}>
                      Download B2B Cargo Template (CSV)
                    </Button>
                  </div>
                </Card>

              </div>
            )}

            {/* STEP 2: PRE-UPLOAD VALIDATION RESULT SCREEN */}
            {wizardStep === 2 && validationSummary && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* File Upload Metadata Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>UPLOADED FILE</span>
                    <strong style={{ display: 'block', fontSize: '14px', color: '#0284c7' }}>{uploadedFileName || validationSummary.bulkUploadId} ({uploadedFileSize})</strong>
                  </div>
                  <Badge variant="brand">{validationSummary.bulkUploadId}</Badge>
                </div>

                {/* Validation Summary KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                  <div style={{ padding: '14px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>TOTAL ROWS</span>
                    <strong style={{ display: 'block', fontSize: '20px', color: '#0f172a' }}>{validationSummary.totalRows} Rows</strong>
                  </div>

                  <div style={{ padding: '14px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #16a34a' }}>
                    <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '800', textTransform: 'uppercase' }}>SUCCESS / VALID ROWS</span>
                    <strong style={{ display: 'block', fontSize: '20px', color: '#16a34a' }}>{validationSummary.validRowsCount} Rows</strong>
                  </div>

                  <div style={{ padding: '14px', backgroundColor: validationSummary.invalidRowsCount > 0 ? '#fff1f2' : '#ffffff', borderRadius: '8px', border: validationSummary.invalidRowsCount > 0 ? '1px solid #ef4444' : '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '10px', color: validationSummary.invalidRowsCount > 0 ? '#be123c' : '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>FAILED ROWS</span>
                    <strong style={{ display: 'block', fontSize: '20px', color: validationSummary.invalidRowsCount > 0 ? '#ef4444' : '#0f172a' }}>{validationSummary.invalidRowsCount} Rows</strong>
                  </div>

                  <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>REQUIRED WALLET DEBIT</span>
                    <strong style={{ display: 'block', fontSize: '18px', color: '#0284c7' }}>{formatCurrency(validationSummary.estimatedTotalPayableINR)}</strong>
                  </div>
                </div>

                {/* Error Report Download Alert */}
                {validationSummary.invalidRowsCount > 0 && (
                  <Alert variant="warning" title="Pre-Upload Validation Warnings Found">
                    {validationSummary.invalidRowsCount} row(s) failed pre-upload validation (invalid mobile number, pincode, or missing address). Only valid rows will proceed to booking.
                    <Button size="sm" variant="outline" onClick={handleDownloadErrorReport} leftIcon={<Download size={13} />} style={{ marginLeft: '12px' }}>
                      Download Error Report CSV
                    </Button>
                  </Alert>
                )}

                {/* Confirmation Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '700' }}>
                    ✓ Wallet balance ({formatCurrency(walletBalanceINR)}) is available for bulk booking.
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button variant="outline" onClick={() => setWizardStep(1)} leftIcon={<RotateCcw size={14} />}>
                      Re-upload File
                    </Button>
                    <Button variant="primary" onClick={handleConfirmBulkBooking} rightIcon={<ArrowRight size={16} />} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                      Confirm & Create {validationSummary.validRowsCount} Shipments ({formatCurrency(validationSummary.estimatedTotalPayableINR)})
                    </Button>
                  </div>
                </div>

                {/* Row-wise Error Table */}
                <Card style={{ padding: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px' }}>Row-wise Pre-Upload Validation Inspection</h4>
                  <Table<BulkOrderImportRow>
                    keyExtractor={(r) => r.rowId.toString()}
                    columns={[
                      { key: 'rowId', header: 'Row #', render: (r) => <span>{r.rowId}</span> },
                      { key: 'orderId', header: 'Order ID', render: (r) => <strong style={{ color: '#0284c7' }}>{r.orderId}</strong> },
                      { key: 'customerName', header: 'Customer', render: (r) => <span>{r.customerName}</span> },
                      { key: 'mobile', header: 'Mobile', render: (r) => <span>{r.mobile}</span> },
                      { key: 'pincode', header: 'Pincode', render: (r) => <span>{r.pincode}</span> },
                      { key: 'weight', header: 'Weight', render: (r) => <span>{r.weight} KG</span> },
                      { key: 'paymentMode', header: 'Payment', render: (r) => <Badge variant={r.paymentMode === 'COD' ? 'warning' : 'info'}>{r.paymentMode}</Badge> },
                      {
                        key: 'isValid',
                        header: 'Validation Result',
                        render: (r) => (
                          <Badge variant={r.isValid ? 'success' : 'danger'}>
                            {r.isValid ? 'VALID' : r.validationError || 'FAILED'}
                          </Badge>
                        ),
                      },
                    ]}
                    data={parsedRows}
                  />
                </Card>
              </div>
            )}

            {/* STEP 3: LIVE PROGRESS BULK SHIPMENT CREATION */}
            {wizardStep === 3 && (
              <Card style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ maxWidth: '540px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>Executing Bulk Shipment Creation & Debiting Wallet...</h3>
                  
                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '14px', backgroundColor: '#e2e8f0', borderRadius: '7px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${bookingProgress}%`,
                        height: '100%',
                        backgroundColor: '#0284c7',
                        transition: 'width 0.4s ease-in-out',
                      }}
                    />
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0284c7' }}>
                    Processing Batch ({bookingProgress}% Completed)...
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Assigning AWB tracking numbers, generating thermal labels, and deducting shipping charges from wallet ledger.
                  </span>
                </div>
              </Card>
            )}

            {/* STEP 4: FINAL SUMMARY & ACTION BUTTONS */}
            {wizardStep === 4 && bookingResult && (
              <Card style={{ padding: '32px', textAlign: 'center', borderTop: '4px solid #16a34a' }}>
                <CheckCircle2 size={54} style={{ color: '#16a34a', margin: '0 auto 12px' }} />
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 8px', color: '#0f172a' }}>
                  Bulk Shipment Booking Successfully Completed!
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px' }}>
                  Batch dispatches processed cleanly under Batch Reference <strong>{validationSummary?.bulkUploadId}</strong>.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '28px' }}>
                  <div style={{ padding: '16px 28px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #16a34a' }}>
                    <strong style={{ fontSize: '24px', color: '#16a34a' }}>{bookingResult.successful}</strong>
                    <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '700' }}>Shipments Created</div>
                  </div>

                  <div style={{ padding: '16px 28px', backgroundColor: bookingResult.failed > 0 ? '#fff1f2' : '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ fontSize: '24px', color: bookingResult.failed > 0 ? '#ef4444' : '#0f172a' }}>{bookingResult.failed}</strong>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Failed Bookings</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <Button variant="outline" onClick={() => navigate('/app/shipments')} leftIcon={<Package size={16} />}>
                    View Created Shipments
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/app/manifests')} leftIcon={<FileCheck size={16} />}>
                    Generate Manifest
                  </Button>
                  <Button variant="primary" onClick={() => navigate('/app/labels')} leftIcon={<Printer size={16} />} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                    Print Thermal 4x6 Labels
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* SUBMENU: UPLOAD HISTORY TAB */}
        {/* ========================================================================= */}
        {(activeSubmenu === 'HISTORY' || activeSubmenu === 'FAILED') && (
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px' }}>
              {activeSubmenu === 'FAILED' ? 'Failed / Exception Batch Upload History' : 'Bulk Upload Audit History'}
            </h3>
            <Table<BulkUploadRecord>
              keyExtractor={(r) => r.id}
              columns={[
                {
                  key: 'bulkUploadId',
                  header: 'Bulk Upload ID',
                  render: (r) => <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{r.bulkUploadId}</strong>,
                },
                { key: 'fileName', header: 'File Name', render: (r) => <span>{r.fileName}</span> },
                { key: 'uploadDate', header: 'Date/Time', render: (r) => <span style={{ fontSize: '11px' }}>{r.uploadDate}</span> },
                { key: 'totalRows', header: 'Processed Rows', render: (r) => <span>{r.totalRows}</span> },
                { key: 'successfulShipments', header: 'Created Orders', render: (r) => <strong style={{ color: '#16a34a' }}>{r.successfulShipments}</strong> },
                { key: 'invalidRows', header: 'Failed Orders', render: (r) => <span style={{ color: r.invalidRows > 0 ? '#ef4444' : '#64748b' }}>{r.invalidRows}</span> },
                { key: 'createdBy', header: 'Created By', render: (r) => <span style={{ fontSize: '12px' }}>{r.createdBy}</span> },
                {
                  key: 'status',
                  header: 'Upload Status',
                  render: (r) => <Badge variant={r.status === 'COMPLETED' ? 'success' : 'warning'}>{r.status}</Badge>,
                },
              ]}
              data={activeSubmenu === 'FAILED' ? uploadHistory.filter((h) => h.invalidRows > 0 || h.failedShipments > 0) : uploadHistory}
            />
          </div>
        )}

      </Card>

    </div>
  );
};
