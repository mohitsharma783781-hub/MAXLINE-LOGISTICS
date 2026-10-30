import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Smartphone,
  Mail,
  Bell,
  Save,
  Send,
  CheckCircle2,
  IndianRupee,
  Gift,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatCard } from '../../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Modal,
  Alert,
  Input,
  Switch,
  Select,
} from '../../../components/ui';
import {
  NotificationBillingService,
  type NotificationLogRecord,
  type NotificationPricingConfig,
} from '../../../services/notificationBillingService';
import { formatCurrency } from '../../../utils/formatters';

export interface UserChannelPreferences extends Record<string, unknown> {
  eventType: string;
  eventName: string;
  category: 'Orders' | 'Finance' | 'NDR' | 'System';
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  inApp: boolean;
}

export const INITIAL_USER_PREFERENCES: UserChannelPreferences[] = [
  { eventType: 'SHIPMENT_BOOKED', eventName: 'Order Booked Confirmation', category: 'Orders', email: true, sms: true, whatsapp: true, inApp: true },
  { eventType: 'PICKUP_SCHEDULED', eventName: 'Pickup Scheduled', category: 'Orders', email: false, sms: true, whatsapp: true, inApp: true },
  { eventType: 'PICKED_UP', eventName: 'Parcel Picked Up', category: 'Orders', email: true, sms: true, whatsapp: true, inApp: true },
  { eventType: 'IN_TRANSIT', eventName: 'In Transit Status Updates', category: 'Orders', email: false, sms: false, whatsapp: true, inApp: true },
  { eventType: 'OUT_FOR_DELIVERY', eventName: 'Out For Delivery (OFD) Alert', category: 'Orders', email: true, sms: true, whatsapp: true, inApp: true },
  { eventType: 'DELIVERED', eventName: 'Shipment Delivered Confirmation', category: 'Orders', email: true, sms: true, whatsapp: true, inApp: true },
  { eventType: 'NDR_ALERT', eventName: 'NDR Delivery Exception Alert', category: 'NDR', email: true, sms: true, whatsapp: true, inApp: true },
  { eventType: 'RTO_ALERT', eventName: 'RTO Return Alert', category: 'NDR', email: true, sms: true, whatsapp: true, inApp: true },
  { eventType: 'WEIGHT_DISCREPANCY', eventName: 'Weight Discrepancy Audited', category: 'Orders', email: true, sms: false, whatsapp: true, inApp: true },
  { eventType: 'COD_REMITTANCE_RELEASED', eventName: 'COD Remittance Payout', category: 'Finance', email: true, sms: true, whatsapp: true, inApp: true },
  { eventType: 'WALLET_LOW_BALANCE', eventName: 'Wallet Low Balance Warning', category: 'Finance', email: true, sms: true, whatsapp: true, inApp: true },
];

