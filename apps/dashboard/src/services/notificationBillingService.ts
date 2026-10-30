import { WalletService } from '../mocks/wallet.mock';

export interface NotificationPricingConfig {
  whatsAppRateINR: number; // e.g. ₹1.00
  smsRateINR: number; // e.g. ₹0.20
  freeWhatsAppCreditsMonthly: number; // e.g. 10 free msgs
  freeSmsCreditsMonthly: number; // e.g. 25 free msgs
}

export interface NotificationLogRecord extends Record<string, unknown> {
  id: string;
  tenantId: string;
  awbNumber: string;
  customerMobile: string;
  channel: 'WhatsApp' | 'SMS' | 'Email';
  eventType: string;
  eventName: string;
  status: 'DELIVERED' | 'SENT' | 'FAILED';
  costINR: number;
  isFreeCredit: boolean;
  timestamp: string;
}

export interface NotificationAnalyticsSummary {
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  totalCostINR: number;
  walletChargesINR: number;
  remainingFreeWhatsAppCredits: number;
  remainingFreeSmsCredits: number;
}

// Config State
let PRICING_CONFIG: NotificationPricingConfig = {
  whatsAppRateINR: 1.0,
  smsRateINR: 0.2,
  freeWhatsAppCreditsMonthly: 10,
  freeSmsCreditsMonthly: 25,
};

// Usage State
let WHATSAPP_USED_COUNT = 4;
let SMS_USED_COUNT = 12;

const INITIAL_NOTIFICATION_LOGS: NotificationLogRecord[] = [
  {
    id: 'NTF-LOG-20260829-001',
    tenantId: 'tenant-demo-01',
    awbNumber: 'DEL847192031',
    customerMobile: '+91 9810234102',
    channel: 'WhatsApp',
    eventType: 'OUT_FOR_DELIVERY',
    eventName: 'Out For Delivery Alert',
    status: 'DELIVERED',
    costINR: 0.0,
    isFreeCredit: true,
    timestamp: '10 mins ago',
  },
  {
    id: 'NTF-LOG-20260829-002',
    tenantId: 'tenant-demo-01',
    awbNumber: 'BD749102834',
    customerMobile: '+91 9920188201',
    channel: 'SMS',
    eventType: 'IN_TRANSIT',
    eventName: 'In Transit Update',
    status: 'DELIVERED',
    costINR: 0.0,
    isFreeCredit: true,
    timestamp: '25 mins ago',
  },
  {
    id: 'NTF-LOG-20260829-003',
    tenantId: 'tenant-demo-01',
    awbNumber: 'DTDC991823',
    customerMobile: '+91 9871109283',
    channel: 'WhatsApp',
    eventType: 'NDR_ALERT',
    eventName: 'NDR Action Request',
    status: 'DELIVERED',
    costINR: 1.0,
    isFreeCredit: false,
    timestamp: '1 hour ago',
  },
  {
    id: 'NTF-LOG-20260829-004',
    tenantId: 'tenant-demo-01',
    awbNumber: 'TCI74829102',
    customerMobile: '+91 9819920192',
    channel: 'SMS',
    eventType: 'DELIVERED',
    eventName: 'Delivery Confirmation',
    status: 'DELIVERED',
    costINR: 0.2,
    isFreeCredit: false,
    timestamp: '3 hours ago',
  },
];

let NOTIFICATION_LOGS: NotificationLogRecord[] = [...INITIAL_NOTIFICATION_LOGS];

export const NotificationBillingService = {
  getConfig: (): NotificationPricingConfig => {
    return { ...PRICING_CONFIG };
  },

  updateConfig: (newConfig: Partial<NotificationPricingConfig>): NotificationPricingConfig => {
    PRICING_CONFIG = { ...PRICING_CONFIG, ...newConfig };
    return { ...PRICING_CONFIG };
  },

  getAnalytics: (tenantId = 'tenant-demo-01'): NotificationAnalyticsSummary => {
    const logs = NOTIFICATION_LOGS.filter((l) => l.tenantId === tenantId);
    const messagesSent = logs.length + 42;
    const messagesDelivered = logs.filter((l) => l.status === 'DELIVERED').length + 40;
    const messagesFailed = logs.filter((l) => l.status === 'FAILED').length + 2;

    const totalCostINR = logs.reduce((acc, l) => acc + l.costINR, 0) + 14.5;
    const walletChargesINR = logs.filter((l) => !l.isFreeCredit).reduce((acc, l) => acc + l.costINR, 0) + 12.0;

    const remainingFreeWhatsAppCredits = Math.max(0, PRICING_CONFIG.freeWhatsAppCreditsMonthly - WHATSAPP_USED_COUNT);
    const remainingFreeSmsCredits = Math.max(0, PRICING_CONFIG.freeSmsCreditsMonthly - SMS_USED_COUNT);

    return {
      messagesSent,
      messagesDelivered,
      messagesFailed,
      totalCostINR,
      walletChargesINR,
      remainingFreeWhatsAppCredits,
      remainingFreeSmsCredits,
    };
  },

  getNotificationLogs: (tenantId = 'tenant-demo-01'): NotificationLogRecord[] => {
    return NOTIFICATION_LOGS.filter((l) => l.tenantId === tenantId);
  },

  // Dispatch Notification & Apply Wallet Billing
  dispatchNotification: (input: {
    tenantId?: string;
    awbNumber: string;
    customerMobile: string;
    channel: 'WhatsApp' | 'SMS' | 'Email';
    eventType: string;
    eventName: string;
  }): { success: boolean; message: string; costINR: number; isFreeCredit: boolean } => {
    const tenantId = input.tenantId || 'tenant-demo-01';
    let isFreeCredit = false;
    let costINR = 0;

    if (input.channel === 'WhatsApp') {
      if (WHATSAPP_USED_COUNT < PRICING_CONFIG.freeWhatsAppCreditsMonthly) {
        WHATSAPP_USED_COUNT++;
        isFreeCredit = true;
        costINR = 0.0;
      } else {
        costINR = PRICING_CONFIG.whatsAppRateINR;
      }
    } else if (input.channel === 'SMS') {
      if (SMS_USED_COUNT < PRICING_CONFIG.freeSmsCreditsMonthly) {
        SMS_USED_COUNT++;
        isFreeCredit = true;
        costINR = 0.0;
      } else {
        costINR = PRICING_CONFIG.smsRateINR;
      }
    }

    // Debit wallet if cost > 0
    if (costINR > 0) {
      WalletService.withdraw(
        costINR,
        `${input.channel} Notification Debit (AWB ${input.awbNumber} • ${input.eventName})`
      );
    }

    const newLog: NotificationLogRecord = {
      id: `NTF-LOG-${Date.now()}`,
      tenantId,
      awbNumber: input.awbNumber,
      customerMobile: input.customerMobile,
      channel: input.channel,
      eventType: input.eventType,
      eventName: input.eventName,
      status: 'DELIVERED',
      costINR,
      isFreeCredit,
      timestamp: new Date().toLocaleTimeString(),
    };

    NOTIFICATION_LOGS.unshift(newLog);

    return {
      success: true,
      message: `${input.channel} notification dispatched to ${input.customerMobile}. ${isFreeCredit ? '(Free Credit Used)' : `Charged ₹${costINR.toFixed(2)} to wallet.`}`,
      costINR,
      isFreeCredit,
    };
  },
};
