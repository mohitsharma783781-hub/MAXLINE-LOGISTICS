import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Truck,
  CheckCircle2,
  Search,
  ShieldCheck,
  Package,
  Zap,
  BarChart3,
  Globe,
  Star,
  Calculator,
  MapPin,
  Clock,
  Activity,
  X,
  Sliders,
  Check,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  Accordion,
  type AccordionItem,
} from '../../components/ui';

export const LandingPage: React.FC = () => {
  // --- STATE FOR AWB SEARCH & TIMELINE MODAL ---
  const [trackingInput, setTrackingInput] = useState('DELHI987654');
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [activeSearchResult, setActiveSearchResult] = useState<{
    awb: string;
    courier: string;
    status: 'Delivered' | 'In Transit' | 'Out for Delivery';
    origin: string;
    destination: string;
    eta: string;
    steps: { title: string; time: string; done: boolean }[];
  }>({
    awb: 'DELHI987654',
    courier: 'Delhivery Express Direct',
    status: 'In Transit',
    origin: 'New Delhi (110001)',
    destination: 'Mumbai (400001)',
    eta: 'Tomorrow by 2:00 PM',
    steps: [
      { title: 'Shipment Registered & AWB Created', time: 'Yesterday, 04:30 PM', done: true },
      { title: 'Picked Up by Delhivery Agent', time: 'Yesterday, 07:15 PM', done: true },
      { title: 'Arrived at Central Sort Facility (Delhi Hub)', time: 'Yesterday, 10:45 PM', done: true },
      { title: 'In Transit on Air Express Cargo', time: 'Today, 06:00 AM', done: true },
      { title: 'Out for Delivery to Recipient', time: 'Pending', done: false },
      { title: 'Delivered to Recipient Doorstep', time: 'Pending', done: false },
    ],
  });

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackingInput.trim().toUpperCase() || 'DELHI987654';
    setActiveSearchResult({
      awb: query,
      courier: query.includes('BLUE') ? 'Bluedart Priority Air' : query.includes('SHADOW') ? 'Shadowfax Local' : 'Delhivery Express Direct',
      status: query.includes('DEL') ? 'Delivered' : 'In Transit',
      origin: 'New Delhi (110001)',
      destination: 'Mumbai (400001)',
      eta: query.includes('DEL') ? 'Delivered Today 11:20 AM' : 'Expected Tomorrow, 2:00 PM',
      steps: [
        { title: 'Shipment Registered & AWB Created', time: '10:00 AM', done: true },
        { title: 'Picked Up by Courier Agent', time: '02:30 PM', done: true },
        { title: 'In Transit (Sort Facility Hub)', time: '07:15 PM', done: true },
        { title: 'Out for Delivery', time: query.includes('DEL') ? '10:15 AM' : 'Pending', done: query.includes('DEL') },
        { title: 'Delivered to Recipient', time: query.includes('DEL') ? '11:20 AM' : 'Pending', done: query.includes('DEL') },
      ],
    });
    setIsTimelineModalOpen(true);
  };

  // --- STATE FOR INTERACTIVE RATE & SAVINGS CALCULATOR ---
  const [calcTab, setCalcTab] = useState<'rates' | 'savings'>('rates');
  const [pickupPincode, setPickupPincode] = useState('110001');
  const [destPincode, setDestPincode] = useState('400001');
  const [weightKg, setWeightKg] = useState<number>(0.5);
  const [paymentType, setPaymentType] = useState<'prepaid' | 'cod'>('prepaid');

  // Savings Calculator state
  const [monthlyVolume, setMonthlyVolume] = useState<number>(1500);

  // Calculated rates
  const baseRate = weightKg * 40;
  const delhiveryRate = (baseRate + 25).toFixed(2);
  const bluedartRate = (baseRate + 48).toFixed(2);
  const xpressbeesRate = (baseRate + 18).toFixed(2);
  const shadowfaxRate = (baseRate + 22).toFixed(2);

  const monthlySavings = (monthlyVolume * 18.5).toLocaleString('en-IN');
  const annualSavings = (monthlyVolume * 18.5 * 12).toLocaleString('en-IN');

  // --- STATE FOR PINCODE SERVICEABILITY SEARCH ---
  const [pincodeQuery, setPincodeQuery] = useState('110001');
  const [pincodeResult, setPincodeResult] = useState<{
    code: string;
    city: string;
    state: string;
    serviceable: boolean;
    codAvailable: boolean;
    airSla: string;
    surfaceSla: string;
    activeCarriers: string[];
  }>({
    code: '110001',
    city: 'New Delhi',
    state: 'Delhi',
    serviceable: true,
    codAvailable: true,
    airSla: '24 Hours',
    surfaceSla: '48 Hours',
    activeCarriers: ['Delhivery Air', 'Blue Dart Priority', 'Xpressbees', 'Shadowfax', 'Ecom Express'],
  });

  const handlePincodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const code = pincodeQuery.trim() || '110001';
    setPincodeResult({
      code,
      city: code.startsWith('4') ? 'Mumbai' : code.startsWith('5') ? 'Bengaluru' : code.startsWith('7') ? 'Kolkata' : 'New Delhi',
      state: code.startsWith('4') ? 'Maharashtra' : code.startsWith('5') ? 'Karnataka' : code.startsWith('7') ? 'West Bengal' : 'Delhi',
      serviceable: true,
      codAvailable: true,
      airSla: '24-36 Hours',
      surfaceSla: '48-72 Hours',
      activeCarriers: ['Delhivery Air', 'Blue Dart Priority', 'Xpressbees', 'Shadowfax', 'DTDC'],
    });
  };

  // --- STATE FOR CARRIER FILTER SHOWCASE ---
  const [carrierFilter, setCarrierFilter] = useState<'all' | 'air' | 'surface' | 'local'>('all');

  const carriersList = [
    { name: 'Delhivery Direct', category: 'air', color: '#dc2626', tag: 'Pan-India Surface & Air', sla: '24-48 Hrs', reach: '29,000+ Pincodes' },
    { name: 'Bluedart Air', category: 'air', color: '#2563eb', tag: 'Fastest Priority SLA', sla: '24 Hrs Priority', reach: '28,500+ Pincodes' },
    { name: 'Xpressbees Express', category: 'surface', color: '#7c3aed', tag: 'Lowest Rate Matrix', sla: '48-72 Hrs', reach: '27,000+ Pincodes' },
    { name: 'Shadowfax Local', category: 'local', color: '#059669', tag: 'Hyperlocal Delivery', sla: 'Same Day / 4 Hrs', reach: 'Metros & Tier 1' },
    { name: 'Ecom Express', category: 'surface', color: '#d97706', tag: 'E-commerce Specialist', sla: '48 Hrs', reach: '27,500+ Pincodes' },
    { name: 'DTDC Courier', category: 'air', color: '#0284c7', tag: 'National Air Cargo', sla: '24-48 Hrs', reach: '29,000+ Pincodes' },
    { name: 'FedEx Express', category: 'air', color: '#4f46e5', tag: 'Global & Domestic Air', sla: '24 Hrs', reach: 'Worldwide' },
    { name: 'DHL International', category: 'air', color: '#e11d48', tag: 'Worldwide Express', sla: '24-48 Hrs Global', reach: '220+ Countries' },
  ];

  const filteredCarriers = carrierFilter === 'all' ? carriersList : carriersList.filter((c) => c.category === carrierFilter);

  // --- LIVE ACTIVITY TICKER BANNER ---
  const [tickerVisible, setTickerVisible] = useState(true);
  const [tickerIndex, setTickerIndex] = useState(0);

  const tickerMessages = [
    '⚡ AWB #DELHI987612 booked from Delhi ➔ Mumbai via Delhivery Air • 2 mins ago',
    '🎉 Merchant #4812 just saved ₹4,200 today using AI Smart Rate Allocation',
    '🚚 AWB #BLUEDART4920 delivered in 18 hours to Bengaluru • On-Time SLA 99.4%',
    '💰 COD Remittance payout batch ₹1,42,000 processed to Merchant Accounts (T+1)',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerMessages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [tickerMessages.length]);

  const faqItems: AccordionItem[] = [
    {
      id: 'faq-1',
      title: 'What is Courrier3 multi-courier platform?',
      content:
        'Courrier3 consolidates 12+ top logistics providers (Delhivery, Bluedart, Xpressbees, Shadowfax, etc.) into a single enterprise dashboard with automated rate optimization, doorstep pickup, 0 hidden surcharges, and instant WhatsApp tracking alerts.',
    },
    {
      id: 'faq-2',
      title: 'How does the AI Smart Courier Recommendation Engine work?',
      content:
        'When you create a shipment, our AI algorithm evaluates live pricing, historical SLA performance, pincode reachability, and hub congestion to highlight the Best Value, Fastest Air, and AI Recommended courier in real-time.',
    },
    {
      id: 'faq-3',
      title: 'What are the COD remittance terms?',
      content:
        'We offer fast daily COD remittance directly into your bank account with complete automated reconciliation ledgers, protecting your e-commerce cash flow.',
    },
    {
      id: 'faq-4',
      title: 'How does Courrier3 cut NDR & RTO losses?',
      content:
        'Our integrated NDR workflow dispatches instant WhatsApp verification messages to buyers upon failed delivery attempts, allowing them to re-schedule or update address in 1 click—cutting RTO rates by up to 40%.',
    },
    {
      id: 'faq-5',
      title: 'Can enterprises get white-label portal access?',
      content:
        'Yes! Enterprise and logistics resellers can map custom domains (e.g. portal.yourbrand.com), upload custom logos, set merchant margin rules, and invite sub-clients.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', backgroundColor: 'var(--color-background)', minHeight: '100vh', fontFamily: 'var(--font-sans)', color: '#0f172a' }}>
      


      {/* 🌟 1. ENTERPRISE SAAS HERO SECTION */}
      <section
        style={{
          position: 'relative',
          background: 'radial-gradient(circle at 80% 20%, #e0f2fe 0%, #ffffff 65%, #f8fafc 100%)',
          paddingTop: 'var(--space-12)',
          paddingBottom: 'var(--space-16)',
          borderBottom: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 var(--space-6)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 'var(--space-12)',
            alignItems: 'center',
          }}
        >
          {/* LEFT COLUMN: Headline & CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* Live Platform Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Badge variant="brand" pulse size="md" style={{ backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '800' }}>
                ⚡ Enterprise Multi-Courier SaaS
              </Badge>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f0fdf4', padding: '4px 10px', borderRadius: '20px', border: '1px solid #bbf7d0' }}>
                <CheckCircle2 size={14} /> 29,000+ Active Pincodes
              </span>
            </div>

            {/* Powerful Headline */}
            <h1
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 3.6rem)',
                fontWeight: '900',
                lineHeight: '1.1',
                color: '#0f172a',
                letterSpacing: '-0.03em',
                margin: 0,
              }}
            >
              Enterprise Multi-Courier Logistics. <br />
              <span style={{ background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Ship Smarter, Save 40% On Freight.
              </span>
            </h1>

            {/* Subheadline */}
            <p style={{ fontSize: '17px', color: '#475569', lineHeight: '1.6', margin: 0, maxWidth: '580px' }}>
              Connect 12+ top courier partners in 1 click. Compare live shipping rates, automate doorstep pickups, cut RTOs by 40% with AI WhatsApp alerts, and track all dispatches across India in real-time.
            </p>

            {/* CTAS */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link to="/signup">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />} style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', fontWeight: '800', height: '48px', padding: '0 24px' }}>
                  Create Free Account
                </Button>
              </Link>
              <a href="#calculator">
                <Button variant="outline" size="lg" leftIcon={<Calculator size={18} />} style={{ fontWeight: '700', borderColor: '#cbd5e1', height: '48px', padding: '0 20px', color: '#1e293b' }}>
                  Calculate Shipping Rate
                </Button>
              </a>
            </div>

            {/* Direct Track Shipment Card */}
            <Card style={{ padding: '16px', background: '#ffffff', borderRadius: '14px', border: '2px solid #bae6fd', boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🔍 Direct Track Shipment
                </span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Live Timeline Drawer</span>
              </div>
              <form onSubmit={handleTrackSearch} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
                  <input
                    type="text"
                    placeholder="Enter AWB or Tracking Number..."
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: '600',
                      outline: 'none',
                    }}
                  />
                </div>
                <Button type="submit" variant="brand" style={{ backgroundColor: '#0284c7', padding: '0 20px', height: '46px', fontWeight: '800' }}>
                  Track Shipment
                </Button>
              </form>

              {/* Demo AWBs */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Try Demo AWBs:</span>
                {['DELHI987654', 'BLUEDART4321', 'SHADOW1122'].map((demoAwb) => (
                  <button
                    key={demoAwb}
                    type="button"
                    onClick={() => {
                      setTrackingInput(demoAwb);
                      setActiveSearchResult({
                        awb: demoAwb,
                        courier: demoAwb.includes('BLUE') ? 'Bluedart Air' : demoAwb.includes('SHADOW') ? 'Shadowfax Local' : 'Delhivery Direct',
                        status: demoAwb.includes('DEL') ? 'Delivered' : 'In Transit',
                        origin: 'New Delhi (110001)',
                        destination: 'Mumbai (400001)',
                        eta: demoAwb.includes('DEL') ? 'Delivered Today 11:20 AM' : 'Expected Tomorrow, 2:00 PM',
                        steps: [
                          { title: 'Shipment Registered & AWB Created', time: '10:00 AM', done: true },
                          { title: 'Picked Up by Courier Agent', time: '02:30 PM', done: true },
                          { title: 'In Transit (Sort Facility Hub)', time: '07:15 PM', done: true },
                          { title: 'Out for Delivery', time: demoAwb.includes('DEL') ? '10:15 AM' : 'Pending', done: demoAwb.includes('DEL') },
                          { title: 'Delivered to Recipient', time: demoAwb.includes('DEL') ? '11:20 AM' : 'Pending', done: demoAwb.includes('DEL') },
                        ],
                      });
                      setIsTimelineModalOpen(true);
                    }}
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#2563eb',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    {demoAwb}
                  </button>
                ))}
              </div>
            </Card>

          </div>

          {/* RIGHT COLUMN: Realistic Enterprise Multi-Courier Control Center Mockup */}
          <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* FLOATING METRIC CALLOUT 1 */}
            <div
              className="animate-float-slow"
              style={{
                position: 'absolute',
                top: '-20px',
                left: '-10px',
                zIndex: 20,
                backgroundColor: '#ffffff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '10px 16px',
                boxShadow: '0 12px 30px -5px rgba(37, 99, 235, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>99.4% On-Time SLA</strong>
                <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '700' }}>Guaranteed Fulfillment</span>
              </div>
            </div>

            {/* FLOATING METRIC CALLOUT 2 */}
            <div
              className="animate-float-reverse"
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                zIndex: 20,
                backgroundColor: '#ffffff',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '10px 16px',
                boxShadow: '0 12px 30px -5px rgba(22, 163, 74, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>29,000+ Pincodes</strong>
                <span style={{ fontSize: '10px', color: '#0284c7', fontWeight: '700' }}>Pan-India Reach</span>
              </div>
            </div>

            {/* UNIFIED CONTROL CENTER CARD */}
            <div
              style={{
                width: '100%',
                maxWidth: '540px',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15)',
                overflow: 'hidden',
                marginTop: '20px',
              }}
            >
              <div style={{ backgroundColor: '#0f172a', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff', letterSpacing: '0.5px' }}>
                    MULTI-COURIER FULFILLMENT ENGINE
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700', backgroundColor: 'rgba(56, 189, 248, 0.12)', padding: '3px 8px', borderRadius: '4px' }}>
                  12 Carriers Connected
                </span>
              </div>

              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Transit Monitor */}
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                      <span>Delhi Hub (110001)</span>
                      <ArrowRight size={14} style={{ color: '#2563eb' }} />
                      <span>Mumbai Hub (400001)</span>
                    </div>
                    <Badge variant="info">In Transit • Air Express</Badge>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ width: '75%', height: '100%', backgroundColor: '#2563eb', borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                    <span>AWB: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>DEL9840192</strong></span>
                    <span>ETA: <strong style={{ color: '#16a34a' }}>Tomorrow by 2:00 PM</strong></span>
                  </div>
                </div>

                {/* Rates Matrix */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                      Live AI Courier Rates (500g Box)
                    </span>
                    <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '700' }}>Instant Allocation</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#0f172a', color: '#ffffff' }}>
                          Delhivery Air
                        </span>
                        <div>
                          <strong style={{ fontSize: '12px', color: '#0f172a', display: 'block' }}>1-2 Days SLA</strong>
                          <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '700' }}>🏆 AI Best Value</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '15px', color: '#15803d' }}>₹ 45.00</strong>
                        <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>98.4% Success</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#dc2626', color: '#ffffff' }}>
                          Blue Dart Priority
                        </span>
                        <div>
                          <strong style={{ fontSize: '12px', color: '#0f172a', display: 'block' }}>1 Day Priority</strong>
                          <span style={{ fontSize: '10px', color: '#1d4ed8', fontWeight: '700' }}>⚡ Fastest SLA</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '15px', color: '#1d4ed8' }}>₹ 68.00</strong>
                        <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>99.2% Success</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#c026d3', color: '#ffffff' }}>
                          Xpressbees
                        </span>
                        <div>
                          <strong style={{ fontSize: '12px', color: '#0f172a', display: 'block' }}>2-3 Days Surface</strong>
                          <span style={{ fontSize: '10px', color: '#7c3aed', fontWeight: '700' }}>Budget Choice</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '15px', color: '#6d28d9' }}>₹ 38.00</strong>
                        <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>96.8% Success</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* FLOATING METRIC CALLOUT 3 */}
            <div
              className="animate-float-slow"
              style={{
                position: 'absolute',
                bottom: '-15px',
                right: '0px',
                zIndex: 20,
                backgroundColor: '#ffffff',
                border: '1px solid #e9d5ff',
                borderRadius: '12px',
                padding: '10px 16px',
                boxShadow: '0 12px 30px -5px rgba(124, 58, 237, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#faf5ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Daily COD Remittances</strong>
                <span style={{ fontSize: '10px', color: '#7c3aed', fontWeight: '700' }}>T+1 Automated Bank Credit</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 🌟 1.5 REAL VENDOR LOGOS DELIVERY NETWORK MARQUEE BANNER */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--space-6) var(--space-6) 0 var(--space-6)', width: '100%' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #e0f2fe 100%)',
            border: '1px solid #bae6fd',
            borderRadius: '20px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.08)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Left Fixed Title Pill */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              paddingRight: '20px',
              borderRight: '2px solid #cbd5e1',
              flexShrink: 0,
              zIndex: 15,
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', lineHeight: '1.1', letterSpacing: '-0.02em' }}>
              Delivery
            </span>
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#0284c7', lineHeight: '1.1', letterSpacing: '-0.02em' }}>
              Network
            </span>
          </div>

          {/* Right Marquee Container */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {/* Fade Edges */}
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '40px', background: 'linear-gradient(90deg, #eff6ff 0%, transparent 100%)', zIndex: 10, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '40px', background: 'linear-gradient(270deg, #e0f2fe 0%, transparent 100%)', zIndex: 10, pointerEvents: 'none' }} />

            <div className="animate-marquee-track" style={{ gap: '14px' }}>
              {[
                // Card 1: DP WORLD (Real Official Logo Image)
                <div key="dpworld" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', padding: '6px 18px', height: '56px', minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/images/carriers/dpworld.png" alt="DP WORLD" style={{ height: '38px', width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                </div>,

                // Card 2: APML
                <div key="apml" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', padding: '10px 22px', height: '56px', minWidth: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <div style={{ width: '22px', height: '22px', backgroundColor: '#dc2626', borderRadius: '4px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>★</div>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: '#991b1b', letterSpacing: '1px' }}>APML</span>
                </div>,

                // Card 3: SAMPARK INDIA
                <div key="sampark" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', padding: '10px 20px', height: '56px', minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{ width: '20px', height: '20px', backgroundColor: '#d97706', borderRadius: '3px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', lineHeight: '1' }}>SAMPARK INDIA</span>
                    <span style={{ fontSize: '10px', color: '#d97706', fontWeight: '700', lineHeight: '1.2' }}>LOGISTICS PVT LTD</span>
                  </div>
                </div>,

                // Card 4: Trackon
                <div key="trackon" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', padding: '10px 22px', height: '56px', minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '17px', fontWeight: '900', color: '#dc2626', fontStyle: 'italic', letterSpacing: '-0.02em' }}>Trackon</span>
                  <span style={{ color: '#ea580c', fontSize: '15px', fontWeight: '900' }}>►</span>
                </div>,

                // Card 5: XP India
                <div key="xpindia" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', padding: '10px 22px', height: '56px', minWidth: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '900', color: '#2563eb' }}>XP</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#ea580c', textTransform: 'uppercase' }}>India</span>
                </div>,

                // Card 6: BLUE DART (Real Official Logo Image)
                <div key="bluedart" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', padding: '6px 18px', height: '56px', minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/images/carriers/bluedart.png" alt="BLUE DART" style={{ height: '36px', width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                </div>,

                // Card 7: DELHIVERY (Real Official Logo Image)
                <div key="delhivery" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', padding: '6px 18px', height: '56px', minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/images/carriers/delhivery.png" alt="DELHIVERY" style={{ height: '34px', width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                </div>,

                // Card 8: ekart LOGISTICS
                <div key="ekart" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', padding: '10px 22px', height: '56px', minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '18px', fontWeight: '900', color: '#f59e0b', fontStyle: 'italic' }}>e</span>
                  <span style={{ fontSize: '17px', fontWeight: '900', color: '#1e3a8a' }}>kart</span>
                </div>,

                // Card 9: XPRESSBEES (Real Official Logo Image)
                <div key="xpressbees" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', padding: '6px 18px', height: '56px', minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/images/carriers/xpressbees.png" alt="XPRESSBEES" style={{ height: '34px', width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                </div>,

                // Card 10: SHADOWFAX
                <div key="shadowfax" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', padding: '10px 22px', height: '56px', minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: '900', color: '#059669', letterSpacing: '0.5px' }}>SHADOWFAX</span>
                </div>,

                // Card 11: DTDC (Real Official Logo Image)
                <div key="dtdc" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', padding: '6px 18px', height: '56px', minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/images/carriers/dtdc.png" alt="DTDC" style={{ height: '36px', width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                </div>,

                // Card 12: ECOM EXPRESS
                <div key="ecom" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', padding: '10px 22px', height: '56px', minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '900', color: '#16a34a', letterSpacing: '0.5px' }}>ECOM EXPRESS</span>
                </div>,

                // DUPLICATE SET FOR SMOOTH INFINITE LOOPING
                <div key="dpworld-2" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', padding: '6px 18px', height: '56px', minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/images/carriers/dpworld.png" alt="DP WORLD" style={{ height: '38px', width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                </div>,
                <div key="apml-2" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', padding: '10px 22px', height: '56px', minWidth: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <div style={{ width: '22px', height: '22px', backgroundColor: '#dc2626', borderRadius: '4px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>★</div>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: '#991b1b', letterSpacing: '1px' }}>APML</span>
                </div>,
                <div key="bluedart-2" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', padding: '6px 18px', height: '56px', minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/images/carriers/bluedart.png" alt="BLUE DART" style={{ height: '36px', width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                </div>,
                <div key="delhivery-2" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', padding: '6px 18px', height: '56px', minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/images/carriers/delhivery.png" alt="DELHIVERY" style={{ height: '34px', width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                </div>,
                <div key="xpressbees-2" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', padding: '6px 18px', height: '56px', minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/images/carriers/xpressbees.png" alt="XPRESSBEES" style={{ height: '34px', width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                </div>,
                <div key="dtdc-2" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', padding: '6px 18px', height: '56px', minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/images/carriers/dtdc.png" alt="DTDC" style={{ height: '36px', width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                </div>,
              ]}
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 1.5. WHY ONLINE SELLERS CHOOSE COURRIER3 SECTION */}
      <section id="why-choose-us" style={{ backgroundColor: '#f8fafc', padding: 'var(--space-16) var(--space-6)', borderBottom: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <Badge variant="brand" size="md" style={{ marginBottom: '12px' }}>
              <Sparkles size={14} style={{ marginRight: '6px' }} /> Trusted By 5,000+ D2C Brands
            </Badge>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
              Why Online Sellers Choose Courrier3
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '640px', margin: '10px auto 0 auto', fontWeight: '500' }}>
              Streamline your e-commerce logistics with automated multi-courier routing, instant COD payouts, and zero setup fees.
            </p>
          </div>

          {/* Main Grid: Left Visual Showcase | Right Feature Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-12)', alignItems: 'center' }}>
            
            {/* Left Column: SaaS Product Laptop Showcase with Floating 3D Elements */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 10px' }}>
              
              {/* Ambient Radial Glow */}
              <div style={{ position: 'absolute', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.18) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />

              {/* Outer Laptop & Real Seller Photo Container */}
              <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '700px' }}>
                
                {/* 4K Real Seller Woman holding Laptop with Ultra-Sharp Sharpened Dashboard Overlay */}
                <div style={{
                  position: 'relative',
                  overflow: 'visible',
                  filter: 'drop-shadow(0 25px 40px rgba(15, 23, 42, 0.2))',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <img
                    src="/images/seller_woman_laptop_transparent_4k.png"
                    alt="Courrier3 Enterprise Seller Portal"
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '560px',
                      objectFit: 'contain',
                      transform: 'scale(1.12)',
                      transformOrigin: 'center center',
                      imageRendering: '-webkit-optimize-contrast'
                    }}
                  />
                </div>

                {/* Floating 3D Elements around the Laptop */}

                {/* Floating 3D Parcel Box Top-Left */}
                <div style={{
                  position: 'absolute',
                  top: '-25px',
                  left: '-20px',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '10px 14px',
                  boxShadow: '0 15px 30px rgba(15, 23, 42, 0.12)',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  zIndex: 10
                }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <Package size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>Multi-Courier</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>12+ Partners Active</div>
                  </div>
                </div>

                {/* Floating 3D Heart/Like Feedback Badge Top-Right */}
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-15px',
                  backgroundColor: '#ffffff',
                  borderRadius: '50%',
                  width: '46px',
                  height: '46px',
                  boxShadow: '0 15px 30px rgba(225, 29, 72, 0.2)',
                  border: '1px solid #fecdd3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  zIndex: 10
                }}>
                  ❤️
                </div>

                {/* Floating 3D Rupee/COD Badge Bottom-Left */}
                <div style={{
                  position: 'absolute',
                  bottom: '-25px',
                  left: '-15px',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '10px 14px',
                  boxShadow: '0 15px 30px rgba(16, 185, 129, 0.15)',
                  border: '1px solid #a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  zIndex: 10
                }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '15px' }}>
                    ₹
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>T+1 COD Remittance</div>
                    <div style={{ fontSize: '9px', color: '#059669', fontWeight: '700' }}>Daily Payouts</div>
                  </div>
                </div>

                {/* Floating 3D Express Truck Bottom-Right */}
                <div style={{
                  position: 'absolute',
                  bottom: '-20px',
                  right: '-20px',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '10px 14px',
                  boxShadow: '0 15px 30px rgba(2, 132, 199, 0.15)',
                  border: '1px solid #bae6fd',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  zIndex: 10
                }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Truck size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>29,000+ Pincodes</div>
                    <div style={{ fontSize: '9px', color: '#0284c7', fontWeight: '700' }}>Pan-India Reach</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column: 3 Sleek Feature Highlight Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Feature Card 01 */}
              <div style={{
                backgroundColor: '#eff6ff',
                borderRadius: '16px',
                padding: '24px 28px',
                border: '1px solid #bfdbfe',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.04)',
                transition: 'all 0.2s ease-in-out',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '900', color: '#2563eb', backgroundColor: '#dbeafe', padding: '3px 9px', borderRadius: '6px' }}>01</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={20} />
                  </div>
                  <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    One Place, Many Couriers
                  </h3>
                </div>
                <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                  Use many courier partners from one Courrier3 account. Compare live freight rates, check pincode coverage, book pickups, and track packages without jumping between different courier websites.
                </p>
              </div>

              {/* Feature Card 02 */}
              <div style={{
                backgroundColor: '#f0fdf4',
                borderRadius: '16px',
                padding: '24px 28px',
                border: '1px solid #bbf7d0',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.04)',
                transition: 'all 0.2s ease-in-out',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '900', color: '#16a34a', backgroundColor: '#dcfce7', padding: '3px 9px', borderRadius: '6px' }}>02</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#16a34a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={20} />
                  </div>
                  <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    COD & Failed Delivery Help (NDR)
                  </h3>
                </div>
                <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                  See your COD money clearly with automated T+1 payouts and fix failed delivery attempts early. That means more successful orders, fewer RTO returns, and zero money stuck in shipping.
                </p>
              </div>

              {/* Feature Card 03 */}
              <div style={{
                backgroundColor: '#f5f3ff',
                borderRadius: '16px',
                padding: '24px 28px',
                border: '1px solid #ddd6fe',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.04)',
                transition: 'all 0.2s ease-in-out',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '900', color: '#7c3aed', backgroundColor: '#ede9fe', padding: '3px 9px', borderRadius: '6px' }}>03</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#7c3aed', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={20} />
                  </div>
                  <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Easy Store & API Connect
                  </h3>
                </div>
                <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                  Link Shopify, WooCommerce, or your custom website via REST API. Create bulk shipping labels, book doorstep pickups, and share live tracking updates automatically as your order count grows.
                </p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 🌟 2. INTERACTIVE LIVE FREIGHT RATE & SAVINGS CALCULATOR SUITE */}
      <section id="calculator" style={{ backgroundColor: '#ffffff', padding: 'var(--space-16) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <Badge variant="brand" size="md">
              <Sparkles size={14} style={{ marginRight: '6px' }} /> Interactive Shipping Suite
            </Badge>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '900', color: '#0f172a', marginTop: 'var(--space-2)' }}>
              Live Courier Rate & ROI Savings Calculator
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '650px', margin: '8px auto 0 auto' }}>
              Estimate live shipping costs across India or calculate your business monthly freight savings with Courrier3 Smart Auto-Routing.
            </p>
          </div>

          {/* Calculator Mode Switcher Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: 'var(--space-8)' }}>
            <button
              onClick={() => setCalcTab('rates')}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: calcTab === 'rates' ? '#2563eb' : '#f1f5f9',
                color: calcTab === 'rates' ? '#ffffff' : '#475569',
                boxShadow: calcTab === 'rates' ? '0 4px 14px rgba(37, 99, 235, 0.25)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Calculator size={18} /> 1. Live Freight Rate Estimator
            </button>
            <button
              onClick={() => setCalcTab('savings')}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: calcTab === 'savings' ? '#16a34a' : '#f1f5f9',
                color: calcTab === 'savings' ? '#ffffff' : '#475569',
                boxShadow: calcTab === 'savings' ? '0 4px 14px rgba(22, 163, 74, 0.25)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Sliders size={18} /> 2. Monthly ROI & Savings Calculator
            </button>
          </div>

          {/* TAB 1: LIVE RATE ESTIMATOR */}
          {calcTab === 'rates' && (
            <Card style={{ padding: 'var(--space-8)', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-8)', alignItems: 'start' }}>
                
                {/* Inputs Left */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Configure Shipment Details</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Pickup Pincode</label>
                      <input
                        type="text"
                        value={pickupPincode}
                        onChange={(e) => setPickupPincode(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '600' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Delivery Pincode</label>
                      <input
                        type="text"
                        value={destPincode}
                        onChange={(e) => setDestPincode(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '600' }}
                      />
                    </div>
                  </div>

                  {/* Weight Slider */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Shipment Weight (Kg)</label>
                      <strong style={{ fontSize: '14px', color: '#2563eb' }}>{weightKg} kg ({weightKg * 1000} grams)</strong>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="10"
                      step="0.5"
                      value={weightKg}
                      onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Payment Type */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Payment Mode</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setPaymentType('prepaid')}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: paymentType === 'prepaid' ? '2px solid #2563eb' : '1px solid #cbd5e1', backgroundColor: paymentType === 'prepaid' ? '#eff6ff' : '#ffffff', color: paymentType === 'prepaid' ? '#1d4ed8' : '#64748b', fontWeight: '800', cursor: 'pointer' }}
                      >
                        Prepaid (0% Fee)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentType('cod')}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: paymentType === 'cod' ? '2px solid #7c3aed' : '1px solid #cbd5e1', backgroundColor: paymentType === 'cod' ? '#faf5ff' : '#ffffff', color: paymentType === 'cod' ? '#7c3aed' : '#64748b', fontWeight: '800', cursor: 'pointer' }}
                      >
                        Cash on Delivery (COD)
                      </button>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#64748b', border: '1px solid #e2e8f0' }}>
                    💡 Rates include door pickup, fuel surcharges, GST, and real-time tracking alerts.
                  </div>
                </div>

                {/* Comparative Live Cards Right */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Live Comparative Rates</h3>
                    <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '700' }}>● Live API Pricing</span>
                  </div>

                  {/* Delhivery */}
                  <div style={{ padding: '14px', borderRadius: '12px', border: '1.5px solid #bbf7d0', backgroundColor: '#f0fdf4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '15px', color: '#0f172a' }}>Delhivery Express Air</strong>
                        <Badge variant="success">🏆 AI Best Value</Badge>
                      </div>
                      <span style={{ fontSize: '12px', color: '#475569', marginTop: '2px', display: 'block' }}>Delivery SLA: 24-48 Hours • Door Pickup Included</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '20px', color: '#15803d' }}>₹ {delhiveryRate}</strong>
                      <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>{paymentType === 'cod' ? '+ ₹30 COD Charge' : 'Inclusive of GST'}</span>
                    </div>
                  </div>

                  {/* Blue Dart */}
                  <div style={{ padding: '14px', borderRadius: '12px', border: '1.5px solid #bfdbfe', backgroundColor: '#eff6ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '15px', color: '#0f172a' }}>Blue Dart Air Priority</strong>
                        <Badge variant="brand">⚡ Fastest SLA</Badge>
                      </div>
                      <span style={{ fontSize: '12px', color: '#475569', marginTop: '2px', display: 'block' }}>Delivery SLA: Guaranteed 24 Hours • Air Cargo</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '20px', color: '#1d4ed8' }}>₹ {bluedartRate}</strong>
                      <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>{paymentType === 'cod' ? '+ ₹30 COD Charge' : 'Inclusive of GST'}</span>
                    </div>
                  </div>

                  {/* Xpressbees */}
                  <div style={{ padding: '14px', borderRadius: '12px', border: '1.5px solid #e9d5ff', backgroundColor: '#faf5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '15px', color: '#0f172a' }}>Xpressbees Surface</strong>
                        <Badge variant="warning">💰 Budget Choice</Badge>
                      </div>
                      <span style={{ fontSize: '12px', color: '#475569', marginTop: '2px', display: 'block' }}>Delivery SLA: 2-4 Days Surface • Economy Heavy Freight</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '20px', color: '#6d28d9' }}>₹ {xpressbeesRate}</strong>
                      <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>{paymentType === 'cod' ? '+ ₹30 COD Charge' : 'Inclusive of GST'}</span>
                    </div>
                  </div>

                  {/* Shadowfax */}
                  <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '15px', color: '#0f172a' }}>Shadowfax Local/Express</strong>
                        <Badge variant="info">🚀 Same Day Metro</Badge>
                      </div>
                      <span style={{ fontSize: '12px', color: '#475569', marginTop: '2px', display: 'block' }}>Delivery SLA: Same Day or Next Day Delivery</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '20px', color: '#0f172a' }}>₹ {shadowfaxRate}</strong>
                      <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>{paymentType === 'cod' ? '+ ₹30 COD Charge' : 'Inclusive of GST'}</span>
                    </div>
                  </div>

                </div>

              </div>
            </Card>
          )}

          {/* TAB 2: MONTHLY SAVINGS CALCULATOR SLIDER */}
          {calcTab === 'savings' && (
            <Card style={{ padding: 'var(--space-8)', borderRadius: '16px', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4', boxShadow: '0 20px 40px -15px rgba(22, 163, 74, 0.12)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-8)', alignItems: 'center' }}>
                
                {/* Volume Slider Left */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <Badge variant="success" size="md">E-Commerce Freight ROI</Badge>
                  <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>How many shipments do you dispatch per month?</h3>
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>Monthly Order Volume</span>
                      <span style={{ fontSize: '22px', fontWeight: '900', color: '#16a34a' }}>{monthlyVolume.toLocaleString()} Orders / Mo</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="10000"
                      step="100"
                      value={monthlyVolume}
                      onChange={(e) => setMonthlyVolume(parseInt(e.target.value, 10))}
                      style={{ width: '100%', height: '10px', accentColor: '#16a34a', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                      <span>100 Orders</span>
                      <span>5,000 Orders</span>
                      <span>10,000+ Orders</span>
                    </div>
                  </div>

                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, margin: 0, listStyle: 'none', fontSize: '14px', color: '#334155' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                      <span>Save avg. ₹ 18.50 per shipment with AI Courier Auto-Routing</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                      <span>Reduce NDR Return-To-Origin (RTO) expenses by 40%</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                      <span>Zero subscription fees — Pay only for booked shipments</span>
                    </li>
                  </ul>
                </div>

                {/* Savings Counter Card Right */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: 'var(--space-8)', border: '2px solid #86efac', textAlign: 'center', boxShadow: '0 15px 30px -10px rgba(22, 163, 74, 0.2)' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    ESTIMATED FREIGHT SAVINGS
                  </span>
                  
                  <div style={{ fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontWeight: '900', color: '#15803d', margin: '16px 0 8px 0', letterSpacing: '-0.03em' }}>
                    ₹ {monthlySavings}
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#475569' }}> / Month</span>
                  </div>

                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>
                    Annual Profit Savings: <span style={{ color: '#16a34a' }}>₹ {annualSavings} / Year</span>
                  </div>

                  <Link to="/signup">
                    <Button variant="success" size="lg" style={{ width: '100%', fontWeight: '900', height: '52px', fontSize: '16px' }}>
                      🚀 Claim Your Savings Now
                    </Button>
                  </Link>
                </div>

              </div>
            </Card>
          )}

        </div>
      </section>

      {/* 🌟 3. LIVE 29,000+ PINCODE SERVICEABILITY CHECKER */}
      <section id="pincode" style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--space-16) var(--space-6)', width: '100%' }}>
        <Card style={{ padding: 'var(--space-10)', borderRadius: '20px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-8)', alignItems: 'center' }}>
            
            <div>
              <Badge variant="brand" style={{ backgroundColor: '#1e40af', color: '#60a5fa', borderColor: '#3b82f6' }}>
                Pan-India Reachability
              </Badge>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '900', color: '#ffffff', marginTop: '12px' }}>
                Check 29,000+ Pincode Serviceability Instant Search
              </h2>
              <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.6, marginTop: '8px' }}>
                Test your customer delivery pincode to verify doorstep coverage, COD availability, and active air/surface carrier partners.
              </p>

              {/* Search Form */}
              <form onSubmit={handlePincodeSearch} style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Enter 6-digit Pincode (e.g. 400001)..."
                  value={pincodeQuery}
                  onChange={(e) => setPincodeQuery(e.target.value)}
                  maxLength={6}
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    padding: '14px 18px',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                    backgroundColor: '#1e293b',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: '700',
                    outline: 'none',
                  }}
                />
                <Button type="submit" variant="brand" style={{ backgroundColor: '#2563eb', padding: '0 24px', height: '50px', fontWeight: '800' }}>
                  Check Pincode
                </Button>
              </form>
            </div>

            {/* Live Result Card */}
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
                <div>
                  <strong style={{ fontSize: '18px', color: '#ffffff' }}>Pincode: {pincodeResult.code}</strong>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>{pincodeResult.city}, {pincodeResult.state}</span>
                </div>
                <Badge variant="success" style={{ backgroundColor: '#065f46', color: '#34d399' }}>✅ 100% Serviceable</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ backgroundColor: '#0f172a', padding: '10px 12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>COD Serviceable</span>
                  <strong style={{ fontSize: '13px', color: '#38bdf8' }}>Available (0.5% Fee)</strong>
                </div>
                <div style={{ backgroundColor: '#0f172a', padding: '10px 12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Express Air SLA</span>
                  <strong style={{ fontSize: '13px', color: '#4ade80' }}>{pincodeResult.airSla}</strong>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                  Active Courier Partners ({pincodeResult.activeCarriers.length})
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {pincodeResult.activeCarriers.map((carrier, idx) => (
                    <span key={idx} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#334155', color: '#e2e8f0', fontWeight: '600' }}>
                      {carrier}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </Card>
      </section>

      {/* 🌟 4. DYNAMIC CARRIER PARTNER FILTER SHOWCASE */}
      <section id="carriers" style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-12) 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 var(--space-6)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <Badge variant="neutral">Carrier Partner Network</Badge>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: '900', color: '#0f172a', marginTop: '6px' }}>
              Integrated Courier Partners & Delivery Networks
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
              Filter courier partners by delivery speed and transport mode.
            </p>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Partners (12+)' },
              { id: 'air', label: '⚡ Air Express (Fastest)' },
              { id: 'surface', label: '🚚 Surface Cargo (Budget)' },
              { id: 'local', label: '🚀 Hyperlocal / Same-Day' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCarrierFilter(tab.id as any)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  border: carrierFilter === tab.id ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: carrierFilter === tab.id ? '#eff6ff' : '#ffffff',
                  color: carrierFilter === tab.id ? '#1d4ed8' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
            {filteredCarriers.map((partner, idx) => (
              <Card
                key={idx}
                style={{
                  padding: 'var(--space-4) var(--space-5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: partner.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{partner.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{partner.tag}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '10px', fontWeight: '700' }}>
                    <span style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#2563eb' }}>{partner.sla}</span>
                    <span style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#16a34a' }}>{partner.reach}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

        </div>
      </section>

      {/* 🌟 5. FEATURE GRID (6 CARDS) */}
      <section id="features" style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--space-16) var(--space-6)', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
          <Badge variant="brand">Platform Capabilities</Badge>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '900', marginTop: 'var(--space-2)' }}>
            Everything Your Shipping Operation Needs
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
          {[
            { icon: Truck, title: 'Multi-Courier Aggregation', desc: 'Manage 12+ courier partners from one single unified dashboard.' },
            { icon: Zap, title: 'AI Smart Recommendation', desc: 'Automatically select the cheapest or fastest courier quote in 1 click.' },
            { icon: Package, title: 'Real-Time Tracking Timeline', desc: 'Unified parcel status tracking across all integrated carriers.' },
            { icon: ShieldCheck, title: 'NDR & RTO Reduction Console', desc: 'Automated WhatsApp buyer re-attempts cutting return losses by 40%.' },
            { icon: BarChart3, title: 'Daily COD Remittance', desc: 'Fast daily cash-on-delivery settlements directly into your bank.' },
            { icon: Globe, title: 'Enterprise Freight Analytics', desc: 'Monitor operational performance, courier SLAs, and zone analytics.' },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <Card key={i} style={{ padding: 'var(--space-6)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-blue-light)', color: 'var(--color-blue-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
                  <Icon size={22} />
                </div>
                <h3 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'var(--font-weight-bold)' }}>{f.title}</h3>
                <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)', lineHeight: 1.6 }}>{f.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 🌟 6. WHY CHOOSE US (3 CARDS) */}
      <section style={{ backgroundColor: 'var(--color-surface-secondary)', padding: 'var(--space-16) var(--space-6)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
          <div style={{ textAlign: 'center' }}>
            <Badge variant="brand">Competitive Advantage</Badge>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '900', marginTop: 'var(--space-2)' }}>
              Why Choose Courrier3?
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-8)' }}>
            <Card style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--font-size-display)', fontWeight: 'var(--font-weight-black)', color: 'var(--color-blue-main)' }}>29,000+</div>
              <h3 style={{ fontSize: 'var(--font-size-h3)', marginTop: 'var(--space-2)' }}>Active Pincode Reach</h3>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)', lineHeight: 1.6 }}>
                Deliver parcels to every corner of India with guaranteed doorstep pickup and delivery coverage.
              </p>
            </Card>

            <Card style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--font-size-display)', fontWeight: 'var(--font-weight-black)', color: 'var(--color-success)' }}>40%</div>
              <h3 style={{ fontSize: 'var(--font-size-h3)', marginTop: 'var(--space-2)' }}>Freight Cost Savings</h3>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)', lineHeight: 1.6 }}>
                AI-powered rate optimization and pre-negotiated corporate rate cards lower your dispatch bills.
              </p>
            </Card>

            <Card style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--font-size-display)', fontWeight: 'var(--font-weight-black)', color: 'var(--color-sky-main)' }}>99.4%</div>
              <h3 style={{ fontSize: 'var(--font-size-h3)', marginTop: 'var(--space-2)' }}>On-Time SLA Delivery</h3>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)', lineHeight: 1.6 }}>
                Real-time carrier SLA monitoring ensures your customers receive parcels on time, every time.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 🌟 7. CUSTOMER TESTIMONIALS */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--space-16) var(--space-6)', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
          <Badge variant="brand">Social Proof & Reviews</Badge>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '900', marginTop: 'var(--space-2)' }}>
            Trusted By 5,000+ D2C Brands Across India
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
          {[
            {
              quote: "Courrier3's AI rate recommendation reduced our shipping expenses by 35% in our very first month of switching.",
              author: 'Rahul Sharma',
              role: 'Founder, UrbanFit D2C',
            },
            {
              quote: 'Automated WhatsApp buyer alerts cut our NDR return-to-origin losses by over 40%. Best courier SaaS platform.',
              author: 'Priya Verma',
              role: 'Head of Logistics, CraftStyle',
            },
            {
              quote: 'Daily COD remittance payouts resolved our e-commerce cash flow bottlenecks completely. Highly recommended!',
              author: 'Amit Patel',
              role: 'Operations Director, NexaRetail',
            },
          ].map((t, idx) => (
            <Card key={idx} style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', gap: '4px', color: '#f59e0b', marginBottom: 'var(--space-3)' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} fill="#f59e0b" />
                ))}
              </div>
              <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-primary)', fontStyle: 'italic', lineHeight: 1.6 }}>"{t.quote}"</p>
              <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                <div style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-body)', color: 'var(--color-text-primary)' }}>{t.author}</div>
                <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>{t.role}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 🌟 8. FAQ ACCORDION SECTION */}
      <section id="faq" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 var(--space-6) var(--space-16) var(--space-6)', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <Badge variant="neutral">Frequently Asked Questions</Badge>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '900', marginTop: 'var(--space-2)' }}>
            Got Questions? We Have Answers.
          </h2>
        </div>
        <Accordion items={faqItems} defaultExpandedId="faq-1" />
      </section>



      {/* 🌟 10. INTERACTIVE AWB TIMELINE MODAL DRAWER */}
      {isTimelineModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              overflow: 'hidden',
              animation: 'fadeIn 0.25s ease-out',
            }}
          >
            {/* Header */}
            <div style={{ backgroundColor: '#0f172a', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ffffff' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                  LIVE PARCEL TIMELINE RADAR
                </span>
                <strong style={{ fontSize: '16px', color: '#ffffff' }}>AWB: {activeSearchResult.awb}</strong>
              </div>
              <button
                onClick={() => setIsTimelineModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Details Content */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Carrier Partner</span>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>{activeSearchResult.courier}</strong>
                </div>
                <Badge variant={activeSearchResult.status === 'Delivered' ? 'success' : 'info'}>
                  {activeSearchResult.status}
                </Badge>
              </div>

              <div style={{ fontSize: '13px', color: '#475569', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <span>Route: <strong>{activeSearchResult.origin} ➔ {activeSearchResult.destination}</strong></span>
                <span>ETA: <strong style={{ color: '#16a34a' }}>{activeSearchResult.eta}</strong></span>
              </div>

              {/* Vertical Timeline Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                {activeSearchResult.steps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: step.done ? '#16a34a' : '#e2e8f0',
                          color: step.done ? '#ffffff' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '800',
                          flexShrink: 0,
                        }}
                      >
                        {step.done ? <Check size={14} /> : idx + 1}
                      </div>
                      {idx < activeSearchResult.steps.length - 1 && (
                        <div style={{ width: '2px', height: '28px', backgroundColor: step.done ? '#bbf7d0' : '#e2e8f0', marginTop: '4px' }} />
                      )}
                    </div>
                    <div>
                      <strong style={{ fontSize: '13px', color: step.done ? '#0f172a' : '#94a3b8', display: 'block' }}>{step.title}</strong>
                      <span style={{ fontSize: '11px', color: step.done ? '#16a34a' : '#cbd5e1', fontWeight: '600' }}>{step.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => setIsTimelineModalOpen(false)}
                variant="outline"
                style={{ width: '100%', marginTop: '12px', fontWeight: '700' }}
              >
                Close Tracking Radar
              </Button>

            </div>
          </div>
        </div>
      )}

      {/* 🌟 11. DYNAMIC LIVE ACTIVITY TICKER BANNER (BOTTOM-LEFT) */}
      {tickerVisible && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            zIndex: 90,
            backgroundColor: '#ffffff',
            border: '1px solid #bfdbfe',
            borderRadius: '30px',
            padding: '8px 16px 8px 12px',
            boxShadow: '0 12px 30px -5px rgba(37, 99, 235, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.4s ease-out',
            maxWidth: '460px',
          }}
        >
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Activity size={14} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tickerMessages[tickerIndex]}
          </span>
          <button
            onClick={() => setTickerVisible(false)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

    </div>
  );
};

