import type {
  BookingRequest,
  BookingRecord,
  BookingAttempt,
  AddressInfo,
} from '../types/booking';
import type { CourierCode } from '../types/couriers';
import { CourierAdapterFactory } from './courierAdapter';

// IN-MEMORY STORAGE FOR BOOKINGS & ATTEMPTS
const BOOKING_RECORDS_STORE: Map<string, BookingRecord> = new Map();
const BOOKING_ATTEMPTS_STORE: Map<string, BookingAttempt[]> = new Map();

// PRE-POPULATE INITIAL MOCK BOOKINGS
const INITIAL_RECORD: BookingRecord = {
  id: 'book-9840192',
  tenantId: 'tenant-demo-01',
  orderId: 'ORD-9840192',
  shipmentId: 'SHP-9840192',
  rateQuoteId: 'quote-delhivery-101',
  courierId: 'delhivery',
  courierCode: 'DELHIVERY',
  courierName: 'Delhivery Surface',
  serviceId: 'delhivery-surface',
  serviceName: 'Surface Standard',
  idempotencyKey: 'tenant-demo-01:SHP-9840192:quote-delhivery-101',
  bookingReference: 'BK-2026-849201',
  providerReference: 'CS-482019',
  awb: 'DELHIVERY-849201',
  awbStatus: 'ASSIGNED',
  status: 'BOOKED',
  totalCostMinor: 14850,
  paymentMode: 'COD',
  originPincode: '110001',
  destinationPincode: '400001',
  requestedAt: '2026-08-20 16:30 PM',
  bookedAt: '2026-08-20 16:30 PM',
  createdAt: '2026-08-20 16:30 PM',
  updatedAt: '2026-08-20 16:30 PM',
};

BOOKING_RECORDS_STORE.set(INITIAL_RECORD.id, INITIAL_RECORD);
BOOKING_ATTEMPTS_STORE.set(INITIAL_RECORD.id, [
  {
    id: 'att-1',
    bookingId: INITIAL_RECORD.id,
    attemptNumber: 1,
    status: 'BOOKED',
    requestId: 'req-101',
    providerReference: 'CS-482019',
    createdAt: '2026-08-20 16:30 PM',
  },
]);

export const AddressValidationService = {
  validateAddress: (addr: AddressInfo): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!addr.name || !addr.name.trim()) errors.push('Contact name is required');
    if (!addr.phone || !/^[6-9][0-9]{9}$/.test(addr.phone.trim())) {
      errors.push('Valid 10-digit mobile phone number is required');
    }
    if (!addr.addressLine1 || !addr.addressLine1.trim()) errors.push('Address Line 1 is required');
    if (!addr.city || !addr.city.trim()) errors.push('City is required');
    if (!addr.state || !addr.state.trim()) errors.push('State is required');
    if (!addr.pincode || !/^[1-9][0-9]{5}$/.test(addr.pincode.trim())) {
      errors.push('Valid 6-digit postal pincode is required');
    }
    return { valid: errors.length === 0, errors };
  },
};

