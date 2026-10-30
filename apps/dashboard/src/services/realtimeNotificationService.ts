export type RealtimeNotificationEventType =
  | 'SHIPMENT_BOOKED'
  | 'PICKUP_SCHEDULED'
  | 'PICKUP_FAILED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'NDR_ALERT'
  | 'NDR_CREATED'
  | 'RTO_ALERT'
  | 'WEIGHT_DISCREPANCY'
  | 'COD_REMITTANCE'
  | 'COD_REMITTANCE_RELEASED'
  | 'WALLET_LOW_BALANCE'
  | 'RECHARGE_SUCCESS'
  | 'INVOICE_GENERATED'
  | 'SUPPORT_TICKET_UPDATE'
  | 'COURIER_API_ERROR';

export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type NotificationCategory = 'Orders' | 'Finance' | 'NDR' | 'System';

export interface AppNotificationRecord extends Record<string, unknown> {
  id: string;
  idempotencyKey: string;
  tenantId: string;
  userId?: string;
  role: 'CUSTOMER' | 'ADMIN';
  eventType: RealtimeNotificationEventType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  awbNumber?: string;
  orderId?: string;
  actionUrl: string;
  actionLabel: string;
  isRead: boolean;
  readAt?: string;
  isToastEligible: boolean;
  createdAt: string;
}

type NotificationSubscriber = (notification: AppNotificationRecord) => void;

// Memory Store for Realtime Notifications
const INITIAL_REALTIME_NOTIFICATIONS: AppNotificationRecord[] = [
  {
    id: 'NTF-20260828-001',
    idempotencyKey: 'SHP-DEL98401928_NDR_ALERT_v1',
    tenantId: 'tenant-demo-01',
    role: 'CUSTOMER',
    eventType: 'NDR_ALERT',
    category: 'NDR',
    priority: 'CRITICAL',
    title: 'NDR Action Required — Attempt Failed',
    message: 'Shipment DEL98401928 (Order ORD-2026-98403) delivery failed. Buyer premises closed.',
    awbNumber: 'DEL98401928',
    orderId: 'ORD-2026-98403',
    actionUrl: '/app/ndr',
    actionLabel: 'View NDR',
    isRead: false,
    isToastEligible: true,
    createdAt: '2 mins ago',
  },
  {
    id: 'NTF-20260828-002',
    idempotencyKey: 'SHP-BD749102834_WEIGHT_DISCREPANCY_v1',
    tenantId: 'tenant-demo-01',
    role: 'CUSTOMER',
    eventType: 'WEIGHT_DISCREPANCY',
    category: 'Orders',
    priority: 'HIGH',
    title: 'Weight Discrepancy Audited (+1.5 KG)',
    message: 'Courier Blue Dart reported weight variance on AWB BD749102834. Wallet debited ₹180.',
    awbNumber: 'BD749102834',
    orderId: 'ORD-2026-8812',
    actionUrl: '/app/weight-discrepancies',
    actionLabel: 'Dispute Weight',
    isRead: false,
    isToastEligible: true,
    createdAt: '15 mins ago',
  },
  {
    id: 'NTF-20260828-003',
    idempotencyKey: 'COD-REMIT-2026-08-28_RELEASED',
    tenantId: 'tenant-demo-01',
    role: 'CUSTOMER',
    eventType: 'COD_REMITTANCE_RELEASED',
    category: 'Finance',
    priority: 'MEDIUM',
    title: 'COD Remittance Released (₹12,500)',
    message: 'Weekly COD payout cycle processed. Funds credited to HDFC Bank ****9812.',
    actionUrl: '/app/cod',
    actionLabel: 'View Remittance',
    isRead: false,
    isToastEligible: true,
    createdAt: '45 mins ago',
  },
  {
    id: 'NTF-20260828-004',
    idempotencyKey: 'WALLET_LOW_BALANCE_CHECK_001',
    tenantId: 'tenant-demo-01',
    role: 'CUSTOMER',
    eventType: 'WALLET_LOW_BALANCE',
    category: 'Finance',
    priority: 'CRITICAL',
    title: 'Wallet Balance Below ₹500 Warning',
    message: 'Available balance is ₹340.00. Recharge wallet now to avoid booking holds.',
    actionUrl: '/app/wallet',
    actionLabel: 'Recharge Wallet',
    isRead: false,
    isToastEligible: true,
    createdAt: '2 hours ago',
  },
  {
    id: 'NTF-20260828-005',
    idempotencyKey: 'SHP-TCI74829102_RTO_ALERT_v1',
    tenantId: 'tenant-demo-01',
    role: 'CUSTOMER',
    eventType: 'RTO_ALERT',
    category: 'NDR',
    priority: 'HIGH',
    title: 'RTO Initiated — Consignee Refused',
    message: 'Shipment TCI74829102 rejected by buyer. Package returning to origin hub.',
    awbNumber: 'TCI74829102',
    orderId: 'ORD-2026-98405',
    actionUrl: '/app/rto',
    actionLabel: 'View RTO',
    isRead: true,
    isToastEligible: false,
    createdAt: '3 hours ago',
  },
  {
    id: 'NTF-20260828-006',
    idempotencyKey: 'TICKET_SUP-98401_REPLY',
    tenantId: 'tenant-demo-01',
    role: 'CUSTOMER',
    eventType: 'SUPPORT_TICKET_UPDATE',
    category: 'System',
    priority: 'MEDIUM',
    title: 'Support Ticket SUP-98401 Updated',
    message: 'Logistics Operations team responded to your NDR delivery delay ticket.',
    actionUrl: '/app/exceptions',
    actionLabel: 'View Ticket',
    isRead: true,
    isToastEligible: true,
    createdAt: '5 hours ago',
  },
  {
    id: 'NTF-20260828-007',
    idempotencyKey: 'INV-2026-08-GST_GEN',
    tenantId: 'tenant-demo-01',
    role: 'CUSTOMER',
    eventType: 'INVOICE_GENERATED',
    category: 'Finance',
    priority: 'LOW',
    title: 'August GST Invoice Generated',
    message: 'Monthly GST Tax Invoice INV-2026-08 is available for PDF download.',
    actionUrl: '/app/billing',
    actionLabel: 'Download Invoice',
    isRead: true,
    isToastEligible: false,
    createdAt: '1 day ago',
  },
  {
    id: 'NTF-20260828-008',
    idempotencyKey: 'API_ERR_DELHIVERY_TIMEOUT_01',
    tenantId: 'tenant-demo-01',
    role: 'ADMIN',
    eventType: 'COURIER_API_ERROR',
    category: 'System',
    priority: 'CRITICAL',
    title: 'Delhivery API Sync Timeout (504)',
    message: '3 manifest creation requests failed due to Delhivery gateway timeout.',
    actionUrl: '/admin/couriers',
    actionLabel: 'View API Logs',
    isRead: false,
    isToastEligible: true,
    createdAt: '10 mins ago',
  },
];

