import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { useBreakpoints } from '../../hooks/useBreakpoints';
import { APP_CONFIG } from '../../config/app.config';

const NAV_LINKS = [
  { label: 'Features', href: '#features', path: '/features' },
  { label: 'Rate & Savings', href: '#calculator', path: '/pricing' },
  { label: 'Pincode Reach', href: '#pincode', path: '/tracking' },
  { label: 'Carriers', href: '#carriers', path: '/integrations' },
  { label: 'FAQ', href: '#faq', path: '/faq' },
];

export const PublicHeader: React.FC = () => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const location = useLocation();
  const { isMobile } = useBreakpoints();
  const isHomePage = location.pathname === '/';

  return (
    <header
      style={{
        height: '68px',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
        position: 'sticky',
        top: 0,
        zIndex: 999,
        boxShadow: '0 4px 20px -5px rgba(15, 23, 42, 0.06)',
      }}
    >
      <div
        style={{
          height: '100%',
          maxWidth: '1280px',
          margin: '0 auto',
          padding: isMobile ? '0 var(--space-4)' : '0 var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo Header */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '20px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            C
          </div>
          <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.03em' }}>
            {APP_CONFIG.name}<span style={{ color: '#2563eb' }}>3</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        {!isMobile && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            {NAV_LINKS.map((link) => {
              const target = isHomePage ? link.href : link.path;
              return (
                <a
                  key={link.label}
                  href={target}
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#475569',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>
        )}

        {/* Desktop Actions / Mobile Menu Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isMobile ? (
            <>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="ghost" style={{ fontWeight: '700', color: '#1e293b', padding: '0 16px' }}>
                  Sign In
                </Button>
              </Link>
              <Link to="/signup" style={{ textDecoration: 'none' }}>
                <Button variant="primary" style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', fontWeight: '800', padding: '0 20px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}>
                  🚀 Start Free Trial
                </Button>
              </Link>
            </>
          ) : (
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              aria-label="Open Mobile Menu"
            >
              <Menu size={22} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {isMobile && (
        <Drawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          position="right"
          title={`${APP_CONFIG.name} Menu`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={isHomePage ? link.href : link.path}
                  onClick={() => setIsMobileDrawerOpen(false)}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-default)',
                    fontSize: 'var(--font-size-body)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text-primary)',
                    backgroundColor: 'var(--color-surface-secondary)',
                    textDecoration: 'none',
                  }}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Link to="/login" onClick={() => setIsMobileDrawerOpen(false)}>
                <Button variant="outline" fullWidth style={{ fontWeight: '700' }}>
                  Sign In
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setIsMobileDrawerOpen(false)}>
                <Button variant="primary" fullWidth style={{ backgroundColor: '#2563eb', fontWeight: '800' }}>
                  🚀 Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </Drawer>
      )}
    </header>
  );
};

