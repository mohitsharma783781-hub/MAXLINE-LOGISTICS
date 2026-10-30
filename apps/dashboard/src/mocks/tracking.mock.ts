import type {
  ShipmentTrackingSummary,
  TrackingEvent,
  TrackingStatus,
  TrackingEventCode,
} from '../types/tracking';

// Derive current tracking status from latest valid event
export const deriveCurrentTrackingStatus = (events: TrackingEvent[]): TrackingStatus => {
  if (!events || events.length === 0) return 'CREATED';
  // Sort chronologically descending to get latest event first
  const sorted = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return sorted[0].status;
};

// INITIAL DEMO TRACKED SHIPMENTS
export const DEMO_TRACKING_DATA: ShipmentTrackingSummary[] = [
  {
    shipmentId: 'SHP-9840192',
    orderId: 'ORD-9840192',
    awb: 'DEMO-AWB-98401928',
    courierId: 'delhivery',
    courierName: 'Delhivery Surface',
    courierLogo: '📦',
    originCity: 'Gurugram',
    destinationCity: 'Mumbai',
    recipientName: 'Aarav Sharma',
    currentStatus: 'IN_TRANSIT',
    lastUpdated: '2026-08-20 16:30 PM',
    estimatedDeliveryDate: '2026-08-22 (Estimated — Demo)',
    events: [
      {
        id: 'tr-ev-4',
        shipmentId: 'SHP-9840192',
        awb: 'DEMO-AWB-98401928',
        courierId: 'delhivery',
        courierName: 'Delhivery Surface',
        status: 'IN_TRANSIT',
        eventCode: 'IN_TRANSIT',
        eventTitle: 'In Transit',
        description: 'Parcel arrived at Delhi Logistics Hub, departing for Mumbai Sorting Facility',
        location: 'Delhi Hub',
        eventTime: '20 Aug 2026, 16:30 PM',
        source: 'COURIER',
        createdAt: '2026-08-20T16:30:00Z',
      },
      {
        id: 'tr-ev-3',
        shipmentId: 'SHP-9840192',
        awb: 'DEMO-AWB-98401928',
        courierId: 'delhivery',
        courierName: 'Delhivery Surface',
        status: 'PICKED_UP',
        eventCode: 'PICKED_UP',
        eventTitle: 'Picked Up',
        description: 'Parcel collected from Gurugram Warehouse by pickup executive',
        location: 'Gurugram Warehouse',
        eventTime: '20 Aug 2026, 10:15 AM',
        source: 'COURIER',
        createdAt: '2026-08-20T10:15:00Z',
      },
      {
        id: 'tr-ev-2',
        shipmentId: 'SHP-9840192',
        awb: 'DEMO-AWB-98401928',
        courierId: 'delhivery',
        courierName: 'Delhivery Surface',
        status: 'LABEL_GENERATED',
        eventCode: 'LABEL_GENERATED',
        eventTitle: 'Label Generated',
        description: 'Shipping label generated and dispatch manifest created',
        location: 'Gurugram Warehouse',
        eventTime: '19 Aug 2026, 17:00 PM',
        source: 'SYSTEM',
        createdAt: '2026-08-19T17:00:00Z',
      },
      {
        id: 'tr-ev-1',
        shipmentId: 'SHP-9840192',
        awb: 'DEMO-AWB-98401928',
        courierId: 'delhivery',
        courierName: 'Delhivery Surface',
        status: 'BOOKED',
        eventCode: 'SHIPMENT_BOOKED',
        eventTitle: 'Shipment Booked',
        description: 'Shipment booked with Delhivery Surface. AWB DEMO-AWB-98401928 generated.',
        location: 'Gurugram Warehouse',
        eventTime: '19 Aug 2026, 15:30 PM',
        source: 'SYSTEM',
        createdAt: '2026-08-19T15:30:00Z',
      },
    ],
  },
  {
    shipmentId: 'DEMO-9840193',
    orderId: 'ORD-9840193',
    awb: 'DEMO-AWB-98401939',
    courierId: 'fedex',
    courierName: 'FedEx Priority',
    courierLogo: '⚡',
    originCity: 'Gurugram',
    destinationCity: 'Bengaluru',
    recipientName: 'Priya Verma',
    currentStatus: 'OUT_FOR_DELIVERY',
    lastUpdated: '2026-08-21 08:30 AM',
    estimatedDeliveryDate: '2026-08-21 (Estimated — Demo)',
    events: [
      {
        id: 'tr-ev-5',
        shipmentId: 'DEMO-9840193',
        awb: 'DEMO-AWB-98401939',
        courierId: 'fedex',
        courierName: 'FedEx Priority',
        status: 'OUT_FOR_DELIVERY',
        eventCode: 'OUT_FOR_DELIVERY',
        eventTitle: 'Out for Delivery',
        description: 'Parcel loaded into delivery van. Agent assigned for doorstep delivery.',
        location: 'Bengaluru South Hub',
        eventTime: '21 Aug 2026, 08:30 AM',
        source: 'COURIER',
        createdAt: '2026-08-21T08:30:00Z',
      },
      {
        id: 'tr-ev-4',
        shipmentId: 'DEMO-9840193',
        awb: 'DEMO-AWB-98401939',
        courierId: 'fedex',
        courierName: 'FedEx Priority',
        status: 'IN_TRANSIT',
        eventCode: 'IN_TRANSIT',
        eventTitle: 'In Transit',
        description: 'Arrived at Bengaluru Air Cargo Hub',
        location: 'Bengaluru Airport Hub',
        eventTime: '20 Aug 2026, 22:10 PM',
        source: 'COURIER',
        createdAt: '2026-08-20T22:10:00Z',
      },
    ],
  },
  {
    shipmentId: 'DEMO-9840197',
    orderId: 'ORD-9840197',
    awb: 'DEMO-AWB-98401971',
    courierId: 'bluedart',
    courierName: 'BlueDart Express',
    courierLogo: '✈️',
    originCity: 'Gurugram',
    destinationCity: 'Kolkata',
    recipientName: 'Sneha Roy',
    currentStatus: 'DELIVERED',
    lastUpdated: '2026-08-20 16:45 PM',
    estimatedDeliveryDate: 'Delivered on 20 Aug 2026',
    events: [
      {
        id: 'tr-ev-6',
        shipmentId: 'DEMO-9840197',
        awb: 'DEMO-AWB-98401971',
        courierId: 'bluedart',
        courierName: 'BlueDart Express',
        status: 'DELIVERED',
        eventCode: 'DELIVERED',
        eventTitle: 'Delivered',
        description: 'Parcel handed over to Sneha Roy at doorstep. OTP verified.',
        location: 'Kolkata Central Zone',
        eventTime: '20 Aug 2026, 16:45 PM',
        source: 'COURIER',
        createdAt: '2026-08-20T16:45:00Z',
      },
    ],
  },
];

