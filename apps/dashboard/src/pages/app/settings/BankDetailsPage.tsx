import React, { useState } from 'react';
import {
  CreditCard,
  Upload,
  ShieldCheck,
  FileText,
  Save,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button, Card, Badge, Alert, Input } from '../../../components/ui';

export const BankDetailsPage: React.FC = () => {
  const [accountHolder, setAccountHolder] = useState('Apex Logistics & Retail Pvt Ltd');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('50200098765432');
  const [ifscCode, setIfscCode] = useState('HDFC0000123');
  const [branchName, setBranchName] = useState('Okhla Phase 3, New Delhi');
  const [accountType, setAccountType] = useState('Current Account');
  
  const [chequeFileName, setChequeFileName] = useState<string | null>('cancelled_cheque_hdfc.pdf');
  const [verificationStatus] = useState<'Verified' | 'Under Review' | 'Pending'>('Verified');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('Bank account remittance details updated successfully! Verification status set to Under Review.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleFileUpload = () => {
    setChequeFileName('new_cancelled_cheque.pdf');
    setSuccessMsg('Cancelled cheque document uploaded successfully! Admin verification triggered.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const breadcrumbs = [
    { label: 'Seller Portal', path: '/app' },
    { label: 'Settings', path: '/app/settings/profile' },
    { label: 'Bank Details & Remittances', path: '/app/settings/bank' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      
      <PageHeader
        title="Bank Account & COD Remittance Settlement Center"
        description="Manage your registered business bank account details for automated COD payouts and daily remittance credits."
        breadcrumbs={breadcrumbs}
      />

      {successMsg && (
        <Alert variant="success" title="Bank Details Update">
          {successMsg}
        </Alert>
      )}

      {/* VERIFICATION STATUS BANNER */}
      <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{bankName}</h3>
              <Badge variant={verificationStatus === 'Verified' ? 'success' : 'warning'}>
                {verificationStatus}
              </Badge>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Account: •••• {accountNumber.slice(-4)} • IFSC: {ifscCode}</span>
          </div>
        </div>

        <div style={{ textAlign: 'right', fontSize: '12px', color: '#334155' }}>
          <div>Settlement Frequency: <strong>T+1 Daily COD Cycle</strong></div>
          <div style={{ color: '#16a34a', fontWeight: '700' }}>Direct Bank Transfer Enabled</div>
        </div>
      </Card>

      {/* BANK DETAILS FORM */}
      <form onSubmit={handleSaveBank} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} style={{ color: '#2563eb' }} /> Registered Bank Account Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Input label="Account Holder Name *" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} required />
            <Input label="Bank Name *" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
            <Input label="Bank Account Number *" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required />
            <Input label="IFSC Code *" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} required />
            <Input label="Branch Location" value={branchName} onChange={(e) => setBranchName(e.target.value)} />
            <Input label="Account Type" value={accountType} onChange={(e) => setAccountType(e.target.value)} />
          </div>
        </Card>

        {/* CANCELLED CHEQUE UPLOAD */}
        <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: '#0284c7' }} /> Cancelled Cheque / Bank Statement Document
          </h3>

          {chequeFileName ? (
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileText size={22} style={{ color: '#0284c7' }} />
                <div>
                  <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>{chequeFileName}</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Uploaded & Verified by Super Admin Compliance</span>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={handleFileUpload} leftIcon={<Upload size={14} />}>
                Re-upload Cheque
              </Button>
            </div>
          ) : (
            <div onClick={handleFileUpload} style={{ border: '2px dashed #cbd5e1', padding: '20px', borderRadius: '10px', textAlign: 'center', backgroundColor: '#f8fafc', cursor: 'pointer' }}>
              <Upload size={24} style={{ color: '#0284c7', marginBottom: '6px' }} />
              <strong style={{ display: 'block', fontSize: '13px' }}>Click to Upload Cancelled Cheque PDF</strong>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Used to verify bank account ownership</span>
            </div>
          )}
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="primary" leftIcon={<Save size={16} />} style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}>
            Save & Update Bank Account
          </Button>
        </div>
      </form>

    </div>
  );
};
