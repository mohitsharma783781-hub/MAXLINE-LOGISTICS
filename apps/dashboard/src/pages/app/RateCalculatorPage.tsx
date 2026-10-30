import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Zap,
  Star,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Info,
  Sliders,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button, Card, Input, Badge, Drawer } from '../../components/ui';
import { B2BPricingEngine } from '../../services/b2bPricingEngine';
import { B2CPricingEngine } from '../../services/b2cPricingEngine';
import { useTenant } from '../../context/TenantContext';

export interface CourierRateItem {
  id: string;
  mode: 'B2B' | 'B2C';
  courierId: string;
  courierName: string;
  serviceName: string;
  logoBgColor: string;
  logoTextColor: string;
  serviceType: 'Surface' | 'Air' | 'Express' | 'Cargo';
  rating: number;
  transitTime: string;
  originPincode: string;
  originZone: string;
  destinationPincode: string;
  destinationZone: string;
  zoneRoute: string;

  deadWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  weightDivider: number;

  baseFreight: number;
  rawFreight: number;
  minFreight: number;
  isMinFreightApplied: boolean;
  ratePerKg: number;

  fuelSurcharge: number;
  docketCharges: number;
  codCharges: number;
  fmCharges: number;
  rovCharges: number;
  odaCharges: number;
  handlingCharges: number;

  subtotalAmount: number;
  gstPercent: number;
  gstAmount: number;
  finalPrice: number;

  rateCardName: string;
  rateCardVersion: string;
  specialNotes?: string[];
}

