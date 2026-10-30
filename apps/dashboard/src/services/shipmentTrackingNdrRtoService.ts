import { NotificationService } from './notificationService';

export type PlatformStandardStatus =
  | 'BOOKED'
  | 'PICKUP_REQUESTED'
  | 'PICKUP_SCHEDULED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'REACHED_DESTINATION'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'NDR'
  | 'RTO_INITIATED'
  | 'RTO_IN_TRANSIT'
  | 'RTO_DELIVERED'
  | 'CANCELLED'
  | 'LOST'
  | 'DAMAGED'
  | 'EXCEPTION';

export type NdrStatus =
  | 'OPEN'
  | 'CUSTOMER_ACTION_REQUIRED'
  | 'REATTEMPT_REQUESTED'
  | 'REATTEMPT_SCHEDULED'
  | 'RESOLVED'
  | 'RTO_INITIATED'
  | 'CLOSED';

export type NdrReason =
  | 'Customer unavailable'
  | 'Wrong address'
  | 'Incomplete address'
  | 'Customer refused'
  | 'Phone unreachable'
  | 'Delivery postponed'
  | 'Premises closed'
  | 'COD issue'
  | 'Other';

export type RtoStatus = 'RTO_INITIATED' | 'RTO_IN_TRANSIT' | 'RTO_DELIVERED';

export type RtoReason =
  | 'Customer refused'
  | 'Maximum delivery attempts reached'
  | 'Address issue'
  | 'COD refusal'
  | 'Customer unavailable'
  | 'Other';

export interface TrackingEventRecord extends Record<string, unknown> {
  eventId: string;
  shipmentId: string;
  packageId?: string;
  courierId: string;
  awbNumber: string;
  rawStatus: string;
  internalStatus: PlatformStandardStatus;
  location: string;
  city: string;
  description: string;
  eventTime: string;
  receivedAt: string;
  source: 'MANUAL' | 'COURIER_API' | 'SYSTEM';
}

export interface NdrAttemptItem extends Record<string, unknown> {
  attemptNumber: number;
  attemptDate: string;
  rawStatus: string;
  reason: NdrReason;
  location: string;
  customerAction?: string;
  adminNotes?: string;
}

export interface NdrRecord extends Record<string, unknown> {
  id: string;
  ndrId: string;
  shipmentId: string;
  packageId?: string;
  awbNumber: string;
  tenantId: string;
  courierId: string;
  courierName: string;
  recipientName?: string;
  recipientPhone?: string;
  ndrReason: NdrReason;
  ndrDate: string;
  attemptNumber: number;
  status: NdrStatus;
  nextAction?: string;
  updatedAddress?: string;
  updatedPhone?: string;
  deliveryInstructions?: string;
  preferredDeliveryDate?: string;
  paymentTypeChange?: 'KEEP_COD' | 'CONVERT_TO_PREPAID';
  paymentLinkSent?: boolean;
  paymentLinkUrl?: string;
  paymentStatus?: 'PENDING' | 'PAID';
  attemptsHistory: NdrAttemptItem[];
  createdAt: string;
  updatedAt: string;
}

export interface RtoRecord extends Record<string, unknown> {
  id: string;
  rtoId: string;
  shipmentId: string;
  awbNumber: string;
  tenantId: string;
  courierId: string;
  courierName: string;
  rtoReason: RtoReason;
  initiatedAt: string;
  status: RtoStatus;
  completedAt?: string;
  rtoChargeINR?: number;
}

export interface CourierTrackingAdapter {
  courierId: string;
  courierName: string;
  normalizeStatus: (rawStatus: string) => PlatformStandardStatus;
  getTrackingEvents: (awbNumber: string) => Promise<TrackingEventRecord[]>;
}

// Initial Data Seed
export const INITIAL_TRACKING_EVENTS: TrackingEventRecord[] = [];

export const INITIAL_NDR_RECORDS: NdrRecord[] = [];

export const INITIAL_RTO_RECORDS: RtoRecord[] = [];

