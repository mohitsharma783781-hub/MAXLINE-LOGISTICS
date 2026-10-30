import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useBreakpoints } from '../hooks/useBreakpoints';
import { APP_CONFIG } from '../config/app.config';
import { PageFallback } from '../components/common/PageFallback';
import { RouteTransitBeam } from '../components/common/RouteTransitBeam';

export const AuthLayout: React.FC = () => {
  const { isMobile } = useBreakpoints();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#f8fafc', fontFamily: 'var(--font-sans)' }}>
      {/* Left Column: Enterprise Brand & Value Showcase (Hidden on Mobile) */}
      {!isMobile && (
        <div
          style={{
            width: '45%',
            maxWidth: '580px',
            background: 'radial-gradient(circle at 20% 20%, #1e1b4b 0%, #0f172a 65%, #020617 100%)',
            color: '#ffffff',
            padding: '40px var(--space-10)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: '1px solid #1e293b',
            boxShadow: '10px 0 30px rgba(0,0,0,0.15)',
          }}
        >
          {/* Top Brand Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                }}
              >
                C
              </div>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.03em' }}>
                {APP_CONFIG.name}<span style={{ color: '#38bdf8' }}>3</span>
              </span>
            </Link>

            <span style={{ fontSize: '11px', fontWeight: '700', color: '#4ade80', backgroundColor: 'rgba(74, 222, 128, 0.12)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(74, 222, 128, 0.25)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
              29,000+ Pincodes Active
            </span>
          </div>

          {/* Middle Value Highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', margin: '32px 0' }}>
            
            <h2 style={{ fontSize: '30px', fontWeight: '900', color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.02em', margin: 0 }}>
              Ship Smarter Across 12+ Couriers with AI Auto-Routing.
            </h2>

            {/* Performance Metric Box */}
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid #334155', borderRadius: '16px', padding: '18px', backdropFilter: 'blur(8px)' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '12px' }}>
                ⚡ Platform Performance Benchmarks
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                <div style={{ backgroundColor: '#0f172a', padding: '10px 6px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                  <strong style={{ fontSize: '16px', color: '#4ade80', display: 'block' }}>99.4%</strong>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>On-Time SLA</span>
                </div>
                <div style={{ backgroundColor: '#0f172a', padding: '10px 6px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                  <strong style={{ fontSize: '16px', color: '#38bdf8', display: 'block' }}>₹38/500g</strong>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Starting Rate</span>
                </div>
                <div style={{ backgroundColor: '#0f172a', padding: '10px 6px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                  <strong style={{ fontSize: '16px', color: '#a78bfa', display: 'block' }}>T+1 COD</strong>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Daily Credit</span>
                </div>
              </div>
            </div>

            {/* Carrier Badges Marquee */}
            <div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                Pre-Integrated Carrier Partners:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['Delhivery', 'Blue Dart', 'Xpressbees', 'Shadowfax', 'Ecom Express', 'DTDC'].map((c, i) => (
                  <span key={i} style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#e2e8f0' }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Testimonial Quote */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderLeft: '3px solid #2563eb', padding: '14px', borderRadius: '0 10px 10px 0' }}>
              <div style={{ display: 'flex', gap: '2px', color: '#f59e0b', marginBottom: '4px' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} fill="#f59e0b" />
                ))}
              </div>
              <p style={{ fontSize: '13px', color: '#cbd5e1', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
                "MAXLINE AI rate allocation saved our D2C brand ₹42,000 in monthly freight costs during our first 30 days."
              </p>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginTop: '6px', display: 'block' }}>
                — Founder, UrbanFit D2C
              </span>
            </div>

          </div>

          {/* Bottom Copyright */}
          <div style={{ fontSize: '12px', color: '#64748b', borderTop: '1px solid #1e293b', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>&copy; {new Date().getFullYear()} {APP_CONFIG.name} Logistics SaaS</span>
            <span style={{ color: '#38bdf8' }}>ISO 27001 Certified</span>
          </div>

        </div>
      )}

      {/* Right Column: Centered Auth Form Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '24px 16px' : '40px 32px',
          width: '100%',
          overflowY: 'auto',
        }}
      >
        {/* Mobile Header Brand Logo */}
        {isMobile && (
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '18px',
              }}
            >
              C
            </div>
            <span style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>
              {APP_CONFIG.name}
            </span>
          </Link>
        )}

        <div style={{ width: '100%', maxWidth: '640px' }}>
          <React.Suspense fallback={<PageFallback />}>
            <Outlet />
          </React.Suspense>
        </div>
      </div>
      <RouteTransitBeam />
    </div>
  );
};
