import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ArrowRight,
  Truck,
  Wallet,
  RotateCcw,
  Scale,
  FileText,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  CreditCard,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  RealtimeNotificationService,
  type AppNotificationRecord,
} from '../../services/realtimeNotificationService';

export interface NotificationDropdownProps {
  portalName?: string;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  portalName = 'Customer Portal',
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'All' | 'Orders' | 'Finance' | 'NDR' | 'System' | 'Unread'>('All');
  const [activeToast, setActiveToast] = useState<AppNotificationRecord | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const role = portalName.includes('Admin') ? 'ADMIN' : 'CUSTOMER';
  const tenantId = 'tenant-demo-01';

  const [notifications, setNotifications] = useState<AppNotificationRecord[]>(() =>
    RealtimeNotificationService.getNotifications(role, tenantId, activeTab)
  );
  const [unreadCount, setUnreadCount] = useState<number>(() =>
    RealtimeNotificationService.getUnreadCount(role, tenantId)
  );

  const refreshData = () => {
    setNotifications([...RealtimeNotificationService.getNotifications(role, tenantId, activeTab)]);
    setUnreadCount(RealtimeNotificationService.getUnreadCount(role, tenantId));
  };

  // Realtime subscriber for Bell updates & Toast Alerts
  useEffect(() => {
    const unsubscribe = RealtimeNotificationService.subscribe((newNotif) => {
      refreshData();

      // Show real-time Toast Alert if toast eligible!
      if (newNotif.isToastEligible) {
        setActiveToast(newNotif);
        setTimeout(() => setActiveToast(null), 6000);
      }
    });
    return () => unsubscribe();
  }, [role, tenantId, activeTab]);

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    RealtimeNotificationService.markAllAsRead(role, tenantId);
    refreshData();
  };

  const handleNotificationClick = (item: AppNotificationRecord) => {
    RealtimeNotificationService.markAsRead(item.id);
    refreshData();
    setIsOpen(false);
    navigate(item.actionUrl);
  };

  // Icon Helper for Notification Event Types
  const getEventIcon = (eventType: string, priority: string) => {
    if (eventType.includes('NDR')) return <AlertTriangle size={16} style={{ color: '#ea580c' }} />;
    if (eventType.includes('RTO')) return <RotateCcw size={16} style={{ color: '#dc2626' }} />;
    if (eventType.includes('WEIGHT')) return <Scale size={16} style={{ color: '#d97706' }} />;
    if (eventType.includes('WALLET')) return <Wallet size={16} style={{ color: priority === 'CRITICAL' ? '#dc2626' : '#0284c7' }} />;
    if (eventType.includes('COD') || eventType.includes('RECHARGE')) return <CreditCard size={16} style={{ color: '#16a34a' }} />;
    if (eventType.includes('INVOICE')) return <FileText size={16} style={{ color: '#0284c7' }} />;
    if (eventType.includes('TICKET')) return <HelpCircle size={16} style={{ color: '#0284c7' }} />;
    if (eventType.includes('DELIVERED')) return <CheckCircle2 size={16} style={{ color: '#16a34a' }} />;
    return <Truck size={16} style={{ color: '#0284c7' }} />;
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <Badge variant="danger" style={{ fontSize: '9px', padding: '1px 5px' }}>Critical</Badge>;
      case 'HIGH':
        return <Badge variant="warning" style={{ fontSize: '9px', padding: '1px 5px' }}>High</Badge>;
      case 'MEDIUM':
        return <Badge variant="info" style={{ fontSize: '9px', padding: '1px 5px' }}>Medium</Badge>;
      default:
        return <Badge variant="neutral" style={{ fontSize: '9px', padding: '1px 5px' }}>Low</Badge>;
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      
      {/* REAL-TIME TOAST POPUP NOTIFICATION */}
      {activeToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#ffffff',
            border: '1px solid ' + (activeToast.priority === 'CRITICAL' ? '#fca5a5' : '#cbd5e1'),
            borderLeft: '4px solid ' + (activeToast.priority === 'CRITICAL' ? '#dc2626' : activeToast.priority === 'HIGH' ? '#ea580c' : '#0284c7'),
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
            zIndex: 9999,
            maxWidth: '380px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <div style={{ marginTop: '2px' }}>{getEventIcon(activeToast.eventType, activeToast.priority)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>{activeToast.title}</strong>
              <button onClick={() => setActiveToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={14} />
              </button>
            </div>
            <p style={{ fontSize: '11px', color: '#475569', margin: '4px 0 8px 0', lineHeight: 1.4 }}>
              {activeToast.message}
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleNotificationClick(activeToast)}
              style={{ fontSize: '11px', padding: '3px 10px', backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            >
              {activeToast.actionLabel || 'View Detail'}
            </Button>
          </div>
        </div>
      )}

      {/* Bell Trigger Button */}
      <button
        onClick={() => {
          refreshData();
          setIsOpen((prev) => !prev);
        }}
        style={{
          position: 'relative',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#ffffff',
          color: '#334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        aria-label="Notifications"
        title="Notifications Center"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 0 2px #ffffff',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-Over Notification Drawer Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '420px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          {/* Panel Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                {role === 'ADMIN' ? 'Admin System Alerts' : 'Logistics Notifications'}
              </strong>
              {unreadCount > 0 && <Badge variant="brand" style={{ fontSize: '10px' }}>{unreadCount} Unread</Badge>}
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead} style={{ fontSize: '11px', color: '#0284c7' }}>
                Mark all read
              </Button>
            )}
          </div>

          {/* TAB BAR (All, Orders, Finance, NDR, System, Unread) */}
          <div style={{ display: 'flex', gap: '4px', padding: '8px 12px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff', overflowX: 'auto' }}>
            {(['All', 'Orders', 'Finance', 'NDR', 'System', 'Unread'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeTab === tab ? '#0284c7' : 'transparent',
                  color: activeTab === tab ? '#ffffff' : '#64748b',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Panel Notification List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                No notifications in "{activeTab}".
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: item.isRead ? '#ffffff' : '#f0f9ff',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div style={{ marginTop: '2px' }}>{getEventIcon(item.eventType, item.priority)}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <strong style={{ fontSize: '12px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </strong>
                      {renderPriorityBadge(item.priority)}
                    </div>

                    <p style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4, margin: '2px 0 6px 0' }}>
                      {item.message}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>{item.createdAt}</span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleNotificationClick(item)}
                        style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                      >
                        {item.actionLabel || 'View'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Panel Footer */}
          <div
            style={{
              padding: '8px 16px',
              borderTop: '1px solid #e2e8f0',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                navigate('/app/notifications');
              }}
              style={{ fontSize: '12px', width: '100%', color: '#0284c7', fontWeight: '700' }}
            >
              Open Full Notification History Center <ArrowRight size={13} style={{ marginLeft: '4px' }} />
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};
