import React, { useState } from 'react';
import {
  Tag,
  Download,
  Info,
  Percent,
  Clock,
  Layers
} from 'lucide-react';
import { DEMO_ZONE_TARIFFS, VALUE_ADDED_SERVICES } from '../data/rateData';

export const RateCard: React.FC = () => {
  const [selectedWeightGrams, setSelectedWeightGrams] = useState<number>(500);

  // Calculate estimated cost for each zone at selected sample weight
  const calculateSampleFreight = (baseRate: number, addlRate: number) => {
    if (selectedWeightGrams <= 500) return baseRate;
    const addlSlabs = Math.ceil((selectedWeightGrams - 500) / 500);
    return baseRate + addlSlabs * addlRate;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-200">
            <Tag className="w-3 h-3" />
            <span>Commercial Tariff Agreement</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
            Enterprise Logistics Rate Card
          </h2>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Contractual tariff slabs applicable across India for Domestic B2B and B2C multi-carrier fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            Active Tier: Gold Merchant
          </span>
          <button
            type="button"
            onClick={() => alert('Rate sheet export: Generating PDF/CSV summary...')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Rate Sheet</span>
          </button>
        </div>
      </div>

      {/* Interactive Slab Simulation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Interactive Weight Tariff Simulator</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select or slide parcel weight to see dynamic rate scaling across all 5 geographical shipping zones.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            {[500, 1000, 2000, 5000].map((wt) => (
              <button
                key={wt}
                type="button"
                onClick={() => setSelectedWeightGrams(wt)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  selectedWeightGrams === wt
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {wt >= 1000 ? `${wt / 1000} kg` : `${wt} g`}
              </button>
            ))}
          </div>
        </div>

        {/* 5-Zone Quick Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {DEMO_ZONE_TARIFFS.map((zone) => {
            const cost = calculateSampleFreight(zone.baseRateInr, zone.addlRateInr);
            return (
              <div
                key={zone.zoneCode}
                className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                    Zone {zone.zoneCode}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[80px]">
                    {zone.zoneName.split('(')[0]}
                  </span>
                </div>
                <div className="text-lg font-black text-slate-900 font-mono tracking-tight pt-1">
                  ₹ {cost}.00
                </div>
                <span className="text-[10px] text-slate-400 block">
                  for {selectedWeightGrams >= 1000 ? `${selectedWeightGrams / 1000} kg` : `${selectedWeightGrams}g`} consignment
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Standard Slabs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden shadow-card">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Standard Commercial Tariff Matrix
            </h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Base rate (first 500g) and incremental 500g slab additions by domestic shipping zone
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto font-mono tabular-nums">
            Currency: INR (₹)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4 sm:px-5">Zone</th>
                <th className="py-2.5 px-4">Coverage & Destination Scope</th>
                <th className="py-2.5 px-4">Base 500g</th>
                <th className="py-2.5 px-4">Addl 500g</th>
                <th className="py-2.5 px-4">COD Min Fee</th>
                <th className="py-2.5 px-4">Delivery SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DEMO_ZONE_TARIFFS.map((tariff) => (
                <tr key={tariff.zoneCode} className="hover:bg-slate-50/70 transition-colors">
                  {/* Zone Code */}
                  <td className="py-2.5 px-4 sm:px-5 font-mono font-bold text-slate-900 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black">
                      {tariff.zoneCode}
                    </span>
                  </td>

                  {/* Name and Coverage Scope */}
                  <td className="py-2.5 px-4">
                    <div className="font-bold text-slate-900">{tariff.zoneName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {tariff.description}
                    </div>
                  </td>

                  {/* Base Slab */}
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                    ₹ {tariff.baseRateInr}.00
                  </td>

                  {/* Additional Slab */}
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-700 tabular-nums whitespace-nowrap">
                    + ₹ {tariff.addlRateInr}.00
                  </td>

                  {/* COD Min Fee */}
                  <td className="py-2.5 px-4 font-mono text-slate-700 tabular-nums whitespace-nowrap">
                    ₹ {tariff.codMinFeeInr} ({tariff.codPercent}%)
                  </td>

                  {/* Delivery SLA */}
                  <td className="py-2.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {tariff.zoneCode === 'A'
                        ? '1 – 2 Days'
                        : tariff.zoneCode === 'B'
                        ? '2 – 3 Days'
                        : tariff.zoneCode === 'C'
                        ? '2 – 4 Days'
                        : tariff.zoneCode === 'D'
                        ? '4 – 6 Days'
                        : '5 – 8 Days'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Value-Added Services (VAS) & Operational Rules Grid */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-card space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-emerald-600" />
            <span>Value-Added Services (VAS) & Freight Surcharge Rules</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Clear guidelines on cash on delivery fees, return-to-origin freight, and taxation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {VALUE_ADDED_SERVICES.map((rule) => (
            <div
              key={rule.title}
              className="p-4 rounded-lg bg-slate-50/70 border border-slate-200/80 space-y-2 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-800 leading-snug">{rule.title}</h4>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-blue-700 shrink-0">
                  {rule.rate}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {rule.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Notice & Clarification Alert Box */}
      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/70 text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Tariff Guarantee & Transparent Billing</span>
          <p className="text-[11px] text-blue-800/90 leading-relaxed">
            All freight rates reflect net negotiated B2B tariffs with integrated carriers. Surcharges and weight adjustments are audited automatically against courier telematics to prevent weight dispute discrepancies.
          </p>
        </div>
      </div>
    </div>
  );
};
