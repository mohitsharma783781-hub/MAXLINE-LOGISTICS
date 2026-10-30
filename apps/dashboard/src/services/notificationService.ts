export type NotificationType =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | 'SHIPMENT'
  | 'PAYMENT'
  | 'WALLET'
  | 'NDR'
  | 'RTO'
  | 'SYSTEM';

export type NotificationReferenceType =
  | 'SHIPMENT'
  | 'ORDER'
  | 'WALLET'
  | 'RECHARGE'
  | 'IMPORT'
  | 'SYSTEM';

export interface AppNotification extends Record<string, unknown> {
  id: string;
  recipientId: string;
  recipientType: 'CUSTOMER' | 'ADMIN';
  title: string;
  message: string;
  type: NotificationType;
  referenceType: NotificationReferenceType;
  referenceId: string;
  isRead: boolean;
  createdAt: string;
  eventId?: string;
}

export interface NotificationChannelAdapter {
  channelId: string;
  channelName: string;
  send: (notification: AppNotification) => Promise<{ success: boolean; channelRef?: string }>;
}

export interface NotificationPreferences extends Record<string, unknown> {
  bookingUpdates: boolean;
  shipmentUpdates: boolean;
  walletUpdates: boolean;
  paymentUpdates: boolean;
  ndrRtoUpdates: boolean;
}

export interface AdminNotificationSettings extends Record<string, unknown> {
  lowWalletThresholdINR: number;
  enableAdminAlerts: boolean;
  enableCustomerNotifications: boolean;
}

// Default Initial Seed Notifications
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

let NOTIFICATION_STORE: AppNotification[] = [];
const PROCESSED_EVENT_KEYS = new Set<string>();

let CUSTOMER_PREFERENCES: NotificationPreferences = {
  bookingUpdates: true,
  shipmentUpdates: true,
  walletUpdates: true,
  paymentUpdates: true,
  ndrRtoUpdates: true,
};

let ADMIN_SETTINGS: AdminNotificationSettings = {
  lowWalletThresholdINR: 500,
  enableAdminAlerts: true,
  enableCustomerNotifications: true,
};

// 1. Channel Adapters
export const InAppNotificationChannel: NotificationChannelAdapter = {
  channelId: 'in_app',
  channelName: 'In-App Dashboard Notification Channel',
  send: async (n) => ({ success: true, channelRef: `inapp-${n.id}` }),
};

export const EmailNotificationChannel: NotificationChannelAdapter = {
  channelId: 'email',
  channelName: 'SMTP / Email Notification Channel (HELD / UNCONFIGURED)',
  send: async () => ({ success: false, channelRef: 'Email credentials not configured.' }),
};

export const SMSNotificationChannel: NotificationChannelAdapter = {
  channelId: 'sms',
  channelName: 'SMS Gateway Channel (HELD / UNCONFIGURED)',
  send: async () => ({ success: false, channelRef: 'SMS API credentials not configured.' }),
};

export const WhatsAppNotificationChannel: NotificationChannelAdapter = {
  channelId: 'whatsapp',
  channelName: 'WhatsApp Business API Channel (HELD / UNCONFIGURED)',
  send: async () => ({ success: false, channelRef: 'WhatsApp API credentials not configured.' }),
};

