import type {
  TrackingStatus,
  TrackingEvent,
  ShipmentTrackingSummary,
} from '../types/tracking';
import { DEMO_TRACKING_DATA, deriveCurrentTrackingStatus } from '../mocks/tracking.mock';
import { CustomerShipmentService } from './customerShipmentService';
import { DelhiveryService } from './delhiveryService';

const TRACKING_STORE: Map<string, ShipmentTrackingSummary> = new Map();
DEMO_TRACKING_DATA.forEach((t) => TRACKING_STORE.set(t.shipmentId, t));

const PROCESSED_EVENT_HASHES: Set<string> = new Set();

export const TrackingStatusMapper = {
  normalize: (providerStatus: string): TrackingStatus => {
    if (!providerStatus) return 'UNKNOWN';
    const s = providerStatus.toLowerCase().trim();

    if (s.includes('delivered') && !s.includes('out') && !s.includes('rto')) return 'DELIVERED';
    if (s.includes('out for delivery')) return 'OUT_FOR_DELIVERY';
    if (s.includes('transit') || s.includes('dispatched') || s.includes('enroute')) return 'IN_TRANSIT';
    if (s.includes('arrived') || s.includes('sorting hub')) return 'ARRIVED_AT_HUB';
    if (s.includes('picked up') || s.includes('collected')) return 'PICKED_UP';
    if (s.includes('pickup scheduled') || s.includes('pickup assigned')) return 'PICKUP_SCHEDULED';
    if (s.includes('pickup requested')) return 'PICKUP_REQUESTED';
    if (s.includes('rto delivered') || s.includes('returned to origin')) return 'RTO_DELIVERED';
    if (s.includes('rto') || s.includes('return')) return 'RTO_INITIATED';
    if (s.includes('ndr') || s.includes('failed') || s.includes('attempted')) return 'NDR';
    if (s.includes('cancelled') || s.includes('void')) return 'CANCELLED';
    if (s.includes('booked') || s.includes('manifest')) return 'BOOKED';

    return 'IN_TRANSIT';
  },
};

