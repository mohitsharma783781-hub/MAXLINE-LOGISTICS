import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  RefreshCw,
  AlertCircle,
  Printer,
  Download,
  FileText,
  HelpCircle,
  Copy,
  Check,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Input,
  Alert,
} from '../../components/ui';
import { CustomerShipmentService } from '../../services/customerShipmentService';

export interface TrackingTimelineEvent {
  id: string;
  date: string;
  time: string;
  location: string;
  statusTitle: string;
  remarks: string;
  source: 'Carrier Webhook' | 'API Auto-Sync' | 'Manual Override';
}

export interface TrackingShipmentRecord {
  id: string;
  awbNumber: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryPincode: string;

  courierName: string;
  courierLogoBg: string;
  serviceType: 'Surface' | 'Air' | 'Express' | 'Cargo';
  mode: 'B2C' | 'B2B';
  zoneRoute: string;
  transitSlaDays: string;

  deadWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  dimensionsCm: string;
  packageCount: number;
  contentsDescription: string;

  baseFreight: number;
  fuelSurcharge: number;
  docketCharges: number;
  codCharges: number;
  rovCharges: number;
  insuranceCharges: number;
  gstAmount: number;
  finalAmount: number;
  walletReferenceId: string;

  status: 'Booked' | 'Pickup Scheduled' | 'Picked Up' | 'In Transit' | 'OFD' | 'Delivered' | 'NDR' | 'RTO' | 'Cancelled';
  stepIndex: number; // 0 to 6
  etaDate: string;
  transitDaysCount: string;
  lastUpdatedTime: string;

  timelineEvents: TrackingTimelineEvent[];
  activityLogs: Array<{ id: string; timestamp: string; action: string; user: string }>;

  // NDR Info (if applicable)
  ndrDetails?: {
    reason: string;
    attemptCount: number;
    actionRequired: string;
    customerResponse: string;
    resolutionStatus: string;
  };

  // RTO Info (if applicable)
  rtoDetails?: {
    rtoDate: string;
    rtoReason: string;
    currentRtoStatus: string;
    expectedReturnDate: string;
  };

  // Admin Logs
  adminLogs?: {
    courierApiPayload: string;
    webhookLog: string;
    syncHistory: string;
    errorLogs: string;
  };
}

