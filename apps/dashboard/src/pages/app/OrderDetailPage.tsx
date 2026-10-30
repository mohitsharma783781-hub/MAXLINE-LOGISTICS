import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  User,
  MapPin,
  FileText,
  Download,
  Search,
  Copy,
  RotateCcw,
  AlertTriangle,
  Receipt,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Alert,
  Table,
} from '../../components/ui';
import type { CustomerOrder } from '../../types/orders';
import { ORDER_STATUS_CONFIG } from '../../types/orders';
import { DEMO_ORDER_ITEMS } from '../../mocks/orders.mock';
import { formatCurrency } from '../../utils/formatters';
import { CustomerShipmentService } from '../../services/customerShipmentService';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const real = CustomerShipmentService.getShipmentById(id);
      if (real) {
        navigate(`/app/shipment-control-center/${id}`, { replace: true });
        return;
      }
    }
    const targetId = id || 'ord-10001';
    const match =
      DEMO_ORDER_ITEMS.find((o) => o.id === targetId || o.orderNumber === targetId) ||
      DEMO_ORDER_ITEMS[0];
    setOrder(match);
  }, [id, navigate]);

  if (!order) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert variant="danger" title="Order Record Not Found">
          The requested order reference could not be located in your merchant workspace.
        </Alert>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/app/orders')}
          style={{ marginTop: '16px' }}
        >
          Back to Orders
        </Button>
      </div>
    );
  }

  const statusConfig = ORDER_STATUS_CONFIG.find((c) => c.key === order.orderStatus) || {
    label: order.orderStatusText || order.orderStatus,
    variant: 'info' as const,
  };

  const awbNumber = 'DEL98401928';
  const lrnNumber = `LRN-2026-${order.orderNumber.replace(/\D/g, '') || '98401'}`;

  // Quick Action Handlers
  const handleAction = (actionName: string) => {
    setActionAlert(`Action triggered: ${actionName}`);
    setTimeout(() => setActionAlert(null), 4000);
  };

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Orders Center', path: '/app/orders' },
    { label: order.orderNumber, path: `/app/orders/${id}` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. Page Header */}
      <PageHeader
        title={`Order Master Control Center — ${order.orderNumber}`}
        description={`AWB: ${awbNumber} • LRN: ${lrnNumber} • Placed: ${order.createdAt}`}
        breadcrumbs={breadcrumbs}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => navigate('/app/orders')}
          >
            Back to Orders
          </Button>
        }
      />

      {actionAlert && (
        <Alert variant="success" title="Quick Action Status">
          {actionAlert}
        </Alert>
      )}

      {/* 2. TOP MASTER HEADER CARD */}
      <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          
          {/* Left Info: AWB, LRN, Order ID & Courier Partner Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '12px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(15,23,42,0.3)',
              }}
            >
              🚚
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  AWB: {awbNumber}
                </h2>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                <Badge variant={order.paymentMode === 'cod' ? 'warning' : 'success'}>
                  {order.paymentMode.toUpperCase()}
                </Badge>
              </div>

              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span>Order ID: <strong style={{ color: '#0f172a' }}>{order.orderNumber}</strong></span>
                <span>LRN Number: <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{lrnNumber}</strong></span>
                <span>Carrier: <strong style={{ color: '#0f172a' }}>Delhivery Surface Express</strong></span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Booking Date: <strong>{order.createdAt}</strong> • Last Scan: <strong>10 mins ago</strong>
            </div>
          </div>

        </div>

        {/* 7 QUICK ACTION BUTTONS ROW (TOP RIGHT) */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={() => handleAction('Downloading Shipping Label PDF')}
          >
            Download Label
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileText size={14} />}
            onClick={() => handleAction('Downloading Commercial Invoice PDF')}
          >
            Download Invoice
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<ShieldCheck size={14} />}
            onClick={() => handleAction('Downloading Proof of Delivery (POD)')}
          >
            Download POD
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Search size={14} />}
            onClick={() => navigate(`/app/tracking?query=${order.orderNumber}`)}
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
          >
            Track Shipment
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Copy size={14} />}
            onClick={() => handleAction('Cloning shipment details for new order')}
          >
            Clone Shipment
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<RotateCcw size={14} />}
            onClick={() => handleAction('Rebooking shipment with carrier')}
          >
            Rebook Shipment
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<AlertTriangle size={14} />}
            onClick={() => navigate('/app/weight-discrepancies')}
            style={{ color: '#be123c', borderColor: '#fca5a5' }}
          >
            Raise Dispute
          </Button>
        </div>
      </Card>

      {/* 3. OVERVIEW & CUSTOMER INFORMATION BLOCK */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        
        {/* Customer Information */}
        <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 12px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} style={{ color: '#0284c7' }} /> Consignee / Buyer Information
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#334155' }}>
            <div>Customer Name: <strong style={{ color: '#0f172a' }}>{order.customerName}</strong></div>
            <div>Mobile Number: <strong>{order.customerPhone}</strong></div>
            <div>Email Address: <strong>{order.customerEmail}</strong></div>
            <div>Payment Mode: <Badge variant={order.paymentMode === 'cod' ? 'warning' : 'success'}>{order.paymentMode.toUpperCase()}</Badge></div>
            {order.paymentMode === 'cod' && (
              <div>Collectable COD Amount: <strong style={{ color: '#d97706' }}>₹1,500.00</strong></div>
            )}
          </div>
        </Card>

        {/* Origin & Destination Routing */}
        <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 12px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} style={{ color: '#0284c7' }} /> Origin & Destination Routing
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#334155' }}>
            <div>Pickup Warehouse: <strong style={{ color: '#0f172a' }}>Delhi Primary FC Hub</strong></div>
            <div>Delivery Address: <strong>{order.shippingAddress.addressLine1}</strong></div>
            <div>Destination Location: <strong>{order.shippingAddress.city}, {order.shippingAddress.state}</strong></div>
            <div>Pincode & Zone: <strong>{order.shippingAddress.pincode} (Zone C - Metro)</strong></div>
          </div>
        </Card>

      </div>

      {/* 4. SHIPMENT PHYSICAL SPECIFICATIONS & COURIER INFORMATION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        
        {/* Physical Package Specs */}
        <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 12px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={18} style={{ color: '#0284c7' }} /> Physical Package Specifications
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', color: '#334155' }}>
            <div>Dead Weight: <strong>2.50 KG</strong></div>
            <div>Volumetric Weight: <strong>1.80 KG</strong></div>
            <div>Chargeable Weight: <strong style={{ color: '#0284c7' }}>2.50 KG</strong></div>
            <div>Package Count: <strong>1 Parcel Box</strong></div>
            <div>Dimensions (L×W×H): <strong>30 × 20 × 15 CM</strong></div>
            <div>Declared Invoice Value: <strong>{formatCurrency(order.orderValue)}</strong></div>
            <div style={{ gridColumn: 'span 2' }}>
              Contents Description: <strong>Electronics & Computer Accessories</strong>
            </div>
          </div>
        </Card>

        {/* Courier Service & SLA */}
        <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 12px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={18} style={{ color: '#0284c7' }} /> Courier Partner & Service SLA
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#334155' }}>
            <div>Courier Partner: <strong style={{ color: '#0f172a' }}>Delhivery Surface</strong></div>
            <div>Service Category: <Badge variant="info">Surface Express</Badge></div>
            <div>Routing Zone: <strong>Zone C (North to South Metro)</strong></div>
            <div>Expected Delivery: <strong style={{ color: '#16a34a' }}>29 Aug 2026</strong></div>
            <div>Transit Time SLA: <strong>2 - 3 Days</strong></div>
          </div>
        </Card>

      </div>

      {/* 5. CHARGES BREAKDOWN SUMMARY CARD */}
      <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Receipt size={18} style={{ color: '#0284c7' }} /> Complete Freight & Charges Summary
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '13px' }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>BASE FREIGHT</span>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>₹180.00</div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>FUEL SURCHARGE</span>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>₹21.60</div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>DOCKET CHARGE</span>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>₹15.00</div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>COD FEE</span>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#d97706' }}>₹40.00</div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>ROV / HANDLING</span>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>₹15.00</div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>ODA / INSURANCE</span>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>₹0.00</div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>GST AMOUNT (18%)</span>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>₹48.90</div>
          </div>

          <div style={{ border: '2px solid #0284c7', borderRadius: '8px', padding: '12px', backgroundColor: '#f0f9ff' }}>
            <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800' }}>FINAL TOTAL CHARGE</span>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#0284c7' }}>₹320.50</div>
          </div>
        </div>
      </Card>

      {/* 6. ORDER ITEMS TABLE */}
      <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', color: '#0f172a' }}>
          Order Items Manifest ({order.items.length} SKUs)
        </h3>

        <Table
          keyExtractor={(item: any) => item.id}
          columns={[
            {
              key: 'name',
              header: 'Product Name & SKU',
              render: (item: any) => (
                <div>
                  <strong style={{ color: '#0f172a' }}>{item.name}</strong>
                  <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>SKU: {item.sku}</div>
                </div>
              ),
            },
            { key: 'quantity', header: 'Qty', render: (item: any) => <strong>x{item.quantity}</strong> },
            { key: 'unitPrice', header: 'Unit Price', render: (item: any) => formatCurrency(item.unitPrice) },
            { key: 'subtotal', header: 'Subtotal', render: (item: any) => <strong>{formatCurrency(item.subtotal)}</strong> },
          ]}
          data={order.items as any[]}
        />
      </Card>

    </div>
  );
};
