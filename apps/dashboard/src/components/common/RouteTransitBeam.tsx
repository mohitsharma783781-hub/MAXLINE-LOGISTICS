import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Truck } from 'lucide-react';

export const RouteTransitBeam: React.FC = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [activeLabel, setActiveLabel] = useState('');
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    // Determine friendly path name for the transit glider
    const cleanPath = location.pathname.replace(/^\/|\/$/g, '');
    let label = 'Dashboard';
    if (cleanPath.startsWith('admin/b2b-rates')) label = 'B2B Rate Management';
    else if (cleanPath.startsWith('admin')) label = 'Super Admin Portal';
    else if (cleanPath.startsWith('app/orders/create')) label = 'Shipment Wizard';
    else if (cleanPath.startsWith('app/wallet')) label = 'Merchant Wallet';
    else if (cleanPath.startsWith('app/tracking')) label = 'Live Telemetry Tracking';
    else if (cleanPath.startsWith('app/rates')) label = 'Rate Calculator';
    else if (cleanPath.startsWith('app/orders')) label = 'Order Dispatch';
    else if (cleanPath.length > 0) label = cleanPath.split('/')[cleanPath.split('/').length - 1].replace(/-/g, ' ');

    setActiveLabel(label);
    setIsVisible(true);
    setProgress(15);

    // Fast progressive transit stages
    const timer1 = setTimeout(() => setProgress(65), 80);
    const timer2 = setTimeout(() => setProgress(90), 180);
    const timer3 = setTimeout(() => {
      setProgress(100);
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 250);
    }, 280);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [location.pathname, location.search]);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '3px',
        zIndex: 999999,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      {/* Background Track */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #2563eb 0%, #38bdf8 50%, #6366f1 100%)',
          boxShadow: '0 0 12px rgba(56, 189, 248, 0.8), 0 0 4px rgba(37, 99, 235, 0.9)',
          transition: 'width 0.22s cubic-bezier(0.1, 0.9, 0.2, 1)',
          opacity: isVisible ? 1 : 0,
        }}
      />

      {/* Dynamic Courier Glider Lead Head */}
      {isVisible && progress < 100 && (
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            left: `${progress}%`,
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#0f172a',
            padding: '2px 8px',
            borderRadius: '20px',
            border: '1px solid #38bdf8',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.8), 0 0 8px rgba(56, 189, 248, 0.6)',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.02em',
            transition: 'left 0.22s cubic-bezier(0.1, 0.9, 0.2, 1)',
            whiteSpace: 'nowrap',
          }}
        >
          <Truck size={11} color="#38bdf8" style={{ animation: 'bounce 0.8s infinite' }} />
          <span style={{ color: '#e2e8f0', textTransform: 'capitalize' }}>{activeLabel}</span>
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 6px #10b981',
            }}
          />
        </div>
      )}
    </div>
  );
};