export const NotificationService = {
  getNotifications: (
    recipientType: 'CUSTOMER' | 'ADMIN',
    recipientId = 'tenant-demo-01',
    typeFilter = 'all'
  ): AppNotification[] => {
    return NOTIFICATION_STORE.filter((n) => {
      if (n.recipientType !== recipientType) return false;
      if (recipientType === 'CUSTOMER' && n.recipientId !== recipientId) return false;
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      return true;
    });
  },

  getUnreadCount: (recipientType: 'CUSTOMER' | 'ADMIN', recipientId = 'tenant-demo-01'): number => {
    return NOTIFICATION_STORE.filter(
      (n) => n.recipientType === recipientType && (recipientType === 'ADMIN' || n.recipientId === recipientId) && !n.isRead
    ).length;
  },

  markAsRead: (notificationId: string): void => {
    const item = NOTIFICATION_STORE.find((n) => n.id === notificationId);
    if (item) {
      item.isRead = true;
    }
  },

  markAllAsRead: (recipientType: 'CUSTOMER' | 'ADMIN', recipientId = 'tenant-demo-01'): void => {
    NOTIFICATION_STORE.forEach((n) => {
      if (n.recipientType === recipientType && (recipientType === 'ADMIN' || n.recipientId === recipientId)) {
        n.isRead = true;
      }
    });
  },

  // Centralized Event Notification Creator with Idempotency Guard
  createNotification: (input: {
    recipientId: string;
    recipientType: 'CUSTOMER' | 'ADMIN';
    title: string;
    message: string;
    type: NotificationType;
    referenceType: NotificationReferenceType;
    referenceId: string;
    eventId?: string;
  }): AppNotification | null => {
    // Idempotency Check
    const eventKey = input.eventId || `${input.recipientType}_${input.type}_${input.referenceId}`;
    if (PROCESSED_EVENT_KEYS.has(eventKey)) {
      return null; // Ignore duplicate event notification cleanly
    }
    PROCESSED_EVENT_KEYS.add(eventKey);

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      recipientId: input.recipientId,
      recipientType: input.recipientType,
      title: input.title,
      message: input.message,
      type: input.type,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      isRead: false,
      createdAt: new Date().toLocaleString(),
      eventId: eventKey,
    };

    NOTIFICATION_STORE.unshift(newNotif);

    // Deliver via In-App Channel
    InAppNotificationChannel.send(newNotif);

    return newNotif;
  },

  // Low Wallet Alert Checker
  checkLowWalletAlert: (tenantId: string, currentBalanceINR: number): void => {
    if (currentBalanceINR <= ADMIN_SETTINGS.lowWalletThresholdINR) {
      // Create Customer Alert
      NotificationService.createNotification({
        recipientId: tenantId,
        recipientType: 'CUSTOMER',
        title: 'Low Wallet Balance Warning',
        message: `Your merchant wallet balance (₹${currentBalanceINR.toFixed(2)}) has fallen below the ₹${ADMIN_SETTINGS.lowWalletThresholdINR} threshold. Please recharge to avoid shipment dispatch delays.`,
        type: 'WARNING',
        referenceType: 'WALLET',
        referenceId: tenantId,
        eventId: `low_wallet_c_${tenantId}_${Math.floor(currentBalanceINR)}`,
      });

      // Create Admin Alert
      NotificationService.createNotification({
        recipientId: 'admin',
        recipientType: 'ADMIN',
        title: 'Customer Low Wallet Balance Alert',
        message: `Merchant tenant '${tenantId}' balance is low (₹${currentBalanceINR.toFixed(2)}).`,
        type: 'WARNING',
        referenceType: 'WALLET',
        referenceId: tenantId,
        eventId: `low_wallet_a_${tenantId}_${Math.floor(currentBalanceINR)}`,
      });
    }
  },

  getCustomerPreferences: (): NotificationPreferences => ({ ...CUSTOMER_PREFERENCES }),
  updateCustomerPreferences: (prefs: Partial<NotificationPreferences>): NotificationPreferences => {
    CUSTOMER_PREFERENCES = { ...CUSTOMER_PREFERENCES, ...prefs };
    return { ...CUSTOMER_PREFERENCES };
  },

  getAdminSettings: (): AdminNotificationSettings => ({ ...ADMIN_SETTINGS }),
  updateAdminSettings: (settings: Partial<AdminNotificationSettings>): AdminNotificationSettings => {
    ADMIN_SETTINGS = { ...ADMIN_SETTINGS, ...settings };
    return { ...ADMIN_SETTINGS };
  },
};