export const NotificationChannelSettings: React.FC = () => {
  const tenantId = 'tenant-demo-01';

  // Submenu Navigation Tabs: PREFERENCES | ANALYTICS | HISTORY | ADMIN_PRICING
  const [activeTab, setActiveTab] = useState<'PREFERENCES' | 'ANALYTICS' | 'HISTORY' | 'ADMIN_PRICING'>('PREFERENCES');

  const [preferences, setPreferences] = useState<UserChannelPreferences[]>(INITIAL_USER_PREFERENCES);
  const [pricingConfig, setPricingConfig] = useState<NotificationPricingConfig>(() =>
    NotificationBillingService.getConfig()
  );
  const [analytics, setAnalytics] = useState(() => NotificationBillingService.getAnalytics(tenantId));
  const [notificationLogs, setNotificationLogs] = useState<NotificationLogRecord[]>(() =>
    NotificationBillingService.getNotificationLogs(tenantId)
  );

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Test Notification Modal
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testAwb, setTestAwb] = useState('DEL847192031');
  const [testMobile, setTestMobile] = useState('+91 9810234102');
  const [testChannel, setTestChannel] = useState<'WhatsApp' | 'SMS' | 'Email'>('WhatsApp');
  const [testEvent, setTestEvent] = useState('OUT_FOR_DELIVERY');

  const refreshData = () => {
    setAnalytics(NotificationBillingService.getAnalytics(tenantId));
    setNotificationLogs([...NotificationBillingService.getNotificationLogs(tenantId)]);
  };

  const handleToggleChannel = (eventType: string, channel: 'email' | 'sms' | 'whatsapp' | 'inApp', value: boolean) => {
    setPreferences((prev) =>
      prev.map((item) => (item.eventType === eventType ? { ...item, [channel]: value } : item))
    );
  };

  const handleSavePreferences = () => {
    setToastMsg('User Notification Channel Preferences & Event Triggers Saved!');
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Save Admin Pricing Config
  const handleSavePricingConfig = () => {
    NotificationBillingService.updateConfig(pricingConfig);
    refreshData();
    setToastMsg('Admin Notification Pricing & Free Credits Rates Saved!');
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Execute Dispatch
  const handleExecuteTestDispatch = () => {
    const eventObj = preferences.find((p) => p.eventType === testEvent);
    const res = NotificationBillingService.dispatchNotification({
      tenantId,
      awbNumber: testAwb,
      customerMobile: testMobile,
      channel: testChannel,
      eventType: testEvent,
      eventName: eventObj ? eventObj.eventName : 'Test Alert',
    });

    setIsTestModalOpen(false);
    refreshData();
    setToastMsg(res.message);
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Filtered History Logs
  const filteredLogs = useMemo(() => {
    return notificationLogs.filter((l) => {
      if (channelFilter !== 'all' && l.channel !== channelFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchAwb = l.awbNumber.toLowerCase().includes(q);
        const matchMob = l.customerMobile.toLowerCase().includes(q);
        const matchEvent = l.eventName.toLowerCase().includes(q);
        if (!matchAwb && !matchMob && !matchEvent) return false;
      }
      return true;
    });
  }, [notificationLogs, channelFilter, searchQuery]);

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Settings', path: '/app/settings' },
    { label: 'WhatsApp & SMS Notification Engine', path: '/app/settings/notifications' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. Page Header */}
      <PageHeader
        title="WhatsApp & SMS Notification Engine & Wallet Billing"
        description="Configure automated buyer notifications, manage WhatsApp/SMS channel preferences, track free monthly credits, inspect delivery logs, and configure pricing rates."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={() => setIsTestModalOpen(true)} leftIcon={<Send size={14} />}>
              + Dispatch Test Alert
            </Button>
            <Button variant="primary" size="sm" onClick={handleSavePreferences} leftIcon={<Save size={14} />} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
              Save Channel Preferences
            </Button>
          </div>
        }
      />

      {toastMsg && (
        <Alert variant="success" title="Notification Engine Action">
          {toastMsg}
        </Alert>
      )}

      {/* 2. Top Analytics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <StatCard label="Messages Sent" value={analytics.messagesSent} subtext="Total notification dispatches" icon={Send} />
        <StatCard label="Messages Delivered" value={analytics.messagesDelivered} subtext="Successful buyer delivery" badgeText="98% SLA" badgeVariant="success" icon={CheckCircle2} />
        <StatCard label="Free WhatsApp Credits" value={`${analytics.remainingFreeWhatsAppCredits} / ${pricingConfig.freeWhatsAppCreditsMonthly}`} subtext="Remaining free credits" badgeText="FREE TIER" badgeVariant="brand" icon={Gift} />
        <StatCard label="Free SMS Credits" value={`${analytics.remainingFreeSmsCredits} / ${pricingConfig.freeSmsCreditsMonthly}`} subtext="Remaining free credits" badgeText="FREE TIER" badgeVariant="brand" icon={Gift} />
        <StatCard label="Total Wallet Charges" value={formatCurrency(analytics.walletChargesINR)} subtext="Deducted past free limits" icon={IndianRupee} />
      </div>

      {/* 3. Submenu Navigation & Main Card */}
      <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        
        {/* SUBMENU NAVIGATION TABS */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px', overflowX: 'auto' }}>
          {[
            { id: 'PREFERENCES', label: 'Channel Event Preferences' },
            { id: 'ANALYTICS', label: 'Notification Analytics' },
            { id: 'HISTORY', label: `Notification History Log (${notificationLogs.length})` },
            { id: 'ADMIN_PRICING', label: 'Admin Pricing & Credits Engine' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#0284c7' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#64748b',
                fontWeight: activeTab === tab.id ? '700' : '500',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CHANNEL EVENT PREFERENCES */}
        {/* ========================================================================= */}
        {activeTab === 'PREFERENCES' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Alert variant="info" title="WhatsApp & SMS Buyer Notification Rules">
              Toggle channels for each logistics lifecycle event. WhatsApp messages cost <strong>{formatCurrency(pricingConfig.whatsAppRateINR)}/msg</strong> and SMS messages cost <strong>{formatCurrency(pricingConfig.smsRateINR)}/msg</strong> after free monthly credits are exhausted.
            </Alert>

            <Table<UserChannelPreferences>
              keyExtractor={(r) => r.eventType}
              columns={[
                {
                  key: 'eventName',
                  header: 'Logistics Lifecycle Event',
                  render: (r) => (
                    <div>
                      <strong style={{ color: '#0f172a', fontSize: '13px' }}>{r.eventName}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Category: {r.category}</div>
                    </div>
                  ),
                },
                {
                  key: 'whatsapp',
                  header: 'WhatsApp (₹1.00/msg) 💬',
                  render: (r) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MessageSquare size={15} style={{ color: r.whatsapp ? '#25D366' : '#cbd5e1' }} />
                      <Switch
                        checked={r.whatsapp}
                        onChange={(checked) => handleToggleChannel(r.eventType, 'whatsapp', checked)}
                      />
                    </div>
                  ),
                },
                {
                  key: 'sms',
                  header: 'SMS (₹0.20/msg) 📱',
                  render: (r) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Smartphone size={15} style={{ color: r.sms ? '#0284c7' : '#cbd5e1' }} />
                      <Switch
                        checked={r.sms}
                        onChange={(checked) => handleToggleChannel(r.eventType, 'sms', checked)}
                      />
                    </div>
                  ),
                },
                {
                  key: 'email',
                  header: 'Email Channel ✉️',
                  render: (r) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={15} style={{ color: r.email ? '#0284c7' : '#cbd5e1' }} />
                      <Switch
                        checked={r.email}
                        onChange={(checked) => handleToggleChannel(r.eventType, 'email', checked)}
                      />
                    </div>
                  ),
                },
                {
                  key: 'inApp',
                  header: 'In-App & Bell 🔔',
                  render: (r) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Bell size={15} style={{ color: r.inApp ? '#0284c7' : '#cbd5e1' }} />
                      <Switch
                        checked={r.inApp}
                        onChange={(checked) => handleToggleChannel(r.eventType, 'inApp', checked)}
                      />
                    </div>
                  ),
                },
              ]}
              data={preferences}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: NOTIFICATION ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === 'ANALYTICS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              Channel Performance & Cost Breakdown
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Card style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0284c7', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
                  WhatsApp Channel Performance
                </h4>
                <div style={{ fontSize: '12px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>Messages Sent: <strong>{analytics.messagesSent - 18}</strong></div>
                  <div>Delivery Rate: <strong style={{ color: '#16a34a' }}>99.2%</strong></div>
                  <div>Free Credits Used: <strong>{pricingConfig.freeWhatsAppCreditsMonthly - analytics.remainingFreeWhatsAppCredits} / {pricingConfig.freeWhatsAppCreditsMonthly}</strong></div>
                  <div>WhatsApp Wallet Debit: <strong style={{ color: '#0284c7' }}>{formatCurrency(analytics.walletChargesINR)}</strong></div>
                </div>
              </Card>

              <Card style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0284c7', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
                  SMS Channel Performance
                </h4>
                <div style={{ fontSize: '12px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>Messages Sent: <strong>18</strong></div>
                  <div>Delivery Rate: <strong style={{ color: '#16a34a' }}>97.8%</strong></div>
                  <div>Free Credits Used: <strong>{pricingConfig.freeSmsCreditsMonthly - analytics.remainingFreeSmsCredits} / {pricingConfig.freeSmsCreditsMonthly}</strong></div>
                  <div>SMS Wallet Debit: <strong style={{ color: '#0284c7' }}>₹2.40</strong></div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: NOTIFICATION HISTORY LOG */}
        {/* ========================================================================= */}
        {activeTab === 'HISTORY' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <Input
                placeholder="Search by AWB Number, Mobile Number, Event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <Select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                options={[
                  { label: 'All Channels', value: 'all' },
                  { label: 'WhatsApp', value: 'WhatsApp' },
                  { label: 'SMS', value: 'SMS' },
                  { label: 'Email', value: 'Email' },
                ]}
              />
            </div>

            <Table<NotificationLogRecord>
              keyExtractor={(r) => r.id}
              columns={[
                {
                  key: 'awbNumber',
                  header: 'AWB & Customer Mobile',
                  render: (r) => (
                    <div>
                      <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{r.awbNumber}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{r.customerMobile}</div>
                    </div>
                  ),
                },
                { key: 'channel', header: 'Channel', render: (r) => <Badge variant="brand">{r.channel}</Badge> },
                { key: 'eventName', header: 'Logistics Event', render: (r) => <span>{r.eventName}</span> },
                { key: 'timestamp', header: 'Timestamp', render: (r) => <span style={{ fontSize: '11px' }}>{r.timestamp}</span> },
                {
                  key: 'costINR',
                  header: 'Notification Charge',
                  render: (r) => (
                    <div>
                      {r.isFreeCredit ? (
                        <Badge variant="success">FREE CREDIT</Badge>
                      ) : (
                        <strong style={{ color: '#be123c' }}>{formatCurrency(r.costINR)}</strong>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Delivery Status',
                  render: (r) => <Badge variant={r.status === 'DELIVERED' ? 'success' : 'danger'}>{r.status}</Badge>,
                },
              ]}
              data={filteredLogs}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ADMIN PRICING & CREDITS ENGINE */}
        {/* ========================================================================= */}
        {activeTab === 'ADMIN_PRICING' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Alert variant="info" title="Super Admin Notification Rates & Credits Management">
              Super Admin controls for platform notification pricing rates and monthly free credit tier allocations.
            </Alert>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>Per-Notification Billing Rates</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>WhatsApp Rate (₹ / msg)</label>
                    <Input
                      type="number"
                      step="0.10"
                      value={pricingConfig.whatsAppRateINR}
                      onChange={(e) => setPricingConfig((p) => ({ ...p, whatsAppRateINR: Number(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>SMS Rate (₹ / msg)</label>
                    <Input
                      type="number"
                      step="0.05"
                      value={pricingConfig.smsRateINR}
                      onChange={(e) => setPricingConfig((p) => ({ ...p, smsRateINR: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </Card>

              <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>Free Monthly Credits Allocation</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Free Monthly WhatsApp Messages</label>
                    <Input
                      type="number"
                      value={pricingConfig.freeWhatsAppCreditsMonthly}
                      onChange={(e) => setPricingConfig((p) => ({ ...p, freeWhatsAppCreditsMonthly: Number(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Free Monthly SMS Messages</label>
                    <Input
                      type="number"
                      value={pricingConfig.freeSmsCreditsMonthly}
                      onChange={(e) => setPricingConfig((p) => ({ ...p, freeSmsCreditsMonthly: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </Card>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button variant="primary" onClick={handleSavePricingConfig} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                Save Pricing & Free Credits Engine
              </Button>
            </div>
          </div>
        )}

      </Card>

      {/* TEST NOTIFICATION DISPATCH MODAL */}
      <Modal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} title="Dispatch Test Buyer Notification" maxWidth="480px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>AWB Tracking Number</label>
            <Input value={testAwb} onChange={(e) => setTestAwb(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Customer Mobile Number</label>
            <Input value={testMobile} onChange={(e) => setTestMobile(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Delivery Channel</label>
            <Select
              value={testChannel}
              onChange={(e) => setTestChannel(e.target.value as any)}
              options={[
                { label: 'WhatsApp Channel (₹1.00 / msg)', value: 'WhatsApp' },
                { label: 'SMS Channel (₹0.20 / msg)', value: 'SMS' },
                { label: 'Email Channel (Free)', value: 'Email' },
              ]}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Logistics Event Trigger</label>
            <Select
              value={testEvent}
              onChange={(e) => setTestEvent(e.target.value)}
              options={[
                { label: 'Order Booked', value: 'SHIPMENT_BOOKED' },
                { label: 'Out For Delivery (OFD)', value: 'OUT_FOR_DELIVERY' },
                { label: 'Delivered', value: 'DELIVERED' },
                { label: 'NDR Alert', value: 'NDR_ALERT' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Button variant="outline" onClick={() => setIsTestModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleExecuteTestDispatch} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
              Dispatch Notification & Debit Wallet
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
