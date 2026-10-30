import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  Eye,
  AlertTriangle,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Input,
} from '../../components/ui';
import {
  RealtimeNotificationService,
  type AppNotificationRecord,
} from '../../services/realtimeNotificationService';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const tenantId = 'tenant-demo-01';

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [notifications, setNotifications] = useState<AppNotificationRecord[]>(() =>
    RealtimeNotificationService.getNotifications('CUSTOMER', tenantId)
  );
  const [unreadCount, setUnreadCount] = useState<number>(() =>
    RealtimeNotificationService.getUnreadCount('CUSTOMER', tenantId)
  );

  const refreshData = () => {
    setNotifications(RealtimeNotificationService.getNotifications('CUSTOMER', tenantId, activeCategory));
    setUnreadCount(RealtimeNotificationService.getUnreadCount('CUSTOMER', tenantId));
  };

  useEffect(() => {
    const unsubscribe = RealtimeNotificationService.subscribe(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, [activeCategory, tenantId]);

  const handleMarkAsRead = (id: string) => {
    RealtimeNotificationService.markAsRead(id);
    refreshData();
  };

  const handleMarkAllRead = () => {
    RealtimeNotificationService.markAllAsRead('CUSTOMER', tenantId);
    refreshData();
  };

  const handleNotificationClick = (r: AppNotificationRecord) => {
    RealtimeNotificationService.markAsRead(r.id);
    refreshData();
    navigate(r.actionUrl);
  };

  // CSV Export Feature
  const handleExportCsv = () => {
    const headers = ['ID', 'Title', 'Message', 'Category', 'Priority', 'AWB', 'Order ID', 'Read Status', 'Timestamp'];
    const rows = filteredNotifications.map((n) => [
      n.id,
      `"${n.title.replace(/"/g, '""')}"`,
      `"${n.message.replace(/"/g, '""')}"`,
      n.category,
      n.priority,
      n.awbNumber || '',
      n.orderId || '',
      n.isRead ? 'Read' : 'Unread',
      n.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `notification_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Pipeline
  const filteredNotifications = notifications.filter((n) => {
    // Category Filter
    if (activeCategory !== 'all' && activeCategory !== 'unread') {
      if (n.category !== activeCategory) return false;
    }
    if (activeCategory === 'unread' && n.isRead) return false;

    // Priority Filter
    if (priorityFilter !== 'all' && n.priority !== priorityFilter) return false;

    // Read/Unread Filter
    if (readFilter === 'read' && !n.isRead) return false;
    if (readFilter === 'unread' && n.isRead) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.awbNumber && n.awbNumber.toLowerCase().includes(q)) ||
        (n.orderId && n.orderId.toLowerCase().includes(q))
      );
    }

    return true;
  });

  const criticalCount = notifications.filter((n) => n.priority === 'CRITICAL' && !n.isRead).length;

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Notification History Center', path: '/app/notifications' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. Page Header */}
      <PageHeader
        title="Notification History & Alert Engine"
        description="Central operational alert stream for NDR exceptions, weight discrepancies, COD payouts, and wallet balance warnings."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={handleExportCsv}>
              Export History (CSV)
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Check size={14} />} onClick={handleMarkAllRead} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
              Mark All as Read
            </Button>
          </div>
        }
      />

      {/* 2. Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Logged Alerts" value={notifications.length} subtext="System operational history" icon={Bell} />
        <StatCard label="Unread Action Items" value={unreadCount} subtext="Requires merchant attention" badgeText="UNREAD" badgeVariant="brand" icon={Bell} />
        <StatCard label="Critical Action Alerts" value={criticalCount} subtext="NDR & low balance warnings" badgeText="CRITICAL" badgeVariant="danger" icon={AlertTriangle} />
      </div>

      {/* 3. Category & Multi-Field Filters Card */}
      <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Top Filter Controls */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Alerts' },
                { id: 'unread', label: `Unread (${unreadCount})` },
                { id: 'Orders', label: 'Orders 📦' },
                { id: 'Finance', label: 'Finance 💳' },
                { id: 'NDR', label: 'NDR & RTO ⚠️' },
                { id: 'System', label: 'System ⚙️' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeCategory === tab.id ? '#0284c7' : '#f1f5f9',
                    color: activeCategory === tab.id ? '#ffffff' : '#475569',
                    fontWeight: activeCategory === tab.id ? '700' : '500',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ flex: 1, minWidth: '240px', maxWidth: '360px', position: 'relative' }}>
              <Input
                placeholder="Search AWB, Order ID, Title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          {/* Secondary Priority & Read Status Selectors */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '10px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={13} style={{ color: '#64748b' }} />
              <span style={{ color: '#64748b', fontWeight: '600' }}>Priority:</span>
              {['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid ' + (priorityFilter === p ? '#0284c7' : '#e2e8f0'),
                    backgroundColor: priorityFilter === p ? '#f0f9ff' : '#ffffff',
                    color: priorityFilter === p ? '#0284c7' : '#475569',
                    fontSize: '11px',
                    fontWeight: priorityFilter === p ? '700' : '400',
                    cursor: 'pointer',
                  }}
                >
                  {p === 'all' ? 'All Priorities' : p}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Read Status:</span>
              {['all', 'unread', 'read'].map((st) => (
                <button
                  key={st}
                  onClick={() => setReadFilter(st)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid ' + (readFilter === st ? '#0284c7' : '#e2e8f0'),
                    backgroundColor: readFilter === st ? '#f0f9ff' : '#ffffff',
                    color: readFilter === st ? '#0284c7' : '#475569',
                    fontSize: '11px',
                    fontWeight: readFilter === st ? '700' : '400',
                    cursor: 'pointer',
                  }}
                >
                  {st === 'all' ? 'All' : st === 'unread' ? 'Unread Only' : 'Read Only'}
                </button>
              ))}
            </div>
          </div>

        </div>
      </Card>

      {/* 4. Actionable Notification Table */}
      <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <Table<AppNotificationRecord>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'priority',
              header: 'Priority',
              render: (r) => (
                <Badge variant={r.priority === 'CRITICAL' ? 'danger' : r.priority === 'HIGH' ? 'warning' : r.priority === 'MEDIUM' ? 'info' : 'neutral'}>
                  {r.priority}
                </Badge>
              ),
            },
            {
              key: 'title',
              header: 'Title & Event Message',
              render: (r) => (
                <div>
                  <strong style={{ color: '#0f172a', fontSize: '13px', display: 'block' }}>
                    {r.title}
                  </strong>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{r.message}</div>
                  {r.awbNumber && (
                    <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '700', marginTop: '4px', display: 'inline-block' }}>
                      AWB: {r.awbNumber} {r.orderId ? `(${r.orderId})` : ''}
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: 'category',
              header: 'Category',
              render: (r) => (
                <Badge variant="brand" style={{ fontSize: '10px' }}>
                  {r.category}
                </Badge>
              ),
            },
            {
              key: 'isRead',
              header: 'Status',
              render: (r) => (
                <Badge variant={r.isRead ? 'neutral' : 'brand'}>
                  {r.isRead ? 'READ' : 'UNREAD'}
                </Badge>
              ),
            },
            {
              key: 'createdAt',
              header: 'Time',
              render: (r) => <span style={{ fontSize: '11px', color: '#64748b' }}>{r.createdAt}</span>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (r) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {!r.isRead && (
                    <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(r.id)} style={{ fontSize: '11px' }}>
                      Mark Read
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Eye size={13} />}
                    onClick={() => handleNotificationClick(r)}
                    style={{ fontSize: '11px', backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                  >
                    {r.actionLabel || 'Open Action'}
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredNotifications}
          emptyText="No notifications match the active filter criteria."
        />
      </Card>
    </div>
  );
};
