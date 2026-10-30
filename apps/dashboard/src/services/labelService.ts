import type {
  LabelDocument,
  LabelDataPayload,
  LabelFormat,
  LabelTemplate,
} from '../types/labels';
import { CustomerShipmentService } from './customerShipmentService';
import { BookingEngine } from './bookingEngine';

const LABELS_STORE: Map<string, LabelDocument> = new Map();

// PRE-POPULATE INITIAL DEMO LABEL
const INITIAL_LABEL: LabelDocument = {
  id: 'lbl-9840192',
  tenantId: 'tenant-demo-01',
  shipmentId: 'SHP-9840192',
  bookingId: 'book-9840192',
  awb: 'DELHIVERY-849201',
  format: 'THERMAL_4X6',
  template: 'DEFAULT_4X6',
  status: 'GENERATED',
  fileReference: 'https://demo.shipping-saas.com/labels/DELHIVERY-849201.pdf',
  generatedAt: '2026-08-20 16:31 PM',
  createdAt: '2026-08-20 16:31 PM',
  updatedAt: '2026-08-20 16:31 PM',
};

LABELS_STORE.set(INITIAL_LABEL.shipmentId, INITIAL_LABEL);

export const LabelService = {
  // Generate Shipping Label for a booked shipment
  generateLabel: async (
    shipmentId: string,
    format: LabelFormat = 'THERMAL_4X6'
  ): Promise<LabelDocument> => {
    const shipment = CustomerShipmentService.getShipmentById(shipmentId);
    const booking = BookingEngine.getBooking(shipmentId);

    const awb = shipment?.awbNumber || booking?.awb || 'DELHIVERY-849201';
    const tenantId = shipment?.tenantId || booking?.tenantId || 'tenant-demo-01';

    const existing = LABELS_STORE.get(shipmentId);
    if (existing && existing.status === 'GENERATED' && existing.format === format) {
      return existing;
    }

    const template: LabelTemplate = format === 'THERMAL_4X6' ? 'DEFAULT_4X6' : 'DEFAULT_A4';
    const nowStr = new Date().toLocaleString();
    const labelId = `lbl-${Date.now()}`;

    const doc: LabelDocument = {
      id: labelId,
      tenantId,
      shipmentId,
      bookingId: booking?.id || `book-${shipmentId}`,
      awb,
      format,
      template,
      status: 'GENERATED',
      fileReference: `https://demo.shipping-saas.com/labels/${awb}.pdf`,
      generatedAt: nowStr,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    LABELS_STORE.set(shipmentId, doc);
    return doc;
  },

  getLabel: (shipmentIdOrLabelId: string): LabelDocument | null => {
    const direct = LABELS_STORE.get(shipmentIdOrLabelId);
    if (direct) return direct;
    for (const doc of Array.from(LABELS_STORE.values())) {
      if (doc.id === shipmentIdOrLabelId || doc.awb === shipmentIdOrLabelId) return doc;
    }
    return INITIAL_LABEL;
  },

  regenerateLabel: async (
    shipmentId: string,
    format: LabelFormat = 'THERMAL_4X6'
  ): Promise<LabelDocument> => {
    LABELS_STORE.delete(shipmentId);
    return LabelService.generateLabel(shipmentId, format);
  },

  // Assemble Normalized Data Payload for Single or Multi-Package Label Renderer
  getLabelData: (shipmentId: string, packageIndex = 1): LabelDataPayload => {
    const shipment = CustomerShipmentService.getShipmentById(shipmentId);
    const booking = BookingEngine.getBooking(shipmentId);

    const awb = shipment?.awbNumber || booking?.awb || 'DELHIVERY-849201';
    const courierName = shipment?.courierName || booking?.courierName || 'Delhivery Surface';
    const serviceName = shipment?.serviceName || booking?.serviceName || 'Express Surface Cargo';
    const senderName = shipment?.pickupContact || 'Acme Logistics Hub';
    const senderAddress = shipment ? `${shipment.pickupAddress}, ${shipment.pickupCity} - ${shipment.pickupPincode}` : 'Connaught Place, New Delhi - 110001';
    const senderPhone = shipment?.pickupPhone || '+91 98765 43210';
    const recipientName = shipment?.deliveryContact || 'Rohan Sharma';
    const recipientAddress = shipment ? `${shipment.deliveryAddress}, ${shipment.deliveryCity} - ${shipment.deliveryPincode}` : 'Indiranagar, Bengaluru - 560038';
    const recipientPhone = shipment?.deliveryPhone || '+91 98112 34567';
    const shipmentType = (shipment?.mode || 'B2C') as 'B2C' | 'B2B';
    const paymentMode = (shipment?.paymentMode || 'PREPAID') as 'PREPAID' | 'COD';
    const codAmount = shipment?.codAmountINR || 0;
    const invoiceValue = shipment?.invoiceValueINR || 1500;
    const packagesList = shipment?.packages || [];
    const packageCount = packagesList.length > 0 ? packagesList.length : 1;

    const currentPkg = packagesList[packageIndex - 1];
    const actualWeightKg = currentPkg ? currentPkg.actualWeightKg : shipment?.actualWeightKg || 1.5;
    const chargeableWeightKg = currentPkg ? currentPkg.chargeableWeightKg : shipment?.chargeableWeightKg || 1.5;

    return {
      awb,
      courierName,
      courierCode: 'DELHIVERY',
      serviceName,
      senderName,
      senderAddress,
      senderPhone,
      recipientName,
      recipientAddress,
      recipientPhone,
      shipmentType,
      paymentMode,
      codAmount,
      invoiceValue,
      packageCount,
      packageIndex,
      actualWeightKg,
      chargeableWeightKg,
      orderRef: shipment?.orderId || booking?.orderId || 'ORD-9840192',
      shipmentRef: shipmentId || 'SHP-9840192',
      trackingRef: awb,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://track.courrier.com/${awb}`,
      brandLogoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120',
      brandName: 'Skyonship Express',
    };
  },

  // Get full array of Label Data Payloads for multi-package shipments
  getMultiPackageLabelData: (shipmentId: string): LabelDataPayload[] => {
    const shipment = CustomerShipmentService.getShipmentById(shipmentId);
    const count = shipment?.packages && shipment.packages.length > 0 ? shipment.packages.length : 1;
    const list: LabelDataPayload[] = [];
    for (let i = 1; i <= count; i++) {
      list.push(LabelService.getLabelData(shipmentId, i));
    }
    return list;
  },
};
