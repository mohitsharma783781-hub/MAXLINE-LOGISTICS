import React, { useState, useMemo } from 'react';
import {
  Calculator,
  MapPin,
  Box,
  Truck,
  IndianRupee,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { DEMO_WAREHOUSES, CARRIER_CATALOG, DEMO_ZONE_TARIFFS } from '../data/rateData';
import { RateEstimate } from '../types/dashboard';

export const RateCalculator: React.FC = () => {
  // Input states
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(DEMO_WAREHOUSES[0].id);
  const [destinationPin, setDestinationPin] = useState<string>('560001'); // Default to Bengaluru
  const [destinationCity, setDestinationCity] = useState<string>('Bengaluru, Karnataka');
  const [deadWeightKg, setDeadWeightKg] = useState<number>(0.8);
  const [lengthCm, setLengthCm] = useState<number>(20);
  const [widthCm, setWidthCm] = useState<number>(15);
  const [heightCm, setHeightCm] = useState<number>(10);
  const [paymentMode, setPaymentMode] = useState<'Prepaid' | 'COD'>('Prepaid');
  const [codAmount, setCodAmount] = useState<number>(1850);
  const [sortBy, setSortBy] = useState<'cost' | 'speed' | 'rating'>('cost');
  const [selectedCarrier, setSelectedCarrier] = useState<RateEstimate | null>(null);

  // Selected Origin Warehouse
  const originWarehouse = useMemo(() => {
    return DEMO_WAREHOUSES.find((w) => w.id === selectedWarehouseId) || DEMO_WAREHOUSES[0];
  }, [selectedWarehouseId]);

  // Volumetric weight calculation: (L x W x H in cm) / 5000
  const volumetricWeightKg = useMemo(() => {
    const vol = (lengthCm * widthCm * heightCm) / 5000;
    return Math.round(vol * 100) / 100;
  }, [lengthCm, widthCm, heightCm]);

  // Chargeable weight is the higher of actual vs volumetric, minimum 0.5kg
  const chargeableWeightKg = useMemo(() => {
    const rawMax = Math.max(deadWeightKg, volumetricWeightKg, 0.5);
    return Math.round(rawMax * 100) / 100;
  }, [deadWeightKg, volumetricWeightKg]);

  // Determine Zone code based on simple demo heuristic
  const detectedZone = useMemo(() => {
    const dest = destinationPin.trim();
    const orig = originWarehouse.pincode;

    if (dest.slice(0, 3) === orig.slice(0, 3)) {
      return DEMO_ZONE_TARIFFS[0]; // Zone A (Within City)
    }
    if (dest[0] === orig[0]) {
      return DEMO_ZONE_TARIFFS[1]; // Zone B (Within State / Region)
    }
    // Metros (Delhi 11, Mumbai 40, Bengaluru 56, Kolkata 70, Chennai 60, Hyderabad 50)
    const metroPrefixes = ['11', '40', '56', '70', '60', '50'];
    if (metroPrefixes.some((p) => dest.startsWith(p)) && metroPrefixes.some((p) => orig.startsWith(p))) {
      return DEMO_ZONE_TARIFFS[2]; // Zone C (Metro to Metro)
    }
    // Remote / Special (NE 78/79, J&K 18/19, Kerala 67/68/69)
    if (['18', '19', '78', '79'].some((p) => dest.startsWith(p))) {
      return DEMO_ZONE_TARIFFS[4]; // Zone E (Special)
    }
    return DEMO_ZONE_TARIFFS[3]; // Zone D (Rest of India)
  }, [destinationPin, originWarehouse]);

  // Calculate dynamic carrier rate quotes
  const carrierEstimates: RateEstimate[] = useMemo(() => {
    // Number of 500g slabs
    const slabs = Math.ceil(chargeableWeightKg / 0.5);
    const extraSlabs = Math.max(0, slabs - 1);

    const baseFreightStandard = detectedZone.baseRateInr + extraSlabs * detectedZone.addlRateInr;

    // COD handling fee
    let codFeeCalculated = 0;
    if (paymentMode === 'COD') {
      const percentageFee = (codAmount * detectedZone.codPercent) / 100;
      codFeeCalculated = Math.max(detectedZone.codMinFeeInr, Math.round(percentageFee));
    }

    const estimates: RateEstimate[] = CARRIER_CATALOG.map((carrier) => {
      const rawBase = Math.round(baseFreightStandard * carrier.multiplier);
      const fuel = Math.round(rawBase * 0.1); // 10% fuel surcharge
      const subtotal = rawBase + fuel + codFeeCalculated;
      const gst = Math.round(subtotal * 0.18); // 18% GST
      const total = subtotal + gst;

      // Adjust expected days for air vs surface
      const days = carrier.mode === 'Air' ? Math.max(1, carrier.baseDays) : carrier.baseDays + (detectedZone.zoneCode === 'E' ? 3 : 0);

      return {
        courierId: carrier.id,
        courierName: carrier.name,
        serviceType: carrier.mode,
        expectedDays: days,
        baseFreight: rawBase,
        fuelSurcharge: fuel,
        codFee: codFeeCalculated,
        gstAmount: gst,
        totalCost: total,
        rating: carrier.rating,
        badge: carrier.badge
      };
    });

    // Sort according to selection
    if (sortBy === 'cost') {
      return estimates.sort((a, b) => a.totalCost - b.totalCost);
    }
    if (sortBy === 'speed') {
      return estimates.sort((a, b) => a.expectedDays - b.expectedDays);
    }
    return estimates.sort((a, b) => b.rating - a.rating);
  }, [chargeableWeightKg, detectedZone, paymentMode, codAmount, sortBy]);

  // Quick reset helper
  const handleReset = () => {
    setDeadWeightKg(0.8);
    setLengthCm(20);
    setWidthCm(15);
    setHeightCm(10);
    setPaymentMode('Prepaid');
    setCodAmount(1850);
    setSelectedCarrier(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-200">
            <Calculator className="w-3 h-3" />
            <span>Interactive Freight Quotation</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
            Domestic Multi-Carrier Rate Calculator
          </h2>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Compare dynamic shipping rates across Delhivery, Blue Dart, DTDC, and Xpressbees based on origin, destination, and chargeable weight.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Inputs</span>
        </button>
      </div>

      {/* Main Grid: Inputs on Left, Real-time Quotes on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Shipment Parameters (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/70 p-5 shadow-card space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Shipment Parameters</span>
            <span className="text-[11px] font-semibold text-blue-600 lowercase">dead vs volumetric</span>
          </h3>

          {/* Origin Warehouse Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Origin Warehouse Hub</span>
            </label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/60 text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
            >
              {DEMO_WAREHOUSES.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.pincode})
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400 block">
              Dispatch Origin: {originWarehouse.city}, {originWarehouse.state}
            </span>
          </div>

          {/* Destination Pincode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Destination Pincode</span>
              </span>
              <span className="text-[11px] text-slate-400">Sample: 560001, 110001, 400050</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                maxLength={6}
                value={destinationPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setDestinationPin(val);
                  if (val.startsWith('56')) setDestinationCity('Bengaluru, Karnataka');
                  else if (val.startsWith('11')) setDestinationCity('New Delhi, Delhi');
                  else if (val.startsWith('40')) setDestinationCity('Mumbai, Maharashtra');
                  else if (val.startsWith('70')) setDestinationCity('Kolkata, West Bengal');
                  else if (val.startsWith('60')) setDestinationCity('Chennai, Tamil Nadu');
                  else if (val.startsWith('19')) setDestinationCity('Srinagar, J&K');
                  else setDestinationCity('Rest of India Destination');
                }}
                placeholder="e.g. 560001"
                className="col-span-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/60 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
              <input
                type="text"
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                placeholder="City, State"
                className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/60 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            {/* Detected Zone Badge */}
            <div className="flex items-center gap-2 pt-1 text-[11px]">
              <span className="font-semibold text-slate-500">Classified Zone:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                Zone {detectedZone.zoneCode} • {detectedZone.zoneName}
              </span>
            </div>
          </div>

          {/* Package Weight & Dimensions */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-slate-600" />
                <span>Actual Weight (Dead Weight)</span>
              </label>
              <span className="text-xs font-mono font-bold text-slate-900">{deadWeightKg} kg</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={15}
              step={0.1}
              value={deadWeightKg}
              onChange={(e) => setDeadWeightKg(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />

            {/* Box Dimensions */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Box Dimensions (L × W × H in cm)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Length (cm)</span>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Width (cm)</span>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={widthCm}
                    onChange={(e) => setWidthCm(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Height (cm)</span>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Volumetric Weight vs Chargeable Comparison Box */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Volumetric: ({lengthCm}×{widthCm}×{heightCm})/5000</span>
                <span className="font-mono font-bold text-slate-700">{volumetricWeightKg} kg</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-200/60">
                <span className="text-slate-900">Chargeable Weight Applied:</span>
                <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {chargeableWeightKg} kg
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-normal">
                {chargeableWeightKg === deadWeightKg
                  ? 'Applied dead weight as it exceeds volumetric weight.'
                  : 'Applied volumetric weight as parcel dimensions are bulkier than actual weight.'}
              </p>
            </div>
          </div>

          {/* Payment Mode (Prepaid vs COD) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 block">
              Payment Collection Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('Prepaid')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                  paymentMode === 'Prepaid'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Prepaid (Zero COD Fee)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('COD')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                  paymentMode === 'COD'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Cash on Delivery (COD)
              </button>
            </div>

            {paymentMode === 'COD' && (
              <div className="pt-2 space-y-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Order Value to Collect:</span>
                  <span className="font-mono font-bold text-slate-900">₹ {codAmount.toLocaleString()}</span>
                </div>
                <div className="relative">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={100}
                    max={50000}
                    step={50}
                    value={codAmount}
                    onChange={(e) => setCodAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">
                  COD Charge: 1.5% or ₹35 minimum (settled via daily T+1 payout).
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Multi-Carrier Quotes & Ranking (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter / Sort Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                {carrierEstimates.length} Available Couriers
              </span>
              <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                for {originWarehouse.pincode} → {destinationPin}
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] font-semibold text-slate-500">Sort by:</span>
              <div className="inline-flex rounded-xl border border-slate-200/80 bg-slate-50 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSortBy('cost')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    sortBy === 'cost' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Lowest Cost
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('speed')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    sortBy === 'speed' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Fastest
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('rating')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    sortBy === 'rating' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rating
                </button>
              </div>
            </div>
          </div>

          {/* Carrier Cards Grid */}
          <div className="space-y-3">
            {carrierEstimates.map((quote) => {
              const isBestValue = quote.badge === 'Best Value';
              const isFastest = quote.badge === 'Fastest';

              return (
                <div
                  key={quote.courierId}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-card hover:shadow-md transition-all hover:border-blue-300 relative ${
                    isBestValue
                      ? 'border-blue-300 bg-blue-50/15 ring-1 ring-blue-100'
                      : 'border-slate-200/70'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Carrier Info */}
                    <div className="space-y-1.5 max-w-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-xs text-slate-800 shrink-0 shadow-2xs">
                          {quote.courierName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                              {quote.courierName}
                            </h4>
                            {quote.badge && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${
                                  isBestValue
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : isFastest
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                <Sparkles className="w-3 h-3" />
                                {quote.badge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                            <span className="inline-flex items-center gap-1">
                              <Truck className="w-3 h-3 text-slate-400" />
                              {quote.serviceType}
                            </span>
                            <span>•</span>
                            <span className="text-amber-600 font-semibold">★ {quote.rating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          Estimated Delivery: <strong>{quote.expectedDays} business days</strong>
                        </span>
                      </div>
                    </div>

                    {/* Price Breakdown & CTA */}
                    <div className="flex flex-col items-start sm:items-end justify-between gap-2 shrink-0">
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                          ₹ {quote.totalCost}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium block sm:text-right">
                          Includes ₹{quote.gstAmount} GST (18%)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedCarrier(quote)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-xs"
                      >
                        <span>Select Rate</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Micro Breakdown Accordion Bar */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Base Freight:</span>
                      <span className="font-mono font-semibold text-slate-700">₹{quote.baseFreight}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Fuel Surcharge:</span>
                      <span className="font-mono font-semibold text-slate-700">₹{quote.fuelSurcharge}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">COD Handling:</span>
                      <span className="font-mono font-semibold text-slate-700">
                        {paymentMode === 'COD' ? `₹${quote.codFee}` : '₹0 (Prepaid)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Chargeable Wt:</span>
                      <span className="font-mono font-semibold text-slate-700">{chargeableWeightKg} kg</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Carrier Toast / Preview Modal */}
      {selectedCarrier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Rate Confirmed: {selectedCarrier.courierName}
                </h3>
                <span className="text-xs text-slate-500">
                  Total Landed Freight: <strong>₹ {selectedCarrier.totalCost}</strong>
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span>Origin Hub:</span>
                <span className="font-semibold">{originWarehouse.city} ({originWarehouse.pincode})</span>
              </div>
              <div className="flex justify-between">
                <span>Destination:</span>
                <span className="font-semibold">{destinationCity} ({destinationPin})</span>
              </div>
              <div className="flex justify-between">
                <span>Chargeable Weight:</span>
                <span className="font-semibold">{chargeableWeightKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery SLA:</span>
                <span className="font-semibold">{selectedCarrier.expectedDays} business days</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Next Step:</strong> Live consignment creation and AWB generation will connect directly to the Delhivery carrier gateway when live credentials are supplied in Phase 3.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedCarrier(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
