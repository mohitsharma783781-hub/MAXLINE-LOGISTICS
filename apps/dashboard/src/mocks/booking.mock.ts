import type {
  ShipmentBooking,
  BookingInput,
  BookingResponse,
  BookingEvent,
  LabelFormat,
} from '../types/booking';

// In-Memory Storage for Demo Bookings & History
const DEMO_BOOKINGS: Map<string, ShipmentBooking> = new Map();
const DEMO_BOOKING_EVENTS: Map<string, BookingEvent[]> = new Map();

// Initial Mock Bookings
const INITIAL_DEMO_BOOKING: ShipmentBooking = {
  id: 'book-9840192',
  shipmentId: 'SHP-9840192',
  orderId: 'ORD-9840192',
  courierId: 'delhivery',
  courierName: 'Delhivery Surface',
  courierLogo: '📦',
  serviceId: 'delhivery-surface',
  serviceName: 'Surface Standard',
  serviceType: 'Surface',
  status: 'BOOKED',
  bookingReference: 'DEMO-BOOK-84920184',
  courierShipmentId: 'CS-482019',
  awb: 'DEMO-AWB-98401928',
  awbStatus: 'ASSIGNED',
  labelStatus: 'GENERATED',
  labelUrl: 'https://demo.shipping-saas.com/labels/DEMO-AWB-98401928.pdf',
  labelFormat: 'PDF',
  chargeableWeight: 1.5,
  estimatedCost: 148.5,
  estimatedDays: '2–4 days',
  paymentMode: 'COD',
  originPincode: '110001',
  destinationPincode: '400001',
  declaredValue: 1500,
  createdAt: '2026-08-20T16:30:00Z',
  updatedAt: '2026-08-20T16:31:00Z',
};

DEMO_BOOKINGS.set('SHP-9840192', INITIAL_DEMO_BOOKING);
DEMO_BOOKING_EVENTS.set('SHP-9840192', [
  {
    id: 'evt-1',
    shipmentId: 'SHP-9840192',
    bookingId: 'book-9840192',
    eventType: 'BOOKING_STARTED',
    status: 'BOOKING',
    message: 'Booking request initialized for Delhivery Surface',
    timestamp: '2026-08-20T16:30:00Z',
  },
  {
    id: 'evt-2',
    shipmentId: 'SHP-9840192',
    bookingId: 'book-9840192',
    eventType: 'BOOKING_SUCCESS',
    status: 'BOOKED',
    message: 'Demo booking confirmed. Ref: DEMO-BOOK-84920184',
    timestamp: '2026-08-20T16:30:30Z',
  },
  {
    id: 'evt-3',
    shipmentId: 'SHP-9840192',
    bookingId: 'book-9840192',
    eventType: 'AWB_ASSIGNED',
    status: 'BOOKED',
    message: 'Demo AWB assigned: DEMO-AWB-98401928',
    timestamp: '2026-08-20T16:30:31Z',
  },
  {
    id: 'evt-4',
    shipmentId: 'SHP-9840192',
    bookingId: 'book-9840192',
    eventType: 'LABEL_GENERATED',
    status: 'BOOKED',
    message: 'Demo shipping label generated (Format: PDF)',
    timestamp: '2026-08-20T16:31:00Z',
  },
]);

/**
 * Demo Booking Provider Architecture
 */
