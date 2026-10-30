import React, { useState } from 'react';
import { BarChart3, Download, Filter } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Select,
} from '../../components/ui';
import { CustomerShipmentService, type CustomerShipmentDetail } from '../../services/customerShipmentService';

export interface ReportItemRecord extends Record<string, unknown> {
  id: string;
  metricCategory: string;
  title: string;
  period: string;
  count: number;
  totalRevenueINR: number;
  totalCostINR: number;
  grossMarginINR: number;
}

export const DEMO_REPORT_SUMMARY: ReportItemRecord[] = [
  { id: 'rep-01', metricCategory: 'Shipments', title: 'B2C Consumer Express', period: 'August 2026', count: 124, totalRevenueINR: 14500, totalCostINR: 10200, grossMarginINR: 4300 },
  { id: 'rep-02', metricCategory: 'Shipments', title: 'B2B Commercial Cargo', period: 'August 2026', count: 18, totalRevenueINR: 18400, totalCostINR: 13100, grossMarginINR: 5300 },
  { id: 'rep-03', metricCategory: 'Wallet', title: 'Merchant Recharges', period: 'August 2026', count: 42, totalRevenueINR: 52000, totalCostINR: 0, grossMarginINR: 52000 },
];

export const AdminReportsPage: React.FC = () => {
  const [modeFilter, setModeFilter] = useState('all');
  const [courierFilter, setCourierFilter] = useState('all');

  const handleExportCSV = () => {
    const shipments: CustomerShipmentDetail[] = CustomerShipmentService.getShipments('all');
    const headers = ['Shipment ID', 'Tenant Name', 'Courier', 'Mode', 'Customer Selling Price', 'Courier Buy Cost', 'Gross Margin', 'Status'];
    const rows = shipments.map((s) => [
      s.shipmentId,
      `"${s.tenantId}"`,
      s.courierName,
      s.mode,
      s.totalCustomerChargeINR,
      s.courierCostINR || (s.totalCustomerChargeINR * 0.75),
      s.grossMarginINR || (s.totalCustomerChargeINR * 0.25),
      s.bookingStatus,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: (string | number)[]) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `platform_financial_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Reports & Business Intelligence', path: '/admin/reports' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Multi-Tenant BI Reports & Platform Analytics"
        description="Generate shipment analytics, customer revenue, courier buy cost, platform gross margin, and wallet transaction reports."
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="primary" size="sm" leftIcon={<Download size={16} />} onClick={handleExportCSV}>
            Export Financial Report (CSV)
          </Button>
        }
      />

      {/* 2. Controls & Filters */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Filter size={16} style={{ color: 'var(--color-violet-main)' }} />
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Report Filters:</span>
          </div>

          <Select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Modes (B2B & B2C)' },
              { value: 'B2C', label: 'B2C Consumer Only' },
              { value: 'B2B', label: 'B2B Cargo Only' },
            ]}
            style={{ width: '180px' }}
          />

          <Select
            value={courierFilter}
            onChange={(e) => setCourierFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Couriers' },
              { value: 'delhivery', label: 'Delhivery Surface' },
              { value: 'bluedart', label: 'Blue Dart Air' },
              { value: 'dtdc', label: 'DTDC Express' },
            ]}
            style={{ width: '180px' }}
          />
        </div>
      </Card>

      {/* 3. Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Total Platform Revenue" value="₹32,900.00" subtext="August 2026 customer billing" icon={BarChart3} />
        <StatCard label="Total Courier Buy Cost" value="₹23,300.00" subtext="Internal carrier cost" icon={BarChart3} />
        <StatCard label="Platform Gross Margin" value="₹9,600.00" subtext="+29.2% overall gross margin" icon={BarChart3} />
      </div>

      {/* 4. Report Summary Table */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
          Logistics Performance & Margin Summary
        </h4>

        <Table<ReportItemRecord>
          keyExtractor={(r) => r.id}
          columns={[
            { key: 'metricCategory', header: 'Category', render: (r) => <Badge variant="neutral">{r.metricCategory}</Badge> },
            { key: 'title', header: 'Segment / Title', render: (r) => <strong>{r.title}</strong> },
            { key: 'count', header: 'Volume Count', render: (r) => <span>{r.count} Records</span> },
            { key: 'totalRevenueINR', header: 'Customer Revenue', render: (r) => <strong style={{ color: 'var(--color-violet-main)' }}>₹{r.totalRevenueINR.toFixed(2)}</strong> },
            { key: 'totalCostINR', header: 'Courier Cost', render: (r) => <span>₹{r.totalCostINR.toFixed(2)}</span> },
            {
              key: 'grossMarginINR',
              header: 'Gross Margin',
              render: (r) => <strong style={{ color: 'var(--color-success)' }}>+₹{r.grossMarginINR.toFixed(2)}</strong>,
            },
          ]}
          data={DEMO_REPORT_SUMMARY}
        />
      </Card>
    </div>
  );
};
