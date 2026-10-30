import React from 'react';
import { Menu, Search, Bell, ExternalLink, X, Plus, Wallet, ChevronDown } from 'lucide-react';
import { NavigationKey } from '../types/dashboard';

interface TopbarProps {
  activeNav: NavigationKey;
  onOpenMobileSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onQuickBookShipment?: () => void;
  onOpenWallet?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeNav: _activeNav,
  onOpenMobileSidebar,
  searchQuery,
  onSearchChange,
  onQuickBookShipment: _onQuickBookShipment,
  onOpenWallet
}) => {
  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4 transition-colors">
      {/* Left: Mobile Toggle & Brand Breadcrumb */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <span className="font-semibold text-slate-900">MAXLINE LOGISTICS</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600">Merchant Portal</span>
        </div>
      </div>

      {/* Middle: Universal Search Input (Matching Skyonship with Ctrl K) */}
      <div className="flex-1 max-w-sm lg:max-w-md mx-1 sm:mx-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search AWB, Order, Customer..."
            className="w-full pl-8 pr-16 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-all"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-mono text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 shadow-2xs pointer-events-none">
              <span>Ctrl</span>
              <span>K</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Wallet Balance, + Add Money, Notification Bell, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Wallet Balance Pill */}
        <div 
          onClick={onOpenWallet}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-sky-200 bg-sky-50 text-xs text-sky-800 hover:bg-sky-100/70 transition-colors cursor-pointer shadow-2xs"
          title="Prepaid Freight Wallet"
        >
          <Wallet className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <div className="text-left">
            <span className="text-[9px] uppercase tracking-wider font-bold text-sky-600 block leading-none">Wallet Balance</span>
            <span className="font-mono font-bold text-sky-950 text-xs leading-none">₹14,250.00</span>
          </div>
        </div>

        {/* + Add Money Button */}
        <button
          type="button"
          onClick={onOpenWallet}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-medium text-xs shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Money</span>
        </button>

        {/* Marketing Landing Page Link */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title="Open Public Marketing Landing Page"
          className="hidden xl:inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-700 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <span>Landing Page</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>

        {/* Notifications Button with Red Badge (5) */}
        <button
          type="button"
          className="relative p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-slate-200/80 bg-white shadow-2xs focus:outline-none"
          title="Notifications (5 updates)"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
            5
          </span>
        </button>

        {/* Profile Card Pill */}
        <div className="flex items-center gap-2 pl-1.5 py-1 pr-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs">
          <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
            M
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-900 leading-tight">
              Mohit Sharma
            </div>
            <div className="text-[9px] text-slate-400 font-bold tracking-tight uppercase leading-none">
              MAXLINE-GOLD
            </div>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
        </div>
      </div>
    </header>
  );
};
