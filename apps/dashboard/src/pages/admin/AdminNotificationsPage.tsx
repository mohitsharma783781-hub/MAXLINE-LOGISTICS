import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  DollarSign,
  Send,
  Download,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Modal,
  Alert,
  Input,
  Select,
} from '../../components/ui';
import {
  NotificationEngineService,
  type NotificationRecord,
  type GlobalAdminNotificationConfig,
} from '../../services/notificationEngineService';
import { formatCurrency } from '../../utils/formatters';

import { RealtimeNotificationService, type RealtimeNotificationEventType } from '../../services/realtimeNotificationService';

export const AdminNotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LOGS' | 'PRICING' | 'PROVIDERS'>('LOGS');

  // Logs State
  const [logs, setLogs] = useState<NotificationRecord[]>(() =>
    NotificationEngineService.getNotificationLogs('all')
  );

  // Admin Master Config State
  const [globalConfig, setGlobalConfig] = useState<GlobalAdminNotificationConfig>(() =>
    NotificationEngineService.getGlobalConfig()
  );

  // Pricing Form State
  const [pricingForm, setPricingForm] = useState(() => globalConfig.pricing);

  // Filters
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterDeliveryStatus, setFilterDeliveryStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testAwb, setTestAwb] = useState('DEL847192031');
  const [testPhone, setTestPhone] = useState('+91 98765 43210');
  const [testEventType, setTestEventType] = useState<RealtimeNotificationEventType>('NDR_CREATED');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const refreshData = () => {
    setLogs([...NotificationEngineService.getNotificationLogs('all')]);
    setGlobalConfig({ ...NotificationEngineService.getGlobalConfig() });
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (filterChannel !== 'all' && l.channel !== filterChannel) return false;
      if (filterDeliveryStatus !== 'all' && l.deliveryStatus !== filterDeliveryStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchAwb = l.awbNumber.toLowerCase().includes(q);
        const matchOrder = l.orderId.toLowerCase().includes(q);
        const matchName = l.recipientName.toLowerCase().includes(q);
        const matchMerchant = l.merchantName.toLowerCase().includes(q);
        if (!matchAwb && !matchOrder && !matchName && !matchMerchant) return false;
      }

      return true;
    });
  }, [logs, filterChannel, filterDeliveryStatus, searchQuery]);

  // Statistics Summary
  const stats = useMemo(() => {
    const totalSent = logs.length;
    const whatsappCount = logs.filter((l) => l.channel === 'WHATSAPP').length;
    const smsCount = logs.filter((l) => l.channel === 'SMS').length;
    const deliveredCount = logs.filter((l) => l.deliveryStatus === 'DELIVERED').length;
    const failedCount = logs.filter((l) => l.deliveryStatus === 'FAILED' || l.deliveryStatus === 'REJECTED').length;

    let totalCustomerRevenue = 0;
    let totalProviderCost = 0;

    logs.forEach((l) => {
      totalCustomerRevenue += l.customerChargeINR || 0;
      totalProviderCost += l.providerCostINR || 0;
    });

    const netProfit = totalCustomerRevenue - totalProviderCost;

    return {
      totalSent,
      whatsappCount,
      smsCount,
      deliveredCount,
      failedCount,
      totalCustomerRevenue: Math.round(totalCustomerRevenue * 100) / 100,
      totalProviderCost: Math.round(totalProviderCost * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
    };
  }, [logs]);

  // Save Pricing Changes
  const handleSavePricing = () => {
    NotificationEngineService.updatePricingConfig(pricingForm);
    refreshData();
    setToastMsg('Global Notification Pricing, Free Quotas & Billing Rules updated.');
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Send Test Notification (Triggers Live Toast & Bell Update!)
  const handleSendTestNotification = () => {
    // 1. External WhatsApp/SMS Engine
    NotificationEngineService.triggerNotification({
      tenantId: 'tenant-demo-01',
      shipmentId: `TEST-${Date.now()}`,
      awbNumber: testAwb,
      orderId: 'ORD-TEST-001',
      courierName: 'Delhivery Surface',
      recipientName: 'Test Buyer',
      recipientPhone: testPhone,
      eventType: 'OUT_FOR_DELIVERY',
      forceChannel: 'WHATSAPP',
      isTestRun: true,
    });

    // 2. Real-Time In-Portal Notification & Live Toast Trigger
    RealtimeNotificationService.triggerEvent({
      tenantId: 'tenant-demo-01',
      eventType: testEventType,
      title: testEventType === 'NDR_CREATED' ? 'New NDR Exception Alert' : testEventType === 'WEIGHT_DISCREPANCY' ? 'Weight Discrepancy Audited' : 'Wallet Low Balance Alert',
      message: `Operational alert for AWB ${testAwb}. Action required in Merchant Portal.`,
      awbNumber: testAwb,
      orderId: 'ORD-TEST-001',
      isToastEligible: true,
    });

    setIsTestModalOpen(false);
    refreshData();
    setToastMsg(`Real-time ${testEventType} event dispatched! Live Toast & Bell unread count updated.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Export CSV
  const handleExportCsv = () => {
    const csvStr = NotificationEngineService.exportUsageCsv(filteredLogs);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Admin_Notification_Usage_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Notification & Billing Engine', path: '/admin/notifications' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title="Branded Notifications, Pricing & Usage Billing Engine"
        description="Configure global WhatsApp/SMS notification gateways, monthly free quotas, paid per-message pricing, provider costs, and merchant branding moderation."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" size="sm" onClick={() => setIsTestModalOpen(true)}>
              <Send size={14} style={{ marginRight: '6px' }} /> Send Test Message
            </Button>
            <Button variant="primary" size="sm" onClick={handleExportCsv}>
              <Download size={14} style={{ marginRight: '6px' }} /> Export Usage CSV
            </Button>
          </div>
        }
      />

      {toastMsg && (
        <Alert variant="success" title="Success">
          {toastMsg}
        </Alert>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Total Dispatches" value={stats.totalSent} subtext={`WhatsApp: ${stats.whatsappCount} • SMS: ${stats.smsCount}`} icon={Bell} />
        <StatCard label="Delivered Rate" value={`${stats.deliveredCount}/${stats.totalSent}`} subtext="Successful delivery webhooks" badgeText="ACTIVE" badgeVariant="success" icon={CheckCircle2} />
        <StatCard label="Customer Revenue" value={formatCurrency(stats.totalCustomerRevenue)} subtext="Billed paid dispatches" icon={DollarSign} />
        <StatCard label="Net Profit Margin" value={formatCurrency(stats.netProfit)} subtext={`Provider Cost: ${formatCurrency(stats.totalProviderCost)}`} badgeText="PROFIT" badgeVariant="brand" icon={DollarSign} />
      </div>

      {/* Tab Buttons */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-main)', gap: 'var(--space-2)' }}>
        <button
          onClick={() => setActiveTab('LOGS')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === 'LOGS' ? '3px solid var(--color-violet-main)' : '3px solid transparent',
            backgroundColor: 'transparent',
            fontWeight: activeTab === 'LOGS' ? 'bold' : 'normal',
            color: activeTab === 'LOGS' ? 'var(--color-violet-main)' : 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          Delivery & Billing Ledger
        </button>
        <button
          onClick={() => setActiveTab('PRICING')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === 'PRICING' ? '3px solid var(--color-violet-main)' : '3px solid transparent',
            backgroundColor: 'transparent',
            fontWeight: activeTab === 'PRICING' ? 'bold' : 'normal',
            color: activeTab === 'PRICING' ? 'var(--color-violet-main)' : 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          Pricing, Quotas & Rules
        </button>
      </div>

      {/* TAB 1: DELIVERY & BILLING LEDGER */}
      {activeTab === 'LOGS' && (
        <Card style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>Notification Usage & Billing Register</h3>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
                options={[
                  { label: 'All Channels', value: 'all' },
                  { label: 'WhatsApp', value: 'WHATSAPP' },
                  { label: 'SMS', value: 'SMS' },
                ]}
              />
              <Select
                value={filterDeliveryStatus}
                onChange={(e) => setFilterDeliveryStatus(e.target.value)}
                options={[
                  { label: 'All Delivery Statuses', value: 'all' },
                  { label: 'Delivered', value: 'DELIVERED' },
                  { label: 'Failed', value: 'FAILED' },
                ]}
              />
              <Input
                placeholder="Search AWB, Merchant, Buyer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Table<NotificationRecord>
            columns={[
              {
                key: 'id',
                header: 'ID & Date',
                render: (row) => (
                  <div>
                    <strong style={{ fontSize: '12px', display: 'block' }}>{row.id}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{row.createdAt}</span>
                  </div>
                ),
              },
              {
                key: 'merchant',
                header: 'Merchant & AWB',
                render: (row) => (
                  <div>
                    <strong style={{ fontSize: '12px', display: 'block' }}>{row.merchantName}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--color-violet-main)' }}>AWB: {row.awbNumber}</span>
                  </div>
                ),
              },
              {
                key: 'event',
                header: 'Event & Channel',
                render: (row) => (
                  <div>
                    <Badge variant="brand" style={{ fontSize: '10px', marginBottom: '2px' }}>{row.eventType}</Badge>
                    <span style={{ fontSize: '11px', display: 'block' }}>{row.channel} ({row.providerName})</span>
                  </div>
                ),
              },
              {
                key: 'recipient',
                header: 'Recipient',
                render: (row) => (
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'block' }}>{row.recipientName}</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{row.recipientPhone}</span>
                  </div>
                ),
              },
              {
                key: 'deliveryStatus',
                header: 'Delivery Status',
                render: (row) => (
                  <Badge variant={row.deliveryStatus === 'DELIVERED' ? 'success' : 'danger'}>
                    {row.deliveryStatus}
                  </Badge>
                ),
              },
              {
                key: 'billingStatus',
                header: 'Billing Status',
                render: (row) => (
                  <Badge variant={row.isFreeQuota ? 'info' : 'brand'}>
                    {row.isFreeQuota ? 'FREE QUOTA' : `PAID ₹${row.customerChargeINR.toFixed(2)}`}
                  </Badge>
                ),
              },
              {
                key: 'margin',
                header: 'Cost & Margin',
                render: (row) => (
                  <div style={{ fontSize: '11px' }}>
                    <span>Rev: <strong>₹{row.customerChargeINR.toFixed(2)}</strong></span>
                    <br />
                    <span style={{ color: 'var(--color-text-muted)' }}>Cost: ₹{row.providerCostINR.toFixed(2)}</span>
                  </div>
                ),
              },
            ]}
            data={filteredLogs}
            keyExtractor={(item) => item.id}
            emptyText="No notification logs found matching filters."
          />
        </Card>
      )}

      {/* TAB 2: PRICING, QUOTAS & RULES */}
      {activeTab === 'PRICING' && (
        <Card style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>Notification Pricing & Monthly Free Quota Configuration</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                Monthly Free Quota per Customer *
              </label>
              <Input
                type="number"
                value={pricingForm.freeQuotaPerMonth}
                onChange={(e) => setPricingForm({ ...pricingForm, freeQuotaPerMonth: Number(e.target.value) })}
              />
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Number of free dispatches per billing month per merchant</span>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                Quota Allocation Model
              </label>
              <Select
                value={pricingForm.quotaModel}
                onChange={(e) => setPricingForm({ ...pricingForm, quotaModel: e.target.value as any })}
                options={[
                  { label: 'Shared Quota (WhatsApp + SMS share free 100 pool)', value: 'SHARED' },
                  { label: 'Separate Channel Quotas (100 WA, 50 SMS)', value: 'SEPARATE' },
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                WhatsApp Merchant Selling Price (₹ / message) *
              </label>
              <Input
                type="number"
                step="0.05"
                value={pricingForm.whatsappPriceINR}
                onChange={(e) => setPricingForm({ ...pricingForm, whatsappPriceINR: Number(e.target.value) })}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                WhatsApp Provider Cost (₹ / message) [Internal] *
              </label>
              <Input
                type="number"
                step="0.05"
                value={pricingForm.providerCostWhatsappINR}
                onChange={(e) => setPricingForm({ ...pricingForm, providerCostWhatsappINR: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                SMS Merchant Selling Price (₹ / message) *
              </label>
              <Input
                type="number"
                step="0.05"
                value={pricingForm.smsPriceINR}
                onChange={(e) => setPricingForm({ ...pricingForm, smsPriceINR: Number(e.target.value) })}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                SMS Provider Cost (₹ / message) [Internal] *
              </label>
              <Input
                type="number"
                step="0.05"
                value={pricingForm.providerCostSmsINR}
                onChange={(e) => setPricingForm({ ...pricingForm, providerCostSmsINR: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
            <Button variant="primary" onClick={handleSavePricing}>
              Save Notification Pricing & Quotas
            </Button>
          </div>
        </Card>
      )}

      {/* SEND TEST NOTIFICATION MODAL */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Send Test Notification (No Wallet Deduction)"
        maxWidth="500px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Real-Time Event Type (Triggers Live Toast & Bell)</label>
            <Select
              value={testEventType}
              onChange={(e) => setTestEventType(e.target.value as any)}
              options={[
                { label: 'NDR Exception Created (🔴 Critical Toast)', value: 'NDR_CREATED' },
                { label: 'Weight Discrepancy Audited (🟠 High Toast)', value: 'WEIGHT_DISCREPANCY' },
                { label: 'Wallet Low Balance Warning (🔴 Critical Toast)', value: 'WALLET_LOW_BALANCE' },
                { label: 'COD Remittance Credited (🔵 Normal Event)', value: 'COD_REMITTANCE' },
              ]}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Recipient Mobile Number</label>
            <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Sample AWB</label>
            <Input value={testAwb} onChange={(e) => setTestAwb(e.target.value)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            <Button variant="outline" onClick={() => setIsTestModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSendTestNotification}>Dispatch Test Message</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
