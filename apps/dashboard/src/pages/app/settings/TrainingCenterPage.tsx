import React, { useState } from 'react';
import {
  Video,
  HelpCircle,
  Play,
  Search,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card, Badge, Input } from '../../../components/ui';

export const TrainingCenterPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const tutorials = [
    { id: 'v1', title: 'Getting Started: Creating Your First Single & Bulk Shipment', duration: '4:15 min', category: 'Shipping Basics' },
    { id: 'v2', title: 'Mastering NDR Exception Management & Re-attempt Triggers', duration: '6:30 min', category: 'Operations' },
    { id: 'v3', title: 'How Wallet Recharges & Auto-Credits Work', duration: '3:45 min', category: 'Finance' },
    { id: 'v4', title: 'Resolving Courier Weight Discrepancies with Proof Uploads', duration: '5:10 min', category: 'Disputes' },
  ];

  const faqs = [
    { q: 'How do COD payouts work and when are funds credited?', a: 'COD funds are collected by the courier upon delivery and remitted to your bank account within T+1 days after status confirmation.' },
    { q: 'What happens if a package is returned (RTO)?', a: 'If 3 delivery attempts fail or customer rejects, the package is flagged as RTO and routed back to your pickup warehouse.' },
    { q: 'How is volumetric weight calculated?', a: 'Volumetric Weight (KG) = (Length cm × Width cm × Height cm) / 5000. Chargeable weight is the higher of actual weight vs volumetric weight.' },
  ];

  const breadcrumbs = [
    { label: 'Seller Portal', path: '/app' },
    { label: 'Settings', path: '/app/settings/profile' },
    { label: 'Merchant Training & Knowledge Base', path: '/app/settings/training' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      
      <PageHeader
        title="Merchant Training Center & Platform Knowledge Base"
        description="Learn how to optimize shipping operations, manage NDR exceptions, process wallet recharges, and integrate store channels."
        breadcrumbs={breadcrumbs}
      />

      {/* SEARCH TOOLBAR */}
      <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <Input
          placeholder="Search tutorials, documentation guides, or FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leadingIcon={<Search size={16} />}
        />
      </Card>

      {/* VIDEO TUTORIALS GRID */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Video size={20} style={{ color: '#2563eb' }} /> Video Training Guides
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {tutorials.map((v) => (
            <Card key={v.id} style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ height: '120px', backgroundColor: '#0f172a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', cursor: 'pointer' }} onClick={() => alert(`Playing tutorial: ${v.title}`)}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={20} style={{ marginLeft: '2px' }} />
                </div>
              </div>

              <div>
                <Badge variant="brand" style={{ fontSize: '10px' }}>{v.category}</Badge>
                <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginTop: '4px' }}>{v.title}</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Duration: {v.duration}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ ACCORDION */}
      <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={20} style={{ color: '#0284c7' }} /> Frequently Asked Questions (FAQ)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((f, idx) => (
            <div key={idx} style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Q: {f.q}</strong>
              <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0' }}>{f.a}</p>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
};
