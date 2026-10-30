import { WalletService } from '../mocks/wallet.mock';
import type { WalletTransaction } from '../types/wallet';
import { SupabaseShipmentService } from './supabase/supabaseShipmentService';

export type InternalShipmentStatus =
  | 'DRAFT'
  | 'BOOKING_CONFIRMED'
  | 'PENDING_API'
  | 'API_PROCESSING'
  | 'API_FAILED'
  | 'AWB_ASSIGNED'
  | 'PICKUP_REQUESTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'NDR'
  | 'RTO_INITIATED'
  | 'RTO_IN_TRANSIT'
  | 'RTO_DELIVERED'
  | 'CANCELLED'
  | 'CANCEL_REQUESTED';

export interface ShipmentStatusHistoryItem extends Record<string, unknown> {
  id: string;
  shipmentId: string;
  oldStatus: InternalShipmentStatus;
  newStatus: InternalShipmentStatus;
  source: 'SYSTEM' | 'ADMIN' | 'COURIER_API' | 'WEBHOOK';
  timestamp: string;
  userOrAdmin: string;
  reason: string;
  providerEventId?: string;
}

export interface TrackingEvent extends Record<string, unknown> {
  statusKey: string;
  statusTitle: string;
  location: string;
  timestamp: string;
  description: string;
  completed: boolean;
}

export interface MultiPackageDetail {
  id: string;
  packageNumber: number;
  packageType?: string;
  actualWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  quantity: number;
  packageContents?: string;
}

export interface CustomerShipmentDetail extends Record<string, unknown> {
  id: string;
  shipmentId: string;
  tenantId: string;
  orderId: string;
  awbNumber: string | null;
  bookingDate: string;
  courierId: string;
  courierName: string;
  serviceName: string;
  mode: 'B2C' | 'B2B';
  pickupWarehouseId?: string;
  pickupContact: string;
  pickupPhone: string;
  pickupAddress: string;
  pickupCity: string;
  pickupPincode: string;
  deliveryContact: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPincode: string;
  actualWeightKg: number;
  chargeableWeightKg: number;
  dimensionsCm: string;
  invoiceValueINR: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  insuranceEnabled?: boolean;
  insuredValueINR?: number;
  packageType?: string;
  packages?: MultiPackageDetail[];
  paymentMode: 'PREPAID' | 'COD';
  codAmountINR?: number;
  baseFreightINR: number;
  fuelSurchargeINR: number;
  codFeeINR: number;
  totalCustomerChargeINR: number;
  courierCostINR?: number;
  grossMarginINR?: number;
  transactionId?: string;
  bookingStatus: InternalShipmentStatus;
  customerFacingStatus: string;
  trackingStatus: string;
  trackingTimeline: TrackingEvent[];
  statusHistory: ShipmentStatusHistoryItem[];
  labelUrl?: string;
}

export const INITIAL_CUSTOMER_SHIPMENTS: CustomerShipmentDetail[] = [];

const SHIPMENT_KEY = 'COURRIER3_SHIPMENT_STORE';

function loadShipmentsFromStorage(): CustomerShipmentDetail[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(SHIPMENT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return [...INITIAL_CUSTOMER_SHIPMENTS];
}

function saveShipmentsToStorage(store: CustomerShipmentDetail[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(SHIPMENT_KEY, JSON.stringify(store));
    }
  } catch {
    // Ignore storage errors
  }
}

let SHIPMENT_STORE = loadShipmentsFromStorage();
const PROCESSED_EVENT_HASHES = new Set<string>();

// Valid Transition Matrix Map
const ALLOWED_TRANSITIONS: Record<InternalShipmentStatus, InternalShipmentStatus[]> = {
  DRAFT: ['BOOKING_CONFIRMED', 'CANCELLED'],
  BOOKING_CONFIRMED: ['PENDING_API', 'CANCELLED'],
  PENDING_API: ['API_PROCESSING', 'API_FAILED', 'CANCELLED'],
  API_PROCESSING: ['AWB_ASSIGNED', 'API_FAILED', 'CANCELLED'],
  API_FAILED: ['PENDING_API', 'CANCELLED'],
  AWB_ASSIGNED: ['PICKUP_REQUESTED', 'CANCELLED'],
  PICKUP_REQUESTED: ['PICKED_UP', 'CANCEL_REQUESTED', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT', 'CANCEL_REQUESTED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'NDR'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'NDR'],
  DELIVERED: [],
  NDR: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'RTO_INITIATED'],
  RTO_INITIATED: ['RTO_IN_TRANSIT'],
  RTO_IN_TRANSIT: ['RTO_DELIVERED'],
  RTO_DELIVERED: [],
  CANCELLED: [],
  CANCEL_REQUESTED: ['CANCELLED', 'IN_TRANSIT'],
};