export const demoBookingProvider = {
  /**
   * Get Booking for a given shipment
   */
  getBookingByShipmentId: (shipmentId: string): ShipmentBooking | null => {
    return DEMO_BOOKINGS.get(shipmentId) || null;
  },

  /**
   * Get Audit Timeline Events for a given shipment
   */
  getBookingEvents: (shipmentId: string): BookingEvent[] => {
    return DEMO_BOOKING_EVENTS.get(shipmentId) || [];
  },

  /**
   * Book Shipment with Idempotency & Validation Protection
   */
  bookShipment: async (input: BookingInput): Promise<BookingResponse> => {
    const {
      shipmentId,
      orderId,
      courierId,
      serviceId,
      courierName,
      serviceName,
      serviceType = 'Surface',
      courierLogo = '📦',
      originPincode,
      destinationPincode,
      paymentMode,
      chargeableWeight,
      estimatedCost,
      estimatedDays,
      declaredValue,
    } = input;

    // Idempotency Check
    const existing = DEMO_BOOKINGS.get(shipmentId);
    if (existing) {
      if (existing.status === 'BOOKING') {
        return {
          success: false,
          bookingReference: existing.bookingReference,
          courierShipmentId: existing.courierShipmentId || '',
          awb: existing.awb || '',
          awbStatus: existing.awbStatus,
          labelStatus: existing.labelStatus,
          failureReason: 'Booking already in progress. Please wait for completion.',
          booking: existing,
        };
      }
      if (existing.status === 'BOOKED') {
        return {
          success: false,
          bookingReference: existing.bookingReference,
          courierShipmentId: existing.courierShipmentId || '',
          awb: existing.awb || '',
          awbStatus: existing.awbStatus,
          labelStatus: existing.labelStatus,
          failureReason: 'Shipment is already booked with AWB assigned.',
          booking: existing,
        };
      }
    }

    // Generate Demo Identifiers
    const randomRef = Math.floor(10000000 + Math.random() * 90000000);
    const bookingReference = `DEMO-BOOK-${randomRef}`;
    const courierShipmentId = `CS-${Math.floor(100000 + Math.random() * 900000)}`;
    const awb = `DEMO-AWB-${randomRef}`;
    const bookingId = `book-${Date.now()}`;
    const nowStr = new Date().toISOString();

    // Create transient booking state
    const newBooking: ShipmentBooking = {
      id: bookingId,
      shipmentId,
      orderId,
      courierId,
      courierName,
      courierLogo,
      serviceId,
      serviceName,
      serviceType,
      status: 'BOOKED',
      bookingReference,
      courierShipmentId,
      awb,
      awbStatus: 'ASSIGNED',
      labelStatus: 'NOT_GENERATED',
      chargeableWeight,
      estimatedCost,
      estimatedDays,
      paymentMode,
      originPincode,
      destinationPincode,
      declaredValue,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    DEMO_BOOKINGS.set(shipmentId, newBooking);

    // Record Audit Timeline Events
    const events: BookingEvent[] = [
      {
        id: `evt-${Date.now()}-1`,
        shipmentId,
        bookingId,
        eventType: 'BOOKING_STARTED',
        status: 'BOOKING',
        message: `Demo booking initialized for ${courierName} (${serviceName})`,
        timestamp: nowStr,
      },
      {
        id: `evt-${Date.now()}-2`,
        shipmentId,
        bookingId,
        eventType: 'BOOKING_SUCCESS',
        status: 'BOOKED',
        message: `Demo booking confirmed. Ref: ${bookingReference}`,
        timestamp: nowStr,
      },
      {
        id: `evt-${Date.now()}-3`,
        shipmentId,
        bookingId,
        eventType: 'AWB_ASSIGNED',
        status: 'BOOKED',
        message: `Demo AWB assigned: ${awb}`,
        timestamp: nowStr,
      },
    ];

    DEMO_BOOKING_EVENTS.set(shipmentId, events);

    return {
      success: true,
      bookingReference,
      courierShipmentId,
      awb,
      awbStatus: 'ASSIGNED',
      labelStatus: 'NOT_GENERATED',
      booking: newBooking,
    };
  },

  /**
   * Generate Demo Label
   */
  generateDemoLabel: (shipmentId: string, format: LabelFormat = 'PDF'): ShipmentBooking | null => {
    const booking = DEMO_BOOKINGS.get(shipmentId);
    if (!booking) return null;

    booking.labelStatus = 'GENERATED';
    booking.labelFormat = format;
    booking.labelUrl = `https://demo.shipping-saas.com/labels/${booking.awb}.${format.toLowerCase()}`;
    booking.updatedAt = new Date().toISOString();

    const events = DEMO_BOOKING_EVENTS.get(shipmentId) || [];
    events.push({
      id: `evt-${Date.now()}`,
      shipmentId,
      bookingId: booking.id,
      eventType: 'LABEL_GENERATED',
      status: 'BOOKED',
      message: `Demo shipping label generated (Format: ${format})`,
      timestamp: booking.updatedAt,
    });

    DEMO_BOOKING_EVENTS.set(shipmentId, events);
    return booking;
  },

  /**
   * Cancel Demo Booking
   */
  cancelDemoBooking: (shipmentId: string): { success: boolean; message: string; booking: ShipmentBooking | null } => {
    const booking = DEMO_BOOKINGS.get(shipmentId);
    if (!booking) {
      return { success: false, message: 'Booking not found.', booking: null };
    }

    if (booking.status === 'CANCELLED') {
      return { success: false, message: 'Booking is already cancelled.', booking };
    }

    booking.status = 'CANCELLED';
    booking.updatedAt = new Date().toISOString();

    const events = DEMO_BOOKING_EVENTS.get(shipmentId) || [];
    events.push({
      id: `evt-${Date.now()}`,
      shipmentId,
      bookingId: booking.id,
      eventType: 'BOOKING_CANCELLED',
      status: 'CANCELLED',
      message: 'Demo booking cancelled by merchant',
      timestamp: booking.updatedAt,
    });

    DEMO_BOOKING_EVENTS.set(shipmentId, events);
    return { success: true, message: 'Demo booking cancelled successfully.', booking };
  },
};