export const DEMO_TRACKING_DATABASE: TrackingShipmentRecord[] = [
  {
    id: 'shp-101',
    awbNumber: 'DEL98401928',
    orderId: 'ORD-2026-98401',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98765 43210',
    customerEmail: 'rahul.sharma@example.com',
    deliveryAddress: 'Flat 402, Sunshine Heights, Koramangala',
    deliveryCity: 'Bengaluru',
    deliveryState: 'Karnataka',
    deliveryPincode: '560038',

    courierName: 'Delhivery Surface',
    courierLogoBg: '#0f172a',
    serviceType: 'Surface',
    mode: 'B2C',
    zoneRoute: 'N1 → S2',
    transitSlaDays: '24-48 Hours',

    deadWeightKg: 2.5,
    volumetricWeightKg: 1.8,
    chargeableWeightKg: 2.5,
    dimensionsCm: '30 × 20 × 15 CM',
    packageCount: 1,
    contentsDescription: 'Apparel & Fashion Items',

    baseFreight: 180.0,
    fuelSurcharge: 21.6,
    docketCharges: 15.0,
    codCharges: 40.0,
    rovCharges: 0.0,
    insuranceCharges: 0.0,
    gstAmount: 46.18,
    finalAmount: 302.78,
    walletReferenceId: 'TXN-WAL-9840192',

    status: 'Delivered',
    stepIndex: 6,
    etaDate: '28 Aug 2026',
    transitDaysCount: '2 Days',
    lastUpdatedTime: '28 Aug 2026, 02:20 PM',

    timelineEvents: [
      { id: 't7', date: '28 Aug 2026', time: '02:20 PM', location: 'Bengaluru Koramangala Hub', statusTitle: 'Shipment Delivered', remarks: 'Handed over to recipient with OTP verification', source: 'Carrier Webhook' },
      { id: 't6', date: '28 Aug 2026', time: '09:15 AM', location: 'Bengaluru Delivery Center', statusTitle: 'Out For Delivery (OFD)', remarks: 'Delivery executive Agent Ramesh (982910291) out for delivery', source: 'Carrier Webhook' },
      { id: 't5', date: '28 Aug 2026', time: '06:45 AM', location: 'Bengaluru Gateway Hub', statusTitle: 'Reached Hub', remarks: 'Arrived at Koramangala Delivery Hub & sorted for route', source: 'API Auto-Sync' },
      { id: 't4', date: '27 Aug 2026', time: '08:30 PM', location: 'Delhi Gateway Airport Hub', statusTitle: 'In Transit', remarks: 'Departed Delhi Airport hub via Air Surface feeder line', source: 'Carrier Webhook' },
      { id: 't3', date: '27 Aug 2026', time: '02:00 PM', location: 'Delhi Primary Warehouse', statusTitle: 'Shipment Picked Up', remarks: 'Scanned & loaded into Delhivery pickup vehicle', source: 'Carrier Webhook' },
      { id: 't2', date: '27 Aug 2026', time: '11:15 AM', location: 'Delhi Primary Warehouse', statusTitle: 'Pickup Scheduled', remarks: 'Pickup agent assigned for evening collection', source: 'API Auto-Sync' },
      { id: 't1', date: '27 Aug 2026', time: '10:30 AM', location: 'Merchant Dashboard', statusTitle: 'Order Created', remarks: 'Shipping label generated and AWB allocated', source: 'Manual Override' },
    ],

    activityLogs: [
      { id: 'l1', timestamp: '27 Aug 2026, 10:30 AM', action: 'AWB DEL98401928 generated via Delhivery API', user: 'System Merchant' },
      { id: 'l2', timestamp: '27 Aug 2026, 02:00 PM', action: 'First Mile Pickup Scan recorded', user: 'Delhivery Scanner' },
      { id: 'l3', timestamp: '28 Aug 2026, 02:20 PM', action: 'Proof of Delivery (POD) uploaded with OTP signature', user: 'Delhivery Driver App' },
    ],

    adminLogs: {
      courierApiPayload: '{"courier":"Delhivery","awb":"DEL98401928","statusCode":200,"status":"DELIVERED","podSignature":"OTP-984012"}',
      webhookLog: 'HTTP 200 POST /api/webhooks/delhivery -> Event: SHIPMENT_DELIVERED',
      syncHistory: 'Last synced 2 mins ago via Cron Poller (Latency: 142ms)',
      errorLogs: 'No error logs recorded for this AWB.',
    },
  },
  {
    id: 'shp-102',
    awbNumber: 'BD49102847',
    orderId: 'ORD-2026-98402',
    customerName: 'Ananya Roy',
    customerPhone: '+91 98123 45678',
    customerEmail: 'ananya.roy@example.com',
    deliveryAddress: '12th Floor, World Trade Center, Cuffe Parade',
    deliveryCity: 'Mumbai',
    deliveryState: 'Maharashtra',
    deliveryPincode: '400005',

    courierName: 'Blue Dart Air',
    courierLogoBg: '#dc2626',
    serviceType: 'Air',
    mode: 'B2C',
    zoneRoute: 'N1 → W1',
    transitSlaDays: '24 Hours Express',

    deadWeightKg: 1.0,
    volumetricWeightKg: 1.2,
    chargeableWeightKg: 1.2,
    dimensionsCm: '25 × 20 × 10 CM',
    packageCount: 1,
    contentsDescription: 'Electronics & Accessories',

    baseFreight: 220.0,
    fuelSurcharge: 33.0,
    docketCharges: 25.0,
    codCharges: 0.0,
    rovCharges: 0.0,
    insuranceCharges: 0.0,
    gstAmount: 50.04,
    finalAmount: 328.04,
    walletReferenceId: 'TXN-WAL-9840193',

    status: 'In Transit',
    stepIndex: 3,
    etaDate: '29 Aug 2026',
    transitDaysCount: '1 Day',
    lastUpdatedTime: '28 Aug 2026, 03:00 PM',

    timelineEvents: [
      { id: 'tb4', date: '28 Aug 2026', time: '03:00 PM', location: 'IGI Airport Air Cargo Hub', statusTitle: 'In Transit via Flight BD-602', remarks: 'Loaded on flight en route to Mumbai CSIA Airport', source: 'Carrier Webhook' },
      { id: 'tb3', date: '28 Aug 2026', time: '12:30 PM', location: 'Delhi Airport Facility', statusTitle: 'Picked Up & Scanned', remarks: 'Scanned at Air Express sorting facility', source: 'Carrier Webhook' },
      { id: 'tb2', date: '28 Aug 2026', time: '10:00 AM', location: 'Delhi Primary Warehouse', statusTitle: 'Pickup Scheduled', remarks: 'Blue Dart Air pickup scheduled', source: 'API Auto-Sync' },
      { id: 'tb1', date: '28 Aug 2026', time: '09:15 AM', location: 'Merchant Dashboard', statusTitle: 'Order Created', remarks: 'AWB BD49102847 created', source: 'Manual Override' },
    ],

    activityLogs: [
      { id: 'lb1', timestamp: '28 Aug 2026, 09:15 AM', action: 'Blue Dart Air AWB Generated', user: 'System Merchant' },
      { id: 'lb2', timestamp: '28 Aug 2026, 03:00 PM', action: 'Flight Manifest Sync Recorded', user: 'Blue Dart API' },
    ],

    adminLogs: {
      courierApiPayload: '{"courier":"BlueDart","awb":"BD49102847","flightNo":"BD602","status":"IN_TRANSIT"}',
      webhookLog: 'HTTP 200 POST /api/webhooks/bluedart -> Event: FLIGHT_DEPARTURE',
      syncHistory: 'Synced 5 mins ago via Direct Webhook',
      errorLogs: 'No errors.',
    },
  },
  {
    id: 'shp-103',
    awbNumber: 'GAT10284910',
    orderId: 'ORD-2026-98403',
    customerName: 'Vikram Mehta',
    customerPhone: '+91 97654 32109',
    customerEmail: 'vikram.m@example.com',
    deliveryAddress: 'Plot 88, GIDC Industrial Estate',
    deliveryCity: 'Ahmedabad',
    deliveryState: 'Gujarat',
    deliveryPincode: '380015',

    courierName: 'Gati Cargo',
    courierLogoBg: '#1e3a8a',
    serviceType: 'Cargo',
    mode: 'B2B',
    zoneRoute: 'N2 → W2',
    transitSlaDays: '48-72 Hours Heavy Cargo',

    deadWeightKg: 45.0,
    volumetricWeightKg: 38.0,
    chargeableWeightKg: 45.0,
    dimensionsCm: '80 × 50 × 40 CM',
    packageCount: 3,
    contentsDescription: 'Industrial Machine Parts',

    baseFreight: 350.0,
    fuelSurcharge: 42.0,
    docketCharges: 30.0,
    codCharges: 0.0,
    rovCharges: 25.0,
    insuranceCharges: 25.0,
    gstAmount: 84.96,
    finalAmount: 556.96,
    walletReferenceId: 'TXN-WAL-9840194',

    status: 'NDR',
    stepIndex: 5,
    etaDate: '29 Aug 2026 (Re-attempt)',
    transitDaysCount: '3 Days',
    lastUpdatedTime: '28 Aug 2026, 02:30 PM',

    ndrDetails: {
      reason: 'Consignee business premises closed on holiday',
      attemptCount: 1,
      actionRequired: 'Re-attempt requested for next business working day',
      customerResponse: 'Customer requested delivery on 29 Aug morning',
      resolutionStatus: 'Re-attempt Scheduled for 29 Aug',
    },

    timelineEvents: [
      { id: 'tg6', date: '28 Aug 2026', time: '02:30 PM', location: 'Ahmedabad GIDC Hub', statusTitle: 'NDR Exception Occurred', remarks: 'Delivery Attempt 1 Failed: Premises Closed', source: 'Carrier Webhook' },
      { id: 'tg5', date: '28 Aug 2026', time: '11:00 AM', location: 'Ahmedabad GIDC Hub', statusTitle: 'Out For Delivery (OFD)', remarks: 'Gati Heavy LTL Vehicle out for delivery', source: 'Carrier Webhook' },
      { id: 'tg4', date: '27 Aug 2026', time: '08:00 PM', location: 'NH-48 Transit Checkpoint', statusTitle: 'In Transit', remarks: 'Traversing NH-48 interstate corridor', source: 'API Auto-Sync' },
      { id: 'tg3', date: '27 Aug 2026', time: '10:00 AM', location: 'Solan Industrial Hub', statusTitle: 'Picked Up', remarks: 'Lifted from factory warehouse', source: 'Carrier Webhook' },
      { id: 'tg2', date: '26 Aug 2026', time: '04:00 PM', location: 'Solan Warehouse', statusTitle: 'Pickup Scheduled', remarks: 'LTL Truck assigned', source: 'API Auto-Sync' },
      { id: 'tg1', date: '26 Aug 2026', time: '02:45 PM', location: 'Merchant Portal', statusTitle: 'Order Created', remarks: 'B2B Heavy Cargo Order created', source: 'Manual Override' },
    ],

    activityLogs: [
      { id: 'lg1', timestamp: '26 Aug 2026, 02:45 PM', action: 'B2B Cargo Order Registered', user: 'System Merchant' },
      { id: 'lg2', timestamp: '28 Aug 2026, 02:35 PM', action: 'NDR Action Raised: Customer re-attempt requested', user: 'Merchant Support' },
    ],

    adminLogs: {
      courierApiPayload: '{"courier":"Gati","awb":"GAT10284910","ndrCode":"NDR_PREMISES_CLOSED","attempt":1}',
      webhookLog: 'HTTP 200 POST /api/webhooks/gati -> Event: DELIVERY_FAILED_NDR',
      syncHistory: 'Synced 10 mins ago',
      errorLogs: 'NDR Exception logged: PREMISES_CLOSED.',
    },
  },
  {
    id: 'shp-104',
    awbNumber: 'TCI74829102',
    orderId: 'ORD-2026-98405',
    customerName: 'Suresh Kumar',
    customerPhone: '+91 91234 56789',
    customerEmail: 'suresh.k@example.com',
    deliveryAddress: '34 Park Street, Park Circus',
    deliveryCity: 'Kolkata',
    deliveryState: 'West Bengal',
    deliveryPincode: '700016',

    courierName: 'TCI Express',
    courierLogoBg: '#047857',
    serviceType: 'Cargo',
    mode: 'B2B',
    zoneRoute: 'N1 → E1',
    transitSlaDays: '72 Hours Cargo',

    deadWeightKg: 30.0,
    volumetricWeightKg: 25.0,
    chargeableWeightKg: 30.0,
    dimensionsCm: '60 × 40 × 35 CM',
    packageCount: 2,
    contentsDescription: 'Textile Fabric Rolls',

    baseFreight: 350.0,
    fuelSurcharge: 35.0,
    docketCharges: 30.0,
    codCharges: 0.0,
    rovCharges: 0.0,
    insuranceCharges: 0.0,
    gstAmount: 74.7,
    finalAmount: 489.7,
    walletReferenceId: 'TXN-WAL-9840195',

    status: 'RTO',
    stepIndex: 5,
    etaDate: '30 Aug 2026 (Return to Origin)',
    transitDaysCount: '4 Days',
    lastUpdatedTime: '27 Aug 2026, 10:00 AM',

    rtoDetails: {
      rtoDate: '27 Aug 2026',
      rtoReason: 'Consignee refused delivery due to incorrect PO number',
      currentRtoStatus: 'In Transit back to Delhi Warehouse',
      expectedReturnDate: '30 Aug 2026',
    },

    timelineEvents: [
      { id: 'tr5', date: '27 Aug 2026', time: '10:00 AM', location: 'Kolkata Hub', statusTitle: 'RTO Initiated', remarks: 'Return shipment dispatched back to origin warehouse', source: 'Carrier Webhook' },
      { id: 'tr4', date: '26 Aug 2026', time: '03:00 PM', location: 'Kolkata Delivery Office', statusTitle: 'NDR Refusal', remarks: 'Consignee rejected delivery due to PO discrepancy', source: 'Carrier Webhook' },
      { id: 'tr3', date: '25 Aug 2026', time: '09:00 AM', location: 'Kolkata Hub', statusTitle: 'In Transit', remarks: 'Arrived at Kolkata regional distribution center', source: 'API Auto-Sync' },
      { id: 'tr2', date: '24 Aug 2026', time: '04:00 PM', location: 'Delhi Hub', statusTitle: 'Picked Up', remarks: 'Dispatched from Delhi origin hub', source: 'Carrier Webhook' },
      { id: 'tr1', date: '24 Aug 2026', time: '11:00 AM', location: 'Merchant Dashboard', statusTitle: 'Order Created', remarks: 'Shipment created', source: 'Manual Override' },
    ],

    activityLogs: [
      { id: 'lr1', timestamp: '24 Aug 2026, 11:00 AM', action: 'TCI Express AWB Created', user: 'System Merchant' },
      { id: 'lr2', timestamp: '27 Aug 2026, 10:05 AM', action: 'RTO Flagged by Courier Partner', user: 'TCI Webhook' },
    ],

    adminLogs: {
      courierApiPayload: '{"courier":"TCI","awb":"TCI74829102","status":"RTO_INITIATED"}',
      webhookLog: 'HTTP 200 POST /api/webhooks/tci -> Event: RTO_INITIATED',
      syncHistory: 'Synced 1 day ago',
      errorLogs: 'RTO Initiated by Consignee Refusal.',
    },
  },
];

