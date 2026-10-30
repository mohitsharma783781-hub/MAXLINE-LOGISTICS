import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Copy,
  Users,
  Sliders,
  Edit2,
  Save,
  History,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Eye,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
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
import type { B2CRateCard, B2CWeightSlabConfig, B2CSurchargeRule } from '../../types/b2cPricing';
import { DEMO_B2C_RATE_CARDS } from '../../mocks/b2cPricing.mock';
import { DEMO_COURIER_PROVIDERS } from '../../mocks/couriers.mock';
import { CustomerRateAssignmentService } from '../../services/customerRateAssignmentService';

const B2C_CARDS_STORAGE_KEY = 'courrier_b2c_rate_cards_store_v2';

const getInitialB2cCards = (): B2CRateCard[] => {
  try {
    const saved = localStorage.getItem(B2C_CARDS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load B2C cards from localStorage:', e);
  }
  return DEMO_B2C_RATE_CARDS;
};

export const AdminSellingRatesPage: React.FC = () => {
  // B2C Rate Cards Store (With LocalStorage Persistence)
  const [b2cCards, setB2cCards] = useState<B2CRateCard[]>(getInitialB2cCards);
  const [selectedCardId, setSelectedCardId] = useState<string>(b2cCards[0]?.id || DEMO_B2C_RATE_CARDS[0].id);

  useEffect(() => {
    try {
      localStorage.setItem(B2C_CARDS_STORAGE_KEY, JSON.stringify(b2cCards));
    } catch (e) {
      console.error('Failed to save B2C cards to localStorage:', e);
    }
  }, [b2cCards]);

  // Active Selected Card for viewing or editing
  const activeRateCard = useMemo(() => {
    return b2cCards.find((c) => c.id === selectedCardId) || b2cCards[0] || DEMO_B2C_RATE_CARDS[0];
  }, [b2cCards, selectedCardId]);

  // View Mode: LIST | CREATE_B2C | EDIT_B2C | VIEW_B2C
  const [activeViewMode, setActiveViewMode] = useState<'LIST' | 'CREATE_B2C' | 'EDIT_B2C' | 'VIEW_B2C'>('LIST');

  // Form State for Create / Edit B2C Rate Card
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPartnerId, setFormPartnerId] = useState('delhivery');
  const [formServiceType, setFormServiceType] = useState<'Surface' | 'Air'>('Surface');
  const [formClientName, setFormClientName] = useState('Unassigned');
  const [formTenantId, setFormTenantId] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('PUBLISHED');
  const [formEffectiveFrom, setFormEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [formRemarks, setFormRemarks] = useState('');
  const [formIsDefault, setFormIsDefault] = useState<boolean>(false);
  const [formWeightDivider, setFormWeightDivider] = useState('5000');

  // Working Slabs & Charges state during creation/editing
  const [workingSlabs, setWorkingSlabs] = useState<B2CWeightSlabConfig[]>([]);
  const [workingSurcharges, setWorkingSurcharges] = useState<B2CSurchargeRule[]>([]);

  // Modals State
  const [isSlabModalOpen, setIsSlabModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditCellModalOpen, setIsEditCellModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);

  // New Slab Form Inputs
  const [newSlabWeight, setNewSlabWeight] = useState('0.5');
  const [newSlabLabel, setNewSlabLabel] = useState('500 GM');

  // Edit Cell Info State
  const [editCellInfo, setEditCellInfo] = useState<{ slabId: string; slabLabel: string; zoneCode: string; base: string; addl: string } | null>(null);

  // Edit Surcharge Rule Info State
  const [editChargeInfo, setEditChargeInfo] = useState<{ id: string; name: string; type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'PER_KG' | 'PER_SHIPMENT'; value: string; enabled: boolean } | null>(null);

  // Client Assignment State
  const [assignTargetCard, setAssignTargetCard] = useState<B2CRateCard | null>(null);
  const [assignClientTenantId, setAssignClientTenantId] = useState<string>('tenant-demo-01');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Default initial B2C weight slabs generator starting from 500 GM
  const getDefaultB2cSlabs = (): B2CWeightSlabConfig[] => [
    {
      id: 'slab-0.5',
      weightKg: 0.5,
      label: '500 GM',
      sequence: 1,
      ratesByZone: {
        ZONE_A: { baseRatePaise: 2700, additionalRatePaise: 2500 },
        ZONE_B: { baseRatePaise: 3000, additionalRatePaise: 2700 },
        ZONE_C1: { baseRatePaise: 3700, additionalRatePaise: 3500 },
        ZONE_C2: { baseRatePaise: 3700, additionalRatePaise: 3500 },
        ZONE_C3: { baseRatePaise: 4000, additionalRatePaise: 3700 },
        ZONE_D: { baseRatePaise: 4500, additionalRatePaise: 4200 },
        ZONE_E: { baseRatePaise: 5500, additionalRatePaise: 5000 },
      },
    },
    {
      id: 'slab-1.0',
      weightKg: 1.0,
      label: '1 KG',
      sequence: 2,
      ratesByZone: {
        ZONE_A: { baseRatePaise: 5000, additionalRatePaise: 4500 },
        ZONE_B: { baseRatePaise: 5500, additionalRatePaise: 5000 },
        ZONE_C1: { baseRatePaise: 7000, additionalRatePaise: 6500 },
        ZONE_C2: { baseRatePaise: 7000, additionalRatePaise: 6500 },
        ZONE_C3: { baseRatePaise: 7500, additionalRatePaise: 7000 },
        ZONE_D: { baseRatePaise: 8500, additionalRatePaise: 8000 },
        ZONE_E: { baseRatePaise: 10000, additionalRatePaise: 9500 },
      },
    },
    {
      id: 'slab-2.0',
      weightKg: 2.0,
      label: '2 KG',
      sequence: 3,
      ratesByZone: {
        ZONE_A: { baseRatePaise: 9000, additionalRatePaise: 8000 },
        ZONE_B: { baseRatePaise: 10000, additionalRatePaise: 9000 },
        ZONE_C1: { baseRatePaise: 13000, additionalRatePaise: 12000 },
        ZONE_C2: { baseRatePaise: 13000, additionalRatePaise: 12000 },
        ZONE_C3: { baseRatePaise: 14000, additionalRatePaise: 13000 },
        ZONE_D: { baseRatePaise: 16000, additionalRatePaise: 15000 },
        ZONE_E: { baseRatePaise: 19000, additionalRatePaise: 18000 },
      },
    },
    {
      id: 'slab-3.0',
      weightKg: 3.0,
      label: '3 KG',
      sequence: 4,
      ratesByZone: {
        ZONE_A: { baseRatePaise: 13000, additionalRatePaise: 11000 },
        ZONE_B: { baseRatePaise: 14500, additionalRatePaise: 12500 },
        ZONE_C1: { baseRatePaise: 18500, additionalRatePaise: 16500 },
        ZONE_C2: { baseRatePaise: 18500, additionalRatePaise: 16500 },
        ZONE_C3: { baseRatePaise: 20000, additionalRatePaise: 18000 },
        ZONE_D: { baseRatePaise: 23000, additionalRatePaise: 21000 },
        ZONE_E: { baseRatePaise: 27000, additionalRatePaise: 25000 },
      },
    },
    {
      id: 'slab-5.0',
      weightKg: 5.0,
      label: '5 KG',
      sequence: 5,
      ratesByZone: {
        ZONE_A: { baseRatePaise: 21000, additionalRatePaise: 18000 },
        ZONE_B: { baseRatePaise: 23500, additionalRatePaise: 20000 },
        ZONE_C1: { baseRatePaise: 29500, additionalRatePaise: 26000 },
        ZONE_C2: { baseRatePaise: 29500, additionalRatePaise: 26000 },
        ZONE_C3: { baseRatePaise: 32000, additionalRatePaise: 28000 },
        ZONE_D: { baseRatePaise: 37000, additionalRatePaise: 33000 },
        ZONE_E: { baseRatePaise: 43000, additionalRatePaise: 39000 },
      },
    },
  ];

  const getDefaultB2cSurcharges = (): B2CSurchargeRule[] => [
    { id: 'sur-1', code: 'FUEL', name: 'Fuel Surcharge', type: 'PERCENTAGE', value: 12, enabled: true },
    { id: 'sur-2', code: 'COD', name: 'COD Fixed Charge', type: 'FIXED_AMOUNT', value: 3000, minPaise: 3000, enabled: true },
    { id: 'sur-3', code: 'ROV', name: 'ROV Owner Charge', type: 'PERCENTAGE', value: 0.2, enabled: true },
    { id: 'sur-4', code: 'HANDLING', name: 'Handling Charge', type: 'FIXED_AMOUNT', value: 1000, enabled: true },
    { id: 'sur-5', code: 'ODA', name: 'Remote ODA Charge', type: 'FIXED_AMOUNT', value: 7500, enabled: true },
    { id: 'sur-6', code: 'INSURANCE', name: 'Insurance Charge', type: 'FIXED_AMOUNT', value: 2000, enabled: true },
    { id: 'sur-7', code: 'DOCKET', name: 'Docket Charge', type: 'FIXED_AMOUNT', value: 500, enabled: true },
  ];

  // Open Create B2C Rate Card Form
  const handleOpenCreateB2c = () => {
    setEditingCardId(null);
    setFormName('');
    setFormPartnerId('delhivery');
    setFormServiceType('Surface');
    setFormClientName('Unassigned');
    setFormTenantId('');
    setFormStatus('PUBLISHED');
    setFormEffectiveFrom(new Date().toISOString().split('T')[0]);
    setFormRemarks('');
    setFormIsDefault(false);
    setFormWeightDivider('5000');
    setWorkingSlabs(getDefaultB2cSlabs());
    setWorkingSurcharges(getDefaultB2cSurcharges());
    setActiveViewMode('CREATE_B2C');
  };

  // Open Edit Form for B2C Card
  const handleOpenEditB2c = (card: B2CRateCard) => {
    setEditingCardId(card.id);
    setSelectedCardId(card.id);
    setFormName(card.name);
    setFormPartnerId(card.courierId);
    setFormServiceType(card.serviceType || 'Surface');
    setFormClientName((card as any).clientName || (card.assignedTenantIds?.length > 0 ? 'Assigned Client' : 'Unassigned'));
    setFormTenantId(card.assignedTenantIds?.[0] || '');
    setFormStatus(card.status || 'PUBLISHED');
    setFormEffectiveFrom(card.updatedAt || new Date().toISOString().split('T')[0]);
    setFormRemarks((card as any).remarks || '');
    setFormIsDefault(!!(card as any).isDefault);
    setFormWeightDivider(card.volumetricDivisor?.toString() || '5000');
    setWorkingSlabs(card.weightSlabs && card.weightSlabs.length > 0 ? card.weightSlabs : getDefaultB2cSlabs());
    setWorkingSurcharges(card.surcharges && card.surcharges.length > 0 ? card.surcharges : getDefaultB2cSurcharges());
    setActiveViewMode('EDIT_B2C');
  };

  // Open View Mode for B2C Card
  const handleOpenViewB2c = (card: B2CRateCard) => {
    setSelectedCardId(card.id);
    setActiveViewMode('VIEW_B2C');
  };

  // Save B2C Rate Card Handler (Creates or Updates with Versioning v1.0 -> v1.1)
  const handleSaveB2cCardSubmit = (saveAsStatus?: 'DRAFT' | 'PUBLISHED') => {
    if (!formName.trim()) {
      triggerNotification('Please enter a Rate Card Name.');
      return;
    }

    const courierObj = DEMO_COURIER_PROVIDERS.find((c) => c.id === formPartnerId) || DEMO_COURIER_PROVIDERS[0];
    const targetStatus = saveAsStatus || formStatus;
    const isEdit = !!editingCardId;
    const existingCard = b2cCards.find((c) => c.id === editingCardId);

    let nextVersion = 'v1.0';
    let historyList = existingCard?.versions || [];

    if (existingCard) {
      const parts = existingCard.version.replace('v', '').split('.');
      const major = parseInt(parts[0]) || 1;
      const minor = parseInt(parts[1]) || 0;
      nextVersion = `v${major}.${minor + 1}`;

      const historyEntry = {
        version: nextVersion,
        updatedBy: 'Super Admin',
        updatedAt: new Date().toLocaleString(),
        changelog: `Saved Version ${nextVersion}. Updated rate matrix and surcharge rules.`,
      };
      historyList = [historyEntry, ...historyList];
    } else {
      historyList = [
        {
          version: 'v1.0',
          updatedBy: 'Super Admin',
          updatedAt: new Date().toLocaleString(),
          changelog: 'Created initial Version 1.0 of B2C Rate Card.',
        },
      ];
    }

    const cardId = editingCardId || `b2c-card-${Date.now()}`;
    const newCard: B2CRateCard = {
      id: cardId,
      name: formName.trim(),
      code: `B2C_${cardId.toUpperCase().slice(-8)}`,
      courierId: courierObj.id,
      courierName: courierObj.name,
      serviceId: `${courierObj.id}-${formServiceType.toLowerCase()}`,
      serviceName: `${courierObj.name} ${formServiceType}`,
      serviceType: formServiceType,
      version: nextVersion,
      status: targetStatus,
      isCustomerSellingCard: true,
      assignedTenantIds: formTenantId ? [formTenantId] : existingCard?.assignedTenantIds || [],
      baseWeightGrams: 500,
      additionalWeightGrams: 500,
      volumetricDivisor: parseFloat(formWeightDivider) || 5000,
      weightSlabs: workingSlabs,
      zoneRates: existingCard?.zoneRates || [],
      surcharges: workingSurcharges,
      codConfig: existingCard?.codConfig || { calcType: 'FIXED', value: 3000, minAmountPaise: 3000 },
      fuelSurchargePercent: parseFloat(workingSurcharges.find((s) => s.code === 'FUEL')?.value?.toString() || '12'),
      odaSurchargePaise: (workingSurcharges.find((s) => s.code === 'ODA')?.value || 7500),
      handlingChargePaise: (workingSurcharges.find((s) => s.code === 'HANDLING')?.value || 1000),
      versions: historyList,
      publishedAt: new Date().toISOString().split('T')[0],
      createdAt: existingCard?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      ...(formClientName !== 'Unassigned' ? { clientName: formClientName } : {}),
      ...(formRemarks ? { remarks: formRemarks } : {}),
      isDefault: formIsDefault,
    } as any;

    if (formTenantId) {
      CustomerRateAssignmentService.assignRateCard({
        tenantId: formTenantId,
        tenantName: formClientName,
        mode: 'B2C',
        courierId: courierObj.id,
        courierName: courierObj.name,
        serviceId: `${courierObj.id}-${formServiceType.toLowerCase()}`,
        serviceName: `${courierObj.name} ${formServiceType}`,
        rateCardId: cardId,
        rateCardName: formName.trim(),
        rateCardVersion: nextVersion,
        isDefault: formIsDefault,
        effectiveFrom: formEffectiveFrom,
      });
    }

    if (isEdit) {
      setB2cCards((prev) => prev.map((c) => (c.id === cardId ? newCard : c)));
      triggerNotification(`Updated B2C Rate Card "${newCard.name}" (${newCard.version}).`);
    } else {
      setB2cCards((prev) => [newCard, ...prev]);
      triggerNotification(`Saved B2C Rate Card "${newCard.name}" (${newCard.version}) successfully.`);
    }

    setSelectedCardId(cardId);
    setActiveViewMode('LIST');
  };

  // Add Weight Slab Handler
  const handleAddSlabSubmit = () => {
    const w = parseFloat(newSlabWeight) || 0.5;
    const slabId = `slab-${Date.now()}`;
    const labelText = newSlabLabel.trim() || (w < 1 ? `${Math.round(w * 1000)} GM` : `${w} KG`);

    const newSlab: B2CWeightSlabConfig = {
      id: slabId,
      weightKg: w,
      label: labelText,
      sequence: workingSlabs.length + 1,
      ratesByZone: {
        ZONE_A: { baseRatePaise: Math.round(w * 5000), additionalRatePaise: Math.round(w * 4000) },
        ZONE_B: { baseRatePaise: Math.round(w * 5500), additionalRatePaise: Math.round(w * 4500) },
        ZONE_C1: { baseRatePaise: Math.round(w * 7000), additionalRatePaise: Math.round(w * 6000) },
        ZONE_C2: { baseRatePaise: Math.round(w * 7000), additionalRatePaise: Math.round(w * 6000) },
        ZONE_C3: { baseRatePaise: Math.round(w * 7500), additionalRatePaise: Math.round(w * 6500) },
        ZONE_D: { baseRatePaise: Math.round(w * 8500), additionalRatePaise: Math.round(w * 7500) },
        ZONE_E: { baseRatePaise: Math.round(w * 10000), additionalRatePaise: Math.round(w * 8500) },
      },
    };

    setWorkingSlabs((prev) => [...prev, newSlab]);
    setIsSlabModalOpen(false);
    triggerNotification(`Added weight slab "${labelText}".`);
  };

  // Remove Weight Slab Handler
  const handleRemoveSlab = (slabId: string) => {
    setWorkingSlabs((prev) => prev.filter((s) => s.id !== slabId));
    triggerNotification('Removed weight slab.');
  };

  // Save Cell Rate Handler
  const handleSaveCellRate = () => {
    if (!editCellInfo) return;
    const basePaise = Math.round((parseFloat(editCellInfo.base) || 0) * 100);
    const addlPaise = Math.round((parseFloat(editCellInfo.addl) || 0) * 100);

    setWorkingSlabs((prevSlabs) =>
      prevSlabs.map((s) => {
        if (s.id === editCellInfo.slabId) {
          return {
            ...s,
            ratesByZone: {
              ...s.ratesByZone,
              [editCellInfo.zoneCode]: { baseRatePaise: basePaise, additionalRatePaise: addlPaise },
            },
          };
        }
        return s;
      })
    );

    setIsEditCellModalOpen(false);
    triggerNotification(`Updated rate cell for ${editCellInfo.slabLabel} in ${editCellInfo.zoneCode}.`);
  };

  // Save Edit Charge Rule Handler
  const handleSaveChargeRule = () => {
    if (!editChargeInfo) return;
    const valNum = parseFloat(editChargeInfo.value) || 0;
    const finalVal = editChargeInfo.type === 'PERCENTAGE' ? valNum : Math.round(valNum * 100);

    setWorkingSurcharges((prevRules) =>
      prevRules.map((r) =>
        r.id === editChargeInfo.id
          ? { ...r, type: editChargeInfo.type, value: finalVal, enabled: editChargeInfo.enabled }
          : r
      )
    );

    setIsChargeModalOpen(false);
    triggerNotification(`Updated ${editChargeInfo.name} surcharge rule.`);
  };

  // Duplicate B2C Rate Card Handler
  const handleDuplicateB2cCard = (card: B2CRateCard) => {
    const newId = `b2c-card-dup-${Date.now()}`;
    const newName = `${card.name} (Copy)`;

    const dupCard: B2CRateCard = {
      ...card,
      id: newId,
      name: newName,
      code: `B2C_${newId.toUpperCase().slice(-8)}`,
      status: 'DRAFT',
      version: 'v1.0',
      updatedAt: new Date().toISOString().split('T')[0],
      versions: [
        {
          version: 'v1.0',
          updatedBy: 'Super Admin',
          updatedAt: new Date().toLocaleString(),
          changelog: `Duplicated from ${card.name}.`,
        },
      ],
    };

    setB2cCards((prev) => [dupCard, ...prev]);
    setSelectedCardId(newId);
    triggerNotification(`Duplicated B2C Rate Card as "${newName}".`);
  };

  // Open Client Assignment Modal
  const handleOpenAssignModal = (card: B2CRateCard) => {
    setAssignTargetCard(card);
    setIsAssignModalOpen(true);
  };

  // Confirm Client Assignment Handler
  const handleConfirmAssignClient = () => {
    if (!assignTargetCard) return;
    const tenantName =
      assignClientTenantId === 'tenant-demo-01'
        ? 'ABC Traders'
        : assignClientTenantId === 'tenant-acme-02'
        ? 'XYZ Retail'
        : 'Nexus Tech B2B';

    CustomerRateAssignmentService.assignRateCard({
      tenantId: assignClientTenantId,
      tenantName: tenantName,
      mode: 'B2C',
      courierId: assignTargetCard.courierId,
      courierName: assignTargetCard.courierName,
      serviceId: assignTargetCard.serviceId,
      serviceName: assignTargetCard.serviceName,
      rateCardId: assignTargetCard.id,
      rateCardName: assignTargetCard.name,
      rateCardVersion: assignTargetCard.version,
      isDefault: true,
      effectiveFrom: new Date().toISOString().split('T')[0],
    });

    setB2cCards((prev) =>
      prev.map((c) =>
        c.id === assignTargetCard.id
          ? {
              ...c,
              assignedTenantIds: Array.from(new Set([...(c.assignedTenantIds || []), assignClientTenantId])),
              clientName: tenantName,
            }
          : c
      )
    );

    setIsAssignModalOpen(false);
    triggerNotification(`Assigned ${assignTargetCard.name} to ${tenantName}.`);
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Rate Cards', path: '/admin/selling-rates' },
    { label: 'B2C Rate Cards', path: '/admin/selling-rates' },
  ];

  const zoneHeaders = [
    { code: 'ZONE_A', label: 'Zone A (Within City)' },
    { code: 'ZONE_B', label: 'Zone B (Within State)' },
    { code: 'ZONE_C1', label: 'Zone C1 (Metro-Metro)' },
    { code: 'ZONE_C2', label: 'Zone C2 (Metro to Rest)' },
    { code: 'ZONE_C3', label: 'Zone C3 (Rest of India)' },
    { code: 'ZONE_D', label: 'Zone D (Remote/Special)' },
    { code: 'ZONE_E', label: 'Zone E (NE & JK)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* PAGE HEADER */}
      <PageHeader
        title="B2C Rate Cards"
        description="Create, manage, edit and assign courier-wise B2C pricing, 500 GM+ weight slabs, zone rates, and surcharges to clients."
        breadcrumbs={breadcrumbs}
        actions={
          activeViewMode === 'LIST' ? (
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={handleOpenCreateB2c}>
              + Create B2C Rate Card
            </Button>
          ) : (
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => setActiveViewMode('LIST')}>
              Back to B2C Rate Cards
            </Button>
          )
        }
      />

      {toastMessage && (
        <Alert variant="success" title="B2C Rate Cards System">
          {toastMessage}
        </Alert>
      )}

      {/* VIEW MODE SWITCHING */}
      {activeViewMode === 'LIST' && (
        <Card style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: 'var(--color-text-primary)' }}>
              B2C Rate Cards List
            </h3>
            <Badge variant="success">B2C MODULE ACTIVE</Badge>
          </div>

          <Table<B2CRateCard>
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
              { key: 'courierName', header: 'Courier Partner', render: (c) => <strong>{c.courierName}</strong> },
              { key: 'serviceName', header: 'Service Mode', render: (c) => <span>{c.serviceName}</span> },
              { key: 'version', header: 'Version', render: (c) => <Badge variant="neutral"><strong>{c.version}</strong></Badge> },
              {
                key: 'status',
                header: 'Status',
                render: (c) => <Badge variant={c.status === 'PUBLISHED' ? 'success' : 'warning'}>{c.status}</Badge>,
              },
              {
                key: 'effectiveFrom',
                header: 'Effective From',
                render: (c) => <span style={{ fontSize: '12px' }}>{c.updatedAt || c.publishedAt}</span>,
              },
              {
                key: 'assignedTenantIds',
                header: 'Assigned Clients',
                render: (c) => (
                  <Badge variant={c.assignedTenantIds && c.assignedTenantIds.length > 0 ? 'brand' : 'neutral'}>
                    <Users size={12} style={{ marginRight: '4px' }} />
                    {c.assignedTenantIds && c.assignedTenantIds.length > 0 ? `${c.assignedTenantIds.length} Merchant(s)` : 'Unassigned'}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                align: 'right',
                render: (c) => (
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                    <Button variant="outline" size="sm" onClick={() => handleOpenViewB2c(c)}>
                      <Eye size={12} style={{ marginRight: '2px' }} /> View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenEditB2c(c)}>
                      <Edit2 size={12} style={{ marginRight: '2px' }} /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDuplicateB2cCard(c)}>
                      <Copy size={12} style={{ marginRight: '2px' }} /> Duplicate
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handleOpenAssignModal(c)}>
                      <Users size={12} style={{ marginRight: '2px' }} /> Assign
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedCardId(c.id); setIsHistoryModalOpen(true); }}>
                      <History size={12} style={{ marginRight: '2px' }} /> History
                    </Button>
                  </div>
                ),
              },
            ]}
            data={b2cCards}
          />
        </Card>
      )}

      {/* VIEW B2C SUMMARY MODE */}
      {activeViewMode === 'VIEW_B2C' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--color-violet-main)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={20} style={{ color: 'var(--color-violet-main)' }} />
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{activeRateCard.name}</h2>
                  <Badge variant="brand">B2C RATE CARD SUMMARY</Badge>
                  <Badge variant="neutral">{activeRateCard.version}</Badge>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Courier: <strong>{activeRateCard.courierName}</strong> • Service: <strong>{activeRateCard.serviceName}</strong> • Volumetric Divider: <strong>{activeRateCard.volumetricDivisor}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" size="sm" leftIcon={<Edit2 size={14} />} onClick={() => handleOpenEditB2c(activeRateCard)}>
                  Edit Rate Card
                </Button>
                <Button variant="outline" size="sm" leftIcon={<Copy size={14} />} onClick={() => handleDuplicateB2cCard(activeRateCard)}>
                  Duplicate
                </Button>
                <Button variant="primary" size="sm" leftIcon={<Users size={14} />} onClick={() => handleOpenAssignModal(activeRateCard)}>
                  Assign Rate Card
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setActiveViewMode('LIST')}>
                  Back to List
                </Button>
              </div>
            </div>
          </Card>

          {/* VIEW SLABS & MATRIX */}
          <Card style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>
              B2C Weight Slabs & Zone Matrix (Starts 500 GM)
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 'bold' }}>Weight Slab</th>
                    {zoneHeaders.map((z) => (
                      <th key={z.code} style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 'bold' }}>
                        {z.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(activeRateCard.weightSlabs || []).map((slab) => (
                    <tr key={slab.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--color-violet-main)' }}>
                        {slab.label}
                      </td>
                      {zoneHeaders.map((z) => {
                        const r = slab.ratesByZone[z.code] || { baseRatePaise: 2700, additionalRatePaise: 2500 };
                        const baseINR = (r.baseRatePaise / 100).toFixed(0);
                        const addlINR = (r.additionalRatePaise / 100).toFixed(0);
                        return (
                          <td key={z.code} style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <strong style={{ color: 'var(--color-text-primary)' }}>₹{baseINR}</strong> / <span style={{ color: 'var(--color-text-muted)' }}>₹{addlINR}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* CREATE OR EDIT B2C FORM SCREEN */}
      {(activeViewMode === 'CREATE_B2C' || activeViewMode === 'EDIT_B2C') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* EDITOR HEADER */}
          <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--color-violet-main)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                  {activeViewMode === 'CREATE_B2C' ? 'Create B2C Rate Card' : `Edit B2C Rate Card — ${formName}`}
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Continuous B2C form: Basic details, 500 GM+ weight slabs, zonal base/additional rates, weight divider (5000), and surcharges.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="ghost" onClick={() => setActiveViewMode('LIST')}>
                  Cancel
                </Button>
                <Button variant="outline" leftIcon={<Save size={14} />} onClick={() => handleSaveB2cCardSubmit('DRAFT')}>
                  Save as Draft
                </Button>
                <Button variant="primary" leftIcon={<CheckCircle2 size={14} />} onClick={() => handleSaveB2cCardSubmit('PUBLISHED')}>
                  Save & Publish
                </Button>
              </div>
            </div>
          </Card>

          {/* SECTION A — BASIC INFORMATION */}
          <Card style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
              SECTION A — Basic Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
              <Input label="Rate Card Name *" placeholder="e.g. ABC Retail - Delhivery B2C" value={formName} onChange={(e) => setFormName(e.target.value)} />
              <Select
                label="Courier Partner *"
                value={formPartnerId}
                onChange={(e) => setFormPartnerId(e.target.value)}
                options={DEMO_COURIER_PROVIDERS.map((c) => ({ value: c.id, label: c.name }))}
              />
              <Select
                label="Service Type *"
                value={formServiceType}
                onChange={(e) => setFormServiceType(e.target.value as any)}
                options={[
                  { value: 'Surface', label: 'Surface Cargo' },
                  { value: 'Air', label: 'Express Air' },
                ]}
              />
              <Select
                label="Status *"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                options={[
                  { value: 'PUBLISHED', label: 'Published / Active' },
                  { value: 'DRAFT', label: 'Draft Mode' },
                  { value: 'ARCHIVED', label: 'Archived / Inactive' },
                ]}
              />
              <Input label="Effective From *" type="date" value={formEffectiveFrom} onChange={(e) => setFormEffectiveFrom(e.target.value)} />
              <Input label="Volumetric Weight Divider *" type="number" value={formWeightDivider} onChange={(e) => setFormWeightDivider(e.target.value)} />
            </div>

            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input label="Remarks / Internal Notes (Optional)" placeholder="Custom B2C negotiated rates for ABC Retail merchant" value={formRemarks} onChange={(e) => setFormRemarks(e.target.value)} />
              <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                <input type="checkbox" checked={formIsDefault} onChange={(e) => setFormIsDefault(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                Set as Default B2C Rate Card for assigned client
              </label>
            </div>
          </Card>

          {/* SECTION B — WEIGHT SLABS (Starts 500 GM) */}
          <Card style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: 'var(--color-text-primary)' }}>
                  SECTION B — B2C Weight Slabs (Starts 500 GM)
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Add, edit, or remove weight slabs for this rate card.
                </span>
              </div>
              <Button variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsSlabModalOpen(true)}>
                + Add Weight Slab
              </Button>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {workingSlabs.map((slab) => (
                <div
                  key={slab.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-default)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface-secondary)',
                  }}
                >
                  <strong style={{ fontSize: '13px', color: 'var(--color-violet-main)' }}>{slab.label}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>({slab.weightKg} KG)</span>
                  <button
                    onClick={() => handleRemoveSlab(slab.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 0, display: 'flex' }}
                    title="Remove Weight Slab"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* SECTION C — ZONE-WISE B2C RATE MATRIX */}
          <Card style={{ padding: 'var(--space-4)' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: 'var(--color-text-primary)' }}>
                SECTION C — Zone-Wise Rate Matrix (Click cell to edit rates)
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Displays Main (Base Rate ₹) / Additional Rate ₹ per slab and zone. Click any cell to update rates directly.
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 'bold' }}>Weight Slab</th>
                    {zoneHeaders.map((z) => (
                      <th key={z.code} style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 'bold' }}>
                        {z.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workingSlabs.map((slab) => (
                    <tr key={slab.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--color-violet-main)' }}>
                        {slab.label}
                      </td>

                      {zoneHeaders.map((z) => {
                        const r = slab.ratesByZone[z.code] || { baseRatePaise: 2700, additionalRatePaise: 2500 };
                        const baseINR = (r.baseRatePaise / 100).toFixed(0);
                        const addlINR = (r.additionalRatePaise / 100).toFixed(0);

                        return (
                          <td
                            key={z.code}
                            onClick={() => {
                              setEditCellInfo({
                                slabId: slab.id,
                                slabLabel: slab.label,
                                zoneCode: z.code,
                                base: baseINR,
                                addl: addlINR,
                              });
                              setIsEditCellModalOpen(true);
                            }}
                            style={{
                              padding: '8px 10px',
                              textAlign: 'center',
                              cursor: 'pointer',
                              backgroundColor: 'var(--color-surface)',
                            }}
                          >
                            <div
                              style={{
                                display: 'inline-flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid var(--color-border)',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <strong style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                                ₹{baseINR} <span style={{ color: 'var(--color-text-muted)', fontWeight: 'normal' }}>/</span> ₹{addlINR}
                              </strong>
                              <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>Main / Addl</span>
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

          {/* SECTION D — APPLICABLE B2C SURCHARGES */}
          <Card style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
              SECTION D — Applicable B2C Surcharges & Fees
            </h3>

            <Table<B2CSurchargeRule>
              columns={[
                { key: 'code', header: 'Charge Code', render: (r) => <Badge variant="neutral"><strong>{r.code}</strong></Badge> },
                { key: 'name', header: 'Charge Name', render: (r) => <strong>{r.name}</strong> },
                { key: 'type', header: 'Calculation Type', render: (r) => <Badge variant="info">{r.type}</Badge> },
                { key: 'value', header: 'Value', render: (r) => <strong>{r.type === 'PERCENTAGE' ? `${r.value}%` : `₹${(r.value / 100).toFixed(2)}`}</strong> },
                { key: 'enabled', header: 'Status', render: (r) => <Badge variant={r.enabled ? 'success' : 'danger'}>{r.enabled ? 'Active' : 'Disabled'}</Badge> },
                {
                  key: 'actions',
                  header: 'Actions',
                  align: 'right',
                  render: (r) => (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditChargeInfo({
                          id: r.id,
                          name: r.name,
                          type: r.type,
                          value: r.type === 'PERCENTAGE' ? r.value.toString() : (r.value / 100).toString(),
                          enabled: r.enabled,
                        });
                        setIsChargeModalOpen(true);
                      }}
                    >
                      <Edit2 size={12} style={{ marginRight: '2px' }} /> Edit Charge
                    </Button>
                  ),
                },
              ]}
              data={workingSurcharges}
              keyExtractor={(r) => r.id}
            />
          </Card>

          {/* BOTTOM ACTIONS */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button variant="ghost" onClick={() => setActiveViewMode('LIST')}>
              Cancel
            </Button>
            <Button variant="outline" leftIcon={<Save size={16} />} onClick={() => handleSaveB2cCardSubmit('DRAFT')}>
              Save as Draft
            </Button>
            <Button variant="primary" size="lg" leftIcon={<CheckCircle2 size={16} />} onClick={() => handleSaveB2cCardSubmit('PUBLISHED')}>
              Save & Publish B2C Rate Card
            </Button>
          </div>
        </div>
      )}

      {/* MODAL: ADD WEIGHT SLAB */}
      {isSlabModalOpen && (
        <Modal isOpen={isSlabModalOpen} onClose={() => setIsSlabModalOpen(false)} title="Add Weight Slab (Starts 500 GM)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input
              label="Weight Value (KG) *"
              type="number"
              step="0.1"
              value={newSlabWeight}
              onChange={(e) => {
                setNewSlabWeight(e.target.value);
                const w = parseFloat(e.target.value) || 0.5;
                setNewSlabLabel(w < 1 ? `${Math.round(w * 1000)} GM` : `${w} KG`);
              }}
            />
            <Input label="Slab Label *" value={newSlabLabel} onChange={(e) => setNewSlabLabel(e.target.value)} />
            <Button variant="primary" onClick={handleAddSlabSubmit}>
              Add Weight Slab
            </Button>
          </div>
        </Modal>
      )}

      {/* MODAL: EDIT MATRIX CELL RATE */}
      {isEditCellModalOpen && editCellInfo && (
        <Modal isOpen={isEditCellModalOpen} onClose={() => setIsEditCellModalOpen(false)} title={`Edit Rates: ${editCellInfo.slabLabel} in ${editCellInfo.zoneCode}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Main (Base) Rate (₹) *" type="number" value={editCellInfo.base} onChange={(e) => setEditCellInfo({ ...editCellInfo, base: e.target.value })} />
            <Input label="Additional Rate (₹) *" type="number" value={editCellInfo.addl} onChange={(e) => setEditCellInfo({ ...editCellInfo, addl: e.target.value })} />
            <Button variant="primary" onClick={handleSaveCellRate}>
              Save Rate Cell
            </Button>
          </div>
        </Modal>
      )}

      {/* MODAL: EDIT SURCHARGE RULE */}
      {isChargeModalOpen && editChargeInfo && (
        <Modal isOpen={isChargeModalOpen} onClose={() => setIsChargeModalOpen(false)} title={`Edit Charge Rule — ${editChargeInfo.name}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Select
              label="Calculation Type *"
              value={editChargeInfo.type}
              onChange={(e) => setEditChargeInfo({ ...editChargeInfo, type: e.target.value as any })}
              options={[
                { value: 'FIXED_AMOUNT', label: 'Fixed Amount (₹)' },
                { value: 'PERCENTAGE', label: 'Percentage (%)' },
                { value: 'PER_KG', label: 'Per KG (₹)' },
                { value: 'PER_SHIPMENT', label: 'Per Shipment (₹)' },
              ]}
            />
            <Input
              label={editChargeInfo.type === 'PERCENTAGE' ? 'Value (%) *' : 'Value (₹) *'}
              type="number"
              step="0.01"
              value={editChargeInfo.value}
              onChange={(e) => setEditChargeInfo({ ...editChargeInfo, value: e.target.value })}
            />
            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editChargeInfo.enabled}
                onChange={(e) => setEditChargeInfo({ ...editChargeInfo, enabled: e.target.checked })}
              />
              Enable Surcharge Rule
            </label>
            <Button variant="primary" onClick={handleSaveChargeRule}>
              Save Surcharge Rule
            </Button>
          </div>
        </Modal>
      )}

      {/* MODAL: B2C RATE HISTORY & AUDIT LOG */}
      {isHistoryModalOpen && (
        <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`B2C Rate Version History — ${activeRateCard.name}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Alert variant="info" title="B2C Version Audit Log">
              Complete history of all published and archived versions for {activeRateCard.name}.
            </Alert>
            {(activeRateCard.versions || []).map((v, i) => (
              <div key={i} style={{ padding: '10px', borderRadius: 'var(--radius-default)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>Version {v.version}</span>
                  <Badge variant={i === 0 ? 'success' : 'neutral'}>{i === 0 ? 'Active Version' : 'Archived'}</Badge>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Updated By: <strong>{v.updatedBy}</strong> • Date: <strong>{v.updatedAt}</strong>
                </div>
                <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--color-text-primary)' }}>
                  {v.changelog}
                </div>
              </div>
            ))}
            <Button variant="ghost" onClick={() => setIsHistoryModalOpen(false)}>
              Close History
            </Button>
          </div>
        </Modal>
      )}

      {/* MODAL: ASSIGN B2C RATE CARD TO CLIENT */}
      {isAssignModalOpen && assignTargetCard && (
        <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={`Assign B2C Rate Card — ${assignTargetCard.name}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Assign <strong>{assignTargetCard.name} ({assignTargetCard.version})</strong> to a client merchant tenant.
            </p>

            <Select
              label="Select Client (Merchant Tenant) *"
              value={assignClientTenantId}
              onChange={(e) => setAssignClientTenantId(e.target.value)}
              options={[
                { value: 'tenant-demo-01', label: 'ABC Traders (tenant-demo-01)' },
                { value: 'tenant-acme-02', label: 'XYZ Retail (tenant-acme-02)' },
                { value: 'tenant-vip-03', label: 'Nexus Tech B2B (tenant-vip-03)' },
              ]}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmAssignClient}>
                Assign Rate Card
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
