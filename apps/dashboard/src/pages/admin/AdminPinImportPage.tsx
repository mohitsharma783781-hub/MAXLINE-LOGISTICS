import React, { useState } from 'react';
import {
  Upload,
  CheckCircle2,
  Download,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Table,
  Select,
  Alert,
} from '../../components/ui';
import { DEMO_COURIER_PROVIDERS } from '../../mocks/couriers.mock';
import { CourierServiceabilityService, type ServiceabilityImportRecord } from '../../services/courierServiceabilityService';

export const AdminPinImportPage: React.FC = () => {
  const [importLogs, setImportLogs] = useState<ServiceabilityImportRecord[]>(() => CourierServiceabilityService.getImportVersions());
  const [selectedCourier, setSelectedCourier] = useState('delhivery');
  const [selectedService, setSelectedService] = useState('express-surface');
  const [selectedMode, setSelectedMode] = useState<'B2C' | 'B2B'>('B2C');

  const [isUploading, setIsUploading] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    importRecord: ServiceabilityImportRecord;
    errors: { row: number; pincode: string; error: string }[];
  } | null>(null);

  const refreshLogs = () => {
    setImportLogs(CourierServiceabilityService.getImportVersions());
  };

  // Demo File Upload & Validation Pipeline
  const handleSimulateFileUpload = () => {
    setIsUploading(true);

    setTimeout(() => {
      const mockRawRows = [
        { pincode: '110001', city: 'New Delhi', state: 'Delhi', zone: 'N1', mode: 'B2C' },
        { pincode: '560038', city: 'Bengaluru', state: 'Karnataka', zone: 'S1', mode: 'B2C' },
        { pincode: '400001', city: 'Mumbai', state: 'Maharashtra', zone: 'W1', mode: 'B2C' },
        { pincode: '799001', city: 'Agartala', state: 'Tripura', zone: 'NE1', mode: 'B2C' },
        { pincode: '110001', city: 'New Delhi', state: 'Delhi', zone: 'N1', mode: 'B2C' }, // Duplicate row
        { pincode: '99999', city: 'Invalid', state: 'Invalid', zone: 'XX', mode: 'B2C' }, // Invalid format
      ];

      const res = CourierServiceabilityService.validateAndImportFile(
        selectedCourier,
        selectedService,
        selectedMode,
        `Serviceability_${selectedCourier}_${selectedMode}_Aug2026.csv`,
        mockRawRows
      );

      setValidationResult({
        importRecord: res.importRecord,
        errors: res.errors,
      });

      refreshLogs();
      setIsUploading(false);
    }, 600);
  };

  const handlePublishDataset = (importId: string) => {
    const res = CourierServiceabilityService.publishImportDataset(importId);
    refreshLogs();
    alert(res.message);
  };

  const handleRollbackDataset = (importId: string) => {
    const res = CourierServiceabilityService.rollbackImportDataset(importId);
    refreshLogs();
    alert(res.message);
  };

  const handleDownloadErrorReport = () => {
    if (!validationResult || validationResult.errors.length === 0) return;

    const headers = ['Row Number', 'Pincode', 'Validation Error'];
    const rows = validationResult.errors.map((e) => [e.row, e.pincode, `"${e.error}"`]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `serviceability_error_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Zones & Coverage', path: '/admin/zones' },
    { label: 'Bulk PIN Import', path: '/admin/pin-import' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Bulk Pincode & ODA Serviceability Import Engine"
        description="Upload CSV/XLSX courier serviceability files with column mapping, validation check, duplicate detection, versioning, publish & rollback."
        breadcrumbs={breadcrumbs}
      />

      {/* 2. File Upload & Mapping Form */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
          1. Select Courier Partner & Dataset Target
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
          <Select
            label="Courier Partner *"
            value={selectedCourier}
            onChange={(e) => setSelectedCourier(e.target.value)}
            options={DEMO_COURIER_PROVIDERS.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Select
            label="Courier Service *"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            options={[
              { value: 'express-surface', label: 'Express Surface Cargo' },
              { value: 'express-air', label: 'Express Priority Air' },
            ]}
          />
          <Select
            label="Commercial Mode *"
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value as any)}
            options={[
              { value: 'B2C', label: 'B2C Consumer' },
              { value: 'B2B', label: 'B2B Commercial Cargo' },
            ]}
          />
        </div>

        <div
          style={{
            border: '2px dashed var(--color-border)',
            borderRadius: 'var(--radius-default)',
            padding: 'var(--space-8)',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface-secondary)',
          }}
        >
          <Upload size={36} style={{ color: 'var(--color-violet-main)', marginBottom: 'var(--space-3)' }} />
          <h4 style={{ fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>
            Drag and drop your courier serviceability / ODA file (.csv, .xlsx)
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 'var(--space-4)' }}>
            Supported fields: Pincode, City, State, Serviceable, COD Available, ODA Status, Zone Code
          </span>

          <Button variant="primary" onClick={handleSimulateFileUpload} disabled={isUploading}>
            {isUploading ? 'Validating File...' : 'Select File & Validate Dataset'}
          </Button>
        </div>
      </Card>

      {/* 3. Validation & Error Report Result */}
      {validationResult && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold' }}>
                2. Validation Result & Upsert Preview ({validationResult.importRecord.recordCount} Rows Analyzed)
              </h4>
              <div style={{ fontSize: '12px', marginTop: '2px' }}>
                New Records: <strong style={{ color: 'var(--color-success)' }}>{validationResult.importRecord.newCount}</strong> • Updated Records: <strong style={{ color: 'var(--color-violet-main)' }}>{validationResult.importRecord.updatedCount}</strong> • Invalid Errors: <strong style={{ color: 'var(--color-danger)' }}>{validationResult.errors.length}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {validationResult.errors.length > 0 && (
                <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={handleDownloadErrorReport}>
                  Download Error Report
                </Button>
              )}
              <Button variant="primary" size="sm" leftIcon={<CheckCircle2 size={16} />} onClick={() => handlePublishDataset(validationResult.importRecord.id)}>
                Publish Dataset →
              </Button>
            </div>
          </div>

          {validationResult.errors.length > 0 && (
            <Alert variant="danger" title={`Row-Level Errors Detected (${validationResult.errors.length} Rows)`}>
              <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {validationResult.errors.map((err, idx) => (
                  <div key={idx}>
                    Row #{err.row} (Pincode: <strong>{err.pincode}</strong>) — {err.error}
                  </div>
                ))}
              </div>
            </Alert>
          )}
        </Card>
      )}

      {/* 4. Import Version History & Rollback Controls */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
          Import Version History & Rollback Ledger
        </h4>

        <Table<ServiceabilityImportRecord>
          keyExtractor={(log) => log.id}
          columns={[
            {
              key: 'id',
              header: 'Import ID & File',
              render: (row) => (
                <div>
                  <strong style={{ color: 'var(--color-violet-main)' }}>{row.id}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{row.fileName}</div>
                </div>
              ),
            },
            { key: 'courierId', header: 'Courier', render: (row) => <strong>{row.courierId}</strong> },
            { key: 'mode', header: 'Mode', render: (row) => <Badge variant={row.mode === 'B2B' ? 'warning' : 'neutral'}>{row.mode}</Badge> },
            { key: 'recordCount', header: 'Records', render: (row) => <span>{row.recordCount} Rows ({row.newCount} New / {row.updatedCount} Updated)</span> },
            { key: 'status', header: 'Version Status', render: (row) => <Badge variant={row.status === 'PUBLISHED' ? 'success' : row.status === 'ROLLED_BACK' ? 'danger' : 'neutral'}>{row.status}</Badge> },
            { key: 'importedAt', header: 'Imported At', render: (row) => <span>{row.importedAt}</span> },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {row.status !== 'PUBLISHED' && (
                    <Button variant="outline" size="sm" onClick={() => handlePublishDataset(row.id)}>
                      Publish
                    </Button>
                  )}
                  {row.status === 'PUBLISHED' && (
                    <Button variant="ghost" size="sm" leftIcon={<RotateCcw size={12} />} style={{ color: 'var(--color-danger)' }} onClick={() => handleRollbackDataset(row.id)}>
                      Rollback
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={importLogs}
        />
      </Card>
    </div>
  );
};
