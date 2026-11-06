import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  CreditCard,
  Building2,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button, Card, Badge, Alert, Input } from '../../../components/ui';
import { useRbac } from '../../../context/RbacContext';
import { useTenant } from '../../../context/TenantContext';
import { KycService } from '../../../services/kycService';
import { supabase } from '../../../lib/supabaseClient';
import { toValidTenantUUID } from '../../../utils/uuidHelper';

export interface DocumentUploadState {
  file: File | null;
  fileName: string | null;
  publicUrl: string | null;
  status: 'Pending' | 'Uploaded' | 'Verified';
}

export const SellerKycVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { logActivity } = useRbac();
  const { activeTenant, activeTenantId } = useTenant();

  const currentUser = (() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('courrier3_current_user');
        if (raw) return JSON.parse(raw);
      }
    } catch {}
    return null;
  })();

  const resolvedCompanyName = activeTenant?.companyName || currentUser?.businessName || '';
  const resolvedOwnerName = currentUser?.fullName || '';

  // KYC Master Status
  const [kycStatus, setKycStatus] = useState<'Pending Submission' | 'Under Review' | 'Approved'>('Pending Submission');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  // Section 1: Business Identity
  const [businessType, setBusinessType] = useState('Proprietorship');
  const [companyName, setCompanyName] = useState(resolvedCompanyName);
  const [panNumber, setPanNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panDoc, setPanDoc] = useState<DocumentUploadState>({ file: null, fileName: null, publicUrl: null, status: 'Pending' });
  const [gstDoc, setGstDoc] = useState<DocumentUploadState>({ file: null, fileName: null, publicUrl: null, status: 'Pending' });

  // Section 2: Authorized Signatory
  const [signatoryName, setSignatoryName] = useState(resolvedOwnerName);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarDoc, setAadhaarDoc] = useState<DocumentUploadState>({ file: null, fileName: null, publicUrl: null, status: 'Pending' });

  // Section 3: Bank Remittances
  const [accountHolder, setAccountHolder] = useState(resolvedCompanyName || resolvedOwnerName);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [chequeDoc, setChequeDoc] = useState<DocumentUploadState>({ file: null, fileName: null, publicUrl: null, status: 'Pending' });

  // File Upload Helper
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [currentUploadTarget, setCurrentUploadTarget] = useState<'pan' | 'gst' | 'aadhaar' | 'cheque' | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Load existing KYC and Bank data
  useEffect(() => {
    if (!activeTenantId) return;

    let isMounted = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('merchants')
          .select('status')
          .eq('id', toValidTenantUUID(activeTenantId))
          .maybeSingle();

        if (isMounted && data?.status === 'ACTIVE') {
          setKycStatus('Approved');
        }
      } catch {}
    })();

    // Load saved bank details
    try {
      const savedBank = localStorage.getItem(`MAXLINE_SELLER_BANK_${activeTenantId}`);
      if (savedBank) {
        const parsed = JSON.parse(savedBank);
        if (parsed.accountHolder) setAccountHolder(parsed.accountHolder);
        if (parsed.bankName) setBankName(parsed.bankName);
        if (parsed.accountNumber) setAccountNumber(parsed.accountNumber);
        if (parsed.ifscCode) setIfscCode(parsed.ifscCode);
      }

      const savedKyc = localStorage.getItem(`MAXLINE_SELLER_KYC_${activeTenantId}`);
      if (savedKyc) {
        const parsed = JSON.parse(savedKyc);
        if (parsed.businessType) setBusinessType(parsed.businessType);
        if (parsed.panNumber) setPanNumber(parsed.panNumber);
        if (parsed.gstNumber) setGstNumber(parsed.gstNumber);
        if (parsed.signatoryName) setSignatoryName(parsed.signatoryName);
        if (parsed.aadhaarNumber) setAadhaarNumber(parsed.aadhaarNumber);
        if (parsed.kycStatus) setKycStatus(parsed.kycStatus);
      }
    } catch {}

    // Load cloud documents
    KycService.fetchMerchantDocuments(activeTenantId).then((cloudDocs) => {
      if (cloudDocs && cloudDocs.length > 0) {
        cloudDocs.forEach((d) => {
          const typeLower = d.documentType.toLowerCase();
          const docState: DocumentUploadState = {
            file: null,
            fileName: d.fileName,
            publicUrl: d.publicUrl,
            status: d.status === 'Verified' ? 'Verified' : 'Uploaded',
          };
          if (typeLower.includes('pan')) setPanDoc(docState);
          else if (typeLower.includes('gst')) setGstDoc(docState);
          else if (typeLower.includes('aadhaar')) setAadhaarDoc(docState);
          else if (typeLower.includes('cheque') || typeLower.includes('bank')) setChequeDoc(docState);
        });
      }
    }).catch(() => {});
  }, [activeTenantId]);

  const triggerUpload = (target: 'pan' | 'gst' | 'aadhaar' | 'cheque') => {
    setCurrentUploadTarget(target);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUploadTarget) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please upload a smaller file.');
      return;
    }

    setIsUploadingFile(true);
    const docTypeLabel =
      currentUploadTarget === 'pan' ? 'PAN Card' :
      currentUploadTarget === 'gst' ? 'GST Certificate' :
      currentUploadTarget === 'aadhaar' ? 'Aadhaar Card' : 'Cancelled Cheque';

    try {
      const res = await KycService.uploadDocument(activeTenantId, docTypeLabel, file);
      const updated: DocumentUploadState = {
        file,
        fileName: file.name,
        publicUrl: res.doc?.publicUrl || null,
        status: 'Uploaded',
      };

      if (currentUploadTarget === 'pan') setPanDoc(updated);
      else if (currentUploadTarget === 'gst') setGstDoc(updated);
      else if (currentUploadTarget === 'aadhaar') setAadhaarDoc(updated);
      else if (currentUploadTarget === 'cheque') setChequeDoc(updated);

      logActivity('KYC Documents', docTypeLabel, `Uploaded ${file.name}`);
    } catch {
      // Local fallback
      const updated: DocumentUploadState = {
        file,
        fileName: file.name,
        publicUrl: null,
        status: 'Uploaded',
      };
      if (currentUploadTarget === 'pan') setPanDoc(updated);
      else if (currentUploadTarget === 'gst') setGstDoc(updated);
      else if (currentUploadTarget === 'aadhaar') setAadhaarDoc(updated);
      else if (currentUploadTarget === 'cheque') setChequeDoc(updated);
    } finally {
      setIsUploadingFile(false);
      setCurrentUploadTarget(null);
    }
  };

  // Submit KYC & Save
  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!panNumber.trim()) {
      alert('Please enter your 10-digit PAN number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const kycData = {
        businessType,
        companyName,
        panNumber: panNumber.trim().toUpperCase(),
        gstNumber: gstNumber.trim().toUpperCase(),
        signatoryName: signatoryName.trim(),
        aadhaarNumber: aadhaarNumber.trim(),
        kycStatus: 'Under Review',
        submittedAt: new Date().toISOString(),
      };

      const bankData = {
        accountHolder: accountHolder.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
      };

      if (activeTenantId) {
        localStorage.setItem(`MAXLINE_SELLER_KYC_${activeTenantId}`, JSON.stringify(kycData));
        localStorage.setItem(`MAXLINE_SELLER_BANK_${activeTenantId}`, JSON.stringify(bankData));
      }

      setKycStatus('Under Review');
      setAlertSuccess('KYC documents submitted successfully! Next step: add your first pickup warehouse.');
      logActivity('KYC Verification', 'Submission', 'Submitted merchant KYC profile for verification');

      // Seamless redirect prompt to Warehouse setup after 1.5 seconds
      setTimeout(() => {
        navigate('/app/warehouses');
      }, 1800);
    } catch {
      alert('Error saving KYC details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Shipment Settings', path: '/app/settings/company' },
    { label: 'KYC Verification', path: '/app/kyc' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        style={{ display: 'none' }}
      />

      <PageHeader
        title="Business KYC Verification"
        description="Verify your business credentials to enable carrier pickups and automated COD remittances."
        breadcrumbs={breadcrumbs}
      />

      {/* Success Banner */}
      {alertSuccess && (
        <Alert variant="success">
          {alertSuccess}
        </Alert>
      )}

      {/* Executive Status Strip */}
      <Card
        style={{
          padding: '16px 20px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: kycStatus === 'Approved' ? '#f0fdf4' : '#eff6ff',
              color: kycStatus === 'Approved' ? '#16a34a' : '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {kycStatus === 'Approved' ? <CheckCircle2 size={22} /> : <ShieldCheck size={22} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Verification Status:</span>
              <Badge variant={kycStatus === 'Approved' ? 'success' : kycStatus === 'Under Review' ? 'warning' : 'neutral'}>
                {kycStatus}
              </Badge>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
              {kycStatus === 'Approved'
                ? 'Your account is 100% verified for pan-India dispatches & COD payouts.'
                : kycStatus === 'Under Review'
                ? 'Documents received. Approvals typically take 1–2 hours during business hours.'
                : 'Complete the 3 quick sections below to unlock automated pickups.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/warehouses')}
            rightIcon={<ArrowRight size={14} />}
          >
            Go to Warehouses
          </Button>
        </div>
      </Card>

      <form onSubmit={handleKycSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Section 1: Business Identity */}
        <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Building2 size={20} color="#2563eb" />
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                1. Business Identity (PAN & GSTIN)
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Enter your legal tax identifiers</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <Input
              label="Registered Company / Trade Name *"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Retail Pvt Ltd"
              required
            />

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Business Constitution *
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  padding: '0 12px',
                  fontSize: '13px',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="Proprietorship">Sole Proprietorship</option>
                <option value="Pvt Ltd">Private Limited (Pvt Ltd)</option>
                <option value="LLP">Limited Liability Partnership (LLP)</option>
                <option value="Partnership">Partnership Firm</option>
                <option value="Individual">Individual / D2C Creator</option>
              </select>
            </div>

            <div>
              <Input
                label="Company / Proprietor PAN *"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                placeholder="10-digit PAN (e.g. ABCDE1234F)"
                maxLength={10}
                required
              />
              <div style={{ marginTop: '8px' }}>
                <DocumentUploaderPill
                  title="Upload PAN Card (PDF/Image)"
                  docState={panDoc}
                  onUpload={() => triggerUpload('pan')}
                  isLoading={isUploadingFile && currentUploadTarget === 'pan'}
                />
              </div>
            </div>

            <div>
              <Input
                label="GSTIN (Optional if Unregistered)"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                placeholder="15-digit GSTIN (e.g. 07AAAAA0000A1Z5)"
                maxLength={15}
              />
              <div style={{ marginTop: '8px' }}>
                <DocumentUploaderPill
                  title="Upload GST Certificate"
                  docState={gstDoc}
                  onUpload={() => triggerUpload('gst')}
                  isLoading={isUploadingFile && currentUploadTarget === 'gst'}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Authorized Signatory */}
        <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <UserCheck size={20} color="#0284c7" />
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                2. Authorized Signatory (Identity Proof)
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Primary representative verification</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <Input
              label="Signatory Full Name *"
              value={signatoryName}
              onChange={(e) => setSignatoryName(e.target.value)}
              placeholder="Full name as per Aadhaar / PAN"
              required
            />

            <div>
              <Input
                label="Aadhaar / Gov ID Number"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value)}
                placeholder="12-digit Aadhaar number"
                maxLength={12}
              />
              <div style={{ marginTop: '8px' }}>
                <DocumentUploaderPill
                  title="Upload Aadhaar (Front & Back)"
                  docState={aadhaarDoc}
                  onUpload={() => triggerUpload('aadhaar')}
                  isLoading={isUploadingFile && currentUploadTarget === 'aadhaar'}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Bank Remittances */}
        <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <CreditCard size={20} color="#16a34a" />
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                3. Settlement Bank Account (Doorstep COD Payouts)
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Account where collected cash-on-delivery funds are remitted</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <Input
              label="Account Holder Name *"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="e.g. Acme Retail Pvt Ltd"
              required
            />

            <Input
              label="Bank Name *"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
              required
            />

            <Input
              label="Bank Account Number *"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter account number"
              required
            />

            <div>
              <Input
                label="IFSC Code *"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="e.g. HDFC0000128"
                maxLength={11}
                required
              />
              <div style={{ marginTop: '8px' }}>
                <DocumentUploaderPill
                  title="Upload Cancelled Cheque / Passbook"
                  docState={chequeDoc}
                  onUpload={() => triggerUpload('cheque')}
                  isLoading={isUploadingFile && currentUploadTarget === 'cheque'}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Submission Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            rightIcon={!isSubmitting ? <ArrowRight size={16} /> : undefined}
            style={{
              backgroundColor: '#2563eb',
              borderColor: '#2563eb',
              fontWeight: '700',
              height: '46px',
              padding: '0 24px',
              fontSize: '14px',
            }}
          >
            Submit KYC & Proceed to Warehouse →
          </Button>
        </div>
      </form>
    </div>
  );
};

