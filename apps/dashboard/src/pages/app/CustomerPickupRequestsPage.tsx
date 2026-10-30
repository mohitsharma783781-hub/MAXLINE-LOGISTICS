import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Table,
} from '../../components/ui';

export interface CustomerPickupRecord extends Record<string, unknown> {
  id: string;
  pickupId: string;
  shipmentCount: number;
  pickupAddress: string;
  pincode: string;
  requestedDate: string;
  status: 'PENDING_COURIER' | 'CONFIRMED' | 'COMPLETED';
}

export const DEMO_CUSTOMER_PICKUPS: CustomerPickupRecord[] = [
  {
    id: 'pkp-101',
    pickupId: 'PKP-847102',
    shipmentCount: 1,
    pickupAddress: 'Plot 42, Block B, Connaught Place, New Delhi',
    pincode: '110001',
    requestedDate: '2026-08-21 16:35 PM',
    status: 'PENDING_COURIER',
  },
  {
    id: 'pkp-102',
    pickupId: 'PKP-774129',
    shipmentCount: 3,
    pickupAddress: 'Warehouse 4, Okhla Industrial Area Phase 3, New Delhi',
    pincode: '110020',
    requestedDate: '2026-08-19 10:15 AM',
    status: 'COMPLETED',
  },
];

export const CustomerPickupRequestsPage: React.FC = () => {
  const navigate = useNavigate();

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Pickup Requests', path: '/app/pickups' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Pickup Requests"
        description="Monitor merchant warehouse pickup requests and scheduled carrier dispatches."
        breadcrumbs={breadcrumbs}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusCircle size={16} />}
            onClick={() => navigate('/app/orders/create')}
          >
            + Create New Dispatch Order
          </Button>
        }
      />

      {/* 2. Pickup Requests Table */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <Table<CustomerPickupRecord>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'pickupId',
              header: 'Pickup ID',
              render: (r) => (
                <div>
                  <strong style={{ color: 'var(--color-violet-main)' }}>{r.pickupId}</strong>
                </div>
              ),
            },
            {
              key: 'shipmentCount',
              header: 'Shipments Count',
              render: (r) => <strong>{r.shipmentCount} Shipment{r.shipmentCount > 1 ? 's' : ''}</strong>,
            },
            {
              key: 'pickupAddress',
              header: 'Pickup Address & PIN',
              render: (r) => (
                <div>
                  <span>{r.pickupAddress}</span>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>PIN: {r.pincode}</div>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Carrier Pickup Status',
              render: (r) => (
                <Badge variant={r.status === 'COMPLETED' ? 'success' : 'neutral'}>
                  {r.status === 'PENDING_COURIER' ? 'PENDING COURIER ASSIGNMENT' : r.status}
                </Badge>
              ),
            },
            {
              key: 'requestedDate',
              header: 'Requested Date',
              render: (r) => <span>{r.requestedDate}</span>,
            },
          ]}
          data={DEMO_CUSTOMER_PICKUPS}
        />
      </Card>
    </div>
  );
};
