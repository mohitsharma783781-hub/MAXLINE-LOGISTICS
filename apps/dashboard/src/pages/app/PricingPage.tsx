import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Plus,
  IndianRupee,
  Percent,
  Layers,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Input,
  Select,
  Table,
  Alert,
  ConfirmationDialog,
} from '../../components/ui';
import type {
  PricingRule,
  PricingRuleScope,
  MarkupType,
  DiscountType,
  PricingCalculationResult,
} from '../../types/pricing';
import { DEMO_PRICING_RULES, DEMO_CUSTOMER_GROUPS } from '../../mocks/pricing.mock';
import { PricingEngine } from '../../services/pricingEngine';

export const PricingPage: React.FC = () => {
  const [rules, setRules] = useState<PricingRule[]>(DEMO_PRICING_RULES);
  const [activeTab, setActiveTab] = useState<'rules' | 'preview' | 'customer_tiers'>('rules');

  // Preview Sandbox State
  const [previewCost, setPreviewCost] = useState<string>('70');
  const [previewCodFee, setPreviewCodFee] = useState<string>('20');
  const [previewWeight, setPreviewWeight] = useState<string>('1500');
  const [previewShipmentType, setPreviewShipmentType] = useState<'B2C' | 'B2B'>('B2C');
  const [previewPaymentMode, setPreviewPaymentMode] = useState<'PREPAID' | 'COD'>('PREPAID');
  const [previewCourier] = useState<string>('bluedart');
  const [previewCustomerGroup, setPreviewCustomerGroup] = useState<string>('grp-001');

  const [previewResult, setPreviewResult] = useState<PricingCalculationResult | null>(null);

  // New Rule Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [ruleName, setRuleName] = useState<string>('');
  const [ruleScope] = useState<PricingRuleScope>('GLOBAL');
  const [markupType] = useState<MarkupType>('PERCENTAGE');
  const [markupValue] = useState<string>('10');
  const [discountType] = useState<DiscountType>('NONE');
  const [discountValue] = useState<string>('0');
  const [codMarkup] = useState<string>('5');
  const [minMargin] = useState<string>('10');
  const [modalError, setModalError] = useState<string | null>(null);

  // Overlap Detection
  const overlaps = useMemo(() => {
    return PricingEngine.detectOverlappingRules(rules);
  }, [rules]);

  // Handle Calculate Sandbox Preview
  const handleRunPreview = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const costMinor = Math.round(parseFloat(previewCost || '0') * 100);
    const codFeeMinor = Math.round(parseFloat(previewCodFee || '0') * 100);
    const weightGrams = parseInt(previewWeight, 10) || 1000;

    const result = PricingEngine.calculateSellingPrice(
      {
        tenantId: 'tenant-demo-01',
        courierCostMinor: costMinor,
        courierCodFeeMinor: codFeeMinor,
        courierId: previewCourier,
        customerGroupId: previewCustomerGroup,
        shipmentType: previewShipmentType,
        paymentMode: previewPaymentMode,
        weightGrams,
      },
      rules
    );

    setPreviewResult(result);
  };

  // Handle Toggle Rule Status
  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled, status: !r.enabled ? 'ACTIVE' : 'INACTIVE' } : r))
    );
  };

  // Handle Add New Rule
  const handleCreateRule = () => {
    if (!ruleName.trim()) {
      setModalError('Rule name is required.');
      return;
    }
    const valMarkup = parseFloat(markupValue);
    if (isNaN(valMarkup) || valMarkup < 0) {
      setModalError('Markup value must be a valid non-negative number.');
      return;
    }

    const newRule: PricingRule = {
      id: `rule-${Date.now()}`,
      tenantId: 'tenant-demo-01',
      name: ruleName.trim(),
      description: 'Custom merchant markup rule',
      status: 'ACTIVE',
      priority: 5,
      scope: ruleScope,
      shipmentType: 'BOTH',
      paymentMode: 'BOTH',
      markupType,
      markupValue: markupType === 'FIXED' ? Math.round(valMarkup * 100) : valMarkup,
      discountType,
      discountValue: discountType === 'FIXED' ? Math.round(parseFloat(discountValue || '0') * 100) : parseFloat(discountValue || '0'),
      codMarkupMinor: Math.round(parseFloat(codMarkup || '0') * 100),
      minimumSellingPriceMinor: 0,
      minimumMarginMinor: Math.round(parseFloat(minMargin || '0') * 100),
      enabled: true,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
    };

    setRules((prev) => [newRule, ...prev]);
    setIsAddModalOpen(false);
    setRuleName('');
    setModalError(null);
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Pricing & Markups', path: '/app/pricing' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title="Shipping Pricing Rules & Margin Engine"
        description="Configure merchant selling price markups, margin rules, customer tier discounts, and preview calculated rates."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('preview')}>
              Pricing Preview Sandbox
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={() => setIsAddModalOpen(true)}>
              + Create Pricing Rule
            </Button>
          </div>
        }
      />

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard
          label="Active Pricing Rules"
          value={rules.filter((r) => r.enabled).length}
          subtext={`Out of ${rules.length} total rules`}
          icon={Sliders}
        />
        <StatCard
          label="Default Platform Markup"
          value="10.0%"
          subtext="Global baseline rate"
          icon={Percent}
        />
        <StatCard
          label="Customer Tier Profiles"
          value={DEMO_CUSTOMER_GROUPS.length}
          subtext="Enterprise & Wholesale tiers"
          icon={Layers}
        />
        <StatCard
          label="Average Profit Margin"
          value="12.4%"
          subtext="Net profit per parcel"
          icon={IndianRupee}
        />
      </div>

      {/* OVERLAP WARNING BANNER */}
      {overlaps.length > 0 && (
        <Alert variant="warning" title="Potential Pricing Rule Overlaps Detected">
          {overlaps.map((o) => o.message).join(' | ')}
        </Alert>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-default)',
            fontSize: 'var(--font-size-small)',
            fontWeight: 'bold',
            border: 'none',
            backgroundColor: activeTab === 'rules' ? 'var(--color-violet-main)' : 'transparent',
            color: activeTab === 'rules' ? '#ffffff' : 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          Pricing Rules List ({rules.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-default)',
            fontSize: 'var(--font-size-small)',
            fontWeight: 'bold',
            border: 'none',
            backgroundColor: activeTab === 'preview' ? 'var(--color-violet-main)' : 'transparent',
            color: activeTab === 'preview' ? '#ffffff' : 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          Pricing Preview Sandbox
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('customer_tiers')}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-default)',
            fontSize: 'var(--font-size-small)',
            fontWeight: 'bold',
            border: 'none',
            backgroundColor: activeTab === 'customer_tiers' ? 'var(--color-violet-main)' : 'transparent',
            color: activeTab === 'customer_tiers' ? '#ffffff' : 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          Customer Tiers ({DEMO_CUSTOMER_GROUPS.length})
        </button>
      </div>

      {/* TAB 1: PRICING RULES TABLE */}
      {activeTab === 'rules' && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <Table<PricingRule>
            keyExtractor={(r) => r.id}
            columns={[
              {
                key: 'name',
                header: 'Rule Name',
                render: (row) => (
                  <div>
                    <strong>{row.name}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{row.description}</div>
                  </div>
                ),
              },
              {
                key: 'scope',
                header: 'Scope',
                render: (row) => <Badge variant="neutral">{row.scope}</Badge>,
              },
              {
                key: 'markup',
                header: 'Markup Rate',
                render: (row) => (
                  <Badge variant="success">
                    {row.markupType === 'PERCENTAGE' ? `+${row.markupValue}%` : `+₹${(row.markupValue / 100).toFixed(2)}`}
                  </Badge>
                ),
              },
              {
                key: 'minMargin',
                header: 'Min Margin Protection',
                render: (row) => <span>₹{(row.minimumMarginMinor / 100).toFixed(2)}</span>,
              },
              {
                key: 'enabled',
                header: 'Status',
                render: (row) => (
                  <Badge variant={row.enabled ? 'success' : 'neutral'}>
                    {row.enabled ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <Button
                    variant={row.enabled ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => handleToggleRule(row.id)}
                  >
                    {row.enabled ? 'Disable' : 'Enable'}
                  </Button>
                ),
              },
            ]}
            data={rules}
          />
        </Card>
      )}

      {/* TAB 2: PRICING PREVIEW SANDBOX */}
      {activeTab === 'preview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
          <Card style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
              Pricing Calculator Sandbox
            </h3>
            <form onSubmit={handleRunPreview} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <Input
                label="Courier Base Cost (₹)"
                value={previewCost}
                onChange={(e) => setPreviewCost(e.target.value)}
                type="number"
              />
              <Input
                label="Courier COD Fee (₹)"
                value={previewCodFee}
                onChange={(e) => setPreviewCodFee(e.target.value)}
                type="number"
              />
              <Input
                label="Parcel Weight (Grams)"
                value={previewWeight}
                onChange={(e) => setPreviewWeight(e.target.value)}
                type="number"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <Select
                  label="Payment Mode"
                  value={previewPaymentMode}
                  onChange={(e) => setPreviewPaymentMode(e.target.value as any)}
                  options={[
                    { label: 'PREPAID', value: 'PREPAID' },
                    { label: 'COD', value: 'COD' },
                  ]}
                />
                <Select
                  label="Shipment Type"
                  value={previewShipmentType}
                  onChange={(e) => setPreviewShipmentType(e.target.value as any)}
                  options={[
                    { label: 'B2C Parcel', value: 'B2C' },
                    { label: 'B2B Cargo', value: 'B2B' },
                  ]}
                />
              </div>

              <Select
                label="Customer Tier Group"
                value={previewCustomerGroup}
                onChange={(e) => setPreviewCustomerGroup(e.target.value)}
                options={DEMO_CUSTOMER_GROUPS.map((g) => ({ label: `${g.name} (${g.code})`, value: g.id }))}
              />

              <Button type="submit" variant="primary" style={{ marginTop: 'var(--space-2)' }}>
                Calculate Merchant Selling Price
              </Button>
            </form>
          </Card>

          {/* CALCULATED PREVIEW OUTPUT CARD */}
          <Card style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
              Calculated Selling Price Breakdown
            </h3>

            {previewResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span>Courier Cost:</span>
                  <strong>₹{(previewResult.courierCostMinor / 100).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span>Applied Markup:</span>
                  <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>
                    +₹{(previewResult.markupMinor / 100).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span>Applied Discount:</span>
                  <span style={{ color: 'var(--color-danger)' }}>
                    -₹{(previewResult.discountMinor / 100).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span>Merchant COD Fee:</span>
                  <span>₹{(previewResult.merchantCodFeeMinor / 100).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3) 0', backgroundColor: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-default)', paddingLeft: 'var(--space-3)', paddingRight: 'var(--space-3)' }}>
                  <strong style={{ fontSize: '16px' }}>Merchant Selling Price:</strong>
                  <strong style={{ fontSize: '18px', color: 'var(--color-violet-main)' }}>
                    ₹{(previewResult.sellingPriceMinor / 100).toFixed(2)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0' }}>
                  <span>Profit Margin Amount:</span>
                  <Badge variant="success">
                    ₹{(previewResult.marginMinor / 100).toFixed(2)} ({previewResult.marginPercentage}%)
                  </Badge>
                </div>

                {previewResult.minimumMarginEnforced && (
                  <Alert variant="info" title="Minimum Margin Enforced">
                    Selling price automatically adjusted upwards to protect minimum required margin.
                  </Alert>
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                Fill in parameters on the left and click "Calculate Merchant Selling Price" to view the margin breakdown.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: CUSTOMER TIERS */}
      {activeTab === 'customer_tiers' && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
            Customer Tier Profiles
          </h3>
          <Table<typeof DEMO_CUSTOMER_GROUPS[0]>
            keyExtractor={(g) => g.id}
            columns={[
              {
                key: 'name',
                header: 'Tier Name',
                render: (row) => <strong>{row.name}</strong>,
              },
              {
                key: 'code',
                header: 'Tier Code',
                render: (row) => <Badge variant="brand">{row.code}</Badge>,
              },
              {
                key: 'description',
                header: 'Description',
                render: (row) => <span>{row.description}</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <Badge variant="success">{row.status}</Badge>,
              },
            ]}
            data={DEMO_CUSTOMER_GROUPS}
          />
        </Card>
      )}

      {/* CREATE PRICING RULE MODAL */}
      <ConfirmationDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleCreateRule}
        title="Create New Shipping Pricing Rule"
        description="Configure a custom markup or discount rule for tenant shipments."
        confirmLabel="Save Rule"
        cancelLabel="Cancel"
        variant="primary"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
          <Input
            label="Rule Name"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            placeholder="e.g. Bulk Surface Shipper Discount"
          />
          {modalError && <Alert variant="danger" title="Validation Error">{modalError}</Alert>}
        </div>
      </ConfirmationDialog>
    </div>
  );
};
