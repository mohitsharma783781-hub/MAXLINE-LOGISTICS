import React, { useState } from 'react';
import {
  FileCheck,
  Download,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button, Card, Badge, Alert, Modal } from '../../../components/ui';

export const ServiceAgreementPage: React.FC = () => {
  const [, setAgreementStatus] = useState<'ACTIVE_EXECUTED' | 'PENDING_SIGNATURE'>('ACTIVE_EXECUTED');
  const [acceptedDate] = useState('02 Aug 2026, 11:30 AM');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const handleAcceptAgreement = () => {
    setAgreementStatus('ACTIVE_EXECUTED');
    setAlertMsg('Service Level Agreement (SLA) & Terms accepted and digitally signed!');
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const breadcrumbs = [
    { label: 'Seller Portal', path: '/app' },
    { label: 'Settings', path: '/app/settings/profile' },
    { label: 'Service Agreement & Legal SLA', path: '/app/settings/agreement' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      
      <PageHeader
        title="Master Service Agreement (MSA) & SLA Center"
        description="Review, download, and manage your binding commercial logistics agreement, liability terms, and SLA contracts."
        breadcrumbs={breadcrumbs}
      />

      {alertMsg && (
        <Alert variant="success" title="Agreement Status Update">
          {alertMsg}
        </Alert>
      )}

      {/* AGREEMENT STATUS CARD */}
      <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileCheck size={28} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Master Service Agreement v3.4
              </h3>
              <Badge variant="success">EXECUTED & ACTIVE</Badge>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', margin: 0 }}>
              Digitally Accepted & Counter-signed by Compliance Officer on {acceptedDate}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" leftIcon={<Eye size={16} />} onClick={() => setIsPreviewOpen(true)}>
            View Agreement Text
          </Button>
          <Button variant="primary" leftIcon={<Download size={16} />} onClick={() => alert('Downloading official signed MSA PDF...')}>
            Download Signed Contract (PDF)
          </Button>
        </div>
      </Card>

      {/* AGREEMENT KEY TERMS HIGHLIGHTS */}
      <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>
          Key Contractual SLA & Terms Summary
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
            <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
              📦 Shipment Lost & Damage Protection
            </strong>
            <span style={{ fontSize: '12px', color: '#475569' }}>
              Declared invoice value coverage up to ₹5,000 per package for un-insured dispatches, 100% invoice coverage for insured dispatches.
            </span>
          </div>

          <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
            <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
              💵 Cash on Delivery (COD) Remittance SLA
            </strong>
            <span style={{ fontSize: '12px', color: '#475569' }}>
              Guaranteed T+1 business day remittance cycle post delivery verification directly to registered bank account.
            </span>
          </div>

          <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
            <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
              ⚖️ Weight Discrepancy Resolution Window
            </strong>
            <span style={{ fontSize: '12px', color: '#475569' }}>
              7-day auto-dispute window with mandatory photographic evidence upload prior to wallet debit adjustment.
            </span>
          </div>
        </div>
      </Card>

      {/* AGREEMENT PREVIEW MODAL */}
      {isPreviewOpen && (
        <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title="Master Logistics Service Agreement (MSA)" maxWidth="750px">
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ height: '360px', overflowY: 'auto', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', fontFamily: 'serif', lineHeight: 1.6 }}>
              <h4>1. PARTIES & RECITALS</h4>
              <p>This Agreement is entered into between Courrier3 SaaS Logistics Platform and Apex Logistics Pvt Ltd. The parties agree to the terms governing courier aggregation, rate cards, and billing.</p>
              <h4>2. OBLIGATIONS OF THE MERCHANT</h4>
              <p>Merchant agrees to accurately measure dead weight and volumetric dimensions. Any deliberate misdeclaration will incur weight discrepancy penalties.</p>
              <h4>3. PAYMENT & WALLET DEBITS</h4>
              <p>All freight charges, surcharges, GST, and handling fees will be debited directly from the prepaid merchant wallet balance prior to dispatch confirmation.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close Preview</Button>
              <Button variant="primary" onClick={handleAcceptAgreement} leftIcon={<CheckCircle2 size={16} />}>
                Re-Confirm Agreement
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
