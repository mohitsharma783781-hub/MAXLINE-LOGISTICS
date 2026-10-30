import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  Layers,
  Upload,
  Search,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Plus,
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
} from '../../components/ui';
import type {
  CostRateCard,
  WeightSlab,
  ZoneRateMatrixItem,
  CostRateResult,
} from '../../types/costRates';
import {
  DEMO_COST_RATE_CARDS,
  DEMO_WEIGHT_SLABS,
  DEMO_ZONE_RATES,
} from '../../mocks/costRates.mock';
import { DEMO_COURIER_PROVIDERS } from '../../mocks/couriers.mock';
import { CostRateEngine } from '../../services/costRateEngine';

export const AdminCostRatesPage: React.FC = () => {
  const navigate = useNavigate();

  const [rateCards, setRateCards] = useState<CostRateCard[]>(DEMO_COST_RATE_CARDS);
  const [slabs] = useState<WeightSlab[]>(DEMO_WEIGHT_SLABS);
  const [rates] = useState<ZoneRateMatrixItem[]>(DEMO_ZONE_RATES);

  const [selectedRateCardId, setSelectedRateCardId] = useState<string | null>('crc-del-b2c-v1');

  // Simulator Inputs
  const [simOriginPin, setSimOriginPin] = useState('110001');
  const [simDestPin, setSimDestPin] = useState('560038');
  const [simMode, setSimMode] = useState<'B2C' | 'B2B'>('B2C');
  const [simWeightKg, setSimWeightKg] = useState('1.5');
  const [simResults, setSimResults] = useState<CostRateResult[] | null>(null);

  // Modal State
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardCode, setCardCode] = useState('');
  const [cardCourierId, setCardCourierId] = useState('delhivery');
  const [cardMode, setCardMode] = useState<'B2C' | 'B2B'>('B2C');

  // Simulator Handler
  const handleRunSimulator = () => {
    const weightGrams = Math.round(parseFloat(simWeightKg || '1') * 1000);
    const res = CostRateEngine.getCourierCost({
      originPostalCode: simOriginPin,
      destinationPostalCode: simDestPin,
      mode: simMode,
      chargeableWeightGrams: weightGrams,
    });
    setSimResults(res);
  };

  const handleCreateCard = () => {
    if (!cardName.trim() || !cardCode.trim()) return;
    const courierObj = DEMO_COURIER_PROVIDERS.find((c) => c.id === cardCourierId) || DEMO_COURIER_PROVIDERS[0];

    const newCard: CostRateCard = {
      id: `crc-${Date.now()}`,
      name: cardName.trim(),
      code: cardCode.trim().toUpperCase(),
      courierId: courierObj.id,
      courierName: courierObj.name,
      accountCode: 'DEL-ACC-001',
      serviceId: 'srv-del-01',
      serviceCode: 'DEL_SURFACE_B2C',
      serviceName: `${courierObj.name} Standard`,
      mode: cardMode,
      zoneSchemeId: 'zs-del-b2c',
      zoneSchemeName: 'Default Zone Scheme',
      zoneType: 'DESTINATION_ZONE',
      currency: 'INR',
      version: 'v1.0',
      status: 'ACTIVE',
      effectiveFrom: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setRateCards((prev) => [newCard, ...prev]);
    setCardName('');
    setCardCode('');
    setIsAddCardOpen(false);
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Pricing Rate Cards', path: '/admin/pricing' },
    { label: 'Courier Cost Rates', path: '/admin/pricing' },
  ];

  const selectedRateCard = rateCards.find((rc) => rc.id === selectedRateCardId);
  const cardSlabs = slabs.filter((s) => s.rateCardId === selectedRateCardId);

  // Group rates by zone code
  const matrixZones = useMemo(() => {
    if (!selectedRateCardId) return [];
    const cardRates = rates.filter((r) => r.rateCardId === selectedRateCardId);
    const zoneCodes = Array.from(new Set(cardRates.map((r) => r.zoneCode)));
    return zoneCodes.map((zc) => {
      const zRates = cardRates.filter((r) => r.zoneCode === zc);
      return { zoneCode: zc, rates: zRates };
    });
  }, [rates, selectedRateCardId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Courier Cost Rate Card Engine"
        description="Manage platform-level courier cost rate cards, weight slabs, zonal rate matrices, and cost simulators. (Strictly isolated from customer selling rates)."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Upload size={16} />}
              onClick={() => navigate('/admin/pin-import')}
            >
              Bulk Import Rate Sheet
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => setIsAddCardOpen(true)}
            >
              + Create Cost Rate Card
            </Button>
          </div>
        }
      />

      {/* 2. Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard
          label="Active Cost Rate Cards"
          value={rateCards.filter((rc) => rc.status === 'ACTIVE').length}
          subtext="Platform cost rate cards"
          icon={IndianRupee}
        />
        <StatCard
          label="Configured Weight Slabs"
          value={slabs.length}
          subtext="Normalized weight slabs"
          icon={Layers}
        />
        <StatCard
          label="Avg. Platform Net Margin"
          value="33.3% Profit"
          subtext="Selling vs Cost Rate Differential"
          badgeText="PROFITABLE"
          badgeVariant="success"
          icon={CheckCircle2}
        />
      </div>

      {/* NET PROFIT MARGIN ANALYSIS BANNER */}
      <Card style={{ padding: '16px 20px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#14532d', margin: '0 0 4px 0' }}>
              💰 Platform Profitability & Courier Margin Differential Engine
            </h4>
            <p style={{ fontSize: '12px', color: '#15803d', margin: 0 }}>
              Live comparison between courier buy-rate (Cost Rate) and merchant charge (Selling Rate). Estimated Net Margin: <strong>+₹15.00 per 500g B2C order (33.3% Margin)</strong>.
            </p>
          </div>
          <Badge variant="success" style={{ fontSize: '12px', padding: '6px 12px' }}>
            STATUS: HIGH PROFITABILITY
          </Badge>
        </div>
      </Card>

      {/* 3. Cost Rate Cards Catalog Table */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
          Courier Cost Rate Cards Catalog
        </h4>

        <Table<CostRateCard>
          keyExtractor={(item) => item.id}
          columns={[
            {
              key: 'name',
              header: 'Rate Card Name & Code',
              render: (row) => (
                <div>
                  <strong>{row.name}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                    Code: {row.code} • Version: {row.version}
                  </div>
                </div>
              ),
            },
            {
              key: 'courierName',
              header: 'Courier & Account',
              render: (row) => (
                <div>
                  <strong>{row.courierName}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Account: {row.accountCode || 'PLATFORM'}</div>
                </div>
              ),
            },
            {
              key: 'mode',
              header: 'Mode',
              render: (row) => <Badge variant={row.mode === 'B2B' ? 'warning' : 'neutral'}>{row.mode}</Badge>,
            },
            {
              key: 'effectiveFrom',
              header: 'Effective Date',
              render: (row) => <span>From {row.effectiveFrom}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge variant={row.status === 'ACTIVE' ? 'success' : 'neutral'}>{row.status}</Badge>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Sliders size={14} />}
                  onClick={() => setSelectedRateCardId(selectedRateCardId === row.id ? null : row.id)}
                >
                  {selectedRateCardId === row.id ? 'Hide Matrix' : 'View Rate Matrix'}
                </Button>
              ),
            },
          ]}
          data={rateCards}
        />

        {/* Selected Rate Card Matrix Sub-Panel */}
        {selectedRateCard && (
          <Card style={{ marginTop: 'var(--space-6)', padding: 'var(--space-5)', backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-violet-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <div>
                <h4 style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--color-violet-main)' }}>
                  Zonal Rate Matrix for: {selectedRateCard.name} ({selectedRateCard.code})
                </h4>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Courier: <strong>{selectedRateCard.courierName}</strong> • Mode: <strong>{selectedRateCard.mode}</strong> • Currency: <strong>{selectedRateCard.currency}</strong>
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedRateCardId(null)}>Close Matrix</Button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-surface)', borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left' }}>Zone</th>
                    {cardSlabs.map((slab) => (
                      <th key={slab.id} style={{ padding: 'var(--space-3)', textAlign: 'right' }}>
                        {slab.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixZones.map((mz) => (
                    <tr key={mz.zoneCode} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-3)', fontWeight: 'bold' }}>
                        <Badge variant="brand">{mz.zoneCode}</Badge>
                      </td>
                      {cardSlabs.map((slab) => {
                        const rItem = mz.rates.find((r) => r.slabId === slab.id);
                        if (!rItem) return <td key={slab.id} style={{ padding: 'var(--space-3)', textAlign: 'right', color: 'var(--color-text-muted)' }}>-</td>;

                        const val = slab.slabType === 'ADDITIONAL'
                          ? `+₹${((rItem.additionalKgRatePaise || 0) / 100).toFixed(2)}/kg`
                          : `₹${(rItem.baseRatePaise / 100).toFixed(2)}`;

                        return (
                          <td key={slab.id} style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-violet-main)' }}>
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </Card>

      {/* 4. Test Courier Cost Simulator */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
          "Test Courier Cost" Simulator Tool
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
          <Input
            label="Origin PIN *"
            placeholder="110001"
            value={simOriginPin}
            onChange={(e) => setSimOriginPin(e.target.value)}
          />
          <Input
            label="Destination PIN *"
            placeholder="560038"
            value={simDestPin}
            onChange={(e) => setSimDestPin(e.target.value)}
          />
          <Select
            label="Commercial Mode *"
            value={simMode}
            onChange={(e) => setSimMode(e.target.value as any)}
            options={[
              { value: 'B2C', label: 'B2C Consumer Order' },
              { value: 'B2B', label: 'B2B Commercial Order' },
            ]}
          />
          <Input
            label="Chargeable Weight (KG) *"
            type="number"
            value={simWeightKg}
            onChange={(e) => setSimWeightKg(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
          <Button variant="primary" leftIcon={<Search size={16} />} onClick={handleRunSimulator}>
            Calculate Raw Courier Cost
          </Button>

          <Button variant="outline" leftIcon={<RotateCcw size={14} />} onClick={() => { setSimOriginPin('110001'); setSimDestPin('560038'); setSimMode('B2C'); setSimWeightKg('1.5'); setSimResults(null); }}>
            Reset
          </Button>
        </div>

        {simResults && (
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h5 style={{ fontWeight: 'bold', fontSize: '14px' }}>Cost Calculation Results:</h5>
            {simResults.map((res, idx) => (
              <Card key={idx} style={{ padding: 'var(--space-4)', backgroundColor: res.serviceable ? 'var(--color-surface)' : 'var(--color-surface-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                  <div>
                    <strong style={{ fontSize: '15px' }}>{res.courierName}</strong> ({res.serviceName})
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Origin Zone: <strong>{res.originZone}</strong> → Destination Zone: <strong>{res.destinationZone}</strong> • Weight Slab: <strong>{res.weightSlabLabel}</strong>
                    </div>
                  </div>

                  {res.serviceable ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-violet-main)' }}>
                        ₹{(res.totalCostPaise / 100).toFixed(2)}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        Base: ₹{(res.baseFreightPaise / 100).toFixed(2)} | Addl: ₹{(res.additionalWeightPaise / 100).toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <Badge variant="danger">Not Serviceable / No Rate Card</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Add Card Modal */}
      {isAddCardOpen && (
        <ConfirmationDialog
          isOpen={isAddCardOpen}
          onClose={() => setIsAddCardOpen(false)}
          onConfirm={handleCreateCard}
          title="Create Cost Rate Card"
          description="Create a platform courier cost rate card record."
          confirmLabel="Create Rate Card"
          cancelLabel="Cancel"
          variant="primary"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Input
              label="Rate Card Name *"
              placeholder="e.g. Delhivery B2C Surface Cost Rate Card 2026"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
            />
            <Input
              label="Rate Card Code (Uppercase, e.g. CRC_DEL_B2C_2026) *"
              placeholder="CRC_DEL_B2C_2026"
              value={cardCode}
              onChange={(e) => setCardCode(e.target.value)}
            />
            <Select
              label="Courier Partner *"
              value={cardCourierId}
              onChange={(e) => setCardCourierId(e.target.value)}
              options={DEMO_COURIER_PROVIDERS.map((c) => ({ value: c.id, label: c.name }))}
            />
            <Select
              label="Commercial Mode *"
              value={cardMode}
              onChange={(e) => setCardMode(e.target.value as any)}
              options={[
                { value: 'B2C', label: 'B2C Consumer' },
                { value: 'B2B', label: 'B2B Commercial' },
              ]}
            />
          </div>
        </ConfirmationDialog>
      )}
    </div>
  );
};