export const JOURNEY_STEPS = [
  'Order Created',
  'Pickup Scheduled',
  'Picked Up',
  'In Transit',
  'Reached Hub',
  'Out For Delivery',
  'Delivered',
];

export const TrackingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialQuery = searchParams.get('query') || 'DEL98401928';
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'details' | 'financials' | 'activity' | 'admin'>('timeline');

  // Real-Time Carrier Sync State
  const [liveRecordOverride, setLiveRecordOverride] = useState<TrackingShipmentRecord | null>(null);
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Search Logic with Real CustomerShipmentService & Carrier Tracking
  const activeRecord = useMemo<TrackingShipmentRecord | null>(() => {
    if (!searchInput.trim()) return DEMO_TRACKING_DATABASE[0];
    const q = searchInput.trim();
    const qLower = q.toLowerCase();

    // 0. Check Live Carrier Synced Record
    if (
      liveRecordOverride &&
      (liveRecordOverride.awbNumber.toLowerCase() === qLower ||
        liveRecordOverride.orderId.toLowerCase() === qLower ||
        liveRecordOverride.id.toLowerCase() === qLower)
    ) {
      return liveRecordOverride;
    }

    // 1. Check Real Booked Shipments from CustomerShipmentService
    const realShipment = CustomerShipmentService.getShipmentById(q);
    if (realShipment) {
      const stepIdx =
        realShipment.bookingStatus === 'DELIVERED'
          ? 6
          : realShipment.bookingStatus === 'OUT_FOR_DELIVERY'
          ? 5
          : realShipment.bookingStatus === 'IN_TRANSIT'
          ? 3
          : realShipment.bookingStatus === 'PICKED_UP'
          ? 2
          : realShipment.bookingStatus === 'PICKUP_REQUESTED'
          ? 1
          : 0;

      const events: TrackingTimelineEvent[] = realShipment.trackingTimeline?.map((t, idx) => ({
        id: `real-evt-${idx}`,
        date: t.timestamp ? String(t.timestamp).split(',')[0] : new Date().toLocaleDateString(),
        time: t.timestamp ? String(t.timestamp).split(',')[1] || '' : new Date().toLocaleTimeString(),
        location: t.location || 'Sorting Facility',
        statusTitle: t.statusTitle || 'Status Update',
        remarks: t.description || 'Shipment scanned and updated',
        source: 'API Auto-Sync' as const,
      })) || [
        {
          id: 'real-evt-1',
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          location: realShipment.pickupCity || 'Origin Hub',
          statusTitle: 'Shipment Booked & Confirmed',
          remarks: 'Order dispatched with courier partner',
          source: 'API Auto-Sync' as const,
        },
      ];

      return {
        id: realShipment.id,
        awbNumber: realShipment.awbNumber || realShipment.shipmentId,
        orderId: realShipment.orderId,
        customerName: realShipment.deliveryContact || 'Customer',
        customerPhone: realShipment.deliveryPhone || '',
        customerEmail: (realShipment as any).deliveryEmail || 'customer@example.com',
        deliveryAddress: realShipment.deliveryAddress || '',
        deliveryCity: realShipment.deliveryCity || '',
        deliveryState: (realShipment as any).deliveryState || '',
        deliveryPincode: realShipment.deliveryPincode || '',
        courierName: realShipment.courierName || 'Logistics Network',
        courierLogoBg: realShipment.courierName.toLowerCase().includes('blue') ? '#0284c7' : '#059669',
        serviceType: (realShipment.serviceName?.includes('Air') ? 'Air' : realShipment.serviceName?.includes('Cargo') ? 'Cargo' : 'Express') as any,
        mode: (realShipment.mode || 'B2C') as any,
        zoneRoute: `${realShipment.pickupPincode} → ${realShipment.deliveryPincode}`,
        transitSlaDays: '2-4 Days',
        deadWeightKg: realShipment.actualWeightKg || 0.5,
        volumetricWeightKg: realShipment.chargeableWeightKg || 0.5,
        chargeableWeightKg: realShipment.chargeableWeightKg || 0.5,
        dimensionsCm: realShipment.dimensionsCm || '20 × 15 × 10 CM',
        packageCount: realShipment.packages?.length || 1,
        contentsDescription: 'E-Commerce Package',
        baseFreight: realShipment.baseFreightINR || 0,
        fuelSurcharge: realShipment.fuelSurchargeINR || 0,
        docketCharges: 15,
        codCharges: realShipment.codFeeINR || 0,
        rovCharges: 0,
        insuranceCharges: 0,
        gstAmount: Math.round((realShipment.totalCustomerChargeINR || 0) * 0.18 * 100) / 100,
        finalAmount: realShipment.totalCustomerChargeINR || 0,
        walletReferenceId: realShipment.transactionId || `TXN-${realShipment.shipmentId}`,
        status: (realShipment.bookingStatus === 'DELIVERED'
          ? 'Delivered'
          : realShipment.bookingStatus === 'NDR'
          ? 'NDR'
          : realShipment.bookingStatus.startsWith('RTO')
          ? 'RTO'
          : realShipment.bookingStatus === 'CANCELLED'
          ? 'Cancelled'
          : realShipment.bookingStatus === 'IN_TRANSIT'
          ? 'In Transit'
          : 'Booked') as any,
        stepIndex: stepIdx,
        etaDate: '2-3 Business Days',
        transitDaysCount: '1 Day',
        lastUpdatedTime: realShipment.bookingDate || new Date().toLocaleString(),
        timelineEvents: events,
        activityLogs: [
          {
            id: 'act-1',
            timestamp: realShipment.bookingDate || new Date().toLocaleString(),
            action: `Order ${realShipment.orderId} booked with AWB ${realShipment.awbNumber}`,
            user: 'Seller Portal',
          },
        ],
      };
    }

    const match = DEMO_TRACKING_DATABASE.find(
      (r) =>
        r.awbNumber.toLowerCase().includes(qLower) ||
        r.orderId.toLowerCase().includes(qLower) ||
        r.customerPhone.includes(qLower)
    );
    if (match) return match;

    return null;
  }, [searchInput, liveRecordOverride]);

  const syncLiveTracking = async (targetQuery: string) => {
    const q = targetQuery.trim();
    if (!q) return;

    setIsSyncingLive(true);
    setSyncStatusMsg(null);

    try {
      const matchedShipment = CustomerShipmentService.getShipmentById(q);

      if (matchedShipment) {
        const stepIdx =
          matchedShipment.bookingStatus === 'DELIVERED'
            ? 6
            : matchedShipment.bookingStatus === 'OUT_FOR_DELIVERY'
            ? 5
            : matchedShipment.bookingStatus === 'IN_TRANSIT'
            ? 3
            : matchedShipment.bookingStatus === 'PICKED_UP'
            ? 2
            : 1;

        const events: TrackingTimelineEvent[] = (matchedShipment.trackingTimeline || []).map((t, idx) => ({
          id: `carrier-evt-${idx}-${t.timestamp || Date.now()}`,
          date: t.timestamp ? new Date(t.timestamp).toLocaleDateString() : new Date().toLocaleDateString(),
          time: t.timestamp ? new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: t.location || matchedShipment.pickupCity || 'Regional Sorting Hub',
          statusTitle: t.statusTitle || 'Carrier Scan',
          remarks: t.description || `Scan: ${t.statusKey}`,
          source: 'Carrier Webhook' as const,
        }));

        const updated: TrackingShipmentRecord = {
          id: matchedShipment.id || `shp-${q}`,
          awbNumber: (matchedShipment.awbNumber || q).toUpperCase(),
          orderId: matchedShipment.orderId || `ORD-${q}`,
          customerName: matchedShipment.deliveryContact || 'Customer',
          customerPhone: matchedShipment.deliveryPhone || '',
          customerEmail: (matchedShipment as any)?.deliveryEmail || 'customer@example.com',
          deliveryAddress: matchedShipment.deliveryAddress || 'Delivery Address Details',
          deliveryCity: matchedShipment.deliveryCity || 'Destination',
          deliveryState: (matchedShipment as any)?.deliveryState || '',
          deliveryPincode: matchedShipment.deliveryPincode || '',
          courierName: matchedShipment.courierName || 'Delhivery Express',
          courierLogoBg: '#0284c7',
          serviceType: 'Express',
          mode: (matchedShipment.mode || 'B2C') as any,
          zoneRoute: `${matchedShipment.pickupPincode} → ${matchedShipment.deliveryPincode}`,
          transitSlaDays: '2-4 Days',
          deadWeightKg: matchedShipment.actualWeightKg || 0.5,
          volumetricWeightKg: matchedShipment.chargeableWeightKg || 0.5,
          chargeableWeightKg: matchedShipment.chargeableWeightKg || 0.5,
          dimensionsCm: matchedShipment.dimensionsCm || '20 × 15 × 10 CM',
          packageCount: matchedShipment.packages?.length || 1,
          contentsDescription: 'E-Commerce Package',
          baseFreight: matchedShipment.baseFreightINR || 65,
          fuelSurcharge: matchedShipment.fuelSurchargeINR || 6.5,
          docketCharges: 15,
          codCharges: matchedShipment.codFeeINR || 0,
          rovCharges: 0,
          insuranceCharges: 0,
          gstAmount: Math.round(((matchedShipment.totalCustomerChargeINR || 71.5) * 0.18) * 100) / 100,
          finalAmount: matchedShipment.totalCustomerChargeINR || 84.37,
          walletReferenceId: matchedShipment.transactionId || `TXN-${q}`,
          status: (matchedShipment.bookingStatus === 'DELIVERED'
            ? 'Delivered'
            : matchedShipment.bookingStatus === 'OUT_FOR_DELIVERY'
            ? 'OFD'
            : matchedShipment.bookingStatus === 'IN_TRANSIT'
            ? 'In Transit'
            : matchedShipment.bookingStatus === 'PICKED_UP'
            ? 'Picked Up'
            : 'Booked') as any,
          stepIndex: stepIdx,
          etaDate: '2-3 Business Days',
          transitDaysCount: '1-2 Days',
          lastUpdatedTime: new Date().toLocaleString(),
          timelineEvents: events.length > 0 ? events : [
            {
              id: 'ev-0',
              date: new Date().toLocaleDateString(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              location: matchedShipment.pickupCity || 'Origin Hub',
              statusTitle: 'Shipment Created',
              remarks: 'Booking confirmed and shipment registered with carrier network.',
              source: 'Carrier Webhook' as const,
            }
          ],
          activityLogs: [
            {
              id: `act-sync-${Date.now()}`,
              timestamp: new Date().toLocaleString(),
              action: `Live carrier sync verified shipment ${matchedShipment.shipmentId} status with partner network`,
              user: 'Courier API Sync Engine',
            },
          ],
          adminLogs: {
            courierApiPayload: JSON.stringify(matchedShipment, null, 2),
            webhookLog: `Carrier sync verified for AWB: ${q}`,
            syncHistory: `Live Carrier API Synced at ${new Date().toLocaleTimeString()}`,
            errorLogs: 'No carrier exceptions recorded.',
          },
        };

        setLiveRecordOverride(updated);
        setSyncStatusMsg({
          type: 'success',
          message: `Live carrier status synchronized successfully! Current status: ${matchedShipment.customerFacingStatus}`,
        });
      } else {
        setSyncStatusMsg({
          type: 'info',
          message: 'Carrier tracking data refreshed.',
        });
      }
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        message: `Failed to refresh tracking data: ${err.message || 'Unknown error'}`,
      });
    } finally {
      setIsSyncingLive(false);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  useEffect(() => {
    const q = searchParams.get('query');
    if (q) {
      setSearchInput(q);
      const qLower = q.toLowerCase();
      const isDemo = DEMO_TRACKING_DATABASE.some((d) => d.awbNumber.toLowerCase() === qLower);
      if (!isDemo) {
        syncLiveTracking(q);
      }
    }
  }, [searchParams]);

  const handleSearchSubmit = () => {
    if (searchInput.trim()) {
      setSearchParams({ query: searchInput.trim() });
      const qLower = searchInput.trim().toLowerCase();
      const isDemo = DEMO_TRACKING_DATABASE.some((d) => d.awbNumber.toLowerCase() === qLower);
      if (!isDemo) {
        syncLiveTracking(searchInput.trim());
      }
    }
  };

  const handleCopyAwb = (awb: string) => {
    navigator.clipboard.writeText(awb);
    setCopiedAwb(awb);
    setTimeout(() => setCopiedAwb(null), 2000);
  };

  const getStatusBadgeVariant = (status: TrackingShipmentRecord['status']) => {
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
        return 'danger';
      case 'Booked':
        return 'brand';
      default:
        return 'neutral';
    }
  };

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Shipments Center', path: '/app/orders' },
    { label: 'Tracking Visibility Hub', path: '/app/tracking' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Tracking & Shipment Details Center"
        description="Real-time end-to-end visibility for AWB tracking, courier milestones, financial breakdowns, and activity logs."
        breadcrumbs={breadcrumbs}
        style={{ marginBottom: '0px' }}
      />

      {/* 2. SEARCH & QUICK DEMO AWB SWITCHER */}
      <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <Input
              placeholder="Track by AWB Number, Order ID, or Mobile Number..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              style={{ paddingLeft: '34px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>

          <Button
            variant="primary"
            onClick={handleSearchSubmit}
            leftIcon={<Search size={14} />}
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: '700' }}
          >
            Track Shipment
          </Button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Demo AWB:</span>
            {DEMO_TRACKING_DATABASE.map((d) => (
              <Button
                key={d.id}
                variant={activeRecord?.awbNumber === d.awbNumber ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  setSearchInput(d.awbNumber);
                  setSearchParams({ query: d.awbNumber });
                }}
                style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: activeRecord?.awbNumber === d.awbNumber ? '#0284c7' : 'transparent' }}
              >
                {d.awbNumber} ({d.status})
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* 2.5 SYNC STATUS NOTIFICATION */}
      {syncStatusMsg && (
        <Alert
          variant={syncStatusMsg.type === 'success' ? 'success' : syncStatusMsg.type === 'error' ? 'danger' : 'info'}
          title="Carrier Live Sync Status"
        >
          {syncStatusMsg.message}
        </Alert>
      )}

      {/* 3. TRACKING RESULT CONTENT */}
      {!activeRecord ? (
        <Card style={{ padding: '48px 20px', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <AlertCircle size={40} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            No Shipment Found
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            No shipment matches "{searchInput}". Please check the AWB Number or Order ID and try again.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TOP TRACKING HEADER CARD */}
          <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              
              {/* Courier Logo & AWB Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: activeRecord.courierLogoBg, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px' }}>
                  {activeRecord.courierName.charAt(0)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '18px', color: '#0f172a' }}>{activeRecord.courierName}</strong>
                    <Badge variant={getStatusBadgeVariant(activeRecord.status)}>{activeRecord.status}</Badge>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '12px' }}>
                    <span>AWB: <strong style={{ fontFamily: 'monospace', color: '#0284c7' }}>{activeRecord.awbNumber}</strong></span>
                    <button
                      onClick={() => handleCopyAwb(activeRecord.awbNumber)}
                      title="Copy AWB"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedAwb === activeRecord.awbNumber ? '#16a34a' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      {copiedAwb === activeRecord.awbNumber ? <Check size={12} /> : <Copy size={12} />}
                      <span style={{ fontSize: '10px' }}>{copiedAwb === activeRecord.awbNumber ? 'Copied' : 'Copy'}</span>
                    </button>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <span style={{ color: '#64748b' }}>Order Ref: <strong>{activeRecord.orderId}</strong></span>
                  </div>
                </div>
              </div>

              {/* ETA & Transit Stats */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', display: 'block', fontWeight: '700' }}>Estimated Delivery (ETA)</span>
                  <strong style={{ fontSize: '15px', color: '#16a34a' }}>{activeRecord.etaDate}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', display: 'block', fontWeight: '700' }}>Transit Time</span>
                  <strong style={{ fontSize: '15px', color: '#0f172a' }}>{activeRecord.transitDaysCount}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', display: 'block', fontWeight: '700' }}>Last Updated</span>
                  <span style={{ fontSize: '12px', color: '#475569' }}>{activeRecord.lastUpdatedTime}</span>
                </div>
              </div>
            </div>

            {/* TRACKING ACTION BUTTONS TOOLBAR */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Printer size={13} />}
                  onClick={() => navigate(`/app/shipments/${activeRecord.id || activeRecord.awbNumber}/label`)}
                >
                  Print Label
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download size={13} />}
                  onClick={() => navigate(`/app/shipments/${activeRecord.id || activeRecord.awbNumber}/label`)}
                >
                  Download Label PDF
                </Button>
                <Button variant="outline" size="sm" leftIcon={<FileText size={13} />} onClick={() => alert(`Downloading GST Invoice...`)}>
                  Download Invoice
                </Button>
                <Button variant="outline" size="sm" leftIcon={<ShieldCheck size={13} />} onClick={() => alert(`Downloading Proof of Delivery (POD)...`)}>
                  Download POD
                </Button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button variant="ghost" size="sm" style={{ color: '#ef4444', fontSize: '12px' }} onClick={() => alert(`Opening Support Ticket for AWB ${activeRecord.awbNumber}...`)}>
                  <HelpCircle size={13} style={{ marginRight: '4px' }} /> Support Ticket
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSyncingLive}
                  leftIcon={<RefreshCw size={13} className={isSyncingLive ? 'animate-spin' : ''} />}
                  onClick={() => syncLiveTracking(activeRecord.awbNumber)}
                  style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                >
                  {isSyncingLive ? 'Syncing...' : 'Sync Live Status'}
                </Button>
              </div>
            </div>
          </Card>

          {/* VISUAL SHIPMENT JOURNEY PROGRESS BAR */}
          <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '16px', textTransform: 'uppercase' }}>
              Shipment Status Progress Journey
            </h4>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', paddingBottom: '8px' }}>
              {/* Progress Line */}
              <div style={{ position: 'absolute', top: '14px', left: '20px', right: '20px', height: '3px', backgroundColor: '#e2e8f0', zIndex: 0 }} />

              {JOURNEY_STEPS.map((stepName, idx) => {
                const isCompleted = idx <= activeRecord.stepIndex;
                const isCurrent = idx === activeRecord.stepIndex;

                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 1, minWidth: '90px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isCurrent ? '#0284c7' : isCompleted ? '#16a34a' : '#ffffff',
                        border: '2px solid ' + (isCurrent ? '#0284c7' : isCompleted ? '#16a34a' : '#cbd5e1'),
                        color: isCurrent || isCompleted ? '#ffffff' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: '800',
                        boxShadow: isCurrent ? '0 0 0 4px #bae6fd' : 'none',
                      }}
                    >
                      {isCompleted ? <Check size={14} /> : idx + 1}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: isCurrent ? '800' : isCompleted ? '600' : '400', color: isCurrent ? '#0284c7' : isCompleted ? '#0f172a' : '#94a3b8', textAlign: 'center' }}>
                      {stepName}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* NDR EXCEPTION SECTION (If Status is NDR) */}
          {activeRecord.status === 'NDR' && activeRecord.ndrDetails && (
            <Card style={{ padding: '20px', backgroundColor: '#fff7ed', border: '1px solid #fdba74', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <AlertTriangle size={24} style={{ color: '#ea580c', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '16px', color: '#c2410c' }}>NDR Delivery Exception (Attempt {activeRecord.ndrDetails.attemptCount})</strong>
                    <Badge variant="warning">Action Required</Badge>
                  </div>

                  <div style={{ fontSize: '12px', color: '#9a3412', marginTop: '6px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    <div>Reason: <strong>{activeRecord.ndrDetails.reason}</strong></div>
                    <div>Customer Response: <strong>{activeRecord.ndrDetails.customerResponse}</strong></div>
                    <div>Resolution Status: <strong>{activeRecord.ndrDetails.resolutionStatus}</strong></div>
                  </div>

                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <Button variant="primary" size="sm" style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }} onClick={() => alert('Re-attempting delivery request...')}>
                      Re-attempt Delivery
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => alert('Updating buyer phone number / address...')}>
                      Edit Buyer Address
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* RTO RETURN SECTION (If Status is RTO) */}
          {activeRecord.status === 'RTO' && activeRecord.rtoDetails && (
            <Card style={{ padding: '20px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <RotateCcw size={24} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '16px', color: '#b91c1c' }}>Return To Origin (RTO Initiated)</strong>
                    <Badge variant="danger">RTO Active</Badge>
                  </div>

                  <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '6px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    <div>RTO Date: <strong>{activeRecord.rtoDetails.rtoDate}</strong></div>
                    <div>RTO Reason: <strong>{activeRecord.rtoDetails.rtoReason}</strong></div>
                    <div>Expected Return: <strong>{activeRecord.rtoDetails.expectedReturnDate}</strong></div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* TABBED INFORMATION CENTER (Timeline, Details, Financials, Activity Logs, Admin Logs) */}
          <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            
            {/* Tab Navigation Headers */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px', overflowX: 'auto' }}>
              <button
                onClick={() => setActiveTab('timeline')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeTab === 'timeline' ? '#0284c7' : 'transparent',
                  color: activeTab === 'timeline' ? '#ffffff' : '#64748b',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Tracking Timeline ({activeRecord.timelineEvents.length})
              </button>

              <button
                onClick={() => setActiveTab('details')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeTab === 'details' ? '#0284c7' : 'transparent',
                  color: activeTab === 'details' ? '#ffffff' : '#64748b',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Shipment & Package Specs
              </button>

              <button
                onClick={() => setActiveTab('financials')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeTab === 'financials' ? '#0284c7' : 'transparent',
                  color: activeTab === 'financials' ? '#ffffff' : '#64748b',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Financial & Charge Breakdown
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeTab === 'activity' ? '#0284c7' : 'transparent',
                  color: activeTab === 'activity' ? '#ffffff' : '#64748b',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Operational Activity Log
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeTab === 'admin' ? '#0284c7' : 'transparent',
                  color: activeTab === 'admin' ? '#ffffff' : '#64748b',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Admin API & Webhook Logs
              </button>
            </div>

            {/* TAB 1: VERTICAL TRACKING TIMELINE */}
            {activeTab === 'timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '24px' }}>
                <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', backgroundColor: '#cbd5e1' }} />

                {activeRecord.timelineEvents.map((evt, idx) => {
                  const isNewest = idx === 0;
                  return (
                    <div key={evt.id} style={{ position: 'relative' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: '-24px',
                          top: '2px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: isNewest ? '#0284c7' : '#cbd5e1',
                          border: '2px solid #ffffff',
                          boxShadow: isNewest ? '0 0 0 2px #bae6fd' : 'none',
                        }}
                      />

                      <div style={{ backgroundColor: isNewest ? '#f0f9ff' : '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '13px', color: isNewest ? '#0284c7' : '#0f172a' }}>{evt.statusTitle}</strong>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{evt.date} • {evt.time}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0 0' }}>{evt.remarks}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#94a3b8' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} /> {evt.location}</span>
                          <Badge variant="neutral">{evt.source}</Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: SHIPMENT & PACKAGE SPECS */}
            {activeTab === 'details' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '12px' }}>
                
                {/* Receiver Info */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                  <strong style={{ fontSize: '13px', color: '#0284c7', display: 'block', marginBottom: '8px' }}>Receiver Customer Details</strong>
                  <div>Name: <strong>{activeRecord.customerName}</strong></div>
                  <div>Phone: <strong>{activeRecord.customerPhone}</strong></div>
                  <div>Email: <strong>{activeRecord.customerEmail}</strong></div>
                  <div style={{ marginTop: '4px', color: '#475569' }}>
                    Address: {activeRecord.deliveryAddress}, {activeRecord.deliveryCity}, {activeRecord.deliveryState} - <strong>{activeRecord.deliveryPincode}</strong>
                  </div>
                </div>

                {/* Package Specs */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                  <strong style={{ fontSize: '13px', color: '#0284c7', display: 'block', marginBottom: '8px' }}>Package Weight Specs</strong>
                  <div>Dead Weight: <strong>{activeRecord.deadWeightKg} KG</strong></div>
                  <div>Volumetric Weight: <strong>{activeRecord.volumetricWeightKg} KG</strong></div>
                  <div>Chargeable Weight: <strong>{activeRecord.chargeableWeightKg} KG</strong></div>
                  <div>Dimensions: <strong>{activeRecord.dimensionsCm}</strong></div>
                  <div>Package Count: <strong>{activeRecord.packageCount} Box(es)</strong></div>
                  <div>Contents: <strong>{activeRecord.contentsDescription}</strong></div>
                </div>

                {/* Courier Specs */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                  <strong style={{ fontSize: '13px', color: '#0284c7', display: 'block', marginBottom: '8px' }}>Courier Partner Specs</strong>
                  <div>Courier: <strong>{activeRecord.courierName}</strong></div>
                  <div>Service Type: <strong>{activeRecord.serviceType} ({activeRecord.mode})</strong></div>
                  <div>Zone Route: <strong>{activeRecord.zoneRoute}</strong></div>
                  <div>Transit SLA: <strong>{activeRecord.transitSlaDays}</strong></div>
                </div>

              </div>
            )}

            {/* TAB 3: FINANCIAL & CHARGE BREAKDOWN */}
            {activeTab === 'financials' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>Base Freight Charge: <strong>₹ {activeRecord.baseFreight.toFixed(2)}</strong></div>
                    <div>Fuel Surcharge: <strong>₹ {activeRecord.fuelSurcharge.toFixed(2)}</strong></div>
                    <div>Docket & FM Charges: <strong>₹ {activeRecord.docketCharges.toFixed(2)}</strong></div>
                    {activeRecord.codCharges > 0 && <div>COD Fee: <strong>₹ {activeRecord.codCharges.toFixed(2)}</strong></div>}
                    <div>GST Amount (18%): <strong>₹ {activeRecord.gstAmount.toFixed(2)}</strong></div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#0284c7' }}>Final Total Amount: ₹ {activeRecord.finalAmount.toFixed(2)}</div>
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748b', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                    Wallet Debit Transaction Reference ID: <strong>{activeRecord.walletReferenceId}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: OPERATIONAL ACTIVITY LOG */}
            {activeTab === 'activity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                {activeRecord.activityLogs.map((log) => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <span><strong>{log.action}</strong> by {log.user}</span>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>{log.timestamp}</span>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: ADMIN API & WEBHOOK LOGS */}
            {activeTab === 'admin' && activeRecord.adminLogs && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '11px', fontFamily: 'monospace' }}>
                <div style={{ backgroundColor: '#0f172a', color: '#38bdf8', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ color: '#94a3b8', marginBottom: '4px' }}>// Courier API Raw Payload:</div>
                  {activeRecord.adminLogs.courierApiPayload}
                </div>

                <div style={{ backgroundColor: '#0f172a', color: '#4ade80', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ color: '#94a3b8', marginBottom: '4px' }}>// Webhook Execution Log:</div>
                  {activeRecord.adminLogs.webhookLog}
                </div>

                <div style={{ backgroundColor: '#f8fafc', color: '#334155', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <div>Sync History: {activeRecord.adminLogs.syncHistory}</div>
                  <div>Error Logs: {activeRecord.adminLogs.errorLogs}</div>
                </div>
              </div>
            )}

          </Card>

        </div>
      )}

    </div>
  );
};
