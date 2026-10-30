import React, { useState, useMemo } from 'react';
import {
  Scale,
  Clock,
  CheckCircle2,
  Camera,
  IndianRupee,
  Upload,
  XCircle,
  ArrowRight,
  Search,
  Filter,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
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
} from '../../components/ui';
import {
  WeightDiscrepancyService,
  type WeightDiscrepancyRecord,
  type DiscrepancyProofAttachment,
  type DiscrepancyStatus,
  type EvidenceFileType,
} from '../../services/weightDiscrepancyService';
import { formatCurrency } from '../../utils/formatters';

export const WeightDiscrepancyPage: React.FC = () => {
  const tenantId = 'tenant-demo-01';

  // Submenu Tabs: ALL | OPEN | APPROVED | REJECTED | AUDIT_HISTORY
  const [activeSubmenu, setActiveSubmenu] = useState<'ALL' | 'OPEN' | 'APPROVED' | 'REJECTED' | 'AUDIT_HISTORY'>('ALL');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [courierFilter, setCourierFilter] = useState('all');

  const [discrepancies, setDiscrepancies] = useState<WeightDiscrepancyRecord[]>(() =>
    WeightDiscrepancyService.getDiscrepancies(tenantId)
  );

  // Selected Record & Details Modal
  const [selectedRecord, setSelectedRecord] = useState<WeightDiscrepancyRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Raise Dispute Form State
  const [disputeReason, setDisputeReason] = useState<WeightDiscrepancyRecord['disputeReason']>(
    'Courier weight appears incorrect'
  );
  const [customerComment, setCustomerComment] = useState('');
  const [uploadedProofs, setUploadedProofs] = useState<DiscrepancyProofAttachment[]>([]);
  const [evidenceTypeInput, setEvidenceTypeInput] = useState<EvidenceFileType>('WEIGHT_SCALE_PHOTO');
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Image Preview Modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const refreshData = () => {
    setDiscrepancies([...WeightDiscrepancyService.getDiscrepancies(tenantId)]);
  };

  // Filtered List based on Submenu, Search & Courier
  const filteredRecords = useMemo(() => {
    return discrepancies.filter((d) => {
      // Submenu Filter
      if (activeSubmenu === 'OPEN' && !['SUBMITTED', 'UNDER_REVIEW', 'COURIER_REVIEW', 'NEED_MORE_EVIDENCE', 'DISCREPANCY_DETECTED', 'EVIDENCE_REQUIRED', 'DISPUTE_FILED', 'SUBMITTED_TO_COURIER'].includes(d.status)) return false;
      if (activeSubmenu === 'APPROVED' && !['APPROVED', 'ACCEPTED', 'PARTIALLY_ACCEPTED'].includes(d.status)) return false;
      if (activeSubmenu === 'REJECTED' && !['REJECTED'].includes(d.status)) return false;
      if (activeSubmenu === 'AUDIT_HISTORY' && !['APPROVED', 'REJECTED', 'CLOSED', 'ACCEPTED', 'PARTIALLY_ACCEPTED', 'EXPIRED'].includes(d.status)) return false;

      // Courier Filter
      if (courierFilter !== 'all' && d.courierAudit.courierId !== courierFilter && d.courierAudit.courierName !== courierFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchAwb = d.awbNumber.toLowerCase().includes(q);
        const matchLrn = d.lrnNumber?.toLowerCase().includes(q);
        const matchDiscId = d.discrepancyId.toLowerCase().includes(q);
        const matchOrder = d.orderId.toLowerCase().includes(q);
        const matchCourier = d.courierAudit.courierName.toLowerCase().includes(q);
        if (!matchAwb && !matchLrn && !matchDiscId && !matchOrder && !matchCourier) return false;
      }

      return true;
    });
  }, [discrepancies, activeSubmenu, searchQuery, courierFilter]);

  // Statistics & Reports
  const stats = useMemo(() => {
    const totalCount = discrepancies.length;
    const openCount = discrepancies.filter((d) => ['SUBMITTED', 'UNDER_REVIEW', 'COURIER_REVIEW', 'NEED_MORE_EVIDENCE', 'DISCREPANCY_DETECTED', 'EVIDENCE_REQUIRED', 'DISPUTE_FILED'].includes(d.status)).length;
    const approvedCount = discrepancies.filter((d) => ['APPROVED', 'ACCEPTED', 'PARTIALLY_ACCEPTED'].includes(d.status)).length;
    const rejectedCount = discrepancies.filter((d) => ['REJECTED'].includes(d.status)).length;
    
    const disputedAmountINR = discrepancies
      .filter((d) => ['SUBMITTED', 'UNDER_REVIEW', 'COURIER_REVIEW', 'NEED_MORE_EVIDENCE', 'DISCREPANCY_DETECTED'].includes(d.status))
      .reduce((acc, curr) => acc + curr.additionalChargeINR, 0);

    const recoveredAmountINR = discrepancies.reduce((acc, curr) => acc + (curr.financialImpact?.approvedRefundINR || curr.refundCreditINR || 0), 0);

    return { totalCount, openCount, approvedCount, rejectedCount, disputedAmountINR, recoveredAmountINR };
  }, [discrepancies]);

  const handleOpenDetail = (record: WeightDiscrepancyRecord) => {
    setSelectedRecord(record);
    setDisputeReason(record.disputeReason || 'Courier weight appears incorrect');
    setCustomerComment(record.customerComment || '');
    setUploadedProofs(record.proofAttachments || []);
    setIsDetailOpen(true);
  };

  // Upload Evidence File (Simulated Drag & Drop)
  const handleSimulateEvidenceUpload = () => {
    if (!selectedRecord) return;
    setIsUploading(true);

    setTimeout(() => {
      const newProof: DiscrepancyProofAttachment = {
        id: `prf-${Date.now()}`,
        name: `evidence_${evidenceTypeInput.toLowerCase()}_${selectedRecord.awbNumber}.jpg`,
        type: evidenceTypeInput,
        url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600',
        fileSizeBytes: 1024 * 520,
        uploadedAt: new Date().toLocaleString(),
        uploadedBy: 'Merchant Staff',
      };

      setUploadedProofs((prev) => [...prev, newProof]);
      setIsUploading(false);
      WeightDiscrepancyService.addCustomerProof(selectedRecord.discrepancyId, newProof);
      refreshData();
    }, 400);
  };

  const handleRemoveProof = (id: string) => {
    setUploadedProofs((prev) => prev.filter((p) => p.id !== id));
  };

  // Submit Dispute
  const handleInitiateDisputeSubmission = () => {
    if (!customerComment.trim()) {
      setToastMsg('Please enter your dispute explanation comment for courier audit verification.');
      setTimeout(() => setToastMsg(null), 4000);
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSubmitDispute = () => {
    if (!selectedRecord) return;

    const res = WeightDiscrepancyService.fileDispute({
      discrepancyId: selectedRecord.discrepancyId,
      disputeReason,
      customerComment,
      proofAttachments: uploadedProofs,
    });

    setIsConfirmModalOpen(false);
    refreshData();
    setIsDetailOpen(false);
    setToastMsg(res.message);
    setTimeout(() => setToastMsg(null), 5000);
  };

  const getStatusBadge = (status: DiscrepancyStatus) => {
    switch (status) {
      case 'SUBMITTED':
      case 'DISPUTE_FILED':
        return <Badge variant="info">Submitted</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="warning">Under Review</Badge>;
      case 'COURIER_REVIEW':
      case 'SUBMITTED_TO_COURIER':
        return <Badge variant="brand">Courier Review</Badge>;
      case 'NEED_MORE_EVIDENCE':
      case 'EVIDENCE_REQUIRED':
        return <Badge variant="warning">Need More Evidence</Badge>;
      case 'APPROVED':
      case 'ACCEPTED':
      case 'PARTIALLY_ACCEPTED':
        return <Badge variant="success">Approved & Credit Issued</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      case 'CLOSED':
      case 'EXPIRED':
        return <Badge variant="neutral">Closed</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Exceptions & Audits', path: '/app/weight-discrepancies' },
    { label: 'Weight Disputes & Audit Manager', path: '/app/weight-discrepancies' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. Page Header */}
      <PageHeader
        title="Weight Discrepancy & Dispute Center"
        description="Audit courier partner reweigh scans, inspect frozen booked weights, upload evidence, and manage commercial dispute workflows."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={() => WeightDiscrepancyService.simulateCourierAudit({
              shipmentId: `SHP-ORD-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
              awbNumber: `DEL${Math.floor(Math.random() * 90000000 + 10000000)}`,
              orderId: `ORD-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
              merchantName: 'Acme Merchants Ltd',
              courierName: 'Delhivery Surface',
              bookedWeightKg: 20,
              auditedWeightKg: 28,
              additionalChargeINR: 420,
            }) && refreshData()}>
              + Simulate Discrepancy Detection (+8 KG)
            </Button>
          </div>
        }
      />

      {toastMsg && (
        <Alert variant="success" title="Dispute System Action">
          {toastMsg}
        </Alert>
      )}

      {/* 2. Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Disputes" value={stats.totalCount} subtext="All time reweigh notices" icon={Scale} />
        <StatCard label="Open Disputes" value={stats.openCount} subtext="Pending audit review" badgeText={stats.openCount > 0 ? 'ACTION NEEDED' : 'CLEAR'} badgeVariant={stats.openCount > 0 ? 'warning' : 'success'} icon={Clock} />
        <StatCard label="Approved Disputes" value={stats.approvedCount} subtext="Excess charges refunded" badgeText="CREDITED" badgeVariant="success" icon={CheckCircle2} />
        <StatCard label="Disputed Additional" value={formatCurrency(stats.disputedAmountINR)} subtext="Pending settlement" icon={IndianRupee} />
        <StatCard label="Total Recovered Amount" value={formatCurrency(stats.recoveredAmountINR)} subtext="Credited back to wallet" badgeText="RECOVERED" badgeVariant="success" icon={IndianRupee} />
      </div>

      {/* 3. Submenu Navigation & Search Filter Card */}
      <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        
        {/* SUBMENU TABS */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px', overflowX: 'auto' }}>
          {[
            { id: 'ALL', label: `All Disputes (${stats.totalCount})` },
            { id: 'OPEN', label: `Open Disputes (${stats.openCount})` },
            { id: 'APPROVED', label: `Approved (${stats.approvedCount})` },
            { id: 'REJECTED', label: `Rejected (${stats.rejectedCount})` },
            { id: 'AUDIT_HISTORY', label: 'Audit History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubmenu(tab.id as any)}
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

        {/* SEARCH & FILTER CONTROLS */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <Input
              placeholder="Search by AWB Number, LRN, Courier Partner, Dispute ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <Filter size={13} style={{ color: '#64748b' }} />
            <span style={{ color: '#64748b', fontWeight: '600' }}>Courier:</span>
            <Select
              value={courierFilter}
              onChange={(e) => setCourierFilter(e.target.value)}
              options={[
                { label: 'All Courier Partners', value: 'all' },
                { label: 'Delhivery Surface', value: 'delhivery' },
                { label: 'Blue Dart Air', value: 'bluedart' },
                { label: 'DTDC Express', value: 'dtdc' },
              ]}
            />
          </div>
        </div>

        {/* DISPUTES TABLE */}
        <Table<WeightDiscrepancyRecord>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'awbNumber',
              header: 'AWB & LRN Ref',
              render: (r) => (
                <div>
                  <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{r.awbNumber}</strong>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>LRN: {r.lrnNumber}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>ID: {r.discrepancyId}</div>
                </div>
              ),
            },
            {
              key: 'courierName',
              header: 'Courier Partner',
              render: (r) => (
                <div>
                  <strong>{r.courierAudit.courierName}</strong>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{r.pickupWarehouse} → {r.destinationCity}</div>
                </div>
              ),
            },
            {
              key: 'bookedWeight',
              header: 'Booked Weight',
              render: (r) => (
                <div>
                  <strong style={{ color: '#0f172a' }}>{r.bookedSnapshot.chargeableWeightKg.toFixed(2)} KG</strong>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Actual: {r.bookedSnapshot.actualWeightKg} KG</div>
                </div>
              ),
            },
            {
              key: 'auditedWeight',
              header: 'Courier Audit Weight',
              render: (r) => (
                <div>
                  <strong style={{ color: '#ef4444' }}>{r.courierAudit.auditedChargeableWeightKg.toFixed(2)} KG</strong>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Reweigh Hub Scan</div>
                </div>
              ),
            },
            {
              key: 'difference',
              header: 'Weight Diff',
              render: (r) => <Badge variant="danger">+{r.weightDiffKg.toFixed(2)} KG</Badge>,
            },
            {
              key: 'additionalChargeINR',
              header: 'Extra Charge',
              render: (r) => (
                <div>
                  <strong style={{ color: '#ef4444' }}>{formatCurrency(r.additionalChargeINR)}</strong>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>Debited to Ledger</div>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Current Status',
              render: (r) => getStatusBadge(r.status),
            },
            {
              key: 'action',
              header: 'Action',
              render: (r) => (
                <Button
                  size="sm"
                  variant={['SUBMITTED', 'DISCREPANCY_DETECTED', 'EVIDENCE_REQUIRED'].includes(r.status) ? 'primary' : 'outline'}
                  onClick={() => handleOpenDetail(r)}
                  style={['SUBMITTED', 'DISCREPANCY_DETECTED'].includes(r.status) ? { backgroundColor: '#0284c7', borderColor: '#0284c7' } : {}}
                >
                  {['DISCREPANCY_DETECTED', 'EVIDENCE_REQUIRED'].includes(r.status) ? 'Raise Dispute' : 'View Details'}
                </Button>
              ),
            },
          ]}
          data={filteredRecords}
          emptyText="No weight discrepancy disputes found matching filters."
        />

      </Card>

      {/* 4. DISPUTE DETAILS MODAL (FULL WORKFLOW, FINANCIAL IMPACT & TIMELINE) */}
      {selectedRecord && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Weight Dispute & Audit Details — ${selectedRecord.discrepancyId}`}
          maxWidth="950px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* STATUS BANNER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>AWB NUMBER / LRN NUMBER</span>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0284c7' }}>{selectedRecord.awbNumber} ({selectedRecord.lrnNumber})</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>CURRENT DISPUTE STATUS</span>
                {getStatusBadge(selectedRecord.status)}
              </div>
            </div>

            {/* WEIGHT COMPARISON SUMMARY CARD */}
            <Card style={{ padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
                <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>BOOKED WEIGHT</span>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#0284c7' }}>{selectedRecord.bookedSnapshot.chargeableWeightKg.toFixed(2)} KG</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Actual: {selectedRecord.bookedSnapshot.actualWeightKg} KG</div>
                </div>

                <ArrowRight size={20} style={{ color: '#94a3b8' }} />

                <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #ef4444' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>COURIER AUDIT WEIGHT</span>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444' }}>{selectedRecord.courierAudit.auditedChargeableWeightKg.toFixed(2)} KG</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Reweigh Hub Scan</div>
                </div>

                <ArrowRight size={20} style={{ color: '#94a3b8' }} />

                <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>ADDITIONAL CHARGE</span>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444' }}>+{formatCurrency(selectedRecord.additionalChargeINR)}</div>
                  <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700' }}>+{selectedRecord.weightDiffKg.toFixed(2)} KG Variance</div>
                </div>
              </div>
            </Card>

            {/* FINANCIAL IMPACT BREAKDOWN SECTION */}
            <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
                Financial Impact Breakdown & Settlement Specs
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', fontSize: '12px' }}>
                <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                  <span style={{ color: '#64748b' }}>Original Freight Charge:</span>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>{formatCurrency(selectedRecord.financialImpact?.originalFreightChargeINR || selectedRecord.bookedSnapshot.appliedFreightINR)}</strong>
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: '#fff1f2', borderRadius: '6px' }}>
                  <span style={{ color: '#be123c' }}>Additional Courier Charge:</span>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#e11d48' }}>+{formatCurrency(selectedRecord.additionalChargeINR)}</strong>
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                  <span style={{ color: '#64748b' }}>Disputed Amount:</span>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#0284c7' }}>{formatCurrency(selectedRecord.financialImpact?.disputedAmountINR || selectedRecord.additionalChargeINR)}</strong>
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: '#f0fdf4', borderRadius: '6px' }}>
                  <span style={{ color: '#15803d' }}>Approved Refund (CN):</span>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#16a34a' }}>{formatCurrency(selectedRecord.financialImpact?.approvedRefundINR || selectedRecord.refundCreditINR || 0)}</strong>
                </div>
              </div>
            </Card>

            {/* EVIDENCE UPLOAD CENTER (DRAG & DROP SIMULATION) */}
            <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={16} style={{ color: '#0284c7' }} /> Evidence Upload Center (Scale Photos, Package Images, Invoice, Video Proof)
              </h4>

              <Alert variant="info" title="Evidence Upload Requirements">
                Upload clear evidence: Digital scale reading photos, tape measurement photos, box packing images, invoice copy, or unboxing video proof.
              </Alert>

              {/* Uploaded Files Grid */}
              {uploadedProofs.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', margin: '12px 0' }}>
                  {uploadedProofs.map((proof) => (
                    <div key={proof.id} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px', display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                      <img
                        src={proof.url}
                        alt={proof.name}
                        style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                        onClick={() => setPreviewImageUrl(proof.url)}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{proof.name}</div>
                        <Badge variant="neutral" style={{ fontSize: '9px' }}>{proof.type}</Badge>
                      </div>
                      <button onClick={() => handleRemoveProof(proof.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                        <XCircle size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Drag and Drop Box */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', border: '2px dashed #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc', marginTop: '10px' }}>
                <Upload size={24} style={{ color: '#0284c7' }} />
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Drag & Drop Evidence Files or Click Below to Upload</span>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                  <Select
                    value={evidenceTypeInput}
                    onChange={(e) => setEvidenceTypeInput(e.target.value as EvidenceFileType)}
                    options={[
                      { label: 'Weight Scale Photo', value: 'WEIGHT_SCALE_PHOTO' },
                      { label: 'Package Photo', value: 'PACKAGE_PHOTO' },
                      { label: 'Packing Image', value: 'PACKING_IMAGE' },
                      { label: 'Invoice Copy', value: 'INVOICE_COPY' },
                      { label: 'Video Proof', value: 'VIDEO_PROOF' },
                      { label: 'Additional Document', value: 'ADDITIONAL_DOC' },
                    ]}
                  />
                  <Button variant="outline" size="sm" onClick={handleSimulateEvidenceUpload} disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Upload File'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* RAISE DISPUTE FORM */}
            {['DISCREPANCY_DETECTED', 'EVIDENCE_REQUIRED', 'SUBMITTED'].includes(selectedRecord.status) && (
              <Card style={{ padding: '16px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0284c7', margin: '0 0 10px 0' }}>Raise / Submit Commercial Dispute</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Dispute Reason</label>
                    <Select
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value as any)}
                      options={[
                        { label: 'Courier weight appears incorrect', value: 'Courier weight appears incorrect' },
                        { label: 'Courier dimensions appear incorrect', value: 'Courier dimensions appear incorrect' },
                        { label: 'Volumetric weight appears incorrect', value: 'Volumetric weight appears incorrect' },
                        { label: 'Package was weighed incorrectly at hub', value: 'Package was weighed incorrectly' },
                        { label: 'Duplicate weight adjustment', value: 'Duplicate weight adjustment' },
                        { label: 'Other commercial dispute', value: 'Other' },
                      ]}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Merchant Remarks & Proof Explanation</label>
                    <Textarea
                      rows={3}
                      placeholder="Explain why the courier reweigh scan is incorrect (e.g., We weighed this shipment on our calibrated digital scale prior to dispatch. Actual weight is 20 KG)..."
                      value={customerComment}
                      onChange={(e) => setCustomerComment(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <Button variant="primary" onClick={handleInitiateDisputeSubmission} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                      Submit Weight Dispute
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* COURIER RESPONSE SECTION */}
            {selectedRecord.courierResponseDetails && (
              <Card style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                  Courier Response & Commercial Decision
                </h4>
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  <div>Decision: <strong>{selectedRecord.courierResponseDetails.courierDecision || selectedRecord.courierResponseDetails.acceptedStatus}</strong></div>
                  <div>Resolution Date: <strong>{selectedRecord.courierResponseDetails.responseDate}</strong></div>
                  <div>Remarks: <em>"{selectedRecord.courierResponseDetails.courierComments}"</em></div>
                </div>
              </Card>
            )}

            {/* CHRONOLOGICAL TIMELINE VIEW (NEWEST UPDATE FIRST) */}
            <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} style={{ color: '#0284c7' }} /> Complete Chronological Audit History (Newest Update First)
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedRecord.auditTimeline.map((evt) => (
                  <div key={evt.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', borderLeft: '2px solid #0284c7', paddingLeft: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>{evt.event}</strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{evt.timestamp}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Actor: <strong>{evt.actor}</strong> ({evt.role})
                      </div>
                      {evt.notes && (
                        <div style={{ fontSize: '12px', color: '#334155', fontStyle: 'italic', marginTop: '4px' }}>
                          "{evt.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        </Modal>
      )}

      {/* CONFIRMATION SUBMIT MODAL */}
      {selectedRecord && (
        <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirm Weight Dispute Submission" maxWidth="480px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
              Submit weight dispute for AWB <strong>{selectedRecord.awbNumber}</strong> to carrier commercial audit desk?
            </p>

            <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '12px' }}>
              <div>Disputed Charge: <strong>{formatCurrency(selectedRecord.additionalChargeINR)}</strong></div>
              <div>Reason: <strong>{disputeReason}</strong></div>
              <div>Uploaded Evidence: <strong>{uploadedProofs.length} file(s)</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleConfirmSubmitDispute} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                Confirm & Submit
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {previewImageUrl && (
        <Modal isOpen={!!previewImageUrl} onClose={() => setPreviewImageUrl(null)} title="Evidence Image Preview" maxWidth="600px">
          <div style={{ textAlign: 'center' }}>
            <img src={previewImageUrl} alt="Evidence" style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '8px' }} />
          </div>
        </Modal>
      )}

    </div>
  );
};
