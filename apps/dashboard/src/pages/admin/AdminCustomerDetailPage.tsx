import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wallet,
  Package,
  Sliders,
  Truck,
  Plus,
  Building2,
  FileCheck,
  CreditCard,
  Lock,
  Activity,
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
  Input,
  Select,
  Alert,
  Checkbox,
} from '../../components/ui';
import { WalletService } from '../../mocks/wallet.mock';

export const AdminCustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'kyc' | 'wallet' | 'rate_cards' | 'credit_control' | 'account_controls' | 'activity_logs'
  >('overview');

  const [customerStatus, setCustomerStatus] = useState<'ACTIVE' | 'PENDING' | 'SUSPENDED'>('ACTIVE');
  const [kycStatus] = useState<'Approved' | 'Under Review' | 'Pending Documents'>('Approved');
  const [assignedRateCard] = useState('Enterprise VIP B2C Card');
  const [assignedManager] = useState('Vikram Malhotra (Key Account Manager)');

  // Credit Control State
  const [creditEnabled, setCreditEnabled] = useState(true);
  const [creditLimit, setCreditLimit] = useState('50000');
  const [creditUsed] = useState('12450');
  const [creditExpiry] = useState('31 Dec 2026');

  // Wallet State & Modals
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('1000');
  const [adjustDirection, setAdjustDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustReason, setAdjustReason] = useState('Admin VIP bonus credit');

  const [alertMessage, setAlertMessage] = useState<{ variant: 'success' | 'danger'; title: string; text: string } | null>(null);

  const wallet = WalletService.getWallet();
  const transactions = WalletService.getTransactions();

  const handleExecuteAdjustment = () => {
    const amount = parseFloat(adjustAmount) || 0;
    const res = WalletService.adjust(amount, adjustDirection, adjustReason);

    setIsAdjustModalOpen(false);

    if (res.success && res.transaction) {
      setAlertMessage({
        variant: 'success',
        title: 'Wallet Adjustment Posted',
        text: `Successfully posted ${adjustDirection} adjustment of ₹${amount.toFixed(2)} to customer wallet.`,
      });
    } else {
      setAlertMessage({
        variant: 'danger',
        title: 'Adjustment Failed',
        text: res.message,
      });
    }
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Customer Management Center', path: '/admin/customers' },
    { label: id || 'Apex Logistics Pvt Ltd', path: `/admin/customers/${id}` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. PAGE HEADER */}
      <PageHeader
        title={`Customer Master Profile — Apex Logistics Pvt Ltd`}
        description="Comprehensive 360-degree control panel for account info, KYC, wallet balances, rate cards, credit limits, and audit logs."
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/admin/customers')}>
            Back to Customers Management
          </Button>
        }
      />

      {alertMessage && (
        <Alert variant={alertMessage.variant} title={alertMessage.title}>
          {alertMessage.text}
        </Alert>
      )}

      {/* 2. CUSTOMER MASTER HEADER CARD */}
      <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
              AP
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  Apex Logistics Pvt Ltd
                </h2>
                <Badge variant={customerStatus === 'ACTIVE' ? 'success' : customerStatus === 'PENDING' ? 'warning' : 'danger'}>
                  {customerStatus}
                </Badge>
                <Badge variant={kycStatus === 'Approved' ? 'success' : 'warning'}>
                  KYC {kycStatus}
                </Badge>
              </div>

              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span>ID: <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{id || 'CUST-2026-001'}</strong></span>
                <span>GST: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>22AAAAA0000A1Z5</strong></span>
                <span>Manager: <strong style={{ color: '#0f172a' }}>{assignedManager}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsAdjustModalOpen(true)}>
              + Wallet Adjustment
            </Button>

            <Button
              variant={customerStatus === 'ACTIVE' ? 'outline' : 'primary'}
              size="sm"
              onClick={() => setCustomerStatus(customerStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
              style={{ borderColor: customerStatus === 'ACTIVE' ? '#fca5a5' : '#16a34a', color: customerStatus === 'ACTIVE' ? '#dc2626' : '#ffffff' }}
            >
              {customerStatus === 'ACTIVE' ? 'Suspend Customer' : 'Activate Customer'}
            </Button>
          </div>

        </div>
      </Card>

      {/* 3. 7-TABBED CONTROL CENTER NAVIGATION BAR */}
      <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', overflowX: 'auto' }}>
          {[
            { key: 'overview', label: '1. Overview', icon: Building2 },
            { key: 'kyc', label: '2. KYC Documents', icon: FileCheck },
            { key: 'wallet', label: '3. Wallet & Ledger', icon: Wallet },
            { key: 'rate_cards', label: '4. Rate Cards', icon: Sliders },
            { key: 'credit_control', label: '5. Credit Control', icon: CreditCard },
            { key: 'account_controls', label: '6. Account Controls', icon: Lock },
            { key: 'activity_logs', label: '7. Activity Audit Logs', icon: Activity },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: isActive ? '#0f172a' : 'transparent',
                  color: isActive ? '#ffffff' : '#64748b',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <StatCard label="MONTHLY VOLUME" value="450 Parcels" subtext="Dispatches / month" badgeText="VOLUME" badgeVariant="info" icon={Package} />
              <StatCard label="WALLET BALANCE" value={`₹${(wallet.availableBalanceMinor / 100).toFixed(2)}`} subtext="Available reserves" badgeText="FUNDS" badgeVariant="success" icon={Wallet} />
              <StatCard label="CREDIT LIMIT" value={`₹${parseFloat(creditLimit).toLocaleString()}`} subtext="Assigned credit" badgeText="CREDIT" badgeVariant="warning" icon={CreditCard} />
              <StatCard label="TOTAL SHIPMENTS" value="1,420" subtext="Lifetime orders" badgeText="DISPATCH" badgeVariant="neutral" icon={Truck} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              <Card style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0' }}>Company Profile & Business Segment</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#334155' }}>
                  <div>Company Name: <strong style={{ color: '#0f172a' }}>Apex Logistics Pvt Ltd</strong></div>
                  <div>Business Type: <strong>D2C eCommerce & B2B Cargo</strong></div>
                  <div>Registration Date: <strong>20 Aug 2026</strong></div>
                  <div>Website: <strong style={{ color: '#0284c7' }}>https://apexlogistics.com</strong></div>
                </div>
              </Card>

              <Card style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0' }}>Primary Contact & Account Management</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#334155' }}>
                  <div>Contact Person: <strong style={{ color: '#0f172a' }}>Mohit Sharma</strong></div>
                  <div>Email Address: <strong>mohit@apexlogistics.com</strong></div>
                  <div>Mobile Number: <strong>+91 98765 43210</strong></div>
                  <div>Assigned KAM: <strong style={{ color: '#16a34a' }}>{assignedManager}</strong></div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: KYC DOCUMENTS */}
        {/* ========================================================================= */}
        {activeTab === 'kyc' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Submitted Compliance KYC Documents
              </h3>
              <Badge variant={kycStatus === 'Approved' ? 'success' : 'warning'}>KYC {kycStatus}</Badge>
            </div>

            <Table
              keyExtractor={(r: any) => r.id}
              columns={[
                { key: 'docType', header: 'Document Type', render: (r: any) => <strong>{r.docType}</strong> },
                { key: 'fileName', header: 'File Name', render: (r: any) => <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>{r.fileName}</span> },
                { key: 'uploadDate', header: 'Upload Date', render: (r: any) => <span>{r.uploadDate}</span> },
                { key: 'status', header: 'Status', render: (r: any) => <Badge variant="success">{r.status}</Badge> },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (r: any) => (
                    <Button variant="outline" size="sm" leftIcon={<Download size={12} />} onClick={() => alert(`Downloading ${r.fileName}`)}>
                      Download File
                    </Button>
                  ),
                },
              ]}
              data={[
                { id: '1', docType: 'GST Certificate', fileName: 'apex_gst_certificate.pdf', uploadDate: '01 Sep 2026', status: 'Verified' },
                { id: '2', docType: 'PAN Card', fileName: 'apex_pan_card.pdf', uploadDate: '01 Sep 2026', status: 'Verified' },
                { id: '3', docType: 'Cancelled Cheque', fileName: 'cancelled_cheque_hdfc.pdf', uploadDate: '02 Sep 2026', status: 'Verified' },
                { id: '4', docType: 'Address Proof', fileName: 'office_lease_agreement.pdf', uploadDate: '02 Sep 2026', status: 'Verified' },
              ]}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: WALLET & LEDGER */}
        {/* ========================================================================= */}
        {activeTab === 'wallet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Wallet Balance & Ledger History</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Current Balance: <strong>₹{(wallet.availableBalanceMinor / 100).toFixed(2)}</strong></span>
              </div>
              <Button variant="primary" size="sm" onClick={() => setIsAdjustModalOpen(true)} style={{ backgroundColor: '#0f172a', borderColor: '#0f172a' }}>
                + Admin Adjustment
              </Button>
            </div>

            <Table<typeof transactions[0]>
              keyExtractor={(r) => r.id}
              columns={[
                { key: 'id', header: 'Transaction ID', render: (r) => <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{r.id}</strong> },
                { key: 'type', header: 'Type', render: (r) => <Badge variant="neutral">{r.type}</Badge> },
                {
                  key: 'direction',
                  header: 'Amount',
                  render: (r) => (
                    <strong style={{ color: r.direction === 'CREDIT' ? '#16a34a' : '#dc2626' }}>
                      {r.direction === 'CREDIT' ? '+' : '-'}₹{(r.amountMinor / 100).toFixed(2)}
                    </strong>
                  ),
                },
                { key: 'balanceAfterMinor', header: 'Balance After', render: (r) => <strong>₹{(r.balanceAfterMinor / 100).toFixed(2)}</strong> },
                { key: 'createdAt', header: 'Timestamp', render: (r) => <span style={{ fontSize: '11px', color: '#64748b' }}>{r.createdAt}</span> },
              ]}
              data={transactions}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: RATE CARDS */}
        {/* ========================================================================= */}
        {activeTab === 'rate_cards' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Assigned Selling Rate Cards</h3>
                <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: '700' }}>Active Card: {assignedRateCard}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => alert('Change Rate Card modal launched.')}>
                Change Assigned Rate Card
              </Button>
            </div>

            <Table
              keyExtractor={(r: any) => r.id}
              columns={[
                { key: 'version', header: 'Version', render: (r: any) => <Badge variant="brand">{r.version}</Badge> },
                { key: 'rateCard', header: 'Rate Card Name', render: (r: any) => <strong>{r.rateCard}</strong> },
                { key: 'category', header: 'Mode', render: (r: any) => <span>{r.category}</span> },
                { key: 'effectiveDate', header: 'Effective Date', render: (r: any) => <span>{r.effectiveDate}</span> },
                { key: 'status', header: 'Status', render: (r: any) => <Badge variant="success">{r.status}</Badge> },
              ]}
              data={[
                { id: '1', version: 'v3.2', rateCard: 'Enterprise VIP B2C Card', category: 'B2C Express Surface', effectiveDate: '20 Aug 2026', status: 'ACTIVE' },
                { id: '2', version: 'v2.0', rateCard: 'Default B2B Freight Matrix Card', category: 'B2B Cargo', effectiveDate: '01 Aug 2026', status: 'ACTIVE' },
              ]}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: CREDIT CONTROL */}
        {/* ========================================================================= */}
        {activeTab === 'credit_control' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Credit Facility & Postpaid Credit Controls
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', backgroundColor: '#f8fafc' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>APPROVED CREDIT LIMIT</span>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>₹{parseFloat(creditLimit).toLocaleString()}</div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', backgroundColor: '#f8fafc' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>CREDIT USED</span>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#dc2626' }}>₹{parseFloat(creditUsed).toLocaleString()}</div>
              </div>

              <div style={{ border: '1px solid #16a34a', borderRadius: '8px', padding: '14px', backgroundColor: '#f0fdf4' }}>
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '800' }}>CREDIT AVAILABLE</span>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#16a34a' }}>
                  ₹{(parseFloat(creditLimit) - parseFloat(creditUsed)).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '500px' }}>
              <Checkbox label="Enable Credit Line Facility for this Seller" checked={creditEnabled} onChange={(e) => setCreditEnabled(e.target.checked)} />
              <Input label="Assign Approved Credit Limit (₹) *" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
              <Input label="Credit Facility Expiry Date" value={creditExpiry} readOnly />
              
              <Button variant="primary" style={{ backgroundColor: '#0f172a', borderColor: '#0f172a', width: 'fit-content' }} onClick={() => alert('Credit controls saved successfully.')}>
                Save Credit Controls
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: ACCOUNT CONTROLS */}
        {/* ========================================================================= */}
        {activeTab === 'account_controls' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Super Admin Account Control Actions
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>Account Status Toggle</strong>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Activate or suspend booking access for this merchant</p>
                <Button variant="outline" size="sm" onClick={() => setCustomerStatus(customerStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}>
                  {customerStatus === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                </Button>
              </Card>

              <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>Assign Account Manager</strong>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Assign dedicated Key Account Manager</p>
                <Button variant="outline" size="sm" onClick={() => alert('Manager assigned.')}>
                  Assign KAM
                </Button>
              </Card>

              <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>Force Logout Sessions</strong>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Terminate all active seller staff sessions</p>
                <Button variant="outline" size="sm" onClick={() => alert('Terminated all user active sessions.')}>
                  Force Logout All Users
                </Button>
              </Card>

              <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <strong style={{ fontSize: '14px', color: '#dc2626' }}>Reset Merchant Password</strong>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Send password reset email to merchant email</p>
                <Button variant="danger" size="sm" onClick={() => alert('Password reset email sent.')}>
                  Send Password Reset Link
                </Button>
              </Card>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: ACTIVITY AUDIT LOGS */}
        {/* ========================================================================= */}
        {activeTab === 'activity_logs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Full Account Operational Audit Log
            </h3>

            <Table
              keyExtractor={(r: any) => r.id}
              columns={[
                { key: 'timestamp', header: 'Timestamp', render: (r: any) => <span style={{ fontSize: '11px', color: '#64748b' }}>{r.timestamp}</span> },
                { key: 'actor', header: 'Actor / Admin', render: (r: any) => <strong>{r.actor}</strong> },
                { key: 'event', header: 'Event Category', render: (r: any) => <Badge variant="info">{r.event}</Badge> },
                { key: 'details', header: 'Activity Description', render: (r: any) => <span style={{ fontSize: '12px', color: '#334155' }}>{r.details}</span> },
              ]}
              data={[
                { id: '1', timestamp: '04 Sep, 02:15 PM', actor: 'Super Admin', event: 'Rate Card Update', details: 'Assigned Enterprise VIP B2C Rate Card v3.2' },
                { id: '2', timestamp: '03 Sep, 11:15 AM', actor: 'Admin Officer #04', event: 'KYC Approved', details: 'Verified GST Certificate & PAN Card' },
                { id: '3', timestamp: '01 Sep, 10:30 AM', actor: 'Mohit Sharma (Merchant)', event: 'Wallet Recharge', details: 'Recharged ₹15,000 via Razorpay PG' },
                { id: '4', timestamp: '20 Aug, 09:00 AM', actor: 'System', event: 'Account Created', details: 'Registered Seller Account CUST-2026-001' },
              ]}
            />
          </div>
        )}

      </Card>

      {/* ADMIN WALLET ADJUSTMENT MODAL */}
      {isAdjustModalOpen && (
        <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Post Admin Wallet Adjustment">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '10px' }}>
            <Select
              label="Adjustment Direction *"
              value={adjustDirection}
              onChange={(e) => setAdjustDirection(e.target.value as any)}
              options={[
                { value: 'CREDIT', label: 'CREDIT (+ Add Funds to Wallet)' },
                { value: 'DEBIT', label: 'DEBIT (- Deduct Funds from Wallet)' },
              ]}
            />
            <Input label="Amount (₹) *" type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} />
            <Input label="Adjustment Notes / Audit Reason *" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
            <Button variant="primary" onClick={handleExecuteAdjustment} style={{ backgroundColor: '#0f172a', borderColor: '#0f172a' }}>
              Post Wallet Adjustment
            </Button>
          </div>
        </Modal>
      )}

    </div>
  );
};