let TRACKING_STORE = [...INITIAL_TRACKING_EVENTS];
let NDR_STORE = [...INITIAL_NDR_RECORDS];
let RTO_STORE = [...INITIAL_RTO_RECORDS];

const PROCESSED_TRACKING_HASHES = new Set<string>(
  INITIAL_TRACKING_EVENTS.map((e) => `${e.shipmentId}_${e.rawStatus}_${e.eventTime}_${e.location}`)
);

// Valid Transition Matrix for Platform Standard Statuses
const VALID_TRACKING_TRANSITIONS: Record<PlatformStandardStatus, PlatformStandardStatus[]> = {
  BOOKED: ['PICKUP_REQUESTED', 'PICKUP_SCHEDULED', 'CANCELLED'],
  PICKUP_REQUESTED: ['PICKUP_SCHEDULED', 'PICKED_UP', 'CANCELLED'],
  PICKUP_SCHEDULED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT', 'EXCEPTION'],
  IN_TRANSIT: ['REACHED_DESTINATION', 'OUT_FOR_DELIVERY', 'NDR', 'LOST', 'DAMAGED'],
  REACHED_DESTINATION: ['OUT_FOR_DELIVERY', 'NDR'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'NDR'],
  DELIVERED: [],
  NDR: ['OUT_FOR_DELIVERY', 'REACHED_DESTINATION', 'RTO_INITIATED'],
  RTO_INITIATED: ['RTO_IN_TRANSIT'],
  RTO_IN_TRANSIT: ['RTO_DELIVERED'],
  RTO_DELIVERED: [],
  CANCELLED: [],
  LOST: [],
  DAMAGED: [],
  EXCEPTION: ['IN_TRANSIT', 'NDR'],
};

