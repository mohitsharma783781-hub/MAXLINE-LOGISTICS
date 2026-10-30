import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  PlusCircle,
  Upload,
  Download,
  X,
  Eye,
  Truck,
  AlertCircle,
  FileSpreadsheet,
  RotateCcw,
  User,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { RecentOrder, OrderStatus, SalesChannel } from '../types/dashboard';
import { DEMO_ORDERS_LIST } from '../data/ordersData';

const STATUS_BADGES: Record<OrderStatus, { badge: string; dot: string }> = {
  'Ready to Ship': {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    dot: 'bg-indigo-600'
  },
  'Pending Pickup': {
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500'
  },
  'In Transit': {
    badge: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dot: 'bg-blue-600'
  },
  'Out for Delivery': {
    badge: 'bg-sky-50 text-sky-700 border-sky-200/80',
    dot: 'bg-sky-500'
  },
  'Delivered': {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500'
  },
  'RTO': {
    badge: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dot: 'bg-rose-500'
  }
};

const CHANNEL_BADGES: Record<SalesChannel, string> = {
  Shopify: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  WooCommerce: 'bg-purple-50 text-purple-700 border-purple-200',
  Amazon: 'bg-amber-50 text-amber-700 border-amber-200',
  Manual: 'bg-slate-100 text-slate-700 border-slate-200',
  'Custom API': 'bg-blue-50 text-blue-700 border-blue-200'
};

