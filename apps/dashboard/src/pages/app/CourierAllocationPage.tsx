import React, { useState, useMemo } from 'react';
import {
  Network,
  Plus,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Edit2,
  Trash2,
  Copy,
  Zap,
  Sliders,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Input,
  Select,
  Modal,
  ConfirmationDialog,
  Table,
  Alert,
  EmptyState,
  Skeleton,
} from '../../components/ui';
import type { Column } from '../../components/ui/Table';
import type {
  AllocationRule,
  DefaultAllocationStrategy,
  AllocationEngineInput,
  AllocationEvaluationResult,
  EligibleCourierResult,
  ExcludedCourierResult,
  ActionType,
  ConditionField,
  ConditionOperator,
} from '../../types/allocation';
import type { PaymentMode, ShipmentType } from '../../types/rates';
import {
  INITIAL_DEMO_RULES,
  allocateShipment,
} from '../../mocks/allocation.mock';
import { DEMO_COURIER_CONNECTIONS } from '../../mocks/couriers.mock';

type RuleTableRow = AllocationRule & Record<string, unknown>;

export const CourierAllocationPage: React.FC = () => {
  // Strategy & Mode State
  const [allocationMode, setAllocationMode] = useState<'AUTOMATIC' | 'MANUAL'>('AUTOMATIC');
  const [strategy, setStrategy] = useState<DefaultAllocationStrategy>('BALANCED');

  // Rules State
  const [rules, setRules] = useState<AllocationRule[]>(INITIAL_DEMO_RULES);
  const [ruleFilter, setRuleFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State for Rule Add/Edit
  const [isRuleModalOpen, setIsRuleModalOpen] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<AllocationRule | null>(null);
  const [ruleName, setRuleName] = useState<string>('');
  const [rulePriority, setRulePriority] = useState<number>(1);
  const [ruleConditionField, setRuleConditionField] = useState<ConditionField>('paymentMode');
  const [ruleConditionOp, setRuleConditionOp] = useState<ConditionOperator>('equals');
  const [ruleConditionVal, setRuleConditionVal] = useState<string>('COD');
  const [ruleActionType, setRuleActionType] = useState<ActionType>('PREFER_COD_SUPPORT');
  const [ruleActionVal, setRuleActionVal] = useState<string>('15');

  // Modal State for Delete Confirmation
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);

  // Test Allocation State
  const [testOriginPincode, setTestOriginPincode] = useState<string>('110001');
  const [testDestinationPincode, setTestDestinationPincode] = useState<string>('400001');
  const [testWeight, setTestWeight] = useState<string>('1.5');
  const [testPaymentMode, setTestPaymentMode] = useState<PaymentMode>('COD');
  const [testShipmentType, setTestShipmentType] = useState<ShipmentType>('DOMESTIC');
  const [testPreferredCourier, setTestPreferredCourier] = useState<string>('');

  // Allocation Evaluation Result State
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [hasEvaluated, setHasEvaluated] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<AllocationEvaluationResult | null>(null);

  // Manual Override State
  const [overrideCourierId, setOverrideCourierId] = useState<string | null>(null);
  const [showOverrideMenu, setShowOverrideMenu] = useState<boolean>(false);

  // Filtered Rules List
  const filteredRules = useMemo(() => {
    return rules
      .filter((r) => {
        if (ruleFilter === 'ACTIVE') return r.status === 'ACTIVE';
        if (ruleFilter === 'INACTIVE') return r.status === 'INACTIVE';
        return true;
      })
      .sort((a, b) => a.priority - b.priority);
  }, [rules, ruleFilter]);

  // Open Create Modal
  const handleOpenCreateRule = () => {
    setEditingRule(null);
    setRuleName('');
    setRulePriority(rules.length + 1);
    setRuleConditionField('paymentMode');
    setRuleConditionOp('equals');
    setRuleConditionVal('COD');
    setRuleActionType('PREFER_COD_SUPPORT');
    setRuleActionVal('15');
    setIsRuleModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditRule = (rule: AllocationRule) => {
    setEditingRule(rule);
    setRuleName(rule.name);
    setRulePriority(rule.priority);

    if (rule.conditions.length > 0) {
      setRuleConditionField(rule.conditions[0].field);
      setRuleConditionOp(rule.conditions[0].operator);
      setRuleConditionVal(String(rule.conditions[0].value));
    }

    if (rule.actions.length > 0) {
      setRuleActionType(rule.actions[0].type);
      setRuleActionVal(String(rule.actions[0].value));
    }

    setIsRuleModalOpen(true);
  };

  // Save Rule (Create or Update)
  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    if (editingRule) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRule.id
            ? {
                ...r,
                name: ruleName.trim(),
                priority: Number(rulePriority),
                conditions: [
                  {
                    field: ruleConditionField,
                    operator: ruleConditionOp,
                    value: ruleConditionVal,
                  },
                ],
                actions: [
                  {
                    type: ruleActionType,
                    value: ruleActionVal,
                  },
                ],
              }
            : r
        )
      );
    } else {
      const newRule: AllocationRule = {
        id: `rule-${Date.now()}`,
        name: ruleName.trim(),
        priority: Number(rulePriority),
        status: 'ACTIVE',
        conditions: [
          {
            field: ruleConditionField,
            operator: ruleConditionOp,
            value: ruleConditionVal,
          },
        ],
        actions: [
          {
            type: ruleActionType,
            value: ruleActionVal,
          },
        ],
        createdAt: new Date().toISOString(),
      };
      setRules((prev) => [...prev, newRule]);
    }

    setIsRuleModalOpen(false);
  };

  // Toggle Rule Status
  const handleToggleRuleStatus = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId ? { ...r, status: r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : r
      )
    );
  };

  // Duplicate Rule
  const handleDuplicateRule = (rule: AllocationRule) => {
    const duplicated: AllocationRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      name: `${rule.name} (Copy)`,
      priority: rule.priority + 1,
      createdAt: new Date().toISOString(),
    };
    setRules((prev) => [...prev, duplicated]);
  };

  // Delete Rule
  const handleConfirmDeleteRule = () => {
    if (!deleteRuleId) return;
    setRules((prev) => prev.filter((r) => r.id !== deleteRuleId));
    setDeleteRuleId(null);
  };

  // Run Test Allocation
  const handleRunTestAllocation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setIsEvaluating(true);
    setOverrideCourierId(null);
    setShowOverrideMenu(false);

    setTimeout(() => {
      const input: AllocationEngineInput = {
        originPincode: testOriginPincode.trim(),
        destinationPincode: testDestinationPincode.trim(),
        actualWeight: parseFloat(testWeight) || 1,
        paymentMode: testPaymentMode,
        shipmentType: testShipmentType,
        preferredCourierId: testPreferredCourier || undefined,
      };

      const result = allocateShipment(input, rules, strategy);
      setEvaluationResult(result);
      setIsEvaluating(false);
      setHasEvaluated(true);
    }, 350);
  };

  // Displayed Courier (Automatic or Manual Override)
  const activeRecommendedCourier = useMemo(() => {
    if (!evaluationResult) return null;
    if (overrideCourierId) {
      const overrideMatch = evaluationResult.eligibleCouriers.find((c) => c.courierId === overrideCourierId);
      if (overrideMatch) return overrideMatch;
    }
    return evaluationResult.recommendedCourier;
  }, [evaluationResult, overrideCourierId]);

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Courier Partners', path: '/app/couriers' },
    { label: 'Courier Allocation', path: '/app/couriers/allocation' },
  ];

  // Rules Table Columns
  const ruleColumns: Column<RuleTableRow>[] = [
    {
      key: 'priority',
      header: 'Priority',
      render: (row: RuleTableRow) => (
        <Badge variant="brand">P{row.priority as number}</Badge>
      ),
    },
    {
      key: 'name',
      header: 'Rule Name',
      render: (row: RuleTableRow) => (
        <div>
          <div style={{ fontWeight: 'var(--font-weight-bold)' }}>{row.name as string}</div>
          {row.description && (
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{row.description as string}</div>
          )}
        </div>
      ),
    },
    {
      key: 'conditions',
      header: 'Condition',
      render: (row: RuleTableRow) => {
        const conds = row.conditions as AllocationRule['conditions'];
        return (
          <span style={{ fontSize: 'var(--font-size-caption)' }}>
            {conds.map((c) => `${c.field} ${c.operator} ${c.value}`).join(', ')}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Action',
      render: (row: RuleTableRow) => {
        const acts = row.actions as AllocationRule['actions'];
        return (
          <Badge variant="info">
            {acts.map((a) => `${a.type}: ${a.value}`).join(', ')}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: RuleTableRow) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {row.status as string}
        </Badge>
      ),
    },
    {
      key: 'actionsControl',
      header: 'Actions',
      render: (row: RuleTableRow) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleRuleStatus(row.id as string)}
            title="Toggle Status"
          >
            {row.status === 'ACTIVE' ? 'Disable' : 'Enable'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEditRule(row as any)}
            title="Edit Rule"
          >
            <Edit2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDuplicateRule(row as any)}
            title="Duplicate Rule"
          >
            <Copy size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteRuleId(row.id as string)}
            title="Delete Rule"
            style={{ color: 'var(--color-danger)' }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title="Courier Allocation"
        description="Configure how shipments are matched with the most suitable courier."
        breadcrumbs={breadcrumbs}
      />

      {/* Demo Notice Banner */}
      <Alert variant="info" title="Demo Allocation Engine Active">
        Demo allocation — live courier allocation will be activated after API integration. Evaluates rules deterministically using mock parameters.
      </Alert>

      {/* SECTION 1: ALLOCATION OVERVIEW STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard
          label="Active Allocation Rules"
          value={rules.filter((r) => r.status === 'ACTIVE').length}
          subtext={`Out of ${rules.length} total rules`}
          icon={SlidersHorizontal}
        />
        <StatCard
          label="Automatic Allocation"
          value="85%"
          subtext="Auto-routed via priority rules"
          icon={Zap}
        />
        <StatCard
          label="Manual Allocation"
          value="15%"
          subtext="Merchant manual overrides"
          icon={Network}
        />
        <StatCard
          label="Available Couriers"
          value={DEMO_COURIER_CONNECTIONS.filter((c) => c.status === 'connected').length}
          subtext="Connected carrier partners"
          icon={CheckCircle2}
        />
      </div>

      {/* Mode & Strategy Configuration Card */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Sliders size={20} style={{ color: 'var(--color-violet-main)' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: 'var(--font-size-body-lg)', fontWeight: 'var(--font-weight-bold)' }}>
                Allocation Mode & Strategy
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
                Configure default courier selection logic for incoming merchant shipments
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <Select
              label="Allocation Mode"
              value={allocationMode}
              onChange={(e) => setAllocationMode(e.target.value as any)}
              options={[
                { label: 'Automatic (System Evaluates Rules)', value: 'AUTOMATIC' },
                { label: 'Manual (Merchant Choose Courier)', value: 'MANUAL' },
              ]}
            />

            <Select
              label="Default Strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as any)}
              options={[
                { label: 'Balanced (Cost + Speed + SLA)', value: 'BALANCED' },
                { label: 'Lowest Cost First', value: 'LOWEST_COST' },
                { label: 'Fastest Delivery SLA', value: 'FASTEST' },
                { label: 'Preferred Courier First', value: 'PREFERRED_COURIER' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* SECTION 2: ALLOCATION RULES MANAGEMENT */}
      <Card style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-body-lg)', fontWeight: 'var(--font-weight-bold)' }}>
              Allocation Priority Rules
            </h3>
            <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
              Rules are evaluated in priority order (Lower priority number = Higher evaluation precedence)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Select
              value={ruleFilter}
              onChange={(e) => setRuleFilter(e.target.value as any)}
              options={[
                { label: 'All Rules', value: 'ALL' },
                { label: 'Active Only', value: 'ACTIVE' },
                { label: 'Inactive Only', value: 'INACTIVE' },
              ]}
            />

            <Button variant="primary" onClick={handleOpenCreateRule}>
              <Plus size={16} />
              Create Allocation Rule
            </Button>
          </div>
        </div>

        <Table<RuleTableRow>
          columns={ruleColumns}
          data={filteredRules as RuleTableRow[]}
          keyExtractor={(row) => row.id as string}
          emptyText="No allocation rules configured. Click 'Create Allocation Rule' to add one."
        />
      </Card>

      {/* SECTION 3: TEST ALLOCATION INTERFACE */}
      <Card style={{ padding: 'var(--space-5)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-body-lg)', fontWeight: 'var(--font-weight-bold)' }}>
            Test Allocation Engine
          </h3>
          <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
            Simulate shipment allocation against connected couriers & active rules
          </span>
        </div>

        {/* Test Form Grid */}
        <form onSubmit={handleRunTestAllocation} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
            <Input
              label="Origin Pincode *"
              value={testOriginPincode}
              onChange={(e) => setTestOriginPincode(e.target.value)}
              maxLength={6}
            />

            <Input
              label="Destination Pincode *"
              value={testDestinationPincode}
              onChange={(e) => setTestDestinationPincode(e.target.value)}
              maxLength={6}
            />

            <Input
              label="Weight (KG) *"
              type="number"
              step="0.1"
              value={testWeight}
              onChange={(e) => setTestWeight(e.target.value)}
            />

            <Select
              label="Payment Mode"
              value={testPaymentMode}
              onChange={(e) => setTestPaymentMode(e.target.value as PaymentMode)}
              options={[
                { label: 'Cash on Delivery (COD)', value: 'COD' },
                { label: 'Prepaid', value: 'PREPAID' },
              ]}
            />

            <Select
              label="Shipment Type"
              value={testShipmentType}
              onChange={(e) => setTestShipmentType(e.target.value as ShipmentType)}
              options={[
                { label: 'Domestic', value: 'DOMESTIC' },
              ]}
            />

            <Select
              label="Preferred Courier (Optional)"
              value={testPreferredCourier}
              onChange={(e) => setTestPreferredCourier(e.target.value)}
              options={[
                { label: 'None', value: '' },
                { label: 'Delhivery', value: 'delhivery' },
                { label: 'Blue Dart', value: 'bluedart' },
                { label: 'Shadowfax', value: 'shadowfax' },
                { label: 'Xpressbees', value: 'xpressbees' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button type="submit" variant="primary" isLoading={isEvaluating}>
              <Play size={16} />
              Run Allocation Simulation
            </Button>
          </div>
        </form>

        {/* Allocation Simulation Result */}
        {isEvaluating ? (
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Skeleton width="40%" height="24px" />
            <Skeleton width="100%" height="100px" />
            <Skeleton width="100%" height="120px" />
          </div>
        ) : !hasEvaluated || !evaluationResult ? (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <EmptyState
              icon={<Network size={32} />}
              title="Run Allocation Simulation"
              description="Fill out the shipment parameters above and click 'Run Allocation Simulation' to evaluate courier eligibility and rules."
            />
          </div>
        ) : (
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* Recommended Courier Box */}
            {activeRecommendedCourier ? (
              <div
                style={{
                  backgroundColor: overrideCourierId ? 'rgba(234, 179, 8, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                  border: overrideCourierId ? '1.5px solid var(--color-warning)' : '1.5px solid var(--color-success)',
                  borderRadius: 'var(--radius-default)',
                  padding: 'var(--space-5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span style={{ fontSize: '32px' }}>{activeRecommendedCourier.courierLogo}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <h3 style={{ margin: 0, fontSize: 'var(--font-size-h4)', fontWeight: 'var(--font-weight-bold)' }}>
                          {activeRecommendedCourier.courierName} ({activeRecommendedCourier.serviceName})
                        </h3>
                        <Badge variant={overrideCourierId ? 'warning' : 'success'}>
                          {overrideCourierId ? 'Manual Override Selected' : 'Recommended Courier'}
                        </Badge>
                        <Badge variant="brand">Score: {activeRecommendedCourier.score}/100</Badge>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Cost: <strong>₹{activeRecommendedCourier.totalCost}</strong> • ETA: <strong>{activeRecommendedCourier.estimatedDays}</strong> • COD: <strong>{activeRecommendedCourier.codSupported ? 'Supported' : 'No'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Manual Override Action Button */}
                  <div>
                    <Button
                      variant="secondary"
                      onClick={() => setShowOverrideMenu(!showOverrideMenu)}
                    >
                      Choose Another Courier
                      <ChevronDown size={14} />
                    </Button>
                  </div>
                </div>

                {/* Manual Override Selector Menu */}
                {showOverrideMenu && (
                  <div
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-default)',
                      padding: 'var(--space-4)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <Alert variant="warning" title="Manual Override Active">
                      Manual selection overrides the automatic rule recommendation. Only eligible connected couriers can be selected.
                    </Alert>

                    <Select
                      label="Select Manual Courier Override"
                      value={overrideCourierId || activeRecommendedCourier.courierId}
                      onChange={(e) => setOverrideCourierId(e.target.value)}
                      options={evaluationResult.eligibleCouriers.map((c) => ({
                        label: `${c.courierName} (${c.serviceName}) — ₹${c.totalCost} • ${c.estimatedDays} (Score: ${c.score}/100)`,
                        value: c.courierId,
                      }))}
                    />

                    {overrideCourierId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setOverrideCourierId(null);
                          setShowOverrideMenu(false);
                        }}
                      >
                        <RotateCcw size={14} />
                        Reset to Automatic Recommendation
                      </Button>
                    )}
                  </div>
                )}

                {/* Explainability Reason Banner */}
                <div
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-default)',
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-text-primary)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-2)',
                  }}
                >
                  <Info size={16} style={{ color: 'var(--color-violet-main)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Why this courier?</strong>
                    <div>{evaluationResult.recommendationReason}</div>
                  </div>
                </div>
              </div>
            ) : (
              <Alert variant="danger" title="No Eligible Courier Found">
                No connected courier partner meets the serviceability, payment mode, and allocation rule criteria.
              </Alert>
            )}

            {/* Eligible Couriers Section */}
            <div>
              <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--font-size-body-lg)', fontWeight: 'var(--font-weight-bold)' }}>
                Eligible Candidate Couriers ({evaluationResult.eligibleCouriers.length})
              </h4>
              <Table<EligibleCourierResult & Record<string, unknown>>
                columns={[
                  {
                    key: 'courierName',
                    header: 'Courier & Service',
                    render: (row) => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span>{row.courierLogo as string}</span>
                        <div>
                          <strong style={{ display: 'block' }}>{row.courierName as string}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{row.serviceName as string}</span>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'totalCost',
                    header: 'Freight Cost',
                    render: (row) => <strong>₹{row.totalCost as number}</strong>,
                  },
                  {
                    key: 'estimatedDays',
                    header: 'ETA',
                    render: (row) => <span>{row.estimatedDays as string}</span>,
                  },
                  {
                    key: 'score',
                    header: 'Match Score',
                    render: (row) => (
                      <Badge variant="brand">{row.score as number}/100</Badge>
                    ),
                  },
                  {
                    key: 'scoreBreakdown',
                    header: 'Score Breakdown',
                    render: (row) => {
                      const bd = row.scoreBreakdown as EligibleCourierResult['scoreBreakdown'];
                      return (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          Cost: +{bd.costScore} | Speed: +{bd.speedScore} | Rule Bonus: +{bd.ruleBonus}
                        </span>
                      );
                    },
                  },
                ]}
                data={evaluationResult.eligibleCouriers as any}
                keyExtractor={(row) => `${row.courierId}-${row.serviceId}`}
                emptyText="No eligible couriers."
              />
            </div>

            {/* Excluded Couriers Section */}
            {evaluationResult.excludedCouriers.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--font-size-body-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-secondary)' }}>
                  Excluded Couriers & Reasons ({evaluationResult.excludedCouriers.length})
                </h4>
                <Table<ExcludedCourierResult & Record<string, unknown>>
                  columns={[
                    {
                      key: 'courierName',
                      header: 'Courier',
                      render: (row) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span>{row.courierLogo as string}</span>
                          <span>{row.courierName as string} ({row.serviceName as string})</span>
                        </div>
                      ),
                    },
                    {
                      key: 'reason',
                      header: 'Exclusion Reason',
                      render: (row) => (
                        <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-danger)' }}>
                          <AlertTriangle size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                          {row.reason as string}
                        </span>
                      ),
                    },
                  ]}
                  data={evaluationResult.excludedCouriers as any}
                  keyExtractor={(row) => `${row.courierId}-${row.serviceName}`}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* CREATE / EDIT RULE MODAL */}
      <Modal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        title={editingRule ? 'Edit Allocation Rule' : 'Create Allocation Rule'}
      >
        <form onSubmit={handleSaveRule} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            label="Rule Name *"
            placeholder="e.g. High Value Express Priority"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            required
          />

          <Input
            label="Rule Priority Number (1 = Highest) *"
            type="number"
            min={1}
            value={String(rulePriority)}
            onChange={(e) => setRulePriority(Number(e.target.value))}
            required
          />

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
            <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
              WHEN CONDITION MATCHES:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
              <Select
                label="Field"
                value={ruleConditionField}
                onChange={(e) => setRuleConditionField(e.target.value as any)}
                options={[
                  { label: 'Payment Mode', value: 'paymentMode' },
                  { label: 'Actual Weight', value: 'actualWeight' },
                  { label: 'Origin Pincode', value: 'originPincode' },
                  { label: 'Destination Pincode', value: 'destinationPincode' },
                  { label: 'Estimated Days SLA', value: 'estimatedDays' },
                ]}
              />

              <Select
                label="Operator"
                value={ruleConditionOp}
                onChange={(e) => setRuleConditionOp(e.target.value as any)}
                options={[
                  { label: 'Equals (=)', value: 'equals' },
                  { label: 'Not Equals (!=)', value: 'notEquals' },
                  { label: 'Greater Than (>)', value: 'greaterThan' },
                  { label: 'Less Than (<)', value: 'lessThan' },
                  { label: 'Contains', value: 'contains' },
                ]}
              />

              <Input
                label="Target Value"
                value={ruleConditionVal}
                onChange={(e) => setRuleConditionVal(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
            <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
              THEN TAKE ACTION:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
              <Select
                label="Action Type"
                value={ruleActionType}
                onChange={(e) => setRuleActionType(e.target.value as any)}
                options={[
                  { label: 'Prefer Courier Partner', value: 'PREFER_COURIER' },
                  { label: 'Exclude Courier Partner', value: 'EXCLUDE_COURIER' },
                  { label: 'Prefer Service Type', value: 'PREFER_SERVICE' },
                  { label: 'Set Max Freight Cost', value: 'SET_MAX_COST' },
                  { label: 'Set Max Delivery ETA', value: 'SET_MAX_ETA' },
                  { label: 'Prefer COD Support', value: 'PREFER_COD_SUPPORT' },
                ]}
              />

              <Input
                label="Action Value"
                value={ruleActionVal}
                onChange={(e) => setRuleActionVal(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            <Button type="button" variant="secondary" onClick={() => setIsRuleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Allocation Rule
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmationDialog
        isOpen={!!deleteRuleId}
        onClose={() => setDeleteRuleId(null)}
        onConfirm={handleConfirmDeleteRule}
        title="Delete Allocation Rule"
        description="Are you sure you want to delete this allocation rule? This action cannot be undone."
        confirmLabel="Delete Rule"
        variant="danger"
      />
    </div>
  );
};
