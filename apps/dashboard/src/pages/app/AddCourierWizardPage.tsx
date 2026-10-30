import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Truck,
  Key,
  Settings,
  Sliders,
  Zap,
  Edit2,
  Lock,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Input,
  Checkbox,
  Alert,
  ConfirmationDialog,
  Select,
} from '../../components/ui';
import { DEMO_COURIER_PROVIDERS } from '../../mocks/couriers.mock';
import type { CreateCourierConnectionForm, CourierServiceType } from '../../types/couriers';

export const AddCourierWizardPage: React.FC = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<CreateCourierConnectionForm>({
    courierId: 'bluedart',
    credentials: {
      apiKey: 'demo_license_key_90812',
      apiSecret: 'demo_secret_token_110293',
    },
    accountId: 'BD-ACC-90412',
    defaultWarehouseId: 'wh-001',
    defaultService: 'express',
    enabledServices: ['express', 'air'],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState<boolean>(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState<boolean>(false);

  const steps = [
    { num: 1, label: 'Select Partner', icon: Truck },
    { num: 2, label: 'Authentication', icon: Key },
    { num: 3, label: 'Configuration', icon: Settings },
    { num: 4, label: 'Services', icon: Sliders },
    { num: 5, label: 'Test Connection', icon: Zap },
    { num: 6, label: 'Review', icon: CheckCircle2 },
  ];

  const selectedProvider = DEMO_COURIER_PROVIDERS.find((p) => p.id === formData.courierId) || DEMO_COURIER_PROVIDERS[0];

  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1 && !formData.courierId) {
      errs.provider = 'Please select a courier partner.';
    } else if (step === 2) {
      selectedProvider.authSchema.forEach((field) => {
        if (field.required && !formData.credentials[field.key]?.trim()) {
          errs[field.key] = `${field.label} is required.`;
        }
      });
    } else if (step === 3 && !formData.accountId.trim()) {
      errs.account = 'Courier Account ID is required.';
    } else if (step === 4 && formData.enabledServices.length === 0) {
      errs.services = 'Please enable at least one shipping service.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 6) {
        setCurrentStep((prev) => prev + 1);
      } else {
        setIsSuccessDialogOpen(true);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setErrors({});
      setCurrentStep((prev) => prev - 1);
    }
  };

  const toggleService = (srv: CourierServiceType) => {
    setFormData((prev) => ({
      ...prev,
      enabledServices: prev.enabledServices.includes(srv)
        ? prev.enabledServices.filter((s) => s !== srv)
        : [...prev.enabledServices, srv],
    }));
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Courier Partners', path: '/app/couriers' },
    { label: 'Connect Courier', path: '/app/couriers/add' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Header */}
      <PageHeader
        title="Connect Courier Partner"
        description="Configure API credentials, default warehouses, and service allocations."
        breadcrumbs={breadcrumbs}
        actions={
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<XCircle size={16} />}
            onClick={() => setIsCancelDialogOpen(true)}
          >
            Cancel
          </Button>
        }
      />

      {/* Stepper Progress Bar */}
      <Card style={{ padding: 'var(--space-4)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 'max-content', width: '100%', gap: 'var(--space-2)' }}>
          {steps.map((st, idx) => {
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            const Icon = st.icon;

            return (
              <React.Fragment key={st.num}>
                <button
                  onClick={() => {
                    if (isCompleted || isCurrent) setCurrentStep(st.num);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-default)',
                    border: 'none',
                    backgroundColor: isCurrent
                      ? 'var(--color-violet-light)'
                      : isCompleted
                      ? 'var(--color-surface-secondary)'
                      : 'transparent',
                    color: isCurrent
                      ? 'var(--color-violet-main)'
                      : isCompleted
                      ? 'var(--color-success)'
                      : 'var(--color-text-muted)',
                    fontWeight: isCurrent ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                    fontSize: 'var(--font-size-small)',
                    cursor: isCompleted || isCurrent ? 'pointer' : 'default',
                  }}
                >
                  <Icon size={14} />
                  <span>{st.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <div style={{ flex: 1, height: '2px', backgroundColor: isCompleted ? 'var(--color-success)' : 'var(--color-border)', minWidth: '12px' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      {/* Validation Error Alert */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="danger" title="Please correct highlighted errors">
          {Object.values(errors).join(' • ')}
        </Alert>
      )}

      {/* STEP CONTENT CARDS */}
      <Card style={{ padding: 'var(--space-8)' }}>
        {/* STEP 1: SELECT COURIER PROVIDER */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-bold)' }}>
                Step 1: Select Courier Provider Template
              </h3>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Choose pre-configured logistics adapter provider for connection.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {DEMO_COURIER_PROVIDERS.map((p) => {
                const isSelected = formData.courierId === p.id;
                return (
                  <Card
                    key={p.id}
                    onClick={() => setFormData((prev) => ({ ...prev, courierId: p.id }))}
                    style={{
                      padding: 'var(--space-5)',
                      border: isSelected ? '2px solid var(--color-violet-main)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-violet-light)' : 'var(--color-surface)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                      <strong style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-primary)' }}>
                        {p.name}
                      </strong>
                      {isSelected && <Badge variant="brand">Selected</Badge>}
                    </div>
                    <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                      {p.description}
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Badge variant="neutral" style={{ fontSize: '10px' }}>{p.integrationType}</Badge>
                      <Badge variant="info" style={{ fontSize: '10px' }}>{p.serviceTypes.join(' + ').toUpperCase()}</Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: SCHEMA-DRIVEN AUTHENTICATION (SECURE MASKED FIELDS) */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Lock size={18} style={{ color: 'var(--color-violet-main)' }} />
                <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-bold)' }}>
                  Step 2: API Credentials & Authentication
                </h3>
              </div>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Enter your merchant credentials for {selectedProvider.name}. All secret tokens use masked input protection.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {selectedProvider.authSchema.map((field) => (
                <Input
                  key={field.key}
                  label={`${field.label} ${field.required ? '*' : ''}`}
                  type={field.type}
                  value={formData.credentials[field.key] || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      credentials: { ...prev.credentials, [field.key]: e.target.value },
                    }))
                  }
                  error={errors[field.key]}
                  placeholder={field.secret ? '••••••••••••••••' : 'Enter value'}
                />
              ))}
            </div>

            <Alert variant="info" title="Credential Security Guarantee">
              Antigravity SaaS processes credentials using client-side password masking. No secrets are saved to plain text files or browser local storage.
            </Alert>
          </div>
        )}

        {/* STEP 3: ACCOUNT & WAREHOUSE CONFIGURATION */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-bold)' }}>
                Step 3: Account & Warehouse Configuration
              </h3>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Associate your merchant account ID and default dispatch warehouse.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              <Input
                label="Merchant Account / License ID *"
                value={formData.accountId}
                onChange={(e) => setFormData((p) => ({ ...p, accountId: e.target.value }))}
                error={errors.account}
              />
              <Select
                label="Default Pickup Warehouse"
                value={formData.defaultWarehouseId}
                onChange={(e) => setFormData((p) => ({ ...p, defaultWarehouseId: e.target.value }))}
                options={[
                  { value: 'wh-001', label: 'Gurugram Main Hub' },
                  { value: 'wh-002', label: 'Mumbai Central Center' },
                  { value: 'wh-003', label: 'Bengaluru Cargo Terminal' },
                ]}
              />
              <Select
                label="Default Shipping Speed"
                value={formData.defaultService}
                onChange={(e) => setFormData((p) => ({ ...p, defaultService: e.target.value as any }))}
                options={[
                  { value: 'express', label: 'Express Air Priority' },
                  { value: 'surface', label: 'Surface Parcel' },
                  { value: 'air', label: 'Air Freight' },
                ]}
              />
            </div>
          </div>
        )}

        {/* STEP 4: SERVICES SELECTION */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-bold)' }}>
                Step 4: Enable Supported Shipping Services
              </h3>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Select capabilities and shipping speeds to expose in rate comparison cards.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Checkbox
                label="Express Air Priority Service"
                checked={formData.enabledServices.includes('express')}
                onChange={() => toggleService('express')}
              />
              <Checkbox
                label="Surface Ground Heavy Parcel"
                checked={formData.enabledServices.includes('surface')}
                onChange={() => toggleService('surface')}
              />
              <Checkbox
                label="Air Cargo Express"
                checked={formData.enabledServices.includes('air')}
                onChange={() => toggleService('air')}
              />
              <Checkbox
                label="Hyperlocal Same-Day City Delivery"
                checked={formData.enabledServices.includes('hyperlocal')}
                onChange={() => toggleService('hyperlocal')}
              />
            </div>
          </div>
        )}

        {/* STEP 5: TEST CONNECTION SIMULATION */}
        {currentStep === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-bold)' }}>
                Step 5: Test Connection Simulation
              </h3>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Verify API reachability, token authentication, and account serviceability.
              </p>
            </div>

            <Card style={{ padding: 'var(--space-6)', backgroundColor: 'var(--color-surface-secondary)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>API Endpoint Reachability Check</span>
                  <Badge variant="success">PASSED</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Token Authentication Handshake</span>
                  <Badge variant="success">PASSED</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Merchant Account License Validation ({formData.accountId})</span>
                  <Badge variant="success">VALIDATED</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Serviceability Adapter Sync</span>
                  <Badge variant="brand">24,000 Pincodes Ready</Badge>
                </div>
              </div>
            </Card>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Button variant="outline" onClick={() => alert('Simulated API ping test completed (0ms latency).')}>
                Re-Run Connection Test
              </Button>
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW AND CONFIRM */}
        {currentStep === 6 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-bold)' }}>
                Step 6: Final Review & Save Integration
              </h3>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Review partner settings before enabling courier connection.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              <Card style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <strong style={{ fontSize: 'var(--font-size-small)' }}>Courier Partner</strong>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)} leftIcon={<Edit2 size={12} />}>Edit</Button>
                </div>
                <div style={{ fontSize: 'var(--font-size-caption)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <strong>{selectedProvider.name}</strong>
                  <span>Type: {selectedProvider.integrationType}</span>
                </div>
              </Card>

              <Card style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <strong style={{ fontSize: 'var(--font-size-small)' }}>Account Configuration</strong>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)} leftIcon={<Edit2 size={12} />}>Edit</Button>
                </div>
                <div style={{ fontSize: 'var(--font-size-caption)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Account ID: <strong>{formData.accountId}</strong></span>
                  <span>Speed: {formData.defaultService.toUpperCase()}</span>
                </div>
              </Card>

              <Card style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <strong style={{ fontSize: 'var(--font-size-small)' }}>Connection Health</strong>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(5)} leftIcon={<Edit2 size={12} />}>Edit</Button>
                </div>
                <div style={{ fontSize: 'var(--font-size-caption)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Status: <Badge variant="success">CONNECTED & ACTIVE</Badge></span>
                  <span>Test Result: All Pings Passed</span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-8)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
          <Button
            variant="outline"
            disabled={currentStep === 1}
            onClick={handleBack}
            leftIcon={<ArrowLeft size={16} />}
          >
            Back
          </Button>

          <Button
            variant="primary"
            onClick={handleNext}
            rightIcon={currentStep === 6 ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
          >
            {currentStep === 6 ? 'Save Courier Integration' : 'Continue'}
          </Button>
        </div>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={() => navigate('/app/couriers')}
        title="Discard Integration Setup?"
        description="Are you sure you want to discard this courier setup? Entered API keys and configurations will be cleared."
        confirmLabel="Discard Setup"
        cancelLabel="Continue Setup"
        variant="danger"
      />

      {/* Demo Success Dialog */}
      <ConfirmationDialog
        isOpen={isSuccessDialogOpen}
        onClose={() => navigate('/app/couriers')}
        onConfirm={() => navigate(`/app/couriers/${formData.courierId}`)}
        title="Demo Courier Partner Connected"
        description={`${selectedProvider.name} has been connected to your account. You can now allocate shipments and compare shipping rates.`}
        confirmLabel="View Courier Settings →"
        cancelLabel="Go to Couriers List"
        variant="primary"
      />
    </div>
  );
};
