import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Upload,
  CheckCircle2,
  Edit2,
  Layers,
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
} from '../../components/ui';

export interface GeographicZoneMasterGroup extends Record<string, unknown> {
  code: string;
  name: string;
  states: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export const DEFAULT_GEOGRAPHIC_ZONE_GROUPS: GeographicZoneMasterGroup[] = [
  { code: 'N1', name: 'North Zone 1 (NCR & Plains)', states: ['Delhi', 'Uttar Pradesh', 'Haryana', 'Rajasthan'], status: 'ACTIVE' },
  { code: 'N2', name: 'North Zone 2 (Upper North)', states: ['Chandigarh', 'Punjab', 'Uttarakhand', 'Ladakh'], status: 'ACTIVE' },
  { code: 'N3', name: 'North Zone 3 (Hills & Border)', states: ['Himachal Pradesh', 'Jammu & Kashmir'], status: 'ACTIVE' },
  { code: 'C1', name: 'Central Zone 1', states: ['Madhya Pradesh'], status: 'ACTIVE' },
  { code: 'W1', name: 'West Zone 1 (Gujarat & UTs)', states: ['Gujarat', 'Daman & Diu', 'Dadra & Nagar Haveli'], status: 'ACTIVE' },
  { code: 'W2', name: 'West Zone 2 (Maharashtra)', states: ['Maharashtra', 'Goa'], status: 'ACTIVE' },
  { code: 'S1', name: 'South Zone 1 (Deccan Plains)', states: ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Puducherry'], status: 'ACTIVE' },
  { code: 'S2', name: 'South Zone 2 (Coastal South)', states: ['Kerala'], status: 'ACTIVE' },
  { code: 'E1', name: 'East Zone 1 (Eastern Plains)', states: ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand', 'Chhattisgarh'], status: 'ACTIVE' },
  { code: 'NE1', name: 'North East 1 (Hub)', states: ['Guwahati'], status: 'ACTIVE' },
  { code: 'NE2', name: 'North East 2 (Seven Sisters)', states: ['Assam', 'Meghalaya', 'Tripura', 'Arunachal Pradesh', 'Mizoram', 'Manipur', 'Nagaland', 'Sikkim'], status: 'ACTIVE' },
];

export const AdminZonesPage: React.FC = () => {
  const navigate = useNavigate();
  const [zoneGroups, setZoneGroups] = useState<GeographicZoneMasterGroup[]>(DEFAULT_GEOGRAPHIC_ZONE_GROUPS);
  const [editingGroup, setEditingGroup] = useState<GeographicZoneMasterGroup | null>(null);
  const [editStatesInput, setEditStatesInput] = useState('');

  const handleOpenEdit = (group: GeographicZoneMasterGroup) => {
    setEditingGroup(group);
    setEditStatesInput(group.states.join(', '));
  };

  const handleSaveEdit = () => {
    if (!editingGroup) return;
    const parsedStates = editStatesInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    setZoneGroups((prev) =>
      prev.map((g) => (g.code === editingGroup.code ? { ...g, states: parsedStates } : g))
    );
    setEditingGroup(null);
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Settings', path: '/admin/settings' },
    { label: 'Zone Master', path: '/admin/zones' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* PAGE HEADER */}
      <PageHeader
        title="Settings → Zone Master"
        description="Centralized geographic zone mappings (N1 to NE2) used across courier rate cards, pricing engines, and linehaul route resolution."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" size="sm" leftIcon={<Upload size={14} />} onClick={() => navigate('/admin/pin-import')}>
              Bulk Import PIN Mappings
            </Button>
          </div>
        }
      />

      {/* METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard label="ZONE GROUPS" value={zoneGroups.length} subtext="N1 to NE2 Master Zones" badgeText="MASTER" badgeVariant="neutral" icon={MapPin} />
        <StatCard label="MAPPED STATES / UTs" value={zoneGroups.reduce((acc, g) => acc + g.states.length, 0)} subtext="Indian States & UTs" badgeText="COVERAGE" badgeVariant="success" icon={CheckCircle2} />
        <StatCard label="COMMERCIAL SCHEMES" value="6 Active" subtext="B2C & B2B Courier Schemes" badgeText="SCHEMES" badgeVariant="info" icon={Layers} />
      </div>

      {/* ZONE MASTER TABLE */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: 'var(--color-text-primary)' }}>
              Geographic Zone Groups Master Table
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Maps origin and destination states/UTs to pricing zone codes for linehaul calculation.
            </span>
          </div>
        </div>

        <Table<GeographicZoneMasterGroup>
          keyExtractor={(g) => g.code}
          columns={[
            {
              key: 'code',
              header: 'Zone Code',
              render: (g) => <Badge variant="brand"><strong style={{ fontFamily: 'var(--font-mono)' }}>{g.code}</strong></Badge>,
            },
            {
              key: 'name',
              header: 'Zone Description',
              render: (g) => <strong>{g.name}</strong>,
            },
            {
              key: 'states',
              header: 'Mapped States & Union Territories',
              render: (g) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {g.states.map((st) => (
                    <Badge key={st} variant="neutral" size="sm">
                      {st}
                    </Badge>
                  ))}
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (g) => <Badge variant="success">{g.status}</Badge>,
            },
            {
              key: 'actions',
              header: 'Actions',
              align: 'right',
              render: (g) => (
                <Button variant="outline" size="sm" leftIcon={<Edit2 size={12} />} onClick={() => handleOpenEdit(g)}>
                  Edit States
                </Button>
              ),
            },
          ]}
          data={zoneGroups}
        />
      </Card>

      {/* EDIT ZONE MAPPING MODAL */}
      {editingGroup && (
        <Modal isOpen={!!editingGroup} onClose={() => setEditingGroup(null)} title={`Edit Mapped States for Zone ${editingGroup.code}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Edit comma-separated states and union territories assigned to zone <strong>{editingGroup.code} ({editingGroup.name})</strong>.
            </p>

            <Input
              label="Mapped States (Comma separated) *"
              value={editStatesInput}
              onChange={(e) => setEditStatesInput(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <Button variant="ghost" onClick={() => setEditingGroup(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveEdit}>
                Save Zone Mapping
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
