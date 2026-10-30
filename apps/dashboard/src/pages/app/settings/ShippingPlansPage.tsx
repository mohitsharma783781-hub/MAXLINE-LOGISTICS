import React, { useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button, Card, Badge, Alert, Modal, Input, Select } from '../../../components/ui';

export const ShippingPlansPage: React.FC = () => {
  const [currentPlan] = useState<'Starter' | 'Growth' | 'Enterprise'>('Enterprise');
  const [monthlyVolume] = useState('2,500 - 10,000 shipments / month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState('Enterprise Tier Custom');
  const [requestedVolume, setRequestedVolume] = useState('10,000+');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const handleRequestUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalOpen(false);
    setAlertMsg('Plan upgrade request submitted! Your Key Account Manager (KAM) will assign revised rate cards within 2 hours.');
    setTimeout(() => setAlertMsg(null), 5000);
  };

  const breadcrumbs = [
    { label: 'Seller Portal', path: '/app' },
    { label: 'Settings', path: '/app/settings/profile' },
    { label: 'Shipping Plans & Volume Tiers', path: '/app/settings/shipping-plans' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      
      <PageHeader
        title="Seller Shipping Plans & Commercial Tier Management"
        description="View active plan benefits, monthly shipment volume tiers, custom commercial rate structures, and request plan upgrades."
        breadcrumbs={breadcrumbs}
      />

      {alertMsg && (
        <Alert variant="success" title="Upgrade Request Status">
          {alertMsg}
        </Alert>
      )}

      {/* CURRENT ACTIVE PLAN HERO CARD */}
      <Card style={{ padding: '24px', backgroundColor: '#0f172a', color: '#ffffff', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Badge variant="brand" style={{ backgroundColor: '#0284c7', color: '#ffffff' }}>CURRENT ACTIVE PLAN</Badge>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Volume Tier: {monthlyVolume}</span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#38bdf8' }}>
            {currentPlan} Commercial Plan
          </h2>
          <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px', margin: 0 }}>
            Includes 16+ integrated national couriers, zero monthly subscription fees, dedicated KAM, and express COD remittances.
          </p>
        </div>

        <Button variant="primary" style={{ backgroundColor: '#38bdf8', color: '#0f172a', borderColor: '#38bdf8', fontWeight: '700' }} onClick={() => setIsModalOpen(true)}>
          Request Volume Plan Upgrade
        </Button>
      </Card>

      {/* PLAN COMPARISON TIERS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Starter Plan */}
        <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>ENTRY LEVEL</span>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>Starter Merchant</h3>
            <div style={{ fontSize: '13px', color: '#0284c7', fontWeight: '700', marginTop: '4px' }}>0 - 500 Shipments / Mo</div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#334155' }}>
            <div>✓ Standard Shipping Rate Card</div>
            <div>✓ 5 Surface & Express Couriers</div>
            <div>✓ T+3 Days COD Remittance</div>
            <div>✓ Email & Ticket Support</div>
          </div>
        </Card>

        {/* Growth Plan */}
        <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#d97706', fontWeight: '700' }}>HIGH GROWTH</span>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>Growth Merchant</h3>
            <div style={{ fontSize: '13px', color: '#0284c7', fontWeight: '700', marginTop: '4px' }}>500 - 2,500 Shipments / Mo</div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#334155' }}>
            <div>✓ Discounted Growth Rates (-12%)</div>
            <div>✓ 10 Surface & Air Express Couriers</div>
            <div>✓ T+2 Days COD Remittance</div>
            <div>✓ Priority Support Desk</div>
          </div>
        </Card>

        {/* Enterprise Plan (Active) */}
        <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '2px solid #0284c7', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 12px rgba(2,132,199,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800' }}>ACTIVE COMMERCIAL PLAN</span>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>Enterprise Scale</h3>
              <div style={{ fontSize: '13px', color: '#0284c7', fontWeight: '700', marginTop: '4px' }}>2,500+ Shipments / Mo</div>
            </div>
            <Badge variant="brand">ACTIVE</Badge>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>
            <div>✓ Deep Volume Discounts (-25%)</div>
            <div>✓ All 16+ B2C & B2B Courier Partners</div>
            <div>✓ T+1 Express Daily COD Remittance</div>
            <div>✓ Dedicated Key Account Manager (KAM)</div>
            <div>✓ Custom API & Shopify/Woo Commerce Webhooks</div>
          </div>
        </Card>

      </div>

      {/* UPGRADE MODAL */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request Plan & Commercial Rate Upgrade" maxWidth="550px">
          <form onSubmit={handleRequestUpgrade} style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '10px' }}>
            <Select
              label="Select Desired Shipping Plan Tier *"
              value={targetPlan}
              onChange={(e) => setTargetPlan(e.target.value)}
              options={[
                { label: 'Growth Plan (500 - 2,500 shipments/mo)', value: 'Growth Plan' },
                { label: 'Enterprise Plan (2,500 - 10,000 shipments/mo)', value: 'Enterprise Plan' },
                { label: 'Custom VIP High Volume (10,000+ shipments/mo)', value: 'Custom VIP Tier' },
              ]}
            />

            <Select
              label="Expected Monthly Dispatch Volume *"
              value={requestedVolume}
              onChange={(e) => setRequestedVolume(e.target.value)}
              options={[
                { label: '1,000 - 2,500 orders', value: '1000-2500' },
                { label: '2,500 - 5,000 orders', value: '2500-5000' },
                { label: '5,000 - 10,000 orders', value: '5000-10000' },
                { label: '10,000+ orders', value: '10000+' },
              ]}
            />

            <Input
              label="Additional Remarks or Specific Courier Rate Requests"
              placeholder="e.g. Requesting lower Delhivery Surface rates for West Bengal zone..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                Submit Upgrade Request
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
