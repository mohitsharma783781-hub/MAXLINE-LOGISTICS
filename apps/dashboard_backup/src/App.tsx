import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { MetricCard } from './components/MetricCard';
import { OrdersTable } from './components/OrdersTable';
import { StatusDistribution } from './components/StatusDistribution';
import { RateCalculator } from './components/RateCalculator';
import { RateCard } from './components/RateCard';
import { OrdersView } from './components/OrdersView';
import { PlaceholderPage } from './components/PlaceholderPage';
import { NavigationKey, RecentOrder } from './types/dashboard';
import { DEMO_METRICS, DEMO_RECENT_ORDERS } from './data/demoData';
import {
  Calculator,
  X,
  Plus,
  Package,
  Search,
  Warehouse,
  Receipt,
  Wallet,
  ArrowRight
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<NavigationKey>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab') as NavigationKey;
      if (tab) return tab;
      const hash = window.location.hash.replace('#', '') as NavigationKey;
      if (hash) return hash;
    }
    return 'overview';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null);
  const [isNoticeDismissed, setIsNoticeDismissed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Sidebar Navigation (Matching Skyonship obsidian dark architecture) */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={(key) => setActiveNav(key)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Layout Area */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        {/* Topbar Header (Matching Skyonship with Wallet pill & + Add Money) */}
        <Topbar
          activeNav={activeNav}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          onQuickBookShipment={() => setActiveNav('rate-calculator')}
          onOpenWallet={() => setActiveNav('cod-wallet')}
        />

        {/* Global Dismissible Sandbox Notice */}
        {!isNoticeDismissed && (
          <div className="bg-[#0F172A] text-white px-4 sm:px-6 py-1.5 text-[11px] border-b border-slate-800 transition-all">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 truncate">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-semibold text-[10px] border border-blue-500/30 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  Sandbox Mode
                </span>
                <span className="text-slate-300 truncate font-normal">
                  Consignments, freight rates, and ledger balances are simulated sample data for UI evaluation.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsNoticeDismissed(true)}
                className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 shrink-0 transition-colors"
                title="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-7xl w-full mx-auto space-y-6">
          {activeNav === 'overview' ? (
            <>
              {/* Dashboard Breadcrumb & Title Section (Matching Skyonship Screenshot 1) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                    <span>Merchant Portal</span>
                    <span className="text-slate-400">›</span>
                    <span className="text-slate-700 font-semibold">Dashboard</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Dashboard
                  </h1>
                </div>

                {/* Right Action: + Create Shipment Button */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActiveNav('rate-calculator')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Shipment</span>
                  </button>
                </div>
              </div>

              {/* 5 KPI Cards Row (Matching Skyonship 5-card horizontal layout) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {DEMO_METRICS.map((metric) => (
                  <MetricCard key={metric.id} metric={metric} />
                ))}
              </div>

              {/* Core Operational Actions (Matching Skyonship Screenshot 1 Grid) */}
              <div className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Core Operational Actions
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Action 1: Create Shipment */}
                  <div
                    onClick={() => setActiveNav('rate-calculator')}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30">
                        <Plus className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          Create Shipment
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          Book single dispatches or B2B freight orders with instant courier rate cards.
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                      <span>Create Order</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>

                  {/* Action 2: All Orders */}
                  <div
                    onClick={() => setActiveNav('orders')}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/30">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0284c7] transition-colors">
                          All Orders
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          Track active shipments, bulk uploads, manifests, and shipping labels.
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center text-xs font-semibold text-[#0284c7] group-hover:text-sky-700">
                      <span>View Orders</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>

                  {/* Action 3: Track Shipment */}
                  <div
                    onClick={() => setActiveNav('shipments')}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-purple-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#7c3aed] text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/30">
                        <Search className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#7c3aed] transition-colors">
                          Track Shipment
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          Real-time AWB tracking, NDR exception resolution & delivery status.
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center text-xs font-semibold text-[#7c3aed] group-hover:text-purple-700">
                      <span>Track AWB</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>

                  {/* Action 4: Rate Calculator */}
                  <div
                    onClick={() => setActiveNav('rate-calculator')}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0ea5e9] text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/30">
                        <Calculator className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0ea5e9] transition-colors">
                          Rate Calculator
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          Calculate instant courier freight rates across 29,000+ Indian pincodes.
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center text-xs font-semibold text-[#0ea5e9] group-hover:text-sky-700">
                      <span>Calculate Rates</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>

                  {/* Action 5: Warehouses & Pickups */}
                  <div
                    onClick={() => setActiveNav('pickup')}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#d97706] text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
                        <Warehouse className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#d97706] transition-colors">
                          Warehouses
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          Manage pickup hubs, seller origin locations & schedule courier dispatches.
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center text-xs font-semibold text-[#d97706] group-hover:text-amber-700">
                      <span>Manage Hubs</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>

                  {/* Action 6: Invoices & Billing */}
                  <div
                    onClick={() => setActiveNav('reports')}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-rose-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#dc2626] text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-500/30">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#dc2626] transition-colors">
                          Invoices & Billing
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          View GST tax invoices, billing ledgers & daily COD remittance statements.
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center text-xs font-semibold text-[#dc2626] group-hover:text-rose-700">
                      <span>View Invoices</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Dual Widgets: Shipment Pipeline Funnel + Wallet Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Left: Shipment Pipeline Funnel (7 cols) */}
                <div className="lg:col-span-7 h-full">
                  <StatusDistribution />
                </div>

                {/* Right: Wallet Summary Card (5 cols - Matching Skyonship Screenshot 1) */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-purple-600" />
                      <h3 className="text-sm font-bold text-slate-900">Wallet Summary</h3>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/70">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      Prepaid Merchant
                    </span>
                  </div>

                  {/* Gradient Balance Box */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-blue-50/50 border border-purple-100 relative">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 block">
                      CURRENT BALANCE
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
                      ₹ 14,250.00
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium block mt-1">
                      Available balance for instant consignment dispatch
                    </span>

                    {/* Circular Floating + Button on corner */}
                    <button
                      type="button"
                      onClick={() => setActiveNav('cod-wallet')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#1E6BFF] hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105"
                      title="Add Money to Wallet"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Settlement & Ledger Info */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="text-[11px] text-slate-500">
                      <span>Settlement: </span>
                      <span className="font-semibold text-slate-800 font-mono">HDFC Bank •••• 4892 (T+1 Daily)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveNav('cod-wallet')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      <span>View Ledger</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Consignments Table */}
              <OrdersTable
                orders={DEMO_RECENT_ORDERS}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
                onViewOrder={(order) => setSelectedOrder(order)}
              />
            </>
          ) : activeNav === 'orders' ? (
            <OrdersView />
          ) : activeNav === 'rate-calculator' || activeNav === 'create-order' ? (
            <RateCalculator />
          ) : activeNav === 'rate-card' ? (
            <RateCard />
          ) : (
            <PlaceholderPage
              navKey={activeNav}
              onBackToOverview={() => setActiveNav('overview')}
            />
          )}
        </main>

        {/* Floating Action Button (Matching Skyonship bottom-right blue + button) */}
        <button
          type="button"
          onClick={() => setActiveNav('rate-calculator')}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#1E6BFF] hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-40 focus:outline-none"
          title="Create New Shipment"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Selected Order Quick Preview Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Order {selectedOrder.orderNumber}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">AWB: {selectedOrder.awbNumber || 'Pending AWB'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Recipient</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Destination</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.destinationCity} ({selectedOrder.destinationPin})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Courier</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.courierName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Amount / Mode</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.amount} • {selectedOrder.paymentMode}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedOrder.status}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
