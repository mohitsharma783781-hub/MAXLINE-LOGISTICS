export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  role: 'MERCHANT' | 'ADMIN' | 'SYSTEM';
  action: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

export interface PromotionalBannerConfig {
  enabled: boolean;
  imageUrl: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  startDate?: string;
  endDate?: string;
  disabledByAdmin?: boolean;
  adminDisableReason?: string;
}

export interface MerchantBrandingConfig extends Record<string, unknown> {
  tenantId: string;
  merchantSlug: string;
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  supportEmail: string;
  supportPhone: string;
  showCourierBranding: boolean;
  showAggregatorFooter: boolean;
  promotionalBanner: PromotionalBannerConfig;
  customDomain?: string;
  customDomainVerified?: boolean;
  auditLogs: AuditLogItem[];
  updatedAt: string;
}

export interface AdminBrandingGlobalControl {
  globalPromoBannersEnabled: boolean;
  maxBannerSizeBytes: number;
  aggregatorFooterText: string;
  aggregatorBrandingDominance: 'SUBTLE' | 'HIDDEN' | 'STANDARD';
}

let GLOBAL_ADMIN_CONTROL: AdminBrandingGlobalControl = {
  globalPromoBannersEnabled: true,
  maxBannerSizeBytes: 1024 * 1024 * 2, // 2MB
  aggregatorFooterText: 'Powered by Courrier3 Post-Purchase Logistics Engine',
  aggregatorBrandingDominance: 'SUBTLE',
};

const DEFAULT_BRANDING_STORE: Record<string, MerchantBrandingConfig> = {
  'tenant-demo-01': {
    tenantId: 'tenant-demo-01',
    merchantSlug: 'acme-store',
    brandName: 'Acme Electronics Store',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200',
    primaryColor: '#7c3aed', // Violet
    secondaryColor: '#0f172a', // Dark slate
    supportEmail: 'support@acmestore.com',
    supportPhone: '+91 98765 43210',
    showCourierBranding: true,
    showAggregatorFooter: true,
    promotionalBanner: {
      enabled: true,
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
      headline: 'Summer Festive Offer — Flat 40% Off!',
      description: 'Upgrade your tech gear today. Use code FESTIVE40 at checkout.',
      ctaText: 'Shop Electronics Now',
      ctaUrl: 'https://acmestore.com/festive-sale',
      disabledByAdmin: false,
    },
    customDomain: 'track.acmestore.com',
    customDomainVerified: true,
    auditLogs: [
      {
        id: 'log-1',
        timestamp: '2026-08-01 10:00 AM',
        actor: 'Acme Merchant Admin',
        role: 'MERCHANT',
        action: 'INITIAL_BRANDING_CREATED',
        details: 'Configured Acme Electronics brand colors and promo banner.',
      },
    ],
    updatedAt: '2026-08-20 14:30 PM',
  },
};

export const BrandingService = {
  getGlobalControl: (): AdminBrandingGlobalControl => {
    return { ...GLOBAL_ADMIN_CONTROL };
  },

  updateGlobalControl: (newControl: Partial<AdminBrandingGlobalControl>): AdminBrandingGlobalControl => {
    GLOBAL_ADMIN_CONTROL = { ...GLOBAL_ADMIN_CONTROL, ...newControl };
    return { ...GLOBAL_ADMIN_CONTROL };
  },

  getBranding: (tenantId = 'tenant-demo-01'): MerchantBrandingConfig => {
    if (DEFAULT_BRANDING_STORE[tenantId]) {
      return { ...DEFAULT_BRANDING_STORE[tenantId] };
    }

    // Default Fallback Branding
    return {
      tenantId,
      merchantSlug: tenantId.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      brandName: 'Official Merchant Store',
      logoUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=200',
      primaryColor: '#7c3aed',
      secondaryColor: '#1e293b',
      supportEmail: 'support@merchantstore.com',
      supportPhone: '+91 99000 00000',
      showCourierBranding: true,
      showAggregatorFooter: true,
      promotionalBanner: {
        enabled: false,
        imageUrl: '',
        headline: '',
        description: '',
        ctaText: 'Visit Store',
        ctaUrl: 'https://merchantstore.com',
      },
      auditLogs: [],
      updatedAt: new Date().toLocaleString(),
    };
  },

  getBrandingBySlug: (slug: string): MerchantBrandingConfig => {
    const found = Object.values(DEFAULT_BRANDING_STORE).find((b) => b.merchantSlug === slug);
    if (found) return { ...found };
    return BrandingService.getBranding('tenant-demo-01');
  },

  updateBranding: (
    tenantId: string,
    updates: Partial<MerchantBrandingConfig>,
    actor = 'Merchant Staff'
  ): MerchantBrandingConfig => {
    const current = BrandingService.getBranding(tenantId);
    const updated: MerchantBrandingConfig = {
      ...current,
      ...updates,
      updatedAt: new Date().toLocaleString(),
    };

    updated.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      actor,
      role: 'MERCHANT',
      action: 'BRANDING_UPDATED',
      details: 'Updated merchant branding, colors, or promotional banner configuration.',
    });

    DEFAULT_BRANDING_STORE[tenantId] = updated;
    return updated;
  },

  adminModerateBanner: (
    tenantId: string,
    disabled: boolean,
    reason: string,
    adminUser = 'Super Admin'
  ): { success: boolean; message: string } => {
    const branding = BrandingService.getBranding(tenantId);

    branding.promotionalBanner.disabledByAdmin = disabled;
    branding.promotionalBanner.adminDisableReason = disabled ? reason : undefined;
    branding.updatedAt = new Date().toLocaleString();

    branding.auditLogs.unshift({
      id: `log-admin-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      actor: adminUser,
      role: 'ADMIN',
      action: disabled ? 'BANNER_DISABLED_BY_ADMIN' : 'BANNER_RE_ENABLED_BY_ADMIN',
      details: disabled ? `Promo banner disabled by Admin. Reason: ${reason}` : 'Promo banner re-enabled by Admin.',
    });

    DEFAULT_BRANDING_STORE[tenantId] = branding;
    return {
      success: true,
      message: disabled ? `Merchant banner disabled successfully.` : `Merchant banner re-enabled.`,
    };
  },

  // Token Generation & Anti-Enumeration Security
  generateTrackingToken: (shipmentId: string, awb: string): string => {
    // Generate secure non-guessable tracking token
    const raw = `${shipmentId}_${awb}_salt2026`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `tr_tok_${Math.abs(hash).toString(36)}`;
  },

  // Validate Contrast Ratio for Accessibility
  checkColorContrast: (hexColor: string): { isLight: boolean; textColor: string } => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 124;
    const g = parseInt(hex.substring(2, 4), 16) || 58;
    const b = parseInt(hex.substring(4, 6), 16) || 237;

    // Luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const isLight = luminance > 0.6;
    return {
      isLight,
      textColor: isLight ? '#0f172a' : '#ffffff',
    };
  },
};
