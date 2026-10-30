import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Scale,
  Wallet,
  IndianRupee,
  Package,
  Bell,
  X,
  ArrowRight,
} from 'lucide-react';
import {
  RealtimeNotificationService,
  type AppNotificationRecord,
} from '../../services/realtimeNotificationService';

export const LiveToastContainer: React.FC = () => {
  const navigate = useNavigate();
  const [activeToasts, setActiveToasts] = useState<AppNotificationRecord[]>([]);

  useEffect(() => {
    // Subscribe to live notification events
    const unsubscribe = RealtimeNotificationService.subscribe((notification) => {
      if (notification.isToastEligible) {
        setActiveToasts((prev) => [notification, ...prev.slice(0, 2)]); // Keep max 3 live toasts

        // Auto-dismiss Non-critical toasts after 6 seconds
        if (notification.priority !== 'CRITICAL') {
          setTimeout(() => {
            setActiveToasts((prev) => prev.filter((t) => t.id !== notification.id));
          }, 6000);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDismiss = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleActionClick = (toastItem: AppNotificationRecord) => {
    RealtimeNotificationService.markAsRead(toastItem.id);
    handleDismiss(toastItem.id);
    navigate(toastItem.actionUrl);
  };

  const renderIcon = (eventType: string) => {
    if (eventType === 'NDR_CREATED') return <AlertTriangle size={18} style={{ color: '#ef4444' }} />;
    if (eventType === 'WEIGHT_DISCREPANCY') return <Scale size={18} style={{ color: '#f59e0b' }} />;
    if (eventType.startsWith('WALLET_')) return <Wallet size={18} style={{ color: '#3b82f6' }} />;
    if (eventType.startsWith('COD_')) return <IndianRupee size={18} style={{ color: '#10b981' }} />;
    if (eventType.startsWith('SHIPMENT_')) return <Package size={18} style={{ color: 'var(--color-violet-main)' }} />;
    return <Bell size={18} style={{ color: 'var(--color-violet-main)' }} />;
  };

  if (activeToasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '64px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none', // Cards enable pointerEvents
      }}
    >
      {activeToasts.map((toastItem) => {
        const isCritical = toastItem.priority === 'CRITICAL';
        const isHigh = toastItem.priority === 'HIGH';

        const borderColor = isCritical ? '#fca5a5' : isHigh ? '#fde68a' : '#cbd5e1';
        const badgeColor = isCritical ? '#ef4444' : isHigh ? '#f59e0b' : '#3b82f6';
        const badgeText = isCritical ? '🔴 CRITICAL ALERT' : isHigh ? '🟠 HIGH PRIORITY' : '🔵 LIVE UPDATE';

        return (
          <div
            key={toastItem.id}
            onClick={() => handleActionClick(toastItem)}
            style={{
              pointerEvents: 'auto',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: `1px solid ${borderColor}`,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              cursor: 'pointer',
              animation: 'slideInRight 0.3s ease-out',
              borderLeft: `4px solid ${badgeColor}`,
            }}
          >
            {/* Header: Icon, Priority Badge & Dismiss */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {renderIcon(toastItem.eventType)}
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: badgeColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {badgeText}
                </span>
              </div>

              <button
                onClick={(e) => handleDismiss(toastItem.id, e)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Title & Message */}
            <div>
              <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                {toastItem.title}
              </strong>
              <p style={{ fontSize: '11px', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                {toastItem.message}
              </p>
            </div>

            {/* Action Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px dashed #f1f5f9' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{toastItem.createdAt}</span>
              <button
                onClick={() => handleActionClick(toastItem)}
                style={{
                  border: 'none',
                  backgroundColor: isCritical ? '#fee2e2' : 'var(--color-violet-light)',
                  color: isCritical ? '#dc2626' : 'var(--color-violet-main)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                View Details <ArrowRight size={11} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