// IN-MEMORY TRACKING STORE
const TRACKING_STORE: Map<string, ShipmentTrackingSummary> = new Map();
DEMO_TRACKING_DATA.forEach((t) => TRACKING_STORE.set(t.shipmentId, t));

export const demoTrackingProvider = {
  getAllTrackedShipments: (): ShipmentTrackingSummary[] => {
    return Array.from(TRACKING_STORE.values());
  },

  getTrackingByShipmentId: (shipmentId: string): ShipmentTrackingSummary | null => {
    const match = TRACKING_STORE.get(shipmentId) || Array.from(TRACKING_STORE.values()).find((t) => t.awb === shipmentId || t.orderId === shipmentId);
    return match || null;
  },

  getTrackingBySearch: (query: string): ShipmentTrackingSummary | null => {
    if (!query || !query.trim()) return DEMO_TRACKING_DATA[0];
    const q = query.trim().toLowerCase();
    const list = Array.from(TRACKING_STORE.values());
    const match = list.find(
      (t) =>
        t.shipmentId.toLowerCase() === q ||
        t.awb.toLowerCase() === q ||
        t.orderId.toLowerCase() === q ||
        t.shipmentId.toLowerCase().includes(q) ||
        t.awb.toLowerCase().includes(q)
    );
    return match || null;
  },

  advanceDemoState: (
    shipmentId: string,
    targetStatus: TrackingStatus
  ): { success: boolean; message: string; summary: ShipmentTrackingSummary | null } => {
    const summary = TRACKING_STORE.get(shipmentId) || Array.from(TRACKING_STORE.values()).find((t) => t.awb === shipmentId);
    if (!summary) return { success: false, message: 'Shipment tracking record not found.', summary: null };

    // Validation Rules
    if (summary.currentStatus === 'DELIVERED') {
      return { success: false, message: 'Shipment already delivered. Further status transitions are not allowed.', summary };
    }
    if (summary.currentStatus === 'CANCELLED') {
      return { success: false, message: 'Shipment is cancelled. Live status transitions are blocked.', summary };
    }
    if (summary.currentStatus === 'RTO_DELIVERED') {
      return { success: false, message: 'Parcel has been delivered back to origin warehouse. Transitions blocked.', summary };
    }

    // Invalid transition checks
    if (summary.currentStatus === 'OUT_FOR_DELIVERY' && targetStatus === 'PICKED_UP') {
      return { success: false, message: 'Invalid transition: Cannot set status back to Picked Up from Out for Delivery.', summary };
    }

    const eventTitles: Record<TrackingStatus, { title: string; code: TrackingEventCode; desc: string; loc: string }> = {
      CREATED: { title: 'Shipment Created', code: 'SHIPMENT_CREATED', desc: 'Shipment details created in system', loc: 'Origin System' },
      BOOKED: { title: 'Shipment Booked', code: 'SHIPMENT_BOOKED', desc: 'Carrier AWB booked', loc: 'Warehouse' },
      LABEL_GENERATED: { title: 'Label Generated', code: 'LABEL_GENERATED', desc: 'Shipping label printed', loc: 'Warehouse' },
      PICKUP_REQUESTED: { title: 'Pickup Requested', code: 'PICKUP_REQUESTED', desc: 'Courier pickup dispatch requested', loc: 'Warehouse' },
      PICKUP_SCHEDULED: { title: 'Pickup Scheduled', code: 'PICKUP_REQUESTED', desc: 'Courier pickup scheduled', loc: 'Warehouse' },
      PICKED_UP: { title: 'Picked Up', code: 'PICKED_UP', desc: 'Collected by courier pickup team', loc: `${summary.originCity} Hub` },
      IN_TRANSIT: { title: 'In Transit', code: 'IN_TRANSIT', desc: `In transit to ${summary.destinationCity} sorting hub`, loc: `${summary.originCity} Main Logistics Gateway` },
      ARRIVED_AT_HUB: { title: 'Arrived at Hub', code: 'ARRIVED_AT_HUB', desc: `Arrived at ${summary.destinationCity} sorting facility`, loc: `${summary.destinationCity} Sorting Hub` },
      OUT_FOR_DELIVERY: { title: 'Out for Delivery', code: 'OUT_FOR_DELIVERY', desc: 'Assigned to delivery executive for doorstep handover', loc: `${summary.destinationCity} Delivery Hub` },
      DELIVERED: { title: 'Delivered', code: 'DELIVERED', desc: `Parcel successfully delivered to ${summary.recipientName}`, loc: `${summary.destinationCity} Recipient Address` },
      DELIVERY_ATTEMPTED: { title: 'Delivery Attempted', code: 'DELIVERY_ATTEMPT_FAILED', desc: 'Doorstep delivery attempted', loc: `${summary.destinationCity} Hub` },
      NDR: { title: 'Delivery Exception', code: 'NDR_CREATED', desc: 'Delivery attempt failed / Buyer unreachable', loc: `${summary.destinationCity} Hub` },
      RTO_INITIATED: { title: 'RTO Initiated', code: 'RTO_INITIATED', desc: 'Parcel returning back to origin', loc: `${summary.destinationCity} Hub` },
      RTO_IN_TRANSIT: { title: 'RTO In Transit', code: 'RTO_IN_TRANSIT', desc: `In transit back to ${summary.originCity} warehouse`, loc: 'Return Sorting Facility' },
      RTO_DELIVERED: { title: 'RTO Delivered', code: 'RTO_DELIVERED', desc: `Returned and restocked at ${summary.originCity} Warehouse`, loc: `${summary.originCity} Warehouse` },
      CANCELLED: { title: 'Cancelled', code: 'SHIPMENT_CANCELLED', desc: 'Shipment cancelled by merchant', loc: 'System' },
      LOST: { title: 'Parcel Lost', code: 'EXCEPTION', desc: 'Parcel reported lost during transit', loc: 'Hub' },
      DAMAGED: { title: 'Parcel Damaged', code: 'EXCEPTION', desc: 'Parcel reported damaged during transit', loc: 'Hub' },
      EXCEPTION: { title: 'Operational Exception', code: 'EXCEPTION', desc: 'Operational delay recorded', loc: 'Hub' },
      UNKNOWN: { title: 'Unknown Status', code: 'EXCEPTION', desc: 'Unmapped provider event', loc: 'Unknown Hub' },
    };

    const info = eventTitles[targetStatus];
    const nowIso = new Date().toISOString();
    const nowStr = new Date().toLocaleString();

    const newEvent: TrackingEvent = {
      id: `tr-ev-${Date.now()}`,
      shipmentId: summary.shipmentId,
      awb: summary.awb,
      courierId: summary.courierId,
      courierName: summary.courierName,
      status: targetStatus,
      eventCode: info.code,
      eventTitle: info.title,
      description: info.desc,
      location: info.loc,
      eventTime: nowStr,
      source: 'DEMO',
      createdAt: nowIso,
    };

    // Deduplicate identical event
    const exists = summary.events.some((e) => e.eventCode === info.code && e.status === targetStatus);
    if (!exists) {
      summary.events.unshift(newEvent);
    }

    summary.currentStatus = deriveCurrentTrackingStatus(summary.events);
    summary.lastUpdated = nowStr;

    TRACKING_STORE.set(summary.shipmentId, summary);
    return { success: true, message: `Status updated to ${targetStatus} (Demo)`, summary };
  },

  refreshTracking: (shipmentId: string): ShipmentTrackingSummary | null => {
    const summary = TRACKING_STORE.get(shipmentId) || Array.from(TRACKING_STORE.values()).find((t) => t.awb === shipmentId);
    if (!summary) return null;
    summary.lastUpdated = `${new Date().toLocaleString()} (Refreshed)`;
    TRACKING_STORE.set(summary.shipmentId, summary);
    return summary;
  },
};