export const OrdersView: React.FC = () => {
  // Working local state initialized from sample data
  const [orders, setOrders] = useState<RecentOrder[]>(DEMO_ORDERS_LIST);
  const [activeTab, setActiveTab] = useState<'ALL' | OrderStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'ALL' | SalesChannel>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'Prepaid' | 'COD'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Modals / Entry Points
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New order form fields (preview mode)
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newDestinationCity, setNewDestinationCity] = useState('');
  const [newDestinationPin, setNewDestinationPin] = useState('');
  const [newShippingAddress, setNewShippingAddress] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newAmount, setNewAmount] = useState('₹ 1,450');
  const [newPaymentMode, setNewPaymentMode] = useState<'Prepaid' | 'COD'>('Prepaid');
  const [newWeightKg, setNewWeightKg] = useState(0.8);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (activeTab !== 'ALL' && order.status !== activeTab) {
        return false;
      }
      // Channel filter
      if (channelFilter !== 'ALL' && order.channel !== channelFilter) {
        return false;
      }
      // Payment filter
      if (paymentFilter !== 'ALL' && order.paymentMode !== paymentFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          order.orderNumber.toLowerCase().includes(q) ||
          (order.awbNumber && order.awbNumber.toLowerCase().includes(q)) ||
          order.customerName.toLowerCase().includes(q) ||
          order.destinationCity.toLowerCase().includes(q) ||
          order.destinationPin.includes(q) ||
          order.courierName.toLowerCase().includes(q) ||
          (order.itemName && order.itemName.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [orders, activeTab, channelFilter, paymentFilter, searchQuery]);

  // Bulk selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const resetFilters = () => {
    setActiveTab('ALL');
    setChannelFilter('ALL');
    setPaymentFilter('ALL');
    setSearchQuery('');
  };

  // Add new order preview
  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newDestinationPin) {
      alert('Please fill customer name and destination pincode');
      return;
    }

    const createdOrder: RecentOrder = {
      id: `ord-${Date.now().toString().slice(-4)}`,
      orderNumber: `ML-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      awbNumber: `DL-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      customerName: newCustomerName,
      customerPhone: newCustomerPhone || '+91 98000 00000',
      customerEmail: 'customer@demo.com',
      shippingAddress: newShippingAddress || 'Sample Street Address',
      destinationCity: newDestinationCity || 'Mumbai, MH',
      destinationPin: newDestinationPin,
      originCity: 'Mumbai Hub',
      courierName: 'Delhivery Surface',
      courierLogo: 'DL',
      status: 'Ready to Ship',
      date: 'Just Now',
      amount: newAmount.startsWith('₹') ? newAmount : `₹ ${newAmount}`,
      paymentMode: newPaymentMode,
      weightKg: newWeightKg,
      channel: 'Manual',
      itemsCount: 1,
      itemName: newItemName || 'Standard Consignment Box'
    };

    setOrders((prev) => [createdOrder, ...prev]);
    setIsCreateModalOpen(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewDestinationCity('');
    setNewDestinationPin('');
    setNewShippingAddress('');
    setNewItemName('');
    showToast(`Order #${createdOrder.orderNumber} added to session preview.`);
  };

  // Simulate bulk import
  const handleSimulateBulkImport = () => {
    const bulk1: RecentOrder = {
      id: `ord-bulk-${Date.now()}-1`,
      orderNumber: `ML-2026-8812`,
      awbNumber: 'DL-8812049102',
      customerName: 'Karthik Raja',
      customerPhone: '+91 98410 19284',
      customerEmail: 'karthik.raja@chennai.com',
      shippingAddress: 'Plot 4, Velachery Bypass Road',
      destinationCity: 'Chennai, TN',
      destinationPin: '600042',
      originCity: 'Mumbai Hub',
      courierName: 'Delhivery Surface',
      courierLogo: 'DL',
      status: 'Ready to Ship',
      date: 'Just Now (Batch)',
      amount: '₹ 2,150',
      paymentMode: 'Prepaid',
      weightKg: 0.9,
      channel: 'Shopify',
      itemsCount: 1,
      itemName: 'Aluminium Non-Stick Frying Pan'
    };

    const bulk2: RecentOrder = {
      id: `ord-bulk-${Date.now()}-2`,
      orderNumber: `ML-2026-8813`,
      awbNumber: 'BD-8813094102',
      customerName: 'Shalini Sen',
      customerPhone: '+91 98300 29481',
      customerEmail: 'shalini.sen@kolkata.org',
      shippingAddress: '42, Salt Lake Sector 2',
      destinationCity: 'Kolkata, WB',
      destinationPin: '700091',
      originCity: 'Delhi Hub',
      courierName: 'Blue Dart Air',
      courierLogo: 'BD',
      status: 'Ready to Ship',
      date: 'Just Now (Batch)',
      amount: '₹ 3,890',
      paymentMode: 'COD',
      weightKg: 1.4,
      channel: 'Shopify',
      itemsCount: 2,
      itemName: 'Handmade Terra Cotta Vases Set'
    };

    setOrders((prev) => [bulk1, bulk2, ...prev]);
    setIsBulkModalOpen(false);
    showToast('Batch preview: 2 sample orders imported to session.');
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Compact Header Section */}
      {/* Breadcrumb & Orders Management Center Heading Bar (Matching Skyonship Screenshot 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <span>Merchant Portal</span>
            <span className="text-slate-400">›</span>
            <span className="text-slate-700 font-semibold">Orders Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Orders Management Center
          </h1>
        </div>

        {/* Action Controls: Refresh, Export, Template, Bulk Upload, + Create Shipment */}
        <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => showToast('Orders refreshed.')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => showToast('Exporting orders to CSV...')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => showToast('Downloading order import sample template...')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Template</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Bulk Upload</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-medium text-xs shadow-xs transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Shipment</span>
          </button>
        </div>
      </div>

      {/* Search & 7-Filter Controls Card (Matching Skyonship Screenshot 2) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        {/* Top: Full-Width Search Input with Filters Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by AWB, Order ID, Customer Name, Mobile Number..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters</span>
          </button>
        </div>

        {/* Bottom: 7 Filter Dropdown Selectors (Matching Skyonship Screenshot 2) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1 text-xs">
          {/* 1. Date Range */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Date Range
            </label>
            <select
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs text-slate-800 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option>All Dates</option>
              <option>Today</option>
              <option>Yesterday</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>

          {/* 2. Courier Partner */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Courier Partner
            </label>
            <select
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs text-slate-800 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option>All Couriers</option>
              <option>Delhivery Surface</option>
              <option>Blue Dart Air</option>
              <option>Xpressbees</option>
              <option>DTDC Priority</option>
              <option>Shadowfax</option>
            </select>
          </div>

          {/* 3. Order Status */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Order Status
            </label>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs text-slate-800 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Ready to Ship">Ready to Ship</option>
              <option value="Pending Pickup">Pending Pickup</option>
              <option value="In Transit">In Transit</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="RTO">RTO / Returned</option>
            </select>
          </div>

          {/* 4. Warehouse */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Warehouse
            </label>
            <select
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs text-slate-800 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option>All Warehouses</option>
              <option>Bhiwandi Central Hub (421302)</option>
              <option>Okhla Industrial Hub (110020)</option>
              <option>Peenya Industrial Hub (560058)</option>
            </select>
          </div>

          {/* 5. Payment Type */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Payment Type
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs text-slate-800 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="ALL">All Payments</option>
              <option value="Prepaid">Prepaid</option>
              <option value="COD">COD</option>
            </select>
          </div>

          {/* 6. Shipment Type */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Shipment Type
            </label>
            <select
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs text-slate-800 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option>All Types</option>
              <option>Forward Dispatch</option>
              <option>Reverse Logistics (RTO)</option>
            </select>
          </div>

          {/* 7. Mode (B2B/B2C) */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Mode (B2B/B2C)
            </label>
            <select
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs text-slate-800 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option>All Modes</option>
              <option>B2C Surface</option>
              <option>B2C Air Express</option>
              <option>B2B Heavy Cargo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (when rows are selected) */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-slate-900 text-white rounded-lg px-3.5 py-2 flex items-center justify-between shadow-md animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>{selectedOrderIds.length} Consignment(s) Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => showToast(`Generated manifest for ${selectedOrderIds.length} consignments (Preview).`)}
              className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
            >
              Generate Manifest
            </button>
            <button
              type="button"
              onClick={() => showToast(`Thermal shipping labels downloaded for ${selectedOrderIds.length} orders.`)}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              Download Labels
            </button>
            <button
              type="button"
              onClick={() => setSelectedOrderIds([])}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Orders Table Container (Refined Row Heights & Density) */}
      <div className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">
                <th className="py-2.5 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredOrders.length > 0 &&
                      selectedOrderIds.length === filteredOrders.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3">Order ID & Source</th>
                <th className="py-2.5 px-3">Customer Details</th>
                <th className="py-2.5 px-3">Destination</th>
                <th className="py-2.5 px-3">Courier & AWB</th>
                <th className="py-2.5 px-3">Amount / Mode</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                        <Package className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-slate-700 text-xs">No matching orders found</p>
                      <p className="text-[11px] text-slate-400 max-w-sm">
                        No consignments match your active search or filters. Try adjusting your query or resetting all filters.
                      </p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-1 text-xs font-bold text-blue-600 hover:text-blue-700 underline"
                      >
                        Reset all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrderIds.includes(order.id);
                  const statusStyle = STATUS_BADGES[order.status] || {
                    badge: 'bg-slate-100 text-slate-700 border-slate-200',
                    dot: 'bg-slate-400'
                  };
                  const channelClass = (order.channel && CHANNEL_BADGES[order.channel]) || 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(order.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Order ID & Channel */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {order.orderNumber}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {order.channel && (
                            <span
                              className={`text-[9px] font-semibold px-1 py-0.2 rounded border ${channelClass}`}
                            >
                              {order.channel}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">{order.date.split(',')[0]}</span>
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-xs">{order.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {order.customerPhone || 'Phone unlisted'}
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="font-medium text-slate-700 text-xs">{order.destinationCity}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          PIN: {order.destinationPin}
                        </div>
                      </td>

                      {/* Courier & AWB */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800 text-xs flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          <span>{order.courierName}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          AWB: {order.awbNumber || 'Pending Allocation'}
                        </div>
                      </td>

                      {/* Amount / Payment Mode */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 font-mono text-xs">{order.amount}</div>
                        <span
                          className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            order.paymentMode === 'COD'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {order.paymentMode}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold border ${statusStyle.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          {order.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-100 border border-blue-200/80 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Compact Table Footer */}
        <div className="px-3.5 py-2 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] text-slate-500">
          <span>
            Showing <strong>{filteredOrders.length}</strong> of {orders.length} consignments in current view
          </span>
          <span className="text-[10px] text-slate-400">
            MAXLINE Logistics SaaS Platform • Order Management
          </span>
        </div>
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-xl w-full p-5 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <h3 className="font-bold text-base text-slate-900">
                    Consignment #{selectedOrder.orderNumber}
                  </h3>
                  {selectedOrder.channel && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded border bg-slate-100 text-slate-700 border-slate-200">
                      {selectedOrder.channel}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  AWB: {selectedOrder.awbNumber || 'Pending Tracking Allocation'} • {selectedOrder.date}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Pill & Alert */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>
                  Current Status: <strong>{selectedOrder.status}</strong>
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  STATUS_BADGES[selectedOrder.status]?.badge || 'bg-slate-100'
                }`}
              >
                {selectedOrder.status}
              </span>
            </div>

            {/* Customer & Destination Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>Customer Profile</span>
                </span>
                <div className="font-bold text-slate-900">{selectedOrder.customerName}</div>
                <div className="text-slate-600 flex items-center gap-1 text-[11px]">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{selectedOrder.customerPhone || '+91 98000 00000'}</span>
                </div>
                <div className="text-slate-600 flex items-center gap-1 text-[11px]">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{selectedOrder.customerEmail || 'customer@example.com'}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>Delivery Destination</span>
                </span>
                <div className="font-bold text-slate-900">{selectedOrder.destinationCity} (PIN: {selectedOrder.destinationPin})</div>
                <p className="text-slate-500 text-[11px] leading-snug">
                  {selectedOrder.shippingAddress || 'Registered Commercial / Residential Address'}
                </p>
              </div>
            </div>

            {/* Consignment Items & Weight */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">
                Package Contents & Specifications
              </span>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800">
                  {selectedOrder.itemName || 'Standard Domestic Goods Package'}
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  {selectedOrder.itemsCount || 1} Item(s)
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                <span>Chargeable Weight: <strong>{selectedOrder.weightKg || 0.8} kg</strong></span>
                <span>Carrier: <strong className="text-blue-600">{selectedOrder.courierName}</strong></span>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-xs space-y-1.5">
              <span className="text-blue-800 font-bold uppercase text-[10px] block">
                Billing & Collectible Total
              </span>
              <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                <span>Invoice Amount:</span>
                <span className="font-mono">{selectedOrder.amount}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-blue-200/50">
                <span>Payment Mode:</span>
                <span className="font-bold text-slate-900">{selectedOrder.paymentMode}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-[11px] text-slate-400">
                Preview Snapshot • Live tracking connects in Phase 3
              </span>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal (Preview Mode) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-xl border border-slate-200 space-y-3.5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Create Single Order</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Preview Mode:</strong> Submitting will record this order in your client session view for UI evaluation. Live PostgreSQL database persistence will connect in Phase 2 via the Express backend.
              </span>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-3 text-xs">
              {/* Customer Name & Phone */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-0.5">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-0.5">Phone Number</label>
                  <input
                    type="tel"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Destination Pincode & City */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-0.5">Destination PIN *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={newDestinationPin}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '');
                      setNewDestinationPin(v);
                      if (v.startsWith('40')) setNewDestinationCity('Mumbai, MH');
                      else if (v.startsWith('56')) setNewDestinationCity('Bengaluru, KA');
                      else if (v.startsWith('11')) setNewDestinationCity('Delhi, DL');
                    }}
                    placeholder="6-digit Pincode"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-0.5">Destination City</label>
                  <input
                    type="text"
                    value={newDestinationCity}
                    onChange={(e) => setNewDestinationCity(e.target.value)}
                    placeholder="e.g. Pune, Maharashtra"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <label className="font-semibold text-slate-700 block mb-0.5">Delivery Street Address</label>
                <input
                  type="text"
                  value={newShippingAddress}
                  onChange={(e) => setNewShippingAddress(e.target.value)}
                  placeholder="House/Flat No., Building Name, Street Area"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Item Name & Weight */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-0.5">Item Description</label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Leather Jacket (Size L)"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-0.5">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newWeightKg}
                    onChange={(e) => setNewWeightKg(parseFloat(e.target.value) || 0.5)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Value & Payment Mode */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-0.5">Invoice Amount (₹)</label>
                  <input
                    type="text"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="₹ 1,500"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-0.5">Payment Mode</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewPaymentMode('Prepaid')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                        newPaymentMode === 'Prepaid'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Prepaid
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPaymentMode('COD')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                        newPaymentMode === 'COD'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      COD
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  Save to Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal (Preview Mode) */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-xl border border-slate-200 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Bulk CSV Orders Ingestion</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Batch Ingestion Preview:</strong> Full CSV parsing, automatic column matching, and batch database records will be operational in Phase 2. Below is the preview template and import simulation.
              </span>
            </div>

            {/* Drag & Drop Area */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center space-y-1.5 hover:border-blue-400 transition-colors cursor-pointer bg-slate-50/50">
              <Upload className="w-6 h-6 text-blue-600 mx-auto" />
              <div>
                <p className="font-semibold text-slate-800 text-xs">
                  Drag and drop your orders spreadsheet here, or <span className="text-blue-600 underline">browse</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Supported formats: .CSV, .XLSX (Max 2,000 consignments per batch)
                </p>
              </div>
            </div>

            {/* Required Headers Guide */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-1">
              <span className="font-bold text-slate-800 block text-[11px]">
                Standard Template Column Format:
              </span>
              <div className="text-[10px] font-mono text-slate-600 bg-white p-1.5 rounded border border-slate-200 overflow-x-auto">
                Order_ID, Customer_Name, Phone, Address, Pincode, City, Weight_Kg, Value_INR, Payment_Mode
              </div>
              <button
                type="button"
                onClick={() => alert('Downloaded template: maxline_orders_template.csv')}
                className="text-blue-600 hover:underline font-semibold text-[10px] inline-flex items-center gap-1 mt-0.5"
              >
                <Download className="w-3 h-3" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulateBulkImport}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-xs"
              >
                Simulate Sample Batch (2 Orders)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
