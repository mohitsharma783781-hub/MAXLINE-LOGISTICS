import React, { useState, useEffect } from 'react';
import {
  Building2,
  PlusCircle,
  MapPin,
  Phone,
  Clock,
  Edit2,
  Star,
  Package,
  ShieldCheck,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Modal,
  Alert,
  Input,
  Checkbox,
} from '../../components/ui';
import {
  CustomerWarehouseService,
  lookupPincodeDetails,
  type CustomerWarehouse,
} from '../../services/customerWarehouseService';
import { PincodeService } from '../../services/pincodeService';
import { useTenant } from '../../context/TenantContext';

export const WarehousesPage: React.FC = () => {
  const { activeTenantId } = useTenant();
  const tenantId =
    activeTenantId ||
    (typeof window !== 'undefined' && window.localStorage
      ? localStorage.getItem('courrier3_active_tenant_id') || ''
      : '');

  const [warehouses, setWarehouses] = useState<CustomerWarehouse[]>(() =>
    CustomerWarehouseService.getWarehouses(tenantId)
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<CustomerWarehouse | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress1, setFormAddress1] = useState('');
  const [formAddress2, setFormAddress2] = useState('');
  const [formLandmark, setFormLandmark] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formStartTime, setFormStartTime] = useState('10:00 AM');
  const [formEndTime, setFormEndTime] = useState('06:00 PM');
  const [formIsDefault, setFormIsDefault] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Automatically sync with Supabase Cloud DB on mount
  useEffect(() => {
    if (!tenantId) {
      setWarehouses([]);
      return;
    }

    CustomerWarehouseService.syncFromSupabase(tenantId)
      .then((cloudList) => {
        setWarehouses([...cloudList]);
      })
      .catch(() => {
        setWarehouses(CustomerWarehouseService.getWarehouses(tenantId));
      });
  }, [tenantId]);

  const refreshData = () => {
    if (!tenantId) {
      setWarehouses([]);
      return;
    }
    CustomerWarehouseService.syncFromSupabase(tenantId)
      .then((cloudList) => {
        setWarehouses([...cloudList]);
      })
      .catch(() => {
        setWarehouses([...CustomerWarehouseService.getWarehouses(tenantId)]);
      });
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingWarehouse(null);
    setFormName('');
    setFormContact('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress1('');
    setFormAddress2('');
    setFormLandmark('');
    setFormPincode('');
    setFormCity('');
    setFormState('');
    setFormStartTime('10:00 AM');
    setFormEndTime('06:00 PM');
    setFormIsDefault(warehouses.length === 0);
    setDuplicateWarning(null);
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (wh: CustomerWarehouse) => {
    setEditingWarehouse(wh);
    setFormName(wh.warehouseName);
    setFormContact(wh.contactPerson);
    setFormPhone(wh.phone);
    setFormEmail(wh.email || '');
    setFormAddress1(wh.addressLine1);
    setFormAddress2(wh.addressLine2 || '');
    setFormLandmark(wh.landmark || '');
    setFormPincode(wh.pincode);
    setFormCity(wh.city);
    setFormState(wh.state);
    setFormStartTime(wh.pickupStartTime);
    setFormEndTime(wh.pickupEndTime);
    setFormIsDefault(wh.isDefault);
    setDuplicateWarning(null);
    setIsAddEditModalOpen(true);
  };

  // Pincode Auto-population
  const handlePincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setFormPincode(clean);
    if (clean.length === 6) {
      try {
        const lookup = await PincodeService.lookup(clean);
        if (lookup.success) {
          if (lookup.city) setFormCity(lookup.city);
          if (lookup.state) setFormState(lookup.state);
        } else {
          const fallback = lookupPincodeDetails(clean);
          if (fallback.city) setFormCity(fallback.city);
          if (fallback.state) setFormState(fallback.state);
        }
      } catch {
        const fallback = lookupPincodeDetails(clean);
        if (fallback.city) setFormCity(fallback.city);
        if (fallback.state) setFormState(fallback.state);
      }

      // Check duplicate
      if (!editingWarehouse && CustomerWarehouseService.checkDuplicateWarehouse(tenantId, clean, formAddress1)) {
        setDuplicateWarning(`Notice: An active warehouse facility already exists at pincode ${clean}.`);
      } else {
        setDuplicateWarning(null);
      }
    }
  };

  // Save Warehouse Handler
  const handleSaveWarehouse = async () => {
    if (!tenantId) {
      alert('Tenant session unassigned. Please log in again.');
      return;
    }
    if (!formName.trim() || !formContact.trim() || !formPhone.trim() || !formAddress1.trim() || !formPincode.trim()) {
      alert('Please fill in all mandatory fields marked with (*).');
      return;
    }

    try {
      setIsSaving(true);
      if (editingWarehouse) {
        const res = await CustomerWarehouseService.updateWarehouseAsync(editingWarehouse.id, {
          warehouseName: formName,
          contactPerson: formContact,
          phone: formPhone,
          email: formEmail,
          addressLine1: formAddress1,
          addressLine2: formAddress2,
          landmark: formLandmark,
          pincode: formPincode,
          city: formCity,
          state: formState,
          pickupStartTime: formStartTime,
          pickupEndTime: formEndTime,
          isDefault: formIsDefault,
        }, tenantId);

        setToastMsg(res.message);
      } else {
        const res = await CustomerWarehouseService.addWarehouseAsync({
          tenantId,
          warehouseName: formName,
          contactPerson: formContact,
          phone: formPhone,
          email: formEmail,
          addressLine1: formAddress1,
          addressLine2: formAddress2,
          landmark: formLandmark,
          pincode: formPincode,
          city: formCity,
          state: formState,
          pickupStartTime: formStartTime,
          pickupEndTime: formEndTime,
          isDefault: formIsDefault,
        });

        setToastMsg(res.message);
      }

      setIsAddEditModalOpen(false);
      refreshData();
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err: any) {
      alert(`Error saving warehouse: ${err?.message || 'Database error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Set Default Action
  const handleSetDefault = async (wh: CustomerWarehouse) => {
    const res = await CustomerWarehouseService.setDefaultWarehouseAsync(wh.id, tenantId);
    refreshData();
    setToastMsg(res.message);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Deactivate Action
  const handleDeactivate = async (wh: CustomerWarehouse) => {
    if (confirm(`Are you sure you want to deactivate ${wh.warehouseName}? Past shipments will retain their pickup records, but this hub cannot be selected for new bookings.`)) {
      const res = await CustomerWarehouseService.deactivateWarehouseAsync(wh.id, tenantId);
      refreshData();
      setToastMsg(res.message);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  // Filtered List
  const filteredWarehouses = warehouses.filter((w) => {
    if (statusFilter === 'ACTIVE' && w.status !== 'ACTIVE') return false;
    if (statusFilter === 'INACTIVE' && w.status !== 'INACTIVE') return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      w.warehouseName.toLowerCase().includes(q) ||
      w.warehouseCode.toLowerCase().includes(q) ||
      w.city.toLowerCase().includes(q) ||
      w.pincode.includes(q)
    );
  });

  const activeCount = warehouses.filter((w) => w.status === 'ACTIVE').length;
  const inactiveCount = warehouses.length - activeCount;
  const defaultWarehouse = warehouses.find((w) => w.isDefault);
  const totalShipments = warehouses.reduce((sum, w) => sum + (w.totalShipmentsCount || 0), 0);

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Tools', path: '/app' },
    { label: 'Warehouses', path: '/app/warehouses' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* 1. Sleek Page Header */}
      <PageHeader
        title="Pickup Warehouses"
        description="Manage origin dispatch locations and pickup facilities across India."
        breadcrumbs={breadcrumbs}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 600,
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              boxShadow: '0 1px 3px rgba(37,99,235,0.25)',
            }}
          >
            <PlusCircle size={15} /> Add Warehouse
          </Button>
        }
      />

      {toastMsg && (
        <Alert variant="success" title="Success">
          {toastMsg}
        </Alert>
      )}

      {/* 2. Modern Executive Metrics Strip (Compact & Zero Space Waste) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Metric 1: Active Facilities */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Locations
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2, marginTop: '2px' }}>
              {activeCount} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>Hubs configured</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Primary Default Facility */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Star size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Primary Default Origin
              </span>
              <span
                style={{
                  fontSize: '9px',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  fontWeight: 700,
                }}
              >
                DEFAULT
              </span>
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.2,
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {defaultWarehouse ? (
                <span>
                  {defaultWarehouse.warehouseCode} <span style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>• {defaultWarehouse.city}</span>
                </span>
              ) : (
                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>No default assigned</span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 3: Total Dispatches */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Origin Dispatches
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2, marginTop: '2px' }}>
              {totalShipments} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>Shipments</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Directory Card with Filter Tabs & Search */}
      <Card style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', borderRadius: '12px' }}>
        {/* Search & Status Filter Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Quick Filter Tabs */}
          <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px', gap: '2px' }}>
            <button
              onClick={() => setStatusFilter('ALL')}
              style={{
                border: 'none',
                background: statusFilter === 'ALL' ? '#ffffff' : 'transparent',
                color: statusFilter === 'ALL' ? '#0f172a' : '#64748b',
                fontWeight: statusFilter === 'ALL' ? 600 : 500,
                fontSize: '12px',
                padding: '5px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: statusFilter === 'ALL' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              All ({warehouses.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              style={{
                border: 'none',
                background: statusFilter === 'ACTIVE' ? '#ffffff' : 'transparent',
                color: statusFilter === 'ACTIVE' ? '#0f172a' : '#64748b',
                fontWeight: statusFilter === 'ACTIVE' ? 600 : 500,
                fontSize: '12px',
                padding: '5px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: statusFilter === 'ACTIVE' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              style={{
                border: 'none',
                background: statusFilter === 'INACTIVE' ? '#ffffff' : 'transparent',
                color: statusFilter === 'INACTIVE' ? '#0f172a' : '#64748b',
                fontWeight: statusFilter === 'INACTIVE' ? 600 : 500,
                fontSize: '12px',
                padding: '5px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: statusFilter === 'INACTIVE' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Inactive ({inactiveCount})
            </button>
          </div>

          {/* Search Box */}
          <div style={{ width: '280px', position: 'relative' }}>
            <Input
              placeholder="Search Name, City, Pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: '36px', fontSize: '13px' }}
            />
          </div>
        </div>

        {/* Warehouse Cards Grid */}
        {filteredWarehouses.length === 0 ? (
          <div
            style={{
              padding: '36px 16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              backgroundColor: '#f8fafc',
              borderRadius: '10px',
              border: '1px dashed #cbd5e1',
            }}
          >
            <Building2 size={36} style={{ color: '#94a3b8' }} />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
              {warehouses.length === 0 ? 'No Pickup Warehouses Configured' : 'No Matching Warehouses'}
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', maxWidth: '400px', lineHeight: 1.4 }}>
              {warehouses.length === 0
                ? 'Configure your origin facility or hub. Delhivery and courier partners pick up parcels from these addresses.'
                : `No pickup locations match "${searchQuery}".`}
            </p>
            {warehouses.length === 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAddModal}
                style={{
                  marginTop: '8px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                <PlusCircle size={14} style={{ marginRight: '6px' }} /> Add First Warehouse
              </Button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
            {filteredWarehouses.map((wh) => (
              <div
                key={wh.id}
                style={{
                  borderRadius: '10px',
                  border: wh.isDefault ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: wh.status === 'INACTIVE' ? '#f8fafc' : wh.isDefault ? '#fbfcfe' : '#ffffff',
                  boxShadow: wh.isDefault ? '0 2px 8px rgba(37,99,235,0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Card Top Strip */}
                <div
                  style={{
                    padding: '12px 14px 10px 14px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '10px',
                    backgroundColor: wh.isDefault ? '#eff6ff' : 'transparent',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: wh.isDefault ? '#dbeafe' : '#f1f5f9',
                          color: wh.isDefault ? '#1e40af' : '#475569',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {wh.warehouseCode}
                      </span>
                      {wh.isDefault && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Star size={10} fill="currentColor" /> DEFAULT ORIGIN
                        </span>
                      )}
                    </div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {wh.warehouseName}
                    </h4>
                  </div>

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: wh.status === 'ACTIVE' ? '#f0fdf4' : '#f1f5f9',
                      color: wh.status === 'ACTIVE' ? '#16a34a' : '#64748b',
                      border: wh.status === 'ACTIVE' ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}
                  >
                    {wh.status}
                  </span>
                </div>

                {/* Card Body: Address & Contacts (Compact Spacing) */}
                <div
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '7px',
                    fontSize: '12px',
                    color: '#475569',
                    flex: 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <MapPin size={14} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ lineHeight: 1.35 }}>
                      {wh.addressLine1}
                      {wh.addressLine2 ? `, ${wh.addressLine2}` : ''},{' '}
                      <strong style={{ color: '#0f172a' }}>
                        {wh.city}, {wh.state} - {wh.pincode}
                      </strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
                    <span>
                      Contact:{' '}
                      <strong style={{ color: '#0f172a' }}>{wh.contactPerson}</strong> ({wh.phone})
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
                    <span>
                      Pickup Window:{' '}
                      <strong style={{ color: '#0f172a' }}>
                        {wh.pickupStartTime} – {wh.pickupEndTime}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Card Actions (Always 100% visible, No Cut-Off) */}
                <div
                  style={{
                    borderTop: '1px solid #f1f5f9',
                    padding: '8px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: wh.isDefault ? '#fbfcfe' : '#ffffff',
                  }}
                >
                  <div>
                    {!wh.isDefault && wh.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleSetDefault(wh)}
                        style={{
                          border: '1px solid #bfdbfe',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Star size={11} /> Make Default
                      </button>
                    ) : (
                      <span
                        style={{
                          fontSize: '11px',
                          color: wh.isDefault ? '#15803d' : '#94a3b8',
                          fontWeight: wh.isDefault ? 600 : 400,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        {wh.isDefault ? (
                          <>
                            <CheckCircle2 size={12} /> Default Origin
                          </>
                        ) : (
                          'Inactive Facility'
                        )}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenEditModal(wh)}
                      style={{
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        color: '#334155',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                    {wh.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleDeactivate(wh)}
                        style={{
                          border: '1px solid #fee2e2',
                          backgroundColor: '#fff5f5',
                          color: '#dc2626',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Subtle, Non-Intrusive Snapshot Guarantee Note at bottom */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#64748b',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '10px',
            marginTop: '4px',
          }}
        >
          <ShieldCheck size={14} style={{ color: '#0ea5e9', flexShrink: 0 }} />
          <span>
            Historical Pickup Snapshot: Past bookings and LR waybills retain their original pickup address even if a facility is edited or deactivated.
          </span>
        </div>
      </Card>

      {/* ADD / EDIT WAREHOUSE MODAL */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={editingWarehouse ? `Edit Pickup Warehouse — ${editingWarehouse.warehouseCode}` : 'Add New Pickup Warehouse'}
        maxWidth="650px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {duplicateWarning && (
            <Alert variant="warning" title="Duplicate Location Warning">
              {duplicateWarning}
            </Alert>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Warehouse Facility Name *
              </label>
              <Input placeholder="e.g. Mumbai Fulfillment Center" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Contact Person Name *
              </label>
              <Input placeholder="e.g. Rahul Sharma" value={formContact} onChange={(e) => setFormContact(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Mobile Number *
              </label>
              <Input placeholder="+91 98765 43210" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Warehouse Email (Optional)
              </label>
              <Input placeholder="mumbai.wh@yourstore.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
              Address Line 1 *
            </label>
            <Input placeholder="Plot/Building No, Industrial Estate, Street..." value={formAddress1} onChange={(e) => setFormAddress1(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Address Line 2
              </label>
              <Input placeholder="Locality / Area..." value={formAddress2} onChange={(e) => setFormAddress2(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Landmark
              </label>
              <Input placeholder="Near Metro Station..." value={formLandmark} onChange={(e) => setFormLandmark(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Pincode (Auto-populates) *
              </label>
              <Input placeholder="e.g. 400001" value={formPincode} onChange={(e) => handlePincodeChange(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                City *
              </label>
              <Input value={formCity} onChange={(e) => setFormCity(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                State *
              </label>
              <Input value={formState} onChange={(e) => setFormState(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Pickup Start Slot
              </label>
              <Input value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Pickup End Slot
              </label>
              <Input value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <Checkbox checked={formIsDefault} onChange={(e) => setFormIsDefault(e.target.checked)} />
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
              Set as Primary Default Warehouse for New Bookings
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button variant="outline" onClick={() => setIsAddEditModalOpen(false)} disabled={isSaving} size="sm">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveWarehouse}
              isLoading={isSaving}
              size="sm"
              style={{ backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 600 }}
            >
              {editingWarehouse ? 'Update Warehouse' : 'Save Warehouse Location'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
