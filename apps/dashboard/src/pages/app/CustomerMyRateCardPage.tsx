import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Card,
  Badge,
  Table,
} from '../../components/ui';
import { DEMO_B2C_RATE_CARDS } from '../../mocks/b2cPricing.mock';
import { DEMO_B2B_RATE_CARDS } from '../../mocks/b2bPricing.mock';
import { B2B_ZONES } from '../../types/b2bPricing';

export const CustomerMyRateCardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'B2C' | 'B2B'>('B2C');

  const b2cCard = DEMO_B2C_RATE_CARDS[0];
  const b2bCard = DEMO_B2B_RATE_CARDS[0];

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'My Rate Card', path: '/app/my-rate-card' },
  ];

  const b2cZones = [
    { code: 'ZONE_A', label: 'Zone A (Intra-city)' },
    { code: 'ZONE_B', label: 'Zone B (Intra-state)' },
    { code: 'ZONE_C1', label: 'Zone C1 (Metro-Metro)' },
    { code: 'ZONE_C2', label: 'Zone C2 (Metro-Rest)' },
    { code: 'ZONE_C3', label: 'Zone C3 (Rest of India)' },
    { code: 'ZONE_D', label: 'Zone D (Remote)' },
    { code: 'ZONE_E', label: 'Zone E (NE & J&K)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* PAGE HEADER */}
      <PageHeader
        title="My Rate Card & Pricing Schedule"
        description="Your active assigned selling rate card schedules for B2C Express and B2B Freight Cargo shipments."
        breadcrumbs={breadcrumbs}
      />

      {/* TOP-LEVEL TABS: MY B2C RATES vs MY B2B RATES */}
      <Card style={{ padding: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--color-surface-secondary)', padding: '4px', borderRadius: 'var(--radius-default)' }}>
            <button
              onClick={() => setActiveTab('B2C')}
              style={{
                padding: '8px 24px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: activeTab === 'B2C' ? 'var(--color-violet-main)' : 'transparent',
                color: activeTab === 'B2C' ? '#ffffff' : 'var(--color-text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
            >
              My B2C Express Rates
            </button>
            <button
              onClick={() => setActiveTab('B2B')}
              style={{
                padding: '8px 24px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: activeTab === 'B2B' ? 'var(--color-violet-main)' : 'transparent',
                color: activeTab === 'B2B' ? '#ffffff' : 'var(--color-text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
            >
              My B2B Freight Matrix
            </button>
          </div>

          <Badge variant="success">ACTIVE ASSIGNED CARD</Badge>
        </div>
      </Card>

      {activeTab === 'B2C' ? (
        /* MY B2C RATES VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Rate Card Summary */}
          <Card style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--color-text-primary)' }}>
                    {b2cCard.name}
                  </h3>
                  <Badge variant="neutral">{b2cCard.version}</Badge>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Courier: <strong>{b2cCard.courierName}</strong> • Service Mode: <strong>{b2cCard.serviceType}</strong> • Effective Date: <strong>{b2cCard.publishedAt}</strong>
                </div>
              </div>
            </div>
          </Card>

          {/* B2C Weight Slab Matrix Table */}
          <Card style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
              Weight Slab & Zonal Selling Rates
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 'bold' }}>Weight Slab</th>
                    {b2cZones.map((z) => (
                      <th key={z.code} style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 'bold' }}>
                        {z.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b2cCard.weightSlabs.map((slab) => (
                    <tr key={slab.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--color-violet-main)' }}>
                        {slab.label}
                      </td>

                      {b2cZones.map((z) => {
                        const r = slab.ratesByZone[z.code] || { baseRatePaise: 2700, additionalRatePaise: 2500 };
                        const baseINR = (r.baseRatePaise / 100).toFixed(0);
                        const addlINR = (r.additionalRatePaise / 100).toFixed(0);

                        return (
                          <td key={z.code} style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                              <strong style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                                ₹{baseINR} <span style={{ color: 'var(--color-text-muted)', fontWeight: 'normal' }}>/</span> ₹{addlINR}
                              </strong>
                              <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                Base / Addl
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Applicable B2C Charges */}
          <Card style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
              Applicable B2C Surcharges & Fees
            </h3>
            <Table
              columns={[
                { key: 'name', header: 'Charge Name', render: (r) => <strong>{r.name}</strong> },
                { key: 'type', header: 'Type', render: (r) => <Badge variant="info">{r.type}</Badge> },
                { key: 'value', header: 'Applied Rate', render: (r) => <strong>{r.type === 'PERCENTAGE' ? `${r.value}%` : `₹${(r.value / 100).toFixed(2)}`}</strong> },
                { key: 'min', header: 'Min Charge', render: (r) => <span>{r.minPaise ? `₹${(r.minPaise / 100).toFixed(2)}` : '-'}</span> },
              ]}
              data={b2cCard.surcharges.filter((s) => s.enabled)}
              keyExtractor={(r) => r.id}
            />
          </Card>
        </div>
      ) : (
        /* MY B2B RATES VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* B2B Rate Card Summary */}
          <Card style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--color-text-primary)' }}>
                    {b2bCard.name}
                  </h3>
                  <Badge variant="neutral">{b2bCard.version}</Badge>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Courier: <strong>{b2bCard.courierName}</strong> • Volumetric Divisor: <strong>{b2bCard.volumetricDivisor}</strong> • Effective Date: <strong>{b2bCard.effectiveFrom}</strong>
                </div>
              </div>
            </div>
          </Card>

          {/* 16x16 B2B Zone-to-Zone Matrix Table */}
          <Card style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
              16×16 Zone-to-Zone Freight Rates (₹ per KG)
            </h3>

            <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface-secondary)', zIndex: 1, borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ padding: '8px', textAlign: 'left', minWidth: '70px', position: 'sticky', left: 0, backgroundColor: 'var(--color-surface-secondary)', zIndex: 2 }}>Origin / Dest</th>
                    {B2B_ZONES.map((z) => (
                      <th key={z} style={{ padding: '8px', textAlign: 'center', minWidth: '55px' }}>{z}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {B2B_ZONES.map((oz) => (
                    <tr key={oz} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderRight: '1px solid var(--color-border)' }}>
                        {oz}
                      </td>
                      {B2B_ZONES.map((dz) => {
                        const ratePaise = b2bCard.matrixMap?.[oz]?.[dz] || 680;
                        return (
                          <td key={dz} style={{ padding: '8px', textAlign: 'center' }}>
                            ₹{(ratePaise / 100).toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Applicable B2B Surcharges */}
          <Card style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
              Applicable B2B Freight Surcharges
            </h3>
            <Table
              columns={[
                { key: 'name', header: 'Surcharge Name', render: (r) => <strong>{r.name}</strong> },
                { key: 'type', header: 'Type', render: (r) => <Badge variant="info">{r.calcType}</Badge> },
                { key: 'value', header: 'Rate / Value', render: (r) => <strong>{r.calcType === 'PERCENTAGE' ? `${r.value}%` : `₹${(r.value / 100).toFixed(2)}`}</strong> },
              ]}
              data={b2bCard.surcharges.filter((s) => s.status === 'ACTIVE')}
              keyExtractor={(r) => r.id}
            />
          </Card>
        </div>
      )}
    </div>
  );
};