export const BookingEngine = {
  // Validate complete booking request
  validateBooking: (request: BookingRequest): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    const senderVal = AddressValidationService.validateAddress(request.sender);
    if (!senderVal.valid) errors.push(...senderVal.errors.map((e) => `Sender: ${e}`));

    const recipVal = AddressValidationService.validateAddress(request.recipient);
    if (!recipVal.valid) errors.push(...recipVal.errors.map((e) => `Recipient: ${e}`));

    if (!request.packages || request.packages.length === 0) {
      errors.push('At least one package specification is required');
    } else {
      request.packages.forEach((pkg, idx) => {
        if (pkg.weightGrams <= 0) errors.push(`Package #${idx + 1}: Weight must be > 0g`);
      });
    }

    if (request.invoiceValueMinor < 0) errors.push('Invoice value cannot be negative');

    return { valid: errors.length === 0, errors };
  },

  // Quote Validation
  validateQuote: async (rateQuoteId: string, _tenantId: string): Promise<{ valid: boolean; error?: string }> => {
    if (!rateQuoteId) return { valid: false, error: 'Rate quote ID is missing' };
    return { valid: true };
  },

  // Idempotent Booking Execution
  bookShipment: async (
    request: BookingRequest
  ): Promise<{ success: boolean; booking: BookingRecord; awb?: string; error?: string }> => {
    const idempotencyKey =
      request.idempotencyKey || `${request.tenantId}:${request.shipmentId}:${request.rateQuoteId}`;

    // 1. Idempotency Check: Return existing booking if request submitted twice
    for (const record of Array.from(BOOKING_RECORDS_STORE.values())) {
      if (record.idempotencyKey === idempotencyKey) {
        if (record.status === 'BOOKED' || record.status === 'PROCESSING') {
          return {
            success: true,
            booking: record,
            awb: record.awb,
          };
        }
      }
    }

    // 2. Validate Request Specifications
    const validation = BookingEngine.validateBooking(request);
    if (!validation.valid) {
      const nowStr = new Date().toLocaleString();
      const failedRecord: BookingRecord = {
        id: `book-${Date.now()}`,
        tenantId: request.tenantId || 'tenant-demo-01',
        orderId: request.orderId,
        shipmentId: request.shipmentId,
        rateQuoteId: request.rateQuoteId,
        courierId: request.courierId,
        courierCode: request.courierCode,
        courierName: request.courierCode.replace('_', ' '),
        serviceId: request.courierServiceId,
        serviceName: 'Standard Courier Service',
        idempotencyKey,
        bookingReference: `BK-FAIL-${Math.floor(1000 + Math.random() * 9000)}`,
        awbStatus: 'FAILED',
        status: 'FAILED',
        failureCode: 'INVALID_REQUEST',
        failureMessage: validation.errors.join('; '),
        totalCostMinor: request.invoiceValueMinor,
        paymentMode: request.paymentMode,
        originPincode: request.pickupAddress.pincode,
        destinationPincode: request.deliveryAddress.pincode,
        requestedAt: nowStr,
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      BOOKING_RECORDS_STORE.set(failedRecord.id, failedRecord);
      return { success: false, booking: failedRecord, error: validation.errors.join('; ') };
    }

    // 3. Dispatch to Courier Adapter via CourierAdapterFactory
    const nowStr = new Date().toLocaleString();
    const bookingId = `book-${Date.now()}`;
    const courierCode: CourierCode = request.courierCode || 'DELHIVERY';
    const adapter = CourierAdapterFactory.getAdapter(courierCode);

    try {
      const adapterBooking = await adapter.createShipment({
        shipmentId: request.shipmentId,
        orderId: request.orderId,
        destPincode: request.deliveryAddress.pincode,
      });

      const bookingRef = `BK-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      const successRecord: BookingRecord = {
        id: bookingId,
        tenantId: request.tenantId || 'tenant-demo-01',
        orderId: request.orderId,
        shipmentId: request.shipmentId,
        rateQuoteId: request.rateQuoteId,
        courierId: request.courierId,
        courierCode,
        courierName: courierCode.replace('_', ' '),
        serviceId: request.courierServiceId,
        serviceName: `${courierCode} Express Service`,
        idempotencyKey,
        bookingReference: bookingRef,
        providerReference: adapterBooking.awb,
        awb: adapterBooking.awb,
        awbStatus: 'ASSIGNED',
        status: 'BOOKED',
        totalCostMinor: request.invoiceValueMinor > 0 ? request.invoiceValueMinor : 12500,
        paymentMode: request.paymentMode,
        originPincode: request.pickupAddress.pincode,
        destinationPincode: request.deliveryAddress.pincode,
        requestedAt: nowStr,
        bookedAt: nowStr,
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      BOOKING_RECORDS_STORE.set(bookingId, successRecord);

      // Record Booking Attempt Log
      const attempt: BookingAttempt = {
        id: `att-${Date.now()}`,
        bookingId,
        attemptNumber: 1,
        status: 'BOOKED',
        requestId: `req-${Date.now()}`,
        providerReference: adapterBooking.awb,
        createdAt: nowStr,
      };
      BOOKING_ATTEMPTS_STORE.set(bookingId, [attempt]);

      return {
        success: true,
        booking: successRecord,
        awb: adapterBooking.awb,
      };
    } catch (err: any) {
      const failedRecord: BookingRecord = {
        id: bookingId,
        tenantId: request.tenantId || 'tenant-demo-01',
        orderId: request.orderId,
        shipmentId: request.shipmentId,
        rateQuoteId: request.rateQuoteId,
        courierId: request.courierId,
        courierCode,
        courierName: courierCode.replace('_', ' '),
        serviceId: request.courierServiceId,
        serviceName: 'Standard Courier Service',
        idempotencyKey,
        bookingReference: `BK-FAIL-${Math.floor(1000 + Math.random() * 9000)}`,
        awbStatus: 'FAILED',
        status: 'FAILED',
        failureCode: 'SERVICE_UNAVAILABLE',
        failureMessage: err?.message || 'Carrier provider API response failed',
        totalCostMinor: 0,
        paymentMode: request.paymentMode,
        originPincode: request.pickupAddress.pincode,
        destinationPincode: request.deliveryAddress.pincode,
        requestedAt: nowStr,
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      BOOKING_RECORDS_STORE.set(bookingId, failedRecord);
      return { success: false, booking: failedRecord, error: failedRecord.failureMessage };
    }
  },

  getBooking: (bookingId: string): BookingRecord | null => {
    return BOOKING_RECORDS_STORE.get(bookingId) || null;
  },

  getAllBookings: (tenantId: string = 'tenant-demo-01'): BookingRecord[] => {
    return Array.from(BOOKING_RECORDS_STORE.values()).filter(
      (b) => b.tenantId === tenantId || tenantId === 'all'
    );
  },

  getBookingAttempts: (bookingId: string): BookingAttempt[] => {
    return BOOKING_ATTEMPTS_STORE.get(bookingId) || [];
  },

  retryBooking: async (bookingId: string): Promise<{ success: boolean; booking: BookingRecord; awb?: string; error?: string }> => {
    const existing = BOOKING_RECORDS_STORE.get(bookingId);
    if (!existing) return { success: false, booking: null as any, error: 'Booking record not found' };

    if (existing.status === 'BOOKED') {
      return { success: true, booking: existing, awb: existing.awb };
    }

    const nowStr = new Date().toLocaleString();
    const newAwb = `${existing.courierCode}-RETRY-${Math.floor(100000 + Math.random() * 900000)}`;
    existing.status = 'BOOKED';
    existing.awb = newAwb;
    existing.awbStatus = 'ASSIGNED';
    existing.bookedAt = nowStr;
    existing.updatedAt = nowStr;
    existing.failureCode = undefined;
    existing.failureMessage = undefined;

    const attempts = BOOKING_ATTEMPTS_STORE.get(bookingId) || [];
    attempts.push({
      id: `att-${Date.now()}`,
      bookingId,
      attemptNumber: attempts.length + 1,
      status: 'BOOKED',
      requestId: `req-retry-${Date.now()}`,
      providerReference: newAwb,
      createdAt: nowStr,
    });
    BOOKING_ATTEMPTS_STORE.set(bookingId, attempts);

    return { success: true, booking: existing, awb: newAwb };
  },

  cancelBooking: async (bookingId: string): Promise<{ success: boolean; message: string }> => {
    const existing = BOOKING_RECORDS_STORE.get(bookingId);
    if (!existing) return { success: false, message: 'Booking record not found' };

    existing.status = 'CANCELLED';
    existing.updatedAt = new Date().toLocaleString();

    return { success: true, message: `Booking ${existing.bookingReference} cancelled successfully.` };
  },
};
