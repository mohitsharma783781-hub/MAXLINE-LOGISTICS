import type { InternalTrackingStatus } from './courierProviderAdapter';

export interface CourierWebhookLog extends Record<string, unknown> {
  id: string;
  providerId: string;
  eventId: string;
  awbNumber: string;
  rawEventCode: string;
  normalizedStatus: InternalTrackingStatus;
  signatureVerified: boolean;
  httpStatus: number;
  receivedAt: string;
  payloadSnippet: string;
  status: 'PROCESSED' | 'IGNORED_DUPLICATE' | 'FAILED_VERIFICATION';
}

export interface CourierApiAuditLog extends Record<string, unknown> {
  id: string;
  providerId: string;
  operation: 'checkServiceability' | 'createShipment' | 'generateAWB' | 'generateLabel' | 'requestPickup' | 'trackShipment' | 'cancelShipment';
  shipmentId: string;
  awbNumber: string;
  httpStatus: number;
  responseTimeMs: number;
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  errorMessage?: string;
  timestamp: string;
}

export const INITIAL_WEBHOOK_LOGS: CourierWebhookLog[] = [
  {
    id: 'wh-log-101',
    providerId: 'delhivery',
    eventId: 'evt-delh-98210',
    awbNumber: 'DEL847192031',
    rawEventCode: 'DLV_OUT_FOR_DELIVERY',
    normalizedStatus: 'OUT_FOR_DELIVERY',
    signatureVerified: true,
    httpStatus: 200,
    receivedAt: '2026-08-20 16:45 PM',
    payloadSnippet: '{"awb":"DEL847192031","status":"OUT_FOR_DELIVERY","location":"Bengaluru South Hub"}',
    status: 'PROCESSED',
  },
  {
    id: 'wh-log-102',
    providerId: 'bluedart',
    eventId: 'evt-bd-77123',
    awbNumber: 'BD749102834',
    rawEventCode: 'BD_IN_TRANSIT',
    normalizedStatus: 'IN_TRANSIT',
    signatureVerified: true,
    httpStatus: 200,
    receivedAt: '2026-08-19 11:30 AM',
    payloadSnippet: '{"waybill":"BD749102834","status":"IT","location":"Mumbai Air Hub"}',
    status: 'PROCESSED',
  },
];

export const INITIAL_API_AUDIT_LOGS: CourierApiAuditLog[] = [
  {
    id: 'api-log-01',
    providerId: 'delhivery',
    operation: 'createShipment',
    shipmentId: 'SHP-ORD-2026-9041',
    awbNumber: 'DEL847192031',
    httpStatus: 200,
    responseTimeMs: 142,
    status: 'SUCCESS',
    timestamp: '2026-08-20 16:35 PM',
  },
  {
    id: 'api-log-02',
    providerId: 'bluedart',
    operation: 'generateLabel',
    shipmentId: 'SHP-ORD-2026-8812',
    awbNumber: 'BD749102834',
    httpStatus: 200,
    responseTimeMs: 98,
    status: 'SUCCESS',
    timestamp: '2026-08-19 11:25 AM',
  },
];

let WEBHOOK_STORE = [...INITIAL_WEBHOOK_LOGS];
let API_LOG_STORE = [...INITIAL_API_AUDIT_LOGS];
const PROCESSED_EVENT_IDS = new Set<string>(INITIAL_WEBHOOK_LOGS.map((l) => l.eventId));

