import React from 'react';
import { RecentOrder, OrderStatus } from '../types/dashboard';
import { ArrowUpRight, SearchX, X } from 'lucide-react';

interface OrdersTableProps {
  orders: RecentOrder[];
  searchQuery?: string;
  onClearSearch?: () => void;
  onViewOrder?: (order: RecentOrder) => void;
}

const STATUS_STYLES: Record<OrderStatus, { badge: string; dot: string }> = {
  'Delivered': {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs',
    dot: 'bg-emerald-500'
  },
  'In Transit': {
    badge: 'bg-blue-50 text-blue-700 border-blue-200/80 shadow-2xs',
    dot: 'bg-blue-600'
  },
  'Out for Delivery': {
    badge: 'bg-sky-50 text-sky-700 border-sky-200/80 shadow-2xs',
    dot: 'bg-sky-500'
  },
  'Pending Pickup': {
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80 shadow-2xs',
    dot: 'bg-amber-500'
  },
  'Ready to Ship': {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 shadow-2xs',
    dot: 'bg-indigo-500'
  },
  'RTO': {
    badge: 'bg-rose-50 text-rose-700 border-rose-200/80 shadow-2xs',
    dot: 'bg-rose-500'
  }
};

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  searchQuery = '',
  onClearSearch,
  onViewOrder
}) => {
  const filtered = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.destinationCity.toLowerCase().includes(q) ||
      o.destinationPin.includes(q) ||
      o.courierName.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden shadow-card">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Recent Consignments
          </h2>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Latest outbound consignments dispatched across integrated carrier networks
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {searchQuery && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
              <span>Filter: "{searchQuery}"</span>
              {onClearSearch && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="hover:text-blue-900 focus:outline-none"
                  title="Clear filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
          <span className="text-xs text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-mono tabular-nums">
            {filtered.length} of {orders.length} Records
          </span>
        </div>
      </div>

      {/* Responsive Horizontal Scroll Container */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-4 sm:px-5">Order ID</th>
              <th className="py-2.5 px-4">Recipient</th>
              <th className="py-2.5 px-4">Destination</th>
              <th className="py-2.5 px-4">Courier Partner</th>
              <th className="py-2.5 px-4">Amount / Mode</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Dispatch Date</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <SearchX className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-700 text-xs">No matching consignments found</p>
                    <p className="text-[11px] text-slate-400">
                      Try searching by city (e.g. "Mumbai"), carrier ("Blue Dart"), or AWB
                    </p>
                    {onClearSearch && (
                      <button
                        type="button"
                        onClick={onClearSearch}
                        className="mt-1 text-xs text-blue-600 font-semibold hover:underline"
                      >
                        Reset search filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((order) => {
                const statusConfig = STATUS_STYLES[order.status] || {
                  badge: 'bg-slate-100 text-slate-700 border-slate-200',
                  dot: 'bg-slate-400'
                };

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Order ID */}
                    <td className="py-2.5 px-4 sm:px-5 font-bold text-slate-900 font-mono tabular-nums whitespace-nowrap">
                      {order.orderNumber}
                    </td>

                    {/* Customer */}
                    <td className="py-2.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {order.customerName}
                    </td>

                    {/* Destination City & Pincode */}
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{order.destinationCity}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-medium tabular-nums">
                        PIN: {order.destinationPin}
                      </div>
                    </td>

                    {/* Courier Network */}
                    <td className="py-2.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        {order.courierName}
                      </span>
                    </td>

                    {/* Amount & Payment Mode */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 font-mono tabular-nums">{order.amount}</div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-block mt-0.5 shadow-2xs ${
                          order.paymentMode === 'COD'
                            ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                            : 'bg-slate-100 text-slate-600 border-slate-200/80'
                        }`}
                      >
                        {order.paymentMode}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusConfig.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                        {order.status}
                      </span>
                    </td>

                    {/* Dispatch Date */}
                    <td className="py-2.5 px-4 text-slate-500 text-[11px] font-mono tabular-nums whitespace-nowrap">
                      {order.date}
                    </td>

                    {/* Action Button */}
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewOrder && onViewOrder(order)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-100 border border-blue-200/70 transition-all shadow-2xs"
                      >
                        <span>View</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