let NOTIFICATIONS_STORE: AppNotificationRecord[] = [...INITIAL_REALTIME_NOTIFICATIONS];
const SUBSCRIBERS: Set<NotificationSubscriber> = new Set();

export const RealtimeNotificationService = {
  subscribe: (callback: NotificationSubscriber): (() => void) => {
    SUBSCRIBERS.add(callback);
    return () => {
      SUBSCRIBERS.delete(callback);
    };
  },

  emitLiveEvent: (notification: AppNotificationRecord) => {
    SUBSCRIBERS.forEach((callback) => {
      try {
        callback(notification);
      } catch (e) {
        console.error('Error in notification subscriber:', e);
      }
    });
  },

  getUnreadCount: (role: 'CUSTOMER' | 'ADMIN' = 'CUSTOMER', tenantId = 'tenant-demo-01'): number => {
    return NOTIFICATIONS_STORE.filter((n) => {
      if (n.isRead) return false;
      if (role === 'CUSTOMER' && n.tenantId !== tenantId) return false;
      if (role === 'ADMIN' && n.role !== 'ADMIN') return false;
      return true;
    }).length;
  },

  getNotifications: (
    role: 'CUSTOMER' | 'ADMIN' = 'CUSTOMER',
    tenantId = 'tenant-demo-01',
    tabFilter = 'all'
  ): AppNotificationRecord[] => {
    return NOTIFICATIONS_STORE.filter((n) => {
      if (role === 'CUSTOMER' && n.tenantId !== tenantId) return false;
      if (role === 'ADMIN' && n.role !== 'ADMIN') return false;

      if (tabFilter === 'unread' && n.isRead) return false;
      if (tabFilter === 'Orders' && n.category !== 'Orders') return false;
      if (tabFilter === 'Finance' && n.category !== 'Finance') return false;
      if (tabFilter === 'NDR' && n.category !== 'NDR') return false;
      if (tabFilter === 'System' && n.category !== 'System') return false;
      if (tabFilter === 'critical' && n.priority !== 'CRITICAL') return false;

      return true;
    });
  },

  markAsRead: (id: string): void => {
    const item = NOTIFICATIONS_STORE.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      item.readAt = new Date().toLocaleTimeString();
    }
  },

  markAllAsRead: (role: 'CUSTOMER' | 'ADMIN' = 'CUSTOMER', tenantId = 'tenant-demo-01'): void => {
    NOTIFICATIONS_STORE.forEach((n) => {
      if ((role === 'CUSTOMER' && n.tenantId === tenantId) || (role === 'ADMIN' && n.role === 'ADMIN')) {
        n.isRead = true;
        n.readAt = new Date().toLocaleTimeString();
      }
    });
  },

  triggerEvent: (input: {
    tenantId: string;
    role?: 'CUSTOMER' | 'ADMIN';
    eventType: RealtimeNotificationEventType;
    category?: NotificationCategory;
    priority?: NotificationPriority;
    title: string;
    message: string;
    awbNumber?: string;
    orderId?: string;
    actionUrl?: string;
    actionLabel?: string;
    isToastEligible?: boolean;
  }): AppNotificationRecord => {
    const role = input.role || 'CUSTOMER';
    const idempotencyKey = `${input.tenantId}_${input.eventType}_${input.awbNumber || Date.now()}`;

    let category: NotificationCategory = input.category || 'Orders';
    if (input.eventType.includes('NDR') || input.eventType.includes('RTO')) category = 'NDR';
    else if (input.eventType.includes('WALLET') || input.eventType.includes('COD') || input.eventType.includes('INVOICE') || input.eventType.includes('RECHARGE')) category = 'Finance';
    else if (input.eventType.includes('API') || input.eventType.includes('TICKET')) category = 'System';

    let priority: NotificationPriority = input.priority || 'MEDIUM';
    let isToast = input.isToastEligible ?? false;

    if (['NDR_ALERT', 'NDR_CREATED', 'WALLET_LOW_BALANCE', 'COURIER_API_ERROR'].includes(input.eventType)) {
      priority = 'CRITICAL';
      isToast = true;
    } else if (['RTO_ALERT', 'WEIGHT_DISCREPANCY', 'PICKUP_FAILED'].includes(input.eventType)) {
      priority = 'HIGH';
      isToast = true;
    }

    let actionUrl = input.actionUrl || '/app/notifications';
    let actionLabel = input.actionLabel || 'View Detail';

    if (input.eventType === 'NDR_ALERT' || input.eventType === 'NDR_CREATED') { actionUrl = '/app/ndr'; actionLabel = 'View NDR'; }
    else if (input.eventType === 'RTO_ALERT') { actionUrl = '/app/rto'; actionLabel = 'View RTO'; }
    else if (input.eventType === 'WALLET_LOW_BALANCE') { actionUrl = '/app/wallet'; actionLabel = 'Recharge Wallet'; }
    else if (input.eventType.startsWith('COD_')) { actionUrl = '/app/cod'; actionLabel = 'View Remittance'; }
    else if (input.eventType === 'WEIGHT_DISCREPANCY') { actionUrl = '/app/weight-discrepancies'; actionLabel = 'View Dispute'; }

    const newNotification: AppNotificationRecord = {
      id: `NTF-${Date.now()}`,
      idempotencyKey,
      tenantId: input.tenantId,
      role,
      eventType: input.eventType,
      category,
      priority,
      title: input.title,
      message: input.message,
      awbNumber: input.awbNumber,
      orderId: input.orderId,
      actionUrl,
      actionLabel,
      isRead: false,
      isToastEligible: isToast,
      createdAt: 'Just now',
    };

    NOTIFICATIONS_STORE.unshift(newNotification);
    RealtimeNotificationService.emitLiveEvent(newNotification);

    return newNotification;
  },
};
