import React from 'react';
import { DEMO_STATUS_DISTRIBUTION } from '../data/demoData';

export const StatusDistribution: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-card space-y-4 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Consignment Lifecycle Breakdown
          </h3>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Active distribution across delivery lifecycle stages (30-day aggregate: 1,428 orders)
          </p>
        </div>
        <span className="self-start sm:self-auto text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80 inline-flex items-center gap-1.5 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          94.2% On-Time SLA
        </span>
      </div>

      {/* Proportional Segmented Progress Bar */}
      <div className="space-y-1.5">
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-200/60">
          {DEMO_STATUS_DISTRIBUTION.map((item) => (
            <div
              key={item.label}
              style={{ width: `${item.percentage}%` }}
              className={`${item.colorClass} h-full rounded-xs transition-all first:rounded-l-full last:rounded-r-full`}
              title={`${item.label}: ${item.count.toLocaleString()} (${item.percentage}%)`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5 font-mono tabular-nums">
          <span>0%</span>
          <span>50%</span>
          <span>100% (1,428 consignments)</span>
        </div>
      </div>

      {/* Structured Legend Grid with Consistent Alignment */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {DEMO_STATUS_DISTRIBUTION.map((item) => (
          <div
            key={item.label}
            className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col justify-between space-y-2 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            {/* Top: Status Name & Percentage Pill */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${item.colorClass}`} />
                <span className="text-xs font-semibold text-slate-700 truncate">{item.label}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-900 bg-white px-2 py-0.5 rounded-full border border-slate-200/80 shrink-0 font-mono tabular-nums shadow-2xs">
                {item.percentage}%
              </span>
            </div>

            {/* Bottom: Count and Context */}
            <div className="flex items-baseline justify-between pt-1 border-t border-slate-200/50">
              <span className="text-base sm:text-lg font-bold text-slate-900 font-mono tabular-nums tracking-tight">
                {item.count.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">orders</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
