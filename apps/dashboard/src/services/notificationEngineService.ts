import { BrandingService } from './brandingService';
import { WalletService } from '../mocks/wallet.mock';

export type NotificationEventType =
  | 'ORDER_CONFIRMED'
  | 'ORDER_DISPATCHED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'NDR_ATTEMPTED'
  | 'RTO_INITIATED'
  | 'RTO_DELIVERED';

export type NotificationChannel = 'WHATSAPP' | 'SMS' | 'EMAIL';

export type DeliveryStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'REJECTED';

export type BillingStatus =
  | 'FREE'
  | 'PAID'
  | 'INSUFFICIENT_BALANCE'
  | 'PAYMENT_REQUIRED'
  | 'REFUNDED'
  | 'SKIPPED';

export interface NotificationTemplate {
  eventType: NotificationEventType;
  eventName: string;
  category: 'TRANSACTIONAL' | 'PROMOTIONAL';
  whatsappEnabled: boolean;
  smsEnabled: boolean;
  whatsappTemplateName: string;
  whatsappBody: string;
  smsSenderId: string;
  smsBody: string;
  allowedVariables: string[];
}

export interface NotificationPricingConfig {
  freeQuotaPerMonth: number; // e.g. 100 free messages
  quotaModel: 'SHARED' | 'SEPARATE'; // SHARED = WhatsApp + SMS share 100; SEPARATE = 100 WA, 50 SMS
  whatsappFreeQuota: number;
  smsFreeQuota: number;
  whatsappPriceINR: number; // Customer price e.g. ₹1.00
  smsPriceINR: number;      // Customer price e.g. ₹0.50
  providerCostWhatsappINR: number; // Admin internal provider cost e.g. ₹0.65
  providerCostSmsINR: number;      // Admin internal provider cost e.g. ₹0.25
  billingPolicy: 'CHARGE_ACCEPTED' | 'CHARGE_DELIVERED' | 'NEVER_CHARGE_FAILED';
  effectiveFrom: string;
}

export interface CustomerUsageQuotaSummary {
  tenantId: string;
  billingMonth: string;
  freeQuotaTotal: number;
  freeQuotaUsed: number;
  freeQuotaRemaining: number;
  paidMessagesCount: number;
  totalCustomerChargesINR: number;
  totalProviderCostsINR: number;
}

export interface NotificationRecord extends Record<string, unknown> {
  id: string;
  idempotencyKey: string; // ShipmentID + EventType + Version
  tenantId: string;
  merchantName: string;
  shipmentId: string;
  awbNumber: string;
  orderId: string;
  recipientName: string;
  recipientPhone: string;
  eventType: NotificationEventType;
  category: 'TRANSACTIONAL' | 'PROMOTIONAL';
  channel: NotificationChannel;
  providerName: string;

  // Dual Status System
  deliveryStatus: DeliveryStatus;
  billingStatus: BillingStatus;

  templateUsed: string;
  renderedMessage: string;
  trackingUrl: string;

  // Financial & Quota Details
  isFreeQuota: boolean;
  customerChargeINR: number;
  providerCostINR: number;
  walletTxnRef?: string;

