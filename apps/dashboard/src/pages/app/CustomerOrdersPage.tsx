import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Upload,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  CheckCircle2,
  Printer,
  FileText,
  MapPin,
  Clock,
  User,
  Phone,
  Copy,
  Check,
  Eye,
  Building2,
  ExternalLink,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Table,
  Input,
  Select,
  Checkbox,
  Drawer,
  Pagination,
  TableSkeleton,
} from '../../components/ui';
import { CustomerShipmentService, type CustomerShipmentDetail } from '../../services/customerShipmentService';
import { useTenant } from '../../context/TenantContext';

export interface OrderRecord extends Record<string, unknown> {
  id: string;
  orderId: string;
  awbNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryPincode: string;
  deliveryCity: string;

  courierName: string;
  courierBg: string;
  serviceType: 'Surface' | 'Air' | 'Express' | 'Cargo';
  mode: 'B2C' | 'B2B';
  boxCount: number;

  originCity: string;
  originPincode: string;
  warehouseName: string;

  deadWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  dimensionsCm: string;

  baseFreight: number;
  fuelSurcharge: number;
  docketCharge: number;
  codCharge: number;
  fmCharge: number;
  gstAmount: number;
  totalAmount: number;

  paymentType: 'Prepaid' | 'COD';
  codAmount: number;
  shipmentType: 'Forward' | 'Reverse';

  status: 'Pending' | 'Booked' | 'Pickup Scheduled' | 'Picked Up' | 'In Transit' | 'OFD' | 'Delivered' | 'RTO' | 'NDR' | 'Cancelled';
  createdDate: string;

  timeline: Array<{
    title: string;
    description: string;
    timestamp: string;
    completed: boolean;
    active?: boolean;
    isError?: boolean;
  }>;
}

export const DEMO_ORDERS_DATA: OrderRecord[] = [];

export function mapShipmentToOrderRecord(s: CustomerShipmentDetail): OrderRecord {
  const isExpress = s.serviceName?.toLowerCase().includes('express') || s.courierName?.toLowerCase().includes('express');
  const isAir = s.serviceName?.toLowerCase().includes('air');
  const serviceType: 'Surface' | 'Air' | 'Express' | 'Cargo' = isAir ? 'Air' : isExpress ? 'Express' : 'Surface';

  const baseFreight = Number(s.baseFreightINR) || 0;
  const fuelSurcharge = Number(s.fuelSurchargeINR) || 0;
  const codCharge = Number(s.codFeeINR) || 0;
  const totalAmount = Number(s.totalCustomerChargeINR) || (baseFreight + fuelSurcharge + codCharge);

  const subtotal = baseFreight + fuelSurcharge + codCharge;
  const gstAmount = Math.max(0, Math.round((totalAmount > subtotal ? totalAmount - subtotal : subtotal * 0.18) * 100) / 100);

  const cleanCourierName = s.courierName || 'Delhivery Surface';

  const statusStr = (s.bookingStatus as string) || '';
  let status: OrderRecord['status'] = 'Booked';
  if (statusStr === 'DELIVERED') status = 'Delivered';
  else if (statusStr === 'NDR') status = 'NDR';
  else if (statusStr.startsWith('RTO')) status = 'RTO';
  else if (statusStr === 'CANCELLED') status = 'Cancelled';
  else if (statusStr === 'IN_TRANSIT') status = 'In Transit';
  else if (statusStr === 'PICKED_UP') status = 'Picked Up';
  else if (statusStr === 'OUT_FOR_DELIVERY') status = 'OFD';
  else if (statusStr === 'PICKUP_REQUESTED') status = 'Pickup Scheduled';
  else status = 'Booked';

  const boxCount =
    (s.packages && s.packages.reduce((sum: number, p: any) => sum + (p.quantity || 1), 0)) || 1;

  const timeline = s.trackingTimeline && s.trackingTimeline.length > 0
    ? s.trackingTimeline.map((t) => ({
        title: t.statusTitle || 'Status Update',
        description: t.description || '',
        timestamp: t.timestamp || s.bookingDate,
        completed: !!t.completed,
      }))
    : [
        {
          title: 'Booking Confirmed',
          description: `Shipment booked with ${cleanCourierName}. AWB: ${s.awbNumber || 'Assigned'}`,
          timestamp: s.bookingDate,
          completed: true,
          active: true,
        },
        {
          title: 'Ready for Pickup',
          description: 'Package packed and ready for carrier pickup & handover.',
          timestamp: s.bookingDate,
          completed: false,
        },
      ];

  return {
    id: s.id,
    orderId: s.orderId,
    awbNumber: s.awbNumber || 'PENDING',
    customerName: s.deliveryContact || 'Customer',
    customerPhone: s.deliveryPhone || '',
    customerEmail: (s as any).deliveryEmail || `${s.deliveryContact?.toLowerCase().replace(/\s+/g, '') || 'customer'}@example.com`,
    deliveryAddress: s.deliveryAddress || '',
    deliveryPincode: s.deliveryPincode || '',
    deliveryCity: s.deliveryCity || '',

    courierName: cleanCourierName,
    courierBg: '#0284c7',
    serviceType,
    mode: (s.mode || 'B2C') as any,
    boxCount,

    originCity: s.pickupCity || 'Origin Hub',
    originPincode: s.pickupPincode || '',
    warehouseName: (s as any).warehouseName || `${s.pickupCity || 'Origin'} Warehouse`,

    deadWeightKg: s.actualWeightKg || 0.5,
    volumetricWeightKg: s.chargeableWeightKg || 0.5,
    chargeableWeightKg: s.chargeableWeightKg || 0.5,
    dimensionsCm: s.dimensionsCm || '10 × 10 × 10 CM',

    baseFreight,
    fuelSurcharge,
    docketCharge: 0,
    codCharge,
    fmCharge: 0,
    gstAmount,
    totalAmount,

    paymentType: s.paymentMode === 'COD' ? 'COD' : 'Prepaid',
    codAmount: s.codAmountINR || 0,
    shipmentType: 'Forward',

    status,
    createdDate: s.bookingDate || new Date().toLocaleDateString(),
    timeline,
  };
}

