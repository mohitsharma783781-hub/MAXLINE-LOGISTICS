import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Truck,
  Wallet,
  Building,
  X,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  ChevronsLeft,
  Plus,
  SlidersHorizontal
} from 'lucide-react';
import { NavigationKey } from '../types/dashboard';

interface SidebarProps {
  activeNav: NavigationKey;
  onSelectNav: (key: NavigationKey) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavSubItem {
  key: NavigationKey;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeStyle?: string;
  isCreateAction?: boolean;
}

interface NavSectionDef {
  sectionId: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavSubItem[];
  defaultExpanded?: boolean;
}

const NAV_SECTIONS: NavSectionDef[] = [
  {
    sectionId: 'shipments',
    title: 'SHIPMENTS',
    icon: Package,
    defaultExpanded: true,
    items: [
      { key: 'create-order', label: 'Create Shipment', isCreateAction: true },
      { key: 'orders', label: 'All Orders' },
      { key: 'orders', label: 'Bulk Upload' },
      { key: 'pickup', label: 'Pickups & Manifests' }
    ]
  },
  {
    sectionId: 'tracking-ndr',
    title: 'TRACKING & NDR',
    icon: Truck,
    defaultExpanded: true,
    items: [
      { key: 'shipments', label: 'Live Tracking Board' },
      { key: 'ndr-rto', label: 'NDR & RTO Shield' }
    ]
  },
  {
    sectionId: 'finance',
    title: 'FINANCE',
    icon: Wallet,
    defaultExpanded: true,
    items: [
      { key: 'cod-wallet', label: 'COD & Wallet' },
      { key: 'reports', label: 'Invoices & Billing' },
      { key: 'rate-card', label: 'Rate Cards' }
    ]
  },
  {
    sectionId: 'tools',
    title: 'TOOLS',
    icon: SlidersHorizontal,
    defaultExpanded: true,
    items: [
      { key: 'rate-calculator', label: 'Rate Calculator' },
      { key: 'courier-partners', label: 'Courier Partners' }
    ]
  },
  {
    sectionId: 'settings',
    title: 'SETTINGS',
    icon: Building,
    defaultExpanded: false,
    items: [
      { key: 'business-profile', label: 'Business Profile' },
      { key: 'support', label: 'Help & Support' }
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onSelectNav,
  isOpenMobile,
  onCloseMobile
}) => {
  // Normalize compatibility aliases
  const normalizedActiveKey: NavigationKey =
    activeNav === 'create-order'
      ? 'rate-calculator'
      : activeNav === 'settings'
      ? 'business-profile'
      : activeNav;

  // Track expanded groups (matching Skyonship collapsible sidebar)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    shipments: true,
    'tracking-ndr': true,
    finance: true,
    tools: true,
    settings: true
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isDashboardActive = normalizedActiveKey === 'overview';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container (Deep Navy / Charcoal matching Skyonship #0B132B / #0F172A) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0B132B] border-r border-[#1E293B] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-[#1E293B] flex items-center justify-between shrink-0 bg-[#0B132B]">
          <div className="flex items-center gap-3 min-w-0">
            {/* Square brand emblem */}
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-blue-900/50 shrink-0">
              ML
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white tracking-tight leading-none truncate">
                MAXLINE LOGISTICS
              </div>
              <span className="text-[11px] text-slate-400 font-medium block mt-1 leading-none">
                Merchant Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Collapse indicator button (as shown in Skyonship) */}
            <button
              type="button"
              className="hidden lg:flex p-1.5 rounded-lg bg-[#15203A] text-slate-400 hover:text-white transition-colors"
              title="Toggle sidebar width"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Scroll Area */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4 scrollbar-none text-xs">
          {/* Top Primary Item: Dashboard (Matching Skyonship prominent blue active pill) */}
          <button
            type="button"
            onClick={() => {
              onSelectNav('overview');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold transition-all duration-150 ${
              isDashboardActive
                ? 'bg-[#2563EB] text-white shadow-md shadow-blue-900/40'
                : 'text-slate-300 hover:text-white hover:bg-[#15203A]'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </div>
          </button>

          {/* Collapsible Sections (SHIPMENTS, TRACKING & NDR, FINANCE, TOOLS, SETTINGS) */}
          {NAV_SECTIONS.map((section) => {
            const SectionIcon = section.icon;
            const isExpanded = !!expandedSections[section.sectionId];

            return (
              <div key={section.sectionId} className="space-y-1">
                {/* Group Header with toggle */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.sectionId)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <SectionIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-300" />
                    <span>{section.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-300" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                  )}
                </button>

                {/* Sub-items */}
                {isExpanded && (
                  <div className="pl-6 pr-1 space-y-0.5 animate-in fade-in duration-150">
                    {section.items.map((item, idx) => {
                      const isActive = !isDashboardActive && normalizedActiveKey === item.key;

                      return (
                        <button
                          key={`${section.sectionId}-${item.label}-${idx}`}
                          type="button"
                          onClick={() => {
                            onSelectNav(item.key);
                            onCloseMobile();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 text-left ${
                            isActive
                              ? 'bg-[#2563EB] text-white font-semibold shadow-sm shadow-blue-900/30'
                              : 'text-slate-300 hover:text-white hover:bg-[#15203A] font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {item.isCreateAction && (
                              <Plus className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            )}
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border tabular-nums shrink-0 ${
                                isActive
                                  ? 'bg-blue-700 text-white border-blue-400/40'
                                  : 'bg-[#15203A] text-slate-300 border-[#233566]'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Merchant Status Indicator (Dark Card) */}
        <div className="p-3 border-t border-[#1E293B] bg-[#080E21] shrink-0">
          <div className="p-2.5 rounded-xl bg-[#121F42] border border-[#1E293B] shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-[#2563EB] text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                  ML
                </div>
                <span className="font-semibold text-white truncate text-xs">MAXLINE SELLER</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60 font-semibold shrink-0">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Verified
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono pt-1.5 border-t border-[#1E293B]">
              <span className="tracking-tight">Portal Active</span>
              <span className="font-sans font-semibold text-blue-400">Gold Tier</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
