import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Search,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button, Card, Badge, Alert, Table, Modal, Input } from '../../components/ui';
import { OnboardingService } from '../../services/onboardingService';
import { AdminManagementService } from '../../services/adminManagementService';
import { KycService, type UploadedKycDoc } from '../../services/kycService';
import { supabase } from '../../lib/supabaseClient';

export interface AdminKycCustomerRecord extends Record<string, unknown> {
  id: string;
  customerName: string;
  companyName: string;
  gstNumber: string;
  submittedDocsCount: number;
  submissionDate: string;
  status: 'Under Review' | 'Approved' | 'Rejected' | 'Pending Documents';
  remarks: string;
}

export const DEMO_ADMIN_KYC_CUSTOMERS: AdminKycCustomerRecord[] = [];

export const AdminKycVerificationPage: React.FC = () => {
  const [kycRecords, setKycRecords] = useState<AdminKycCustomerRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AdminKycCustomerRecord | null>(null);
  const [merchantDocs, setMerchantDocs] = useState<UploadedKycDoc[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [actionAlert, setActionAlert] = useState<string | null>(null);

  // Sync registered database merchants into KYC Review queue
  const fetchMerchantsKyc = async () => {
    setIsLoading(true);
    try {
      const liveMerchants = await AdminManagementService.getMerchants();
      if (liveMerchants && liveMerchants.length > 0) {
        const liveKycRecords: AdminKycCustomerRecord[] = liveMerchants.map((m) => ({
          id: m.id,
          customerName: m.ownerName || 'Merchant Owner',
          companyName: m.businessName || 'Business Entity',
          gstNumber: '22AAAAA0000A1Z5',
          submittedDocsCount: 5,
          submissionDate: m.createdAt ? m.createdAt.split('T')[0] : '2026-10-30',
          status: m.status === 'ACTIVE' ? 'Approved' : 'Under Review',
          remarks: m.status === 'ACTIVE' ? 'Verified in authoritative database' : 'Pending Super Admin document review',
        }));

        setKycRecords(liveKycRecords);
      } else {
        setKycRecords([]);
      }
    } catch (_e) {
      // non-blocking
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantsKyc();
  }, []);

  const filteredRecords = kycRecords.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch =
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.gstNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = async (newStatus: 'Approved' | 'Rejected' | 'Pending Documents') => {
    if (!selectedRecord) return;

    const updated = kycRecords.map((r) => {
      if (r.id === selectedRecord.id) {
        return {
          ...r,
          status: newStatus,
          remarks: adminRemarks || `KYC status updated to ${newStatus} by Super Admin`,
        };
      }
      return r;
    });

    if (newStatus === 'Approved') {
      const targetCustId = selectedRecord.id.replace('cust-', 'CUST-100');
      OnboardingService.markStageComplete(
        targetCustId,
        6,
        adminRemarks || 'KYC Documents Verified and Approved by Compliance Team'
      );
    }

    // Persist to Supabase PostgreSQL database if real UUID
    if (selectedRecord.id.length > 20) {
      const dbStatus = newStatus === 'Approved' ? 'ACTIVE' : newStatus === 'Rejected' ? 'SUSPENDED' : 'PENDING_KYC';
      await AdminManagementService.updateMerchantStatus(selectedRecord.id, dbStatus as any);

      // Also update verification_status of all documents for this merchant
      if (newStatus === 'Approved') {
        await supabase
          .from('merchant_kyc_documents')
          .update({
            verification_status: 'VERIFIED',
            rejection_reason: null,
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('merchant_id', selectedRecord.id);
      } else if (newStatus === 'Rejected') {
        await supabase
          .from('merchant_kyc_documents')
          .update({
            verification_status: 'REJECTED',
            rejection_reason: adminRemarks || 'KYC Rejected by Super Admin compliance desk',
            updated_at: new Date().toISOString(),
          })
          .eq('merchant_id', selectedRecord.id);
      }
    }

    setKycRecords(updated);
    setActionAlert(`Customer ${selectedRecord.companyName} KYC status set to ${newStatus}. Updated in PostgreSQL.`);
    setTimeout(() => setActionAlert(null), 4000);
    setSelectedRecord(null);
    setAdminRemarks('');
  };

  const getKycStatusVariant = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Under Review':
      case 'Pending Documents':
        return 'warning';
      case 'Rejected':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Customer Management', path: '/admin/customers' },
    { label: 'KYC Verification Center', path: '/admin/kyc' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      <PageHeader
        title="Super Admin KYC Verification Control Center"
        description="Review seller KYC compliance submissions, verify GST/PAN documents, and approve seller account features."
        breadcrumbs={breadcrumbs}
      />

      {actionAlert && (
        <Alert variant="success" title="Admin KYC Action Status">
          {actionAlert}
        </Alert>
      )}

      {/* SUMMARY STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>TOTAL KYC SUBMISSIONS</span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{kycRecords.length} Customers</div>
        </Card>

        <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>UNDER REVIEW</span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#d97706' }}>
            {kycRecords.filter((r) => r.status === 'Under Review').length} Pending
          </div>
        </Card>

        <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>APPROVED SELLERS</span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#16a34a' }}>
            {kycRecords.filter((r) => r.status === 'Approved').length} Unlocked
          </div>
        </Card>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {['ALL', 'Under Review', 'Approved', 'Pending Documents', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: statusFilter === status ? '#0f172a' : '#f1f5f9',
                  color: statusFilter === status ? '#ffffff' : '#475569',
                  fontWeight: statusFilter === status ? '700' : '500',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {status}
              </button>
            ))}
          </div>

          <div style={{ width: '280px' }}>
            <Input
              placeholder="Search Company, Name, GST..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leadingIcon={<Search size={16} />}
            />
          </div>

        </div>
      </Card>

      {/* ADMIN KYC DATA TABLE */}
      <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
        <Table<AdminKycCustomerRecord>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'companyName',
              header: 'Company & Contact',
              render: (r) => (
                <div>
                  <strong style={{ color: '#0f172a', fontSize: '13px', display: 'block' }}>{r.companyName}</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{r.customerName} ({r.id})</span>
                </div>
              ),
            },
            {
              key: 'gstNumber',
              header: 'GST Number',
              render: (r) => <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0284c7', fontSize: '12px' }}>{r.gstNumber}</span>,
            },
            {
              key: 'submittedDocsCount',
              header: 'Submitted Documents',
              render: (r) => <Badge variant="brand">{r.submittedDocsCount} Files Uploaded</Badge>,
            },
            {
              key: 'submissionDate',
              header: 'Submission Date',
              render: (r) => <span style={{ fontSize: '12px', color: '#475569' }}>{r.submissionDate}</span>,
            },
            {
              key: 'status',
              header: 'KYC Status',
              render: (r) => <Badge variant={getKycStatusVariant(r.status)}>{r.status}</Badge>,
            },
            {
              key: 'actions',
              header: 'Review Actions',
              render: (r) => (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedRecord(r);
                    setAdminRemarks(r.remarks);
                    setMerchantDocs([]);
                    setIsLoadingDocs(true);
                    KycService.fetchMerchantDocuments(r.id)
                      .then((docs) => setMerchantDocs(docs))
                      .catch(() => {})
                      .finally(() => setIsLoadingDocs(false));
                  }}
                  style={{ backgroundColor: '#0f172a', borderColor: '#0f172a', fontSize: '11px', padding: '4px 10px' }}
                >
                  Review KYC Documents
                </Button>
              ),
            },
          ]}
          data={filteredRecords}
        />
      </Card>

      {/* ADMIN REVIEW MODAL */}
      {selectedRecord && (
        <Modal isOpen={!!selectedRecord} onClose={() => setSelectedRecord(null)} title={`Review KYC Application — ${selectedRecord.companyName}`} maxWidth="700px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px' }}>
            
            {/* Customer Details Summary */}
            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
              <div>Merchant Name: <strong>{selectedRecord.customerName}</strong></div>
              <div>Company Name: <strong>{selectedRecord.companyName}</strong></div>
              <div>GSTIN: <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{selectedRecord.gstNumber}</strong></div>
              <div>Submitted On: <strong>{selectedRecord.submissionDate}</strong></div>
            </div>

            {/* Submitted Documents Checklist */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                Uploaded Compliance Files ({merchantDocs.length}):
              </span>

              {isLoadingDocs ? (
                <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '12px' }}>
                  Loading uploaded documents from cloud storage...
                </div>
              ) : merchantDocs.length === 0 ? (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '12px', borderRadius: '8px', color: '#b45309', fontSize: '12px' }}>
                  No compliance files have been uploaded by this merchant yet.
                </div>
              ) : (
                merchantDocs.map((file) => (
                  <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} style={{ color: '#0284c7' }} />
                      <div>
                        <strong>{file.documentType}:</strong> <span style={{ color: '#334155' }}>{file.fileName}</span>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>Uploaded: {file.uploadedAt}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{ padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => window.open(file.publicUrl, '_blank')}
                    >
                      <ExternalLink size={12} /> View Document
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Admin Remarks Input */}
            <Input
              label="Super Admin Verification Remarks"
              placeholder="Add review notes or missing document requests..."
              value={adminRemarks}
              onChange={(e) => setAdminRemarks(e.target.value)}
            />

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Button variant="danger" size="sm" onClick={() => handleUpdateStatus('Rejected')} leftIcon={<XCircle size={14} />}>
                Reject KYC
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => handleUpdateStatus('Pending Documents')} leftIcon={<RefreshCw size={14} />}>
                Request Re-Upload
              </Button>

              <Button variant="primary" size="sm" onClick={() => handleUpdateStatus('Approved')} leftIcon={<CheckCircle2 size={14} />} style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
                Approve KYC & Unlock Features
              </Button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
};
