import React from 'react';
import { NavigationKey } from '../types/dashboard';
import { Construction, ArrowLeft } from 'lucide-react';

interface PlaceholderPageProps {
  navKey: NavigationKey;
  onBackToOverview: () => void;
}

const MODULE_DETAILS: Record<NavigationKey, { title: string; desc: string; plannedFeatures: string[] }> = {
  overview: {
    title: 'Operations Overview',
    desc: 'Main operations summary dashboard.',
    plannedFeatures: []
  },
  orders: {
    title: 'Orders Management Module',
    desc: 'Full-lifecycle order ingestion, multi-channel Shopify & Amazon sync, and batch processing.',
    plannedFeatures: [
      'Inbound CSV / Excel bulk order upload with column mapping',
      'Direct 1-click Shopify, WooCommerce, and custom REST API order sync',
      'Address verification and delivery serviceability checks before dispatch',
      'Bulk manifest creation and single-click handover generation'
    ]
  },
  shipments: {
    title: 'Consignments & Live Tracking Board',
    desc: 'Live multi-carrier milestone tracking across Delhivery, Blue Dart, Xpressbees, and DTDC.',
    plannedFeatures: [
      'Real-time GPS telematics and hub arrival event streams',
      'Bulk AWB label generation and thermal printer ZPL / PDF formats',
      'Automated customer SMS & WhatsApp milestone notification triggers',
      'Proof of Delivery (e-POD) digital signature and OTP verification'
    ]
  },
  'rate-calculator': {
    title: 'Domestic Multi-Carrier Rate Calculator',
    desc: 'Instant pre-shipping freight quotation tool comparing dead vs volumetric weight across top courier networks.',
    plannedFeatures: [
      'Dead vs Volumetric comparison formula: (Length × Width × Height) / 5000',
      'Pincode serviceability lookup for 29,000+ Indian pincodes',
      'Instant side-by-side carrier quotation ranking lowest cost vs fastest delivery',
      'Prepaid vs COD charges with automated docket fee calculation'
    ]
  },
  'rate-card': {
    title: 'Commercial Tariff Rate Cards',
    desc: 'Transparent zone-wise pricing matrix across Zones A through E with value-added surcharge rules.',
    plannedFeatures: [
      'Zone A (Within City) to Zone E (Special Destinations) base and incremental tariffs',
      'Pre-negotiated enterprise B2B and B2C commercial tier discounts',
      'COD handling fees (1.5% or ₹35 min) and fuel surcharge inclusion rules',
      'RTO reverse logistics freight deduction tables'
    ]
  },
  'courier-partners': {
    title: 'Courier Partners & Coverage',
    desc: 'Direct carrier API credential management, allocation algorithms, and SLA analytics.',
    plannedFeatures: [
      'Integrated carrier connectors (Delhivery, Blue Dart, Xpressbees, DTDC, Shadowfax)',
      'Smart automated courier selection based on lowest cost vs fastest delivery SLA',
      'Zone-level carrier performance metrics and delivery success ratios',
      'Custom API credential management for enterprise merchant accounts'
    ]
  },
  pickup: {
    title: 'Warehouse Pickup Management',
    desc: 'Schedule driver warehouse visits, assign transport vehicles, and generate handover manifests.',
    plannedFeatures: [
      'Multi-warehouse origin selection with default dispatch hubs',
      'Vehicle type assignment: 2-Wheeler, Cargo Van, or 14ft Truck based on package volume',
      'Preferred pickup time slots (10:00 AM – 01:00 PM / 02:00 PM – 05:00 PM)',
      'Printable courier handover manifests with barcode scanning'
    ]
  },
  'ndr-rto': {
    title: 'NDR & RTO Shield Engine',
    desc: 'Non-Delivery Report automation to cut return-to-origin freight costs by up to 38%.',
    plannedFeatures: [
      'Instant courier exception alert feeds (Buyer Unavailable, Incomplete Address, Customer Refused)',
      'Automated buyer WhatsApp bot asking for delivery re-attempt slot confirmation',
      'Real-time address correction dispatch before consignments get marked for RTO',
      'RTO return consignment tracking and reverse freight reconciliation'
    ]
  },
  'cod-wallet': {
    title: 'COD Remittance & Prepaid Wallet',
    desc: 'T+1 daily cash-on-delivery settlements and freight recharge ledger.',
    plannedFeatures: [
      'Daily automated T+1 COD remittance credit directly into merchant bank accounts',
      'Instant wallet top-up via UPI, NetBanking, Debit/Credit Card via payment gateway',
      'Itemized freight deduction ledger with GST tax invoice generation',
      'Negative wallet balance overdraft protection and automated recharge alerts'
    ]
  },
  reports: {
    title: 'Analytics & Financial Reporting',
    desc: 'Comprehensive logistics intelligence, freight audit ledgers, and downloadable GST bills.',
    plannedFeatures: [
      '30-day delivery SLA compliance and carrier performance audit reports',
      'State-wise and zone-wise shipment heatmaps and demand cluster analysis',
      'Downloadable Excel & CSV billing registers for accounting reconciliation',
      'Monthly input tax credit (ITC) compliant GST B2B tax invoices'
    ]
  },
  'business-profile': {
    title: 'Business Profile & KYC Compliance',
    desc: 'Merchant KYC verification, multi-warehouse pickup addresses, team roles, and webhook keys.',
    plannedFeatures: [
      'GSTIN and PAN business verification with company trade name matching',
      'Multi-warehouse pickup address management with default dispatch hubs',
      'Team member role delegation (Merchant Admin vs Dispatch Staff)',
      'Production API keys, webhook endpoints, and shipping label custom branding'
    ]
  },
  support: {
    title: 'Help & Carrier Escalation Matrix',
    desc: 'Direct ticketing system and dedicated carrier escalation manager for delayed shipments.',
    plannedFeatures: [
      'Level 1 to Level 3 carrier escalation matrix with guaranteed response SLAs',
      'Shipment delay disputes and NDR investigation ticket creation',
      'Loss / Damage claim filing and insurance reconciliation',
      'Live chat with logistics operations specialist'
    ]
  },
  'create-order': {
    title: 'Shipment Booking Flow',
    desc: 'Quick manual dispatch flow with automated courier allocation.',
    plannedFeatures: [
      'Origin warehouse selection and recipient pincode lookup',
      'Volumetric comparison and rate card ranking',
      'Prepaid vs COD payment selection',
      'One-click AWB generation'
    ]
  },
  settings: {
    title: 'Merchant Settings',
    desc: 'Store configurations, pickup addresses, API keys, and team roles.',
    plannedFeatures: [
      'GSTIN verification',
      'Pickup addresses',
      'Team permissions',
      'Webhook URLs'
    ]
  }
};

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  navKey,
  onBackToOverview
}) => {
  const details = MODULE_DETAILS[navKey] || {
    title: 'Module Under Construction',
    desc: 'This capability is part of the upcoming phased rollout.',
    plannedFeatures: []
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={onBackToOverview}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Operations Overview</span>
      </button>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-8 sm:p-10 shadow-card space-y-6 text-left">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0">
            <Construction className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold uppercase tracking-wider border border-amber-200">
              Planned Capability • Mock Preview (Not Connected to Live Courier API)
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {details.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              {details.desc}
            </p>
          </div>
        </div>

        {details.plannedFeatures.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Planned Capabilities & Integrations:
            </h4>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {details.plannedFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-medium flex items-start gap-2"
                >
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span className="leading-relaxed">
            Phase 1 UI Foundation • Live database connectivity and courier APIs will be integrated in subsequent phases.
          </span>
          <button
            type="button"
            onClick={onBackToOverview}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors shrink-0 text-xs"
          >
            Return to Active Overview
          </button>
        </div>
      </div>
    </div>
  );
};
