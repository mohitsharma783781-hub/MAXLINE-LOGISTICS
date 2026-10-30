import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Star,
  Calculator,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Input,
  Select,
  ConfirmationDialog,
} from '../../components/ui';
import type { CustomerRateAssignment } from '../../types/customerRateAssignment';
import { CustomerRateAssignmentService } from '../../services/customerRateAssignmentService';
import { DEMO_COURIER_PROVIDERS } from '../../mocks/couriers.mock';
import { DEMO_B2B_RATE_CARDS } from '../../mocks/b2bPricing.mock';
import { DEMO_B2C_RATE_CARDS } from '../../mocks/b2cPricing.mock';

export const AdminCustomerRateAssignmentsPage: React.FC = () => {
  const [tenantId, setTenantId] = useState('tenant-demo-01');
  const [assignments, setAssignments] = useState<CustomerRateAssignment[]>(() =>
    CustomerRateAssignmentService.getAssignments()
  );

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [assignMode, setAssignMode] = useState<'B2B' | 'B2C'>('B2C');
  const [assignCourierId, setAssignCourierId] = useState('delhivery');
  const [assignServiceId, setAssignServiceId] = useState('express-surface');
  const [assignRateCardId, setAssignRateCardId] = useState('b2c-src-standard');
  const [assignIsDefault, setAssignIsDefault] = useState(false);
  const [assignEffectiveFrom, setAssignEffectiveFrom] = useState('2026-08-21');

  // Preview Tool State
  const [prevMode, setPrevMode] = useState<'B2B' | 'B2C'>('B2C');
  const [prevCourierId, setPrevCourierId] = useState('delhivery');
  const [prevOriginPin, setPrevOriginPin] = useState('110001');
  const [prevDestPin, setPrevDestPin] = useState('560038');
  const [prevWeightKg, setPrevWeightKg] = useState('2');
  const [previewResult, setPreviewResult] = useState<{
    serviceable: boolean;
    customerPriceINR: number;
    courierCostINR: number;
    grossMarginINR: number;
    marginPercent: number;
    rateCardName: string;
    rateCardVersion: string;
  } | null>(null);

  const refreshAssignments = () => {
    setAssignments(CustomerRateAssignmentService.getAssignments());
  };

  const currentAssignments = useMemo(
    () => assignments.filter((a) => a.tenantId === tenantId),
    [assignments, tenantId]
  );

  const b2bAssignments = useMemo(() => currentAssignments.filter((a) => a.mode === 'B2B'), [currentAssignments]);
  const b2cAssignments = useMemo(() => currentAssignments.filter((a) => a.mode === 'B2C'), [currentAssignments]);

  const b2bDefault = useMemo(() => b2bAssignments.find((a) => a.isDefault)?.courierName || 'None', [b2bAssignments]);
  const b2cDefault = useMemo(() => b2cAssignments.find((a) => a.isDefault)?.courierName || 'None', [b2cAssignments]);

  const handleCreateAssignment = () => {
    const courierObj = DEMO_COURIER_PROVIDERS.find((c) => c.id === assignCourierId) || DEMO_COURIER_PROVIDERS[0];
    const rateCardObj =
      assignMode === 'B2B'
        ? DEMO_B2B_RATE_CARDS.find((r) => r.id === assignRateCardId)
        : DEMO_B2C_RATE_CARDS.find((r) => r.id === assignRateCardId);

    CustomerRateAssignmentService.assignRateCard({
      tenantId,
      tenantName: 'Acme Logistics Pvt Ltd',
      mode: assignMode,
      courierId: courierObj.id,
      courierName: courierObj.name,
      serviceId: assignServiceId,
      serviceName: assignServiceId === 'express-air' ? 'Express Priority Air' : 'Express Surface Cargo',
      rateCardId: rateCardObj?.id || assignRateCardId,
      rateCardName: rateCardObj?.name || 'Assigned Rate Card',
      rateCardVersion: (rateCardObj?.version as string) || 'v1.0',
      isDefault: assignIsDefault,
      effectiveFrom: assignEffectiveFrom,
    });

    refreshAssignments();
    setIsAddOpen(false);
  };

  const handleSetDefault = (mode: 'B2B' | 'B2C', assignmentId: string) => {
    CustomerRateAssignmentService.setDefaultCourier(tenantId, mode, assignmentId);
    refreshAssignments();
  };

  const handleDeactivate = (assignmentId: string) => {
    CustomerRateAssignmentService.deactivateAssignment(assignmentId);
    refreshAssignments();
  };

  const handleRemove = (assignmentId: string) => {
    CustomerRateAssignmentService.removeAssignment(assignmentId);
    refreshAssignments();
  };

  const handleRunAdminPreview = () => {
    const eligible = CustomerRateAssignmentService.getEligibleCouriersForCustomer(
      tenantId,
      prevMode,
      prevOriginPin,
      prevDestPin,
      (parseFloat(prevWeightKg) || 1) * 1000,
      'PREPAID',
      0
    );

    const target = eligible.find((e) => e.courierId === prevCourierId) || eligible[0];

    if (!target) {
      setPreviewResult(null);
      alert('No eligible courier assignment found for selected criteria.');
      return;
    }

    const price = target.customerPriceINR;
    const cost = Math.round(price * 0.72);
    const margin = price - cost;

    setPreviewResult({
      serviceable: target.serviceable,
      customerPriceINR: price,
      courierCostINR: cost,
      grossMarginINR: margin,
      marginPercent: Math.round((margin / price) * 100),
      rateCardName: target.rateCardName,
      rateCardVersion: target.rateCardVersion,
    });
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Customers', path: '/admin/customers' },
    { label: 'Customer Rate Assignments', path: '/admin/customer-rate-assignments' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Customer-Specific Courier & Rate Assignment Control"
        description="Assign B2B and B2C selling rate cards, enable/disable courier partners per merchant tenant, set default couriers, and preview customer prices."
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={() => setIsAddOpen(true)}>
            + Add Rate Card Assignment
          </Button>
        }
      />

      {/* 2. Tenant Selector & Overview Cards */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '280px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
              Select Merchant Customer Tenant:
            </label>
            <Select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              options={[
                { value: 'tenant-demo-01', label: 'Acme Logistics Pvt Ltd (tenant-demo-01)' },
                { value: 'tenant-acme-02', label: 'Zomato Merchant Partner (tenant-acme-02)' },
                { value: 'tenant-vip-03', label: 'Nexus Tech B2B (tenant-vip-03)' },
              ]}
            />
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Active B2C Couriers" value={b2cAssignments.length} subtext={`B2C Default: ${b2cDefault}`} icon={Users} />
        <StatCard label="Active B2B Couriers" value={b2bAssignments.length} subtext={`B2B Default: ${b2bDefault}`} icon={Users} />
        <StatCard label="Tenant Isolation" value="100% Isolated" subtext="Merchant pricing protected" icon={Star} />
      </div>

      {/* 3. B2C PRICING ASSIGNMENTS TABLE */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold' }}>
            B2C Consumer Shipping Assignments
          </h4>
          <Button variant="outline" size="sm" onClick={() => { setAssignMode('B2C'); setIsAddOpen(true); }}>
            + Assign B2C Courier
          </Button>
        </div>

        <Table<CustomerRateAssignment>
          keyExtractor={(r) => r.id}
          columns={[
            { key: 'courierName', header: 'Courier Partner & Service', render: (r) => <strong>{r.courierName} ({r.serviceName})</strong> },
            {
              key: 'rateCardName',
              header: 'Assigned Rate Card',
              render: (r) => (
                <div>
                  <strong style={{ color: 'var(--color-violet-main)' }}>{r.rateCardName}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Version: {r.rateCardVersion}</div>
                </div>
              ),
            },
            { key: 'isDefault', header: 'Default Courier', render: (r) => <Badge variant={r.isDefault ? 'brand' : 'neutral'}>{r.isDefault ? 'DEFAULT COURIER' : 'Standard'}</Badge> },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'ACTIVE' ? 'success' : 'neutral'}>{r.status}</Badge> },
            { key: 'effectiveFrom', header: 'Effective From', render: (r) => <span>{r.effectiveFrom}</span> },
            {
              key: 'actions',
              header: 'Actions',
              render: (r) => (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {!r.isDefault && (
                    <Button variant="outline" size="sm" onClick={() => handleSetDefault('B2C', r.id)}>
                      Make Default
                    </Button>
                  )}
                  {r.status === 'ACTIVE' && (
                    <Button variant="ghost" size="sm" onClick={() => handleDeactivate(r.id)}>
                      Deactivate
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleRemove(r.id)}>
                    Remove
                  </Button>
                </div>
              ),
            },
          ]}
          data={b2cAssignments}
        />
      </Card>

      {/* 4. B2B PRICING ASSIGNMENTS TABLE */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold' }}>
            B2B Commercial Cargo Assignments
          </h4>
          <Button variant="outline" size="sm" onClick={() => { setAssignMode('B2B'); setIsAddOpen(true); }}>
            + Assign B2B Courier
          </Button>
        </div>

        <Table<CustomerRateAssignment>
          keyExtractor={(r) => r.id}
          columns={[
            { key: 'courierName', header: 'Courier Partner & Service', render: (r) => <strong>{r.courierName} ({r.serviceName})</strong> },
            {
              key: 'rateCardName',
              header: 'Assigned Rate Card',
              render: (r) => (
                <div>
                  <strong style={{ color: 'var(--color-violet-main)' }}>{r.rateCardName}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Version: {r.rateCardVersion}</div>
                </div>
              ),
            },
            { key: 'isDefault', header: 'Default Courier', render: (r) => <Badge variant={r.isDefault ? 'brand' : 'neutral'}>{r.isDefault ? 'DEFAULT COURIER' : 'Standard'}</Badge>, },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'ACTIVE' ? 'success' : 'neutral'}>{r.status}</Badge> },
            { key: 'effectiveFrom', header: 'Effective From', render: (r) => <span>{r.effectiveFrom}</span> },
            {
              key: 'actions',
              header: 'Actions',
              render: (r) => (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {!r.isDefault && (
                    <Button variant="outline" size="sm" onClick={() => handleSetDefault('B2B', r.id)}>
                      Make Default
                    </Button>
                  )}
                  {r.status === 'ACTIVE' && (
                    <Button variant="ghost" size="sm" onClick={() => handleDeactivate(r.id)}>
                      Deactivate
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleRemove(r.id)}>
                    Remove
                  </Button>
                </div>
              ),
            },
          ]}
          data={b2bAssignments}
        />
      </Card>

      {/* 5. ADMIN CUSTOMER PRICING PREVIEW CALCULATOR */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <Calculator size={20} style={{ color: 'var(--color-violet-main)' }} />
          <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', margin: 0 }}>
            Preview Customer Assigned Rates & Margin Analysis
          </h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
          <Select
            label="Shipping Mode *"
            value={prevMode}
            onChange={(e) => setPrevMode(e.target.value as any)}
            options={[
              { value: 'B2C', label: 'B2C Consumer' },
              { value: 'B2B', label: 'B2B Commercial Cargo' },
            ]}
          />
          <Select
            label="Assigned Courier *"
            value={prevCourierId}
            onChange={(e) => setPrevCourierId(e.target.value)}
            options={DEMO_COURIER_PROVIDERS.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Input label="Origin PIN *" value={prevOriginPin} onChange={(e) => setPrevOriginPin(e.target.value)} />
          <Input label="Destination PIN *" value={prevDestPin} onChange={(e) => setPrevDestPin(e.target.value)} />
          <Input label="Weight (KG) *" type="number" value={prevWeightKg} onChange={(e) => setPrevWeightKg(e.target.value)} />
        </div>

        <Button variant="primary" style={{ marginTop: 'var(--space-4)' }} onClick={handleRunAdminPreview}>
          Preview Customer Price & Buy Cost
        </Button>

        {previewResult && (
          <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-5)', borderRadius: 'var(--radius-default)', backgroundColor: 'var(--color-surface-secondary)' }}>
            <h4 style={{ fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>
              Assigned Pricing Result ({previewResult.rateCardName} v{previewResult.rateCardVersion}):
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Customer Selling Price</span>
                <strong style={{ fontSize: '20px', color: 'var(--color-violet-main)' }}>
                  ₹{previewResult.customerPriceINR.toFixed(2)}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Internal Courier Buy Cost</span>
                <strong style={{ fontSize: '20px', color: 'var(--color-text-secondary)' }}>
                  ₹{previewResult.courierCostINR.toFixed(2)}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Platform Gross Margin</span>
                <strong style={{ fontSize: '20px', color: 'var(--color-success)' }}>
                  +₹{previewResult.grossMarginINR.toFixed(2)} ({previewResult.marginPercent}.0%)
                </strong>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Add Assignment Modal */}
      {isAddOpen && (
        <ConfirmationDialog
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onConfirm={handleCreateAssignment}
          title="Assign Rate Card to Merchant Customer"
          description="Assign a courier partner and selling rate card to this customer tenant."
          confirmLabel="Assign Rate Card"
          cancelLabel="Cancel"
          variant="primary"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Select
              label="Shipping Mode *"
              value={assignMode}
              onChange={(e) => setAssignMode(e.target.value as any)}
              options={[
                { value: 'B2C', label: 'B2C Consumer' },
                { value: 'B2B', label: 'B2B Commercial' },
              ]}
            />
            <Select
              label="Courier Partner *"
              value={assignCourierId}
              onChange={(e) => setAssignCourierId(e.target.value)}
              options={DEMO_COURIER_PROVIDERS.map((c) => ({ value: c.id, label: c.name }))}
            />
            <Select
              label="Courier Service *"
              value={assignServiceId}
              onChange={(e) => setAssignServiceId(e.target.value)}
              options={[
                { value: 'express-surface', label: 'Express Surface Cargo' },
                { value: 'express-air', label: 'Express Priority Air' },
              ]}
            />
            <Select
              label="Select Rate Card *"
              value={assignRateCardId}
              onChange={(e) => setAssignRateCardId(e.target.value)}
              options={
                assignMode === 'B2B'
                  ? DEMO_B2B_RATE_CARDS.map((r) => ({ value: r.id, label: `${r.name} (${r.version})` }))
                  : DEMO_B2C_RATE_CARDS.map((r) => ({ value: r.id, label: `${r.name} (${r.version})` }))
              }
            />
            <Select
              label="Set as Default Courier? *"
              value={assignIsDefault ? 'true' : 'false'}
              onChange={(e) => setAssignIsDefault(e.target.value === 'true')}
              options={[
                { value: 'false', label: 'No - Standard Assignment' },
                { value: 'true', label: 'Yes - Make Default Courier' },
              ]}
            />
            <Input
              label="Effective From Date *"
              type="date"
              value={assignEffectiveFrom}
              onChange={(e) => setAssignEffectiveFrom(e.target.value)}
            />
          </div>
        </ConfirmationDialog>
      )}
    </div>
  );
};
