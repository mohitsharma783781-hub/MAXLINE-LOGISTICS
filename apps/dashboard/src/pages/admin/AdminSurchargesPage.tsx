import React, { useState } from 'react';
import {
  IndianRupee,
  Plus,
  Sliders,
  CheckCircle2,
  Edit2,
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
  Modal,
  Alert,
} from '../../components/ui';

export interface SurchargeMasterRule extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  applicableMode: 'B2B' | 'B2C' | 'BOTH';
  calcType: 'FIXED' | 'PERCENTAGE' | 'PER_KG' | 'PER_DOCKET' | 'PERCENTAGE_OF_COD' | 'PERCENTAGE_OF_INVOICE_VALUE';
  value: number;
  minAmountPaise?: number;
  maxAmountPaise?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export const DEMO_GLOBAL_SURCHARGES: SurchargeMasterRule[] = [
  { id: 'sur-1', name: 'Docket / AWB Charge', code: 'DOCKET', applicableMode: 'BOTH', calcType: 'PER_DOCKET', value: 5000, status: 'ACTIVE' },
  { id: 'sur-2', name: 'Fuel Surcharge', code: 'FUEL', applicableMode: 'BOTH', calcType: 'PERCENTAGE', value: 18, status: 'ACTIVE' },
  { id: 'sur-3', name: 'ROV / Risk Coverage', code: 'ROV', applicableMode: 'B2B', calcType: 'PERCENTAGE_OF_INVOICE_VALUE', value: 0.2, minAmountPaise: 5000, status: 'ACTIVE' },
  { id: 'sur-4', name: 'Insurance Fee', code: 'INSURANCE', applicableMode: 'BOTH', calcType: 'PERCENTAGE_OF_INVOICE_VALUE', value: 0.1, minAmountPaise: 2500, status: 'ACTIVE' },
  { id: 'sur-5', name: 'COD Collection Fee', code: 'COD', applicableMode: 'BOTH', calcType: 'PERCENTAGE_OF_COD', value: 1.5, minAmountPaise: 3000, status: 'ACTIVE' },
  { id: 'sur-6', name: 'Cargo Handling Fee', code: 'HANDLING', applicableMode: 'B2B', calcType: 'PER_KG', value: 100, status: 'ACTIVE' },
  { id: 'sur-7', name: 'First Mile Pickup Fee', code: 'FM', applicableMode: 'BOTH', calcType: 'FIXED', value: 2500, status: 'ACTIVE' },
  { id: 'sur-8', name: 'Appointment Delivery Fee', code: 'APPOINTMENT', applicableMode: 'B2B', calcType: 'FIXED', value: 5000, status: 'ACTIVE' },
];