  providerResponseId?: string;
  failureReason?: string;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface GlobalAdminNotificationConfig {
  globalServiceEnabled: boolean;
  brandedTrackingGlobalEnabled: boolean;
  whatsappGlobalEnabled: boolean;
  smsGlobalEnabled: boolean;
  emailGlobalEnabled: boolean;
  pricing: NotificationPricingConfig;
  whatsappProvider: {
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
    senderNumber: string;
    webhookUrl: string;
  };
  smsProvider: {
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
    senderId: string;
  };
}

let GLOBAL_ADMIN_CONFIG: GlobalAdminNotificationConfig = {
  globalServiceEnabled: true,
  brandedTrackingGlobalEnabled: true,
  whatsappGlobalEnabled: true,
  smsGlobalEnabled: true,
  emailGlobalEnabled: true,
  pricing: {
    freeQuotaPerMonth: 100,
    quotaModel: 'SHARED',
    whatsappFreeQuota: 100,
    smsFreeQuota: 50,
    whatsappPriceINR: 1.0,
    smsPriceINR: 0.5,
    providerCostWhatsappINR: 0.65,
    providerCostSmsINR: 0.25,
    billingPolicy: 'CHARGE_DELIVERED',
    effectiveFrom: '2026-08-01',
  },
  whatsappProvider: {
    name: 'Meta WhatsApp Cloud API',
    status: 'ACTIVE',
    senderNumber: '+91 98765 00000',
    webhookUrl: 'https://api.platform.com/webhooks/whatsapp',
  },
  smsProvider: {
    name: 'MSG91 Enterprise Gateway',
    status: 'ACTIVE',
    senderId: 'LOGIST',
  },
};

// Notification Event Master Configuration
const DEFAULT_TEMPLATES: Record<NotificationEventType, NotificationTemplate> = {
  ORDER_CONFIRMED: {
    eventType: 'ORDER_CONFIRMED',
    eventName: 'Order Confirmed',
    category: 'TRANSACTIONAL',
    whatsappEnabled: true,
    smsEnabled: true,
    whatsappTemplateName: 'order_confirmed_v1',
    whatsappBody: 'Hi {{customer_name}}, your order {{order_id}} has been confirmed by {{merchant_name}}! Track status: {{tracking_url}}',
    smsSenderId: 'LOGIST',
    smsBody: 'Hi {{customer_name}}, order {{order_id}} confirmed. Track: {{tracking_url}}',
    allowedVariables: ['{{customer_name}}', '{{order_id}}', '{{merchant_name}}', '{{tracking_url}}'],
  },
  ORDER_DISPATCHED: {
    eventType: 'ORDER_DISPATCHED',
    eventName: 'Order Dispatched / Booked',
    category: 'TRANSACTIONAL',
    whatsappEnabled: true,
    smsEnabled: true,
    whatsappTemplateName: 'order_dispatched_v1',
    whatsappBody: 'Hi {{customer_name}}, your order {{order_id}} has been dispatched via {{courier}}! AWB: {{awb}}. Track package: {{tracking_url}}',
    smsSenderId: 'LOGIST',
    smsBody: 'Hi {{customer_name}}, order {{order_id}} dispatched via {{courier}}. Track: {{tracking_url}}',
    allowedVariables: ['{{customer_name}}', '{{order_id}}', '{{awb}}', '{{courier}}', '{{tracking_url}}'],
  },
  IN_TRANSIT: {
    eventType: 'IN_TRANSIT',
    eventName: 'In Transit / On the Way',
    category: 'TRANSACTIONAL',
    whatsappEnabled: true,
    smsEnabled: false,
    whatsappTemplateName: 'in_transit_v1',
    whatsappBody: 'Hi {{customer_name}}, your package {{awb}} (order {{order_id}}) is in transit with {{courier}}. Live updates: {{tracking_url}}',
    smsSenderId: 'LOGIST',
    smsBody: 'Order {{order_id}} in transit via {{courier}}. Track: {{tracking_url}}',
    allowedVariables: ['{{customer_name}}', '{{order_id}}', '{{awb}}', '{{courier}}', '{{tracking_url}}'],
  },
  OUT_FOR_DELIVERY: {
    eventType: 'OUT_FOR_DELIVERY',
    eventName: 'Out for Doorstep Delivery',
    category: 'TRANSACTIONAL',
    whatsappEnabled: true,
    smsEnabled: true,
    whatsappTemplateName: 'out_for_delivery_v1',
    whatsappBody: 'Great news {{customer_name}}! Order {{order_id}} is OUT FOR DELIVERY today via {{courier}} (AWB {{awb}}). Track live: {{tracking_url}}',
    smsSenderId: 'LOGIST',
    smsBody: 'Hi {{customer_name}}, order {{order_id}} is Out for Delivery today via {{courier}}. Track: {{tracking_url}}',
    allowedVariables: ['{{customer_name}}', '{{order_id}}', '{{awb}}', '{{courier}}', '{{tracking_url}}'],
  },
  DELIVERED: {
    eventType: 'DELIVERED',
    eventName: 'Parcel Delivered Successfully',
    category: 'TRANSACTIONAL',
    whatsappEnabled: true,
    smsEnabled: true,
    whatsappTemplateName: 'order_delivered_v1',
    whatsappBody: 'Hi {{customer_name}}, order {{order_id}} has been DELIVERED! Thank you for shopping with {{merchant_name}}. View summary: {{tracking_url}}',
    smsSenderId: 'LOGIST',
    smsBody: 'Hi {{customer_name}}, order {{order_id}} delivered successfully! Thank you. Track: {{tracking_url}}',
    allowedVariables: ['{{customer_name}}', '{{order_id}}', '{{awb}}', '{{merchant_name}}', '{{tracking_url}}'],
  },
  NDR_ATTEMPTED: {
    eventType: 'NDR_ATTEMPTED',
    eventName: 'Delivery Exception (NDR Attempt)',
    category: 'TRANSACTIONAL',
    whatsappEnabled: true,
    smsEnabled: false,
    whatsappTemplateName: 'ndr_delivery_attempt_v1',
    whatsappBody: 'Hi {{customer_name}}, delivery attempt for order {{order_id}} was unsuccessful. Re-schedule delivery here: {{tracking_url}}',
    smsSenderId: 'LOGIST',
    smsBody: 'Hi {{customer_name}}, delivery attempt for order {{order_id}} failed. Action required: {{tracking_url}}',
    allowedVariables: ['{{customer_name}}', '{{order_id}}', '{{awb}}', '{{tracking_url}}'],
  },
  RTO_INITIATED: {
    eventType: 'RTO_INITIATED',
    eventName: 'Return to Sender Initiated (RTO)',
    category: 'TRANSACTIONAL',
    whatsappEnabled: true,
    smsEnabled: false,
    whatsappTemplateName: 'rto_initiated_v1',
    whatsappBody: 'Hi {{customer_name}}, order {{order_id}} is returning to seller. Track return status: {{tracking_url}}',
    smsSenderId: 'LOGIST',
    smsBody: 'Order {{order_id}} returning to seller. Track: {{tracking_url}}',
    allowedVariables: ['{{customer_name}}', '{{order_id}}', '{{awb}}', '{{tracking_url}}'],
  },
  RTO_DELIVERED: {
    eventType: 'RTO_DELIVERED',
    eventName: 'RTO Delivered to Origin Warehouse',
    category: 'TRANSACTIONAL',
    whatsappEnabled: false,
    smsEnabled: false,
    whatsappTemplateName: 'rto_delivered_v1',
    whatsappBody: 'Order {{order_id}} returned to origin warehouse.',
    smsSenderId: 'LOGIST',
    smsBody: 'Order {{order_id}} returned to origin.',
    allowedVariables: ['{{order_id}}'],
  },
};

let TEMPLATES_STORE = { ...DEFAULT_TEMPLATES };

// Demo Notification Records
export const INITIAL_NOTIFICATIONS: NotificationRecord[] = [
  {
    id: 'notif-101',
    idempotencyKey: 'SHP-ORD-2026-9041_OUT_FOR_DELIVERY_v1',
    tenantId: 'tenant-demo-01',
    merchantName: 'Acme Electronics India Pvt Ltd',
    shipmentId: 'SHP-ORD-2026-9041',
    awbNumber: 'DEL847192031',
    orderId: 'ORD-2026-9041',
    recipientName: 'Rahul Sharma',
    recipientPhone: '+91 98765 43210',
    eventType: 'OUT_FOR_DELIVERY',
    category: 'TRANSACTIONAL',
    channel: 'WHATSAPP',
    providerName: 'Meta WhatsApp Cloud API',
    deliveryStatus: 'DELIVERED',
    billingStatus: 'FREE',
    isFreeQuota: true,
    customerChargeINR: 0,
    providerCostINR: 0.65,
    templateUsed: 'out_for_delivery_v1',
    renderedMessage: 'Great news Rahul Sharma! Order ORD-2026-9041 is OUT FOR DELIVERY today via Delhivery Surface. Track: http://localhost:5173/track/acme-store/DEL847192031',
    trackingUrl: 'http://localhost:5173/track/acme-store/DEL847192031',
    providerResponseId: 'wa_msg_99812039',
    sentAt: '2026-08-25 09:12 AM',
    deliveredAt: '2026-08-25 09:12 AM',
    createdAt: '2026-08-25 09:12 AM',
  },
  {
    id: 'notif-102',
    idempotencyKey: 'SHP-ORD-2026-8812_ORDER_DISPATCHED_v1',
    tenantId: 'tenant-demo-01',
    merchantName: 'Acme Electronics India Pvt Ltd',
    shipmentId: 'SHP-ORD-2026-8812',
    awbNumber: 'BD749102834',
    orderId: 'ORD-2026-8812',
    recipientName: 'Priya Verma',
    recipientPhone: '+91 98111 22334',
    eventType: 'ORDER_DISPATCHED',
    category: 'TRANSACTIONAL',
    channel: 'SMS',
    providerName: 'MSG91 Enterprise Gateway',
    deliveryStatus: 'DELIVERED',
    billingStatus: 'FREE',
    isFreeQuota: true,
    customerChargeINR: 0,
    providerCostINR: 0.25,
    templateUsed: 'order_dispatched_sms',
    renderedMessage: 'Hi Priya Verma, order ORD-2026-8812 dispatched via Blue Dart Air. Track: http://localhost:5173/track/acme-store/BD749102834',
    trackingUrl: 'http://localhost:5173/track/acme-store/BD749102834',
    providerResponseId: 'sms_msg_7781920',
    sentAt: '2026-08-24 14:20 PM',
    deliveredAt: '2026-08-24 14:20 PM',
    createdAt: '2026-08-24 14:20 PM',
  },
];

let NOTIFICATION_LOG: NotificationRecord[] = [...INITIAL_NOTIFICATIONS];

export const NotificationEngineService = {
  // 1. Admin Master Config Operations
  getGlobalConfig: (): GlobalAdminNotificationConfig => {
    return { ...GLOBAL_ADMIN_CONFIG };
  },

  updateGlobalConfig: (updates: Partial<GlobalAdminNotificationConfig>): GlobalAdminNotificationConfig => {
    GLOBAL_ADMIN_CONFIG = { ...GLOBAL_ADMIN_CONFIG, ...updates };
    return { ...GLOBAL_ADMIN_CONFIG };
  },

  updatePricingConfig: (updates: Partial<NotificationPricingConfig>): NotificationPricingConfig => {
    GLOBAL_ADMIN_CONFIG.pricing = {
      ...GLOBAL_ADMIN_CONFIG.pricing,
      ...updates,
      effectiveFrom: new Date().toISOString().split('T')[0],
    };
    return { ...GLOBAL_ADMIN_CONFIG.pricing };
  },

  // 2. Templates Management
  getTemplates: (): Record<NotificationEventType, NotificationTemplate> => {
    return { ...TEMPLATES_STORE };
  },

  updateTemplate: (eventType: NotificationEventType, updates: Partial<NotificationTemplate>): NotificationTemplate => {
    TEMPLATES_STORE[eventType] = {
      ...TEMPLATES_STORE[eventType],
      ...updates,
    };
    return { ...TEMPLATES_STORE[eventType] };
  },

  // 3. Customer Free Quota & Usage Calculator
  getCustomerUsageSummary: (tenantId = 'tenant-demo-01'): CustomerUsageQuotaSummary => {
    const currentMonthStr = 'August 2026';
    const tenantLogs = NOTIFICATION_LOG.filter((n) => n.tenantId === tenantId && n.deliveryStatus !== 'FAILED' && n.deliveryStatus !== 'REJECTED');

    const totalCount = tenantLogs.length;
    const freeQuota = GLOBAL_ADMIN_CONFIG.pricing.freeQuotaPerMonth;
    const freeUsed = Math.min(totalCount, freeQuota);
    const freeRemaining = Math.max(0, freeQuota - freeUsed);
    const paidCount = Math.max(0, totalCount - freeQuota);

    let totalCharges = 0;
    let totalCosts = 0;

    tenantLogs.forEach((n) => {
      totalCharges += n.customerChargeINR || 0;
      totalCosts += n.providerCostINR || 0;
    });

    return {
      tenantId,
      billingMonth: currentMonthStr,
      freeQuotaTotal: freeQuota,
      freeQuotaUsed: freeUsed,
      freeQuotaRemaining: freeRemaining,
      paidMessagesCount: paidCount,
      totalCustomerChargesINR: Math.round(totalCharges * 100) / 100,
      totalProviderCostsINR: Math.round(totalCosts * 100) / 100,
    };
  },

  // 4. Notification Log Fetcher with Role Filters
  getNotificationLogs: (tenantId = 'all', channel = 'all', deliveryStatus = 'all'): NotificationRecord[] => {
    return NOTIFICATION_LOG.filter((n) => {
      if (tenantId !== 'all' && n.tenantId !== tenantId) return false;
      if (channel !== 'all' && n.channel !== channel) return false;
      if (deliveryStatus !== 'all' && n.deliveryStatus !== deliveryStatus) return false;
      return true;
    });
  },

  // 5. Central Notification Processor with Quota Check & Ledger Deduction
  triggerNotification: (input: {
    tenantId: string;
    shipmentId: string;
    awbNumber: string;
    orderId: string;
    courierName: string;
    recipientName: string;
    recipientPhone: string;
    eventType: NotificationEventType;
    forceChannel?: NotificationChannel;
    isTestRun?: boolean;
  }): { success: boolean; message: string; notificationId?: string; billingStatus?: BillingStatus } => {
    // SECURITY CHECK: Global Admin Override
    if (!GLOBAL_ADMIN_CONFIG.globalServiceEnabled) {
      return {
        success: false,
        message: 'Global Notification Engine is currently disabled by Platform Super Admin.',
        billingStatus: 'SKIPPED',
      };
    }

    // IDEMPOTENCY PROTECTION: Prevent duplicate notification triggers
    const idempotencyKey = `${input.shipmentId}_${input.eventType}_v1`;
    const existing = NOTIFICATION_LOG.find((n) => n.idempotencyKey === idempotencyKey);
    if (existing && !input.isTestRun) {
      return {
        success: true,
        message: `Notification skipped: Event ${input.eventType} already processed for shipment ${input.shipmentId} (Idempotency Protection).`,
        notificationId: existing.id,
        billingStatus: existing.billingStatus,
      };
    }

    // Channel Selection & Global Check
    const template = TEMPLATES_STORE[input.eventType];
    if (!template) {
      return { success: false, message: `No template found for event ${input.eventType}.`, billingStatus: 'SKIPPED' };
    }

    const channel: NotificationChannel = input.forceChannel || (template.whatsappEnabled ? 'WHATSAPP' : 'SMS');

    if (channel === 'WHATSAPP' && !GLOBAL_ADMIN_CONFIG.whatsappGlobalEnabled) {
      return { success: false, message: 'WhatsApp notifications are temporarily unavailable globally.', billingStatus: 'SKIPPED' };
    }
    if (channel === 'SMS' && !GLOBAL_ADMIN_CONFIG.smsGlobalEnabled) {
      return { success: false, message: 'SMS notifications are temporarily unavailable globally.', billingStatus: 'SKIPPED' };
    }

    // Calculate Free Quota & Billing Price
    const usage = NotificationEngineService.getCustomerUsageSummary(input.tenantId);
    const isFree = usage.freeQuotaRemaining > 0;

    let customerChargeINR = 0;
    const providerCostINR = channel === 'WHATSAPP' ? GLOBAL_ADMIN_CONFIG.pricing.providerCostWhatsappINR : GLOBAL_ADMIN_CONFIG.pricing.providerCostSmsINR;

    if (!isFree && !input.isTestRun) {
      customerChargeINR = channel === 'WHATSAPP' ? GLOBAL_ADMIN_CONFIG.pricing.whatsappPriceINR : GLOBAL_ADMIN_CONFIG.pricing.smsPriceINR;
    }

    // Wallet Balance Check for Paid Notifications
    let billingStatus: BillingStatus = isFree ? 'FREE' : 'PAID';
    let walletTxnRef: string | undefined = undefined;

    if (!isFree && customerChargeINR > 0 && !input.isTestRun) {
      const wallet = WalletService.getWallet(input.tenantId);
      const balanceINR = wallet.availableBalanceMinor / 100;

      if (balanceINR < customerChargeINR) {
        // DO NOT BLOCK SHIPMENT! Mark as Payment Required and log skipped status
        const unpaidRecord: NotificationRecord = {
          id: `notif-${Date.now()}`,
          idempotencyKey,
          tenantId: input.tenantId,
          merchantName: 'Acme Electronics India Pvt Ltd',
          shipmentId: input.shipmentId,
          awbNumber: input.awbNumber,
          orderId: input.orderId,
          recipientName: input.recipientName,
          recipientPhone: input.recipientPhone,
          eventType: input.eventType,
          category: 'TRANSACTIONAL',
          channel,
          providerName: channel === 'WHATSAPP' ? GLOBAL_ADMIN_CONFIG.whatsappProvider.name : GLOBAL_ADMIN_CONFIG.smsProvider.name,
          deliveryStatus: 'FAILED',
          billingStatus: 'INSUFFICIENT_BALANCE',
          isFreeQuota: false,
          customerChargeINR: 0,
          providerCostINR: 0,
          templateUsed: template.whatsappTemplateName,
          renderedMessage: 'Notification paused: Insufficient wallet balance for paid notification.',
          trackingUrl: '',
          failureReason: `Insufficient Wallet Balance (Required ₹${customerChargeINR.toFixed(2)}). Add balance to continue paid dispatches.`,
          createdAt: new Date().toLocaleString(),
        };

        NOTIFICATION_LOG.unshift(unpaidRecord);
        return {
          success: false,
          message: `Paid notification paused due to Insufficient Wallet Balance. (Required ₹${customerChargeINR.toFixed(2)}).`,
          billingStatus: 'INSUFFICIENT_BALANCE',
        };
      } else {
        // Deduct from Wallet Ledger
        const debitPaise = Math.round(customerChargeINR * 100);
        walletTxnRef = `tx-notif-${Date.now()}`;
        const walletAny = wallet as any;
        if (walletAny.recentTransactions && Array.isArray(walletAny.recentTransactions)) {
          walletAny.recentTransactions.unshift({
            id: walletTxnRef,
            walletId: wallet.id,
            tenantId: input.tenantId,
            amountMinor: debitPaise,
            type: 'DEBIT',
            category: 'SHIPMENT_CHARGE',
            description: `${channel} Notification – AWB ${input.awbNumber} (${input.eventType})`,
            referenceId: input.awbNumber,
            createdAt: new Date().toISOString(),
            status: 'SETTLED',
          });
        }
      }
    }

    // Render Tracking URL & Message
    const branding = BrandingService.getBranding(input.tenantId);
    const trackingUrl = `http://localhost:5173/track/${branding.merchantSlug}/${input.awbNumber}`;

    let rawTemplateStr = channel === 'WHATSAPP' ? template.whatsappBody : template.smsBody;
    const renderedMessage = rawTemplateStr
      .replace(/{{customer_name}}/g, input.recipientName)
      .replace(/{{order_id}}/g, input.orderId)
      .replace(/{{awb}}/g, input.awbNumber)
      .replace(/{{courier}}/g, input.courierName)
      .replace(/{{merchant_name}}/g, branding.brandName)
      .replace(/{{tracking_url}}/g, trackingUrl);

    const notifId = `notif-${Date.now()}`;

    const newRecord: NotificationRecord = {
      id: notifId,
      idempotencyKey,
      tenantId: input.tenantId,
      merchantName: branding.brandName,
      shipmentId: input.shipmentId,
      awbNumber: input.awbNumber,
      orderId: input.orderId,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      eventType: input.eventType,
      category: 'TRANSACTIONAL',
      channel,
      providerName: channel === 'WHATSAPP' ? GLOBAL_ADMIN_CONFIG.whatsappProvider.name : GLOBAL_ADMIN_CONFIG.smsProvider.name,
      deliveryStatus: 'DELIVERED',
      billingStatus,
      isFreeQuota: isFree,
      customerChargeINR: input.isTestRun ? 0 : customerChargeINR,
      providerCostINR,
      walletTxnRef,
      templateUsed: channel === 'WHATSAPP' ? template.whatsappTemplateName : 'sms_template',
      renderedMessage,
      trackingUrl,
      providerResponseId: `${channel.toLowerCase()}_resp_${Date.now()}`,
      sentAt: new Date().toLocaleString(),
      deliveredAt: new Date().toLocaleString(),
      createdAt: new Date().toLocaleString(),
    };

    NOTIFICATION_LOG.unshift(newRecord);

    return {
      success: true,
      message: `Branded ${channel} notification dispatched to ${input.recipientName} (${input.recipientPhone}). (${isFree ? 'Free Quota' : `Charged ₹${customerChargeINR.toFixed(2)}`})`,
      notificationId: notifId,
      billingStatus,
    };
  },

  // 6. CSV Exporter for Customer & Admin
  exportUsageCsv: (records: NotificationRecord[]): string => {
    const headers = [
      'Notification ID',
      'Date',
      'Merchant Name',
      'AWB Number',
      'Order ID',
      'Recipient Name',
      'Event Type',
      'Channel',
      'Delivery Status',
      'Billing Status',
      'Free/Paid',
      'Customer Charge (INR)',
      'Provider Cost (INR)',
    ];

    const rows = records.map((r) => [
      r.id,
      r.createdAt,
      `"${r.merchantName.replace(/"/g, '""')}"`,
      r.awbNumber,
      r.orderId,
      `"${r.recipientName.replace(/"/g, '""')}"`,
      r.eventType,
      r.channel,
      r.deliveryStatus,
      r.billingStatus,
      r.isFreeQuota ? 'FREE' : 'PAID',
      r.customerChargeINR.toFixed(2),
      r.providerCostINR.toFixed(2),
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  },
};
