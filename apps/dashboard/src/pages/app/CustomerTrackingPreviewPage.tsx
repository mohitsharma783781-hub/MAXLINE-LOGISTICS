import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Input,
  Alert,
  Select,
} from '../../components/ui';
import { demoCustomerTrackingProvider } from '../../mocks/customerTracking.mock';
import { demoTrackingProvider } from '../../mocks/tracking.mock';
import type { TrackingStatus } from '../../types/tracking';

export const CustomerTrackingPreviewPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || 'DEMO-AWB-98401928';

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [previewState, setPreviewState] = useState<TrackingStatus | 'AUTO'>('AUTO');
  const brandConfig = demoCustomerTrackingProvider.getBrandConfig();

  const trackingSummary = demoTrackingProvider.getTrackingBySearch(searchInput);

  const handleSearch = () => {
    if (!searchInput.trim()) return;
    setSearchParams({ query: searchInput });
  };

  const visibleEvents = trackingSummary
    ? demoCustomerTrackingProvider.filterCustomerVisibleEvents(trackingSummary.events)
    : [];

  const currentStatus = previewState !== 'AUTO' ? previewState : trackingSummary?.currentStatus || 'IN_TRANSIT';

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Tracking', path: '/app/tracking' },
    { label: 'Customer Tracking Preview', path: '/app/tracking-preview' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Internal Preview Mode Warning Banner */}
      <Alert variant="warning" title="PREVIEW MODE ONLY">
        This is an internal merchant preview of the customer tracking experience. No public unauthenticated links or raw database IDs are exposed.
      </Alert>

      {/* Page Header */}
      <PageHeader
        title="Customer Tracking Page Preview"
        description="Test how your buyers will view parcel delivery progress, brand colors, estimated delivery and support contact."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <Select
              value={previewState}
              onChange={(e) => setPreviewState(e.target.value as any)}
              options={[
                { value: 'AUTO', label: 'State: From AWB Data' },
                { value: 'IN_TRANSIT', label: 'Preview State: In Transit' },
                { value: 'OUT_FOR_DELIVERY', label: 'Preview State: Out for Delivery' },
                { value: 'DELIVERED', label: 'Preview State: Delivered' },
                { value: 'NDR', label: 'Preview State: Unsuccessful Attempt' },
                { value: 'RTO_INITIATED', label: 'Preview State: Returning to Sender' },
                { value: 'CANCELLED', label: 'Preview State: Cancelled' },
              ]}
              style={{ width: '220px' }}
            />
          </div>
        }
      />

      {/* CUSTOMER-FACING TRACKING CONTAINER */}
      <div
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
        }}
      >
        {/* BRAND HEADER BAR */}
        <Card
          style={{
            padding: 'var(--space-6)',
            textAlign: 'center',
            borderTop: `4px solid ${brandConfig.primaryColor}`,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {brandConfig.logoUrl ? (
            <img
              src={brandConfig.logoUrl}
              alt={brandConfig.brandName}
              style={{ height: '42px', objectFit: 'contain', margin: '0 auto var(--space-3)' }}
              onError={(e) => {
                // Fallback to text initials on logo error
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : null}

          <h2 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'bold', color: brandConfig.secondaryColor }}>
            {brandConfig.brandName}
          </h2>
          <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {brandConfig.trackingPageTitle}
          </p>
        </Card>

        {/* SEARCH BOX */}
        <Card style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <div style={{ flex: 1 }}>
              <Input
                placeholder="Enter AWB or Tracking Number..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button
              style={{ backgroundColor: brandConfig.primaryColor, borderColor: brandConfig.primaryColor }}
              onClick={handleSearch}
            >
              Track
            </Button>
          </div>
        </Card>

        {/* TRACKING STATUS & SUMMARY CARD */}
        {trackingSummary ? (
          <>
            <Card style={{ padding: 'var(--space-6)' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-5)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Current Parcel Status
                </span>

                <h2 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'bold', color: brandConfig.primaryColor, marginTop: '4px' }}>
                  {currentStatus === 'DELIVERED'
                    ? 'Delivered'
                    : currentStatus === 'OUT_FOR_DELIVERY'
                    ? 'Out for Delivery Today'
                    : currentStatus === 'NDR'
                    ? 'Delivery Attempt Unsuccessful'
                    : currentStatus === 'RTO_INITIATED' || currentStatus === 'RTO_IN_TRANSIT'
                    ? 'Returning to Sender'
                    : currentStatus === 'CANCELLED'
                    ? 'Shipment Cancelled'
                    : 'In Transit'}
                </h2>

                {brandConfig.showEstimatedDelivery && (
                  <div style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                    Estimated Delivery: <strong>{trackingSummary.estimatedDeliveryDate || '22 Aug 2026'}</strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-5)', fontSize: 'var(--font-size-small)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Tracking Reference</span>
                  <div style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{trackingSummary.awb}</div>
                </div>

                {brandConfig.showCourierName && (
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Courier Partner</span>
                    <div style={{ fontWeight: 'bold' }}>{trackingSummary.courierLogo} {trackingSummary.courierName}</div>
                  </div>
                )}

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Shipment Route</span>
                  <div>{trackingSummary.originCity} → {trackingSummary.destinationCity}</div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Last Scan Time</span>
                  <div>{trackingSummary.lastUpdated}</div>
                </div>
              </div>
            </Card>

            {/* CUSTOMER-VISIBLE TIMELINE */}
            <Card style={{ padding: 'var(--space-6)' }}>
              <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)', color: brandConfig.secondaryColor }}>
                Parcel Journey Timeline
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingLeft: 'var(--space-3)' }}>
                {visibleEvents.map((evt, idx) => {
                  const isLatest = idx === 0;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        gap: 'var(--space-4)',
                        position: 'relative',
                        paddingBottom: idx === visibleEvents.length - 1 ? '0' : 'var(--space-4)',
                        borderLeft: idx === visibleEvents.length - 1 ? 'none' : '2px solid var(--color-border)',
                        paddingLeft: 'var(--space-4)',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: '-9px',
                          top: '2px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: isLatest ? brandConfig.primaryColor : '#ffffff',
                          border: `2px solid ${isLatest ? brandConfig.primaryColor : 'var(--color-border)'}`,
                        }}
                      />

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: 'var(--font-size-body)', color: isLatest ? brandConfig.primaryColor : 'var(--color-text-primary)' }}>
                            {evt.title}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{evt.eventTime}</span>
                        </div>
                        <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {evt.description}
                        </p>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          📍 {evt.location}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* MERCHANT SUPPORT CONTACT CARD */}
            {brandConfig.showSupportContact && (
              <Card style={{ padding: 'var(--space-5)', backgroundColor: 'var(--color-surface-secondary)', textAlign: 'center' }}>
                <h4 style={{ fontSize: 'var(--font-size-body)', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>
                  Need Assistance With Your Order?
                </h4>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: 'var(--font-size-small)' }}>
                  {brandConfig.supportEmail && (
                    <a href={`mailto:${brandConfig.supportEmail}`} style={{ color: brandConfig.primaryColor, fontWeight: 'bold', textDecoration: 'none' }}>
                      ✉️ {brandConfig.supportEmail}
                    </a>
                  )}
                  {brandConfig.supportPhone && (
                    <a href={`tel:${brandConfig.supportPhone}`} style={{ color: brandConfig.primaryColor, fontWeight: 'bold', textDecoration: 'none' }}>
                      📞 {brandConfig.supportPhone}
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* FOOTER */}
            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--color-text-muted)', paddingBottom: 'var(--space-6)' }}>
              {brandConfig.customFooterText}
            </div>
          </>
        ) : (
          <Card style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold' }}>Shipment Not Found</h4>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
              Please check your tracking number and try again.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
