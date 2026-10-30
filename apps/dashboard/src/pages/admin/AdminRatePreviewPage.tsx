import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Table,
  Select,
  Input,
} from '../../components/ui';
import {
  BookingEligibilityEngine,
  type EligibilityCheckDetail,
} from '../../services/bookingEligibilityEngine';
import { type EligibleCourierResult } from '../../services/customerRateAssignmentService';

export const AdminRatePreviewPage: React.FC = () => {
  const [tenantId, setTenantId] = useState('tenant-demo-01');
  const [mode, setMode] = useState<'B2C' | 'B2B'>('B2C');
  const [originPincode, setOriginPincode] = useState('110001');
  const [destinationPincode, setDestinationPincode] = useState('560038');
  const [weightKg, setWeightKg] = useState('2.5');
  const [paymentType, setPaymentType] = useState<'PREPAID' | 'COD'>('PREPAID');
  const [packageCount, setPackageCount] = useState('1');

  const [availableOptions, setAvailableOptions] = useState<EligibleCourierResult[] | null>(null);
  const [debugDiagnostics, setDebugDiagnostics] = useState<EligibilityCheckDetail[] | null>(null);

  const handleCalculateRatePreview = () => {
    const w = parseFloat(weightKg) || 1.0;
    const pkgs = parseInt(packageCount, 10) || 1;

    const options = BookingEligibilityEngine.getAvailableServices({
      tenantId,
      mode,
      originPincode,
      destinationPincode,
      totalWeightKg: w,
      paymentType,
      codAmountINR: paymentType === 'COD' ? 1500 : 0,
      packageCount: pkgs,
    });

    const diagnostics = BookingEligibilityEngine.explainCourierEligibility({
      tenantId,
      mode,
      originPincode,
      destinationPincode,
      totalWeightKg: w,
      paymentType,
      codAmountINR: paymentType === 'COD' ? 1500 : 0,
      packageCount: pkgs,
    });

    setAvailableOptions(options);
    setDebugDiagnostics(diagnostics);
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Rate Cards & Pricing', path: '/admin/pricing' },
    { label: 'Admin Rate Preview & Eligibility Debugger', path: '/admin/rate-preview' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Admin Rate Preview & Courier Eligibility Debugger"
        description="Simulate merchant booking rate calculations, verify customer assigned rate card priority, and inspect 9-point courier eligibility rules."
        breadcrumbs={breadcrumbs}
      />

      {/* 2. Controls Form */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
          Simulation Parameters
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <Select
            label="Merchant Tenant *"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            options={[
              { value: 'tenant-demo-01', label: 'tenant-demo-01 (ABC Traders)' },
              { value: 'tenant-demo-02', label: 'tenant-demo-02 (XYZ Logistics)' },
            ]}
          />

          <Select
            label="Commercial Mode *"
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            options={[
              { value: 'B2C', label: 'B2C Consumer Express' },
              { value: 'B2B', label: 'B2B Commercial Cargo' },
            ]}
          />

          <Input label="Origin Pincode *" value={originPincode} onChange={(e) => setOriginPincode(e.target.value)} />
          <Input label="Destination Pincode *" value={destinationPincode} onChange={(e) => setDestinationPincode(e.target.value)} />
          <Input label="Total Chargeable Weight (KG) *" type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />

          <Select
            label="Payment Mode *"
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value as any)}
            options={[
              { value: 'PREPAID', label: 'PREPAID' },
              { value: 'COD', label: 'Cash on Delivery (COD)' },
            ]}
          />

          <Input label="Number of Packages *" type="number" value={packageCount} onChange={(e) => setPackageCount(e.target.value)} />
        </div>

        <Button variant="primary" style={{ marginTop: 'var(--space-6)' }} leftIcon={<Search size={16} />} onClick={handleCalculateRatePreview}>
          Calculate Rates & Debug Eligibility →
        </Button>
      </Card>

      {/* 3. Available Options Results */}
      {availableOptions && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
            Available Shipping Options ({availableOptions.length} Couriers Eligible)
          </h4>

          <Table<EligibleCourierResult>
            keyExtractor={(r) => r.courierId}
            columns={[
              {
                key: 'courierName',
                header: 'Courier & Service',
                render: (r) => (
                  <div>
                    <strong style={{ color: 'var(--color-violet-main)' }}>{r.courierName}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{r.serviceName}</div>
                  </div>
                ),
              },
              { key: 'rateCardName', header: 'Assigned Customer Rate Card', render: (r) => <span>{r.rateCardName} ({r.rateCardVersion})</span> },
              { key: 'estimatedDeliveryDays', header: 'Est. Delivery', render: (r) => <span>{r.estimatedDeliveryDays}</span> },
              {
                key: 'customerPriceINR',
                header: 'Final Customer Price',
                render: (r) => <strong style={{ color: 'var(--color-success)', fontSize: '16px' }}>₹{r.customerPriceINR.toFixed(2)}</strong>,
              },
            ]}
            data={availableOptions}
          />
        </Card>
      )}

      {/* 4. Admin 9-Point Diagnostics Matrix */}
      {debugDiagnostics && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
            Super Admin 9-Point Eligibility Audit Matrix
          </h4>

          <Table<EligibilityCheckDetail>
            keyExtractor={(r) => r.courierId}
            columns={[
              { key: 'courierName', header: 'Courier Partner', render: (r) => <strong>{r.courierName}</strong> },
              {
                key: 'isOverallEligible',
                header: 'Overall Status',
                render: (r) => <Badge variant={r.isOverallEligible ? 'success' : 'danger'}>{r.isOverallEligible ? 'ELIGIBLE' : 'DISQUALIFIED'}</Badge>,
              },
              { key: 'customerAccessPass', header: 'Customer Access', render: (r) => <span>{r.customerAccessPass ? '✓ PASS' : '✗ FAIL'}</span> },
              { key: 'modeMatchPass', header: 'Mode Match', render: (r) => <span>{r.modeMatchPass ? '✓ PASS' : '✗ FAIL'}</span> },
              { key: 'codSupportedPass', header: 'COD Support', render: (r) => <span>{r.codSupportedPass ? '✓ PASS' : '✗ FAIL'}</span> },
              { key: 'multiPackagePass', header: 'Multi-Pkg', render: (r) => <span>{r.multiPackagePass ? '✓ PASS' : '✗ FAIL'}</span> },
              {
                key: 'disqualificationReason',
                header: 'Audit Explanation',
                render: (r) => <span style={{ fontSize: '12px', color: r.isOverallEligible ? 'var(--color-success)' : 'var(--color-danger)' }}>{r.disqualificationReason}</span>,
              },
            ]}
            data={debugDiagnostics}
          />
        </Card>
      )}
    </div>
  );
};
