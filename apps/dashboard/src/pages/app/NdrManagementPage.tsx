import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  Edit3,
  XCircle,
  Send,
  Search,
  FileSpreadsheet,
  MessageSquare,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Input,
  Alert,
  Select,
  Drawer,
  Pagination,
  TableSkeleton,
} from '../../components/ui';
import {
  ShipmentTrackingNdrRtoService,
  type NdrRecord,
} from '../../services/shipmentTrackingNdrRtoService';
import { useTenant } from '../../context/TenantContext';

export const NdrManagementPage: React.FC = () => {
  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId;

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [courierFilter, setCourierFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'last7' | 'last30'>('all');

  // Pagination & Drawer State
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNdr, setSelectedNdr] = useState<NdrRecord | null>(null);
  const [modalActionTab, setModalActionTab] = useState<'REATTEMPT' | 'UPDATE_ADDRESS_PHONE' | 'CONVERT_TO_PREPAID' | 'NOTE' | 'RTO'>('REATTEMPT');

  // Form Fields
  const [preferredDate, setPreferredDate] = useState('Tomorrow');
  const [instructions, setInstructions] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [updatedPhone, setUpdatedPhone] = useState('');
  const [updatedAddress, setUpdatedAddress] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRefreshNdr = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
  };

  // Operational Summary Stats
  const summaryStats = useMemo(() => {
    return ShipmentTrackingNdrRtoService.getNdrSummaryStats(tenantId);
  }, [tenantId]);

  // Query Filtered NDR Cases
  const filteredRecords = useMemo(() => {
    return ShipmentTrackingNdrRtoService.queryNdrRecords({
      tenantId,
      searchQuery,
      statusFilter: activeStatusFilter,
      reasonFilter,
      courierFilter,
    });
  }, [tenantId, searchQuery, activeStatusFilter, reasonFilter, courierFilter]);

  // Pagination Math
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveStatusFilter('all');
    setReasonFilter('all');
    setCourierFilter('all');
    setDateRange('all');
    setCurrentPage(1);
  };

  // Open Action Modal / Drawer
  const handleOpenActionModal = (ndr: NdrRecord, defaultTab: 'REATTEMPT' | 'UPDATE_ADDRESS_PHONE' | 'CONVERT_TO_PREPAID' | 'NOTE' | 'RTO' = 'REATTEMPT') => {
    setSelectedNdr(ndr);
    setModalActionTab(defaultTab);
    setPreferredDate('Tomorrow');
    setInstructions((ndr as any).deliveryInstructions || '');
    setRecipientName((ndr as any).recipientName || 'Buyer');
    setUpdatedPhone((ndr as any).updatedPhone || (ndr as any).recipientPhone || '');
    setUpdatedAddress((ndr as any).updatedAddress || '');
    setInternalNoteText('');
  };

  // Submit NDR Resolution Action
  const handleSubmitNdrAction = () => {
    if (!selectedNdr) return;

    if (modalActionTab === 'NOTE') {
      if (!internalNoteText.trim()) {
        setToastMessage('Please enter an internal note before saving.');
        setTimeout(() => setToastMessage(null), 4000);
        return;
      }
      const res = ShipmentTrackingNdrRtoService.addInternalNote(selectedNdr.ndrId, internalNoteText.trim(), 'Merchant Agent', tenantId);
      setSelectedNdr({ ...selectedNdr });
      setInternalNoteText('');
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const res = ShipmentTrackingNdrRtoService.requestReattempt({
      ndrId: selectedNdr.ndrId,
      actionType: modalActionTab as 'REATTEMPT' | 'UPDATE_ADDRESS_PHONE' | 'CONVERT_TO_PREPAID' | 'RTO',
      preferredDeliveryDate: preferredDate,
      deliveryInstructions: instructions,
      recipientName,
      updatedPhone,
      updatedAddress,
      tenantId,
    });

    setSelectedNdr(null);
    setToastMessage(res.message);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Export NDR Report CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      setToastMessage('No NDR exception cases to export for the active filters.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const headers = [
      'NDR ID',
      'Shipment ID',
      'AWB Number',
      'Recipient Name',
      'Recipient Phone',
      'Courier Partner',
      'NDR Exception Reason',
      'Attempt Count',
      'NDR Date',
      'Status',
    ];

    const rows = filteredRecords.map((r) => [
      r.ndrId,
      r.shipmentId,
      r.awbNumber,
      `"${r.recipientName || 'Buyer'}"`,
      r.recipientPhone || 'N/A',
      r.courierName,
      `"${r.ndrReason}"`,
      r.attemptNumber,
      r.ndrDate,
      r.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `NDR_Exceptions_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'NDR Exception Management Console', path: '/app/ndr' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="NDR Management"
        description="Manage delivery exceptions and take action before shipments move to RTO."
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<FileSpreadsheet size={15} />}>
            Export NDR Report
          </Button>
        }
      />

      {toastMessage && (
        <Alert variant="success" title="NDR Action Processed">
          {toastMessage}
        </Alert>
      )}

      {/* 2. OPERATIONAL SUMMARY STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
        <div onClick={() => { setActiveStatusFilter('all'); setCurrentPage(1); }} style={{ cursor: 'pointer' }}>
          <StatCard label="Total NDR" value={summaryStats.totalNdr} subtext="Delivery exception failures" badgeText={activeStatusFilter === 'all' ? 'ACTIVE' : undefined} badgeVariant="brand" icon={AlertTriangle} />
        </div>
        <div onClick={() => { setActiveStatusFilter('ACTION_REQUIRED'); setCurrentPage(1); }} style={{ cursor: 'pointer' }}>
          <StatCard label="Action Required" value={summaryStats.actionRequired} subtext="Requires response" badgeText={activeStatusFilter === 'ACTION_REQUIRED' ? 'HIGH PRIORITY' : undefined} badgeVariant="warning" icon={Clock} />
        </div>
        <div onClick={() => { setActiveStatusFilter('REATTEMPT_REQUESTED'); setCurrentPage(1); }} style={{ cursor: 'pointer' }}>
          <StatCard label="Reattempt Requested" value={summaryStats.reattemptRequested} subtext="Submitted to rider" badgeText={activeStatusFilter === 'REATTEMPT_REQUESTED' ? 'ACTIVE' : undefined} badgeVariant="brand" icon={RotateCcw} />
        </div>
        <div onClick={() => { setActiveStatusFilter('RTO'); setCurrentPage(1); }} style={{ cursor: 'pointer' }}>
          <StatCard label="RTO Risk (High)" value={summaryStats.rtoRiskHigh} subtext="Approaching RTO threshold" badgeText={activeStatusFilter === 'RTO' ? 'CRITICAL' : undefined} badgeVariant="danger" icon={XCircle} />
        </div>
        <div onClick={() => { setActiveStatusFilter('RESOLVED'); setCurrentPage(1); }} style={{ cursor: 'pointer' }}>
          <StatCard label="Resolved" value={summaryStats.resolved} subtext="Delivered post reattempt" badgeText={activeStatusFilter === 'RESOLVED' ? 'ACTIVE' : undefined} badgeVariant="success" icon={CheckCircle2} />
        </div>
      </div>

      {/* 3. PROMINENT SEARCH BAR */}
      <Card style={{ padding: 'var(--space-3.5)' }}>
        <Input
          placeholder="Search AWB, Order ID, Consignee, Mobile..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          leadingIcon={<Search size={16} />}
        />
      </Card>

      {/* 4. HORIZONTAL FILTER BAR */}
      <Card style={{ padding: 'var(--space-3.5)' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status Filter */}
          <div style={{ width: '180px' }}>
            <Select
              value={activeStatusFilter}
              onChange={(e) => { setActiveStatusFilter(e.target.value); setCurrentPage(1); }}
              options={[
                { label: 'Status: All', value: 'all' },
                { label: 'Action Required', value: 'ACTION_REQUIRED' },
                { label: 'Reattempt Requested', value: 'REATTEMPT_REQUESTED' },
                { label: 'Resolved', value: 'RESOLVED' },
                { label: 'RTO Initiated', value: 'RTO' },
              ]}
            />
          </div>

          {/* Reason Filter */}
          <div style={{ width: '190px' }}>
            <Select
              value={reasonFilter}
              onChange={(e) => { setReasonFilter(e.target.value); setCurrentPage(1); }}
              options={[
                { label: 'Reason: All Exceptions', value: 'all' },
                { label: 'Customer unavailable', value: 'Customer unavailable' },
                { label: 'Incomplete address', value: 'Incomplete address' },
                { label: 'Customer refused', value: 'Customer refused' },
                { label: 'COD issue', value: 'COD issue' },
                { label: 'Phone unreachable', value: 'Phone unreachable' },
              ]}
            />
          </div>

          {/* Courier Filter */}
          <div style={{ width: '170px' }}>
            <Select
              value={courierFilter}
              onChange={(e) => { setCourierFilter(e.target.value); setCurrentPage(1); }}
              options={[
                { label: 'Courier: All', value: 'all' },
                { label: 'Delhivery Surface', value: 'delhivery' },
                { label: 'Blue Dart Air', value: 'bluedart' },
                { label: 'DTDC Express', value: 'dtdc' },
                { label: 'Xpressbees', value: 'xpressbees' },
              ]}
            />
          </div>

          {/* Date Range Filter */}
          <div style={{ width: '150px' }}>
            <Select
              value={dateRange}
              onChange={(e) => { setDateRange(e.target.value as any); setCurrentPage(1); }}
              options={[
                { label: 'Date: All Time', value: 'all' },
                { label: 'Today', value: 'today' },
                { label: 'Last 7 Days', value: 'last7' },
                { label: 'Last 30 Days', value: 'last30' },
              ]}
            />
          </div>

          {/* Reset Filters */}
          <Button variant="ghost" size="sm" onClick={() => { handleResetFilters(); handleRefreshNdr(); }} leftIcon={<RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />}>
            Reset Filters
          </Button>
        </div>
      </Card>

      {/* 5. NDR OPERATIONS TABLE */}
      <Card style={{ padding: 'var(--space-4)' }}>
        {isLoading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : (
          <>
            <Table<NdrRecord>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'ndrId',
              header: 'NDR ID & Shipment',
              render: (r) => (
                <div>
                  <strong
                    style={{ color: 'var(--color-violet-main)', cursor: 'pointer', fontFamily: 'monospace' }}
                    onClick={() => handleOpenActionModal(r, 'REATTEMPT')}
                  >
                    {r.ndrId}
                  </strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    Shipment: <strong>{r.shipmentId}</strong> (AWB: {r.awbNumber})
                  </div>
                </div>
              ),
            },
            {
              key: 'recipientName',
              header: 'Consignee',
              render: (r) => (
                <div>
                  <strong style={{ fontSize: '13px' }}>{r.recipientName || 'Buyer'}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    📞 {r.updatedPhone || r.recipientPhone || 'N/A'}
                  </div>
                </div>
              ),
            },
            { key: 'courierName', header: 'Courier', render: (r) => <Badge variant="brand">{r.courierName}</Badge> },
            {
              key: 'ndrReason',
              header: 'NDR Exception Reason',
              render: (r) => (
                <div>
                  <strong style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{r.ndrReason}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {r.attemptNumber === 1 ? '1st Attempt Failed' : `${r.attemptNumber}nd Attempt Failed`}
                  </div>
                </div>
              ),
            },
            {
              key: 'rtoRisk',
              header: 'RTO Risk',
              render: (r) => {
                const isHigh = r.attemptNumber >= 2 || (r.status as string).startsWith('RTO');
                return (
                  <Badge variant={isHigh ? 'danger' : 'warning'}>
                    {isHigh ? 'HIGH RISK' : 'MEDIUM RISK'}
                  </Badge>
                );
              },
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => (
                <div>
                  <Badge variant={r.status === 'CUSTOMER_ACTION_REQUIRED' ? 'danger' : r.status === 'REATTEMPT_REQUESTED' ? 'warning' : 'success'}>
                    {r.status}
                  </Badge>
                  {r.paymentTypeChange === 'CONVERT_TO_PREPAID' && (
                    <div style={{ fontSize: '10px', color: 'var(--color-success)', fontWeight: 'bold', marginTop: '2px' }}>
                      💳 CONVERTED TO PREPAID
                    </div>
                  )}
                </div>
              ),
            },
            { key: 'ndrDate', header: 'NDR Date', render: (r) => <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{r.ndrDate}</span> },
            {
              key: 'actions',
              header: 'Actions',
              render: (r) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {r.status === 'CUSTOMER_ACTION_REQUIRED' ? (
                    <Button variant="primary" size="sm" onClick={() => handleOpenActionModal(r, 'REATTEMPT')}>
                      Resolve NDR
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleOpenActionModal(r, 'REATTEMPT')}>
                      View Details
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={paginatedRecords}
        />

        {/* Pagination Controls */}
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Showing {filteredRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
            {Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length} NDR cases
          </span>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </>
    )}
  </Card>

      {/* 6. NDR ACTION CENTER SIDE DRAWER / MODAL */}
      {selectedNdr && (
        <Drawer
          isOpen={!!selectedNdr}
          onClose={() => setSelectedNdr(null)}
          title={`NDR Resolution Console — ${selectedNdr.ndrId} (${selectedNdr.awbNumber})`}
          position="right"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px' }}>
            {/* RTO Risk Warning */}
            {selectedNdr.attemptNumber >= 2 && (
              <Alert variant="danger" title="High RTO Risk Warning">
                This shipment has failed {selectedNdr.attemptNumber} delivery attempts. It will move to Return To Origin (RTO) if the next attempt fails. Take immediate resolution action below!
              </Alert>
            )}

            {/* Exception Info Strip */}
            <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Shipment: <strong>{selectedNdr.shipmentId}</strong></span>
                <Badge variant="danger">Attempt #{selectedNdr.attemptNumber} Failed</Badge>
              </div>
              <div>Courier: <strong>{selectedNdr.courierName}</strong></div>
              <div>Scan Reason: <strong style={{ color: 'var(--color-danger)' }}>{selectedNdr.ndrReason}</strong></div>
              <div>Consignee: <strong>{selectedNdr.recipientName || 'Buyer'}</strong> ({selectedNdr.updatedPhone || selectedNdr.recipientPhone})</div>
            </div>

            {/* Action Selection Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              <button
                onClick={() => setModalActionTab('REATTEMPT')}
                style={{
                  padding: '6px 4px',
                  borderRadius: '4px',
                  border: modalActionTab === 'REATTEMPT' ? '2px solid var(--color-violet-main)' : '1px solid var(--color-border)',
                  backgroundColor: modalActionTab === 'REATTEMPT' ? 'var(--color-violet-light)' : 'var(--color-surface)',
                  color: modalActionTab === 'REATTEMPT' ? 'var(--color-violet-main)' : 'var(--color-text-secondary)',
                  fontWeight: 'bold',
                  fontSize: '10px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                🔄 Re-attempt
              </button>

              <button
                onClick={() => setModalActionTab('UPDATE_ADDRESS_PHONE')}
                style={{
                  padding: '6px 4px',
                  borderRadius: '4px',
                  border: modalActionTab === 'UPDATE_ADDRESS_PHONE' ? '2px solid var(--color-violet-main)' : '1px solid var(--color-border)',
                  backgroundColor: modalActionTab === 'UPDATE_ADDRESS_PHONE' ? 'var(--color-violet-light)' : 'var(--color-surface)',
                  color: modalActionTab === 'UPDATE_ADDRESS_PHONE' ? 'var(--color-violet-main)' : 'var(--color-text-secondary)',
                  fontWeight: 'bold',
                  fontSize: '10px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                ✏️ Edit Info
              </button>

              <button
                onClick={() => setModalActionTab('CONVERT_TO_PREPAID')}
                style={{
                  padding: '6px 4px',
                  borderRadius: '4px',
                  border: modalActionTab === 'CONVERT_TO_PREPAID' ? '2px solid var(--color-success)' : '1px solid var(--color-border)',
                  backgroundColor: modalActionTab === 'CONVERT_TO_PREPAID' ? '#f0fdf4' : 'var(--color-surface)',
                  color: modalActionTab === 'CONVERT_TO_PREPAID' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                  fontWeight: 'bold',
                  fontSize: '10px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                💳 Prepaid
              </button>

              <button
                onClick={() => setModalActionTab('NOTE')}
                style={{
                  padding: '6px 4px',
                  borderRadius: '4px',
                  border: modalActionTab === 'NOTE' ? '2px solid var(--color-violet-main)' : '1px solid var(--color-border)',
                  backgroundColor: modalActionTab === 'NOTE' ? 'var(--color-violet-light)' : 'var(--color-surface)',
                  color: modalActionTab === 'NOTE' ? 'var(--color-violet-main)' : 'var(--color-text-secondary)',
                  fontWeight: 'bold',
                  fontSize: '10px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                📝 Note
              </button>

              <button
                onClick={() => setModalActionTab('RTO')}
                style={{
                  padding: '6px 4px',
                  borderRadius: '4px',
                  border: modalActionTab === 'RTO' ? '2px solid var(--color-danger)' : '1px solid var(--color-border)',
                  backgroundColor: modalActionTab === 'RTO' ? '#fef2f2' : 'var(--color-surface)',
                  color: modalActionTab === 'RTO' ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                  fontWeight: 'bold',
                  fontSize: '10px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                ⛔ RTO Return
              </button>
            </div>

            {/* TAB 1: REATTEMPT DELIVERY */}
            {modalActionTab === 'REATTEMPT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Select
                  label="Preferred Re-Attempt Date *"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  options={[
                    { value: 'Today', label: 'Today (Same Day Re-Attempt)' },
                    { value: 'Tomorrow', label: 'Tomorrow' },
                    { value: 'Day After Tomorrow', label: 'Day After Tomorrow' },
                  ]}
                />

                <Input
                  label="Special Rider Instructions (Optional)"
                  placeholder="e.g. Call customer before delivery, deliver after 4 PM..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />

                <Button variant="primary" size="md" leftIcon={<RefreshCw size={16} />} onClick={handleSubmitNdrAction}>
                  Submit Re-Attempt Request to {selectedNdr.courierName}
                </Button>
              </div>
            )}

            {/* TAB 2: UPDATE BUYER PHONE & ADDRESS */}
            {modalActionTab === 'UPDATE_ADDRESS_PHONE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Input
                  label="Recipient Full Name"
                  placeholder="Enter recipient name..."
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />

                <Input
                  label="Alternate Phone Number"
                  placeholder="+91 98XXX XXXXX"
                  value={updatedPhone}
                  onChange={(e) => setUpdatedPhone(e.target.value)}
                />

                <Input
                  label="Corrected Delivery Address & Landmark"
                  placeholder="Enter complete building name, flat #, street, landmark..."
                  value={updatedAddress}
                  onChange={(e) => setUpdatedAddress(e.target.value)}
                />

                <Button variant="primary" size="md" leftIcon={<Edit3 size={16} />} onClick={handleSubmitNdrAction}>
                  Update Buyer Address & Schedule Re-Attempt
                </Button>
              </div>
            )}

            {/* TAB 3: CONVERT COD TO PREPAID */}
            {modalActionTab === 'CONVERT_TO_PREPAID' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Alert variant="success" title="Convert COD to Prepaid via Instant UPI Link">
                  Generate an instant payment link for the recipient. Once paid, the rider delivers without asking for cash.
                </Alert>

                <Button variant="primary" size="md" leftIcon={<Send size={16} />} onClick={handleSubmitNdrAction} style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
                  Convert to Prepaid & Send Payment Link
                </Button>
              </div>
            )}

            {/* TAB 4: ADD INTERNAL MERCHANT NOTE */}
            {modalActionTab === 'NOTE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Input
                  label="Add Internal Merchant Contact Note"
                  placeholder="e.g. Spoke with customer. Customer requested delivery tomorrow after 5 PM."
                  value={internalNoteText}
                  onChange={(e) => setInternalNoteText(e.target.value)}
                />

                <Button variant="primary" size="md" leftIcon={<MessageSquare size={16} />} onClick={handleSubmitNdrAction}>
                  Save Internal Note
                </Button>
              </div>
            )}

            {/* TAB 5: INITIATE RTO */}
            {modalActionTab === 'RTO' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Alert variant="warning" title="Initiate Return to Origin (RTO)">
                  This will cancel further delivery attempts and instruct {selectedNdr.courierName} to return the parcel to pickup location.
                </Alert>

                <Button variant="primary" size="md" leftIcon={<XCircle size={16} />} onClick={handleSubmitNdrAction} style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                  Confirm & Initiate Immediate RTO Return
                </Button>
              </div>
            )}

            {/* Internal Contact Notes Section */}
            {(selectedNdr as any).internalNotes && (selectedNdr as any).internalNotes.length > 0 && (
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Internal Merchant Notes</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  {(selectedNdr as any).internalNotes.map((n: any, idx: number) => (
                    <div key={idx} style={{ padding: '8px', borderRadius: '4px', backgroundColor: 'var(--color-surface-secondary)' }}>
                      <strong>{n.user}</strong> ({n.timestamp}):
                      <div style={{ color: 'var(--color-text-secondary)' }}>{n.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attempt Scans & NDR Audit Log */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Attempt Scans & NDR Audit Log</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                {selectedNdr.attemptsHistory.map((h, i) => (
                  <div key={i} style={{ padding: '8px 10px', borderRadius: '4px', backgroundColor: 'var(--color-surface-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>Attempt #{h.attemptNumber}</strong> — <span style={{ color: 'var(--color-danger)' }}>{h.rawStatus}</span>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Location: {h.location}</div>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{h.attemptDate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