export type StatusTabKey = 'all' | 'booked' | 'in_transit' | 'delivered' | 'ndr' | 'rto';

export const CustomerOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeTenantId } = useTenant();

  // Workflow Status Tabs
  const [activeTab, setActiveTab] = useState<StatusTabKey>('all');

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [courierFilter, setCourierFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);

  // Table Selection & Pagination State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');

  // Side Drawer State for Order Details
  const [selectedDrawerOrder, setSelectedDrawerOrder] = useState<OrderRecord | null>(null);
  const [openPrintDropdownId, setOpenPrintDropdownId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [syncVersion, setSyncVersion] = useState<number>(0);

  useEffect(() => {
    const handleOutsideClick = () => setOpenPrintDropdownId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Synchronize with backend on mount
  useEffect(() => {
    if (!activeTenantId) return;

    setIsLoadingData(true);
    CustomerShipmentService.syncFromSupabase(activeTenantId)
      .then(() => {
        setSyncVersion((v) => v + 1);
      })
      .finally(() => {
        setIsLoadingData(false);
      });
  }, [activeTenantId]);

  // Refresh data
  const handleRefreshData = () => {
    if (!activeTenantId) return;
    setIsLoadingData(true);

    CustomerShipmentService.syncFromSupabase(activeTenantId)
      .then(() => {
        setSyncVersion((v) => v + 1);
      })
      .finally(() => {
        setIsLoadingData(false);
      });
  };

  // Copy AWB Helper
  const handleCopyAwb = (awb: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(awb);
    setCopiedAwb(awb);
    setTimeout(() => setCopiedAwb(null), 2000);
  };

  // Raw orders for tab counting
  const allRawOrders = useMemo(() => {
    if (!activeTenantId) return [];
    const dynamicShipments = CustomerShipmentService.getShipments(activeTenantId);
    return dynamicShipments.map(mapShipmentToOrderRecord);
  }, [activeTenantId, syncVersion]);

  // Status counts for tabs
  const tabCounts = useMemo(() => {
    let booked = 0;
    let transit = 0;
    let delivered = 0;
    let ndr = 0;
    let rto = 0;

    for (const o of allRawOrders) {
      if (o.status === 'Booked' || o.status === 'Pickup Scheduled' || o.status === 'Pending') {
        booked++;
      } else if (o.status === 'In Transit' || o.status === 'Picked Up' || o.status === 'OFD') {
        transit++;
      } else if (o.status === 'Delivered') {
        delivered++;
      } else if (o.status === 'NDR') {
        ndr++;
      } else if (o.status === 'RTO') {
        rto++;
      }
    }

    return {
      all: allRawOrders.length,
      booked,
      in_transit: transit,
      delivered,
      ndr,
      rto,
    };
  }, [allRawOrders]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setDateRange('all');
    setCourierFilter('all');
    setWarehouseFilter('all');
    setPaymentFilter('all');
    setModeFilter('all');
    setActiveTab('all');
    setCurrentPage(1);
  };

  const isAnyFilterActive =
    searchQuery.trim() !== '' ||
    dateRange !== 'all' ||
    courierFilter !== 'all' ||
    warehouseFilter !== 'all' ||
    paymentFilter !== 'all' ||
    modeFilter !== 'all' ||
    activeTab !== 'all';

  // Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    let list = allRawOrders.filter((item) => {
      // 1. Status Tab Filter
      if (activeTab === 'booked') {
        if (!(item.status === 'Booked' || item.status === 'Pickup Scheduled' || item.status === 'Pending')) return false;
      } else if (activeTab === 'in_transit') {
        if (!(item.status === 'In Transit' || item.status === 'Picked Up' || item.status === 'OFD')) return false;
      } else if (activeTab === 'delivered') {
        if (item.status !== 'Delivered') return false;
      } else if (activeTab === 'ndr') {
        if (item.status !== 'NDR') return false;
      } else if (activeTab === 'rto') {
        if (item.status !== 'RTO') return false;
      }

      // 2. Global Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          item.orderId.toLowerCase().includes(q) ||
          item.awbNumber.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q) ||
          item.customerPhone.includes(q) ||
          item.deliveryCity.toLowerCase().includes(q) ||
          item.deliveryPincode.includes(q) ||
          item.originCity.toLowerCase().includes(q);
        if (!match) return false;
      }

      // 3. Courier Filter
      if (courierFilter !== 'all' && !item.courierName.toLowerCase().includes(courierFilter.toLowerCase())) {
        return false;
      }

      // 4. Warehouse Filter
      if (warehouseFilter !== 'all' && item.warehouseName !== warehouseFilter) {
        return false;
      }

      // 5. Payment Filter
      if (paymentFilter !== 'all' && item.paymentType !== paymentFilter) {
        return false;
      }

      // 6. Mode Filter
      if (modeFilter !== 'all' && item.mode !== modeFilter) {
        return false;
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'date') return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
      if (sortBy === 'amount') return b.totalAmount - a.totalAmount;
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });

    return list;
  }, [allRawOrders, activeTab, searchQuery, dateRange, courierFilter, warehouseFilter, paymentFilter, modeFilter, sortBy]);

  // Paginated Data
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;

  // Bulk Selection Handlers
  const isAllSelected = paginatedOrders.length > 0 && paginatedOrders.every((o) => selectedIds.includes(o.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedOrders.map((o) => o.id));
    }
  };

  const toggleSelectRow = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Status badge styling
  const getStatusBadgeVariant = (status: OrderRecord['status']) => {
    switch (status) {
      case 'Delivered':
        return 'success';
      case 'In Transit':
      case 'Picked Up':
      case 'Pickup Scheduled':
        return 'info';
      case 'OFD':
      case 'NDR':
        return 'warning';
      case 'RTO':
        return 'danger';
      case 'Booked':
        return 'brand';
      case 'Pending':
      case 'Cancelled':
      default:
        return 'neutral';
    }
  };

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Orders Center', path: '/app/orders' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '24px' }}>
      
      {/* 1. TOP ACTION BAR (Clean & Professional, Zero Dev Jargon) */}
      <PageHeader
        title="Orders Center"
        breadcrumbs={breadcrumbs}
        style={{ marginBottom: '0px' }}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} className={isLoadingData ? 'animate-spin' : ''} />}
              onClick={handleRefreshData}
              title="Refresh Orders"
            >
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={() => alert('Exporting orders CSV file...')}
            >
              Export
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Upload size={14} />}
              onClick={() => navigate('/app/orders/bulk-upload')}
            >
              Bulk Upload
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => navigate('/app/orders/create')}
              style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: '700' }}
            >
              Create Shipment
            </Button>
          </div>
        }
      />

      {/* 2. DELHIVERY ONE STYLE STATUS WORKFLOW TABS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          borderBottom: '2px solid #e2e8f0',
          backgroundColor: '#ffffff',
          borderRadius: '10px 10px 0 0',
          padding: '4px 12px 0 12px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {[
          { key: 'all' as StatusTabKey, label: 'All Orders', count: tabCounts.all },
          { key: 'booked' as StatusTabKey, label: 'Booked / Manifested', count: tabCounts.booked },
          { key: 'in_transit' as StatusTabKey, label: 'In Transit', count: tabCounts.in_transit },
          { key: 'delivered' as StatusTabKey, label: 'Delivered', count: tabCounts.delivered },
          { key: 'ndr' as StatusTabKey, label: 'NDR / Exceptions', count: tabCounts.ndr },
          { key: 'rto' as StatusTabKey, label: 'RTO Returned', count: tabCounts.rto },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                fontSize: '12px',
                fontWeight: isActive ? '800' : '600',
                color: isActive ? '#0284c7' : '#64748b',
                border: 'none',
                borderBottom: isActive ? '2.5px solid #0284c7' : '2.5px solid transparent',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? '#e0f2fe' : '#f1f5f9',
                  color: isActive ? '#0284c7' : '#64748b',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. COMPACT SEARCH & SMART FILTER STRIP */}
      <Card style={{ padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0 0 10px 10px', marginTop: '-14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ flex: '1 1 320px', minWidth: '240px', position: 'relative' }}>
              <Input
                placeholder="Search by AWB, Order ID, Customer name, Mobile, City, Pincode..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ paddingLeft: '34px', height: '36px', fontSize: '12px' }}
              />
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>

            {/* Quick Filter: Mode (B2B / B2C) */}
            <div style={{ width: '130px' }}>
              <Select
                value={modeFilter}
                onChange={(e) => {
                  setModeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { label: 'All Modes', value: 'all' },
                  { label: 'B2B Freight', value: 'B2B' },
                  { label: 'B2C Surface', value: 'B2C' },
                ]}
                style={{ height: '36px', fontSize: '12px' }}
              />
            </div>

            {/* Quick Filter: Payment (Prepaid / COD) */}
            <div style={{ width: '130px' }}>
              <Select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { label: 'All Payments', value: 'all' },
                  { label: 'Prepaid', value: 'Prepaid' },
                  { label: 'COD', value: 'COD' },
                ]}
                style={{ height: '36px', fontSize: '12px' }}
              />
            </div>

            {/* Quick Filter: Date Range */}
            <div style={{ width: '130px' }}>
              <Select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { label: 'All Dates', value: 'all' },
                  { label: 'Today', value: 'today' },
                  { label: 'Last 7 Days', value: '7d' },
                  { label: 'Last 30 Days', value: '30d' },
                ]}
                style={{ height: '36px', fontSize: '12px' }}
              />
            </div>

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Filter size={13} />}
              onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
              style={{ height: '36px', fontSize: '12px' }}
            >
              More Filters {isAdvancedFiltersOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </Button>

            {/* Clear Filters Button */}
            {isAnyFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                style={{ color: '#ef4444', fontSize: '12px', height: '36px' }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Advanced Collapsible Filters */}
          {isAdvancedFiltersOpen && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '3px' }}>Courier Partner</label>
                <Select
                  value={courierFilter}
                  onChange={(e) => setCourierFilter(e.target.value)}
                  options={[
                    { label: 'All Couriers', value: 'all' },
                    { label: 'Delhivery Surface B2B', value: 'Delhivery Surface B2B' },
                    { label: 'Delhivery Surface', value: 'Delhivery Surface' },
                  ]}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '3px' }}>Warehouse</label>
                <Select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                  options={[
                    { label: 'All Warehouses', value: 'all' },
                    { label: 'Origin Hub Warehouse', value: 'Origin Warehouse' },
                  ]}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '3px' }}>Sort By</label>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  options={[
                    { label: 'Booking Date (Newest)', value: 'date' },
                    { label: 'Order Amount (Highest)', value: 'amount' },
                    { label: 'Status', value: 'status' },
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 4. FLOATING BULK ACTIONS BAR (When Checkboxes Selected) */}
      {selectedIds.length > 0 && (
        <div style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '10px 18px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(2,132,199,0.2)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{selectedIds.length} Order(s) Selected</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              style={{ backgroundColor: '#ffffff', color: '#0284c7', borderColor: '#ffffff', fontSize: '11px', fontWeight: '700' }}
              onClick={() => navigate('/app/pickups/create', { state: { selectedShipmentIds: selectedIds } })}
            >
              <Truck size={13} style={{ marginRight: '4px' }} /> Schedule Pickup
            </Button>

            <Button
              variant="outline"
              size="sm"
              style={{ backgroundColor: '#ffffff', color: '#0284c7', borderColor: '#ffffff', fontSize: '11px', fontWeight: '700' }}
              onClick={() => navigate('/app/manifests/create', { state: { selectedShipmentIds: selectedIds } })}
            >
              <FileText size={13} style={{ marginRight: '4px' }} /> Bulk Manifest
            </Button>

            <Button
              variant="ghost"
              size="sm"
              style={{ color: '#ffffff', fontSize: '11px' }}
              onClick={() => setSelectedIds([])}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* 5. STREAMLINED 100% FIT ORDERS TABLE (ZERO HORIZONTAL SCROLL) */}
      <Card style={{ padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
        {isLoadingData ? (
          <TableSkeleton rows={7} cols={6} />
        ) : filteredOrders.length === 0 ? (
          /* EMPTY STATE */
          <div style={{ padding: '48px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={28} style={{ color: '#64748b' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              No Shipments Found
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, maxWidth: '400px' }}>
              No orders match your filter criteria or search parameters. Try adjusting your search query or reset filters.
            </p>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={() => navigate('/app/orders/create')}
              style={{ marginTop: '8px', backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            >
              Create First Shipment
            </Button>
          </div>
        ) : (
          <div>
            {/* Streamlined Enterprise Table with 6 High-Density Columns */}
            <Table<OrderRecord>
              keyExtractor={(r) => r.id}
              columns={[
                // COLUMN 0: CHECKBOX
                {
                  key: 'checkbox',
                  header: (
                    <Checkbox
                      id="select-all-orders"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                    />
                  ),
                  render: (r) => (
                    <Checkbox
                      id={`select-order-${r.id}`}
                      checked={selectedIds.includes(r.id)}
                      onChange={(e) => toggleSelectRow(r.id, e)}
                    />
                  ),
                },

                // COLUMN 1: ORDER & WAYBILL (Merged)
                {
                  key: 'orderAwb',
                  header: 'Order & Waybill',
                  render: (r) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          onClick={() => setSelectedDrawerOrder(r)}
                          style={{ color: '#0284c7', fontWeight: '800', fontSize: '13px', cursor: 'pointer', textDecoration: 'none' }}
                          title="Click to view details"
                        >
                          {r.orderId}
                        </span>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>{r.createdDate}</span>
                      </div>

                      {/* AWB with 1-click copy */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a', fontSize: '12px' }}>
                          {r.awbNumber}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyAwb(r.awbNumber, e)}
                          title="Copy AWB Number"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: copiedAwb === r.awbNumber ? '#16a34a' : '#94a3b8' }}
                        >
                          {copiedAwb === r.awbNumber ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>

                      {/* Direct Waybill Download Link */}
                      {r.awbNumber && r.awbNumber !== 'PENDING' && (
                        <div style={{ marginTop: '2px' }}>
                          <a
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/app/shipments/${r.id}/label?format=waybill_lr&autoPrint=1`);
                            }}
                            style={{
                              fontSize: '10px',
                              color: '#0284c7',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              cursor: 'pointer',
                              textDecoration: 'none',
                            }}
                            title="Download Official Delhivery B2B Waybill / LR Copy"
                          >
                            <FileText size={11} /> Download waybill copy 📥
                          </a>
                        </div>
                      )}
                    </div>
                  ),
                },

                // COLUMN 2: CUSTOMER & ROUTE (Merged)
                {
                  key: 'customerRoute',
                  header: 'Customer & Route',
                  render: (r) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ color: '#0f172a', fontSize: '12px' }}>{r.customerName}</strong>
                        {r.customerPhone && (
                          <span style={{ fontSize: '10px', color: '#64748b' }}>• {r.customerPhone}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#475569' }}>
                        <MapPin size={11} style={{ color: '#94a3b8', flexShrink: 0 }} />
                        <span>{r.originCity} ({r.originPincode})</span>
                        <ArrowRight size={11} style={{ color: '#94a3b8', flexShrink: 0 }} />
                        <span>{r.deliveryCity} ({r.deliveryPincode})</span>
                      </div>
                    </div>
                  ),
                },

                // COLUMN 3: COURIER & MODE (Merged)
                {
                  key: 'courierMode',
                  header: 'Courier & Service',
                  render: (r) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: '#f0f9ff',
                            color: '#0284c7',
                            border: '1px solid #bae6fd',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Truck size={11} style={{ color: '#0284c7' }} />
                          {r.courierName}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#64748b' }}>
                        <Badge variant={r.mode === 'B2B' ? 'warning' : 'info'} style={{ padding: '1px 5px', fontSize: '9px' }}>
                          {r.mode}
                        </Badge>
                        <span>• {r.boxCount} {r.boxCount > 1 ? 'Boxes' : 'Box'}</span>
                      </div>
                    </div>
                  ),
                },

                // COLUMN 4: WEIGHT & BILLING (Merged)
                {
                  key: 'weightBilling',
                  header: 'Weight & Amount',
                  render: (r) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ color: '#0f172a', fontSize: '13px' }}>₹ {r.totalAmount.toFixed(2)}</strong>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: '800',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            backgroundColor: r.paymentType === 'COD' ? '#fef3c7' : '#f1f5f9',
                            color: r.paymentType === 'COD' ? '#92400e' : '#475569',
                            border: r.paymentType === 'COD' ? '1px solid #fde68a' : '1px solid #e2e8f0',
                          }}
                        >
                          {r.paymentType}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        <span>Wt: <strong>{r.chargeableWeightKg} KG</strong> ({r.dimensionsCm})</span>
                      </div>
                    </div>
                  ),
                },

                // COLUMN 5: CURRENT STATUS
                {
                  key: 'status',
                  header: 'Status',
                  render: (r) => (
                    <div>
                      <Badge variant={getStatusBadgeVariant(r.status)}>
                        {r.status}
                      </Badge>
                    </div>
                  ),
                },

                // COLUMN 6: ACTIONS (Always visible on right)
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (r) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                      {/* VIEW DRAWER BUTTON */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDrawerOrder(r)}
                        style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          color: '#0284c7',
                          borderColor: '#bae6fd',
                          backgroundColor: '#f0f9ff',
                          fontWeight: '700',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Eye size={12} />
                        View
                      </Button>

                      {/* MULTI-FORMAT PRINT DROPDOWN */}
                      <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setOpenPrintDropdownId(openPrintDropdownId === r.id ? null : r.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: '#ffffff',
                            color: '#0f172a',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                          title="Print Shipping Label & Commercial Waybill"
                        >
                          <Printer size={12} />
                          <span>Print</span>
                          <ChevronDown size={11} />
                        </button>

                        {openPrintDropdownId === r.id && (
                          <div
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: '100%',
                              marginTop: '4px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                              width: '220px',
                              zIndex: 60,
                              overflow: 'hidden',
                              fontSize: '11px',
                              textAlign: 'left',
                            }}
                          >
                            <div style={{ padding: '6px 10px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '800', color: '#64748b', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Select Print Format
                            </div>
                            <div
                              onClick={() => {
                                setOpenPrintDropdownId(null);
                                navigate(`/app/shipments/${r.id}/label?format=waybill_lr&autoPrint=1`);
                              }}
                              style={{ padding: '9px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f0fdf4', color: '#166534', fontWeight: '700', borderBottom: '1px solid #dcfce7' }}
                            >
                              <span>📑</span>
                              <span><strong>Waybill / LR Copy</strong> (POD)</span>
                            </div>
                            <div
                              onClick={() => {
                                setOpenPrintDropdownId(null);
                                navigate(`/app/shipments/${r.id}/label?format=thermal_4x6&autoPrint=1`);
                              }}
                              style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', color: '#1e293b' }}
                            >
                              <span>🏷️</span>
                              <span><strong>4" × 6"</strong> Thermal Label</span>
                            </div>
                            <div
                              onClick={() => {
                                setOpenPrintDropdownId(null);
                                navigate(`/app/shipments/${r.id}/label?format=a4_sheet&autoPrint=1`);
                              }}
                              style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', color: '#1e293b' }}
                            >
                              <span>📄</span>
                              <span><strong>A4 Size</strong> Shipping Label</span>
                            </div>
                            <div
                              onClick={() => {
                                setOpenPrintDropdownId(null);
                                navigate(`/app/shipments/${r.id}/label?format=carton_4x2&autoPrint=1`);
                              }}
                              style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', color: '#1e293b' }}
                            >
                              <span>📦</span>
                              <span><strong>4" × 2"</strong> Shipping Label</span>
                            </div>
                            <div
                              onClick={() => {
                                setOpenPrintDropdownId(null);
                                navigate(`/app/shipments/${r.id}/label?format=carton_4x2_5&autoPrint=1`);
                              }}
                              style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', color: '#1e293b' }}
                            >
                              <span>📦</span>
                              <span><strong>4" × 2.5"</strong> Shipping Label</span>
                            </div>
                            <div
                              onClick={() => {
                                setOpenPrintDropdownId(null);
                                navigate(`/app/shipments/${r.id}/label?format=compact_3x2&autoPrint=1`);
                              }}
                              style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}
                            >
                              <span>🏷️</span>
                              <span><strong>3" × 2"</strong> Shipping Label</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* TRACKING BUTTON */}
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Track Shipment"
                        onClick={() => {
                          const trackTarget = r.awbNumber && r.awbNumber !== 'PENDING' ? r.awbNumber : (r.orderId || r.id);
                          navigate(`/app/tracking?query=${encodeURIComponent(trackTarget)}`);
                        }}
                        style={{ padding: '4px 6px', color: '#0284c7' }}
                      >
                        <Truck size={14} />
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={paginatedOrders}
            />

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#64748b' }}>
                <span>Showing <strong>{paginatedOrders.length}</strong> of <strong>{filteredOrders.length}</strong> orders</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Show per page:</span>
                  <Select
                    value={pageSize.toString()}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    options={[
                      { value: '25', label: '25 orders' },
                      { value: '50', label: '50 orders' },
                      { value: '100', label: '100 orders' },
                    ]}
                    style={{ width: '110px', padding: '2px 6px', height: '32px' }}
                  />
                </div>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </div>
          </div>
        )}
      </Card>

      {/* 6. ORDER DETAILS SIDE DRAWER */}
      <Drawer
        isOpen={!!selectedDrawerOrder}
        onClose={() => setSelectedDrawerOrder(null)}
        title={selectedDrawerOrder ? `Shipment Details — ${selectedDrawerOrder.orderId}` : 'Shipment Details'}
        size="lg"
      >
        {selectedDrawerOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingBottom: '20px' }}>
            
            {/* Drawer Top Header Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '14px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>AIR WAYBILL NUMBER</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'monospace', color: '#0f172a' }}>
                    {selectedDrawerOrder.awbNumber}
                  </span>
                  <button
                    onClick={(e) => handleCopyAwb(selectedDrawerOrder.awbNumber, e)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: copiedAwb === selectedDrawerOrder.awbNumber ? '#16a34a' : '#94a3b8' }}
                  >
                    {copiedAwb === selectedDrawerOrder.awbNumber ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <Badge variant={getStatusBadgeVariant(selectedDrawerOrder.status)} style={{ fontSize: '12px', padding: '4px 10px' }}>
                {selectedDrawerOrder.status}
              </Badge>
            </div>

            {/* Quick Actions in Drawer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate(`/app/shipments/${selectedDrawerOrder.id}/label?format=waybill_lr&autoPrint=1`);
                }}
                style={{
                  color: '#166534',
                  borderColor: '#86efac',
                  backgroundColor: '#f0fdf4',
                  width: '100%',
                  fontWeight: '700',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                }}
              >
                <FileText size={14} /> Download Official B2B Waybill / LR Copy 📥
              </Button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate(`/app/shipments/${selectedDrawerOrder.id}/label`);
                  }}
                  style={{ color: '#0284c7', borderColor: '#bae6fd', backgroundColor: '#f0f9ff', padding: '6px 4px', fontSize: '11px' }}
                >
                  <Printer size={13} style={{ marginRight: '3px' }} /> Label
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate('/app/pickups/create', { state: { selectedShipmentIds: [selectedDrawerOrder.id] } });
                  }}
                  style={{ color: '#16a34a', borderColor: '#bbf7d0', backgroundColor: '#f0fdf4', padding: '6px 4px', fontSize: '11px' }}
                >
                  <Calendar size={13} style={{ marginRight: '3px' }} /> Pickup
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate(`/app/shipment-control-center/${selectedDrawerOrder.id}`);
                  }}
                  style={{ color: '#475569', borderColor: '#cbd5e1', padding: '6px 4px', fontSize: '11px' }}
                >
                  <ExternalLink size={13} style={{ marginRight: '3px' }} /> Details
                </Button>
              </div>
            </div>

            {/* Courier & Routing Section */}
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>{selectedDrawerOrder.courierName}</span>
                <Badge variant={selectedDrawerOrder.mode === 'B2B' ? 'warning' : 'info'}>{selectedDrawerOrder.mode} Cargo</Badge>
              </div>
              <div style={{ fontSize: '11px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                <span>Origin: {selectedDrawerOrder.originCity} ({selectedDrawerOrder.originPincode})</span>
                <span>Destination: {selectedDrawerOrder.deliveryCity} ({selectedDrawerOrder.deliveryPincode})</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Weight: {selectedDrawerOrder.chargeableWeightKg} KG • Boxes: {selectedDrawerOrder.boxCount}
              </div>
            </div>

            {/* Customer Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>Delivery Address</div>
              <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.4' }}>
                <strong>{selectedDrawerOrder.customerName}</strong><br />
                {selectedDrawerOrder.deliveryAddress}<br />
                {selectedDrawerOrder.deliveryCity} - {selectedDrawerOrder.deliveryPincode}<br />
                📞 {selectedDrawerOrder.customerPhone}
              </div>
            </div>

            {/* Financial Summary */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>Financial Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Base Freight</span>
                  <span>₹ {selectedDrawerOrder.baseFreight.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Fuel Surcharge</span>
                  <span>₹ {selectedDrawerOrder.fuelSurcharge.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>GST (18%)</span>
                  <span>₹ {selectedDrawerOrder.gstAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#0f172a', borderTop: '1px dashed #cbd5e1', paddingTop: '4px' }}>
                  <span>Total Debit</span>
                  <span>₹ {selectedDrawerOrder.totalAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontSize: '10px', color: '#0284c7', fontWeight: '700' }}>
                  <span>Payment Mode</span>
                  <span>{selectedDrawerOrder.paymentType}</span>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Tracking Events</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '8px', borderLeft: '2px solid #e2e8f0' }}>
                {selectedDrawerOrder.timeline.map((event, idx) => (
                  <div key={idx} style={{ position: 'relative', paddingLeft: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: event.completed ? '#16a34a' : '#94a3b8', position: 'absolute', left: '-15px', top: '4px' }} />
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>{event.title}</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>{event.description}</div>
                    <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '1px' }}>{event.timestamp}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </Drawer>
    </div>
  );
};