export const CourierWebhookService = {
  getWebhookLogs: (providerId?: string): CourierWebhookLog[] => {
    return WEBHOOK_STORE.filter((l) => !providerId || providerId === 'all' || l.providerId === providerId);
  },

  getApiAuditLogs: (providerId?: string): CourierApiAuditLog[] => {
    return API_LOG_STORE.filter((l) => !providerId || providerId === 'all' || l.providerId === providerId);
  },

  processIncomingWebhook: (
    providerId: string,
    eventId: string,
    rawSignature: string,
    payload: Record<string, unknown>
  ): { success: boolean; log: CourierWebhookLog; message: string } => {
    // 1. Signature Check
    const isSignatureValid = rawSignature !== 'INVALID';

    if (!isSignatureValid) {
      const failedLog: CourierWebhookLog = {
        id: `wh-${Date.now()}`,
        providerId,
        eventId,
        awbNumber: (payload.awb as string) || (payload.waybill as string) || 'UNKNOWN',
        rawEventCode: (payload.status as string) || 'RAW_EVENT',
        normalizedStatus: 'UNKNOWN',
        signatureVerified: false,
        httpStatus: 401,
        receivedAt: new Date().toLocaleString(),
        payloadSnippet: JSON.stringify(payload).substring(0, 150),
        status: 'FAILED_VERIFICATION',
      };

      WEBHOOK_STORE.unshift(failedLog);
      return { success: false, log: failedLog, message: 'Webhook signature verification failed.' };
    }

    // 2. Idempotency Check
    if (PROCESSED_EVENT_IDS.has(eventId)) {
      const dupLog: CourierWebhookLog = {
        id: `wh-${Date.now()}`,
        providerId,
        eventId,
        awbNumber: (payload.awb as string) || (payload.waybill as string) || 'UNKNOWN',
        rawEventCode: (payload.status as string) || 'RAW_EVENT',
        normalizedStatus: 'UNKNOWN',
        signatureVerified: true,
        httpStatus: 200,
        receivedAt: new Date().toLocaleString(),
        payloadSnippet: JSON.stringify(payload).substring(0, 150),
        status: 'IGNORED_DUPLICATE',
      };

      WEBHOOK_STORE.unshift(dupLog);
      return { success: true, log: dupLog, message: 'Duplicate webhook event ignored safely (idempotent).' };
    }

    PROCESSED_EVENT_IDS.add(eventId);

    const awb = (payload.awb as string) || (payload.waybill as string) || 'AWB-847192031';
    const rawStatus = (payload.status as string) || 'DELIVERED';
    let normalizedStatus: InternalTrackingStatus = 'IN_TRANSIT';

    if (rawStatus.includes('DELIVERED')) normalizedStatus = 'DELIVERED';
    else if (rawStatus.includes('OUT')) normalizedStatus = 'OUT_FOR_DELIVERY';
    else if (rawStatus.includes('PICK')) normalizedStatus = 'PICKED_UP';
    else if (rawStatus.includes('NDR')) normalizedStatus = 'NDR';
    else if (rawStatus.includes('RTO')) normalizedStatus = 'RTO';

    const processedLog: CourierWebhookLog = {
      id: `wh-${Date.now()}`,
      providerId,
      eventId,
      awbNumber: awb,
      rawEventCode: rawStatus,
      normalizedStatus,
      signatureVerified: true,
      httpStatus: 200,
      receivedAt: new Date().toLocaleString(),
      payloadSnippet: JSON.stringify(payload).substring(0, 150),
      status: 'PROCESSED',
    };

    WEBHOOK_STORE.unshift(processedLog);
    return { success: true, log: processedLog, message: 'Webhook event processed and tracking updated.' };
  },

  logApiRequest: (
    providerId: string,
    operation: CourierApiAuditLog['operation'],
    shipmentId: string,
    awbNumber: string,
    httpStatus: number,
    responseTimeMs: number,
    status: 'SUCCESS' | 'FAILED' | 'TIMEOUT',
    errorMessage?: string
  ): CourierApiAuditLog => {
    const newLog: CourierApiAuditLog = {
      id: `api-log-${Date.now()}`,
      providerId,
      operation,
      shipmentId,
      awbNumber,
      httpStatus,
      responseTimeMs,
      status,
      errorMessage,
      timestamp: new Date().toLocaleString(),
    };

    API_LOG_STORE.unshift(newLog);
    return newLog;
  },
};
