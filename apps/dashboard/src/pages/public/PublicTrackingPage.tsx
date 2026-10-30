import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  ShieldCheck,
  PhoneCall,
  MessageSquare,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  Input,
  Alert,
  Modal,
  Textarea,
} from '../../components/ui';
import { BrandingService, type MerchantBrandingConfig } from '../../services/brandingService';
import { TrackingService } from '../../services/trackingService';
import type { ShipmentTrackingSummary } from '../../types/tracking';

export const PublicTrackingPage: React.FC = () => {
  const { merchantSlug, awb } = useParams<{ merchantSlug?: string; awb?: string }>();
  const navigate = useNavigate();

  const [searchTokenInput, setSearchTokenInput] = useState<string>(awb || '');
  const [branding, setBranding] = useState<MerchantBrandingConfig>(() =>
    BrandingService.getBrandingBySlug(merchantSlug || 'acme-store')
  );
  const [trackingData, setTrackingData] = useState<ShipmentTrackingSummary | null>(null);
  const [trackingSource, setTrackingSource] = useState<'LIVE_CARRIER' | 'PORTAL_DB' | 'DEMO' | 'NOT_FOUND'>('DEMO');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delivery Issue Modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueType, setIssueType] = useState('Delivery Delay');
  const [issueComment, setIssueComment] = useState('');
  const [issueToastMsg, setIssueToastMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (merchantSlug) {
      const b = BrandingService.getBrandingBySlug(merchantSlug);
      setBranding(b);
    }

    const targetQuery = awb || 'DEL847192031';
    setIsLoading(true);
    setErrorMsg(null);

    TrackingService.fetchLiveTracking(targetQuery)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setTrackingData(res.data);
          setTrackingSource(res.source);
          setErrorMsg(null);
        } else {
          setErrorMsg(res.message || `No active shipment tracking record found for query: ${targetQuery}`);
          setTrackingData(null);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setErrorMsg(`Failed to connect to courier tracking network for: ${targetQuery}`);
        setTrackingData(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [merchantSlug, awb]);

  const handleSearch = () => {
    if (!searchTokenInput.trim()) return;
    const slug = merchantSlug || branding.merchantSlug;
    navigate(`/track/${slug}/${searchTokenInput.trim()}`);
  };

  const handleRaiseIssue = () => {
    setIsIssueModalOpen(false);
    setIssueToastMsg('Your delivery ticket has been submitted to merchant support team.');
    setIssueComment('');
    setTimeout(() => setIssueToastMsg(null), 5000);
  };

  const contrastInfo = BrandingService.checkColorContrast(branding.primaryColor);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 1. BRANDED MERCHANT HEADER */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px 24px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src={branding.logoUrl}
              alt={branding.brandName}
              style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' }}
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=200'; }}
            />
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: branding.secondaryColor }}>
                {branding.brandName}
              </h1>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Post-Purchase Order & Parcel Tracking</span>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'right' }}>
            {branding.supportPhone && <div>Helpline: <strong style={{ color: '#0f172a' }}>{branding.supportPhone}</strong></div>}
            {branding.supportEmail && <div>Support: <strong style={{ color: '#0f172a' }}>{branding.supportEmail}</strong></div>}
          </div>
        </div>

        {issueToastMsg && (
          <Alert variant="success" title="Customer Support Ticket">
            {issueToastMsg}
          </Alert>
        )}

        {/* 2. PUBLIC TRACKING SEARCH BAR */}
        <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Input
              placeholder="Enter AWB Number or Order ID (e.g. DEL847192031)..."
              value={searchTokenInput}
              onChange={(e) => setSearchTokenInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button
              variant="primary"
              onClick={handleSearch}
              style={{ backgroundColor: branding.primaryColor, color: contrastInfo.textColor, borderColor: branding.primaryColor }}
            >
              <Search size={16} style={{ marginRight: '6px' }} /> Track Order
            </Button>
          </div>
        </Card>

        {isLoading && (
          <Card style={{ padding: '36px 20px', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <RefreshCw size={28} className="animate-spin" style={{ color: branding.primaryColor, margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Connecting to Courier Tracking Network...</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Fetching real-time scan events and delivery ETA from courier API.</p>
          </Card>
        )}

        {errorMsg && !isLoading && (
          <Alert variant="danger" title="Tracking Information Not Available">
            {errorMsg}
          </Alert>
        )}

        {/* 3. SHIPMENT TRACKING DETAILS CARD */}
        {trackingData && !isLoading && (
          <>
            {/* EVENT SPECIFIC PROMINENT ALERT BANNERS */}
            {trackingData.currentStatus === 'OUT_FOR_DELIVERY' ? (
              <div style={{ backgroundColor: branding.primaryColor, color: contrastInfo.textColor, padding: '20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>Doorstep Delivery Alert</div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0' }}>Your order is Out for Delivery today!</h2>
                <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>Delivery executive is on the way with courier partner {trackingData.courierName}.</p>
              </div>
            ) : trackingData.currentStatus === 'DELIVERED' ? (
              <div style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
                <CheckCircle2 size={36} style={{ marginBottom: '6px' }} />
                <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '2px 0' }}>Order Delivered Successfully!</h2>
                <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>Delivered to {trackingData.recipientName} ({trackingData.destinationCity}).</p>
              </div>
            ) : trackingData.currentStatus === 'NDR' ? (
              <Alert variant="warning" title="Delivery Attempt Unsuccessful (NDR)">
                We were unable to deliver your order today. Another delivery attempt may be scheduled by {trackingData.courierName}. Click Raise Delivery Issue below to update instructions.
              </Alert>
            ) : null}

            {/* STATUS CARD */}
            <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
              
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>ORDER REF #{trackingData.orderId}</span>
                    {trackingSource === 'LIVE_CARRIER' ? (
                      <span style={{ fontSize: '11px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: '700', padding: '2px 8px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
                        Verified Carrier Live Feed
                      </span>
                    ) : trackingSource === 'PORTAL_DB' ? (
                      <span style={{ fontSize: '11px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: '700', padding: '2px 8px', borderRadius: '9999px' }}>
                        Portal Booked Order
                      </span>
                    ) : null}
                  </div>
                  <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>
                    AWB: {trackingData.awb}
                  </h2>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <Badge variant="brand" style={{ fontSize: '13px', padding: '6px 12px', backgroundColor: branding.primaryColor, color: contrastInfo.textColor }}>
                    {trackingData.currentStatus}
                  </Badge>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Carrier: <strong>{trackingData.courierName}</strong>
                  </div>
                </div>
              </div>

              {/* Summary Key Specs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', fontWeight: '700' }}>CONSIGNEE NAME</span>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>{trackingData.recipientName}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', fontWeight: '700' }}>DESTINATION CITY</span>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>{trackingData.destinationCity} ({String(trackingData.destinationPincode || '')})</strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', fontWeight: '700' }}>ESTIMATED DELIVERY</span>
                  <strong style={{ fontSize: '14px', color: branding.primaryColor }}>
                    {trackingData.estimatedDeliveryDate ? String(trackingData.estimatedDeliveryDate) : 'Updated once available'}
                  </strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', fontWeight: '700' }}>LAST SCAN TIME</span>
                  <span style={{ fontSize: '12px', color: '#475569' }}>{trackingData.lastUpdated}</span>
                </div>
              </div>

              {/* VISUAL STEP-BY-STEP TRACKING TIMELINE */}
              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', textTransform: 'uppercase' }}>
                  Shipment Journey Timeline
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '10px' }}>
                  {[
                    { step: 1, label: 'Order Created', key: 'BOOKED' },
                    { step: 2, label: 'Pickup Scheduled', key: 'PICKUP_SCHEDULED' },
                    { step: 3, label: 'Picked Up', key: 'PICKED_UP' },
                    { step: 4, label: 'In Transit', key: 'IN_TRANSIT' },
                    { step: 5, label: 'Destination Hub', key: 'HUB_REACHED' },
                    { step: 6, label: 'Out For Delivery', key: 'OUT_FOR_DELIVERY' },
                    { step: 7, label: 'Delivered', key: 'DELIVERED' },
                  ].map((s) => {
                    const isCompleted = trackingData.currentStatus === 'DELIVERED' || s.step <= (trackingData.currentStatus === 'OUT_FOR_DELIVERY' ? 6 : trackingData.currentStatus === 'IN_TRANSIT' ? 4 : 3);
                    const isCurrent = (trackingData.currentStatus === 'OUT_FOR_DELIVERY' && s.step === 6) || (trackingData.currentStatus === 'DELIVERED' && s.step === 7);
                    
                    return (
                      <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: isCompleted ? '#16a34a' : isCurrent ? branding.primaryColor : '#cbd5e1',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '11px',
                          }}
                        >
                          {isCompleted ? '✓' : s.step}
                        </div>
                        <span style={{ color: isCompleted ? '#16a34a' : isCurrent ? branding.primaryColor : '#94a3b8', fontWeight: isCompleted || isCurrent ? '700' : '500' }}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CUSTOMER ACTION BUTTONS */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <a href={`tel:${branding.supportPhone || '9876543210'}`} style={{ textDecoration: 'none', flex: 1, minWidth: '140px' }}>
                  <Button variant="outline" style={{ width: '100%' }} leftIcon={<PhoneCall size={14} />}>
                    Call Support
                  </Button>
                </a>

                <a href={`https://wa.me/${(branding.supportPhone || '919876543210').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', flex: 1, minWidth: '140px' }}>
                  <Button variant="outline" style={{ width: '100%', color: '#16a34a', borderColor: '#86efac' }} leftIcon={<MessageSquare size={14} />}>
                    WhatsApp Support
                  </Button>
                </a>

                <Button variant="outline" style={{ flex: 1, minWidth: '140px', color: '#be123c', borderColor: '#fca5a5' }} leftIcon={<AlertCircle size={14} />} onClick={() => setIsIssueModalOpen(true)}>
                  Raise Delivery Issue
                </Button>

                <Button variant="ghost" onClick={() => setSearchTokenInput('')} style={{ color: '#0284c7' }}>
                  Track Another Shipment
                </Button>
              </div>

            </Card>

            {/* MERCHANTS PROMOTIONAL MARKETING BANNER (IF ACTIVE) */}
            {branding.promotionalBanner.enabled && !branding.promotionalBanner.disabledByAdmin && (
              <Card style={{ padding: '0', overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
                <img
                  src={branding.promotionalBanner.imageUrl}
                  alt={branding.promotionalBanner.headline}
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800'; }}
                />
                <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#0f172a' }}>
                    {branding.promotionalBanner.headline}
                  </h3>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                    {branding.promotionalBanner.description}
                  </p>
                  <a
                    href={branding.promotionalBanner.ctaUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-block',
                      backgroundColor: branding.primaryColor,
                      color: contrastInfo.textColor,
                      padding: '10px 24px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textDecoration: 'none',
                    }}
                  >
                    {branding.promotionalBanner.ctaText} →
                  </a>
                </div>
              </Card>
            )}

            {/* DETAILED TRACKING SCAN EVENTS */}
            <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0', color: '#0f172a' }}>
                Detailed Carrier Scan Activity Events
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '2px solid #0284c7', paddingLeft: '16px' }}>
                {trackingData.events.map((evt, idx) => (
                  <div key={evt.id || idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>{evt.eventTitle || evt.status}</strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{evt.eventTime}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#475569', margin: '2px 0 0 0' }}>{evt.description}</p>
                    {evt.location && (
                      <span style={{ fontSize: '11px', color: branding.primaryColor, fontWeight: 'bold' }}>
                        Location: {evt.location}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* 4. FOOTER WITH VERIFIED BRANDING */}
        {branding.showAggregatorFooter && (
          <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #e2e8f0' }}>
            <ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Powered by Courrier3 Branded Logistics Experience Engine • Verified Secure Tracking
          </div>
        )}
      </div>

      {/* RAISE DELIVERY ISSUE MODAL */}
      <Modal isOpen={isIssueModalOpen} onClose={() => setIsIssueModalOpen(false)} title="Raise Delivery Support Issue" maxWidth="480px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Issue Category</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            >
              <option value="Delivery Delay">Delivery Delay / Out for Delivery Not Arrived</option>
              <option value="Address Update">Address / Landmark Update Request</option>
              <option value="Wrong Delivery Attempt">Courier Attempted Delivery While Premises Closed</option>
              <option value="Package Damage">Damaged Package Report</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Customer Remarks & Instructions</label>
            <Textarea
              rows={3}
              placeholder="Describe your issue or provide delivery instructions for courier driver..."
              value={issueComment}
              onChange={(e) => setIssueComment(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Button variant="outline" onClick={() => setIsIssueModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleRaiseIssue} style={{ backgroundColor: branding.primaryColor, color: contrastInfo.textColor, borderColor: branding.primaryColor }}>
              Submit Support Ticket
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
