import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
  Eye,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button, Card, Badge, Alert, Input, Modal } from '../../../components/ui';
import { OnboardingService } from '../../../services/onboardingService';
import { useRbac } from '../../../context/RbacContext';

export interface KycDocRecord {
  id: string;
  type: string;
  name: string;
  required: boolean;
  fileName: string | null;
  uploadDate: string | null;
  status: 'Pending' | 'Uploaded' | 'Verified' | 'Rejected';
  remarks?: string;
}

export const INITIAL_KYC_DOCS: KycDocRecord[] = [
  { id: 'doc-gst', type: 'GST Certificate', name: 'GST Identification Certificate', required: true, fileName: 'apex_gst_certificate.pdf', uploadDate: '01 Sep 2026', status: 'Verified' },
  { id: 'doc-pan', type: 'PAN Card', name: 'Company / Proprietor PAN Card', required: true, fileName: 'apex_pan_card.pdf', uploadDate: '01 Sep 2026', status: 'Verified' },
  { id: 'doc-aadhaar', type: 'Aadhaar Card', name: 'Authorized Signatory Aadhaar Card', required: true, fileName: 'aadhaar_signatory.pdf', uploadDate: '02 Sep 2026', status: 'Uploaded' },
  { id: 'doc-cheque', type: 'Cancelled Cheque', name: 'Bank Cancelled Cheque for Remittances', required: true, fileName: 'cancelled_cheque_hdfc.pdf', uploadDate: '02 Sep 2026', status: 'Uploaded' },
  { id: 'doc-reg', type: 'Company Registration', name: 'Certificate of Incorporation / MSME Udyam', required: false, fileName: null, uploadDate: null, status: 'Pending' },
  { id: 'doc-address', type: 'Address Proof', name: 'Electricity Bill / Lease Agreement', required: true, fileName: 'office_lease_agreement.pdf', uploadDate: '02 Sep 2026', status: 'Uploaded' },
];

