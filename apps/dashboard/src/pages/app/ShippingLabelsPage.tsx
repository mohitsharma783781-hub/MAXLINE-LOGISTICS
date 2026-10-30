import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  SlidersHorizontal,
  Download,
  Layers,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Select,
  Checkbox,
  Alert,
  Modal,
  Input,
} from '../../components/ui';
import {
  type ShippingLabelItem,
  type LabelFilterState,
  type LabelFormat,
  type LabelSize,
  LABEL_STATUS_CONFIG,
} from '../../types/shippingOperations';
import { demoLabelProvider } from '../../mocks/shippingOperations.mock';

export const ShippingLabelsPage: React.FC = () => {
  const navigate = useNavigate();

  // Submenu Tabs for Formats: ALL | THERMAL_4X6 | A4_SHEET | SINGLE_PDF | ZIP_DOWNLOAD
  const [activeFormatTab, setActiveFormatTab] = useState<'ALL' | 'THERMAL_4X6' | 'A4_SHEET' | 'SINGLE_PDF' | 'ZIP_DOWNLOAD'>('ALL');

  const [labels, setLabels] = useState<ShippingLabelItem[]>(() => demoLabelProvider.getLabels());
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);
  const [activeLabel, setActiveLabel] = useState<ShippingLabelItem | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFormat, setBulkFormat] = useState<LabelFormat>('PDF');
  const [bulkSize, setBulkSize] = useState<LabelSize>('4x6');
  const [bulkResult, setBulkResult] = useState<{ generatedCount: number; failedCount: number; skippedCount: number } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Search & Filter State
  const [filters, setFilters] = useState<LabelFilterState>({
    searchQuery: '',
    status: 'all',
    courier: 'all',
    format: 'all',
  });

  const filteredLabels = useMemo(() => {
    let list = demoLabelProvider.getLabels(filters);
    if (activeFormatTab === 'THERMAL_4X6') list = list.filter((l) => l.size === '4x6');
    if (activeFormatTab === 'A4_SHEET') list = list.filter((l) => l.size === 'A4');
    if (activeFormatTab === 'SINGLE_PDF') list = list.filter((l) => l.format === 'PDF');
    if (activeFormatTab === 'ZIP_DOWNLOAD') list = list.filter((l) => l.status === 'GENERATED');
    return list;
  }, [filters, labels, activeFormatTab]);

  const handleResetFilters = () => {
    setFilters({ searchQuery: '', status: 'all', courier: 'all', format: 'all' });
  };

  const toggleSelectRow = (shipmentId: string) => {
    setSelectedShipmentIds((prev) =>
      prev.includes(shipmentId) ? prev.filter((id) => id !== shipmentId) : [...prev, shipmentId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedShipmentIds.length === filteredLabels.length) {
      setSelectedShipmentIds([]);
    } else {
      setSelectedShipmentIds(filteredLabels.map((l) => l.shipmentId));
    }
  };

  const handleSingleGenerate = (shipmentId: string) => {
    const updated = demoLabelProvider.generateLabel(shipmentId, 'PDF', '4x6');
    setLabels(demoLabelProvider.getLabels());
    setActiveLabel(updated);
    setIsPreviewModalOpen(true);
  };

  const handleRunBulkGeneration = () => {
    if (selectedShipmentIds.length === 0) return;
    const res = demoLabelProvider.bulkGenerateLabels(selectedShipmentIds, bulkFormat, bulkSize);
    setLabels(demoLabelProvider.getLabels());
    setBulkResult({
      generatedCount: res.generatedCount,
      failedCount: res.failedCount,
      skippedCount: res.skippedCount,
    });
    setToastMsg(`Successfully generated ${res.generatedCount} thermal dispatches!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleRetry = (shipmentId: string) => {
    demoLabelProvider.retryLabelGeneration(shipmentId);
    setLabels(demoLabelProvider.getLabels());
  };

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Bulk Operations Center', path: '/app/orders/bulk-upload' },
    { label: 'Bulk Shipping Labels Center', path: '/app/labels' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. Page Header */}
      <PageHeader
        title="Bulk Thermal 4x6 Label Printing Center"
        description="Batch generate 4x6 thermal shipping labels, preview carrier barcodes & QR codes, print A4 label sheets, and download ZIP dispatches."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/manifests')} leftIcon={<Layers size={14} />}>
              Generate Manifest
            </Button>

            <Button
              variant="primary"
              size="sm"
              disabled={selectedShipmentIds.length === 0}
              onClick={() => {
                setBulkResult(null);
                setIsBulkModalOpen(true);
              }}
              leftIcon={<Printer size={16} />}
              style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            >
              Bulk Generate Labels ({selectedShipmentIds.length})
            </Button>
          </div>
        }
      />

      {toastMsg && (
        <Alert variant="success" title="Bulk Label Action">
          {toastMsg}
        </Alert>
      )}

      {/* 2. KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Booked Labels" value={labels.length} subtext="Dispatch shipments" icon={FileText} />
        <StatCard label="Generated 4x6 Labels" value={labels.filter((l) => l.status === 'GENERATED').length} subtext="Ready for thermal printing" badgeText="READY" badgeVariant="success" icon={CheckCircle2} />
        <StatCard label="Pending Generation" value={labels.filter((l) => l.status === 'NOT_GENERATED').length} subtext="Awaiting label creation" icon={SlidersHorizontal} />
        <StatCard label="Generation Failed" value={labels.filter((l) => l.status === 'FAILED').length} subtext="Requires retry action" badgeText={labels.filter((l) => l.status === 'FAILED').length > 0 ? 'FAILED' : 'CLEAR'} badgeVariant="warning" icon={AlertTriangle} />
      </div>

      {/* 3. Submenu Navigation & Search Filter Card */}
      <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        
        {/* SUBMENU FORMAT TABS */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px', overflowX: 'auto' }}>
          {[
            { id: 'ALL', label: `All Labels (${labels.length})` },
            { id: 'THERMAL_4X6', label: '4x6 Thermal Labels' },
            { id: 'A4_SHEET', label: 'A4 Paper Label Sheet' },
            { id: 'SINGLE_PDF', label: 'Single PDF Document' },
            { id: 'ZIP_DOWNLOAD', label: 'ZIP Batch Download' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFormatTab(tab.id as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeFormatTab === tab.id ? '#0284c7' : 'transparent',
                color: activeFormatTab === tab.id ? '#ffffff' : '#64748b',
                fontWeight: activeFormatTab === tab.id ? '700' : '500',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SEARCH & FILTERS TOOLBAR */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <Input
              placeholder="Search by Shipment ID, AWB, Order ID..."
              value={filters.searchQuery}
              onChange={(e) => setFilters((p) => ({ ...p, searchQuery: e.target.value }))}
            />
          </div>

          <Select
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            options={[
              { value: 'all', label: 'All Label Statuses' },
              { value: 'GENERATED', label: 'Generated' },
              { value: 'NOT_GENERATED', label: 'Not Generated' },
              { value: 'FAILED', label: 'Failed' },
            ]}
          />

          <Select
            value={filters.courier}
            onChange={(e) => setFilters((p) => ({ ...p, courier: e.target.value }))}
            options={[
              { value: 'all', label: 'All Courier Partners' },
              { value: 'delhivery', label: 'Delhivery Surface' },
              { value: 'bluedart', label: 'Blue Dart Air' },
              { value: 'fedex', label: 'FedEx Express' },
            ]}
          />

          <Button variant="outline" size="sm" onClick={handleResetFilters} leftIcon={<RotateCcw size={14} />}>
            Reset
          </Button>
        </div>

        {/* BULK ACTIONS TOOLBAR */}
        {selectedShipmentIds.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f9ff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #bae6fd', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#0284c7', fontWeight: '700' }}>
              {selectedShipmentIds.length} Shipment(s) Selected for Bulk Label Actions
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button size="sm" variant="outline" leftIcon={<Printer size={14} />} onClick={() => setIsBulkModalOpen(true)}>
                Bulk Print Labels
              </Button>
              <Button size="sm" variant="outline" leftIcon={<Download size={14} />} onClick={() => { setToastMsg(`Downloading ${selectedShipmentIds.length} labels as ZIP archive...`); setTimeout(() => setToastMsg(null), 4000); }}>
                Download ZIP
              </Button>
            </div>
          </div>
        )}

        {/* LABELS TABLE */}
        <Table<ShippingLabelItem>
          keyExtractor={(r) => r.shipmentId}
          columns={[
            {
              key: 'select',
              header: (
                <Checkbox
                  checked={selectedShipmentIds.length > 0 && selectedShipmentIds.length === filteredLabels.length}
                  onChange={toggleSelectAll}
                />
              ) as any,
              render: (row) => (
                <Checkbox
                  checked={selectedShipmentIds.includes(row.shipmentId)}
                  onChange={() => toggleSelectRow(row.shipmentId)}
                />
              ),
            },
            {
              key: 'shipmentId',
              header: 'Shipment ID & AWB',
              render: (row) => (
                <div>
                  <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{row.shipmentId}</strong>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    AWB: <strong>{row.awb}</strong>
                  </div>
                </div>
              ),
            },
            {
              key: 'orderId',
              header: 'Order Ref',
              render: (row) => <span>{row.orderId}</span>,
            },
            {
              key: 'courierName',
              header: 'Courier Partner',
              render: (row) => <strong>{row.courierName}</strong>,
            },
            {
              key: 'destinationCity',
              header: 'Destination',
              render: (row) => <span>{row.destinationCity} ({row.destinationPincode})</span>,
            },
            {
              key: 'status',
              header: 'Label Status',
              render: (row) => {
                const conf = LABEL_STATUS_CONFIG.find((c) => c.key === row.status);
                return <Badge variant={conf?.variant || 'neutral'}>{conf?.label || row.status}</Badge>;
              },
            },
            {
              key: 'actions',
              header: 'Action',
              render: (row) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {row.status === 'GENERATED' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveLabel(row);
                          setIsPreviewModalOpen(true);
                        }}
                      >
                        Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveLabel(row);
                          setIsPreviewModalOpen(true);
                        }}
                      >
                        <Printer size={14} />
                      </Button>
                    </>
                  ) : row.status === 'FAILED' ? (
                    <Button variant="outline" size="sm" onClick={() => handleRetry(row.shipmentId)} leftIcon={<RotateCcw size={14} />}>
                      Retry
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" onClick={() => handleSingleGenerate(row.shipmentId)} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                      Generate Label
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={filteredLabels}
        />

      </Card>

      {/* 4. PROFESSIONAL 4X6 THERMAL LABEL DESIGN PREVIEW MODAL */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Official Courier 4x6 Thermal Shipping Label"
        maxWidth="550px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          
          {activeLabel && (
            <div
              style={{
                width: '100%',
                maxWidth: '420px',
                border: '2px solid #000000',
                borderRadius: '6px',
                padding: '16px',
                backgroundColor: '#ffffff',
                color: '#000000',
                fontFamily: 'monospace, Arial, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {/* TOP HEADER: COURIER LOGO & ROUTING ZONE */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #000', paddingBottom: '8px' }}>
                <div>
                  <strong style={{ fontSize: '18px', textTransform: 'uppercase' }}>{activeLabel.courierName}</strong>
                  <div style={{ fontSize: '10px', fontWeight: 'bold' }}>EXPRESS SURFACE CARGO</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '20px', fontWeight: '900', border: '2px solid #000', padding: '2px 8px' }}>
                    {activeLabel.destinationPincode.slice(0, 3)}-ZONE
                  </span>
                </div>
              </div>

              {/* BARCODE & AWB NUMBER SECTION */}
              <div style={{ textAlign: 'center', padding: '10px 0', borderBottom: '2px solid #000' }}>
                {/* Simulated Barcode Lines */}
                <div style={{ height: '42px', backgroundColor: '#000', margin: '0 auto 6px', width: '90%', display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} style={{ width: i % 2 === 0 ? '4px' : '2px', backgroundColor: i % 3 === 0 ? '#fff' : '#000', height: '100%' }} />
                  ))}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '2px' }}>{activeLabel.awb}</div>
                <div style={{ fontSize: '10px', color: '#444' }}>AIRWAY BILL NUMBER</div>
              </div>

              {/* SHIPMENT & PAYMENT DETAILS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #000', paddingBottom: '8px', fontSize: '11px' }}>
                <div>
                  <div>ORDER ID: <strong>{activeLabel.orderId}</strong></div>
                  <div>SHIPMENT: <strong>{activeLabel.shipmentId}</strong></div>
                  <div>WEIGHT: <strong>{activeLabel.weightKg} KG</strong></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: activeLabel.paymentMode === 'COD' ? '#dc2626' : '#000' }}>
                    MODE: {activeLabel.paymentMode}
                  </div>
                  {activeLabel.codAmount ? (
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#dc2626' }}>
                      COLLECT: ₹{activeLabel.codAmount}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>PREPAID DISPATCH</div>
                  )}
                </div>
              </div>

              {/* SENDER & RECEIVER ADDRESS SECTION */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
                <div style={{ borderRight: '1px solid #000', paddingRight: '6px' }}>
                  <strong style={{ fontSize: '11px', textTransform: 'uppercase' }}>SHIP FROM (SENDER):</strong>
                  <div>Acme Logistics Fulfillment FC</div>
                  <div>Plot 42 MIDC Industrial Area, Bhiwandi</div>
                  <div>Thane, Maharashtra - 421302</div>
                  <div>Phone: 9820011223</div>
                </div>

                <div>
                  <strong style={{ fontSize: '11px', textTransform: 'uppercase' }}>SHIP TO (CONSIGNEE):</strong>
                  <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{activeLabel.destinationCity} Consignee</div>
                  <div>Address: Destination Road, Phase 2</div>
                  <div>{activeLabel.destinationCity} - {activeLabel.destinationPincode}</div>
                  <div>Phone: 98102XXXXX</div>
                </div>
              </div>

              {/* QR CODE & ROUTING INFORMATION */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                <QrCode size={46} />
                <div style={{ textAlign: 'right', fontSize: '10px' }}>
                  <div>HUB: <strong>BHIWANDI / BOM-FC1</strong></div>
                  <div>ROUTING CODE: <strong>BOM/BLR/{activeLabel.destinationPincode.slice(0, 3)}</strong></div>
                  <div style={{ fontSize: '9px', color: '#666' }}>RETURN IF UNDELIVERED TO ORIGIN HUB</div>
                </div>
              </div>

            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end', marginTop: '10px' }}>
            <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" leftIcon={<Printer size={16} />} onClick={() => setIsPreviewModalOpen(false)} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
              Print Official 4x6 Thermal Label
            </Button>
          </div>
        </div>
      </Modal>

      {/* BULK LABEL GENERATION MODAL */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title={`Bulk Generate Shipping Labels (${selectedShipmentIds.length} Selected)`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Alert variant="info" title="Bulk Batch Label Printing">
            Batch generate thermal 4x6 shipping sticker labels for all selected dispatches.
          </Alert>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select
              label="Label Output Format"
              value={bulkFormat}
              onChange={(e) => setBulkFormat(e.target.value as LabelFormat)}
              options={[
                { value: 'PDF', label: 'PDF Document' },
                { value: 'PNG', label: 'PNG Thermal Image' },
              ]}
            />

            <Select
              label="Print Paper Size"
              value={bulkSize}
              onChange={(e) => setBulkSize(e.target.value as LabelSize)}
              options={[
                { value: '4x6', label: '4x6 Thermal Sticker' },
                { value: 'A4', label: 'A4 Standard Paper Sheet' },
              ]}
            />
          </div>

          {bulkResult && (
            <Alert variant={bulkResult.failedCount > 0 ? 'warning' : 'success'} title="Bulk Processing Summary">
              <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                <span>Generated: <strong>{bulkResult.generatedCount}</strong></span>
                <span>Skipped: <strong>{bulkResult.skippedCount}</strong></span>
                <span>Failed: <strong>{bulkResult.failedCount}</strong></span>
              </div>
            </Alert>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button variant="outline" onClick={() => setIsBulkModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handleRunBulkGeneration} leftIcon={<FileText size={16} />} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
              Start Bulk Generation
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
