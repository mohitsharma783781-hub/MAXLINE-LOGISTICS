import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  Truck,
  Network,
  ArrowLeft,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Select,
  Alert,
} from '../../../components/ui';

export const CourierSettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const [defaultCourier, setDefaultCourier] = useState('delhivery');
  const [allocationMode, setAllocationMode] = useState('cheapest');
  const [savedAlert, setSavedAlert] = useState<string | null>(null);

  const handleSave = () => {
    setSavedAlert('Courier allocation preferences and default integration settings updated successfully!');
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Settings', path: '/app/settings' },
    { label: 'Courier Integration', path: '/app/settings/couriers' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title="Courier Integration Settings"
        description="Configure default shipping allocation rules, courier priority rankings, and multi-carrier integration parameters."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/couriers')} leftIcon={<ArrowLeft size={16} />}>
              Back to Couriers
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} leftIcon={<Save size={16} />}>
              Save Settings
            </Button>
          </div>
        }
      />

      {savedAlert && (
        <Alert variant="success" title="Settings Saved">
          {savedAlert}
        </Alert>
      )}

      {/* DEFAULT ALLOCATION PREFERENCES CARD */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
          <Truck size={20} color="var(--color-violet-main)" />
          <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold' }}>Default Allocation & Carrier Priority</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          <Select
            label="Default Primary Courier Partner"
            value={defaultCourier}
            onChange={(e) => setDefaultCourier(e.target.value)}
            options={[
              { value: 'delhivery', label: 'Delhivery Surface (Default B2C)' },
              { value: 'bluedart', label: 'BlueDart Express Air (Priority)' },
              { value: 'dtdc', label: 'DTDC Express (Intercity Air)' },
              { value: 'xpressbees', label: 'XpressBees Surface' },
            ]}
          />

          <Select
            label="Courier Selection Algorithm Mode"
            value={allocationMode}
            onChange={(e) => setAllocationMode(e.target.value)}
            options={[
              { value: 'cheapest', label: 'Cheapest Rate First (Cost Optimization)' },
              { value: 'fastest', label: 'Fastest SLA Delivery First (Speed Optimization)' },
              { value: 'performance', label: 'Highest Delivery Performance Score' },
              { value: 'custom_rule', label: 'Custom Rule Matrix' },
            ]}
          />
        </div>
      </Card>

      {/* COURIER PRIORITY RANKING CARD */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
          <Network size={20} color="var(--color-violet-main)" />
          <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold' }}>Carrier Fallback Priority Matrix</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', backgroundColor: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-default)', border: '1px solid var(--color-border)' }}>
            <div>
              <strong>Priority 1: Delhivery Surface</strong>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Code: DELHIVERY | Mode: SURFACE | B2C Primary</div>
            </div>
            <Badge variant="success">Active Fallback #1</Badge>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', backgroundColor: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-default)', border: '1px solid var(--color-border)' }}>
            <div>
              <strong>Priority 2: BlueDart Express Air</strong>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Code: BLUE_DART | Mode: AIR | Priority SLA</div>
            </div>
            <Badge variant="info">Active Fallback #2</Badge>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', backgroundColor: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-default)', border: '1px solid var(--color-border)' }}>
            <div>
              <strong>Priority 3: DTDC Express</strong>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Code: DTDC | Mode: AIR/SURFACE | Regional Reserve</div>
            </div>
            <Badge variant="neutral">Fallback #3</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};
