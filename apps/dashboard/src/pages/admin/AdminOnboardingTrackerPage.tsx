import React, { useState } from 'react';
import { Rocket, Clock, CheckCircle2, AlertTriangle, ShieldCheck, Mail, UserPlus, FastForward, FileText, Check } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Button, Card, Badge, Table, Modal, Input, Select } from '../../components/ui';
import {
  OnboardingService,
  ONBOARDING_STAGES_CONFIG,
} from '../../services/onboardingService';
import type { CustomerOnboardingRecord } from '../../services/onboardingService';

export const AdminOnboardingTrackerPage: React.FC = () => {
  const [records, setRecords] = useState<CustomerOnboardingRecord[]>(() =>
    OnboardingService.getRecords()
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOnboardingRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignManagerName, setAssignManagerName] = useState('');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const refreshData = () => {
    setRecords(OnboardingService.getRecords());
  };

  const showNotice = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 4000);
  };

  const filteredRecords = records.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch =
      r.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerId.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const totalCustomers = records.length;
  const pendingOnboarding = records.filter((r) => !r.isGoLive).length;
  const pendingKyc = records.filter((r) => r.status === 'PENDING_KYC' || !r.isKycApproved).length;
  const readyForGoLive = records.filter((r) => r.status === 'READY_FOR_GOLIVE').length;
  const liveCustomers = records.filter((r) => r.isGoLive).length;

  const handleMarkComplete = (customerId: string, stageNum: number) => {
    const updated = OnboardingService.markStageComplete(customerId, stageNum);
    refreshData();
    if (selectedCustomer?.customerId === customerId) setSelectedCustomer(updated);
    showNotice(`Stage ${stageNum} marked complete for ${updated.companyName}`);
  };

  const handleSkipStep = (customerId: string, stageNum: number) => {
    const updated = OnboardingService.skipStage(customerId, stageNum);
    refreshData();
    if (selectedCustomer?.customerId === customerId) setSelectedCustomer(updated);
    showNotice(`Stage ${stageNum} skipped for ${updated.companyName}`);
  };

  const handleForceGoLive = (customerId: string) => {
    const updated = OnboardingService.forceGoLive(customerId);
    refreshData();
    if (selectedCustomer?.customerId === customerId) setSelectedCustomer(updated);
    showNotice(`🚀 Account ${updated.companyName} forcibly set to GO-LIVE!`);
  };

  const handleSendReminder = (companyName: string) => {
    showNotice(`✉️ Automated onboarding reminder sent to ${companyName}`);
  };

  const handleConfirmAssignManager = () => {
    if (selectedCustomer && assignManagerName.trim()) {
      OnboardingService.assignAccountManager(selectedCustomer.customerId, assignManagerName.trim());
      refreshData();
      setIsAssignModalOpen(false);
      showNotice(`Account Manager ${assignManagerName} assigned to ${selectedCustomer.companyName}`);
    }
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Customer Management', path: '/admin/customers' },
    { label: 'Onboarding Tracker Engine', path: '/admin/onboarding' },
  ];

  const getStatusBadgeVariant = (status: CustomerOnboardingRecord['status']) => {
    switch (status) {
      case 'LIVE':
        return 'success';
      case 'READY_FOR_GOLIVE':
        return 'warning';
      case 'PENDING_KYC':
        return 'danger';
      case 'PENDING_SETUP':
        return 'brand';
      default:
        return 'neutral';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      <PageHeader
        title="Customer Onboarding Automation Center"
        description="Monitor merchant onboarding progression through 9 defined stages from signup to live shipment booking."
        breadcrumbs={breadcrumbs}
      />

      {toastNotice && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-md)',
            color: '#166534',
            fontSize: '13px',
            fontWeight: 'bold',
          }}
        >
          {toastNotice}
        </div>
      )}

      {/* 1. TOP 5 DASHBOARD KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Total Registered Merchants" value={totalCustomers} subtext="All customer accounts" icon={ShieldCheck} />
        <StatCard label="Pending Onboarding" value={pendingOnboarding} subtext="Stages 1 to 8 incomplete" icon={Clock} />
        <StatCard label="Pending KYC Approval" value={pendingKyc} subtext="Compliance review desk" icon={AlertTriangle} />
        <StatCard label="Ready For Go-Live" value={readyForGoLive} subtext=">= 85% complete accounts" icon={CheckCircle2} />
        <StatCard label="Live Operating Accounts" value={liveCustomers} subtext="Active shipment bookers" icon={Rocket} />
      </div>

      {/* 2. ONBOARDING TRACKER TABLE & FILTERS */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ width: '240px' }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { label: 'All Onboarding Statuses', value: 'ALL' },
                  { label: 'Live Accounts (100%)', value: 'LIVE' },
                  { label: 'Ready For Go-Live', value: 'READY_FOR_GOLIVE' },
                  { label: 'Pending KYC Verification', value: 'PENDING_KYC' },
                  { label: 'Pending Profile Setup', value: 'PENDING_SETUP' },
                ]}
              />
            </div>
          </div>

          <div style={{ width: '280px' }}>
            <Input
              placeholder="Search customer, ID, email, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table<CustomerOnboardingRecord>
          keyExtractor={(r) => r.customerId}
          columns={[
            {
              key: 'companyName',
              header: 'Merchant & Contact',
              render: (r) => (
                <div>
                  <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{r.companyName}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    ID: <code>{r.customerId}</code> • {r.contactPerson}
                  </div>
                </div>
              ),
            },
            {
              key: 'currentStageTitle',
              header: 'Current Onboarding Stage',
              render: (r) => (
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-violet-main)' }}>
                    Stage {r.currentStageNumber}: {r.currentStageTitle}
                  </span>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    GST: {r.gstNumber}
                  </div>
                </div>
              ),
            },
            {
              key: 'completionPercentage',
              header: 'Progress %',
              render: (r) => (
                <div style={{ minWidth: '120px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold' }}>
                    <span>{r.completionPercentage}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginTop: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${r.completionPercentage}%`,
                        height: '100%',
                        backgroundColor: r.isGoLive ? '#22c55e' : '#3b82f6',
                      }}
                    />
                  </div>
                </div>
              ),
            },
            {
              key: 'assignedManager',
              header: 'Account Manager',
              render: (r) => (
                <Badge variant={r.assignedManager === 'Unassigned' ? 'neutral' : 'brand'}>
                  {r.assignedManager}
                </Badge>
              ),
            },
            {
              key: 'status',
              header: 'Onboarding Status',
              render: (r) => (
                <Badge variant={getStatusBadgeVariant(r.status)}>
                  {r.status.replace(/_/g, ' ')}
                </Badge>
              ),
            },
            {
              key: 'expectedGoLiveDate',
              header: 'Target Go-Live',
              render: (r) => <span style={{ fontSize: '12px' }}>{r.expectedGoLiveDate}</span>,
            },
            {
              key: 'actions',
              header: 'Admin Actions',
              render: (r) => (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<FileText size={12} />}
                    onClick={() => {
                      setSelectedCustomer(r);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    Journey View
                  </Button>

                  {!r.isGoLive && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Mail size={12} />}
                        onClick={() => handleSendReminder(r.companyName)}
                      >
                        Remind
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Rocket size={12} />}
                        onClick={() => handleForceGoLive(r.customerId)}
                      >
                        Force Go-Live
                      </Button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
          data={filteredRecords}
        />
      </Card>

      {/* 3. INTERACTIVE 9-STAGE JOURNEY DETAIL MODAL */}
      {selectedCustomer && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Onboarding Journey: ${selectedCustomer.companyName} (${selectedCustomer.customerId})`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '75vh', overflowY: 'auto' }}>
            {/* Quick Customer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
              <div>
                <strong style={{ fontSize: '14px' }}>{selectedCustomer.companyName}</strong>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Email: {selectedCustomer.email} • Mobile: {selectedCustomer.mobile}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<UserPlus size={12} />}
                  onClick={() => setIsAssignModalOpen(true)}
                >
                  {selectedCustomer.assignedManager === 'Unassigned' ? 'Assign Manager' : 'Reassign KAM'}
                </Button>
                {!selectedCustomer.isGoLive && (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Rocket size={12} />}
                    onClick={() => handleForceGoLive(selectedCustomer.customerId)}
                  >
                    Force Go-Live
                  </Button>
                )}
              </div>
            </div>

            {/* 9 Stages Grid */}
            <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: '8px 0 0 0' }}>
              9-Stage Automated Workflow Grid ({selectedCustomer.completionPercentage}% Complete)
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ONBOARDING_STAGES_CONFIG.map((cfg) => {
                const st = selectedCustomer.stages.find((s) => s.stageNumber === cfg.stageNumber);
                const isComplete = Boolean(st?.isComplete);

                return (
                  <div
                    key={cfg.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: isComplete ? '1px solid #bbf7d0' : '1px solid #cbd5e1',
                      backgroundColor: isComplete ? '#f0fdf4' : '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: isComplete ? '#22c55e' : '#cbd5e1',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 'bold',
                        }}
                      >
                        {isComplete ? <Check size={14} /> : cfg.stageNumber}
                      </div>
                      <div>
                        <strong style={{ fontSize: '13px' }}>
                          Stage {cfg.stageNumber}: {cfg.title}
                        </strong>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          {st?.completedAt ? `Completed on ${st.completedAt}` : cfg.description}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {!isComplete ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<CheckCircle2 size={12} />}
                            onClick={() => handleMarkComplete(selectedCustomer.customerId, cfg.stageNumber)}
                          >
                            Mark Done
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<FastForward size={12} />}
                            onClick={() => handleSkipStep(selectedCustomer.customerId, cfg.stageNumber)}
                          >
                            Skip
                          </Button>
                        </>
                      ) : (
                        <Badge variant="success">Verified</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* 4. ASSIGN MANAGER MODAL */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Key Account Manager (KAM)"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
              Select Account Manager *
            </label>
            <Select
              value={assignManagerName}
              onChange={(e) => setAssignManagerName(e.target.value)}
              options={[
                { label: '-- Select KAM --', value: '' },
                { label: 'Vikram Singh (Senior KAM)', value: 'Vikram Singh (KAM)' },
                { label: 'Priya Sharma (Enterprise Lead)', value: 'Priya Sharma (KAM)' },
                { label: 'Rohan Verma (Growth Manager)', value: 'Rohan Verma (KAM)' },
                { label: 'Amit Kumar (Technical Onboarding)', value: 'Amit Kumar (KAM)' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmAssignManager}>
              Confirm Assignment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