interface DocumentUploaderPillProps {
  title: string;
  docState: DocumentUploadState;
  onUpload: () => void;
  isLoading: boolean;
}

const DocumentUploaderPill: React.FC<DocumentUploaderPillProps> = ({ title, docState, onUpload, isLoading }) => {
  if (docState.fileName) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#f8fafc',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          <FileText size={14} color="#2563eb" />
          <span style={{ fontWeight: '600', color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>
            {docState.fileName}
          </span>
          <Badge variant="success" style={{ fontSize: '10px', padding: '1px 6px' }}>Uploaded</Badge>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {docState.publicUrl && (
            <button
              type="button"
              onClick={() => window.open(docState.publicUrl!, '_blank')}
              style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
              title="View Document"
            >
              <ExternalLink size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={onUpload}
            style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', padding: '2px' }}
            title="Replace File"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onUpload}
      disabled={isLoading}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '7px 10px',
        borderRadius: '6px',
        border: '1px dashed #94a3b8',
        backgroundColor: isLoading ? '#eff6ff' : '#f8fafc',
        color: '#475569',
        fontSize: '12px',
        fontWeight: '600',
        cursor: isLoading ? 'wait' : 'pointer',
      }}
    >
      {isLoading ? (
        <>
          <Loader2 size={13} className="animate-spin" color="#2563eb" />
          <span>Uploading...</span>
        </>
      ) : (
        <>
          <Upload size={13} color="#2563eb" />
          <span>{title}</span>
        </>
      )}
    </button>
  );
};