export const RateCalculatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId && activeTenantId !== 'ALL' ? activeTenantId : 'tenant-demo-01';

  // Mode Selection: B2C vs B2B
  const [activeTab, setActiveTab] = useState<'B2C' | 'B2B'>('B2C');

  // Form Fields State
  const [fromPincode, setFromPincode] = useState<string>('173205');
  const [toPincode, setToPincode] = useState<string>('302020');
  const [deadWeight, setDeadWeight] = useState<string>('1.5');
  const [showDimensions, setShowDimensions] = useState<boolean>(false);
  const [lengthCm, setLengthCm] = useState<string>('30');
  const [widthCm, setWidthCm] = useState<string>('20');
  const [heightCm, setHeightCm] = useState<string>('20');
  const [paymentType, setPaymentType] = useState<'PREPAID' | 'COD'>('PREPAID');
  const [codAmount, setCodAmount] = useState<string>('1500');
  const [invoiceValue, setInvoiceValue] = useState<string>('2500');

  // Interaction State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'transit' | 'rating'>('price');
  const [selectedBreakdown, setSelectedBreakdown] = useState<CourierRateItem | null>(null);

  // Results State
  const [b2cResults, setB2cResults] = useState<CourierRateItem[]>([]);
  const [b2bResults, setB2bResults] = useState<CourierRateItem[]>([]);

  // Chargeable Weight Math
  const chargeableWeight = useMemo(() => {
    const dead = parseFloat(deadWeight) || 0;
    if (!showDimensions) return dead;
    const l = parseFloat(lengthCm) || 0;
    const w = parseFloat(widthCm) || 0;
    const h = parseFloat(heightCm) || 0;
    const vol = (l * w * h) / 5000;
    return Math.max(dead, Math.round(vol * 100) / 100);
  }, [deadWeight, lengthCm, widthCm, heightCm, showDimensions]);

  // Main Calculation Action
  const handleCalculateRates = () => {
    setValidationError(null);

    if (!fromPincode.trim() || !/^\d{6}$/.test(fromPincode.trim())) {
      setValidationError('Please enter a valid 6-digit Pickup Pincode.');
      return;
    }

    if (!toPincode.trim() || !/^\d{6}$/.test(toPincode.trim())) {
      setValidationError('Please enter a valid 6-digit Delivery Pincode.');
      return;
    }

    const deadWt = parseFloat(deadWeight);
    if (isNaN(deadWt) || deadWt <= 0) {
      setValidationError('Please enter a valid weight in KG.');
      return;
    }

    setIsLoading(true);
    setHasCalculated(false);

    setTimeout(() => {
      // Execute pricing engines
      B2BPricingEngine.calculateB2BRate({
        tenantId,
        courierId: 'delhivery',
        originPincode: fromPincode,
        destinationPincode: toPincode,
        actualWeightGrams: Math.round(deadWt * 1000),
        lengthCm: parseFloat(lengthCm) || 0,
        widthCm: parseFloat(widthCm) || 0,
        heightCm: parseFloat(heightCm) || 0,
        invoiceValuePaise: Math.round((parseFloat(invoiceValue) || 2500) * 100),
        codAmountPaise: paymentType === 'COD' ? Math.round((parseFloat(codAmount) || 0) * 100) : 0,
        enableInsurance: false,
      });

      B2CPricingEngine.calculateB2CRate({
        tenantId,
        courierId: 'delhivery',
        originPincode: fromPincode,
        destinationPincode: toPincode,
        actualWeightGrams: Math.round(deadWt * 1000),
        paymentType,
        codAmountPaise: paymentType === 'COD' ? Math.round((parseFloat(codAmount) || 0) * 100) : 0,
      });

      const origZone = B2BPricingEngine.resolveZoneFromPincode(fromPincode);
      const destZone = B2BPricingEngine.resolveZoneFromPincode(toPincode);
      const routeStr = `${origZone} → ${destZone}`;

      const l = parseFloat(lengthCm) || 0;
      const w = parseFloat(widthCm) || 0;
      const h = parseFloat(heightCm) || 0;

      // Generate Clean B2C Partners
      const b2cPartners = [
        {
          courierId: 'delhivery-express',
          courierName: 'Delhivery Surface Express',
          serviceName: 'Standard Surface Shipping',
          logoBgColor: '#0284c7',
          logoTextColor: '#ffffff',
          serviceType: 'Express' as const,
          rating: 4.8,
          transitTime: '2-3 Days',
          basePrice: 38,
          additionalPricePer500g: 28,
        },
        {
          courierId: 'bluedart-air',
          courierName: 'Blue Dart Air Express',
          serviceName: 'Priority Air Freight',
          logoBgColor: '#2563eb',
          logoTextColor: '#ffffff',
          serviceType: 'Air' as const,
          rating: 4.9,
          transitTime: '1-2 Days',
          basePrice: 65,
          additionalPricePer500g: 45,
        },
        {
          courierId: 'dtcd-surface',
          courierName: 'DTDC Surface Economy',
          serviceName: 'Ground Parcel Courier',
          logoBgColor: '#4f46e5',
          logoTextColor: '#ffffff',
          serviceType: 'Surface' as const,
          rating: 4.6,
          transitTime: '3-4 Days',
          basePrice: 32,
          additionalPricePer500g: 22,
        },
      ];

      const generatedB2C: CourierRateItem[] = b2cPartners.map((partner) => {
        const itemVolWeight = Math.round(((l * w * h) / 5000) * 100) / 100;
        const itemChargeableWt = Math.max(deadWt, itemVolWeight);
        const extraWeightKg = Math.max(0, itemChargeableWt - 0.5);
        const extraUnits = Math.ceil(extraWeightKg / 0.5);
        const baseFreight = partner.basePrice + extraUnits * partner.additionalPricePer500g;

        const fuelSurcharge = Math.round(baseFreight * 0.08 * 100) / 100;
        const docketCharges = 10;
        const fmCharges = 10;
        const codCharges = paymentType === 'COD' ? Math.max(35, Math.round((parseFloat(codAmount) || 0) * 0.015)) : 0;
        const subtotal = baseFreight + fuelSurcharge + docketCharges + fmCharges + codCharges;
        const gstAmount = Math.round(subtotal * 0.18 * 100) / 100;
        const finalPrice = Math.round((subtotal + gstAmount) * 100) / 100;

        return {
          id: `b2c-${partner.courierId}`,
          mode: 'B2C',
          courierId: partner.courierId,
          courierName: partner.courierName,
          serviceName: partner.serviceName,
          logoBgColor: partner.logoBgColor,
          logoTextColor: partner.logoTextColor,
          serviceType: partner.serviceType,
          rating: partner.rating,
          transitTime: partner.transitTime,
          originPincode: fromPincode,
          originZone: origZone,
          destinationPincode: toPincode,
          destinationZone: destZone,
          zoneRoute: routeStr,
          deadWeightKg: deadWt,
          volumetricWeightKg: itemVolWeight,
          chargeableWeightKg: itemChargeableWt,
          weightDivider: 5000,
          baseFreight,
          rawFreight: baseFreight,
          minFreight: partner.basePrice,
          isMinFreightApplied: false,
          ratePerKg: partner.additionalPricePer500g * 2,
          fuelSurcharge,
          docketCharges,
          codCharges,
          fmCharges,
          rovCharges: 0,
          odaCharges: 0,
          handlingCharges: 0,
          subtotalAmount: subtotal,
          gstPercent: 18,
          gstAmount,
          finalPrice,
          rateCardName: `${partner.courierName} Standard B2C Matrix`,
          rateCardVersion: 'v2.0',
        };
      });

      // Generate Clean B2B Partners
      const b2bPartners = [
        {
          courierId: 'delhivery-freight',
          courierName: 'Delhivery Freight Network',
          serviceName: 'Commercial Multi-Carrier LTL Freight',
          logoBgColor: '#0284c7',
          logoTextColor: '#ffffff',
          serviceType: 'Cargo' as const,
          rating: 4.8,
          transitTime: '2-3 Days',
          ratePerKg: 4.5,
          minFreight: 250,
        },
        {
          courierId: 'spoton-cargo',
          courierName: 'Spoton Commercial Direct',
          serviceName: 'Bulk Surface Logistics',
          logoBgColor: '#059669',
          logoTextColor: '#ffffff',
          serviceType: 'Surface' as const,
          rating: 4.7,
          transitTime: '3-4 Days',
          ratePerKg: 4.2,
          minFreight: 220,
        },
      ];

      const generatedB2B: CourierRateItem[] = b2bPartners.map((partner) => {
        const itemVolWeight = Math.round(((l * w * h) / 5000) * 100) / 100;
        const itemChargeableWt = Math.max(deadWt, itemVolWeight);
        const rawFreight = Math.round(itemChargeableWt * partner.ratePerKg * 100) / 100;
        const baseFreight = Math.max(rawFreight, partner.minFreight);
        const fuelSurcharge = Math.round(baseFreight * 0.08 * 100) / 100;
        const docketCharges = 20;
        const fmCharges = 15;
        const subtotal = baseFreight + fuelSurcharge + docketCharges + fmCharges;
        const gstAmount = Math.round(subtotal * 0.18 * 100) / 100;
        const finalPrice = Math.round((subtotal + gstAmount) * 100) / 100;

        return {
          id: `b2b-${partner.courierId}`,
          mode: 'B2B',
          courierId: partner.courierId,
          courierName: partner.courierName,
          serviceName: partner.serviceName,
          logoBgColor: partner.logoBgColor,
          logoTextColor: partner.logoTextColor,
          serviceType: partner.serviceType,
          rating: partner.rating,
          transitTime: partner.transitTime,
          originPincode: fromPincode,
          originZone: origZone,
          destinationPincode: toPincode,
          destinationZone: destZone,
          zoneRoute: routeStr,
          deadWeightKg: deadWt,
          volumetricWeightKg: itemVolWeight,
          chargeableWeightKg: itemChargeableWt,
          weightDivider: 5000,
          baseFreight,
          rawFreight,
          minFreight: partner.minFreight,
          isMinFreightApplied: rawFreight < partner.minFreight,
          ratePerKg: partner.ratePerKg,
          fuelSurcharge,
          docketCharges,
          codCharges: 0,
          fmCharges,
          rovCharges: 0,
          odaCharges: 0,
          handlingCharges: 0,
          subtotalAmount: subtotal,
          gstPercent: 18,
          gstAmount,
          finalPrice,
          rateCardName: `${partner.courierName} B2B Cargo Rate Matrix`,
          rateCardVersion: 'v2.0',
        };
      });

      setB2cResults(generatedB2C);
      setB2bResults(generatedB2B);
      setIsLoading(false);
      setHasCalculated(true);
    }, 350);
  };

  const handleSelectAndBook = (item: CourierRateItem) => {
    localStorage.setItem('active_selected_rate_quote', JSON.stringify(item));
    navigate('/app/orders/create', {
      state: {
        prefilledCourier: item,
        fromPincode,
        toPincode,
        actualWeight: deadWeight,
        lengthCm,
        widthCm,
        heightCm,
        paymentType,
        codAmount,
        invoiceValue,
        mode: item.mode,
      },
    });
  };

  const activeResults = activeTab === 'B2C' ? b2cResults : b2bResults;
  const sortedResults = useMemo(() => {
    return [...activeResults].sort((a, b) => {
      if (sortBy === 'price') return a.finalPrice - b.finalPrice;
      if (sortBy === 'rating') return b.rating - a.rating;
      return a.transitTime.localeCompare(b.transitTime);
    });
  }, [activeResults, sortBy]);

  const minPrice = sortedResults.length > 0 ? Math.min(...sortedResults.map((r) => r.finalPrice)) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* PAGE HEADER */}
      <PageHeader
        title="Shipping Rate Calculator"
        description="Instantly estimate shipping costs, compare courier partners, and book shipments."
        breadcrumbs={[
          { label: 'Merchant Portal', path: '/app' },
          { label: 'Rate Calculator', path: '/app/rates' },
        ]}
      />

      {validationError && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#991b1b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{validationError}</span>
        </div>
      )}

      {/* SLEEK FORM CARD */}
      <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        
        {/* MODE SELECTOR SEGMENT TABS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
          <button
            type="button"
            onClick={() => setActiveTab('B2C')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'B2C' ? '#ffffff' : 'transparent',
              color: activeTab === 'B2C' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'B2C' ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: activeTab === 'B2C' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Zap size={15} style={{ color: activeTab === 'B2C' ? '#0284c7' : '#64748b' }} />
            B2C Express Parcel
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('B2B')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'B2B' ? '#ffffff' : 'transparent',
              color: activeTab === 'B2B' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'B2B' ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: activeTab === 'B2B' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Truck size={15} style={{ color: activeTab === 'B2B' ? '#16a34a' : '#64748b' }} />
            B2B Heavy Cargo (LTL)
          </button>
        </div>

        {/* INPUT FORM GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          
          {/* Pickup Pincode */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
              Pickup Pincode *
            </label>
            <Input
              value={fromPincode}
              onChange={(e) => setFromPincode(e.target.value)}
              maxLength={6}
              placeholder="173205"
            />
          </div>

          {/* Delivery Pincode */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
              Delivery Pincode *
            </label>
            <Input
              value={toPincode}
              onChange={(e) => setToPincode(e.target.value)}
              maxLength={6}
              placeholder="302020"
            />
          </div>

          {/* Dead Weight */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
              Weight (KG) *
            </label>
            <Input
              type="number"
              step="0.1"
              value={deadWeight}
              onChange={(e) => setDeadWeight(e.target.value)}
              placeholder="1.5"
            />
          </div>

          {/* Payment Mode Segment */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
              Payment Type
            </label>
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px', height: '40px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setPaymentType('PREPAID')}
                style={{
                  flex: 1,
                  height: '34px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: paymentType === 'PREPAID' ? '#ffffff' : 'transparent',
                  color: paymentType === 'PREPAID' ? '#0f172a' : '#64748b',
                  fontWeight: paymentType === 'PREPAID' ? '700' : '500',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: paymentType === 'PREPAID' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                Prepaid
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('COD')}
                style={{
                  flex: 1,
                  height: '34px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: paymentType === 'COD' ? '#ffffff' : 'transparent',
                  color: paymentType === 'COD' ? '#0f172a' : '#64748b',
                  fontWeight: paymentType === 'COD' ? '700' : '500',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: paymentType === 'COD' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                COD
              </button>
            </div>
          </div>

        </div>

        {/* QUICK WEIGHT PRESETS & OPTIONAL DIMENSIONS TOGGLE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
          
          {/* Quick Weight Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Quick Weights:</span>
            {['0.5', '1.0', '2.0', '5.0', '10.0'].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setDeadWeight(w)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: deadWeight === w ? '1px solid #0284c7' : '1px solid #e2e8f0',
                  backgroundColor: deadWeight === w ? '#eff6ff' : '#ffffff',
                  color: deadWeight === w ? '#0284c7' : '#475569',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {w} KG
              </button>
            ))}
          </div>

          {/* Dimensions Toggle Button */}
          <button
            type="button"
            onClick={() => setShowDimensions(!showDimensions)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <Sliders size={13} />
            {showDimensions ? 'Hide Box Dimensions' : '+ Add Box Dimensions (L × W × H)'}
            {showDimensions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* COLLAPSIBLE DIMENSIONS BOX */}
        {showDimensions && (
          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Length (CM)</label>
              <Input type="number" value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} placeholder="30" />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Width (CM)</label>
              <Input type="number" value={widthCm} onChange={(e) => setWidthCm(e.target.value)} placeholder="20" />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Height (CM)</label>
              <Input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="20" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Chargeable Weight</span>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>{chargeableWeight} KG</strong>
            </div>
          </div>
        )}

        {/* CALCULATE BUTTON */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCalculateRates}
            disabled={isLoading}
            style={{ padding: '12px 36px', fontSize: '14px', fontWeight: '700', backgroundColor: '#0284c7', borderColor: '#0284c7', borderRadius: '10px' }}
          >
            {isLoading ? 'Fetching Courier Rates...' : 'Calculate Shipping Rates →'}
          </Button>
        </div>

      </Card>

      {/* RESULTS DISPLAY */}
      {hasCalculated && !isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* RESULTS HEADER & SORT */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
              Available Shipping Options ({sortedResults.length} couriers found)
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Sort By:</span>
              {['price', 'transit', 'rating'].map((sort) => (
                <button
                  key={sort}
                  type="button"
                  onClick={() => setSortBy(sort as any)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: sortBy === sort ? '#0f172a' : '#f1f5f9',
                    color: sortBy === sort ? '#ffffff' : '#475569',
                    fontSize: '11px',
                    fontWeight: sortBy === sort ? '700' : '500',
                    cursor: 'pointer',
                  }}
                >
                  {sort === 'price' ? 'Lowest Price' : sort === 'transit' ? 'Fastest Delivery' : 'Highest Rating'}
                </button>
              ))}
            </div>
          </div>

          {/* COURIER RESULT CARDS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {sortedResults.map((item) => {
              const isCheapest = item.finalPrice === minPrice;
              const isFastest = item.serviceType === 'Air' || item.transitTime.includes('1-2');

              return (
                <Card
                  key={item.id}
                  style={{
                    padding: '20px',
                    backgroundColor: '#ffffff',
                    border: isCheapest ? '2px solid #22c55e' : '1px solid #e2e8f0',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: isCheapest ? '0 4px 12px rgba(34,197,94,0.1)' : '0 1px 3px rgba(0,0,0,0.03)',
                    position: 'relative',
                  }}
                >
                  <div>
                    {/* Top Row: Courier Logo, Name & Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: item.logoBgColor, color: item.logoTextColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>
                          {item.courierName.charAt(0)}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                            {item.courierName}
                          </h4>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{item.serviceName}</span>
                        </div>
                      </div>

                      {isCheapest ? (
                        <Badge variant="success">BEST VALUE</Badge>
                      ) : isFastest ? (
                        <Badge variant="info">FASTEST</Badge>
                      ) : (
                        <Badge variant="neutral">{item.serviceType}</Badge>
                      )}
                    </div>

                    {/* Transit Time & Rating Pills */}
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#475569', marginBottom: '16px' }}>
                      <span>🚚 <strong>{item.transitTime}</strong></span>
                      <span>⭐ <strong>{item.rating} / 5.0</strong></span>
                    </div>

                    {/* Price Display */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
                        ₹ {item.finalPrice.toFixed(2)}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>(incl. GST)</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedBreakdown(item)}
                      style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                    >
                      View Breakdown
                    </button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSelectAndBook(item)}
                      rightIcon={<ArrowRight size={14} />}
                      style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', borderRadius: '8px', fontWeight: '700' }}
                    >
                      Ship Now
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* BREAKDOWN DRAWER */}
      <Drawer
        isOpen={!!selectedBreakdown}
        onClose={() => setSelectedBreakdown(null)}
        title="Freight Charge Breakdown"
        position="right"
      >
        {selectedBreakdown && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <strong style={{ fontSize: '16px', color: '#0f172a', display: 'block' }}>{selectedBreakdown.courierName}</strong>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Route: {selectedBreakdown.originPincode} ➔ {selectedBreakdown.destinationPincode} ({selectedBreakdown.chargeableWeightKg} KG)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Base Freight:</span>
                <strong style={{ color: '#0f172a' }}>₹ {selectedBreakdown.baseFreight.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Fuel Surcharge:</span>
                <span>₹ {selectedBreakdown.fuelSurcharge.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Docket & Handling:</span>
                <span>₹ {(selectedBreakdown.docketCharges + selectedBreakdown.fmCharges).toFixed(2)}</span>
              </div>
              {selectedBreakdown.codCharges > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>COD Fee:</span>
                  <span>₹ {selectedBreakdown.codCharges.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
                <span style={{ color: '#64748b' }}>GST (18%):</span>
                <span>₹ {selectedBreakdown.gstAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#f0fdf4', padding: '10px 12px', borderRadius: '8px', marginTop: '6px' }}>
                <strong style={{ color: '#166534' }}>Total Payable:</strong>
                <strong style={{ color: '#166534', fontSize: '16px' }}>₹ {selectedBreakdown.finalPrice.toFixed(2)}</strong>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => {
                const item = selectedBreakdown;
                setSelectedBreakdown(null);
                handleSelectAndBook(item);
              }}
              style={{ width: '100%', marginTop: '12px', backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            >
              Ship Now with {selectedBreakdown.courierName}
            </Button>
          </div>
        )}
      </Drawer>

    </div>
  );
};