export const SellerKycVerificationPage: React.FC = () => {
  const { logActivity } = useRbac();
  const [kycStatus] = useState<'Not Started' | 'Pending Documents' | 'Under Review' | 'Approved' | 'Rejected' | 'Suspended'>('Under Review');
  const [kycDocs, setKycDocs] = useState<KycDocRecord[]>(INITIAL_KYC_DOCS);
  
  // Bank Verification State
  const [bankHolder, setBankHolder] = useState('Apex Logistics Pvt Ltd');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('50200012345678');
  const [ifscCode, setIfscCode] = useState('HDFC0000123');
  const [bankStatus] = useState<'Pending' | 'Verified' | 'Rejected'>('Verified');

  const [previewDocName, setPreviewDocName] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const uploadedCount = kycDocs.filter((d) => d.status === 'Uploaded' || d.status === 'Verified').length;
  const totalRequiredCount = kycDocs.filter((d) => d.required).length;
  const completionPercentage = Math.round((uploadedCount / totalRequiredCount) * 100);

  const handleSimulateUpload = (docId: string, docType: string) => {
    const updated = kycDocs.map((doc) => {
      if (doc.id === docId) {
        return {
          ...doc,
          fileName: `${docType.toLowerCase().replace(/\s+/g, '_')}_new.pdf`,
          uploadDate: 'Today, Just Now',
          status: 'Uploaded' as const,
        };
      }
      return doc;
    });

    setKycDocs(updated);
    OnboardingService.markStageComplete('CUST-1001', 5, `Uploaded compliance document: ${docType}`);
    logActivity('KYC Actions', docType, `Submitted KYC document "${docType}" for verification`);
    setAlertMessage(`Uploaded document for ${docType}. Sent to Admin for review. Onboarding Stage 5 marked complete.`);
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const getKycStatusVariant = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Under Review':
      case 'Pending Documents':
        return 'warning';
      case 'Rejected':
      case 'Suspended':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const breadcrumbs = [
    { label: 'Seller Portal', path: '/app' },
    { label: 'Settings', path: '/app/settings/profile' },
    { label: 'KYC Verification Center', path: '/app/settings/kyc' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      <PageHeader
        title="Seller KYC Verification Center"
        description="Upload official company compliance documents, bank verification details, and track verification status."
        breadcrumbs={breadcrumbs}
      />

      {alertMessage && (
        <Alert variant="success" title="KYC Update Status">
          {alertMessage}
        </Alert>
      )}

      {/* 1. KYC PROGRESS & FEATURE RESTRICTION CARD */}
      <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCheck size={28} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Verification Status:
                </h3>
                <Badge variant={getKycStatusVariant(kycStatus)} style={{ fontSize: '13px', padding: '4px 10px' }}>
                  {kycStatus}
                </Badge>
                <Badge variant="brand">Verification Level 2 (Enterprise)</Badge>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', margin: 0 }}>
                {uploadedCount} of {totalRequiredCount} required compliance documents uploaded ({completionPercentage}% Complete)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>PROGRESS COMPLETION</span>
            <div style={{ width: '180px', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${completionPercentage}%`, height: '100%', backgroundColor: completionPercentage === 100 ? '#16a34a' : '#2563eb', transition: 'width 0.3s ease' }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>{completionPercentage}%</span>
          </div>

        </div>

        {/* ACCOUNT RESTRICTIONS BANNER */}
        {kycStatus !== 'Approved' ? (
          <div style={{ marginTop: '20px', backgroundColor: '#fffbe8', border: '1px solid #fde047', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertTriangle size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '14px', color: '#92400e', display: 'block' }}>
                Pre-Approval Account Feature Restrictions Active
              </strong>
              <p style={{ fontSize: '12px', color: '#b45309', margin: '2px 0 0 0' }}>
                <strong>Allowed:</strong> Dashboard browsing & shipment creation drafts. <br />
                <strong>Restricted until Admin Approval:</strong> Doorstep COD Cash Remittances, Wallet Credit Limit Extension, Direct Courier API keys & Custom Rate Cards.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '20px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={20} style={{ color: '#16a34a' }} />
            <span style={{ fontSize: '13px', color: '#15803d', fontWeight: '600' }}>
              KYC Fully Approved! All COD remittances, wallet credit extensions, and enterprise rates are unlocked.
            </span>
          </div>
        )}
      </Card>

      {/* 2. REQUIRED COMPLIANCE DOCUMENTS GRID */}
      <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>
          Business Compliance Document Center
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          {kycDocs.map((doc) => (
            <div
              key={doc.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>{doc.type}</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{doc.name} {doc.required && <span style={{ color: '#dc2626' }}>*</span>}</span>
                </div>
                <Badge variant={doc.status === 'Verified' ? 'success' : doc.status === 'Uploaded' ? 'info' : 'neutral'}>
                  {doc.status}
                </Badge>
              </div>

              {/* Uploaded File Info or Drag & Drop Box */}
              {doc.fileName ? (
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} style={{ color: '#0284c7' }} />
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', display: 'block' }}>{doc.fileName}</span>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Uploaded: {doc.uploadDate}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <Button variant="outline" size="sm" style={{ padding: '2px 6px' }} title="Preview Document" onClick={() => setPreviewDocName(doc.fileName)}>
                      <Eye size={13} />
                    </Button>
                    <Button variant="outline" size="sm" style={{ padding: '2px 6px' }} title="Replace Document" onClick={() => handleSimulateUpload(doc.id, doc.type)}>
                      <RefreshCw size={13} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => handleSimulateUpload(doc.id, doc.type)}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <Upload size={20} style={{ color: '#0284c7', marginBottom: '4px' }} />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', display: 'block' }}>Drag & Drop or Click to Upload</span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>PDF, JPG, PNG max 5MB</span>
                </div>
              )}

            </div>
          ))}
        </div>
      </Card>

      {/* 3. BANK VERIFICATION CARD */}
      <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} style={{ color: '#16a34a' }} /> Bank Account Verification for COD Remittance
          </h3>
          <Badge variant="success">Bank Account {bankStatus}</Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          <Input label="Account Holder Name *" value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} />
          <Input label="Bank Name *" value={bankName} onChange={(e) => setBankName(e.target.value)} />
          <Input label="Bank Account Number *" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
          <Input label="Bank IFSC Code *" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} />
        </div>
      </Card>

      {/* 4. KYC TIMELINE HISTORY */}
      <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} style={{ color: '#0284c7' }} /> Verification Audit Log History
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', paddingLeft: '20px', borderLeft: '2px solid #cbd5e1' }}>
          {[
            { title: 'Documents Submitted for Verification', time: '02 Sep 2026, 04:30 PM', admin: 'Merchant Admin', remarks: 'Submitted GST, PAN, Aadhaar, Cheque, and Lease Agreement' },
            { title: 'Under Review by Admin Compliance Team', time: '02 Sep 2026, 05:00 PM', admin: 'Super Admin System', remarks: 'Assigned to Senior Risk Officer for manual audit' },
            { title: 'GST & PAN Compliance Verified', time: '03 Sep 2026, 11:15 AM', admin: 'Admin Verified (Officer #04)', remarks: 'GSTIN 22AAAAA0000A1Z5 matched with Govt portal' },
          ].map((event, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-27px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0284c7', border: '2px solid #ffffff' }} />
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{event.title}</strong>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{event.time} • {event.admin}</div>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#334155' }}>{event.remarks}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDocName && (
        <Modal isOpen={!!previewDocName} onClose={() => setPreviewDocName(null)} title={`Preview Document — ${previewDocName}`} maxWidth="650px">
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ border: '2px solid #0f172a', borderRadius: '8px', padding: '30px', backgroundColor: '#f8fafc', fontFamily: 'monospace' }}>
              <FileText size={48} style={{ color: '#0284c7', marginBottom: '10px' }} />
              <h4 style={{ margin: 0 }}>OFFICIAL DOCUMENT PREVIEW</h4>
              <p style={{ fontSize: '12px', color: '#64748b' }}>{previewDocName}</p>
              <div style={{ border: '1px dashed #cbd5e1', padding: '12px', marginTop: '14px', fontSize: '11px' }}>
                [ SIMULATED VERIFIED COMPLIANCE DOCUMENT IMAGE / PDF ]
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button variant="outline" onClick={() => setPreviewDocName(null)}>Close Preview</Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