export const CustomerShipmentService = {
  // Map Internal Status to Simplified Customer-Facing Label
  getCustomerFacingStatus: (status: InternalShipmentStatus): string => {
    switch (status) {
      case 'DRAFT':
      case 'BOOKING_CONFIRMED':
        return 'Booking Confirmed';
      case 'PENDING_API':
      case 'API_PROCESSING':
      case 'API_FAILED':
        return 'AWB Pending';
      case 'AWB_ASSIGNED':
      case 'PICKUP_REQUESTED':
        return 'Pickup Requested';
      case 'PICKED_UP':
        return 'Picked Up';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'OUT_FOR_DELIVERY':
        return 'Out for Delivery';
      case 'DELIVERED':
        return 'Delivered';
      case 'NDR':
        return 'NDR';
      case 'RTO_INITIATED':
      case 'RTO_IN_TRANSIT':
      case 'RTO_DELIVERED':
        return 'RTO';
      case 'CANCELLED':
      case 'CANCEL_REQUESTED':
        return 'Cancelled';
      default:
        return 'In Transit';
    }
  },

  // Validate Controlled Transition Matrix
  validateStatusTransition: (
    currentStatus: InternalShipmentStatus,
    targetStatus: InternalShipmentStatus
  ): { valid: boolean; reason?: string } => {
    if (currentStatus === targetStatus) return { valid: true };
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (allowed.includes(targetStatus)) return { valid: true };
    return {
      valid: false,
      reason: `Invalid status transition from '${currentStatus}' to '${targetStatus}'.`,
    };
  },

  getShipments: (tenantId?: string, searchQuery = '', statusFilter = 'all'): CustomerShipmentDetail[] => {
    return CustomerShipmentService.queryShipments({
      tenantId,
      searchQuery,
      statusFilter,
    });
  },

  queryShipments: (params: {
    tenantId?: string;
    searchQuery?: string;
    dateRange?: 'all' | 'today' | 'yesterday' | 'last7' | 'last30';
    statusFilter?: string;
    typeFilter?: 'all' | 'B2B' | 'B2C';
    paymentModeFilter?: 'all' | 'PREPAID' | 'COD';
    courierFilter?: string;
  }): CustomerShipmentDetail[] => {
    const {
      tenantId = 'tenant-demo-01',
      searchQuery = '',
      statusFilter = 'all',
      typeFilter = 'all',
      paymentModeFilter = 'all',
      courierFilter = 'all',
    } = params;

    return SHIPMENT_STORE.filter((s) => {
      if (tenantId && tenantId !== 'all' && s.tenantId !== tenantId) return false;

      // Status Filter
      if (statusFilter !== 'all') {
        const st = s.bookingStatus as string;
        if (statusFilter === 'BOOKED' && st !== 'BOOKING_CONFIRMED' && st !== 'BOOKED' && st !== 'AWB_ASSIGNED') return false;
        else if (statusFilter === 'IN_TRANSIT' && st !== 'IN_TRANSIT' && st !== 'PICKED_UP' && st !== 'OUT_FOR_DELIVERY' && st !== 'PICKUP_REQUESTED') return false;
        else if (statusFilter === 'DELIVERED' && st !== 'DELIVERED') return false;
        else if (statusFilter === 'NDR' && st !== 'NDR') return false;
        else if (statusFilter === 'RTO' && !st.startsWith('RTO')) return false;
        else if (statusFilter === 'CANCELLED' && st !== 'CANCELLED') return false;
        else if (statusFilter !== 'BOOKED' && statusFilter !== 'IN_TRANSIT' && statusFilter !== 'DELIVERED' && statusFilter !== 'NDR' && statusFilter !== 'RTO' && statusFilter !== 'CANCELLED' && st !== statusFilter) return false;
      }

      // Type Filter
      if (typeFilter !== 'all' && s.mode !== typeFilter) return false;

      // Payment Mode Filter
      if (paymentModeFilter !== 'all' && s.paymentMode !== paymentModeFilter) return false;

      // Courier Filter
      if (courierFilter !== 'all' && s.courierId.toLowerCase() !== courierFilter.toLowerCase()) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = s.shipmentId.toLowerCase().includes(q);
        const matchAwb = s.awbNumber ? s.awbNumber.toLowerCase().includes(q) : false;
        const matchOrder = s.orderId.toLowerCase().includes(q);
        const matchRecipient = s.deliveryContact.toLowerCase().includes(q);
        const matchPhone = s.deliveryPhone.toLowerCase().includes(q);
        const matchPin = s.deliveryPincode.toLowerCase().includes(q);
        if (!matchId && !matchAwb && !matchOrder && !matchRecipient && !matchPhone && !matchPin) return false;
      }

      return true;
    });
  },

  getShipmentSummaryStats: (tenantId = 'tenant-demo-01') => {
    const list = SHIPMENT_STORE.filter((s) => s.tenantId === tenantId);
    let booked = 0;
    let inTransit = 0;
    let delivered = 0;
    let ndr = 0;
    let rto = 0;

    list.forEach((s) => {
      const st = s.bookingStatus as string;
      if (st === 'BOOKING_CONFIRMED' || st === 'BOOKED' || st === 'AWB_ASSIGNED') booked++;
      else if (st === 'IN_TRANSIT' || st === 'PICKED_UP' || st === 'OUT_FOR_DELIVERY' || st === 'PICKUP_REQUESTED') inTransit++;
      else if (st === 'DELIVERED') delivered++;
      else if (st === 'NDR') ndr++;
      else if (st.startsWith('RTO')) rto++;
    });

    return {
      total: list.length,
      booked,
      inTransit,
      delivered,
      ndr,
      rto,
    };
  },

  getShipmentById: (shipmentId: string, tenantId?: string): CustomerShipmentDetail | null => {
    if (!shipmentId) return null;
    const target = shipmentId.trim().toLowerCase();

    // Re-check storage to ensure fresh in-memory cache
    if (SHIPMENT_STORE.length === 0) {
      SHIPMENT_STORE = loadShipmentsFromStorage();
    }

    const matches = (s: CustomerShipmentDetail) =>
      s.id?.toLowerCase() === target ||
      s.shipmentId?.toLowerCase() === target ||
      s.awbNumber?.toLowerCase() === target ||
      s.orderId?.toLowerCase() === target;

    const isTenantMatch = (s: CustomerShipmentDetail) =>
      !tenantId || tenantId === 'all' || s.tenantId === tenantId;

    // 1. Try matching with strict tenantId boundary
    let found = SHIPMENT_STORE.find((s) => isTenantMatch(s) && matches(s));

    // 2. Fallback: reload from storage in case another tab saved it (still enforcing tenantId)
    if (!found) {
      const fresh = loadShipmentsFromStorage();
      found = fresh.find((s) => isTenantMatch(s) && matches(s));
      if (found) {
        SHIPMENT_STORE = fresh;
      }
    }

    return found || null;
  },

  // Admin Manual Status Update Engine
  updateStatus: (
    shipmentId: string,
    newStatus: InternalShipmentStatus,
    reason: string,
    source: 'SYSTEM' | 'ADMIN' | 'COURIER_API' | 'WEBHOOK' = 'ADMIN',
    userOrAdmin = 'Super Admin',
    providerEventId?: string
  ): { success: boolean; message: string; shipment?: CustomerShipmentDetail } => {
    const shipment = CustomerShipmentService.getShipmentById(shipmentId);
    if (!shipment) return { success: false, message: 'Shipment not found.' };

    // Duplicate event check
    if (providerEventId) {
      const eventHash = `${shipmentId}_${providerEventId}_${newStatus}`;
      if (PROCESSED_EVENT_HASHES.has(eventHash)) {
        return { success: true, message: 'Duplicate status update event ignored safely.', shipment };
      }
      PROCESSED_EVENT_HASHES.add(eventHash);
    }

    // Validate transition
    const val = CustomerShipmentService.validateStatusTransition(shipment.bookingStatus, newStatus);
    if (!val.valid && source !== 'ADMIN') {
      return { success: false, message: val.reason || 'Invalid status transition.' };
    }

    const oldStatus = shipment.bookingStatus;
    shipment.bookingStatus = newStatus;
    shipment.customerFacingStatus = CustomerShipmentService.getCustomerFacingStatus(newStatus);
    shipment.trackingStatus = newStatus;

    // Append to Audit History Log
    const historyItem: ShipmentStatusHistoryItem = {
      id: `hist-${Date.now()}`,
      shipmentId: shipment.shipmentId,
      oldStatus,
      newStatus,
      source,
      timestamp: new Date().toLocaleString(),
      userOrAdmin,
      reason,
      providerEventId,
    };
    shipment.statusHistory.unshift(historyItem);

    // Append to Tracking Timeline
    shipment.trackingTimeline.push({
      statusKey: newStatus,
      statusTitle: CustomerShipmentService.getCustomerFacingStatus(newStatus),
      location: 'Operational Hub',
      timestamp: new Date().toLocaleString(),
      description: reason,
      completed: true,
    });

    saveShipmentsToStorage(SHIPMENT_STORE);

    // Asynchronously synchronize status update with Supabase Cloud DB
    SupabaseShipmentService.updateShipmentStatus(
      shipment.shipmentId,
      newStatus,
      shipment.customerFacingStatus,
      reason,
      source,
      shipment.tenantId
    ).catch(() => {});

    return { success: true, message: `Status updated from ${oldStatus} to ${newStatus}.`, shipment };
  },

  cancelShipment: (
    shipmentId: string,
    reason = 'Merchant requested cancellation',
    tenantId = 'tenant-demo-01'
  ): { success: boolean; message: string; refundTx?: WalletTransaction | null; refundedAmountINR?: number } => {
    const shipment = CustomerShipmentService.getShipmentById(shipmentId, tenantId);
    if (!shipment) {
      return { success: false, message: 'Shipment record not found.' };
    }

    // Check if cancellation is allowed before pickup
    const cancellableStatuses: InternalShipmentStatus[] = ['BOOKING_CONFIRMED', 'PENDING_API', 'API_FAILED', 'AWB_ASSIGNED', 'PICKUP_REQUESTED'];
    if (!cancellableStatuses.includes(shipment.bookingStatus)) {
      return {
        success: false,
        message: `Cancellation is not available at this stage. Shipment is currently in '${shipment.customerFacingStatus}' status.`,
      };
    }

    // Update Status & History
    CustomerShipmentService.updateStatus(shipmentId, 'CANCELLED', `Cancelled by merchant: ${reason}`, 'SYSTEM', 'Merchant User');

    // Perform Wallet Refund
    const refundAmountINR = shipment.totalCustomerChargeINR;
    const targetTxId = shipment.transactionId || `tx-${shipment.shipmentId}`;
    const refundRes = WalletService.refund(targetTxId, refundAmountINR, reason);

    saveShipmentsToStorage(SHIPMENT_STORE);
    return {
      success: true,
      message: `Shipment ${shipment.shipmentId} cancelled successfully. ₹${refundAmountINR.toFixed(2)} refunded to your merchant wallet.`,
      refundedAmountINR: refundAmountINR,
      refundTx: refundRes.transaction,
    };
  },

  // Save new shipment record dynamically to store and sync with Supabase Cloud DB
  addShipmentRecord: (shipment: CustomerShipmentDetail): CustomerShipmentDetail => {
    SHIPMENT_STORE.unshift(shipment);
    saveShipmentsToStorage(SHIPMENT_STORE);

    // Asynchronously synchronize new shipment with Supabase Cloud DB
    SupabaseShipmentService.insertShipment(shipment).catch(() => {});

    return shipment;
  },

  // Synchronize latest shipments from Supabase PostgreSQL Cloud DB
  syncFromSupabase: async (tenantId = 'tenant-demo-01'): Promise<CustomerShipmentDetail[]> => {
    try {
      const cloudShipments = await SupabaseShipmentService.fetchShipments(tenantId);
      if (cloudShipments && cloudShipments.length > 0) {
        // Merge cloud shipments with local cache (cloud shipments take priority)
        const cloudMap = new Map<string, CustomerShipmentDetail>();
        cloudShipments.forEach((s) => {
          cloudMap.set(s.shipmentId, s);
        });

        // Retain any local shipments not yet on cloud
        const merged: CustomerShipmentDetail[] = [...cloudShipments];
        SHIPMENT_STORE.forEach((local) => {
          if (!cloudMap.has(local.shipmentId)) {
            merged.push(local);
          }
        });

        SHIPMENT_STORE = merged;
        saveShipmentsToStorage(SHIPMENT_STORE);
      }
    } catch (err: any) {
      console.warn('[CustomerShipmentService] Supabase sync warning:', err?.message);
    }
    return CustomerShipmentService.getShipments(tenantId);
  },
};
