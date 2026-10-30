import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Truck,
  User,
  MapPin,
  FileText,
  Download,
  Search,
  Printer,
  AlertTriangle,
  Scale,
  Building2,
  Eye,
  Copy,
  Check,
  CreditCard,
  History,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Alert,
  Table,
  Modal,
} from '../../components/ui';
import { CustomerShipmentService } from '../../services/customerShipmentService';
import { mapShipmentToOrderRecord, type OrderRecord } from './CustomerOrdersPage';
import { formatCurrency } from '../../utils/formatters';
import { useTenant } from '../../context/TenantContext';

export const ShipmentControlCenterPage: React.FC = () => {
  const { id, shipmentId } = useParams<{ id?: string; shipmentId?: string }>();
  const navigate = useNavigate();
  const { activeTenantId } = useTenant();

  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'TIMELINE' | 'CHARGES' | 'DOCUMENTS' | 'BILLING' | 'ACTIVITY'
  >('OVERVIEW');

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionAlert, setActionAlert] = useState<string | null>(null);
  const [copiedAwb, setCopiedAwb] = useState<boolean>(false);
  const [previewDocTitle, setPreviewDocTitle] = useState<string | null>(null);

  useEffect(() => {
    const targetId = id || shipmentId || '';
    if (!targetId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 1. Check local lookup first
    const local =
      CustomerShipmentService.getShipmentById(targetId, activeTenantId) ||
      CustomerShipmentService.getShipmentById(targetId);

    if (local) {
      setOrder(mapShipmentToOrderRecord(local));
      setIsLoading(false);
      return;
    }

    // 2. If not found locally, sync from Supabase Cloud DB
    CustomerShipmentService.syncFromSupabase(activeTenantId)
      .then(() => {
        const synced =
          CustomerShipmentService.getShipmentById(targetId, activeTenantId) ||
          CustomerShipmentService.getShipmentById(targetId);
        if (synced) {
          setOrder(mapShipmentToOrderRecord(synced));
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, shipmentId]);

  const handleCopyAwb = (awb: string) => {
    navigator.clipboard.writeText(awb);
    setCopiedAwb(true);
    setTimeout(() => setCopiedAwb(false), 2000);
  };

  const handleAction = (actionName: string) => {
    setActionAlert(`Action executed: ${actionName}`);
    setTimeout(() => setActionAlert(null), 4000);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'success';
      case 'In Transit':
      case 'Picked Up':
      case 'Pickup Scheduled':
        return 'info';
      case 'OFD':
      case 'NDR':
        return 'warning';
      case 'RTO':
      case 'Cancelled':
        return 'danger';
      case 'Booked':
      default:
        return 'brand';
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '15px', fontWeight: '600', color: '#0284c7' }}>
          Loading shipment details...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
        <Alert variant="danger" title="Shipment Record Not Located">
          The requested shipment reference could not be located in your workspace.
        </Alert>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/app/orders')}
          style={{ marginTop: '16px', color: '#0284c7' }}
        >
          Back to Orders Center
        </Button>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Orders Center', path: '/app/orders' },
    { label: order.orderId, path: `/app/shipments/${order.id}` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. Page Header */}
      <PageHeader
        title={`Shipment Control Center — ${order.orderId}`}
        description={`AWB: ${order.awbNumber} • Courier: ${order.courierName} • Booked: ${order.createdDate}`}
        breadcrumbs={breadcrumbs}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => navigate('/app/orders')}
          >
            Back to Orders Center
          </Button>
        }
      />

      {actionAlert && (
        <Alert variant="success" title="Shipment Action Status">
          {actionAlert}
        </Alert>
      )}

      {/* 2. SHIPMENT MASTER HEADER CARD */}
      <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          
          {/* Left Block: Courier Icon, AWB, Order ID, Courier Partner Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '12px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Truck size={28} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#0f172a', fontFamily: 'monospace' }}>
                  AWB: {order.awbNumber}
                </h2>
                <button
                  onClick={() => handleCopyAwb(order.awbNumber)}
                  title="Copy AWB"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: copiedAwb ? '#16a34a' : '#475569',
                    fontWeight: '600',
                  }}
                >
                  {copiedAwb ? <Check size={12} /> : <Copy size={12} />}
                  {copiedAwb ? 'Copied' : 'Copy'}
                </button>
                <Badge variant={getStatusVariant(order.status)} style={{ fontSize: '12px', padding: '3px 8px' }}>
                  {order.status}
                </Badge>
                <Badge variant={order.mode === 'B2B' ? 'warning' : 'info'}>
                  {order.mode} - {order.serviceType}
                </Badge>
                <Badge variant={order.paymentType === 'COD' ? 'warning' : 'success'}>
                  {order.paymentType}
                </Badge>
              </div>

              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span>Order ID: <strong style={{ color: '#0284c7' }}>{order.orderId}</strong></span>
                <span>Courier Partner: <strong style={{ color: '#0f172a' }}>{order.courierName}</strong></span>
                <span>Booking Date: <strong style={{ color: '#0f172a' }}>{order.createdDate}</strong></span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons Bar */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer size={14} />}
              onClick={() => navigate(`/app/shipments/${order.id}/label`)}
              style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            >
              Print Shipping Label
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Search size={14} />}
              onClick={() => navigate('/app/tracking')}
            >
              Track Shipment
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<AlertTriangle size={14} />}
              onClick={() => navigate('/app/weight-discrepancies')}
              style={{ color: '#be123c', borderColor: '#fca5a5' }}
            >
              Raise Weight Dispute
            </Button>
          </div>

        </div>
      </Card>

      {/* 3. CONTROL CENTER NAVIGATION TABS */}
      <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px', overflowX: 'auto' }}>
          {[
            { id: 'OVERVIEW', label: '1. Overview' },
            { id: 'TIMELINE', label: '2. Tracking Timeline' },
            { id: 'CHARGES', label: '3. Charges Breakdown' },
            { id: 'DOCUMENTS', label: '4. Documents' },
            { id: 'BILLING', label: '5. Billing & Wallet' },
            { id: 'ACTIVITY', label: '6. Activity Logs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#0284c7' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#64748b',
                fontWeight: activeTab === tab.id ? '700' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              
              {/* Order Information Card */}
              <Card style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={16} style={{ color: '#0284c7' }} /> Order Information
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Order Reference:</span>
                    <strong style={{ color: '#0284c7' }}>{order.orderId}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Booking Date:</span>
                    <strong>{order.createdDate}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Payment Mode:</span>
                    <Badge variant={order.paymentType === 'COD' ? 'warning' : 'success'}>{order.paymentType}</Badge>
                  </div>
                  {order.paymentType === 'COD' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Collectable COD:</span>
                      <strong style={{ color: '#d97706' }}>{formatCurrency(order.codAmount)}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Shipment Direction:</span>
                    <strong>{order.shipmentType} Delivery</strong>
                  </div>
                </div>
              </Card>

              {/* Customer Information Card */}
              <Card style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} style={{ color: '#0284c7' }} /> Consignee Customer Details
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Consignee Name:</span>
                    <strong style={{ color: '#0f172a' }}>{order.customerName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Mobile Number:</span>
                    <strong>{order.customerPhone || 'N/A'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Email Address:</span>
                    <strong>{order.customerEmail || 'N/A'}</strong>
                  </div>
                </div>
              </Card>

              {/* Pickup Address Card */}
              <Card style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={16} style={{ color: '#0284c7' }} /> Pickup Origin Location
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Warehouse Name:</span>
                    <strong style={{ color: '#0f172a' }}>{order.warehouseName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>City & State:</span>
                    <strong>{order.originCity}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Origin Pincode:</span>
                    <strong>{order.originPincode}</strong>
                  </div>
                </div>
              </Card>

              {/* Delivery Address Card */}
              <Card style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} style={{ color: '#dc2626' }} /> Delivery Destination Address
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#334155' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Street Address:</span>
                    <strong style={{ color: '#0f172a' }}>{order.deliveryAddress}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Destination City:</span>
                    <strong>{order.deliveryCity}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Destination Pincode:</span>
                    <strong>{order.deliveryPincode}</strong>
                  </div>
                </div>
              </Card>

              {/* Package Details Card */}
              <Card style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Scale size={16} style={{ color: '#0284c7' }} /> Package Physical Specs
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#334155' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Actual Dead Weight:</span>
                    <strong>{order.deadWeightKg} KG</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Volumetric Weight:</span>
                    <strong>{order.volumetricWeightKg} KG</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Chargeable Weight:</span>
                    <strong style={{ color: '#0284c7' }}>{order.chargeableWeightKg} KG</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Package Boxes:</span>
                    <strong>1 Box</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748b', display: 'block' }}>Dimensions (L × W × H):</span>
                    <strong>{order.dimensionsCm}</strong>
                  </div>
                </div>
              </Card>

              {/* Courier Details Card */}
              <Card style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Truck size={16} style={{ color: '#0284c7' }} /> Carrier Partner & SLA
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Courier Name:</span>
                    <strong style={{ color: '#0284c7' }}>{order.courierName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Service Mode:</span>
                    <strong>{order.mode} - {order.serviceType}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Delivery SLA:</span>
                    <strong style={{ color: '#16a34a' }}>Standard SLA (3-5 Days)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Status:</span>
                    <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                  </div>
                </div>
              </Card>

            </div>
          </div>
        )}

        {/* TAB 2: TRACKING TIMELINE */}
        {activeTab === 'TIMELINE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Live Carrier Tracking Event Log
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #cbd5e1', marginTop: '8px' }}>
              {order.timeline.map((event, idx) => {
                const isCompleted = event.completed;
                const isActive = event.active;
                const isError = event.isError;

                return (
                  <div key={idx} style={{ position: 'relative' }}>
                    {/* Event Indicator Dot */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '-31px',
                        top: '2px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: isError ? '#dc2626' : isActive ? '#0284c7' : isCompleted ? '#16a34a' : '#cbd5e1',
                        border: '2px solid #ffffff',
                        boxShadow: '0 0 0 2px ' + (isError ? '#fecaca' : isActive ? '#bae6fd' : isCompleted ? '#bbf7d0' : '#e2e8f0'),
                      }}
                    />

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '13px', color: isError ? '#dc2626' : isActive ? '#0284c7' : isCompleted ? '#16a34a' : '#475569' }}>
                          {event.title}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{event.timestamp}</span>
                      </div>
                      <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#334155' }}>
                        {event.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: CHARGES BREAKDOWN */}
        {activeTab === 'CHARGES' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Complete Freight Billing Breakdown
            </h3>

            {/* CHARGES BREAKDOWN TABLE */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Charge Component</th>
                  <th style={{ padding: '10px' }}>Description</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>Base Freight Charge</td>
                  <td style={{ padding: '10px' }}>Weight rate for {order.chargeableWeightKg} KG ({order.mode} - {order.serviceType})</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(order.baseFreight)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>Fuel Surcharge</td>
                  <td style={{ padding: '10px' }}>Carrier monthly fuel index adjustment</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(order.fuelSurcharge)}</td>
                </tr>
                {order.codCharge > 0 && (
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>COD Collection Fee</td>
                    <td style={{ padding: '10px' }}>Doorstep cash collection fee</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(order.codCharge)}</td>
                  </tr>
                )}
                <tr style={{ borderBottom: '2px solid #0284c7', backgroundColor: '#f0f9ff' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>GST (18% Statutory Tax)</td>
                  <td style={{ padding: '10px' }}>Integrated GST tax on logistics freight</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#0284c7' }}>{formatCurrency(order.gstAmount)}</td>
                </tr>
              </tbody>
            </table>

            {/* TOTALS SUMMARY CARD */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '10px' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', backgroundColor: '#f8fafc' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>TOTAL NET FREIGHT</span>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{formatCurrency(order.totalAmount - order.gstAmount)}</div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', backgroundColor: '#f8fafc' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>TOTAL GST TAX (18%)</span>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{formatCurrency(order.gstAmount)}</div>
              </div>

              <div style={{ border: '2px solid #0284c7', borderRadius: '8px', padding: '14px', backgroundColor: '#f0f9ff' }}>
                <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800' }}>GRAND TOTAL PAID</span>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#0284c7' }}>{formatCurrency(order.totalAmount)}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DOCUMENTS */}
        {activeTab === 'DOCUMENTS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Shipment Document Center
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {[
                { title: '4x6 Thermal Shipping Label', format: 'PDF Format', desc: 'Barcode & QR thermal sticker for package box' },
                { title: 'Tax Invoice (Commercial)', format: 'PDF Format', desc: 'Official customer invoice with GST breakdown' },
                { title: 'Dispatch Handover Manifest', format: 'PDF Format', desc: 'Driver sign-off sheet for warehouse pickup' },
              ].map((doc, idx) => (
                <Card key={idx} style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{doc.title}</strong>
                    <Badge variant="brand">{doc.format}</Badge>
                  </div>

                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{doc.desc}</p>

                  <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '8px' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Printer size={13} />}
                      onClick={() => navigate(`/app/shipments/${order.id}/label`)}
                      style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                    >
                      Print Label
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye size={13} />}
                      onClick={() => setPreviewDocTitle(doc.title)}
                    >
                      Preview
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: BILLING & WALLET */}
        {activeTab === 'BILLING' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', backgroundColor: '#f8fafc' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>TRANSACTION REFERENCE</span>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0284c7', fontFamily: 'monospace' }}>TXN-{order.orderId.replace(/\D/g, '') || 'WALLET'}</div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', backgroundColor: '#f8fafc' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>DEBIT DATE</span>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{order.createdDate}</div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', backgroundColor: '#f8fafc' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>FREIGHT AMOUNT</span>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{formatCurrency(order.totalAmount)}</div>
              </div>

              <div style={{ border: '1px solid #16a34a', borderRadius: '8px', padding: '14px', backgroundColor: '#f0fdf4' }}>
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '800' }}>SETTLEMENT STATUS</span>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#16a34a' }}>PAID (Wallet Debit)</div>
              </div>
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '10px 0 0 0' }}>
              Wallet Ledger Entry
            </h3>

            <Table
              keyExtractor={(r: any) => r.ref}
              columns={[
                { key: 'ref', header: 'Reference ID', render: (r: any) => <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{r.ref}</strong> },
                { key: 'method', header: 'Payment Method', render: (r: any) => <span>{r.method}</span> },
                { key: 'base', header: 'Base Freight', render: (r: any) => formatCurrency(r.base) },
                { key: 'gst', header: 'GST Tax', render: (r: any) => formatCurrency(r.gst) },
                { key: 'total', header: 'Total Debited', render: (r: any) => <strong style={{ color: '#0284c7' }}>{formatCurrency(r.total)}</strong> },
                { key: 'status', header: 'Status', render: (r: any) => <Badge variant="success">{r.status}</Badge> },
              ]}
              data={[
                {
                  ref: `TXN-${order.orderId}`,
                  method: 'Skyonship Wallet (Atomic Debit)',
                  base: order.baseFreight + order.fuelSurcharge,
                  gst: order.gstAmount,
                  total: order.totalAmount,
                  status: 'SUCCESS',
                },
              ]}
            />
          </div>
        )}

        {/* TAB 6: ACTIVITY LOGS */}
        {activeTab === 'ACTIVITY' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Shipment Operational Audit Trail
            </h3>

            <Table
              keyExtractor={(r: any) => r.id}
              columns={[
                { key: 'timestamp', header: 'Date & Time', render: (r: any) => <span style={{ fontSize: '11px', color: '#64748b' }}>{r.timestamp}</span> },
                { key: 'user', header: 'Actor / System', render: (r: any) => <strong>{r.user}</strong> },
                { key: 'action', header: 'Action Event', render: (r: any) => <Badge variant="info">{r.action}</Badge> },
                { key: 'remarks', header: 'Remarks & Metadata', render: (r: any) => <span style={{ fontSize: '12px', color: '#334155' }}>{r.remarks}</span> },
              ]}
              data={[
                { id: '1', timestamp: order.createdDate, user: 'Merchant Admin', action: 'Order Created', remarks: `Order ${order.orderId} created for consignee ${order.customerName}` },
                { id: '2', timestamp: order.createdDate, user: 'Rate Engine', action: 'Rate Assigned', remarks: `Selected ${order.courierName} at ${formatCurrency(order.totalAmount)}` },
                { id: '3', timestamp: order.createdDate, user: 'Wallet Engine', action: 'Wallet Debited', remarks: `Deducted ${formatCurrency(order.totalAmount)} from Skyonship balance` },
                { id: '4', timestamp: order.createdDate, user: 'Courier API', action: 'AWB Assigned', remarks: `Carrier AWB ${order.awbNumber} successfully generated` },
                { id: '5', timestamp: order.createdDate, user: 'System Worker', action: 'Label Ready', remarks: 'Shipping label barcode compiled for 4x6 print' },
              ]}
            />
          </div>
        )}

      </Card>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDocTitle && (
        <Modal
          isOpen={!!previewDocTitle}
          onClose={() => setPreviewDocTitle(null)}
          title={`Document Preview — ${previewDocTitle}`}
          maxWidth="700px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', padding: '16px' }}>
            <div style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '20px', backgroundColor: '#ffffff', color: '#0f172a' }}>
              <div style={{ borderBottom: '2px solid #0284c7', paddingBottom: '10px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#0284c7', fontSize: '18px' }}>SKYONSHIP LOGISTICS</h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{previewDocTitle}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', fontFamily: 'monospace' }}>
                  <div>AWB: <strong>{order.awbNumber}</strong></div>
                  <div>Order: <strong>{order.orderId}</strong></div>
                </div>
              </div>
              <div style={{ fontSize: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', backgroundColor: '#f8fafc' }}>
                  <strong style={{ color: '#0284c7' }}>Pickup Origin Hub:</strong>
                  <div>{order.warehouseName}</div>
                  <div>{order.originCity} - {order.originPincode}</div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', backgroundColor: '#f8fafc' }}>
                  <strong style={{ color: '#0284c7' }}>Delivery Destination:</strong>
                  <div>{order.customerName}</div>
                  <div>{order.deliveryAddress}</div>
                  <div>{order.deliveryCity} - {order.deliveryPincode}</div>
                </div>
              </div>
              <div style={{ marginTop: '14px', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Carrier Partner: <strong>{order.courierName}</strong></span>
                  <span>Chargeable Weight: <strong>{order.chargeableWeightKg} KG</strong></span>
                  <span>Total Amount: <strong style={{ color: '#0284c7' }}>₹{order.totalAmount.toFixed(2)}</strong></span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
              <Button variant="outline" onClick={() => setPreviewDocTitle(null)}>Close</Button>
              <Button
                variant="primary"
                leftIcon={<Printer size={14} />}
                onClick={() => {
                  setPreviewDocTitle(null);
                  navigate(`/app/shipments/${order.id}/label`);
                }}
                style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
              >
                Print Official Label
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
