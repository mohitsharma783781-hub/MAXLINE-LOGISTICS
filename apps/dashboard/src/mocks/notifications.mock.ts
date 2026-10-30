import type {
  NotificationTemplate,
  NotificationRule,
  NotificationLog,
  NotificationFilterState,
  NotificationEvent,
  NotificationChannel,
  TemplateStatus,
} from '../types/notifications';
import { ALLOWED_NOTIFICATION_VARIABLES } from '../types/notifications';

// Safe variable substitution renderer
export const renderTemplateBody = (
  bodyText: string,
  sampleData: Record<string, string> = {}
): string => {
  if (!bodyText) return '';
  let result = bodyText;

  ALLOWED_NOTIFICATION_VARIABLES.forEach((v) => {
    const replacement = sampleData[v.key.replace(/[{}]/g, '')] || v.sampleValue || '—';
    result = result.replace(new RegExp(v.key.replace(/[-[\]{}()*+?.:\\^$|#\s]/g, '\\$&'), 'g'), replacement);
  });

  return result;
};

// INITIAL DEMO TEMPLATES
export const DEMO_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'tmpl-101',
    tenantId: 'tenant-demo-01',
    name: 'Shipment Booked WhatsApp Alert',
    event: 'SHIPMENT_BOOKED',
    channel: 'WHATSAPP',
    body: 'Hello {{customer_name}}, your order {{order_id}} has been booked with {{courier_name}}. AWB: {{awb}}. Track live: {{tracking_url}}',
    status: 'ACTIVE',
    variables: ['{{customer_name}}', '{{order_id}}', '{{courier_name}}', '{{awb}}', '{{tracking_url}}'],
    createdAt: '2026-08-18 10:00 AM',
    updatedAt: '2026-08-18 10:00 AM',
  },
  {
    id: 'tmpl-102',
    tenantId: 'tenant-demo-01',
    name: 'Out for Delivery SMS Alert',
    event: 'OUT_FOR_DELIVERY',
    channel: 'SMS',
    body: 'Hi {{customer_name}}, parcel {{awb}} is OUT FOR DELIVERY today by {{courier_name}}. Track: {{tracking_url}}',
    status: 'ACTIVE',
    variables: ['{{customer_name}}', '{{awb}}', '{{courier_name}}', '{{tracking_url}}'],
    createdAt: '2026-08-19 09:00 AM',
    updatedAt: '2026-08-19 09:00 AM',
  },
  {
    id: 'tmpl-103',
    tenantId: 'tenant-demo-01',
    name: 'Delivery Attempt Failed NDR WhatsApp',
    event: 'NDR_CREATED',
    channel: 'WHATSAPP',
    body: 'Alert: Delivery attempt #1 failed for AWB {{awb}}. Please confirm preferred reattempt date or contact {{support_phone}}.',
    status: 'ACTIVE',
    variables: ['{{awb}}', '{{support_phone}}'],
    createdAt: '2026-08-20 14:15 PM',
    updatedAt: '2026-08-20 14:15 PM',
  },
];

// INITIAL DEMO RULES
export const DEMO_RULES: NotificationRule[] = [
  {
    id: 'rule-101',
    tenantId: 'tenant-demo-01',
    event: 'SHIPMENT_BOOKED',
    channel: 'WHATSAPP',
    templateId: 'tmpl-101',
    templateName: 'Shipment Booked WhatsApp Alert',
    enabled: true,
    createdAt: '2026-08-18 10:00 AM',
    updatedAt: '2026-08-18 10:00 AM',
  },
  {
    id: 'rule-102',
    tenantId: 'tenant-demo-01',
    event: 'OUT_FOR_DELIVERY',
    channel: 'SMS',
    templateId: 'tmpl-102',
    templateName: 'Out for Delivery SMS Alert',
    enabled: true,
    createdAt: '2026-08-19 09:00 AM',
    updatedAt: '2026-08-19 09:00 AM',
  },
  {
    id: 'rule-103',
    tenantId: 'tenant-demo-01',
    event: 'NDR_CREATED',
    channel: 'WHATSAPP',
    templateId: 'tmpl-103',
    templateName: 'Delivery Attempt Failed NDR WhatsApp',
    enabled: true,
    createdAt: '2026-08-20 14:15 PM',
    updatedAt: '2026-08-20 14:15 PM',
  },
];

// INITIAL DEMO NOTIFICATION LOGS
export const DEMO_LOGS: NotificationLog[] = [
  {
    id: 'log-101',
    tenantId: 'tenant-demo-01',
    shipmentId: 'SHP-9840192',
    orderId: 'ORD-9840192',
    awb: 'DEMO-AWB-98401928',
    notificationEvent: 'SHIPMENT_BOOKED',
    channel: 'WHATSAPP',
    templateId: 'tmpl-101',
    templateName: 'Shipment Booked WhatsApp Alert',
    recipientMasked: '98******21',
    status: 'DELIVERED',
    provider: 'DemoNotificationProvider',
    providerReference: 'DEMO-MSG-849201',
    renderedContent: 'Hello Rahul Sharma, your order ORD-9840192 has been booked with Delhivery Surface. AWB: DEMO-AWB-98401928.',
    createdAt: '2026-08-20 16:35 PM',
    updatedAt: '2026-08-20 16:35 PM',
  },
  {
    id: 'log-102',
    tenantId: 'tenant-demo-01',
    shipmentId: 'DEMO-9840193',
    orderId: 'ORD-9840193',
    awb: 'DEMO-AWB-98401939',
    notificationEvent: 'OUT_FOR_DELIVERY',
    channel: 'SMS',
    templateId: 'tmpl-102',
    templateName: 'Out for Delivery SMS Alert',
    recipientMasked: '98******44',
    status: 'SENT',
    provider: 'DemoNotificationProvider',
    providerReference: 'DEMO-MSG-849202',
    renderedContent: 'Hi Priya Verma, parcel DEMO-AWB-98401939 is OUT FOR DELIVERY today by FedEx Priority.',
    createdAt: '2026-08-21 08:35 AM',
    updatedAt: '2026-08-21 08:35 AM',
  },
  {
    id: 'log-103',
    tenantId: 'tenant-demo-01',
    shipmentId: 'DEMO-9840195',
    orderId: 'ORD-9840195',
    awb: 'DEMO-AWB-98401955',
    notificationEvent: 'NDR_CREATED',
    channel: 'WHATSAPP',
    templateId: 'tmpl-103',
    templateName: 'Delivery Attempt Failed NDR WhatsApp',
    recipientMasked: '98******55',
    status: 'FAILED',
    provider: 'DemoNotificationProvider',
    errorMessage: 'Demo provider rejected request (Carrier gateway timeout)',
    renderedContent: 'Alert: Delivery attempt #1 failed for AWB DEMO-AWB-98401955.',
    createdAt: '2026-08-20 14:20 PM',
    updatedAt: '2026-08-20 14:20 PM',
  },
];

// STORES
const LOG_STORE: Map<string, NotificationLog> = new Map();
const TEMPLATE_STORE: Map<string, NotificationTemplate> = new Map();
const RULE_STORE: Map<string, NotificationRule> = new Map();

DEMO_LOGS.forEach((l) => LOG_STORE.set(l.id, l));
DEMO_TEMPLATES.forEach((t) => TEMPLATE_STORE.set(t.id, t));
DEMO_RULES.forEach((r) => RULE_STORE.set(r.id, r));

export const demoNotificationProvider = {
  getLogs: (filters?: NotificationFilterState): NotificationLog[] => {
    const list = Array.from(LOG_STORE.values());
    if (!filters) return list;

    return list.filter((item) => {
      if (filters.status !== 'all' && item.status !== filters.status) return false;
      if (filters.channel !== 'all' && item.channel !== filters.channel) return false;
      if (filters.event !== 'all' && item.notificationEvent !== filters.event) return false;
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const match = item.id.toLowerCase().includes(q) || item.shipmentId.toLowerCase().includes(q) || item.awb.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  },

  getLogById: (id: string): NotificationLog | null => {
    return LOG_STORE.get(id) || Array.from(LOG_STORE.values()).find((l) => l.shipmentId === id || l.awb === id) || null;
  },

  getTemplates: (): NotificationTemplate[] => {
    return Array.from(TEMPLATE_STORE.values());
  },

  getTemplateById: (id: string): NotificationTemplate | null => {
    return TEMPLATE_STORE.get(id) || null;
  },

  createTemplate: (input: { name: string; event: NotificationEvent; channel: NotificationChannel; subject?: string; body: string; status: TemplateStatus; variables: string[] }): NotificationTemplate => {
    const id = `tmpl-${Date.now()}`;
    const nowStr = new Date().toLocaleString();
    const newTmpl: NotificationTemplate = {
      id,
      tenantId: 'tenant-demo-01',
      name: input.name,
      event: input.event,
      channel: input.channel,
      subject: input.subject,
      body: input.body,
      status: input.status,
      variables: input.variables,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    TEMPLATE_STORE.set(id, newTmpl);
    return newTmpl;
  },

  updateTemplate: (id: string, input: Partial<NotificationTemplate>): NotificationTemplate | null => {
    const tmpl = TEMPLATE_STORE.get(id);
    if (!tmpl) return null;
    const updated: NotificationTemplate = {
      ...tmpl,
      ...input,
      updatedAt: new Date().toLocaleString(),
    };
    TEMPLATE_STORE.set(id, updated);
    return updated;
  },

  getRules: (): NotificationRule[] => {
    return Array.from(RULE_STORE.values());
  },

  toggleRule: (id: string, enabled: boolean): NotificationRule | null => {
    const rule = RULE_STORE.get(id);
    if (!rule) return null;
    rule.enabled = enabled;
    rule.updatedAt = new Date().toLocaleString();
    RULE_STORE.set(id, rule);
    return rule;
  },

  sendTestNotification: (
    event: NotificationEvent = 'SHIPMENT_BOOKED',
    channel: NotificationChannel = 'WHATSAPP',
    recipientMasked = '98******00',
    shipmentId = 'SHP-9840192'
  ): NotificationLog => {
    const templates = Array.from(TEMPLATE_STORE.values());
    const matched = templates.find((t) => t.event === event && t.channel === channel) || templates[0];
    const nowStr = new Date().toLocaleString();

    const rendered = renderTemplateBody(matched.body, {
      customer_name: 'Rahul Sharma (Test)',
      awb: 'DEMO-AWB-98401928',
      order_id: 'ORD-9840192',
      courier_name: 'Delhivery Surface',
      tracking_url: 'https://demo.shipping-saas.com/track/DEMO-AWB-98401928',
    });

    const newLog: NotificationLog = {
      id: `log-${Date.now()}`,
      tenantId: 'tenant-demo-01',
      shipmentId,
      orderId: 'ORD-9840192',
      awb: 'DEMO-AWB-98401928',
      notificationEvent: event,
      channel,
      templateId: matched.id,
      templateName: matched.name,
      recipientMasked,
      status: 'DELIVERED',
      provider: 'DemoNotificationProvider',
      providerReference: `DEMO-MSG-${Math.floor(100000 + Math.random() * 900000)}`,
      renderedContent: rendered,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    LOG_STORE.set(newLog.id, newLog);
    return newLog;
  },

  retryNotification: (logId: string): NotificationLog | null => {
    const log = LOG_STORE.get(logId);
    if (!log) return null;

    log.status = 'DELIVERED';
    delete log.errorMessage;
    log.providerReference = `DEMO-RETRY-${Math.floor(100000 + Math.random() * 900000)}`;
    log.updatedAt = new Date().toLocaleString();

    LOG_STORE.set(log.id, log);
    return log;
  },
};
