import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Users,
  Eye,
  Sliders,
  Layers,
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
  Modal,
  Alert,
} from '../../components/ui';
import { DEMO_B2B_RATE_CARDS } from '../../mocks/b2bPricing.mock';
import { DEMO_B2C_RATE_CARDS } from '../../mocks/b2cPricing.mock';
import { CustomerRateAssignmentService } from '../../services/customerRateAssignmentService';
import { DEMO_COURIER_PROVIDERS } from '../../mocks/couriers.mock';

export interface UnifiedRateCardSummary extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  type: 'B2B' | 'B2C';
  courierId: string;
  courierName: string;
  serviceName: string;
  version: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  updatedAt: string;
  assignedCustomersCount: number;
}

export const AdminAllRateCardsPage: React.FC = () => {
  const navigate = useNavigate();

  // Combine B2B and B2C rate cards
  const [rateCards] = useState<UnifiedRateCardSummary[]>(() => {
    const assignments = CustomerRateAssignmentService.getAssignments();

    const b2bCards: UnifiedRateCardSummary[] = DEMO_B2B_RATE_CARDS.map((c) => {
      const count = assignments.filter((a) => a.rateCardId === c.id).length || 2;
      return {
        id: c.id,
        name: c.name,
        code: c.code,
        type: 'B2B',
        courierId: c.courierId,
        courierName: c.courierName,
        serviceName: c.serviceName,
        version: c.version,
        status: c.status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
        updatedAt: c.updatedAt,
        assignedCustomersCount: count,
      };
    });

    const b2cCards: UnifiedRateCardSummary[] = DEMO_B2C_RATE_CARDS.map((c) => {
      const count = assignments.filter((a) => a.rateCardId === c.id).length || 3;
      return {
        id: c.id,
        name: c.name,
        code: c.code,
        type: 'B2C',
        courierId: c.courierId,
        courierName: c.courierName,
        serviceName: c.serviceName,
        version: c.version,
        status: c.status === 'PUBLISHED' ? 'ACTIVE' : 'DRAFT',
        updatedAt: c.updatedAt,
        assignedCustomersCount: count,
      };
    });

    return [...b2bCards, ...b2cCards];
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'B2B' | 'B2C'>('ALL');
  const [courierFilter, setCourierFilter] = useState('ALL');

  // Assign Customer Modal
  const [assigningCard, setAssigningCard] = useState<UnifiedRateCardSummary | null>(null);
  const [selectedTenants, setSelectedTenants] = useState<string[]>(['tenant-demo-01']);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenAssign = (card: UnifiedRateCardSummary) => {
    setAssigningCard(card);
    setIsAssignModalOpen(true);
  };

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const handleConfirmAssign = () => {
    if (!assigningCard) return;

    selectedTenants.forEach((tId) => {
      CustomerRateAssignmentService.assignRateCard({
        tenantId: tId,
        tenantName: tId === 'tenant-demo-01' ? 'Acme Logistics Pvt Ltd' : tId === 'tenant-acme-02' ? 'Zomato Merchant' : 'Nexus Tech B2B',
        mode: assigningCard.type,
        courierId: assigningCard.courierId,
        courierName: assigningCard.courierName,
        serviceId: `${assigningCard.courierId}-service`,
        serviceName: assigningCard.serviceName,
        rateCardId: assigningCard.id,
        rateCardName: assigningCard.name,
        rateCardVersion: assigningCard.version,
        isDefault: true,
        effectiveFrom: new Date().toISOString().split('T')[0],
      });
    });

    setToastMessage(`Assigned ${assigningCard.name} to ${selectedTenants.length} customer tenant(s).`);
    setIsAssignModalOpen(false);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredCards = rateCards.filter((c) => {
    if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;
    if (courierFilter !== 'ALL' && c.courierId !== courierFilter) return false;
    if (searchQuery.trim() && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Rate Cards', path: '/admin/b2b-rates' },
    { label: 'All Rate Cards', path: '/admin/all-rate-cards' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* PAGE HEADER */}
      <PageHeader
        title="All Rate Cards Master Catalog"
        description="Comprehensive overview of all B2B Commercial Freight and B2C Express Selling rate cards, version history, and assigned merchant customers."
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => navigate('/admin/create-rate-card')}>
            + Create Rate Card
          </Button>
        }
      />

      {toastMessage && (
        <Alert variant="success" title="Customer Rate Assignment">
          {toastMessage}
        </Alert>
      )}

      {/* METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard label="TOTAL RATE CARDS" value={rateCards.length} subtext="Active Pricing Models" badgeText="MASTER" badgeVariant="neutral" icon={FolderKanban} />
        <StatCard label="B2B CARGO CARDS" value={rateCards.filter((c) => c.type === 'B2B').length} subtext="16x16 Zone Freight" badgeText="B2B" badgeVariant="info" icon={Layers} />
        <StatCard label="B2C EXPRESS CARDS" value={rateCards.filter((c) => c.type === 'B2C').length} subtext="Zonal Weight Slabs" badgeText="B2C" badgeVariant="success" icon={Sliders} />
      </div>

      {/* CONTROLS */}
      <Card style={{ padding: 'var(--space-3)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
          <Input placeholder="Search Rate Cards..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            options={[
              { value: 'ALL', label: 'All Types (B2B & B2C)' },
              { value: 'B2B', label: 'B2B Commercial Cargo' },
              { value: 'B2C', label: 'B2C Express Courier' },
            ]}
          />
          <Select
            value={courierFilter}
            onChange={(e) => setCourierFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Couriers' },
              ...DEMO_COURIER_PROVIDERS.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      </Card>

      {/* RATE CARDS TABLE */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          Rate Cards Master Catalog
        </h3>

        <Table<UnifiedRateCardSummary>
          keyExtractor={(c) => c.id}
          columns={[
            {
              key: 'name',
              header: 'Rate Card Name & Code',
              render: (c) => (
                <div>
                  <strong style={{ color: 'var(--color-violet-main)' }}>{c.name}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{c.code}</div>
                </div>
              ),
            },
            {
              key: 'type',
              header: 'Commercial Type',
              render: (c) => <Badge variant={c.type === 'B2B' ? 'info' : 'success'}>{c.type}</Badge>,
            },
            { key: 'courierName', header: 'Courier Partner', render: (c) => <strong>{c.courierName}</strong> },
            { key: 'serviceName', header: 'Service Mode', render: (c) => <span>{c.serviceName}</span> },
            {
              key: 'assignedCustomersCount',
              header: 'Assigned Merchants',
              render: (c) => (
                <Badge variant="brand">
                  <Users size={12} style={{ marginRight: '4px' }} />
                  {c.assignedCustomersCount} Merchant(s)
                </Badge>
              ),
            },
            { key: 'version', header: 'Version', render: (c) => <Badge variant="neutral">{c.version}</Badge> },
            { key: 'status', header: 'Status', render: (c) => <Badge variant="success">{c.status}</Badge> },
            {
              key: 'actions',
              header: 'Actions',
              align: 'right',
              render: (c) => (
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Eye size={12} />}
                    onClick={() => navigate(c.type === 'B2B' ? '/admin/b2b-rates' : '/admin/selling-rates')}
                  >
                    View / Edit
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Users size={12} />}
                    onClick={() => handleOpenAssign(c)}
                  >
                    Assign Customer
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredCards}
        />
      </Card>

      {/* ASSIGN CUSTOMER MODAL */}
      {isAssignModalOpen && assigningCard && (
        <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={`Assign ${assigningCard.name} to Merchants`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Select merchant customer tenants to assign <strong>{assigningCard.name} ({assigningCard.type})</strong> as their active selling rate card.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-default)' }}>
              {[
                { id: 'tenant-demo-01', name: 'Acme Logistics Pvt Ltd (tenant-demo-01)' },
                { id: 'tenant-acme-02', name: 'Zomato Merchant Partner (tenant-acme-02)' },
                { id: 'tenant-vip-03', name: 'Nexus Tech B2B (tenant-vip-03)' },
              ].map((t) => {
                const checked = selectedTenants.includes(t.id);
                return (
                  <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTenants([...selectedTenants, t.id]);
                        } else {
                          setSelectedTenants(selectedTenants.filter((id) => id !== t.id));
                        }
                      }}
                    />
                    <span>{t.name}</span>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmSaveAssign}>
                Assign Pricing
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );

  function handleConfirmSaveAssign() {
    handleConfirmAssign();
  }
};
