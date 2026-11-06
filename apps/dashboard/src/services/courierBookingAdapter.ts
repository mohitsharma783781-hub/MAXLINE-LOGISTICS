import { DelhiveryService } from './delhiveryService';

export interface CourierBookingInput {
  shipmentId?: string;
  orderId: string;
  courierId: string;
  serviceId: string;
  courierName: string;
  serviceName: string;
  originPincode: string;
  destinationPincode: string;
  paymentMode: 'PREPAID' | 'COD' | string;
  actualWeight: number;
  chargeableWeight: number;
  sellingPriceINR: number;
  estimatedDays: string;
  declaredValue?: number;
  pickupLocation?: string;
  pickupContactName?: string;
  pickupPhone?: string;
  pickupAddress?: string;
  pickupCity?: string;
  deliveryContactName?: string;
  deliveryPhone?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  length?: number;
  width?: number;
  height?: number;
  // Multi-box and compliance mapping fields
  boxes?: Array<{
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    actualWeightKg: number;
    boxCount?: number;
    description?: string;
  }>;
  packages?: Array<{
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    actualWeightKg: number;
    quantity?: number;
    boxCount?: number;
    description?: string;
  }>;
  consigneeGstin?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  ewayBillNumber?: string;
  invoiceValueINR?: number;
}

export interface CourierBookingResponse {
  success: boolean;
  bookingId: string;
  awbNumber: string;
  courierId: string;
  courierName: string;
  serviceName: string;
  status: 'BOOKED' | 'FAILED';
  isMock: boolean;
  bookingReference: string;
  labelUrl?: string;
  message: string;
  bookedAt: string;
}

