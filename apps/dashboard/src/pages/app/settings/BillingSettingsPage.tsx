import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  Building2,
  FileCheck,
  Receipt,
  ArrowLeft,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import {
  Button,
  Card,
  Input,
  Select,
  Alert,
} from '../../../components/ui';
import { BillingService } from '../../../mocks/billing.mock';
import type { BillingSettings, TaxMode } from '../../../types/billing';

export const BillingSettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const [settings, setSettings] = useState<BillingSettings>(() =>
    BillingService.getBillingSettings()
  );
  const [savedAlert, setSavedAlert] = useState<string | null>(null);

  // GSTIN Basic Format Validator (e.g. 27AAAAA0000A1Z5)
  const isGstinFormatValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
    settings.gstin.trim()
  );

  const handleSave = () => {
    BillingService.updateBillingSettings(settings);
    setSavedAlert('Billing and tax settings saved successfully!');
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Settings', path: '/app/settings' },
    { label: 'Billing & Tax', path: '/app/settings/billing' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title="Billing & Tax Settings"
        description="Configure your merchant legal business identity, GSTIN registration, invoice numbering prefix, and custom document footer."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/billing')} leftIcon={<ArrowLeft size={16} />}>
              Back to Invoices
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} leftIcon={<Save size={16} />}>
              Save Settings
            </Button>
          </div>
        }
      />

      {savedAlert && (
        <Alert variant="success" title="Configuration Updated">
          {savedAlert}
        </Alert>
      )}

      {/* BUSINESS IDENTITY CARD */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
          <Building2 size={20} color="var(--color-violet-main)" />
          <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold' }}>Legal Business Identity</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          <Input
            label="Legal Business Name"
            value={settings.legalBusinessName}
            onChange={(e) => setSettings((p) => ({ ...p, legalBusinessName: e.target.value }))}
          />

          <Input
            label="Display Brand Name"
            value={settings.displayBusinessName}
            onChange={(e) => setSettings((p) => ({ ...p, displayBusinessName: e.target.value }))}
          />

          <Input
            label="Business Address"
            value={settings.businessAddress}
            onChange={(e) => setSettings((p) => ({ ...p, businessAddress: e.target.value }))}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <Input
              label="City"
              value={settings.city}
              onChange={(e) => setSettings((p) => ({ ...p, city: e.target.value }))}
            />
            <Input
              label="State"
              value={settings.state}
              onChange={(e) => setSettings((p) => ({ ...p, state: e.target.value }))}
            />
            <Input
              label="Postal Code"
              value={settings.postalCode}
              onChange={(e) => setSettings((p) => ({ ...p, postalCode: e.target.value }))}
            />
          </div>

          <Input
            label="Billing Email"
            value={settings.email}
            onChange={(e) => setSettings((p) => ({ ...p, email: e.target.value }))}
          />

          <Input
            label="Billing Phone"
            value={settings.phone}
            onChange={(e) => setSettings((p) => ({ ...p, phone: e.target.value }))}
          />
        </div>
      </Card>

      {/* TAX REGISTRATION CARD */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
          <FileCheck size={20} color="var(--color-violet-main)" />
          <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold' }}>Tax Registration & GSTIN</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <Input
              label="GSTIN Number"
              value={settings.gstin}
              onChange={(e) => setSettings((p) => ({ ...p, gstin: e.target.value.toUpperCase() }))}
              placeholder="e.g. 27AAAAA0000A1Z5"
            />
            <div style={{ fontSize: '11px', marginTop: '4px', color: isGstinFormatValid ? 'var(--color-success)' : 'var(--color-text-secondary)', fontWeight: 'bold' }}>
              {isGstinFormatValid ? '✓ Format Valid (15-character GSTIN)' : 'Standard 15-character GSTIN format'}
            </div>
          </div>

          <Input
            label="PAN Number"
            value={settings.pan}
            onChange={(e) => setSettings((p) => ({ ...p, pan: e.target.value.toUpperCase() }))}
            placeholder="e.g. AAAAA0000A"
          />

          <Select
            label="Tax Mode"
            value={settings.taxMode}
            onChange={(e) => setSettings((p) => ({ ...p, taxMode: e.target.value as TaxMode }))}
            options={[
              { value: 'TAX_EXCLUSIVE', label: 'Tax Exclusive (GST added on top of rate)' },
              { value: 'TAX_INCLUSIVE', label: 'Tax Inclusive (GST included in freight rate)' },
            ]}
          />
        </div>
      </Card>

      {/* INVOICE FORMATTING CARD */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
          <Receipt size={20} color="var(--color-violet-main)" />
          <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold' }}>Invoice Document Formatting</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          <Input
            label="Invoice Prefix"
            value={settings.invoicePrefix}
            onChange={(e) => setSettings((p) => ({ ...p, invoicePrefix: e.target.value }))}
            placeholder="e.g. INV-2026-"
          />

          <div>
            <label style={{ fontSize: 'var(--font-size-caption)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
              Document Footer Text
            </label>
            <textarea
              rows={3}
              value={settings.footerText}
              onChange={(e) => setSettings((p) => ({ ...p, footerText: e.target.value }))}
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-default)',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
              }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
