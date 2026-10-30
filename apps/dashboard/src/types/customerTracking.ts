export interface TrackingBrandConfig extends Record<string, unknown> {
  tenantId: string;
  brandName: string;
  logoUrl: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  supportEmail: string;
  supportPhone: string;
  supportUrl: string;
  trackingPageTitle: string;
  showCourierName: boolean;
  showEstimatedDelivery: boolean;
  showSupportContact: boolean;
  customFooterText: string;
}

export interface CustomerVisibleTrackingEvent {
  status: string;
  title: string;
  description: string;
  eventTime: string;
  location: string;
}

export interface TrackingTokenService {
  generateToken: (shipmentId: string) => string;
  verifyToken: (token: string) => { valid: boolean; shipmentId?: string; tenantId?: string };
}

export const DEFAULT_BRAND_CONFIG: TrackingBrandConfig = {
  tenantId: 'tenant-demo-01',
  brandName: 'Apex Shipping SaaS',
  logoUrl: 'https://demo.shipping-saas.com/assets/demo-brand-logo.png',
  primaryColor: '#7c3aed',
  secondaryColor: '#4c1d95',
  supportEmail: 'support@apexshipping.com',
  supportPhone: '+91 1800 123 4567',
  supportUrl: 'https://apexshipping.com/support',
  trackingPageTitle: 'Track Your Parcel',
  showCourierName: true,
  showEstimatedDelivery: true,
  showSupportContact: true,
  customFooterText: 'Powered by Apex Shipping Aggregation Platform',
};
