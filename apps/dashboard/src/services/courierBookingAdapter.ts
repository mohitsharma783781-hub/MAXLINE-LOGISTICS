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
    // Generate realistic courier carrier AWB numbers based on the real courier partner
    const courierCode = (input.courierId || 'DELHIVERY').toLowerCase();
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
