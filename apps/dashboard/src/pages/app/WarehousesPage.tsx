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
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
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
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Automatically sync with Supabase Cloud DB on mount
  useEffect(() => {
    if (!tenantId) {
      setWarehouses([]);
      return;
    }

    CustomerWarehouseService.syncFromSupabase(tenantId)
      .then((cloudList) => {
        setWarehouses([...cloudList]);
        setIsCloudSynced(true);
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
        setIsCloudSynced(true);
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
  const handlePincodeChange = (val: string) => {
    setFormPincode(val);
    if (val.trim().length === 6) {
      const lookup = lookupPincodeDetails(val);
      setFormCity(lookup.city);
      setFormState(lookup.state);

      // Check duplicate
      if (!editingWarehouse && CustomerWarehouseService.checkDuplicateWarehouse(tenantId, val, formAddress1)) {
        setDuplicateWarning(`Notice: An active warehouse facility already exists at pincode ${val}.`);
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
  const defaultWarehouse = warehouses.find((w) => w.isDefault);
  const totalShipments = warehouses.reduce((sum, w) => sum + (w.totalShipmentsCount || 0), 0);

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Shipment Settings', path: '/app/settings' },
    { label: 'Pickup Warehouses', path: '/app/warehouses' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Multi-Warehouse & Pickup Locations Manager"
        description="Operate shipments from multiple physical pickup facilities across India. Configure custom origin addresses, pickup timings, and primary defaults."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {isCloudSynced && (
              <Badge variant="success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px' }}>
                <ShieldCheck size={12} /> Supabase Cloud Synced
              </Badge>
            )}
            <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
              <PlusCircle size={14} style={{ marginRight: '6px' }} /> + Add Pickup Warehouse
            </Button>
          </div>
        }
      />

      {toastMsg && (
        <Alert variant="success" title="Warehouse Updated">
          {toastMsg}
        </Alert>
      )}

      {/* 2. Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Active Pickup Warehouses" value={activeCount} subtext="Configured physical locations" icon={Building2} />
        <StatCard label="Primary Default Facility" value={defaultWarehouse ? defaultWarehouse.warehouseCode : 'None'} subtext={defaultWarehouse ? defaultWarehouse.city : 'Assign default'} badgeText="DEFAULT" badgeVariant="success" icon={Star} />
        <StatCard label="Origin Shipments Dispatched" value={totalShipments.toString()} subtext="Combined multi-warehouse dispatches" icon={Package} />
      </div>

      {/* Deactivation Protection Notice */}
      <Alert variant="info" title="Deletion Protection & Snapshot Guarantee">
        Warehouses associated with historical shipments cannot be permanently deleted. Deactivating a warehouse prevents future selection, while <strong>all past shipments preserve their original pickup address snapshot</strong>.
      </Alert>

      {/* 3. Search & Cards Grid */}
      <Card style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>Pickup Warehouses Directory</h3>
          <div style={{ width: '280px' }}>
            <Input
              placeholder="Search Name, Code, City, Pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Warehouse Cards Display Grid */}
        {filteredWarehouses.length === 0 ? (
          <div
            style={{
              padding: 'var(--space-8) var(--space-4)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-3)',
              backgroundColor: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--color-border-main)',
            }}
          >
            <Building2 size={44} style={{ color: 'var(--color-text-muted)' }} />
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {warehouses.length === 0 ? 'No Pickup Warehouses Configured' : 'No Warehouses Found'}
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)', maxWidth: '420px', lineHeight: 1.5 }}>
              {warehouses.length === 0
                ? 'Configure your primary origin facility or dispatch hub. Couriers will pick up shipments from these physical addresses.'
                : `No pickup locations matched "${searchQuery}". Try searching for another name, city, or pincode.`}
            </p>
            {warehouses.length === 0 && (
              <Button variant="primary" size="sm" onClick={handleOpenAddModal} style={{ marginTop: 'var(--space-2)' }}>
                <PlusCircle size={14} style={{ marginRight: '6px' }} /> + Add Primary Pickup Warehouse
              </Button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {filteredWarehouses.map((wh) => (
            <Card
              key={wh.id}
              style={{
                padding: 'var(--space-4)',
                border: wh.isDefault ? '2px solid var(--color-violet-main)' : '1px solid var(--color-border-main)',
                backgroundColor: wh.status === 'INACTIVE' ? 'var(--color-bg-secondary)' : '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                position: 'relative',
              }}
            >
              {/* Header Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Badge variant="brand" style={{ fontSize: '10px', marginBottom: '4px' }}>
                    {wh.warehouseCode}
                  </Badge>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                    {wh.warehouseName}
                  </h4>
                </div>

                <div style={{ display: 'flex', gap: '4px', flexDirection: 'column', alignItems: 'flex-end' }}>
                  {wh.isDefault && (
                    <Badge variant="success" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Star size={11} /> DEFAULT PICKUP
                    </Badge>
                  )}
                  <Badge variant={wh.status === 'ACTIVE' ? 'info' : 'neutral'}>
                    {wh.status}
                  </Badge>
                </div>
              </div>

              {/* Address & Contact Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <MapPin size={14} style={{ color: 'var(--color-violet-main)', flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    {wh.addressLine1}{wh.addressLine2 ? `, ${wh.addressLine2}` : ''}, <strong>{wh.city}, {wh.state} - {wh.pincode}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} style={{ color: 'var(--color-violet-main)', flexShrink: 0 }} />
                  <span>Contact: <strong>{wh.contactPerson}</strong> ({wh.phone})</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} style={{ color: 'var(--color-violet-main)', flexShrink: 0 }} />
                  <span>Pickup Slot: <strong>{wh.pickupStartTime} – {wh.pickupEndTime}</strong></span>
                </div>
              </div>

              {/* Card Actions */}
              <div style={{ borderTop: '1px solid var(--color-border-main)', paddingTop: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {!wh.isDefault && wh.status === 'ACTIVE' ? (
                  <Button size="sm" variant="outline" onClick={() => handleSetDefault(wh)} style={{ fontSize: '11px' }}>
                    <Star size={12} style={{ marginRight: '4px' }} /> Set as Default
                  </Button>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    {wh.isDefault ? 'Primary Default' : 'Inactive Facility'}
                  </span>
                )}

                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button size="sm" variant="outline" onClick={() => handleOpenEditModal(wh)}>
                    <Edit2 size={13} /> Edit
                  </Button>
                  {wh.status === 'ACTIVE' && (
                    <Button size="sm" variant="outline" onClick={() => handleDeactivate(wh)} style={{ color: 'var(--color-danger-main)' }}>
                      Deactivate
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
        )}
      </Card>

      {/* ADD / EDIT WAREHOUSE MODAL */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={editingWarehouse ? `Edit Pickup Warehouse — ${editingWarehouse.warehouseCode}` : '+ Add New Pickup Warehouse'}
        maxWidth="650px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {duplicateWarning && (
            <Alert variant="warning" title="Duplicate Location Warning">
              {duplicateWarning}
            </Alert>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Warehouse Facility Name *</label>
              <Input placeholder="e.g. Mumbai Fulfillment Center" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Contact Person Name *</label>
              <Input placeholder="e.g. Rahul Sharma" value={formContact} onChange={(e) => setFormContact(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Mobile Number *</label>
              <Input placeholder="+91 98765 43210" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Warehouse Email (Optional)</label>
              <Input placeholder="mumbai.wh@yourstore.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Address Line 1 *</label>
            <Input placeholder="Plot/Building No, Industrial Estate, Street..." value={formAddress1} onChange={(e) => setFormAddress1(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Address Line 2</label>
              <Input placeholder="Locality / Area..." value={formAddress2} onChange={(e) => setFormAddress2(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Landmark</label>
              <Input placeholder="Near Metro Station..." value={formLandmark} onChange={(e) => setFormLandmark(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Pincode (Auto-populates) *</label>
              <Input placeholder="e.g. 400001" value={formPincode} onChange={(e) => handlePincodeChange(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>City *</label>
              <Input value={formCity} onChange={(e) => setFormCity(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>State *</label>
              <Input value={formState} onChange={(e) => setFormState(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Pickup Start Slot</label>
              <Input value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Pickup End Slot</label>
              <Input value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <Checkbox checked={formIsDefault} onChange={(e) => setFormIsDefault(e.target.checked)} />
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Set as Primary Default Warehouse for New Bookings</label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            <Button variant="outline" onClick={() => setIsAddEditModalOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveWarehouse} isLoading={isSaving}>
              {editingWarehouse ? 'Update Warehouse' : 'Save Warehouse Location'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
