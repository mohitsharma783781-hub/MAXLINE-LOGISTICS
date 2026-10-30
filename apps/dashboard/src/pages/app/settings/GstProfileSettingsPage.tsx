import React, { useState } from 'react';
import {
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import {
  Button,
  Card,
  Input,
  Select,
  Alert,
  Badge,
} from '../../../components/ui';
import {
  GstInvoiceService,
  validateGstin,
} from '../../../services/gstInvoiceService';
import type { CustomerGstProfile, GstRegistrationType } from '../../../types/gstInvoice';

export const GstProfileSettingsPage: React.FC = () => {
  const tenantId = 'tenant-demo-01';

  const [profile, setProfile] = useState<CustomerGstProfile>(() =>
    GstInvoiceService.getCustomerProfile(tenantId)
  );

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (field: keyof CustomerGstProfile, value: any) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrorMsg(null);
  };

  const handleStateChange = (stateName: string) => {
    const stateMap: Record<string, string> = {
      Delhi: '07',
      Maharashtra: '27',
      Haryana: '06',
      Karnataka: '29',
      'Tamil Nadu': '33',
      Gujarat: '24',
      'West Bengal': '19',
    };

    setProfile((prev) => ({
      ...prev,
      state: stateName,
      stateCode: stateMap[stateName] || '07',
    }));
  };

  const handleSave = () => {
    if (profile.registrationType === 'REGISTERED' && !validateGstin(profile.gstin)) {
      setErrorMsg('Invalid GSTIN format! Must be a 15-character valid GSTIN (e.g. 27AAACA1234A1Z8).');
      return;
    }

    const res = GstInvoiceService.updateCustomerProfile(tenantId, profile);
    if (res.success) {
      setProfile({ ...res.profile });
      setToastMsg(res.message);
      setTimeout(() => setToastMsg(null), 4000);
    } else {
      setErrorMsg(res.message);
    }
  };

  const isGstinValid = validateGstin(profile.gstin);

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Settings', path: '/app/settings' },
    { label: 'Business & GST Profile', path: '/app/settings/gst-profile' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title="Business & GST Tax Profile Settings"
        description="Maintain your registered legal business entity details, GSTIN number, and billing address for monthly GST tax invoice issuance and ITC claiming."
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="primary" size="sm" onClick={handleSave}>
            <Save size={14} style={{ marginRight: '6px' }} /> Save GST Profile
          </Button>
        }
      />

      {toastMsg && (
        <Alert variant="success" title="GST Profile Saved">
          {toastMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="danger" title="Validation Error">
          {errorMsg}
        </Alert>
      )}

      {/* Snapshot Rule Info Alert */}
      <Alert variant="info" title="Historical Invoice Protection Rule">
        Changes made to your GST profile will apply to future monthly tax invoices. <strong>Historical issued invoices remain unchanged</strong> and permanently preserve the GST snapshot active during their issuance.
      </Alert>

      {/* Form Card */}
      <Card style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-violet-main)' }}>
            <Building2 size={18} /> Tax Registration Information
          </h3>

          <Badge variant={profile.registrationType === 'REGISTERED' ? 'success' : 'neutral'}>
            {profile.registrationType}
          </Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
              GST Registration Type
            </label>
            <Select
              value={profile.registrationType}
              onChange={(e) => handleChange('registrationType', e.target.value as GstRegistrationType)}
              options={[
                { label: 'GST Registered Business (B2B Tax Invoice)', value: 'REGISTERED' },
                { label: 'Unregistered Consumer (B2C Bill of Supply)', value: 'UNREGISTERED' },
                { label: 'SEZ Unit (Zero Rated)', value: 'SEZ' },
                { label: 'Composition Scheme', value: 'COMPOSITION' },
              ]}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
              GSTIN (15 Digit Number) *
            </label>
            <div style={{ position: 'relative' }}>
              <Input
                placeholder="e.g. 27AAACA1234A1Z8"
                value={profile.gstin}
                onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                disabled={profile.registrationType === 'UNREGISTERED'}
              />
              {profile.registrationType === 'REGISTERED' && (
                <div style={{ marginTop: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {isGstinValid ? (
                    <span style={{ color: 'var(--color-success-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <CheckCircle2 size={12} /> Valid GSTIN Format (State Code: {profile.gstin.slice(0, 2)})
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-danger-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <AlertCircle size={12} /> Invalid GSTIN Structure
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
              Legal Business Name (As per GST Certificate) *
            </label>
            <Input
              placeholder="e.g. Acme Electronics India Pvt Ltd"
              value={profile.legalBusinessName}
              onChange={(e) => handleChange('legalBusinessName', e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
              Trade Name / Store Brand (Optional)
            </label>
            <Input
              placeholder="e.g. Acme Store"
              value={profile.tradeName || ''}
              onChange={(e) => handleChange('tradeName', e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
              PAN Number (10 Characters) *
            </label>
            <Input
              placeholder="e.g. AAACA1234A"
              value={profile.pan}
              onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
              State & State Code *
            </label>
            <Select
              value={profile.state}
              onChange={(e) => handleStateChange(e.target.value)}
              options={[
                { label: 'Delhi (State Code: 07)', value: 'Delhi' },
                { label: 'Maharashtra (State Code: 27)', value: 'Maharashtra' },
                { label: 'Haryana (State Code: 06)', value: 'Haryana' },
                { label: 'Karnataka (State Code: 29)', value: 'Karnataka' },
                { label: 'Tamil Nadu (State Code: 33)', value: 'Tamil Nadu' },
                { label: 'Gujarat (State Code: 24)', value: 'Gujarat' },
                { label: 'West Bengal (State Code: 19)', value: 'West Bengal' },
              ]}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
            Registered Billing Address *
          </label>
          <Input
            placeholder="Door/Flat No, Building, Street Address..."
            value={profile.billingAddress}
            onChange={(e) => handleChange('billingAddress', e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
              City *
            </label>
            <Input
              value={profile.city}
              onChange={(e) => handleChange('city', e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
              Pincode *
            </label>
            <Input
              value={profile.pincode}
              onChange={(e) => handleChange('pincode', e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
              Billing Email *
            </label>
            <Input
              value={profile.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
