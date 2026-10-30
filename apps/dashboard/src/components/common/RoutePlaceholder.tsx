import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import {
  Card,
  Badge,
  Button,
  Checkbox,
  Radio,
  Switch,
  Alert,
  Table,
  Pagination,
  SearchInput,
  DatePicker,
  Spinner,
  ConfirmationDialog,
} from '../ui';

interface RoutePlaceholderProps {
  moduleName: string;
  portal: 'Public' | 'Customer Portal' | 'Super Admin Portal';
  path: string;
}

export const RoutePlaceholder: React.FC<RoutePlaceholderProps> = ({
  moduleName,
  portal,
  path,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [switchChecked, setSwitchChecked] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchVal, setSearchVal] = useState('');

  const sampleTableData = [
    { id: 'ORD-1001', partner: 'BlueDart Express', status: 'success', weight: '1.5 kg', fee: '$12.50' },
    { id: 'ORD-1002', partner: 'FedEx Priority', status: 'info', weight: '0.8 kg', fee: '$18.00' },
    { id: 'ORD-1003', partner: 'DHL Express', status: 'warning', weight: '2.1 kg', fee: '$24.10' },
  ];

  const breadcrumbs = [
    { label: portal, path: portal === 'Customer Portal' ? '/app' : '/admin' },
    { label: moduleName, path },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header Component Specimen */}
      <PageHeader
        title={`${moduleName} Placeholder`}
        description={`Structural container for route path: ${path}`}
        breadcrumbs={breadcrumbs}
        actions={
          <>
            <Button variant="secondary" size="sm">Export Specs</Button>
            <Button variant="primary" size="sm" onClick={() => setIsConfirmOpen(true)}>
              Action Dialog
            </Button>
          </>
        }
      />

      {/* Inline Alert Component Demo */}
      <Alert variant="info" title="Application Shell Foundation Active">
        Main application layout shell (Step 1D) initialized. Mobile drawer, collapsible desktop sidebar, topbar, and page header active.
      </Alert>

      {/* Module Overview Card */}
      <Card>
        <Card.Header>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <Badge variant="brand">{portal}</Badge>
              <Badge variant="neutral">{path}</Badge>
            </div>
            <Card.Title>UI Specimen & Layout Controls</Card.Title>
            <Card.Description>
              Generic UI foundation ready for subsequent feature module integrations.
            </Card.Description>
          </div>
        </Card.Header>

        <Card.Content>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
            {/* Search & Form Elements Specimen */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <SearchInput
                label="Generic Search Control"
                placeholder="Type search terms..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onClear={() => setSearchVal('')}
              />
              <DatePicker label="Filter Date Range" defaultValue="2026-08-20" />
            </div>

            {/* Selection Controls Specimen */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <label style={{ fontSize: 'var(--font-size-body)', fontWeight: 'var(--font-weight-semibold)' }}>
                Form Selection Controls
              </label>
              <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                <Switch label="Active Toggle" checked={switchChecked} onChange={setSwitchChecked} />
                <Checkbox label="Select Item" checked />
                <Radio label="Option A" checked readOnly />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <Spinner size={20} />
                <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                  Loading Spinner Primitive
                </span>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Generic Data Table & Pagination Specimen */}
      <Card>
        <Card.Header>
          <Card.Title>Generic Table & Pagination Specimen</Card.Title>
        </Card.Header>
        <Card.Content style={{ padding: 0 }}>
          <Table
            data={sampleTableData}
            keyExtractor={(row) => row.id}
            columns={[
              { key: 'id', header: 'Reference ID', render: (r) => <strong style={{ fontFamily: 'var(--font-mono)' }}>{r.id}</strong> },
              { key: 'partner', header: 'Partner Name' },
              { key: 'status', header: 'Status Variant', render: (r) => <Badge variant={r.status as any}>{r.status}</Badge> },
              { key: 'weight', header: 'Weight', align: 'right' },
              { key: 'fee', header: 'Fee ($)', align: 'right' },
            ]}
            footer={
              <Pagination
                currentPage={currentPage}
                totalPages={5}
                totalItems={50}
                pageSize={10}
                onPageChange={setCurrentPage}
              />
            }
          />
        </Card.Content>
      </Card>

      {/* Confirmation Dialog Specimen */}
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => setIsConfirmOpen(false)}
        title="Test Destructive Action Dialog"
        description="Are you sure you want to test this generic confirmation modal pattern? This action is purely for UI validation."
        confirmLabel="Proceed"
        cancelLabel="Dismiss"
        variant="danger"
      />
    </div>
  );
};
