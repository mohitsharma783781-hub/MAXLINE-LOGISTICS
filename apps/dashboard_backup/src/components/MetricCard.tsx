import React from 'react';
import { Wallet, Package, Truck, CheckCircle2, IndianRupee, ArrowUpRight } from 'lucide-react';
import { MetricSummary } from '../types/dashboard';

interface MetricCardProps {
  metric: MetricSummary;
}

const TYPE_CONFIG = {
  wallet: {
    icon: Wallet,
    iconBg: 'bg-[#7C3AED] text-white shadow-sm shadow-purple-500/30',
    badgeStyle: 'text-[#7C3AED] bg-[#F5F3FF] border-[#DDD6FE]'
  },
  total: {
    icon: Package,
    iconBg: 'bg-[#2563EB] text-white shadow-sm shadow-blue-500/30',
    badgeStyle: 'text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]'
  },
  transit: {
    icon: Truck,
    iconBg: 'bg-[#0284C7] text-white shadow-sm shadow-sky-500/30',
    badgeStyle: 'text-[#0284C7] bg-[#E0F2FE] border-[#BAE6FD]'
  },
  delivered: {
    icon: CheckCircle2,
    iconBg: 'bg-[#16A34A] text-white shadow-sm shadow-emerald-500/30',
    badgeStyle: 'text-[#16A34A] bg-[#DCFCE7] border-[#BBF7D0]'
  },
  cod: {
    icon: IndianRupee,
    iconBg: 'bg-[#D97706] text-white shadow-sm shadow-amber-500/30',
    badgeStyle: 'text-[#D97706] bg-[#FEF3C7] border-[#FDE68A]'
  }
};

export const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const config = TYPE_CONFIG[metric.type] || TYPE_CONFIG.total;
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      {/* Top Row: Icon Container and Trend / Status Pill */}
      <div className="flex items-center justify-between gap-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        {metric.changeNote && (
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.badgeStyle}`}>
            <ArrowUpRight className="w-3 h-3" />
            <span className="truncate">{metric.changeNote}</span>
          </span>
        )}
      </div>

      {/* Middle: Big Value */}
      <div className="mt-3 mb-1">
        <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight tabular-nums">
          {metric.value}
        </div>
      </div>

      {/* Bottom: Label and Subtext */}
      <div>
        <div className="text-xs font-bold text-slate-900 leading-tight">
          {metric.label}
        </div>
        <div className="text-[11px] text-slate-500 font-normal mt-0.5 leading-snug">
          {metric.description}
        </div>
      </div>
    </div>
  );
};
