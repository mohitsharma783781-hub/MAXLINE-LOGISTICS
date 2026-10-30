import React, { useState, useMemo } from 'react';
import {
  Scale,
  CheckCircle2,
  Eye,
  IndianRupee,
  Clock,
  UserCheck,
  RotateCcw,
  MessageSquare,
  HelpCircle,
  XCircle,
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
} from '../../services/weightDiscrepancyService';
import { formatCurrency } from '../../utils/formatters';

export const AdminWeightDiscrepancyPage: React.FC = () => {
  const [discrepancies, setDiscrepancies] = useState<WeightDiscrepancyRecord[]>(() =>
    WeightDiscrepancyService.getDiscrepancies('all')
  );

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCourier, setFilterCourier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Record & Modals
  const [selectedRecord, setSelectedRecord] = useState<WeightDiscrepancyRecord | null>(null);
  const [isInspectOpen, setIsInspectOpen] = useState(false);

  // Action Modals
  const [actionType, setActionType] = useState<
    'APPROVE' | 'REJECT' | 'REQUEST_EVIDENCE' | 'ASSIGN' | null
  >(null);

  // Action Form Inputs
  const [refundAmountInput, setRefundAmountInput] = useState<number>(420);
  const [approveNotesInput, setApproveNotesInput] = useState('Weight dispute approved after digital scale proof verification. Full credit note issued.');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('Courier hub scale recalibration log confirmed reweigh scan is valid.');
  const [evidenceRequestInput, setEvidenceRequestInput] = useState('Please upload a clear photo showing the weighing scale digital display along with the AWB shipping label.');
  const [staffNameInput, setStaffNameInput] = useState('Ramesh Kumar (Ops Lead)');

  // Internal Note
  const [newInternalNote, setNewInternalNote] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const refreshData = () => {
    setDiscrepancies([...WeightDiscrepancyService.getDiscrepancies('all')]);
  };

  // Filtered List
  const filteredRecords = useMemo(() => {
    return discrepancies.filter((d) => {
      if (filterStatus !== 'all' && d.status !== filterStatus) return false;
      if (filterCourier !== 'all' && d.courierAudit.courierId !== filterCourier && d.courierAudit.courierName !== filterCourier) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchAwb = d.awbNumber.toLowerCase().includes(q);
        const matchLrn = d.lrnNumber?.toLowerCase().includes(q);
        const matchDisc = d.discrepancyId.toLowerCase().includes(q);
        const matchMerchant = d.merchantName.toLowerCase().includes(q);
        if (!matchAwb && !matchLrn && !matchDisc && !matchMerchant) return false;
      }

      return true;
    });
  }, [discrepancies, filterStatus, filterCourier, searchQuery]);

  // Statistics Summary & Courier-wise Reports
  const stats = useMemo(() => {
    const totalCount = discrepancies.length;
    const pendingCount = discrepancies.filter((d) => ['SUBMITTED', 'UNDER_REVIEW', 'COURIER_REVIEW', 'NEED_MORE_EVIDENCE', 'DISCREPANCY_DETECTED', 'EVIDENCE_REQUIRED', 'DISPUTE_FILED'].includes(d.status)).length;
    const approvedCount = discrepancies.filter((d) => ['APPROVED', 'ACCEPTED', 'PARTIALLY_ACCEPTED'].includes(d.status)).length;
    const rejectedCount = discrepancies.filter((d) => ['REJECTED'].includes(d.status)).length;

    const totalDisputedINR = discrepancies.reduce((s, d) => s + d.additionalChargeINR, 0);
    const totalRecoveredINR = discrepancies.reduce((s, d) => s + (d.financialImpact?.approvedRefundINR || d.refundCreditINR || 0), 0);

    return { totalCount, pendingCount, approvedCount, rejectedCount, totalDisputedINR, totalRecoveredINR };
  }, [discrepancies]);

  const handleOpenInspect = (record: WeightDiscrepancyRecord) => {
    setSelectedRecord(record);
    setRefundAmountInput(record.additionalChargeINR);
    setIsInspectOpen(true);
  };

  // Execute Admin Approve Dispute
  const handleExecuteApprove = () => {
    if (!selectedRecord) return;
    const res = WeightDiscrepancyService.adminApproveDispute(
      selectedRecord.discrepancyId,
      refundAmountInput,
      approveNotesInput,
      'Super Admin Ops'
    );

    setActionType(null);
    setIsInspectOpen(false);
    refreshData();
    setToastMsg(res.message);
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Execute Admin Reject Dispute
  const handleExecuteReject = () => {
    if (!selectedRecord) return;
    const res = WeightDiscrepancyService.adminRejectDispute(
      selectedRecord.discrepancyId,
      rejectionReasonInput,
      'Super Admin Ops'
    );

    setActionType(null);
    setIsInspectOpen(false);
    refreshData();
    setToastMsg(res.message);
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Execute Request Evidence
  const handleExecuteRequestEvidence = () => {
    if (!selectedRecord) return;
    const res = WeightDiscrepancyService.adminRequestEvidence(
      selectedRecord.discrepancyId,
      evidenceRequestInput,
      'Super Admin Ops'
    );

    setActionType(null);
    refreshData();
    setToastMsg(res.message);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Execute Assign Staff
  const handleExecuteAssignStaff = () => {
    if (!selectedRecord) return;
    const res = WeightDiscrepancyService.assignStaff(selectedRecord.discrepancyId, staffNameInput, 'Super Admin Ops');
    setActionType(null);
    refreshData();
    setToastMsg(res.message);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleAddInternalNote = () => {
    if (!selectedRecord || !newInternalNote.trim()) return;
    WeightDiscrepancyService.addInternalNote(selectedRecord.discrepancyId, newInternalNote, 'Super Admin Ops');
    setNewInternalNote('');
    refreshData();
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Operations & Audits', path: '/admin/shipments' },
    { label: 'Admin Weight Dispute & Audit Review Panel', path: '/admin/weight-discrepancies' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. Page Header */}
      <PageHeader
        title="Admin Weight Dispute & Audit Review Panel"
        description="Supervise merchant weight disputes, inspect evidence files, approve Credit Note refunds, and track carrier reweigh statistics."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="primary" size="sm" onClick={() => WeightDiscrepancyService.simulateCourierAudit({
              shipmentId: `SHP-ORD-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
              awbNumber: `DEL${Math.floor(Math.random() * 90000000 + 10000000)}`,
              orderId: `ORD-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
              merchantName: 'Acme Merchants Ltd',
              courierName: 'Delhivery Surface',
              bookedWeightKg: 20,
              auditedWeightKg: 28,
              additionalChargeINR: 420,
            }) && refreshData()} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
              + Simulate Courier Reweigh Scan
            </Button>
          </div>
        }
      />

      {toastMsg && (
        <Alert variant="success" title="Admin Dispute Decision Executed">
          {toastMsg}
        </Alert>
      )}

      {/* 2. Overview Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Disputes" value={stats.totalCount} subtext="Platform-wide audit cases" icon={Scale} />
        <StatCard label="Pending Review" value={stats.pendingCount} subtext="Awaiting Ops decision" badgeText="PENDING" badgeVariant="warning" icon={Clock} />
        <StatCard label="Approved Disputes" value={stats.approvedCount} subtext="Credit Notes issued" badgeText="APPROVED" badgeVariant="success" icon={CheckCircle2} />
        <StatCard label="Rejected Disputes" value={stats.rejectedCount} subtext="Original charge maintained" icon={XCircle} />
        <StatCard label="Total Recovered Refunded" value={formatCurrency(stats.totalRecoveredINR)} subtext="Credited to merchant wallets" icon={IndianRupee} />
      </div>

      {/* 3. Main Data Card & Filter Toolbar */}
      <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        
        {/* FILTERS TOOLBAR */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'center', marginBottom: '16px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>Dispute Status</label>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Submitted', value: 'SUBMITTED' },
                { label: 'Under Review', value: 'UNDER_REVIEW' },
                { label: 'Courier Review', value: 'COURIER_REVIEW' },
                { label: 'Need More Evidence', value: 'NEED_MORE_EVIDENCE' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Rejected', value: 'REJECTED' },
              ]}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>Courier Partner</label>
            <Select
              value={filterCourier}
              onChange={(e) => setFilterCourier(e.target.value)}
              options={[
                { label: 'All Courier Partners', value: 'all' },
                { label: 'Delhivery Surface', value: 'delhivery' },
                { label: 'Blue Dart Air', value: 'bluedart' },
                { label: 'DTDC Express', value: 'dtdc' },
              ]}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>Search</label>
            <Input
              placeholder="Search AWB, LRN, Merchant, Dispute ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button variant="outline" onClick={() => { setFilterStatus('all'); setFilterCourier('all'); setSearchQuery(''); }} style={{ width: '100%' }}>
              <RotateCcw size={14} style={{ marginRight: '4px' }} /> Reset Filters
            </Button>
          </div>
        </div>

        {/* DISPUTES MASTER TABLE */}
        <Table<WeightDiscrepancyRecord>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'discrepancyId',
              header: 'Dispute ID & Merchant',
              render: (r) => (
                <div>
                  <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{r.discrepancyId}</strong>
                  <div style={{ fontSize: '12px', fontWeight: '700' }}>{r.merchantName}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>AWB: {r.awbNumber}</div>
                </div>
              ),
            },
            {
              key: 'courier',
              header: 'Courier Partner',
              render: (r) => (
                <div>
                  <strong>{r.courierAudit.courierName}</strong>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Scan: {r.courierAudit.auditSource}</div>
                </div>
              ),
            },
            {
              key: 'bookedVsAudited',
              header: 'Booked ➔ Audited Wt',
              render: (r) => (
                <div>
                  <span>{r.bookedSnapshot.chargeableWeightKg.toFixed(2)} KG</span>
                  <span style={{ margin: '0 4px', color: '#94a3b8' }}>➔</span>
                  <strong style={{ color: '#ef4444' }}>{r.courierAudit.auditedChargeableWeightKg.toFixed(2)} KG</strong>
                  <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: '700' }}>Diff: +{r.weightDiffKg.toFixed(2)} KG</div>
                </div>
              ),
            },
            {
              key: 'additionalChargeINR',
              header: 'Disputed Extra Charge',
              render: (r) => (
                <div>
                  <strong style={{ color: '#ef4444' }}>{formatCurrency(r.additionalChargeINR)}</strong>
                  {r.refundCreditINR > 0 && (
                    <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: '700' }}>
                      Refunded: {formatCurrency(r.refundCreditINR)}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'assignedStaff',
              header: 'Assigned Ops Lead',
              render: (r) => r.assignedStaff ? <span style={{ fontSize: '12px', fontWeight: '600' }}>{r.assignedStaff}</span> : <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <Badge variant={['APPROVED', 'ACCEPTED'].includes(r.status) ? 'success' : ['REJECTED'].includes(r.status) ? 'danger' : 'info'}>{r.status}</Badge>,
            },
            {
              key: 'action',
              header: 'Supervision Action',
              render: (r) => (
                <Button size="sm" variant="outline" onClick={() => handleOpenInspect(r)}>
                  <Eye size={13} style={{ marginRight: '4px' }} /> Inspect & Decide
                </Button>
              ),
            },
          ]}
          data={filteredRecords}
        />

      </Card>

      {/* 4. ADMIN INSPECTION & DISPUTE DECISION MODAL */}
      {selectedRecord && (
        <Modal
          isOpen={isInspectOpen}
          onClose={() => setIsInspectOpen(false)}
          title={`Admin Dispute Inspection & Audit Control — ${selectedRecord.discrepancyId}`}
          maxWidth="950px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* ACTION TOOLBAR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
                CURRENT DISPUTE STATUS: <Badge variant="brand">{selectedRecord.status}</Badge>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button size="sm" variant="outline" leftIcon={<UserCheck size={13} />} onClick={() => setActionType('ASSIGN')}>
                  Assign Ops
                </Button>

                <Button size="sm" variant="outline" leftIcon={<HelpCircle size={13} />} onClick={() => setActionType('REQUEST_EVIDENCE')}>
                  Request Evidence
                </Button>

                <Button size="sm" variant="outline" style={{ color: '#ef4444', borderColor: '#fca5a5' }} leftIcon={<XCircle size={13} />} onClick={() => setActionType('REJECT')}>
                  Reject Dispute
                </Button>

                <Button size="sm" variant="primary" style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }} leftIcon={<CheckCircle2 size={13} />} onClick={() => setActionType('APPROVE')}>
                  Approve & Credit Note
                </Button>
              </div>
            </div>

            {/* MERCHANT & FINANCIAL SUMMARY */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Card style={{ padding: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <strong style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Merchant Account Details</strong>
                <div style={{ fontSize: '12px', color: '#334155' }}>
                  <div>Name: <strong>{selectedRecord.merchantName}</strong></div>
                  <div>AWB: <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>{selectedRecord.awbNumber}</span> (LRN: {selectedRecord.lrnNumber})</div>
                  <div>Route: {selectedRecord.pickupWarehouse} ➔ {selectedRecord.destinationCity}</div>
                </div>
              </Card>

              <Card style={{ padding: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <strong style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Financial Impact Breakdown</strong>
                <div style={{ fontSize: '12px', color: '#334155' }}>
                  <div>Original Freight: <strong>{formatCurrency(selectedRecord.financialImpact?.originalFreightChargeINR || selectedRecord.bookedSnapshot.appliedFreightINR)}</strong></div>
                  <div>Additional Charge: <strong style={{ color: '#ef4444' }}>+{formatCurrency(selectedRecord.additionalChargeINR)}</strong></div>
                  <div>Credit Note Issued: <strong style={{ color: '#16a34a' }}>{selectedRecord.creditNoteNumber || 'Pending Decision'}</strong></div>
                </div>
              </Card>
            </div>

            {/* WEIGHT AUDIT COMPARISON */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Card style={{ padding: '14px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <strong style={{ fontSize: '13px', color: '#0284c7', display: 'block', marginBottom: '8px' }}>Booked Weight Snapshot (Frozen)</strong>
                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>Actual Weight: <strong>{selectedRecord.bookedSnapshot.actualWeightKg} KG</strong></div>
                  <div>Dimensions: <strong>{selectedRecord.bookedSnapshot.lengthCm}x{selectedRecord.bookedSnapshot.widthCm}x{selectedRecord.bookedSnapshot.heightCm} CM</strong></div>
                  <div>Chargeable Weight: <strong style={{ color: '#0284c7' }}>{selectedRecord.bookedSnapshot.chargeableWeightKg} KG</strong></div>
                </div>
              </Card>

              <Card style={{ padding: '14px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px' }}>
                <strong style={{ fontSize: '13px', color: '#e11d48', display: 'block', marginBottom: '8px' }}>Courier Reweigh Audit Record</strong>
                <div style={{ fontSize: '12px', color: '#be123c', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>Audited Actual: <strong>{selectedRecord.courierAudit.auditedActualWeightKg} KG</strong></div>
                  <div>Audited Dimensions: <strong>{selectedRecord.courierAudit.auditedLengthCm}x{selectedRecord.courierAudit.auditedWidthCm}x{selectedRecord.courierAudit.auditedHeightCm} CM</strong></div>
                  <div>Audited Chargeable: <strong>{selectedRecord.courierAudit.auditedChargeableWeightKg} KG</strong></div>
                </div>
              </Card>
            </div>

            {/* UPLOADED EVIDENCE FILES */}
            <Card style={{ padding: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>Merchant Uploaded Evidence Attachments ({selectedRecord.proofAttachments.length})</h4>
              
              {selectedRecord.proofAttachments.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                  {selectedRecord.proofAttachments.map((proof) => (
                    <div key={proof.id} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px', display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                      <img
                        src={proof.url}
                        alt={proof.name}
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                        onClick={() => setPreviewImageUrl(proof.url)}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{proof.name}</div>
                        <Badge variant="neutral" style={{ fontSize: '9px' }}>{proof.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No evidence proof files uploaded by merchant.</span>
              )}
            </Card>

            {/* MERCHANT REMARKS */}
            {selectedRecord.customerComment && (
              <Card style={{ padding: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <strong style={{ fontSize: '12px', color: '#0284c7', display: 'block', marginBottom: '4px' }}>Merchant Dispute Explanation</strong>
                <div style={{ fontSize: '12px', color: '#334155', fontStyle: 'italic' }}>"{selectedRecord.customerComment}"</div>
              </Card>
            )}

            {/* OPS INTERNAL NOTES */}
            <Card style={{ padding: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={14} /> Ops Internal Notes
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                {selectedRecord.internalNotes.map((n) => (
                  <div key={n.id} style={{ fontSize: '11px', padding: '6px 10px', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                    <strong>{n.author}</strong> ({n.createdAt}): <em>"{n.note}"</em>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Input
                  placeholder="Add internal note for Ops team..."
                  value={newInternalNote}
                  onChange={(e) => setNewInternalNote(e.target.value)}
                />
                <Button variant="outline" size="sm" onClick={handleAddInternalNote}>Add Note</Button>
              </div>
            </Card>

          </div>
        </Modal>
      )}

      {/* APPROVE DISPUTE MODAL */}
      {actionType === 'APPROVE' && selectedRecord && (
        <Modal isOpen={true} onClose={() => setActionType(null)} title="Approve Weight Dispute & Issue Credit Note" maxWidth="500px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Alert variant="info" title="Credit Note Integration">
              Approving this dispute will automatically generate Credit Note <strong>CN-2026-******</strong>, update the billing ledger, and credit <strong>₹{refundAmountInput.toFixed(2)}</strong> back to the merchant's wallet.
            </Alert>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Refund Amount (₹)</label>
              <Input type="number" value={refundAmountInput} onChange={(e) => setRefundAmountInput(Number(e.target.value))} />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Approval Decision Notes</label>
              <Textarea rows={2} value={approveNotesInput} onChange={(e) => setApproveNotesInput(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleExecuteApprove} style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
                Confirm Approval & Issue Credit Note
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* REJECT DISPUTE MODAL */}
      {actionType === 'REJECT' && selectedRecord && (
        <Modal isOpen={true} onClose={() => setActionType(null)} title="Reject Weight Dispute" maxWidth="480px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
              Reject dispute for AWB <strong>{selectedRecord.awbNumber}</strong>? Original courier charge ₹{selectedRecord.additionalChargeINR} will remain billed.
            </p>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Rejection Reason</label>
              <Textarea rows={3} value={rejectionReasonInput} onChange={(e) => setRejectionReasonInput(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleExecuteReject} style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* REQUEST EVIDENCE MODAL */}
      {actionType === 'REQUEST_EVIDENCE' && selectedRecord && (
        <Modal isOpen={true} onClose={() => setActionType(null)} title="Request Additional Proof from Merchant" maxWidth="480px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Evidence Instructions</label>
              <Textarea rows={3} value={evidenceRequestInput} onChange={(e) => setEvidenceRequestInput(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleExecuteRequestEvidence} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                Send Request
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ASSIGN STAFF MODAL */}
      {actionType === 'ASSIGN' && selectedRecord && (
        <Modal isOpen={true} onClose={() => setActionType(null)} title="Assign Ops Lead" maxWidth="450px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Ops Lead Staff Name</label>
              <Input value={staffNameInput} onChange={(e) => setStaffNameInput(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleExecuteAssignStaff} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                Assign Staff
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {previewImageUrl && (
        <Modal isOpen={!!previewImageUrl} onClose={() => setPreviewImageUrl(null)} title="Evidence Preview" maxWidth="600px">
          <div style={{ textAlign: 'center' }}>
            <img src={previewImageUrl} alt="Evidence" style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '8px' }} />
          </div>
        </Modal>
      )}

    </div>
  );
};
