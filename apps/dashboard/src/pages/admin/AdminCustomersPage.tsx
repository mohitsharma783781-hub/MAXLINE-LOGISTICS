import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  RotateCcw,
  CheckCircle2,
  Eye,
  Sliders,
  ShieldAlert,
  Search,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Input,
  Select,
  ConfirmationDialog,
  Modal,
} from '../../components/ui';
import { AdminManagementService } from '../../services/adminManagementService';

export interface CustomerTenant extends Record<string, unknown> {
  id: string;
  customerId: string;
  tenantId: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  gstNumber: string;
  kycStatus: 'Approved' | 'Under Review' | 'Pending Documents' | 'Rejected';
  city: string;
  state: string;
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  walletBalance: number;
  assignedRateCard: string;
  rateCardAssigned: boolean;
  totalOrders: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  createdAt: string;
  monthlyVolume: number;
}

export const DEMO_CUSTOMERS: CustomerTenant[] = [];

export const AdminCustomersPage: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<CustomerTenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [volumeFilter, setVolumeFilter] = useState('all');

  const fetchLiveMerchants = async () => {
    setIsLoading(true);
    try {
      const liveData = await AdminManagementService.getMerchants();
      if (liveData && liveData.length > 0) {
        const liveCustomers: CustomerTenant[] = liveData.map((m) => ({
          id: m.id,
          customerId: `MERCH-${m.id.slice(0, 8).toUpperCase()}`,
          tenantId: m.id,
          name: m.ownerName || 'Merchant Owner',
          companyName: m.businessName || 'Business Entity',
          email: m.ownerEmail || 'contact@merchant.in',
          phone: m.ownerPhone || 'N/A',
          gstNumber: '22AAAAA0000A1Z5',
          kycStatus: m.status === 'ACTIVE' ? 'Approved' : 'Under Review',
          city: 'Registered Hub',
          state: 'India',
          plan: 'PRO',
          walletBalance: m.walletBalanceINR,
          assignedRateCard: 'Delhivery Surface B2B Standard',
          rateCardAssigned: true,
          totalOrders: 0,
          status: m.status === 'PENDING_KYC' ? 'PENDING' : m.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
          createdAt: m.createdAt ? m.createdAt.split('T')[0] : '2026-10-30',
          monthlyVolume: 150,
        }));

        setCustomers(liveCustomers);
      } else {
        setCustomers([]);
      }
    } catch (e) {
      console.warn('[AdminCustomersPage] Could not load live merchants:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveMerchants();
  }, []);

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custCompany, setCustCompany] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custGst, setCustGst] = useState('');

  const [assignModalCustomer, setAssignModalCustomer] = useState<CustomerTenant | null>(null);
  const [selectedRateCard, setSelectedRateCard] = useState('Retail B2C Standard Card');

  const filteredCustomers = customers.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (kycFilter !== 'all' && c.kycStatus !== kycFilter) return false;
    if (volumeFilter === 'high' && c.monthlyVolume < 300) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = c.customerId.toLowerCase().includes(q);
      const matchName = c.name.toLowerCase().includes(q);
      const matchComp = c.companyName.toLowerCase().includes(q);
      const matchEmail = c.email.toLowerCase().includes(q);
      const matchPhone = c.phone.toLowerCase().includes(q);
      const matchGst = c.gstNumber.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchComp && !matchEmail && !matchPhone && !matchGst) return false;
    }
    return true;
  });

  const handleCreateCustomer = () => {
    if (!custName.trim() || !custEmail.trim()) return;
    const newCust: CustomerTenant = {
      id: `c-${Date.now()}`,
      customerId: `CUST-2026-${Math.floor(100 + Math.random() * 900)}`,
      tenantId: `tenant-${Date.now()}`,
      name: custName.trim(),
      companyName: custCompany.trim() || custName.trim(),
      email: custEmail.trim(),
      phone: custPhone.trim() || '+91 90000 00000',
      gstNumber: custGst.toUpperCase() || '22AAAAA0000A1Z5',
      kycStatus: 'Under Review',
      city: 'New Delhi',
      state: 'Delhi',
      plan: 'STARTER',
      walletBalance: 0,
      assignedRateCard: 'Retail B2C Standard Card',
      rateCardAssigned: true,
      totalOrders: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
      monthlyVolume: 0,
    };

    setCustomers((prev) => [newCust, ...prev]);
    setCustName('');
    setCustEmail('');
    setCustCompany('');
    setCustPhone('');
    setCustGst('');
    setIsAddOpen(false);
  };

  const handleAssignRateCard = () => {
    if (!assignModalCustomer) return;
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === assignModalCustomer.id
          ? {
              ...c,
              assignedRateCard: selectedRateCard,
              rateCardAssigned: true,
              status: c.status === 'PENDING' ? 'ACTIVE' : c.status,
            }
          : c
      )
    );
    setAssignModalCustomer(null);
  };

  const handleToggleStatus = async (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;
    const nextStatus = cust.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    
    // Optimistic UI update
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, status: nextStatus } : c))
    );

    // If real database merchant UUID (length > 20), persist to PostgreSQL via Admin API
    if (customerId.length > 20) {
      await AdminManagementService.updateMerchantStatus(customerId, nextStatus as any);
    }
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Customer Management Center', path: '/admin/customers' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      <PageHeader
        title="Super Admin Customer Management Center"
        description="Central control panel to audit, verify, assign rate cards, manage wallet credit, and monitor all merchant accounts."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} className={isLoading ? 'spin' : ''} />}
              onClick={fetchLiveMerchants}
              disabled={isLoading}
            >
              Sync Database
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => setIsAddOpen(true)}
              style={{ backgroundColor: '#0f172a', borderColor: '#0f172a' }}
            >
              + Register New Seller Account
            </Button>
          </div>
        }
      />

      {/* 5 DASHBOARD STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard
          label="TOTAL CUSTOMERS"
          value={customers.length}
          subtext="Merchant accounts"
          badgeText="TOTAL"
          badgeVariant="neutral"
          icon={Users}
        />
        <StatCard
          label="ACTIVE CUSTOMERS"
          value={customers.filter((c) => c.status === 'ACTIVE').length}
          subtext="Operational sellers"
          badgeText="ACTIVE"
          badgeVariant="success"
          icon={CheckCircle2}
        />
        <StatCard
          label="PENDING KYC"
          value={customers.filter((c) => c.kycStatus !== 'Approved').length}
          subtext="Verification required"
          badgeText="KYC GATE"
          badgeVariant="warning"
          icon={ShieldAlert}
        />
        <StatCard
          label="SUSPENDED ACCOUNTS"
          value={customers.filter((c) => c.status === 'SUSPENDED').length}
          subtext="Restricted merchants"
          badgeText="BLOCKED"
          badgeVariant="danger"
          icon={ShieldAlert}
        />
        <StatCard
          label="HIGH VOLUME SELLERS"
          value={customers.filter((c) => c.monthlyVolume >= 300).length}
          subtext="300+ shipments/mo"
          badgeText="VIP"
          badgeVariant="info"
          icon={TrendingUp}
        />
      </div>

      {/* SEARCH & FILTERS TOOLBAR */}
      <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <Input
              placeholder="Search by Company, Contact, Email, Mobile, GST, or Customer ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leadingIcon={<Search size={16} />}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Account Status: All' },
                { value: 'ACTIVE', label: 'Active Sellers' },
                { value: 'PENDING', label: 'Pending Review' },
                { value: 'SUSPENDED', label: 'Suspended Sellers' },
              ]}
              style={{ width: '170px' }}
            />

            <Select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
              options={[
                { value: 'all', label: 'KYC Status: All' },
                { value: 'Approved', label: 'KYC Approved' },
                { value: 'Under Review', label: 'KYC Under Review' },
                { value: 'Pending Documents', label: 'Pending Documents' },
              ]}
              style={{ width: '180px' }}
            />

            <Select
              value={volumeFilter}
              onChange={(e) => setVolumeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Volume Tier: All' },
                { value: 'high', label: 'High Volume (300+)' },
              ]}
              style={{ width: '160px' }}
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setKycFilter('all');
                setVolumeFilter('all');
              }}
            >
              <RotateCcw size={14} />
            </Button>
          </div>
        </div>
      </Card>

      {/* ALL CUSTOMERS MASTER TABLE */}
      <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
        <Table<CustomerTenant>
          keyExtractor={(item) => item.id}
          columns={[
            {
              key: 'customerId',
              header: 'Customer ID',
              render: (row) => <strong style={{ color: '#0284c7', fontFamily: 'monospace', fontSize: '12px' }}>{row.customerId}</strong>,
            },
            {
              key: 'name',
              header: 'Company & Contact',
              render: (row) => (
                <div>
                  <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>{row.companyName}</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Contact: {row.name}</span>
                </div>
              ),
            },
            {
              key: 'email',
              header: 'Contact Info',
              render: (row) => (
                <div style={{ fontSize: '12px', color: '#334155' }}>
                  <div>{row.email}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{row.phone}</div>
                </div>
              ),
            },
            {
              key: 'gstNumber',
              header: 'GST Number',
              render: (row) => <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#475569' }}>{row.gstNumber}</span>,
            },
            {
              key: 'kycStatus',
              header: 'KYC Status',
              render: (row) => (
                <Badge variant={row.kycStatus === 'Approved' ? 'success' : row.kycStatus === 'Under Review' ? 'warning' : 'danger'}>
                  {row.kycStatus}
                </Badge>
              ),
            },
            {
              key: 'walletBalance',
              header: 'Wallet Balance',
              render: (row) => <strong>₹{row.walletBalance.toLocaleString('en-IN')}</strong>,
            },
            {
              key: 'assignedRateCard',
              header: 'Assigned Rate Card',
              render: (row) => (
                <Badge variant={row.rateCardAssigned ? 'brand' : 'neutral'}>
                  {row.assignedRateCard}
                </Badge>
              ),
            },
            {
              key: 'totalOrders',
              header: 'Total Orders',
              render: (row) => <span style={{ fontWeight: '700', color: '#0f172a' }}>{row.totalOrders}</span>,
            },
            {
              key: 'status',
              header: 'Account Status',
              render: (row) => (
                <Badge variant={row.status === 'ACTIVE' ? 'success' : row.status === 'PENDING' ? 'warning' : 'danger'}>
                  {row.status}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Eye size={12} />}
                    onClick={() => navigate(`/admin/customers/${row.id}`)}
                    style={{ fontSize: '11px', padding: '4px 8px', color: '#0284c7', borderColor: '#0284c7' }}
                  >
                    View Master Profile
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Sliders size={12} />}
                    onClick={() => {
                      setAssignModalCustomer(row);
                      setSelectedRateCard(row.assignedRateCard !== 'Not Assigned' ? row.assignedRateCard : 'Retail B2C Standard Card');
                    }}
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    Rate Card
                  </Button>

                  <Button
                    variant={row.status === 'ACTIVE' ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => handleToggleStatus(row.id)}
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    {row.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredCustomers}
        />
      </Card>

      {/* REGISTER NEW CUSTOMER MODAL */}
      {isAddOpen && (
        <ConfirmationDialog
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onConfirm={handleCreateCustomer}
          title="Register New Customer Account"
          description="Create a new merchant account in the platform system."
          confirmLabel="Create Customer"
          cancelLabel="Cancel"
          variant="primary"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <Input label="Company Name *" placeholder="e.g. Acme Enterprises Pvt Ltd" value={custCompany} onChange={(e) => setCustCompany(e.target.value)} />
            <Input label="Contact Person Name *" placeholder="Rajesh Sharma" value={custName} onChange={(e) => setCustName(e.target.value)} />
            <Input label="Work Email Address *" type="email" placeholder="customer@email.com" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} />
            <Input label="Mobile Phone Number" placeholder="+91 98765 43210" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} />
            <Input label="GSTIN Number" placeholder="22AAAAA0000A1Z5" value={custGst} onChange={(e) => setCustGst(e.target.value)} />
          </div>
        </ConfirmationDialog>
      )}

      {/* ASSIGN RATE CARD MODAL */}
      {assignModalCustomer && (
        <Modal
          isOpen={!!assignModalCustomer}
          onClose={() => setAssignModalCustomer(null)}
          title={`Assign Rate Card — ${assignModalCustomer.companyName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px' }}>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Select a selling rate card for <strong>{assignModalCustomer.companyName}</strong>. The merchant will be charged according to this assigned card.
            </p>

            <Select
              label="Select Selling Rate Card *"
              value={selectedRateCard}
              onChange={(e) => setSelectedRateCard(e.target.value)}
              options={[
                { value: 'Enterprise VIP B2C Card', label: 'Enterprise VIP B2C Card' },
                { value: 'Retail B2C Standard Card', label: 'Retail B2C Standard Card' },
                { value: 'Business B2C Discounted Card', label: 'Business B2C Discounted Card' },
                { value: 'Default B2B Freight Matrix Card', label: 'Default B2B Freight Matrix Card' },
              ]}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Button variant="outline" onClick={() => setAssignModalCustomer(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAssignRateCard} style={{ backgroundColor: '#0f172a', borderColor: '#0f172a' }}>
                Assign Rate Card
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
