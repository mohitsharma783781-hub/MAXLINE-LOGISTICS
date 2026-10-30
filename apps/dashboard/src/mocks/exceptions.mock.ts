import type {
  NDRCase,
  RTOCase,
  DeliveryAttempt,
  ExceptionEvent,
  ExceptionFilterState,
  CustomerResponse,
  MerchantAction,
  RTOReason,
  RTOStatus,
} from '../types/exceptions';

// Mask PII Phone Numbers
export const maskPhoneNumber = (phone: string): string => {
  if (!phone || phone.length < 8) return '********';
  const clean = phone.replace(/\s+/g, '').replace(/^\+91/, '');
  if (clean.length < 10) return '********';
  return `${clean.slice(0, 2)}******${clean.slice(-2)}`;
};

// INITIAL DEMO NDR CASES
export const INITIAL_NDR_CASES: NDRCase[] = [];

// INITIAL DEMO RTO CASES
export const INITIAL_RTO_CASES: RTOCase[] = [];

// IN-MEMORY STORES
const NDR_STORE: Map<string, NDRCase> = new Map();
const RTO_STORE: Map<string, RTOCase> = new Map();
const EVENT_STORE: Map<string, ExceptionEvent[]> = new Map();
const ATTEMPT_STORE: Map<string, DeliveryAttempt[]> = new Map();