export const AdminSurchargesPage: React.FC = () => {
  const [surcharges, setSurcharges] = useState<SurchargeMasterRule[]>(DEMO_GLOBAL_SURCHARGES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SurchargeMasterRule | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formMode, setFormMode] = useState<'B2B' | 'B2C' | 'BOTH'>('BOTH');
  const [formCalcType, setFormCalcType] = useState<SurchargeMasterRule['calcType']>('FIXED');
  const [formValue, setFormValue] = useState('');
  const [formMin, setFormMin] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingRule(null);
    setFormName('');
    setFormCode('');
    setFormMode('BOTH');
    setFormCalcType('FIXED');
    setFormValue('');
    setFormMin('');
    setIsModalOpen(true);
  };

  const handleSaveRule = () => {
    if (!formName.trim()) return;
    const val = parseFloat(formValue) || 0;
    const minP = formMin ? Math.round(parseFloat(formMin) * 100) : undefined;

    if (editingRule) {
      setSurcharges((prev) =>
        prev.map((r) =>
          r.id === editingRule.id
            ? {
                ...r,
                name: formName.trim(),
                code: formCode.trim().toUpperCase() || r.code,
                applicableMode: formMode,
                calcType: formCalcType,
                value: formCalcType === 'PERCENTAGE' || formCalcType === 'PERCENTAGE_OF_COD' || formCalcType === 'PERCENTAGE_OF_INVOICE_VALUE' ? val : Math.round(val * 100),
                minAmountPaise: minP,
              }
            : r
        )
      );
      setToastMessage(`Updated ${formName} surcharge rule.`);
    } else {
      const newRule: SurchargeMasterRule = {
        id: `sur-${Date.now()}`,
        name: formName.trim(),
        code: formCode.trim().toUpperCase() || `SUR_${Date.now()}`,
        applicableMode: formMode,
        calcType: formCalcType,
        value: formCalcType === 'PERCENTAGE' || formCalcType === 'PERCENTAGE_OF_COD' || formCalcType === 'PERCENTAGE_OF_INVOICE_VALUE' ? val : Math.round(val * 100),
        minAmountPaise: minP,
        status: 'ACTIVE',
      };
      setSurcharges((prev) => [newRule, ...prev]);
      setToastMessage(`Added new surcharge rule ${newRule.name}.`);
    }

    setIsModalOpen(false);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Rate Cards', path: '/admin/b2b-rates' },
    { label: 'Additional Charges', path: '/admin/surcharges' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* PAGE HEADER */}
      <PageHeader
        title="Additional Charges & Surcharges Master"
        description="Configure platform surcharge rules (Docket, Fuel, ROV, Insurance, COD, Handling, FM, Appointment, Custom charges) across B2B and B2C rate cards."
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={handleOpenAdd}>
            + Add Surcharge Rule
          </Button>
        }
      />

      {toastMessage && (
        <Alert variant="success" title="Surcharge Master Updated">
          {toastMessage}
        </Alert>
      )}

      {/* METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard label="TOTAL SURCHARGE RULES" value={surcharges.length} subtext="Active Surcharges" badgeText="MASTER" badgeVariant="neutral" icon={IndianRupee} />
        <StatCard label="B2B SPECIFIC CHARGES" value={surcharges.filter((s) => s.applicableMode === 'B2B' || s.applicableMode === 'BOTH').length} subtext="Freight Cargo Rules" badgeText="B2B" badgeVariant="info" icon={Sliders} />
        <StatCard label="B2C SPECIFIC CHARGES" value={surcharges.filter((s) => s.applicableMode === 'B2C' || s.applicableMode === 'BOTH').length} subtext="Express Courier Rules" badgeText="B2C" badgeVariant="success" icon={CheckCircle2} />
      </div>

      {/* SURCHARGES TABLE */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          Master Surcharges & Additional Fee Rules
        </h3>

        <Table<SurchargeMasterRule>
          keyExtractor={(r) => r.id}
          columns={[
            { key: 'code', header: 'Code', render: (r) => <Badge variant="neutral"><strong style={{ fontFamily: 'var(--font-mono)' }}>{r.code}</strong></Badge> },
            { key: 'name', header: 'Charge Name', render: (r) => <strong>{r.name}</strong> },
            { key: 'applicableMode', header: 'Applicable Mode', render: (r) => <Badge variant={r.applicableMode === 'B2B' ? 'info' : r.applicableMode === 'B2C' ? 'success' : 'brand'}>{r.applicableMode}</Badge> },
            { key: 'calcType', header: 'Calculation Type', render: (r) => <Badge variant="neutral">{r.calcType}</Badge> },
            {
              key: 'value',
              header: 'Configured Value',
              render: (r) => (
                <strong style={{ color: 'var(--color-violet-main)' }}>
                  {r.calcType === 'PERCENTAGE' || r.calcType === 'PERCENTAGE_OF_COD' || r.calcType === 'PERCENTAGE_OF_INVOICE_VALUE'
                    ? `${r.value}%`
                    : `₹${(r.value / 100).toFixed(2)}`}
                </strong>
              ),
            },
            { key: 'minAmountPaise', header: 'Min Floor Cap', render: (r) => <span>{r.minAmountPaise ? `₹${(r.minAmountPaise / 100).toFixed(2)}` : '-'}</span> },
            { key: 'status', header: 'Status', render: (r) => <Badge variant="success">{r.status}</Badge> },
            {
              key: 'actions',
              header: 'Actions',
              align: 'right',
              render: (r) => (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit2 size={12} />}
                  onClick={() => {
                    setEditingRule(r);
                    setFormName(r.name);
                    setFormCode(r.code);
                    setFormMode(r.applicableMode);
                    setFormCalcType(r.calcType);
                    setFormValue(
                      r.calcType === 'PERCENTAGE' || r.calcType === 'PERCENTAGE_OF_COD' || r.calcType === 'PERCENTAGE_OF_INVOICE_VALUE'
                        ? r.value.toString()
                        : (r.value / 100).toString()
                    );
                    setFormMin(r.minAmountPaise ? (r.minAmountPaise / 100).toString() : '');
                    setIsModalOpen(true);
                  }}
                >
                  Edit Rule
                </Button>
              ),
            },
          ]}
          data={surcharges}
        />
      </Card>

      {/* ADD / EDIT SURCHARGE MODAL */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRule ? `Edit ${editingRule.name}` : 'Add New Additional Surcharge Rule'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Surcharge Name *" placeholder="e.g. Fuel Surcharge" value={formName} onChange={(e) => setFormName(e.target.value)} />
            <Input label="Code (e.g. FUEL, DOCKET) *" placeholder="FUEL" value={formCode} onChange={(e) => setFormCode(e.target.value)} />

            <Select
              label="Applicable Commercial Mode *"
              value={formMode}
              onChange={(e) => setFormMode(e.target.value as any)}
              options={[
                { value: 'BOTH', label: 'B2B Cargo & B2C Express (Both)' },
                { value: 'B2B', label: 'B2B Freight Cargo Only' },
                { value: 'B2C', label: 'B2C Express Courier Only' },
              ]}
            />

            <Select
              label="Calculation Method *"
              value={formCalcType}
              onChange={(e) => setFormCalcType(e.target.value as any)}
              options={[
                { value: 'FIXED', label: 'Fixed ₹ Flat Charge' },
                { value: 'PERCENTAGE', label: 'Percentage % of Base Freight' },
                { value: 'PER_KG', label: '₹ per Chargeable KG' },
                { value: 'PER_DOCKET', label: '₹ per Docket / Shipment' },
                { value: 'PERCENTAGE_OF_COD', label: 'Percentage % of COD Amount' },
                { value: 'PERCENTAGE_OF_INVOICE_VALUE', label: 'Percentage % of Invoice Value' },
              ]}
            />

            <Input label="Value (% or ₹) *" type="number" step="0.1" placeholder="18 for 18% or 50 for ₹50" value={formValue} onChange={(e) => setFormValue(e.target.value)} />
            <Input label="Minimum Floor Cap Amount (₹) (Optional)" type="number" placeholder="e.g. 75" value={formMin} onChange={(e) => setFormMin(e.target.value)} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveRule}>
                Save Surcharge Rule
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