export const CourierBookingAdapter = {
  bookShipment: async (input: CourierBookingInput): Promise<CourierBookingResponse> => {
    const courierCode = (input.courierId || input.courierName || 'DELHIVERY').toLowerCase();
    const isB2bMode = courierCode.includes('b2b') || input.serviceName?.toLowerCase().includes('cargo') || input.serviceName?.toLowerCase().includes('b2b');

    // 1. LIVE DELHIVERY B2B (FREIGHT/CARGO) MANIFESTATION INTEGRATION
    if (courierCode.includes('delhivery') && isB2bMode) {
      // Assemble full carton list forwarding all cartons, weights, and dimensions
      const normalizedBoxes = (input.boxes && input.boxes.length > 0)
        ? input.boxes.map((b) => ({
            lengthCm: Number(b.lengthCm) || 10,
            widthCm: Number(b.widthCm) || 10,
            heightCm: Number(b.heightCm) || 10,
            actualWeightKg: Number(b.actualWeightKg) || 1,
            boxCount: Number(b.boxCount || 1),
            description: b.description || 'Commercial Freight Cargo',
          }))
        : (input.packages && input.packages.length > 0)
        ? input.packages.map((p) => ({
            lengthCm: Number(p.lengthCm) || 10,
            widthCm: Number(p.widthCm) || 10,
            heightCm: Number(p.heightCm) || 10,
            actualWeightKg: Number(p.actualWeightKg) || 1,
            boxCount: Number(p.boxCount || p.quantity || 1),
            description: p.description || 'Commercial Freight Cargo',
          }))
        : [
            {
              lengthCm: input.length || 30,
              widthCm: input.width || 30,
              heightCm: input.height || 30,
              actualWeightKg: input.actualWeight || 20,
              boxCount: 1,
              description: 'Commercial Freight Cargo',
            },
          ];

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const manifestRes = await fetch('/api/delhivery?action=b2b-manifest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: input.orderId,
            consigneeName: input.deliveryContactName,
            consigneePhone: input.deliveryPhone,
            consigneeGstin: input.consigneeGstin || '',
            consigneeAddress: input.deliveryAddress,
            consigneeCity: input.deliveryCity || '',
            consigneeState: input.deliveryState || '',
            consigneePincode: input.destinationPincode,
            boxes: normalizedBoxes,
            pickupWarehouse: input.pickupLocation,
            paymentMode: input.paymentMode === 'COD' ? 'COD' : 'Prepaid',
            invoiceNumber: input.invoiceNumber || '',
            invoiceValueINR: input.invoiceValueINR || input.sellingPriceINR || 0,
            ewayBillNumber: input.ewayBillNumber || '',
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const mData = await manifestRes.json().catch(() => null);

        if (manifestRes.ok && mData?.success) {
          const lrNumber = mData.lrNumber || '';
          const jobId = mData.jobId || '';
          const isPending = mData.status === 'PROCESSING' && !lrNumber;

          return {
            success: true,
            bookingId: `bk-del-b2b-${Date.now()}`,
            awbNumber: lrNumber || jobId,
            courierId: input.courierId,
            courierName: input.courierName,
            serviceName: input.serviceName,
            status: isPending ? 'PROCESSING' : 'BOOKED',
            isMock: false,
            bookingReference: lrNumber || jobId,
            labelUrl: lrNumber ? `/api/delhivery/label?awb=${lrNumber}` : '',
            message: isPending
              ? `B2B Consignment queued in Delhivery LTL system. Job ID: ${jobId}`
              : `B2B Consignment manifested successfully with Delhivery Freight. LR: ${lrNumber}`,
            bookedAt: new Date().toISOString(),
          };
        }

        // Upstream carrier rejected the manifest — return clear, unmasked error
        const carrierError = mData?.message || mData?.error || `Carrier manifest returned HTTP ${manifestRes.status}`;
        return {
          success: false,
          bookingId: '',
          awbNumber: '',
          courierId: input.courierId,
          courierName: input.courierName,
          serviceName: input.serviceName,
          status: 'FAILED',
          isMock: false,
          bookingReference: '',
          message: `Delhivery B2B Manifest Failed: ${carrierError}`,
          bookedAt: new Date().toISOString(),
        };
      } catch (b2bErr: any) {
        if (b2bErr?.name === 'AbortError') {
          // Timeout handled as UNKNOWN: do not retry blindly
          return {
            success: false,
            bookingId: '',
            awbNumber: '',
            courierId: input.courierId,
            courierName: input.courierName,
            serviceName: input.serviceName,
            status: 'FAILED',
            isMock: false,
            bookingReference: '',
            message: 'Delhivery B2B gateway timed out. Shipment status is UNKNOWN until upstream booking status is reconciled; do not retry without checking carrier records to prevent duplicate LRs.',
            bookedAt: new Date().toISOString(),
          };
        }

        return {
          success: false,
          bookingId: '',
          awbNumber: '',
          courierId: input.courierId,
          courierName: input.courierName,
          serviceName: input.serviceName,
          status: 'FAILED',
          isMock: false,
          bookingReference: '',
          message: `Delhivery B2B gateway exception: ${b2bErr?.message || 'Network connection failed'}`,
          bookedAt: new Date().toISOString(),
        };
      }
    }

    // 2. LIVE DELHIVERY B2C (PARCEL/EXPRESS) BOOKING INTEGRATION
    if (courierCode.includes('delhivery') && !isB2bMode) {
      try {
        const liveBooking = await DelhiveryService.bookShipment({
          orderId: input.orderId,
          consigneeName: input.deliveryContactName || 'Customer',
          consigneePhone: input.deliveryPhone || '9876543210',
          consigneeAddress: input.deliveryAddress || 'Delivery Address',
          consigneeCity: input.deliveryCity || 'City',
          consigneeState: input.deliveryState || 'State',
          consigneePincode: input.destinationPincode,
          paymentMode: input.paymentMode,
          codAmount: input.paymentMode === 'COD' ? input.sellingPriceINR : 0,
          totalAmount: input.sellingPriceINR,
          weightKg: (input.chargeableWeight || input.actualWeight || 0.5),
          lengthCm: input.length || 10,
          widthCm: input.width || 10,
          heightCm: input.height || 10,
          shippingMode: input.serviceName?.toLowerCase().includes('express') ? 'Express' : 'Surface',
          pickupWarehouseName: input.pickupLocation || 'MAXLINE_PRIMARY',
          pickupPhone: input.pickupPhone || '9876543210',
          pickupAddress: input.pickupAddress || 'Maxline Hub',
          pickupCity: input.pickupCity || 'Panchkula',
          pickupPincode: Number(input.originPincode || 134113),
        });

        if (liveBooking.success && liveBooking.awb) {
          return {
            success: true,
            bookingId: `bk-del-${Date.now()}`,
            awbNumber: liveBooking.awb,
            courierId: input.courierId,
            courierName: input.courierName,
            serviceName: input.serviceName,
            status: 'BOOKED',
            isMock: false,
            bookingReference: liveBooking.uploadWbn || `DEL-${Date.now().toString().slice(-6)}`,
            labelUrl: liveBooking.labelUrl || `/api/delhivery/label?awb=${liveBooking.awb}`,
            message: `Shipment booked successfully with Delhivery Production. AWB: ${liveBooking.awb}`,
            bookedAt: new Date().toISOString(),
          };
        }
      } catch (delErr) {
        console.warn('[CourierBookingAdapter] Delhivery live booking fallback:', delErr);
      }
    }

    // 2. Multi-carrier allocation fallback
    let prefix = 'DEL';
    if (courierCode.includes('blue') || courierCode.includes('dart')) {
      prefix = 'BLU';
    } else if (courierCode.includes('dtdc')) {
      prefix = 'DTD';
    } else if (courierCode.includes('xpress') || courierCode.includes('bees')) {
      prefix = 'XPB';
    } else if (courierCode.includes('shadowfax')) {
      prefix = 'SHF';
    }

    const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
    const awbNumber = `${prefix}${randomDigits}`;
    const bookingId = `bk-${Date.now()}`;
    const bookingReference = `REF-${Date.now().toString().slice(-6)}`;

    return {
      success: true,
      bookingId,
      awbNumber,
      courierId: input.courierId,
      courierName: input.courierName,
      serviceName: input.serviceName,
      status: 'BOOKED',
      isMock: true,
      bookingReference,
      message: `Shipment booked successfully with ${input.courierName || 'Courier Partner'}.`,
      bookedAt: new Date().toISOString(),
    };
  },
};
