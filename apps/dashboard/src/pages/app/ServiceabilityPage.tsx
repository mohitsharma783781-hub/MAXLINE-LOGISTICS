import React, { useState } from 'react';
import {
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Input,
  Select,
  Table,
  EmptyState,
  Alert,
  Skeleton,
} from '../../components/ui';
import type { Column } from '../../components/ui/Table';
import type {
  PaymentMode,
  NormalizedServiceability,
  ServiceabilityCheckInput,
} from '../../types/rates';
import { demoServiceabilityProvider } from '../../mocks/rates.mock';

type TableRowData = NormalizedServiceability & Record<string, unknown>;

export const ServiceabilityPage: React.FC = () => {
  // Form State
  const [originPincode, setOriginPincode] = useState<string>('110001');
  const [destinationPincode, setDestinationPincode] = useState<string>('400001');
  const [weight, setWeight] = useState<string>('1.0');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('PREPAID');

  // UI & Errors State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasChecked, setHasChecked] = useState<boolean>(false);
  const [overallStatus, setOverallStatus] = useState<'Serviceable' | 'Not Serviceable' | 'Partially Serviceable'>('Serviceable');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [serviceabilityList, setServiceabilityList] = useState<TableRowData[]>([]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const pincodeRegex = /^[1-9][0-9]{5}$/;

    if (!originPincode.trim()) {
      newErrors.originPincode = 'Origin pincode is required';
    } else if (!pincodeRegex.test(originPincode.trim())) {
      newErrors.originPincode = 'Enter valid 6-digit pincode';
    }

    if (!destinationPincode.trim()) {
      newErrors.destinationPincode = 'Destination pincode is required';
    } else if (!pincodeRegex.test(destinationPincode.trim())) {
      newErrors.destinationPincode = 'Enter valid 6-digit pincode';
    }

    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) {
      newErrors.weight = 'Weight must be > 0 KG';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheck = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    setTimeout(() => {
      const input: ServiceabilityCheckInput = {
        originPincode: originPincode.trim(),
        destinationPincode: destinationPincode.trim(),
        actualWeight: parseFloat(weight),
        paymentMode,
      };

      const result = demoServiceabilityProvider.checkServiceability(input);
      setServiceabilityList(result.results as TableRowData[]);
      setOverallStatus(result.status);
      setStatusMessage(result.message);
      setIsLoading(false);
      setHasChecked(true);
    }, 400);
  };

  const handleReset = () => {
    setOriginPincode('110001');
    setDestinationPincode('400001');
    setWeight('1.0');
    setPaymentMode('PREPAID');
    setErrors({});
    setHasChecked(false);
    setServiceabilityList([]);
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Courier Partners', path: '/app/couriers' },
    { label: 'Serviceability', path: '/app/serviceability' },
  ];

  const columns: Column<TableRowData>[] = [
    {
      key: 'courierName',
      header: 'Courier Partner',
      render: (row: TableRowData) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: '18px' }}>{(row.courierLogo as string) || '📦'}</span>
          <div>
            <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{row.courierName as string}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{row.serviceName as string}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'serviceType',
      header: 'Service Type',
      render: (row: TableRowData) => (
        <Badge variant={row.serviceType === 'Express' ? 'brand' : 'info'}>{row.serviceType as string}</Badge>
      ),
    },
    {
      key: 'available',
      header: 'Network Status',
      render: (row: TableRowData) => (
        <Badge variant={row.available ? 'success' : 'danger'}>
          {row.available ? 'Available' : 'Unserviceable'}
        </Badge>
      ),
    },
    {
      key: 'codAvailable',
      header: 'COD Support',
      render: (row: TableRowData) => (
        <Badge variant={row.codAvailable ? 'success' : 'neutral'}>
          {row.codAvailable ? 'COD Supported' : 'Prepaid Only'}
        </Badge>
      ),
    },
    {
      key: 'estimatedDays',
      header: 'Estimated ETA',
      render: (row: TableRowData) => (
        <span style={{ fontSize: 'var(--font-size-caption)', fontWeight: 'var(--font-weight-medium)' }}>
          {row.available ? (row.estimatedDays as string) : 'N/A'}
        </span>
      ),
    },
    {
      key: 'message',
      header: 'Coverage Notes',
      render: (row: TableRowData) => (
        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{row.message as string}</span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Header */}
      <PageHeader
        title="Serviceability"
        description="Check whether a destination is serviceable and review available courier options."
        breadcrumbs={breadcrumbs}
      />

      {/* Demo Notice Banner */}
      <Alert variant="info" title="Demo Serviceability Engine Active">
        Demo serviceability — live courier availability will be connected during courier API integration.
      </Alert>

      {/* Grid Layout: Search Form & Results */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }}
      >
        {/* Form Column */}
        <div style={{ gridColumn: 'span 12' }}>
          <Card>
            <Card.Header>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <MapPin size={18} style={{ color: 'var(--color-violet-main)' }} />
                <Card.Title>Pincode Coverage Check</Card.Title>
              </div>
            </Card.Header>

            <Card.Body>
              <form onSubmit={handleCheck} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Input
                  label="Origin Pincode *"
                  placeholder="e.g. 110001"
                  value={originPincode}
                  onChange={(e) => {
                    setOriginPincode(e.target.value);
                    if (errors.originPincode) setErrors((prev) => ({ ...prev, originPincode: '' }));
                  }}
                  error={errors.originPincode}
                  maxLength={6}
                />

                <Input
                  label="Destination Pincode *"
                  placeholder="e.g. 400001"
                  value={destinationPincode}
                  onChange={(e) => {
                    setDestinationPincode(e.target.value);
                    if (errors.destinationPincode) setErrors((prev) => ({ ...prev, destinationPincode: '' }));
                  }}
                  error={errors.destinationPincode}
                  maxLength={6}
                />

                <Input
                  label="Shipment Weight (KG) *"
                  type="number"
                  step="0.1"
                  placeholder="1.0"
                  value={weight}
                  onChange={(e) => {
                    setWeight(e.target.value);
                    if (errors.weight) setErrors((prev) => ({ ...prev, weight: '' }));
                  }}
                  error={errors.weight}
                />

                <Select
                  label="Payment Mode"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  options={[
                    { label: 'Prepaid', value: 'PREPAID' },
                    { label: 'Cash on Delivery (COD)', value: 'COD' },
                  ]}
                />

                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                  <Button type="submit" variant="primary" style={{ flex: 1 }} isLoading={isLoading}>
                    <Search size={16} />
                    Check Serviceability
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleReset}>
                    <RotateCcw size={16} />
                    Reset
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>
        </div>

        {/* Results Column */}
        <div style={{ gridColumn: 'span 12' }}>
          {isLoading ? (
            <Card>
              <Card.Body style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Skeleton width="50%" height="32px" />
                <Skeleton width="100%" height="40px" />
                <Skeleton width="100%" height="150px" />
              </Card.Body>
            </Card>
          ) : !hasChecked ? (
            <Card>
              <Card.Body>
                <EmptyState
                  icon={<MapPin size={32} />}
                  title="Check Destination Serviceability"
                  description="Enter origin and destination pincodes to check courier coverage, ETA, and payment mode availability."
                />
              </Card.Body>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Overall Status Summary Header Card */}
              <Card>
                <Card.Body>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      {overallStatus === 'Serviceable' ? (
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            color: 'var(--color-success)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <CheckCircle2 size={24} />
                        </div>
                      ) : overallStatus === 'Partially Serviceable' ? (
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(234, 179, 8, 0.1)',
                            color: 'var(--color-warning)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <AlertTriangle size={24} />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--color-danger)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <XCircle size={24} />
                        </div>
                      )}

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <h3 style={{ fontSize: 'var(--font-size-body-lg)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>
                            Route: {originPincode} → {destinationPincode}
                          </h3>
                          <Badge
                            variant={
                              overallStatus === 'Serviceable'
                                ? 'success'
                                : overallStatus === 'Partially Serviceable'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {overallStatus}
                          </Badge>
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
                          {statusMessage}
                        </p>
                      </div>
                    </div>

                    <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>
                      Mode: <strong>{paymentMode}</strong> • Weight: <strong>{weight} KG</strong>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Serviceability Courier Breakdown Table */}
              <Card>
                <Card.Header>
                  <Card.Title>Courier Network Availability</Card.Title>
                </Card.Header>
                <Card.Body style={{ padding: 0 }}>
                  <Table<TableRowData>
                    columns={columns}
                    data={serviceabilityList}
                    keyExtractor={(row) => `${row.courierId}-${row.serviceId}`}
                  />
                </Card.Body>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
