import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  FileCheck,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button, Card, Badge, Alert, Input, Select } from '../../components/ui';

export const SellerOnboardingWizardPage: React.FC = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Step 1 Form Data
  const [companyName, setCompanyName] = useState('Apex Logistics Pvt Ltd');
  const [brandName, setBrandName] = useState('Apex Express');
  const [gstNo, setGstNo] = useState('22AAAAA0000A1Z5');
  const [panNo, setPanNo] = useState('ABCDE1234F');
  const [businessType, setBusinessType] = useState('D2C Brand');

  // Step 2 Form Data
  const [billingAddress, setBillingAddress] = useState('Plot 45, Okhla Industrial Area Phase 3');
  const [city, setCity] = useState('New Delhi');
  const [state, setState] = useState('Delhi');
  const [pincode, setPincode] = useState('110020');

  // Step 3 Form Data (KYC Uploads)
  const [gstFile, setGstFile] = useState<string | null>('gst_certificate_apex.pdf');
  const [panFile, setPanFile] = useState<string | null>('pan_card_apex.pdf');
  const [chequeFile, setChequeFile] = useState<string | null>('cancelled_cheque.pdf');

  // Step 4 Form Data (Bank Details)
  const [accountHolder, setAccountHolder] = useState('Apex Logistics Pvt Ltd');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNo, setAccountNo] = useState('50200012345678');
  const [ifscCode, setIfscCode] = useState('HDFC0000123');

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinalSubmit = () => {
    setSuccessMessage('Onboarding application submitted successfully! Account status set to Under Review.');
    setTimeout(() => {
      navigate('/app');
    }, 2000);
  };

  const breadcrumbs = [
    { label: 'Seller Portal', path: '/app' },
    { label: 'Onboarding Wizard', path: '/app/onboarding' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      
      <PageHeader
        title="Seller Merchant Onboarding Wizard"
        description="Complete your business profile, address, KYC documents, and bank details to activate courier rates."
        breadcrumbs={breadcrumbs}
      />

      {successMessage && (
        <Alert variant="success" title="Onboarding Completed">
          {successMessage}
        </Alert>
      )}

      {/* STEP PROGRESS INDICATOR */}
      <Card style={{ padding: '18px 24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          {[
            { num: 1, label: 'Business Details', icon: Building2 },
            { num: 2, label: 'Address Details', icon: MapPin },
            { num: 3, label: 'KYC Documents', icon: FileCheck },
            { num: 4, label: 'Bank Details', icon: CreditCard },
            { num: 5, label: 'Complete Setup', icon: CheckCircle },
          ].map((s) => {
            const Icon = s.icon;
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 2 }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: isDone ? '#16a34a' : isCurrent ? '#2563eb' : '#f1f5f9',
                    color: isDone || isCurrent ? '#ffffff' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '14px',
                  }}
                >
                  <Icon size={18} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: isCurrent ? '700' : '500', color: isCurrent ? '#0f172a' : '#64748b' }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* STEP FORM CONTAINER */}
      <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
        
        {/* STEP 1: BUSINESS DETAILS */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Step 1: Business Profile Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Input label="Registered Company Name *" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
              <Input label="Brand Display Name *" value={brandName} onChange={(e) => setBrandName(e.target.value)} required />
              <Input label="GST Number *" value={gstNo} onChange={(e) => setGstNo(e.target.value)} required />
              <Input label="PAN Number *" value={panNo} onChange={(e) => setPanNo(e.target.value)} required />
              <Select
                label="Business Type"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                options={[
                  { label: 'D2C eCommerce Brand', value: 'D2C Brand' },
                  { label: 'B2B Wholesale / Distributor', value: 'B2B Wholesale' },
                  { label: 'Enterprise Manufacturer', value: 'Enterprise' },
                ]}
              />
            </div>
          </div>
        )}

        {/* STEP 2: ADDRESS DETAILS */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Step 2: Registered Office & Pickup Location
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Input label="Registered Billing Street Address *" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} required />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <Input label="City *" value={city} onChange={(e) => setCity(e.target.value)} required />
                <Input label="State *" value={state} onChange={(e) => setState(e.target.value)} required />
                <Input label="Pincode *" value={pincode} onChange={(e) => setPincode(e.target.value)} required />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: KYC DOCUMENTS */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Step 3: Upload Compliance KYC Documents
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              
              <div style={{ border: '2px dashed #cbd5e1', borderRadius: '10px', padding: '16px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                <Upload size={24} style={{ color: '#0284c7', marginBottom: '6px' }} />
                <strong style={{ display: 'block', fontSize: '13px' }}>GST Certificate</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{gstFile || 'PDF / JPG max 5MB'}</span>
                <Button variant="outline" size="sm" style={{ marginTop: '10px' }} onClick={() => setGstFile('gst_uploaded.pdf')}>
                  Upload GST
                </Button>
              </div>

              <div style={{ border: '2px dashed #cbd5e1', borderRadius: '10px', padding: '16px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                <Upload size={24} style={{ color: '#0284c7', marginBottom: '6px' }} />
                <strong style={{ display: 'block', fontSize: '13px' }}>PAN Card Copy</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{panFile || 'PDF / JPG max 5MB'}</span>
                <Button variant="outline" size="sm" style={{ marginTop: '10px' }} onClick={() => setPanFile('pan_uploaded.pdf')}>
                  Upload PAN
                </Button>
              </div>

              <div style={{ border: '2px dashed #cbd5e1', borderRadius: '10px', padding: '16px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                <Upload size={24} style={{ color: '#0284c7', marginBottom: '6px' }} />
                <strong style={{ display: 'block', fontSize: '13px' }}>Cancelled Cheque</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{chequeFile || 'For COD Remittances'}</span>
                <Button variant="outline" size="sm" style={{ marginTop: '10px' }} onClick={() => setChequeFile('cheque_uploaded.pdf')}>
                  Upload Cheque
                </Button>
              </div>

            </div>
          </div>
        )}

        {/* STEP 4: BANK DETAILS */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Step 4: Bank Account for COD Remittances
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Input label="Account Holder Name *" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} required />
              <Input label="Bank Name *" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
              <Input label="Bank Account Number *" value={accountNo} onChange={(e) => setAccountNo(e.target.value)} required />
              <Input label="IFSC Code *" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} required />
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & COMPLETE SETUP */}
        {currentStep === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Step 5: Review & Submit Setup
            </h3>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Company Name:</span>
                <strong style={{ color: '#0f172a' }}>{companyName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>GST & PAN:</span>
                <span>{gstNo} • {panNo}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Registered Address:</span>
                <span>{billingAddress}, {city}, {state} - {pincode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Bank Account:</span>
                <span>{bankName} ({accountNo})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                <span style={{ color: '#64748b' }}>Status After Submission:</span>
                <Badge variant="warning">Under Review</Badge>
              </div>
            </div>
          </div>
        )}

        {/* ACTION BUTTONS FOOTER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1} leftIcon={<ArrowLeft size={16} />}>
            Previous Step
          </Button>

          {currentStep < 5 ? (
            <Button variant="primary" onClick={handleNext} rightIcon={<ArrowRight size={16} />} style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}>
              Save & Next Step
            </Button>
          ) : (
            <Button variant="primary" onClick={handleFinalSubmit} rightIcon={<CheckCircle size={16} />} style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
              Submit Onboarding Profile
            </Button>
          )}
        </div>

      </Card>

    </div>
  );
};
