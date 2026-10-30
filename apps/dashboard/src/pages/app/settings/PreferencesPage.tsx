import React, { useState } from 'react';
import {
  Bell,
  Shield,
  Save,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button, Card, Alert, Switch } from '../../../components/ui';

export const PreferencesPage: React.FC = () => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [ndrNotifications, setNdrNotifications] = useState(true);
  const [lowBalanceAlerts, setLowBalanceAlerts] = useState(true);
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('Account preferences and notification channels saved successfully!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const breadcrumbs = [
    { label: 'Seller Portal', path: '/app' },
    { label: 'Settings', path: '/app/settings/profile' },
    { label: 'Account Preferences', path: '/app/settings/preferences' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      
      <PageHeader
        title="Seller Account Preferences & Notification Settings"
        description="Configure automated dispatch alerts, NDR exception notifications, WhatsApp tracking updates, and low balance warnings."
        breadcrumbs={breadcrumbs}
      />

      {successMsg && (
        <Alert variant="success" title="Preferences Saved">
          {successMsg}
        </Alert>
      )}

      <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* NOTIFICATION CHANNELS */}
        <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} style={{ color: '#2563eb' }} /> Communication & Notification Channels
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Email Dispatch Summary & Invoices</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Receive daily shipping digests and financial tax invoices.</span>
              </div>
              <Switch checked={emailAlerts} onChange={(val) => setEmailAlerts(val)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>SMS OTP & Order Triggers</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>SMS alerts for critical account actions and customer OTPs.</span>
              </div>
              <Switch checked={smsAlerts} onChange={(val) => setSmsAlerts(val)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>WhatsApp Buyer Tracking Updates</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Send automated WhatsApp delivery tracking links to buyers.</span>
              </div>
              <Switch checked={whatsappAlerts} onChange={(val) => setWhatsappAlerts(val)} />
            </div>

          </div>
        </Card>

        {/* CRITICAL ALERTS */}
        <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} style={{ color: '#d97706' }} /> Operational & Financial Triggers
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>NDR Exception Immediate Escalation</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Notify operations team immediately when a delivery fails.</span>
              </div>
              <Switch checked={ndrNotifications} onChange={(val) => setNdrNotifications(val)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Low Wallet Balance Warning (&lt; ₹1,000)</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Warn before wallet funds block label generation.</span>
              </div>
              <Switch checked={lowBalanceAlerts} onChange={(val) => setLowBalanceAlerts(val)} />
            </div>

          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="primary" leftIcon={<Save size={16} />} style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}>
            Save Preferences
          </Button>
        </div>

      </form>

    </div>
  );
};
