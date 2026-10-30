import React, { useState } from 'react';
import {
  Search,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Input,
  Select,
} from '../../components/ui';
import type {
  ServiceabilityCheckInput,
  ServiceabilityResultItem,
  ServiceabilityMode,
} from '../../types/serviceability';
import { ServiceabilityEngine } from '../../services/serviceabilityEngine';
import { DEMO_COURIER_PROVIDERS } from '../../mocks/couriers.mock';

export const AdminServiceabilityTestPage: React.FC = () => {
  const [originPin, setOriginPin] = useState<string>('110001');
  const [destPin, setDestPin] = useState<string>('560038');
  const [mode, setMode] = useState<ServiceabilityMode>('B2C');
  const [paymentMode, setPaymentMode] = useState<'PREPAID' | 'COD'>('COD');
  const [selectedCourier, setSelectedCourier] = useState<string>('all');

  const [results, setResults] = useState<ServiceabilityResultItem[] | null>(null);

  const handleTestServiceability = () => {
    const input: ServiceabilityCheckInput = {
      originPostalCode: originPin,
      destinationPostalCode: destPin,
      mode,
      paymentMode,
      courierId: selectedCourier === 'all' ? undefined : selectedCourier,
    };

    const res = ServiceabilityEngine.checkServiceability(input);
    setResults(res);
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Serviceability Tester', path: '/admin/serviceability' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Courier Serviceability Debugger"
        description="Test live courier serviceability, zone resolution, COD availability, and normalized failure reason codes."
        breadcrumbs={breadcrumbs}
      />

      {/* 2. Test Input Card */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
          Serviceability Lookup Parameters
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <Input
            label="Origin PIN Code *"
            placeholder="110001"
            value={originPin}
            onChange={(e) => setOriginPin(e.target.value)}
          />
          <Input
            label="Destination PIN Code *"
            placeholder="560038"
            value={destPin}
            onChange={(e) => setDestPin(e.target.value)}
          />
          <Select
            label="Commercial Mode *"
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            options={[
              { value: 'B2C', label: 'B2C Consumer Order' },
              { value: 'B2B', label: 'B2B Commercial Order' },
            ]}
          />
          <Select
            label="Payment Collection *"
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value as any)}
            options={[
              { value: 'COD', label: 'Cash-on-Delivery (COD)' },
              { value: 'PREPAID', label: 'Prepaid' },
            ]}
          />
          <Select
            label="Courier Partner Filter"
            value={selectedCourier}
            onChange={(e) => setSelectedCourier(e.target.value)}
            options={[
              { value: 'all', label: 'All Courier Partners' },
              ...DEMO_COURIER_PROVIDERS.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
          <Button
            variant="primary"
            leftIcon={<Search size={16} />}
            onClick={handleTestServiceability}
          >
            Run Serviceability Test
          </Button>

          <Button
            variant="outline"
            leftIcon={<RotateCcw size={14} />}
            onClick={() => {
              setOriginPin('110001');
              setDestPin('560038');
              setMode('B2C');
              setPaymentMode('COD');
              setSelectedCourier('all');
              setResults(null);
            }}
          >
            Reset
          </Button>
        </div>
      </Card>

      {/* 3. Live Evaluation Results */}
      {results && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
            Serviceability Results ({results.length} Services Evaluated)
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {results.map((res, idx) => (
              <Card
                key={idx}
                style={{
                  padding: 'var(--space-4)',
                  backgroundColor: res.serviceable ? 'var(--color-surface)' : 'var(--color-surface-secondary)',
                  borderLeft: `4px solid ${res.serviceable ? 'var(--color-success)' : 'var(--color-danger)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ fontSize: '24px' }}>{res.courierLogo || '🚚'}</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <strong style={{ fontSize: '15px' }}>{res.courierName}</strong>
                        <Badge variant="brand">{res.serviceName}</Badge>
                        <Badge variant={res.mode === 'B2B' ? 'warning' : 'neutral'}>{res.mode}</Badge>
                        <Badge variant={res.transportMode === 'AIR' ? 'info' : 'neutral'}>{res.transportMode}</Badge>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        Origin Zone: <strong>{res.originZone || 'DL'}</strong> → Destination Zone: <strong>{res.destinationZone || 'KA'}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Badge variant={res.serviceable ? 'success' : 'danger'}>
                      {res.serviceable ? 'SERVICEABLE' : 'NOT SERVICEABLE'}
                    </Badge>

                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Reason Code: <code>{res.reasonCode}</code>
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)', fontSize: '12px' }}>
                  <span>Message: <strong>{res.reasonMessage}</strong></span>
                  <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                    <span>Forward: {res.forward ? '✓' : '✗'}</span>
                    <span>COD: {res.cod ? '✓' : '✗'}</span>
                    <span>Prepaid: {res.prepaid ? '✓' : '✗'}</span>
                    <span>Pickup: {res.pickup ? '✓' : '✗'}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
