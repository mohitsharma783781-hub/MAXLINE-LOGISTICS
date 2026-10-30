import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  SearchInput,
  Select,
  ConfirmationDialog,
} from '../../components/ui';
import {
  type RTOCase,
  type RTOStatus,
  RTO_STATUS_CONFIG,
} from '../../types/exceptions';
import { demoExceptionProvider } from '../../mocks/exceptions.mock';

export const RTOOrdersPage: React.FC = () => {
  const navigate = useNavigate();

  const [rtoCases, setRtoCases] = useState<RTOCase[]>(() => demoExceptionProvider.getRTOCases());
  const [advanceTargetId, setAdvanceTargetId] = useState<string | null>(null);
  const [targetNextState, setTargetNextState] = useState<RTOStatus>('IN_TRANSIT');

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredCases = useMemo(() => {
    return rtoCases.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = item.shipmentId.toLowerCase().includes(q) || item.awb.toLowerCase().includes(q) || item.customerName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [rtoCases, searchQuery, statusFilter]);

  const handleConfirmAdvance = () => {
    if (!advanceTargetId) return;
    demoExceptionProvider.advanceRTOState(advanceTargetId, targetNextState);
    setRtoCases(demoExceptionProvider.getRTOCases());
    setAdvanceTargetId(null);
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Shipments', path: '/app/shipments' },
    { label: 'RTO Orders', path: '/app/rto' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title="Return-to-Origin (RTO) Management"
        description="Track RTO parcels returning back to pickup warehouse locations and verify origin delivery."
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/app/exceptions')}>
            ← Back to NDR & Exceptions
          </Button>
        }
      />

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard
          label="RTO Initiated"
          value={rtoCases.filter((r) => r.status === 'INITIATED').length}
          subtext="Manifest voided"
          icon={RotateCcw}
        />
        <StatCard
          label="RTO In Transit"
          value={rtoCases.filter((r) => r.status === 'IN_TRANSIT').length}
          subtext="Returning to warehouse"
          icon={Truck}
        />
        <StatCard
          label="RTO Delivered to Origin"
          value={rtoCases.filter((r) => r.status === 'DELIVERED').length}
          subtext="Restocked / Inventory"
          icon={CheckCircle2}
        />
      </div>

      {/* Search & Filters */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <SearchInput
              placeholder="Search by AWB, Shipment ID, Recipient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All RTO Statuses' },
              { value: 'INITIATED', label: 'Initiated' },
              { value: 'IN_TRANSIT', label: 'In Transit' },
              { value: 'DELIVERED', label: 'Delivered' },
            ]}
            style={{ width: '180px' }}
          />
        </div>
      </Card>

      {/* RTO Table */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <Table<RTOCase>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'shipmentId',
              header: 'Shipment & AWB',
              render: (row) => (
                <div>
                  <strong style={{ color: 'var(--color-violet-main)' }}>{row.shipmentId}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    AWB: {row.awb}
                  </div>
                </div>
              ),
            },
            {
              key: 'courierName',
              header: 'Courier Partner',
              render: (row) => <span>{row.courierName}</span>,
            },
            {
              key: 'customerName',
              header: 'Recipient & Destination',
              render: (row) => <span>{row.customerName} ({row.destinationCity})</span>,
            },
            {
              key: 'reasonText',
              header: 'RTO Reason',
              render: (row) => <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-danger)' }}>{row.reasonText}</span>,
            },
            {
              key: 'status',
              header: 'RTO Status',
              render: (row) => {
                const conf = RTO_STATUS_CONFIG.find((c) => c.key === row.status);
                return <Badge variant={conf?.variant || 'neutral'}>{conf?.label || row.status}</Badge>;
              },
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/app/shipments/${row.shipmentId}`)}
                  >
                    View Shipment
                  </Button>

                  {row.status === 'INITIATED' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setAdvanceTargetId(row.id);
                        setTargetNextState('IN_TRANSIT');
                      }}
                    >
                      Set In-Transit
                    </Button>
                  )}

                  {row.status === 'IN_TRANSIT' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setAdvanceTargetId(row.id);
                        setTargetNextState('DELIVERED');
                      }}
                    >
                      Set RTO Delivered
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={filteredCases}
        />
      </Card>

      {/* DEMO ADVANCE RTO STATE DIALOG */}
      <ConfirmationDialog
        isOpen={!!advanceTargetId}
        onClose={() => setAdvanceTargetId(null)}
        onConfirm={handleConfirmAdvance}
        title="Advance Demo RTO State?"
        description={`Update RTO simulation status to ${targetNextState}.`}
        confirmLabel="Update Status"
        cancelLabel="Cancel"
        variant="primary"
      />
    </div>
  );
};
