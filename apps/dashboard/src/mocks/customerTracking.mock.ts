import type {
  TrackingBrandConfig,
  CustomerVisibleTrackingEvent,
  TrackingTokenService,
} from '../types/customerTracking';
import { DEFAULT_BRAND_CONFIG } from '../types/customerTracking';
import type { TrackingEvent } from '../types/tracking';

// In-Memory Brand Config Store
let BRAND_CONFIG_STORE: TrackingBrandConfig = { ...DEFAULT_BRAND_CONFIG };

export const demoCustomerTrackingProvider = {
  getBrandConfig: (_tenantId?: string): TrackingBrandConfig => {
    return { ...BRAND_CONFIG_STORE };
  },

  updateBrandConfig: (input: Partial<TrackingBrandConfig>): TrackingBrandConfig => {
    BRAND_CONFIG_STORE = {
      ...BRAND_CONFIG_STORE,
      ...input,
    };
    return { ...BRAND_CONFIG_STORE };
  },

  resetBrandConfig: (): TrackingBrandConfig => {
    BRAND_CONFIG_STORE = { ...DEFAULT_BRAND_CONFIG };
    return { ...BRAND_CONFIG_STORE };
  },

  filterCustomerVisibleEvents: (events: TrackingEvent[]): CustomerVisibleTrackingEvent[] => {
    if (!events || events.length === 0) return [];

    return events.map((e) => {
      let title = e.eventTitle || e.status || 'Event Update';
      let description = e.description;

      // Sanitize internal NDR/RTO codes for public customer view
      if (e.eventCode === 'DELIVERY_ATTEMPT_FAILED' || e.eventCode === 'NDR_CREATED') {
        title = 'Delivery Attempt Unsuccessful';
        description = 'Customer was unavailable during delivery attempt. Next action is being scheduled.';
      } else if (e.eventCode === 'RTO_INITIATED') {
        title = 'Shipment Returning to Sender';
        description = 'Parcel is being returned to the seller origin warehouse.';
      } else if (e.eventCode === 'RTO_IN_TRANSIT') {
        title = 'Return Parcel In Transit';
        description = 'Parcel is in transit back to the seller origin warehouse.';
      } else if (e.eventCode === 'RTO_DELIVERED') {
        title = 'Return Delivered';
        description = 'Parcel has been delivered back to the origin warehouse.';
      } else if (e.eventCode === 'SHIPMENT_CANCELLED') {
        title = 'Shipment Cancelled';
        description = 'Shipment has been cancelled.';
      }

      return {
        status: e.status,
        title: title || 'Event Update',
        description,
        eventTime: e.eventTime,
        location: e.location || 'Hub',
      };
    });
  },
};

// Architecture Stub for Tracking Token Authentication
export const mockTokenService: TrackingTokenService = {
  generateToken: (shipmentId: string) => `token-preview-${shipmentId}`,
  verifyToken: (token: string) => {
    if (token.startsWith('token-preview-')) {
      const shipmentId = token.replace('token-preview-', '');
      return { valid: true, shipmentId, tenantId: 'tenant-demo-01' };
    }
    return { valid: false };
  },
};
