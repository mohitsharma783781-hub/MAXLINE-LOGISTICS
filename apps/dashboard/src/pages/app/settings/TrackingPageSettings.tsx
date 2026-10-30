import React, { useState } from 'react';
import {
  Save,
  RotateCcw,
  Palette,
  Image as ImageIcon,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import {
  Button,
  Card,
  Input,
  Alert,
  ConfirmationDialog,
  Switch,
  Badge,
} from '../../../components/ui';
import { BrandingService, type MerchantBrandingConfig } from '../../../services/brandingService';

export const TrackingPageSettings: React.FC = () => {
  const tenantId = 'tenant-demo-01';

  const [branding, setBranding] = useState<MerchantBrandingConfig>(() =>
    BrandingService.getBranding(tenantId)
  );

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Field change handler
  const handleChange = (field: keyof MerchantBrandingConfig, value: any) => {
    setBranding((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Banner change handler
  const handleBannerChange = (field: string, value: any) => {
    setBranding((prev) => ({
      ...prev,
      promotionalBanner: {
        ...prev.promotionalBanner,
        [field]: value,
      },
    }));
  };

  // Save Branding
  const handleSave = () => {
    const updated = BrandingService.updateBranding(tenantId, branding, 'Acme Merchant Admin');
    setBranding({ ...updated });
    setToastMsg('Branding & tracking page settings saved successfully!');
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Reset to Defaults
  const handleConfirmReset = () => {
    const res = BrandingService.updateBranding(
      tenantId,
      {
        brandName: 'Acme Electronics Store',
        logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200',
        primaryColor: '#7c3aed',
        secondaryColor: '#0f172a',
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
        },
      },
      'Acme Merchant Admin'
    );

    setBranding({ ...res });
    setIsResetDialogOpen(false);
  };

  // Contrast check
  const contrastInfo = BrandingService.checkColorContrast(branding.primaryColor);

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Settings', path: '/app/settings' },
    { label: 'Branded Tracking Page', path: '/app/settings/tracking-page' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Branded Buyer Tracking Page & Experience Engine"
        description="Configure your store's post-purchase brand identity, custom colors, support contact info, and promotional marketing banners."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" size="sm" onClick={() => setIsResetDialogOpen(true)}>
              <RotateCcw size={14} style={{ marginRight: '6px' }} /> Reset Defaults
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              <Save size={14} style={{ marginRight: '6px' }} /> Save Branding
            </Button>
          </div>
        }
      />

      {toastMsg && (
        <Alert variant="success" title="Settings Saved">
          {toastMsg}
        </Alert>
      )}

      {/* Main Two-Column Layout: Customizer Form + Live Buyer Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* LEFT COLUMN: CUSTOMIZER FORM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Brand Identity Card */}
          <Card style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-violet-main)' }}>
              <Sparkles size={18} /> Store Brand Identity & Logo
            </h3>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
                Store / Brand Name *
              </label>
              <Input
                placeholder="e.g. ABC Electronics"
                value={branding.brandName}
                onChange={(e) => handleChange('brandName', e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
                Store Logo Image URL (PNG, JPG, SVG) *
              </label>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <Input
                  placeholder="https://yourstore.com/assets/logo.png"
                  value={branding.logoUrl}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  style={{ flex: 1 }}
                />
                <img
                  src={branding.logoUrl}
                  alt="Logo Preview"
                  style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-main)', padding: '2px', backgroundColor: '#ffffff' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=200';
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
                  Support Email
                </label>
                <Input
                  placeholder="support@yourstore.com"
                  value={branding.supportEmail}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
                  Support Helpline Phone
                </label>
                <Input
                  placeholder="+91 98765 43210"
                  value={branding.supportPhone}
                  onChange={(e) => handleChange('supportPhone', e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Color Palette Card */}
          <Card style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Palette size={18} /> Brand Theme Colors
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
                  Primary Accent Color (Hex)
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    style={{ width: '38px', height: '38px', padding: 0, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                  />
                  <Input
                    value={branding.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
                  Secondary Dark Color (Hex)
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={branding.secondaryColor}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    style={{ width: '38px', height: '38px', padding: 0, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                  />
                  <Input
                    value={branding.secondaryColor}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>

            {/* Accessibility & Contrast Checker Box */}
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: branding.primaryColor, color: contrastInfo.textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '11px' }}>
                Aa
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block' }}>WCAG Accessibility Contrast Check</strong>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                  Primary color luminance check: <strong>{contrastInfo.isLight ? 'Light Background (Dark Text)' : 'Dark Background (White Text)'}</strong> — Optimal for mobile buyer readability.
                </span>
              </div>
            </div>
          </Card>

          {/* Promotional Marketing Banner Builder */}
          <Card style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <ImageIcon size={18} /> Post-Purchase Promotional Marketing Banner
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: '12px', fontWeight: '500' }}>Active Banner:</span>
                <Switch
                  checked={branding.promotionalBanner.enabled && !branding.promotionalBanner.disabledByAdmin}
                  onChange={(checked) => handleBannerChange('enabled', checked)}
                  disabled={branding.promotionalBanner.disabledByAdmin}
                />
              </div>
            </div>

            {branding.promotionalBanner.disabledByAdmin && (
              <Alert variant="danger" title="Banner Disabled by Platform Admin">
                This banner was disabled by Super Admin moderation. Reason: {branding.promotionalBanner.adminDisableReason || 'Violated content guidelines.'}
              </Alert>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
                Banner Image URL *
              </label>
              <Input
                placeholder="https://yourstore.com/banners/summer-sale.jpg"
                value={branding.promotionalBanner.imageUrl}
                onChange={(e) => handleBannerChange('imageUrl', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
                  Banner Headline *
                </label>
                <Input
                  placeholder="e.g. Summer Festive Offer — Flat 40% Off!"
                  value={branding.promotionalBanner.headline}
                  onChange={(e) => handleBannerChange('headline', e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
                  CTA Button Text *
                </label>
                <Input
                  placeholder="e.g. Shop Electronics Now"
                  value={branding.promotionalBanner.ctaText}
                  onChange={(e) => handleBannerChange('ctaText', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
                Banner Description Text
              </label>
              <Input
                placeholder="Short offer details..."
                value={branding.promotionalBanner.description}
                onChange={(e) => handleBannerChange('description', e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-1)' }}>
                CTA Link Destination URL *
              </label>
              <Input
                placeholder="https://yourstore.com/sale"
                value={branding.promotionalBanner.ctaUrl}
                onChange={(e) => handleBannerChange('ctaUrl', e.target.value)}
              />
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: LIVE INTERACTIVE BUYER MOBILE PREVIEW */}
        <div style={{ position: 'sticky', top: '20px' }}>
          <Card style={{ padding: 'var(--space-4)', backgroundColor: '#0f172a', color: '#ffffff', borderRadius: '24px', boxShadow: 'var(--shadow-xl)', border: '2px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                <Smartphone size={16} /> Live Buyer Smartphone View
              </span>
              <Badge variant="brand" style={{ fontSize: '10px' }}>
                LIVE PREVIEW
              </Badge>
            </div>

            {/* Smartphone Inner Mock Container */}
            <div style={{ backgroundColor: '#f8fafc', color: '#0f172a', borderRadius: '16px', padding: '16px', minHeight: '520px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid #cbd5e1' }}>
              {/* Header with Merchant Logo */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={branding.logoUrl}
                    alt="Logo"
                    style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '4px' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=200'; }}
                  />
                  <strong style={{ fontSize: '13px', color: branding.secondaryColor }}>{branding.brandName}</strong>
                </div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Order #9041</span>
              </div>

              {/* Status Header Pill */}
              <div style={{ backgroundColor: branding.primaryColor, color: contrastInfo.textColor, padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.9 }}>Parcel Tracking Status</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '2px' }}>Out for Doorstep Delivery</div>
                <div style={{ fontSize: '11px', marginTop: '2px', opacity: '0.9' }}>AWB: DEL847192031 • Delhivery Surface</div>
              </div>

              {/* Visual Timeline Bar */}
              <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontWeight: 'bold', marginBottom: '8px' }}>
                  <span>Confirmed ✓</span>
                  <span>Dispatched ✓</span>
                  <span style={{ color: branding.primaryColor }}>Out for Delivery ●</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '80%', height: '100%', backgroundColor: branding.primaryColor, borderRadius: '4px' }} />
                </div>
              </div>

              {/* Promotional Marketing Banner Preview */}
              {branding.promotionalBanner.enabled && !branding.promotionalBanner.disabledByAdmin && (
                <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                  <img
                    src={branding.promotionalBanner.imageUrl}
                    alt="Banner"
                    style={{ width: '100%', height: '80px', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800'; }}
                  />
                  <div style={{ padding: '10px', textAlign: 'center' }}>
                    <strong style={{ fontSize: '11px', display: 'block', color: '#0f172a' }}>{branding.promotionalBanner.headline}</strong>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block', margin: '2px 0 6px 0' }}>{branding.promotionalBanner.description}</span>
                    <button style={{ backgroundColor: branding.primaryColor, color: contrastInfo.textColor, border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                      {branding.promotionalBanner.ctaText} →
                    </button>
                  </div>
                </div>
              )}

              {/* Support Contact Footer */}
              <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '10px', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                <div>Need help? Email {branding.supportEmail}</div>
                <div style={{ fontSize: '9px', marginTop: '2px', color: '#94a3b8' }}>
                  Powered by Courrier3 Post-Purchase Engine
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* RESET CONFIRMATION DIALOG */}
      <ConfirmationDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Tracking Page Branding?"
        description="Are you sure you want to reset your logo, colors, and promotional banner to platform default settings?"
        confirmLabel="Reset to Defaults"
        variant="danger"
      />
    </div>
  );
};
