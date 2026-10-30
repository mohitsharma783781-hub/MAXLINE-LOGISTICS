import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Package,
  FileSpreadsheet,
  Calculator,
  Search,
  Sparkles,
} from 'lucide-react';

export const FloatingQuickAction: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  const actionItems = [
    {
      id: 'create-shipment',
      label: 'Single Dispatch',
      sublabel: 'Book B2C / B2B order',
      icon: Package,
      path: '/app/orders/create',
      color: '#0284c7',
      bgColor: '#f0f9ff',
    },
    {
      id: 'bulk-upload',
      label: 'Bulk CSV / Excel',
      sublabel: 'Import 100+ orders',
      icon: FileSpreadsheet,
      path: '/app/bulk/upload',
      color: '#16a34a',
      bgColor: '#f0fdf4',
    },
    {
      id: 'rate-calc',
      label: 'Rate Calculator',
      sublabel: 'Instant freight check',
      icon: Calculator,
      path: '/app/rates',
      color: '#7c3aed',
      bgColor: '#faf5ff',
    },
    {
      id: 'track-awb',
      label: 'Track AWB',
      sublabel: 'Live tracking & NDR',
      icon: Search,
      path: '/app/tracking',
      color: '#d97706',
      bgColor: '#fffbeb',
    },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      {/* EXPANDABLE QUICK ACTIONS FLOATING MENU */}
      {isOpen && (
        <div
          style={{
            marginBottom: '12px',
            width: '240px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 48px -6px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(0,0,0,0.04)',
            padding: '8px',
            animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <div
            style={{
              padding: '6px 10px 8px',
              borderBottom: '1px solid #f1f5f9',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={12} style={{ color: '#0284c7' }} /> Quick Dispatch
            </span>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>ESC to close</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {actionItems.map((item) => {
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
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.transform = 'translateX(-3px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: item.bgColor,
                      color: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', lineHeight: 1.2 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
                      {item.sublabel}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* PRIMARY FLOATING ACTION BUTTON (FAB) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={isOpen ? 'Close Quick Menu' : 'Quick Actions'}
        aria-label={isOpen ? 'Close Quick Menu' : 'Quick Actions'}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(2, 132, 199, 0.45)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 12px 28px rgba(2, 132, 199, 0.55)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(2, 132, 199, 0.45)';
        }}
      >
        <Plus
          size={22}
          style={{
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </button>
    </div>
  );
};