export const ShipmentTrackingNdrRtoService = {
  // 1. Configurable Courier Status Normalizer
  normalizeCourierStatus: (rawStatus: string, _courierId = 'default'): PlatformStandardStatus => {
    const s = rawStatus.toLowerCase();
    if (s.includes('manifest') || s.includes('booked')) return 'BOOKED';
    if (s.includes('pickup requested')) return 'PICKUP_REQUESTED';
    if (s.includes('pickup scheduled')) return 'PICKUP_SCHEDULED';
    if (s.includes('picked')) return 'PICKED_UP';
    if (s.includes('dispatched') || s.includes('in transit') || s.includes('linehaul')) return 'IN_TRANSIT';
    if (s.includes('reached') || s.includes('destination hub')) return 'REACHED_DESTINATION';
    if (s.includes('out for delivery') || s.includes('ofd')) return 'OUT_FOR_DELIVERY';
    if (s.includes('delivered') && !s.includes('undelivered') && !s.includes('rto')) return 'DELIVERED';
    if (s.includes('ndr') || s.includes('undelivered') || s.includes('failed delivery') || s.includes('attempted')) return 'NDR';
    if (s.includes('rto initiated') || s.includes('return initiated') || s.includes('rto')) return 'RTO_INITIATED';
    if (s.includes('rto in transit') || s.includes('return in transit')) return 'RTO_IN_TRANSIT';
    if (s.includes('rto delivered') || s.includes('returned to origin')) return 'RTO_DELIVERED';
    if (s.includes('cancel')) return 'CANCELLED';
    if (s.includes('lost')) return 'LOST';
    if (s.includes('damage')) return 'DAMAGED';
    return 'IN_TRANSIT';
  },

  // 2. Validate Standard Status Transition Matrix
  validateStatusTransition: (
    currentStatus: PlatformStandardStatus,
    targetStatus: PlatformStandardStatus
  ): { valid: boolean; reason?: string } => {
    if (currentStatus === targetStatus) return { valid: true };
    const allowed = VALID_TRACKING_TRANSITIONS[currentStatus] || [];
    if (allowed.includes(targetStatus)) return { valid: true };
    return {
      valid: false,
      reason: `Security Lock: Invalid tracking status transition from '${currentStatus}' to '${targetStatus}'.`,
    };
  },

  // 3. Add Tracking Event with Duplicate Prevention Guard
  addTrackingEvent: (input: {
    shipmentId: string;
    packageId?: string;
    courierId: string;
    awbNumber: string;
    rawStatus: string;
    location: string;
    city: string;
    description: string;
    eventTime?: string;
    source?: 'MANUAL' | 'COURIER_API' | 'SYSTEM';
    tenantId?: string;
  }): { success: boolean; message: string; event?: TrackingEventRecord } => {
    const eventTime = input.eventTime || new Date().toLocaleString();
    const eventHash = `${input.shipmentId}_${input.rawStatus}_${eventTime}_${input.location}`;

    if (PROCESSED_TRACKING_HASHES.has(eventHash)) {
      return { success: true, message: 'Duplicate tracking event safely ignored.' };
    }
    PROCESSED_TRACKING_HASHES.add(eventHash);

    const internalStatus = ShipmentTrackingNdrRtoService.normalizeCourierStatus(input.rawStatus, input.courierId);

    const newEvent: TrackingEventRecord = {
      eventId: `trk-${Date.now()}`,
      shipmentId: input.shipmentId,
      packageId: input.packageId,
      courierId: input.courierId,
      awbNumber: input.awbNumber,
      rawStatus: input.rawStatus,
      internalStatus,
      location: input.location,
      city: input.city,
      description: input.description,
      eventTime,
      receivedAt: new Date().toLocaleString(),
      source: input.source || 'SYSTEM',
    };

    TRACKING_STORE.unshift(newEvent);

    // Auto-create NDR or RTO if status matches
    if (internalStatus === 'NDR') {
      ShipmentTrackingNdrRtoService.createNdrRecord({
        shipmentId: input.shipmentId,
        awbNumber: input.awbNumber,
        tenantId: input.tenantId || 'tenant-demo-01',
        courierId: input.courierId,
        courierName: input.courierId.toUpperCase(),
        ndrReason: 'Customer unavailable',
        location: input.location,
        rawStatus: input.rawStatus,
      });
    } else if (internalStatus === 'RTO_INITIATED') {
      ShipmentTrackingNdrRtoService.initiateRto({
        shipmentId: input.shipmentId,
        awbNumber: input.awbNumber,
        tenantId: input.tenantId || 'tenant-demo-01',
        courierId: input.courierId,
        courierName: input.courierId.toUpperCase(),
        rtoReason: 'Maximum delivery attempts reached',
      });
    }

    return { success: true, message: `Tracking scan '${internalStatus}' posted cleanly.`, event: newEvent };
  },

  getTrackingEvents: (shipmentId: string): TrackingEventRecord[] => {
    return TRACKING_STORE.filter((e) => e.shipmentId === shipmentId || e.awbNumber === shipmentId);
  },

  // 4. NDR Management Engine
  getNdrRecords: (tenantId = 'all', statusFilter = 'all'): NdrRecord[] => {
    return ShipmentTrackingNdrRtoService.queryNdrRecords({ tenantId, statusFilter });
  },

  queryNdrRecords: (params: {
    tenantId?: string;
    searchQuery?: string;
    statusFilter?: string;
    reasonFilter?: string;
    courierFilter?: string;
  }): NdrRecord[] => {
    const {
      tenantId,
      searchQuery = '',
      statusFilter = 'all',
      reasonFilter = 'all',
      courierFilter = 'all',
    } = params;

    return NDR_STORE.filter((n) => {
      if (tenantId && tenantId !== 'all' && n.tenantId !== tenantId) return false;

      // Status Filter
      if (statusFilter !== 'all') {
        const st = n.status as string;
        if (statusFilter === 'ACTION_REQUIRED' && st !== 'CUSTOMER_ACTION_REQUIRED' && st !== 'OPEN') return false;
        else if (statusFilter === 'REATTEMPT_REQUESTED' && st !== 'REATTEMPT_REQUESTED' && st !== 'REATTEMPT_SCHEDULED') return false;
        else if (statusFilter === 'RESOLVED' && st !== 'RESOLVED') return false;
        else if (statusFilter === 'RTO' && !st.startsWith('RTO')) return false;
        else if (statusFilter !== 'ACTION_REQUIRED' && statusFilter !== 'REATTEMPT_REQUESTED' && statusFilter !== 'RESOLVED' && statusFilter !== 'RTO' && st !== statusFilter) return false;
      }

      // Reason Filter
      if (reasonFilter !== 'all' && n.ndrReason.toLowerCase() !== reasonFilter.toLowerCase()) return false;

      // Courier Filter
      if (courierFilter !== 'all' && n.courierId.toLowerCase() !== courierFilter.toLowerCase()) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNdr = n.ndrId.toLowerCase().includes(q);
        const matchAwb = n.awbNumber ? n.awbNumber.toLowerCase().includes(q) : false;
        const matchShipment = n.shipmentId.toLowerCase().includes(q);
        const matchRecipient = n.recipientName ? n.recipientName.toLowerCase().includes(q) : false;
        const matchPhone = n.recipientPhone ? n.recipientPhone.toLowerCase().includes(q) : false;
        if (!matchNdr && !matchAwb && !matchShipment && !matchRecipient && !matchPhone) return false;
      }

      return true;
    });
  },

  getNdrSummaryStats: (tenantId?: string) => {
    const list = NDR_STORE.filter((n) => !tenantId || tenantId === 'all' || n.tenantId === tenantId);
    let actionRequired = 0;
    let reattemptRequested = 0;
    let rtoRiskHigh = 0;
    let resolved = 0;

    list.forEach((n) => {
      const st = n.status as string;
      if (st === 'CUSTOMER_ACTION_REQUIRED' || st === 'OPEN') actionRequired++;
      else if (st === 'REATTEMPT_REQUESTED' || st === 'REATTEMPT_SCHEDULED') reattemptRequested++;
      else if (st === 'RESOLVED') resolved++;

      if (n.attemptNumber >= 2 || st.startsWith('RTO')) rtoRiskHigh++;
    });

    return {
      totalNdr: list.length,
      actionRequired,
      reattemptRequested,
      rtoRiskHigh,
      resolved,
    };
  },

  addInternalNote: (ndrId: string, noteText: string, user = 'Merchant', tenantId?: string): { success: boolean; message: string } => {
    const ndr = ShipmentTrackingNdrRtoService.getNdrById(ndrId, tenantId);
    if (!ndr) return { success: false, message: 'NDR record not found or unauthorized.' };

    if (!(ndr as any).internalNotes) {
      (ndr as any).internalNotes = [];
    }

    (ndr as any).internalNotes.unshift({
      note: noteText,
      user,
      timestamp: new Date().toLocaleString(),
    });
    ndr.updatedAt = new Date().toLocaleString();

    return { success: true, message: 'Internal contact note saved successfully.' };
  },

  getNdrById: (ndrId: string, tenantId?: string): NdrRecord | null => {
    return (
      NDR_STORE.find(
        (n) =>
          (n.ndrId === ndrId || n.id === ndrId) &&
          (!tenantId || tenantId === 'all' || n.tenantId === tenantId)
      ) || null
    );
  },

  createNdrRecord: (input: {
    shipmentId: string;
    awbNumber: string;
    tenantId: string;
    courierId: string;
    courierName: string;
    ndrReason: NdrReason;
    location: string;
    rawStatus: string;
  }): NdrRecord => {
    const existing = NDR_STORE.find((n) => n.shipmentId === input.shipmentId && n.status !== 'CLOSED');
    if (existing) {
      existing.attemptNumber += 1;
      existing.attemptsHistory.push({
        attemptNumber: existing.attemptNumber,
        attemptDate: new Date().toLocaleString(),
        rawStatus: input.rawStatus,
        reason: input.ndrReason,
        location: input.location,
      });
      existing.updatedAt = new Date().toLocaleString();
      return existing;
    }

    const ndrId = `NDR-${Math.floor(10000 + Math.random() * 90000)}`;
    const newNdr: NdrRecord = {
      id: `ndr-rec-${Date.now()}`,
      ndrId,
      shipmentId: input.shipmentId,
      awbNumber: input.awbNumber,
      tenantId: input.tenantId,
      courierId: input.courierId,
      courierName: input.courierName,
      ndrReason: input.ndrReason,
      ndrDate: new Date().toLocaleString(),
      attemptNumber: 1,
      status: 'CUSTOMER_ACTION_REQUIRED',
      nextAction: 'Awaiting customer re-attempt request or delivery instructions',
      attemptsHistory: [
        {
          attemptNumber: 1,
          attemptDate: new Date().toLocaleString(),
          rawStatus: input.rawStatus,
          reason: input.ndrReason,
          location: input.location,
        },
      ],
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
    };

    NDR_STORE.unshift(newNdr);

    NotificationService.createNotification({
      recipientId: input.tenantId,
      recipientType: 'CUSTOMER',
      title: 'NDR Exception Alert',
      message: `Delivery attempt failed for shipment ${input.shipmentId} (${input.ndrReason}). Please submit re-attempt instructions.`,
      type: 'NDR',
      referenceType: 'SHIPMENT',
      referenceId: input.shipmentId,
      eventId: `evt-ndr-${ndrId}`,
    });

    return newNdr;
  },

  requestReattempt: (input: {
    ndrId: string;
    actionType: 'REATTEMPT' | 'UPDATE_ADDRESS_PHONE' | 'CONVERT_TO_PREPAID' | 'RTO';
    updatedAddress?: string;
    updatedPhone?: string;
    recipientName?: string;
    preferredDeliveryDate?: string;
    deliveryInstructions?: string;
    tenantId?: string;
  }): { success: boolean; message: string; paymentUrl?: string } => {
    const ndr = ShipmentTrackingNdrRtoService.getNdrById(input.ndrId, input.tenantId);
    if (!ndr) return { success: false, message: 'NDR record not found or unauthorized.' };

    if (input.actionType === 'RTO') {
      ndr.status = 'RTO_INITIATED';
      ndr.nextAction = 'Merchant requested Return To Origin (RTO). Parcel being routed back.';
      ndr.updatedAt = new Date().toLocaleString();

      ShipmentTrackingNdrRtoService.initiateRto({
        shipmentId: ndr.shipmentId,
        awbNumber: ndr.awbNumber,
        tenantId: ndr.tenantId,
        courierId: ndr.courierId,
        courierName: ndr.courierName,
        rtoReason: 'Customer refused',
      });

      return { success: true, message: `RTO initiated for shipment ${ndr.shipmentId}.` };
    }

    if (input.actionType === 'CONVERT_TO_PREPAID') {
      ndr.status = 'REATTEMPT_REQUESTED';
      ndr.paymentTypeChange = 'CONVERT_TO_PREPAID';
      ndr.paymentLinkSent = true;
      const payUrl = `https://pay.shippingaggregator.com/cod-pay/${ndr.awbNumber}`;
      ndr.paymentLinkUrl = payUrl;
      ndr.nextAction = `Converted COD to Prepaid. Instant Payment Link sent via SMS (${payUrl}).`;
      ndr.updatedAt = new Date().toLocaleString();

      return {
        success: true,
        message: `Converted COD to Prepaid! Payment link dispatched to recipient (${ndr.recipientPhone || 'Buyer'}).`,
        paymentUrl: payUrl,
      };
    }

    if (input.actionType === 'UPDATE_ADDRESS_PHONE') {
      ndr.status = 'REATTEMPT_REQUESTED';
      if (input.recipientName) ndr.recipientName = input.recipientName;
      if (input.updatedPhone) ndr.updatedPhone = input.updatedPhone;
      if (input.updatedAddress) ndr.updatedAddress = input.updatedAddress;
      if (input.deliveryInstructions) ndr.deliveryInstructions = input.deliveryInstructions;
      ndr.nextAction = 'Buyer phone and delivery address updated. Re-attempt scheduled.';
      ndr.updatedAt = new Date().toLocaleString();

      return { success: true, message: `Buyer address and phone number updated for ${ndr.shipmentId}. Re-attempt scheduled with courier.` };
    }

    // Default: REATTEMPT
    ndr.status = 'REATTEMPT_REQUESTED';
    if (input.preferredDeliveryDate) ndr.preferredDeliveryDate = input.preferredDeliveryDate;
    if (input.deliveryInstructions) ndr.deliveryInstructions = input.deliveryInstructions;
    ndr.nextAction = `Re-attempt scheduled for ${input.preferredDeliveryDate || 'Next Business Day'}. Rider notified.`;
    ndr.updatedAt = new Date().toLocaleString();

    NotificationService.createNotification({
      recipientId: 'admin',
      recipientType: 'ADMIN',
      title: 'Merchant NDR Re-Attempt Requested',
      message: `Merchant submitted re-attempt instructions for NDR ${ndr.ndrId} (${ndr.shipmentId}).`,
      type: 'NDR',
      referenceType: 'SHIPMENT',
      referenceId: ndr.shipmentId,
      eventId: `evt-ndr-req-${ndr.ndrId}`,
    });

    return { success: true, message: `Re-attempt request for NDR ${ndr.ndrId} submitted to ${ndr.courierName}.` };
  },

  // 5. RTO Management Engine
  getRtoRecords: (tenantId = 'all', statusFilter = 'all'): RtoRecord[] => {
    return RTO_STORE.filter((r) => {
      if (tenantId !== 'all' && r.tenantId !== tenantId) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  },

  updateRtoStatus: (
    rtoId: string,
    newStatus: RtoStatus,
    tenantId?: string
  ): { success: boolean; message: string; record?: RtoRecord } => {
    const record = RTO_STORE.find(
      (r) => (r.rtoId === rtoId || r.id === rtoId) && (!tenantId || tenantId === 'all' || r.tenantId === tenantId)
    );
    if (!record) {
      return { success: false, message: 'RTO record not found or unauthorized.' };
    }
    record.status = newStatus;
    if (newStatus === 'RTO_DELIVERED') {
      record.completedAt = new Date().toLocaleString();
    }
    return { success: true, message: `RTO status updated to ${newStatus}.`, record };
  },

  initiateRto: (input: {
    shipmentId: string;
    awbNumber: string;
    tenantId: string;
    courierId: string;
    courierName: string;
    rtoReason: RtoReason;
  }): RtoRecord => {
    const existing = RTO_STORE.find((r) => r.shipmentId === input.shipmentId);
    if (existing) return existing;

    const rtoId = `RTO-${Math.floor(10000 + Math.random() * 90000)}`;
    const newRto: RtoRecord = {
      id: `rto-rec-${Date.now()}`,
      rtoId,
      shipmentId: input.shipmentId,
      awbNumber: input.awbNumber,
      tenantId: input.tenantId,
      courierId: input.courierId,
      courierName: input.courierName,
      rtoReason: input.rtoReason,
      initiatedAt: new Date().toLocaleString(),
      status: 'RTO_INITIATED',
      rtoChargeINR: 65.0,
    };

    RTO_STORE.unshift(newRto);

    NotificationService.createNotification({
      recipientId: input.tenantId,
      recipientType: 'CUSTOMER',
      title: 'RTO Return Initiated',
      message: `Shipment ${input.shipmentId} has been marked for Return to Origin (RTO). Reason: ${input.rtoReason}.`,
      type: 'RTO',
      referenceType: 'SHIPMENT',
      referenceId: input.shipmentId,
      eventId: `evt-rto-${rtoId}`,
    });

    return newRto;
  },

  _resetStoreForTesting: () => {
    TRACKING_STORE = [...INITIAL_TRACKING_EVENTS];
    NDR_STORE = [...INITIAL_NDR_RECORDS];
    RTO_STORE = [...INITIAL_RTO_RECORDS];
    PROCESSED_TRACKING_HASHES.clear();
  },
};