export const demoExceptionProvider = {
  getNDRCases: (filters?: ExceptionFilterState): NDRCase[] => {
    const list = Array.from(NDR_STORE.values());
    if (!filters) return list;

    return list.filter((item) => {
      if (filters.status !== 'all' && item.status !== filters.status) return false;
      if (filters.courier !== 'all' && item.courierId !== filters.courier) return false;
      if (filters.reason !== 'all' && item.reasonCode !== filters.reason) return false;
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchId = item.shipmentId.toLowerCase().includes(q) || item.awb.toLowerCase().includes(q) || item.customerName.toLowerCase().includes(q);
        if (!matchId) return false;
      }
      return true;
    });
  },

  getNDRCaseById: (id: string): NDRCase | null => {
    return NDR_STORE.get(id) || Array.from(NDR_STORE.values()).find((n) => n.shipmentId === id || n.awb === id) || null;
  },

  getRTOCases: (filters?: ExceptionFilterState): RTOCase[] => {
    const list = Array.from(RTO_STORE.values());
    if (!filters) return list;

    return list.filter((item) => {
      if (filters.status !== 'all' && item.status !== filters.status) return false;
      if (filters.courier !== 'all' && item.courierId !== filters.courier) return false;
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchId = item.shipmentId.toLowerCase().includes(q) || item.awb.toLowerCase().includes(q) || item.customerName.toLowerCase().includes(q);
        if (!matchId) return false;
      }
      return true;
    });
  },

  getRTOCaseById: (id: string): RTOCase | null => {
    return RTO_STORE.get(id) || Array.from(RTO_STORE.values()).find((r) => r.shipmentId === id || r.awb === id) || null;
  },

  getExceptionEvents: (shipmentId: string): ExceptionEvent[] => {
    return EVENT_STORE.get(shipmentId) || [];
  },

  getDeliveryAttempts: (shipmentId: string): DeliveryAttempt[] => {
    return ATTEMPT_STORE.get(shipmentId) || [];
  },

  updateCustomerResponse: (
    ndrId: string,
    response: CustomerResponse,
    action: MerchantAction,
    notes?: string
  ): NDRCase | null => {
    const ndr = NDR_STORE.get(ndrId) || Array.from(NDR_STORE.values()).find((n) => n.shipmentId === ndrId);
    if (!ndr) return null;

    ndr.customerResponse = response;
    ndr.merchantAction = action;
    ndr.status = 'ACTION_REQUIRED';
    ndr.updatedAt = new Date().toISOString();

    const evts = EVENT_STORE.get(ndr.shipmentId) || [];
    evts.unshift({
      id: `ev-${Date.now()}`,
      shipmentId: ndr.shipmentId,
      eventType: 'CUSTOMER_CONTACTED',
      status: 'ACTION_REQUIRED',
      message: `Customer response recorded: ${response}. Action: ${action} ${notes ? `(${notes})` : ''}`,
      timestamp: new Date().toLocaleString(),
    });
    EVENT_STORE.set(ndr.shipmentId, evts);

    NDR_STORE.set(ndr.id, ndr);
    return ndr;
  },

  scheduleReattempt: (
    ndrId: string,
    reattemptDate: string,
    reattemptSlot: string,
    notes?: string
  ): { success: boolean; message: string; ndr: NDRCase | null } => {
    const ndr = NDR_STORE.get(ndrId) || Array.from(NDR_STORE.values()).find((n) => n.shipmentId === ndrId);
    if (!ndr) return { success: false, message: 'NDR Case not found.', ndr: null };

    if (ndr.status === 'RTO_INITIATED' || ndr.status === 'CLOSED') {
      return { success: false, message: `Cannot schedule reattempt for NDR in ${ndr.status} status.`, ndr };
    }

    ndr.status = 'REATTEMPT_SCHEDULED';
    ndr.reattemptDate = reattemptDate;
    ndr.reattemptSlot = reattemptSlot;
    ndr.nextActionAt = `${reattemptDate} (${reattemptSlot})`;
    ndr.updatedAt = new Date().toISOString();

    const evts = EVENT_STORE.get(ndr.shipmentId) || [];
    evts.unshift({
      id: `ev-${Date.now()}`,
      shipmentId: ndr.shipmentId,
      eventType: 'REATTEMPT_SCHEDULED',
      status: 'REATTEMPT_SCHEDULED',
      message: `Reattempt scheduled for ${reattemptDate} (${reattemptSlot}) ${notes ? `• ${notes}` : ''}`,
      timestamp: new Date().toLocaleString(),
    });
    EVENT_STORE.set(ndr.shipmentId, evts);

    NDR_STORE.set(ndr.id, ndr);
    return { success: true, message: 'Reattempt scheduled successfully.', ndr };
  },

  initiateRTO: (
    shipmentId: string,
    reason: RTOReason = 'MERCHANT_REQUEST',
    notes?: string
  ): { success: boolean; message: string; rto: RTOCase | null } => {
    const existingRTO = RTO_STORE.get(`rto-${shipmentId}`) || Array.from(RTO_STORE.values()).find((r) => r.shipmentId === shipmentId);
    if (existingRTO) {
      return { success: false, message: 'RTO has already been initiated for this shipment.', rto: existingRTO };
    }

    const ndr = Array.from(NDR_STORE.values()).find((n) => n.shipmentId === shipmentId);
    const nowStr = new Date().toLocaleString();

    const newRTO: RTOCase = {
      id: `rto-${Date.now()}`,
      shipmentId,
      orderId: ndr?.orderId || `ORD-${shipmentId.replace('SHP-', '')}`,
      awb: ndr?.awb || `DEMO-AWB-${Math.floor(10000000 + Math.random() * 90000000)}`,
      courierId: ndr?.courierId || 'delhivery',
      courierName: ndr?.courierName || 'Delhivery Surface',
      customerName: ndr?.customerName || 'Customer',
      maskedPhone: ndr?.maskedPhone || '98******00',
      destinationCity: ndr?.destinationCity || 'Origin Hub',
      reason,
      reasonText: reason === 'MAX_ATTEMPTS_REACHED' ? '3 Failed delivery attempts' : 'Merchant requested Return-to-Origin',
      status: 'INITIATED',
      initiatedAt: nowStr,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    if (ndr) {
      ndr.status = 'RTO_INITIATED';
      ndr.updatedAt = new Date().toISOString();
      NDR_STORE.set(ndr.id, ndr);
    }

    const evts = EVENT_STORE.get(shipmentId) || [];
    evts.unshift({
      id: `ev-${Date.now()}`,
      shipmentId,
      eventType: 'RTO_INITIATED',
      status: 'INITIATED',
      message: `Return-to-Origin (RTO) initiated. Reason: ${reason} ${notes ? `(${notes})` : ''}`,
      timestamp: nowStr,
    });
    EVENT_STORE.set(shipmentId, evts);

    RTO_STORE.set(newRTO.id, newRTO);
    return { success: true, message: 'RTO initiated successfully.', rto: newRTO };
  },

  advanceRTOState: (rtoId: string, nextStatus: RTOStatus): RTOCase | null => {
    const rto = RTO_STORE.get(rtoId) || Array.from(RTO_STORE.values()).find((r) => r.id === rtoId);
    if (!rto) return null;

    rto.status = nextStatus;
    const nowStr = new Date().toLocaleString();
    if (nextStatus === 'IN_TRANSIT') rto.inTransitAt = nowStr;
    if (nextStatus === 'DELIVERED') rto.deliveredAt = nowStr;
    rto.updatedAt = new Date().toISOString();

    const evts = EVENT_STORE.get(rto.shipmentId) || [];
    evts.unshift({
      id: `ev-${Date.now()}`,
      shipmentId: rto.shipmentId,
      eventType: nextStatus === 'IN_TRANSIT' ? 'RTO_IN_TRANSIT' : 'RTO_DELIVERED',
      status: nextStatus,
      message: `RTO parcel status updated to ${nextStatus}`,
      timestamp: nowStr,
    });
    EVENT_STORE.set(rto.shipmentId, evts);

    RTO_STORE.set(rto.id, rto);
    return rto;
  },
};
