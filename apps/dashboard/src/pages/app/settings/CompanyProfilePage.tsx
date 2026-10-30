import React, { useState } from 'react';
import {
  Building2,
  Globe,
  Mail,
  Phone,
  FileText,
  MapPin,
  Save,
  Upload,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button, Card, Badge, Alert, Input, Select } from '../../../components/ui';
import { useRbac } from '../../../context/RbacContext';

export const CompanyProfilePage: React.FC = () => {
  const { logActivity } = useRbac();
  const [companyName, setCompanyName] = useState('Apex Logistics Pvt Ltd');
  const [gstNumber, setGstNumber] = useState('22AAAAA0000A1Z5');
  const [panNumber, setPanNumber] = useState('ABCDE1234F');
  const [businessType, setBusinessType] = useState('D2C Brand');
  const [website, setWebsite] = useState('https://apexlogistics.com');

  const [supportEmail, setSupportEmail] = useState('support@apexlogistics.com');
  const [supportMobile, setSupportMobile] = useState('+91 98765 43210');

  const [billingAddress, setBillingAddress] = useState('Plot 45, Okhla Industrial Area Phase 3, New Delhi - 110020');
  const [pickupAddress, setPickupAddress] = useState('Warehouse 4, Khasra 391, Village Kapashera, New Delhi - 110037');

  const [accountStatus] = useState<'Pending Verification' | 'Pending KYC' | 'Under Review' | 'Approved' | 'Suspended' | 'Rejected'>('Approved');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    logActivity('Profile Updates', companyName, `Updated company profile details, GST ${gstNumber}, support email ${supportEmail}`);
    setSuccessMsg('Company Profile & Support contacts saved successfully!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const getAccountStatusVariant = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Under Review':
      case 'Pending Verification':
      case 'Pending KYC':
        return 'warning';
      case 'Suspended':
      case 'Rejected':
      default:
        return 'danger';
    }
  };

  const breadcrumbs = [
    { label: 'Seller Portal', path: '/app' },
    { label: 'Settings', path: '/app/settings/profile' },
    { label: 'Company Profile', path: '/app/settings/company' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      
      <PageHeader
        title="Seller Company Profile & Identity Center"
        description="Manage company details, GST/PAN compliance, brand logo, support channels, and registered billing address."
        breadcrumbs={breadcrumbs}
      />

      {successMsg && (
        <Alert variant="success" title="Profile Update Status">
          {successMsg}
        </Alert>
      )}

      {/* ACCOUNT STATUS BANNER */}
      <Card style={{ padding: '16px 20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Current Account Verification Status</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
            <strong style={{ fontSize: '16px', color: '#0f172a' }}>{companyName}</strong>
            <Badge variant={getAccountStatusVariant(accountStatus)}>{accountStatus}</Badge>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => alert('Verification details sent for re-review.')}>
          Request Re-Verification
        </Button>
      </Card>

      {/* COMPANY PROFILE FORM */}
      <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 1. GENERAL BUSINESS DETAILS */}
        <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} style={{ color: '#2563eb' }} /> General Business Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Input label="Company Registered Name *" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            
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

            <Input label="GSTIN Number *" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} leadingIcon={<FileText size={16} />} required />
            <Input label="PAN Card Number *" value={panNumber} onChange={(e) => setPanNumber(e.target.value)} leadingIcon={<FileText size={16} />} required />
            
            <Input label="Official Website URL" value={website} onChange={(e) => setWebsite(e.target.value)} leadingIcon={<Globe size={16} />} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#334155' }}>Brand Logo Upload</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                  AP
                </div>
                <Button variant="outline" size="sm" leftIcon={<Upload size={14} />}>Upload Brand Logo</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* 2. CUSTOMER SUPPORT CONTACTS */}
        <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} style={{ color: '#2563eb' }} /> Merchant Support Channels
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Input label="Customer Support Email *" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} leadingIcon={<Mail size={16} />} required />
            <Input label="Customer Support Mobile *" type="tel" value={supportMobile} onChange={(e) => setSupportMobile(e.target.value)} leadingIcon={<Phone size={16} />} required />
          </div>
        </Card>

        {/* 3. REGISTERED BILLING & PICKUP ADDRESS */}
        <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} style={{ color: '#dc2626' }} /> Registered Billing & Pickup Hub Address
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input label="Registered Tax Billing Address *" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} required />
            <Input label="Primary Warehouse Pickup Address *" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} required />
          </div>
        </Card>

        {/* SUBMIT BUTTON */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="primary" leftIcon={<Save size={16} />} style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}>
            Save Company Profile Details
          </Button>
        </div>

      </form>

    </div>
  );
};
