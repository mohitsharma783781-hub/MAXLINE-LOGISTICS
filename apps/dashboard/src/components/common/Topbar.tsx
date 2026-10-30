import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Wallet, Plus, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { NotificationDropdown } from './NotificationDropdown';
import { UserProfileMenu } from './UserProfileMenu';
import { CommandPaletteModal } from './CommandPaletteModal';
import { LiveToastContainer } from './LiveToastContainer';
import { useBreakpoints } from '../../hooks/useBreakpoints';
import { APP_CONFIG } from '../../config/app.config';
import { WalletService } from '../../mocks/wallet.mock';
import { useTenant } from '../../context/TenantContext';

export interface TopbarProps {
  portalName?: string;
  onMenuToggle?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  portalName = 'Customer Portal',
  onMenuToggle,
}) => {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoints();
  const { activeTenantId } = useTenant();

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const currentUser = (() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('courrier3_current_user');
        if (raw) return JSON.parse(raw);
      }
    } catch {}
    return null;
  })();

  const isCustomerPortal = !portalName.toLowerCase().includes('admin');
  const walletBalancePaise = activeTenantId
    ? (WalletService.getWallet(activeTenantId).availableBalanceMinor ?? 0)
    : 0;
  const walletBalanceINR = (walletBalancePaise / 100).toFixed(2);

  // Global Keyboard Shortcut: Ctrl + K / Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isMac = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('mac');

  return (
    <header
      style={{
        height: '52px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 var(--space-3)' : '0 var(--space-4)',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
      }}
    >
      {/* LIVE TOAST OVERLAY */}
      <LiveToastContainer />

      {/* Left Area: Mobile Trigger & Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            style={{
              padding: 'var(--space-1-5, 6px)',
              borderRadius: 'var(--radius-default)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            aria-label="Toggle Navigation Menu"
          >
            <Menu size={18} />
          </button>
        )}
        <span
          style={{
            fontSize: 'var(--font-size-small)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {APP_CONFIG.name} &bull; <strong style={{ color: 'var(--color-text-primary)' }}>{portalName}</strong>
        </span>
      </div>

      {/* Center/Right Area: Search, Wallet Badge, Add Money, Notifications, Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* GROUP 1: GLOBAL SEARCH PILL (LOGISTICS FLIGHT-CONTROL) */}
        {!isMobile && (
          <div
            onClick={() => setIsCommandPaletteOpen(true)}
            style={{
              width: '290px',
              height: '34px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            }}
            title="Press Ctrl + K to open Global Logistics Telemetry Search"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                }}
              />
              <Search size={14} style={{ color: '#2563eb' }} />
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#475569' }}>Search AWB, Pincode, Page...</span>
            </div>

            <kbd
              style={{
                backgroundColor: '#ffffff',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '1px 5px',
                fontSize: '10px',
                fontWeight: 700,
                fontFamily: 'inherit',
                boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
              }}
            >
              {isMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          </div>
        )}

        {/* MOBILE SEARCH ICON BUTTON */}
        {isMobile && (
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-default)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-violet-main)',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            aria-label="Open Global Search"
          >
            <Search size={18} />
          </button>
        )}

        {/* SUBTLE DIVIDER 1 */}
        {isCustomerPortal && !isMobile && (
          <div style={{ width: '1px', height: '22px', backgroundColor: '#e2e8f0' }} aria-hidden="true" />
        )}

        {/* GROUP 2: PROMINENT HEADER WALLET & RECHARGE BUTTON (CUSTOMER PORTAL ONLY) */}
        {isCustomerPortal && !isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              onClick={() => navigate('/app/wallet')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-default)',
                backgroundColor: 'var(--color-surface-secondary)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                transition: 'background-color var(--transition-fast)',
              }}
              title="Click to view Wallet & Ledger"
            >
              <Wallet size={14} style={{ color: '#0284c7' }} />
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.1 }}>
                <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Wallet Balance
                </span>
                <strong style={{ fontSize: '13px', color: '#0284c7' }}>
                  ₹{walletBalanceINR}
                </strong>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={13} aria-hidden="true" />}
              onClick={() => navigate('/app/wallet')}
              style={{
                height: '32px',
                fontSize: '12px',
                fontWeight: '600',
                padding: '0 12px',
                backgroundColor: '#0284c7',
                borderColor: '#0284c7',
                borderRadius: '6px',
              }}
            >
              + Add Money
            </Button>
          </div>
        )}

        {/* SUBTLE DIVIDER 2 */}
        {!isMobile && (
          <div style={{ width: '1px', height: '22px', backgroundColor: '#e2e8f0' }} aria-hidden="true" />
        )}

        {/* GROUP 3: NOTIFICATIONS & PROFILE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <NotificationDropdown portalName={portalName} />
          <UserProfileMenu
            portalName={portalName}
            userName={currentUser?.fullName}
            userEmail={currentUser?.workEmail}
          />
        </div>
      </div>

      {/* COMMAND PALETTE MODAL OVERLAY */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        portalName={portalName}
      />
    </header>
  );
};