export const TrackingService = {
  addEvent: async (
    eventInput: Partial<TrackingEvent>
  ): Promise<{ success: boolean; message: string; event?: TrackingEvent; duplicate: boolean; summary?: ShipmentTrackingSummary }> => {
    const shipmentId = eventInput.shipmentId || 'SHP-9840192';
    const summary = TRACKING_STORE.get(shipmentId) || Array.from(TRACKING_STORE.values()).find((t) => t.awb === eventInput.awb || t.shipmentId === shipmentId);

    if (!summary) {
      return { success: false, message: 'Shipment tracking record not found', duplicate: false };
    }

    const providerStatus = eventInput.providerStatus || eventInput.description || 'Status update';
    const status: TrackingStatus = eventInput.status || TrackingStatusMapper.normalize(providerStatus);

    // 1. Terminal State Protection: Terminal states cannot be regressed by late out-of-order events
    const TERMINAL_STATES: TrackingStatus[] = ['DELIVERED', 'RTO_DELIVERED', 'CANCELLED'];
    if (TERMINAL_STATES.includes(summary.currentStatus) && !TERMINAL_STATES.includes(status)) {
      return {
        success: false,
        message: `Shipment is in terminal state (${summary.currentStatus}). Status regression to ${status} blocked.`,
        duplicate: false,
        summary,
      };
    }

    // 2. Event Deduplication: Check providerEventId or hash
    const eventTime = eventInput.eventTime || new Date().toLocaleString();
    const location = eventInput.location || 'Sorting Hub';
    const eventHash = eventInput.idempotencyKey || eventInput.providerEventId || `${shipmentId}:${status}:${eventTime}:${location}`;

    if (PROCESSED_EVENT_HASHES.has(eventHash)) {
      return {
        success: true,
        message: 'Duplicate tracking event ignored',
        duplicate: true,
        summary,
      };
    }

    PROCESSED_EVENT_HASHES.add(eventHash);

    const nowIso = new Date().toISOString();
    const newEvent: TrackingEvent = {
      id: eventInput.id || `tr-ev-${Date.now()}`,
      shipmentId: summary.shipmentId,
      awb: summary.awb,
      courierId: summary.courierId,
      courierName: summary.courierName,
      status,
      providerStatus,
      description: eventInput.description || `Tracking update: ${status}`,
      location,
      eventTime,
      receivedAt: nowIso,
      source: eventInput.source || 'DEMO',
      providerEventId: eventInput.providerEventId,
      idempotencyKey: eventHash,
      createdAt: nowIso,
      tenantId: summary.tenantId || 'tenant-demo-01',
    };

    // Insert & sort timeline chronologically
    summary.events.unshift(newEvent);
    summary.events = summary.events.filter(Boolean);
    summary.events.sort((a, b) => new Date(b?.createdAt || b?.eventTime || 0).getTime() - new Date(a?.createdAt || a?.eventTime || 0).getTime());

    summary.currentStatus = deriveCurrentTrackingStatus(summary.events);
    summary.lastUpdated = eventTime;

    TRACKING_STORE.set(summary.shipmentId, summary);

    return {
      success: true,
      message: `Tracking event added: ${status}`,
      event: newEvent,
      duplicate: false,
      summary,
    };
  },

  getTracking: (shipmentIdOrAwb: string, tenantId: string = 'tenant-demo-01'): ShipmentTrackingSummary | null => {
    const match = TRACKING_STORE.get(shipmentIdOrAwb) || Array.from(TRACKING_STORE.values()).find((t) => t.awb === shipmentIdOrAwb || t.orderId === shipmentIdOrAwb);
    if (!match) return null;
    if (tenantId !== 'all' && match.tenantId && match.tenantId !== tenantId) return null;
    return match;
  },

  getAllTracking: (tenantId: string = 'tenant-demo-01'): ShipmentTrackingSummary[] => {
    return Array.from(TRACKING_STORE.values()).filter((t) => t.tenantId === tenantId || tenantId === 'all');
  },

  // Public Buyer Tracking (Sanitizes internal merchant secrets, database IDs, costs)
  getPublicTracking: (awb: string): Partial<ShipmentTrackingSummary> | null => {
    const full = Array.from(TRACKING_STORE.values()).find((t) => t.awb.toLowerCase() === awb.toLowerCase() || t.shipmentId.toLowerCase() === awb.toLowerCase());
    if (!full) return null;

    return {
      awb: full.awb,
      courierName: full.courierName,
      courierLogo: full.courierLogo,
      originCity: full.originCity,
      destinationCity: full.destinationCity,
      recipientName: full.recipientName,
      currentStatus: full.currentStatus,
      lastUpdated: full.lastUpdated,
      estimatedDeliveryDate: full.estimatedDeliveryDate,
      events: full.events.map((e) => ({
        id: e.id,
        shipmentId: full.shipmentId,
        awb: full.awb,
        courierId: full.courierId,
        courierName: full.courierName,
        status: e.status,
        description: e.description,
        location: e.location,
        eventTime: e.eventTime,
        source: 'COURIER',
        createdAt: e?.createdAt || new Date().toISOString(),
      })),
    };
  },

  // Real-Time Carrier Tracking from CustomerShipmentService & Carrier Network
  fetchLiveTracking: async (
    query: string
  ): Promise<{
    success: boolean;
    data: ShipmentTrackingSummary | null;
    source: 'LIVE_CARRIER' | 'PORTAL_DB' | 'DEMO' | 'NOT_FOUND';
    message?: string;
  }> => {
    const q = (query || '').trim();
    if (!q) {
      return { success: false, data: null, source: 'NOT_FOUND', message: 'Please enter a valid tracking number or AWB.' };
    }

    const qLower = q.toLowerCase();
    const bookedShipment = CustomerShipmentService.getShipmentById(q);

    // 1. LIVE CARRIER TRACKING: Query Delhivery live network if AWB matches pattern or belongs to booked shipment
    const targetAwb = bookedShipment?.awbNumber || q;
    const isDelhiveryCandidate =
      (bookedShipment && (bookedShipment.courierId?.toLowerCase().includes('delhivery') || bookedShipment.courierName?.toLowerCase().includes('delhivery'))) ||
      /^(del|\d{10,16})/i.test(targetAwb);

    if (isDelhiveryCandidate) {
      try {
        const liveDelhivery = await DelhiveryService.trackShipment(targetAwb);
        if (liveDelhivery && liveDelhivery.success && liveDelhivery.events && liveDelhivery.events.length > 0) {
          const liveEvents: TrackingEvent[] = liveDelhivery.events.map((e, idx) => ({
            id: `del-ev-${idx}-${Date.now()}`,
            shipmentId: bookedShipment?.shipmentId || `SHP-${targetAwb}`,
            awb: targetAwb,
            courierId: 'delhivery',
            courierName: 'Delhivery Surface Express',
            status: TrackingStatusMapper.normalize(e.status),
            providerStatus: e.title || e.status,
            description: e.description || 'Processed by Delhivery Hub',
            location: e.location || 'Delhivery Hub',
            eventTime: e.timestamp ? new Date(e.timestamp).toLocaleString() : new Date().toLocaleString(),
            source: 'COURIER',
            createdAt: e.timestamp || new Date().toISOString(),
          }));

          const carrierSummary: ShipmentTrackingSummary = {
            shipmentId: bookedShipment?.shipmentId || `SHP-${targetAwb}`,
            orderId: bookedShipment?.orderId || liveDelhivery.orderId || `ORD-${targetAwb.slice(-6)}`,
            awb: targetAwb,
            courierId: 'delhivery',
            courierName: 'Delhivery Surface Express',
            courierLogo: '/delhivery.png',
            originCity: bookedShipment?.pickupCity || liveDelhivery.origin || 'Panchkula Hub',
            destinationCity: bookedShipment?.deliveryCity || liveDelhivery.destination || 'Destination Hub',
            recipientName: bookedShipment?.deliveryContact || liveDelhivery.consignee || 'Customer Consignee',
            currentStatus: TrackingStatusMapper.normalize(liveDelhivery.status),
            lastUpdated: new Date().toLocaleString(),
            estimatedDeliveryDate: liveDelhivery.expectedDeliveryDate || '2-4 Business Days',
            events: liveEvents,
            tenantId: bookedShipment?.tenantId,
          };

          return {
            success: true,
            data: carrierSummary,
            source: 'LIVE_CARRIER',
            message: 'Live tracking feed connected directly with Delhivery Production Network.',
          };
        }
      } catch (delTrackErr) {
        console.warn('[TrackingService] Delhivery live tracking check fallback:', delTrackErr);
      }
    }

    // 2. Check local merchant portal shipments (CustomerShipmentService)
    if (bookedShipment) {
      const stepStatus = TrackingStatusMapper.normalize(bookedShipment.bookingStatus);
      const events: TrackingEvent[] = bookedShipment.trackingTimeline?.map((t, idx) => ({
        id: `local-ev-${idx}`,
        shipmentId: bookedShipment.shipmentId,
        awb: bookedShipment.awbNumber || q,
        courierId: bookedShipment.courierId,
        courierName: bookedShipment.courierName,
        status: TrackingStatusMapper.normalize(t.statusKey),
        providerStatus: t.statusTitle,
        description: t.description || 'Order processed',
        location: t.location || bookedShipment.pickupCity || 'Origin Hub',
        eventTime: t.timestamp || new Date().toLocaleString(),
        source: 'MERCHANT',
        createdAt: new Date().toISOString(),
      })) || [
        {
          id: 'local-ev-0',
          shipmentId: bookedShipment.shipmentId,
          awb: bookedShipment.awbNumber || q,
          courierId: bookedShipment.courierId,
          courierName: bookedShipment.courierName,
          status: stepStatus,
          providerStatus: bookedShipment.customerFacingStatus,
          description: 'Shipment booked. Awaiting first carrier pickup scan.',
          location: bookedShipment.pickupCity || 'Origin Hub',
          eventTime: bookedShipment.bookingDate || new Date().toLocaleString(),
          source: 'MERCHANT',
          createdAt: new Date().toISOString(),
        },
      ];

      const summary: ShipmentTrackingSummary = {
        shipmentId: bookedShipment.shipmentId,
        orderId: bookedShipment.orderId,
        awb: bookedShipment.awbNumber || q,
        courierId: bookedShipment.courierId,
        courierName: bookedShipment.courierName,
        courierLogo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100',
        originCity: bookedShipment.pickupCity || 'Origin Hub',
        destinationCity: bookedShipment.deliveryCity || 'Destination Hub',
        recipientName: bookedShipment.deliveryContact || 'Customer',
        currentStatus: stepStatus,
        lastUpdated: bookedShipment.bookingDate || new Date().toLocaleString(),
        estimatedDeliveryDate: '2-4 Business Days',
        events,
        tenantId: bookedShipment.tenantId,
      };

      return {
        success: true,
        data: summary,
        source: 'PORTAL_DB',
        message: 'Order booked in portal. Carrier hub scan in progress.',
      };
    }

    return {
      success: false,
      data: null,
      source: 'NOT_FOUND',
      message: `No active shipment found with tracking ID or AWB: "${q}". Please check the number or wait a few minutes after booking for carrier indexing.`,
    };
  },
};
