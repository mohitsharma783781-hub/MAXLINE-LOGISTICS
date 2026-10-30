import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  User,
  ShieldCheck,
  Landmark,
  Bookmark,
  Briefcase,
  MonitorPlay,
  Settings,
  KeyRound,
  Power,
  Building2,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { authService } from '../../services/auth.service';

export interface UserProfileMenuProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  avatarUrl?: string;
  portalName?: string;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  userName,
  userEmail,
  userRole,
  portalName = 'Customer Portal',
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAdmin = portalName.toLowerCase().includes('admin');
  const { activeTenant, activeTenantId } = useTenant();

  const currentUser = (() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('courrier3_current_user');
        if (raw) return JSON.parse(raw);
      }
    } catch {}
    return null;
  })();

  const resolvedName = userName || currentUser?.fullName || (isAdmin ? 'Platform Super Admin' : 'Merchant');
  const rawBusinessName = currentUser?.businessName || activeTenant?.companyName || '';
  const isGenericOrMissing =
    !rawBusinessName ||
    rawBusinessName.trim() === '' ||
    rawBusinessName.toLowerCase().includes('tenant-') ||
    rawBusinessName.toLowerCase().includes('skyon');

  const merchantDisplayName = isAdmin
    ? 'Super Admin Portal'
    : (!isGenericOrMissing ? rawBusinessName.trim() : 'Merchant Setup Pending');

  const resolvedCompany = merchantDisplayName;
  const resolvedEmail = userEmail || currentUser?.workEmail || (isAdmin ? 'admin@maxline.in' : 'support@maxline.in');
  const resolvedRole = userRole || currentUser?.role || (isAdmin ? 'Super Admin' : 'Account Owner');

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  interface MenuItemConfig {
    id: string;
    label: string;
    icon: React.ElementType;
    path: string;
    badge?: string;
  }

  // Truxcargo-style Customer Portal Menu Hierarchy
  const customerMenuItems: MenuItemConfig[] = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: User,
      path: '/app/settings/profile',
    },
    {
      id: 'kyc',
      label: 'KYC',
      icon: ShieldCheck,
      path: '/app/settings/kyc',
      badge: 'Verified',
    },
    {
      id: 'bank',
      label: 'Bank Info',
      icon: Landmark,
      path: '/app/settings/bank',
    },
    {
      id: 'shipping-plans',
      label: 'Shipping Plans',
      icon: Bookmark,
      path: '/app/settings/shipping-plans',
    },
    {
      id: 'agreement',
      label: 'Agreement',
      icon: Briefcase,
      path: '/app/settings/agreement',
    },
    {
      id: 'training',
      label: 'Training',
      icon: MonitorPlay,
      path: '/app/settings/training',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/app/settings/preferences',
    },
    {
      id: 'change-password',
      label: 'Change Password',
      icon: KeyRound,
      path: '/app/settings/security',
    },
  ];

  // Super Admin Menu Items
  const adminMenuItems: MenuItemConfig[] = [
    {
      id: 'admin-profile',
      label: 'Admin Profile',
      icon: User,
      path: '/admin/settings',
    },
    {
      id: 'admin-roles',
      label: 'Roles & Permissions',
      icon: KeyRound,
      path: '/admin/roles',
    },
    {
      id: 'admin-logs',
      label: 'Audit & Access Logs',
      icon: FileText,
      path: '/admin/access-logs',
    },
    {
      id: 'admin-settings',
      label: 'System Settings',
      icon: Settings,
      path: '/admin/settings',
    },
  ];

  const menuItems = isAdmin ? adminMenuItems : customerMenuItems;

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await authService.signOut();
    } catch {}
    navigate(isAdmin ? '/admin/login' : '/login');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* 1. DYNAMIC TOPBAR PROFILE TRIGGER (Truxcargo Style) */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          padding: '4px 10px 4px 5px',
          borderRadius: '26px',
          border: isOpen ? '1px solid #7c3aed' : '1px solid #e2e8f0',
          backgroundColor: isOpen ? '#faf5ff' : '#ffffff',
          boxShadow: isOpen
            ? '0 0 0 3px rgba(124, 58, 237, 0.12), 0 2px 8px rgba(0,0,0,0.06)'
            : '0 1px 3px rgba(0,0,0,0.04)',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.backgroundColor = '#f8fafc';
            e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.06)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
          }
        }}
        title="Open Profile & Settings Menu"
      >
        {/* Modern Vector Avatar with Online Dot */}
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: isAdmin
              ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
              : 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
            border: isAdmin ? '1.5px solid #4338ca' : '1.5px solid #ddd6fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isAdmin ? '#c084fc' : '#7c3aed',
            fontWeight: '800',
            fontSize: '14px',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(124, 58, 237, 0.12)',
            position: 'relative',
          }}
        >
          <User size={18} style={{ color: isAdmin ? '#c084fc' : '#7c3aed' }} />

          {/* Active Online Indicator */}
          <span
            style={{
              position: 'absolute',
              bottom: '0px',
              right: '0px',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              backgroundColor: '#16a34a',
              border: '2px solid #ffffff',
            }}
            title="Active"
          />
        </div>

        {/* Dynamic Name & Truxcargo-style Code */}
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#0f172a',
              whiteSpace: 'nowrap',
            }}
          >
            {resolvedName}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '600',
              color: merchantDisplayName === 'Merchant Setup Pending' ? '#64748b' : '#1d4ed8',
              letterSpacing: '0.2px',
              whiteSpace: 'nowrap',
            }}
          >
            {merchantDisplayName}
          </span>
        </div>

        {/* Circular Purple Down Arrow (Exact Truxcargo Look) */}
        <div
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            backgroundColor: isOpen ? '#7c3aed' : '#ede9fe',
            color: isOpen ? '#ffffff' : '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            marginLeft: '2px',
            flexShrink: 0,
          }}
        >
          <ChevronDown
            size={13}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>
      </div>

      {/* 2. FLOATING DROPDOWN CARD */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '250px',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 16px 40px -4px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(0,0,0,0.03)',
            zIndex: 1000,
            padding: '8px 6px',
            animation: 'fadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* Header Identity Card */}
          <div
            style={{
              padding: '10px 12px 12px',
              borderBottom: '1px solid #f1f5f9',
              marginBottom: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                {resolvedName}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#16a34a',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <BadgeCheck size={11} /> Verified
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
              {resolvedCompany}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', wordBreak: 'break-all' }}>
              {resolvedEmail}
            </div>
          </div>

          {/* Nav Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate(item.path);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#334155',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.color = '#0f172a';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#334155';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon
                      size={16}
                      style={{
                        color: '#7c3aed',
                        flexShrink: 0,
                      }}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#16a34a',
                        backgroundColor: '#f0fdf4',
                        padding: '1px 6px',
                        borderRadius: '10px',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '6px 4px' }} />

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#ef4444',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f2';
              e.currentTarget.style.color = '#dc2626';
              e.currentTarget.style.transform = 'translateX(2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <Power size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};
