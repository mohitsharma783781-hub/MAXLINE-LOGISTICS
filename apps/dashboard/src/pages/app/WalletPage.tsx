import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Search,
  FileSpreadsheet,
  ShieldCheck,
  Package,
  Truck,
  ExternalLink,
  Clock,
  Layers,
  Receipt,
  FileText,
  Copy,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Button,
  Card,
  Badge,
  Table,
  Alert,
  Modal,
  Input,
  Select,
  Drawer,
  Pagination,
} from '../../components/ui';
import {
  type Wallet,
  type WalletTransaction,
  type TransactionType,
} from '../../types/wallet';
import { WalletService } from '../../mocks/wallet.mock';
import {
  CustomerShipmentService,
  type CustomerShipmentDetail,
} from '../../services/customerShipmentService';
import { formatCurrency } from '../../utils/formatters';
import { useTenant } from '../../context/TenantContext';
import { RazorpayService } from '../../services/razorpayService';

type WalletTab = 'transactions' | 'shipment_charges';

export const WalletPage: React.FC = () => {
  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId;

  // Active Tab
  const [activeTab, setActiveTab] = useState<WalletTab>('transactions');

  // Wallet State
  const [wallet, setWallet] = useState<Wallet>(() => WalletService.getWallet(tenantId));
  const [transactions, setTransactions] = useState<WalletTransaction[]>(() =>
    WalletService.getTransactions(undefined, tenantId)
  );
  const [shipments, setShipments] = useState<CustomerShipmentDetail[]>(() =>
    CustomerShipmentService.getShipments(tenantId)
  );
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Recharge Modal State
  const [rechargeAmount, setRechargeAmount] = useState<string>('1000');
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isRecharging, setIsRecharging] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{
    variant: 'success' | 'danger' | 'warning' | 'info';
    title: string;
    text: string;
  } | null>(null);

  // TAB A: Transactions Filter State
  const [txSearch, setTxSearch] = useState('');
  const [txDirection, setTxDirection] = useState<'all' | 'CREDIT' | 'DEBIT'>('all');
  const [txType, setTxType] = useState<string>('all');
  const [txDateRange, setTxDateRange] = useState<'all' | 'today' | 'last7' | 'last30'>('all');
  const [txPage, setTxPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);

  // TAB B: Shipment Charges Filter State
  const [shpSearch, setShpSearch] = useState('');
  const [shpCourier, setShpCourier] = useState<string>('all');
  const [shpMode, setShpMode] = useState<string>('all');
  const [shpStatus, setShpStatus] = useState<string>('all');
  const [shpPage, setShpPage] = useState(1);
  const [selectedShipment, setSelectedShipment] = useState<CustomerShipmentDetail | null>(null);
  const [copiedAwb, setCopiedAwb] = useState<boolean>(false);

  const pageSize = 10;

  // Sync data from Supabase Cloud DB on mount & tenant switch
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    Promise.all([
      WalletService.syncFromSupabase(tenantId),
      CustomerShipmentService.syncFromSupabase(tenantId),
    ])
      .then(([cloudWallet, cloudShipments]) => {
        if (!mounted) return;
        setWallet({ ...cloudWallet });
        setTransactions(WalletService.getTransactions(undefined, tenantId));
        setShipments(cloudShipments || []);
        setIsCloudSynced(true);
      })
      .catch((err) => {
        console.warn('[WalletPage] Sync fallback warning:', err);
        if (!mounted) return;
        setWallet(WalletService.getWallet(tenantId));
        setTransactions(WalletService.getTransactions(undefined, tenantId));
        setShipments(CustomerShipmentService.getShipments(tenantId));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [tenantId]);

  // Refresh data explicitly
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [cloudWallet, cloudShipments] = await Promise.all([
        WalletService.syncFromSupabase(tenantId),
        CustomerShipmentService.syncFromSupabase(tenantId),
      ]);
      setWallet({ ...cloudWallet });
      setTransactions(WalletService.getTransactions(undefined, tenantId));
      setShipments(cloudShipments || []);
      setIsCloudSynced(true);
    } catch {
      setWallet(WalletService.getWallet(tenantId));
      setTransactions(WalletService.getTransactions(undefined, tenantId));
      setShipments(CustomerShipmentService.getShipments(tenantId));
    } finally {
      setIsLoading(false);
    }
  };

  // Top Summary Cards (Authoritative accounting figures)
  const summaryStats = useMemo(() => {
    const stats = WalletService.getWalletSummaryStats(tenantId);
    return stats;
  }, [wallet, transactions, tenantId]);

  // TAB A: Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter((tx) => {
      if (!tx) return false;

      // Direction filter
      if (txDirection !== 'all' && tx.direction !== txDirection) return false;

      // Type filter
      if (txType !== 'all') {
        if (txType === 'FREIGHT_DEBIT' || txType === 'SHIPMENT_CHARGE') {
          if (tx.type !== 'FREIGHT_DEBIT' && tx.type !== 'SHIPMENT_CHARGE') return false;
        } else if (tx.type !== txType) {
          return false;
        }
      }

      // Date Range filter
      if (txDateRange !== 'all') {
        const txDate = new Date(tx?.createdAt || 0).getTime();
        const now = Date.now();
        if (isNaN(txDate)) {
          // keep
        } else if (txDateRange === 'today') {
          const oneDayAgo = now - 24 * 60 * 60 * 1000;
          if (txDate < oneDayAgo) return false;
        } else if (txDateRange === 'last7') {
          const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
          if (txDate < sevenDaysAgo) return false;
        } else if (txDateRange === 'last30') {
          const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
          if (txDate < thirtyDaysAgo) return false;
        }
      }

      // Search Query filter
      if (txSearch.trim()) {
        const q = txSearch.toLowerCase().trim();
        const match =
          (tx.id || '').toLowerCase().includes(q) ||
          (tx.referenceId || '').toLowerCase().includes(q) ||
          (tx.description || '').toLowerCase().includes(q) ||
          (tx.idempotencyKey || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [transactions, txDirection, txType, txDateRange, txSearch]);

  const totalTxPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (txPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, txPage, pageSize]);

  // TAB B: Filtered Shipment Charges
  const filteredShipments = useMemo(() => {
    return shipments.filter((shp) => {
      // Courier filter
      if (shpCourier !== 'all') {
        const cName = (shp.courierName || '').toLowerCase();
        if (!cName.includes(shpCourier.toLowerCase())) return false;
      }

      // Mode filter (B2C / B2B)
      if (shpMode !== 'all' && shp.mode !== shpMode) return false;

      // Status filter
      if (shpStatus !== 'all') {
        if (shpStatus === 'CHARGED') {
          if ((shp.totalCustomerChargeINR || 0) <= 0) return false;
        } else if (shpStatus === 'NOT_CHARGED') {
          if ((shp.totalCustomerChargeINR || 0) > 0) return false;
        } else if (shpStatus === 'CANCELLED') {
          if (shp.bookingStatus !== 'CANCELLED' && shp.bookingStatus !== 'CANCEL_REQUESTED') return false;
        }
      }

      // Search filter
      if (shpSearch.trim()) {
        const q = shpSearch.toLowerCase().trim();
        const match =
          (shp.awbNumber || '').toLowerCase().includes(q) ||
          (shp.orderId || '').toLowerCase().includes(q) ||
          (shp.shipmentId || '').toLowerCase().includes(q) ||
          (shp.deliveryCity || '').toLowerCase().includes(q) ||
          (shp.deliveryPincode || '').includes(q) ||
          (shp.pickupPincode || '').includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [shipments, shpCourier, shpMode, shpStatus, shpSearch]);

  const totalShpPages = Math.ceil(filteredShipments.length / pageSize) || 1;
  const paginatedShipments = useMemo(() => {
    const start = (shpPage - 1) * pageSize;
    return filteredShipments.slice(start, start + pageSize);
  }, [filteredShipments, shpPage, pageSize]);

  // Execute Razorpay Add Money
  const handleExecuteRecharge = async () => {
    const amt = parseFloat(rechargeAmount);
    if (!amt || isNaN(amt) || amt < 1) {
      setAlertMessage({
        variant: 'warning',
        title: 'Invalid Amount',
        text: 'Please enter a valid amount of at least ₹1.00.',
      });
      return;
    }

    setIsRecharging(true);

    try {
      await RazorpayService.openCheckout({
        amountINR: amt,
        name: 'MAXLINE LOGISTICS',
        description: `Wallet Balance Recharge: ₹${amt.toLocaleString('en-IN')}`,
        notes: {
          tenantId,
          purpose: 'WALLET_RECHARGE',
        },
        onSuccess: async (data) => {
          setIsRechargeModalOpen(false);
          setIsRecharging(false);
          await refreshData();
          setAlertMessage({
            variant: 'success',
            title: 'Recharge Successful',
            text: `₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })} credited to your wallet via Razorpay (Payment ID: ${data.payment_id}).`,
          });
          setTimeout(() => setAlertMessage(null), 8000);
        },
        onError: (err) => {
          setIsRecharging(false);
          setAlertMessage({
            variant: 'danger',
            title: 'Payment Failed',
            text: err.message || 'Payment could not be completed. Please try again.',
          });
          setTimeout(() => setAlertMessage(null), 8000);
        },
        onDismiss: () => {
          setIsRecharging(false);
        },
      });
    } catch (err: any) {
      setIsRecharging(false);
      setAlertMessage({
        variant: 'danger',
        title: 'Checkout Error',
        text: err?.message || 'Failed to initialize payment gateway.',
      });
      setTimeout(() => setAlertMessage(null), 8000);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (activeTab === 'transactions') {
      if (filteredTransactions.length === 0) {
        alert('No wallet transactions available to export.');
        return;
      }

      const headers = [
        'Transaction ID',
        'Date & Time',
        'Type',
        'Direction',
        'Reference / AWB',
        'Amount (INR)',
        'Balance Before (INR)',
        'Balance After (INR)',
        'Status',
        'Description',
      ];

      const rows = filteredTransactions.filter(Boolean).map((tx) => [
        `"${tx?.id || ''}"`,
        `"${tx?.createdAt || ''}"`,
        tx.type,
        tx.direction,
        `"${tx.referenceId || ''}"`,
        (tx.direction === 'CREDIT' ? '+' : '-') + (tx.amountMinor / 100).toFixed(2),
        (tx.balanceBeforeMinor / 100).toFixed(2),
        (tx.balanceAfterMinor / 100).toFixed(2),
        tx.status,
        `"${(tx.description || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Wallet_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } else {
      if (filteredShipments.length === 0) {
        alert('No shipment billing records available to export.');
        return;
      }

      const headers = [
        'AWB Number',
        'Order ID',
        'Booking Date',
        'Courier',
        'Shipment Type',
        'Weight (kg)',
        'Base Freight (INR)',
        'Fuel Surcharge (INR)',
        'Additional Charges (INR)',
        'GST (INR)',
        'Total Shipping Charge (INR)',
        'Payment Status',
        'Origin Pincode',
        'Destination Pincode',
      ];

      const rows = filteredShipments.map((s) => {
        const additional = Math.max(0, (s.totalCustomerChargeINR || 0) - (s.baseFreightINR || 0) - (s.fuelSurchargeINR || 0));
        return [
          `"${s.awbNumber || 'PENDING'}"`,
          `"${s.orderId}"`,
          `"${s.bookingDate}"`,
          `"${s.courierName}"`,
          s.mode,
          (s.chargeableWeightKg || 0.5).toFixed(2),
          (s.baseFreightINR || 0).toFixed(2),
          (s.fuelSurchargeINR || 0).toFixed(2),
          additional.toFixed(2),
          '0.00',
          (s.totalCustomerChargeINR || 0).toFixed(2),
          (s.totalCustomerChargeINR || 0) > 0 ? 'Charged' : 'Not Charged',
          s.pickupPincode || '',
          s.deliveryPincode || '',
        ];
      });

      const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Shipment_Charges_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAwb(true);
    setTimeout(() => setCopiedAwb(false), 2000);
  };

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Finance & Wallet', path: '/app/wallet' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Wallet & Transactions"
        description="Comprehensive prepaid balance control, real-time audit ledger, and shipment-wise freight charges."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {isCloudSynced && (
              <Badge
                variant="success"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  padding: '6px 10px',
                  fontWeight: 500,
                  backgroundColor: '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                }}
              >
                <ShieldCheck size={14} /> Cloud Synced
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<FileSpreadsheet size={15} />}
              style={{ borderColor: '#cbd5e1', color: '#334155', backgroundColor: '#ffffff' }}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRechargeModalOpen(true)}
              leftIcon={<Plus size={15} />}
              style={{ fontWeight: 600, padding: '7px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              + Add Money
            </Button>
          </div>
        }
      />

      {/* ALERT BANNERS */}
      {alertMessage && (
        <Alert variant={alertMessage.variant} title={alertMessage.title}>
          {alertMessage.text}
        </Alert>
      )}

      {summaryStats.isLowBalance && (
        <Alert variant="warning" title="Low Wallet Balance Warning">
          Your available wallet balance ({formatCurrency(summaryStats.availableBalanceINR)}) is below the recommended threshold ({formatCurrency(summaryStats.lowBalanceThresholdINR)}). Please add funds to ensure uninterrupted dispatch.
        </Alert>
      )}

      {/* 2. TOP SUMMARY KPI CARDS (White background, professional typography, INR formatted) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Available Balance */}
        <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Available Balance
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <WalletIcon size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
            {formatCurrency(summaryStats.availableBalanceINR)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <Badge variant={summaryStats.isLowBalance ? 'warning' : 'success'} style={{ fontSize: '11px', padding: '2px 7px' }}>
              {summaryStats.isLowBalance ? 'LOW BALANCE' : 'ACTIVE'}
            </Badge>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Usable prepaid shipping funds</span>
          </div>
        </Card>

        {/* Total Added */}
        <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Added
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#16a34a', letterSpacing: '-0.5px' }}>
            {formatCurrency(summaryStats.totalAddedINR)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            Successful recharges & credits
          </div>
        </Card>

        {/* Total Deducted */}
        <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Deducted
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#dc2626', letterSpacing: '-0.5px' }}>
            {formatCurrency(summaryStats.totalUsedINR)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            Spent on shipment charges & adjustments
          </div>
        </Card>

        {/* Amount On Hold */}
        <Card style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Amount On Hold
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#fffbeb', color: '#d97706' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#475569', letterSpacing: '-0.5px' }}>
            {formatCurrency(summaryStats.reservedBalanceINR || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            Reserved for pending bookings
          </div>
        </Card>
      </div>

      {/* 3. TWO MAIN TABS (Shipfy-Style Separation) */}
      <div style={{ borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '32px' }}>
        <button
          onClick={() => setActiveTab('transactions')}
          style={{
            padding: '12px 4px',
            fontSize: '15px',
            fontWeight: activeTab === 'transactions' ? 600 : 500,
            color: activeTab === 'transactions' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'transactions' ? '2px solid #2563eb' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Receipt size={17} />
          Wallet Transactions
          <span
            style={{
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: '10px',
              backgroundColor: activeTab === 'transactions' ? '#eff6ff' : '#f1f5f9',
              color: activeTab === 'transactions' ? '#2563eb' : '#64748b',
              fontWeight: 600,
            }}
          >
            {transactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('shipment_charges')}
          style={{
            padding: '12px 4px',
            fontSize: '15px',
            fontWeight: activeTab === 'shipment_charges' ? 600 : 500,
            color: activeTab === 'shipment_charges' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'shipment_charges' ? '2px solid #2563eb' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Truck size={17} />
          Shipment Charges
          <span
            style={{
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: '10px',
              backgroundColor: activeTab === 'shipment_charges' ? '#eff6ff' : '#f1f5f9',
              color: activeTab === 'shipment_charges' ? '#2563eb' : '#64748b',
              fontWeight: 600,
            }}
          >
            {shipments.length}
          </span>
        </button>
      </div>

      {/* 4. TAB A CONTENT: WALLET TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Filters Bar */}
          <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'center' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <Input
                  placeholder="Search Transaction ID, Reference / AWB, or description..."
                  value={txSearch}
                  onChange={(e) => {
                    setTxSearch(e.target.value);
                    setTxPage(1);
                  }}
                  leadingIcon={<Search size={16} />}
                />
              </div>

              <div>
                <Select
                  value={txDirection}
                  onChange={(e) => {
                    setTxDirection(e.target.value as any);
                    setTxPage(1);
                  }}
                  options={[
                    { label: 'Direction: All', value: 'all' },
                    { label: 'Credit (+)', value: 'CREDIT' },
                    { label: 'Debit (-)', value: 'DEBIT' },
                  ]}
                />
              </div>

              <div>
                <Select
                  value={txType}
                  onChange={(e) => {
                    setTxType(e.target.value);
                    setTxPage(1);
                  }}
                  options={[
                    { label: 'Type: All Types', value: 'all' },
                    { label: 'Recharge', value: 'RECHARGE' },
                    { label: 'Shipment Debit', value: 'FREIGHT_DEBIT' },
                    { label: 'Refund', value: 'REFUND' },
                    { label: 'Weight Adjustment', value: 'WEIGHT_ADJUSTMENT' },
                    { label: 'COD Remittance', value: 'COD_REMITTANCE_CREDIT' },
                    { label: 'Manual Adjustment', value: 'MANUAL_CREDIT' },
                  ]}
                />
              </div>

              <div>
                <Select
                  value={txDateRange}
                  onChange={(e) => {
                    setTxDateRange(e.target.value as any);
                    setTxPage(1);
                  }}
                  options={[
                    { label: 'Date: All Time', value: 'all' },
                    { label: 'Today', value: 'today' },
                    { label: 'Last 7 Days', value: 'last7' },
                    { label: 'Last 30 Days', value: 'last30' },
                  ]}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTxSearch('');
                    setTxDirection('all');
                    setTxType('all');
                    setTxDateRange('all');
                    setTxPage(1);
                  }}
                  leftIcon={<RotateCcw size={14} />}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </Card>

          {/* Transactions Table */}
          <Card style={{ padding: '0', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
            <Table
              columns={[
                {
                  key: 'date',
                  header: 'Date & Time',
                  render: (row: unknown) => {
                    const tx = (row || {}) as WalletTransaction;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                          {tx?.createdAt || '—'}
                        </span>
                      </div>
                    );
                  },
                },
                {
                  key: 'id',
                  header: 'Transaction ID',
                  render: (row: unknown) => {
                    const tx = (row || {}) as WalletTransaction;
                    const txId = tx?.id || '';
                    return (
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          color: '#475569',
                          backgroundColor: '#f8fafc',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {txId.length > 20 ? `${txId.slice(0, 10)}...${txId.slice(-6)}` : txId || '—'}
                      </span>
                    );
                  },
                },
                {
                  key: 'reference',
                  header: 'Reference / AWB',
                  render: (row: unknown) => {
                    const tx = (row || {}) as WalletTransaction;
                    const ref = tx?.referenceId || 'N/A';
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Badge variant="outline" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                          {tx?.referenceType || tx?.type || 'TX'}
                        </Badge>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#334155' }}>{ref}</span>
                      </div>
                    );
                  },
                },
                {
                  key: 'description',
                  header: 'Description',
                  render: (row: unknown) => {
                    const tx = (row || {}) as WalletTransaction;
                    return (
                      <span style={{ fontSize: '13px', color: '#334155', maxWidth: '280px', display: 'inline-block' }}>
                        {tx?.description || '—'}
                      </span>
                    );
                  },
                },
                {
                  key: 'credit',
                  header: 'Credit (+)',
                  render: (row: unknown) => {
                    const tx = (row || {}) as WalletTransaction;
                    if (tx?.direction === 'CREDIT') {
                      return (
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>
                          +{formatCurrency((tx?.amountMinor || 0) / 100)}
                        </span>
                      );
                    }
                    return <span style={{ color: '#cbd5e1' }}>—</span>;
                  },
                },
                {
                  key: 'debit',
                  header: 'Debit (-)',
                  render: (row: unknown) => {
                    const tx = (row || {}) as WalletTransaction;
                    if (tx?.direction === 'DEBIT') {
                      return (
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>
                          -{formatCurrency((tx?.amountMinor || 0) / 100)}
                        </span>
                      );
                    }
                    return <span style={{ color: '#cbd5e1' }}>—</span>;
                  },
                },
                {
                  key: 'balanceAfter',
                  header: 'Balance After',
                  render: (row: unknown) => {
                    const tx = (row || {}) as WalletTransaction;
                    return (
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                        {formatCurrency((tx?.balanceAfterMinor || 0) / 100)}
                      </span>
                    );
                  },
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row: unknown) => {
                    const tx = (row || {}) as WalletTransaction;
                    return (
                      <Badge variant="success" style={{ fontSize: '11px', padding: '3px 8px' }}>
                        {tx?.status || 'POSTED'}
                      </Badge>
                    );
                  },
                },
                {
                  key: 'action',
                  header: '',
                  render: (row: unknown) => {
                    const tx = (row || {}) as WalletTransaction;
                    return (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => tx && setSelectedTx(tx)}
                        style={{ fontSize: '12px', padding: '4px 8px', color: '#2563eb' }}
                      >
                        View Details
                      </Button>
                    );
                  },
                },
              ]}
              data={paginatedTransactions as unknown as Record<string, unknown>[]}
              keyExtractor={(row) => ((row as any)?.id || (row as any)?.referenceId || Math.random())}
              emptyMessage={
                isLoading
                  ? 'Synchronizing wallet ledger...'
                  : 'No wallet transactions found matching your filters.'
              }
            />

            {/* Pagination */}
            {totalTxPages > 1 && (
              <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                <Pagination currentPage={txPage} totalPages={totalTxPages} onPageChange={setTxPage} />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 5. TAB B CONTENT: SHIPMENT CHARGES */}
      {activeTab === 'shipment_charges' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Filters Bar */}
          <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'center' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <Input
                  placeholder="Search AWB, Order ID, destination city or pincode..."
                  value={shpSearch}
                  onChange={(e) => {
                    setShpSearch(e.target.value);
                    setShpPage(1);
                  }}
                  leadingIcon={<Search size={16} />}
                />
              </div>

              <div>
                <Select
                  value={shpCourier}
                  onChange={(e) => {
                    setShpCourier(e.target.value);
                    setShpPage(1);
                  }}
                  options={[
                    { label: 'Courier: All Partners', value: 'all' },
                    { label: 'Delhivery', value: 'delhivery' },
                    { label: 'BlueDart', value: 'bluedart' },
                    { label: 'GATI', value: 'gati' },
                  ]}
                />
              </div>

              <div>
                <Select
                  value={shpMode}
                  onChange={(e) => {
                    setShpMode(e.target.value);
                    setShpPage(1);
                  }}
                  options={[
                    { label: 'Type: All Modes', value: 'all' },
                    { label: 'B2C Express', value: 'B2C' },
                    { label: 'B2B Cargo', value: 'B2B' },
                  ]}
                />
              </div>

              <div>
                <Select
                  value={shpStatus}
                  onChange={(e) => {
                    setShpStatus(e.target.value);
                    setShpPage(1);
                  }}
                  options={[
                    { label: 'Status: All', value: 'all' },
                    { label: 'Charged', value: 'CHARGED' },
                    { label: 'Not Charged', value: 'NOT_CHARGED' },
                    { label: 'Cancelled', value: 'CANCELLED' },
                  ]}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShpSearch('');
                    setShpCourier('all');
                    setShpMode('all');
                    setShpStatus('all');
                    setShpPage(1);
                  }}
                  leftIcon={<RotateCcw size={14} />}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </Card>

          {/* Shipment Charges Table */}
          <Card style={{ padding: '0', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
            <Table
              columns={[
                {
                  key: 'awb',
                  header: 'AWB / Order ID',
                  render: (row: unknown) => {
                    const s = (row || {}) as CustomerShipmentDetail;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                          {s?.awbNumber || 'AWB PENDING'}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Order: {s?.orderId || '—'}
                        </span>
                      </div>
                    );
                  },
                },
                {
                  key: 'bookingDate',
                  header: 'Booking Date',
                  render: (row: unknown) => {
                    const s = (row || {}) as CustomerShipmentDetail;
                    return <span style={{ fontSize: '13px', color: '#334155' }}>{s?.bookingDate || '—'}</span>;
                  },
                },
                {
                  key: 'courier',
                  header: 'Courier',
                  render: (row: unknown) => {
                    const s = (row || {}) as CustomerShipmentDetail;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Truck size={14} color="#64748b" />
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>
                          {s?.courierName || 'Delhivery Surface'}
                        </span>
                      </div>
                    );
                  },
                },
                {
                  key: 'type',
                  header: 'Shipment Type',
                  render: (row: unknown) => {
                    const s = (row || {}) as CustomerShipmentDetail;
                    return (
                      <Badge variant={s?.mode === 'B2B' ? 'warning' : 'primary'} style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {s?.mode || 'B2C'}
                      </Badge>
                    );
                  },
                },
                {
                  key: 'weight',
                  header: 'Weight',
                  render: (row: unknown) => {
                    const s = (row || {}) as CustomerShipmentDetail;
                    return (
                      <span style={{ fontSize: '13px', color: '#334155' }}>
                        {((s?.chargeableWeightKg || s?.actualWeightKg || 0.5)).toFixed(2)} kg
                      </span>
                    );
                  },
                },
                {
                  key: 'baseFreight',
                  header: 'Base Freight',
                  render: (row: unknown) => {
                    const s = (row || {}) as CustomerShipmentDetail;
                    return (
                      <span style={{ fontSize: '13px', color: '#334155' }}>
                        {formatCurrency(s?.baseFreightINR || 0)}
                      </span>
                    );
                  },
                },
                {
                  key: 'additional',
                  header: 'Additional Charges',
                  render: (row: unknown) => {
                    const s = (row || {}) as CustomerShipmentDetail;
                    const add = Math.max(0, (s?.totalCustomerChargeINR || 0) - (s?.baseFreightINR || 0));
                    return (
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        {formatCurrency(add)}
                      </span>
                    );
                  },
                },
                {
                  key: 'gst',
                  header: 'GST',
                  render: () => {
                    return <span style={{ fontSize: '13px', color: '#64748b' }}>₹0.00</span>;
                  },
                },
                {
                  key: 'totalCharge',
                  header: 'Total Shipping Charge',
                  render: (row: unknown) => {
                    const s = (row || {}) as CustomerShipmentDetail;
                    return (
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                        {formatCurrency(s?.totalCustomerChargeINR || 0)}
                      </span>
                    );
                  },
                },
                {
                  key: 'paymentStatus',
                  header: 'Payment Status',
                  render: (row: unknown) => {
                    const s = (row || {}) as CustomerShipmentDetail;
                    const isCharged = (s?.totalCustomerChargeINR || 0) > 0;
                    return (
                      <Badge
                        variant={isCharged ? 'success' : 'outline'}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          backgroundColor: isCharged ? '#f0fdf4' : '#f8fafc',
                          color: isCharged ? '#15803d' : '#64748b',
                          borderColor: isCharged ? '#bbf7d0' : '#cbd5e1',
                        }}
                      >
                        {isCharged ? 'Charged' : 'Not Charged'}
                      </Badge>
                    );
                  },
                },
                {
                  key: 'action',
                  header: '',
                  render: (row: unknown) => {
                    const s = (row || {}) as CustomerShipmentDetail;
                    return (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => s && setSelectedShipment(s)}
                        style={{ fontSize: '12px', padding: '4px 8px', color: '#2563eb' }}
                      >
                        View Breakdown
                      </Button>
                    );
                  },
                },
              ]}
              data={paginatedShipments as unknown as Record<string, unknown>[]}
              keyExtractor={(row) => ((row as any)?.id || (row as any)?.shipmentId || (row as any)?.awbNumber || Math.random())}
              emptyMessage={
                isLoading
                  ? 'Loading shipment billing records...'
                  : 'No shipment billing charges found.'
              }
            />

            {/* Pagination */}
            {totalShpPages > 1 && (
              <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                <Pagination currentPage={shpPage} totalPages={totalShpPages} onPageChange={setShpPage} />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 6. TRANSACTION DETAILS DRAWER (TAB A) */}
      <Drawer
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title="Transaction Audit Record"
      >
        {selectedTx && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px' }}>
            {/* Amount Banner */}
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: selectedTx.direction === 'CREDIT' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${selectedTx.direction === 'CREDIT' ? '#bbf7d0' : '#fecaca'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: selectedTx.direction === 'CREDIT' ? '#166534' : '#991b1b', textTransform: 'uppercase' }}>
                  {selectedTx.direction === 'CREDIT' ? 'Credit Added' : 'Debit Deduction'}
                </span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: selectedTx.direction === 'CREDIT' ? '#15803d' : '#b91c1c' }}>
                  {selectedTx.direction === 'CREDIT' ? '+' : '-'}
                  {formatCurrency(selectedTx.amountMinor / 100)}
                </div>
              </div>
              <Badge variant={selectedTx.status === 'POSTED' ? 'success' : 'warning'}>
                {selectedTx.status}
              </Badge>
            </div>

            {/* Transaction Properties */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Transaction ID</span>
                <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>{selectedTx.id}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Date & Time</span>
                <span style={{ fontSize: '13px', color: '#0f172a' }}>{selectedTx?.createdAt || '—'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Transaction Type</span>
                <Badge variant="outline">{selectedTx.type}</Badge>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Reference ID</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{selectedTx.referenceId || 'N/A'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Balance Before</span>
                <span style={{ fontSize: '13px', color: '#475569' }}>{formatCurrency(selectedTx.balanceBeforeMinor / 100)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Balance After</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(selectedTx.balanceAfterMinor / 100)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Idempotency Key</span>
                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#64748b' }}>{selectedTx.idempotencyKey || 'N/A'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Dispatched By</span>
                <span style={{ fontSize: '13px', color: '#0f172a' }}>{selectedTx.actorType || 'SYSTEM'}</span>
              </div>

              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Description</span>
                <div style={{ marginTop: '4px', fontSize: '13px', color: '#334155', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  {selectedTx.description}
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* 7. SHIPMENT CHARGE BREAKDOWN DRAWER (TAB B) */}
      <Drawer
        isOpen={!!selectedShipment}
        onClose={() => setSelectedShipment(null)}
        title="Shipment Billing & Rate Breakdown"
      >
        {selectedShipment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px' }}>
            {/* AWB Card */}
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Delhivery Waybill</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                    {selectedShipment.awbNumber || 'PENDING'}
                  </div>
                </div>
                {selectedShipment.awbNumber && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedShipment.awbNumber || '')}
                    leftIcon={copiedAwb ? <CheckCircle2 size={14} color="#16a34a" /> : <Copy size={14} />}
                  >
                    {copiedAwb ? 'Copied' : 'Copy'}
                  </Button>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                Order Ref: <strong>{selectedShipment.orderId}</strong> • Shipment: {selectedShipment.shipmentId}
              </div>
            </div>

            {/* Courier & Route */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Route & Package Specs
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Origin</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{selectedShipment.pickupCity || 'Origin'} ({selectedShipment.pickupPincode || 'N/A'})</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Destination</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{selectedShipment.deliveryCity || 'Destination'} ({selectedShipment.deliveryPincode || 'N/A'})</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '4px' }}>
                <div style={{ padding: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Actual Weight</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{(selectedShipment.actualWeightKg || 0.5).toFixed(2)} kg</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Chargeable</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{(selectedShipment.chargeableWeightKg || 0.5).toFixed(2)} kg</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Mode</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{selectedShipment.mode || 'B2C'} Express</div>
                </div>
              </div>
            </div>

            {/* Itemized Charge Breakdown Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Itemized Rate Breakdown
              </span>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                  <span style={{ fontSize: '13px', color: '#334155' }}>Base Freight</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{formatCurrency(selectedShipment.baseFreightINR || 0)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                  <span style={{ fontSize: '13px', color: '#334155' }}>Fuel Surcharge</span>
                  <span style={{ fontSize: '13px', color: '#0f172a' }}>{formatCurrency(selectedShipment.fuelSurchargeINR || 0)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                  <span style={{ fontSize: '13px', color: '#334155' }}>COD Fee</span>
                  <span style={{ fontSize: '13px', color: '#0f172a' }}>{formatCurrency(selectedShipment.codFeeINR || 0)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                  <span style={{ fontSize: '13px', color: '#334155' }}>Docket & Network Surcharges</span>
                  <span style={{ fontSize: '13px', color: '#0f172a' }}>
                    {formatCurrency(
                      Math.max(
                        0,
                        (selectedShipment.totalCustomerChargeINR || 0) -
                          (selectedShipment.baseFreightINR || 0) -
                          (selectedShipment.fuelSurchargeINR || 0) -
                          (selectedShipment.codFeeINR || 0)
                      )
                    )}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                  <span style={{ fontSize: '13px', color: '#334155' }}>GST (Goods & Services Tax)</span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>₹0.00</span>
                </div>

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#f8fafc' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Total Shipping Charge</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#2563eb' }}>
                    {formatCurrency(selectedShipment.totalCustomerChargeINR || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Wallet Audit Link */}
            <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <CheckCircle2 size={16} color="#15803d" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#15803d' }}>
                  Debited from Merchant Wallet
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#166534' }}>
                Payment Method: <strong>Prepaid Balance Deduction</strong> • Ref: {selectedShipment.shipmentId}
              </div>
              <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>
                Charged At: {selectedShipment.bookingDate}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* 8. ADD MONEY RECHARGE MODAL (Preserves Existing Razorpay Integration) */}
      <Modal
        isOpen={isRechargeModalOpen}
        onClose={() => {
          if (!isRecharging) setIsRechargeModalOpen(false);
        }}
        title="Add Money to Seller Wallet"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-2)' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Instant balance recharge via Razorpay Secure Checkout (UPI, Cards, NetBanking).
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Recharge Amount (INR)
            </label>
            <Input
              type="number"
              placeholder="Enter amount (e.g. 1000)"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
              disabled={isRecharging}
              min="1"
            />
          </div>

          {/* Quick presets */}
          <div>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>
              Quick Presets:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['500', '1000', '2000', '5000', '10000'].map((val) => (
                <Button
                  key={val}
                  type="button"
                  variant={rechargeAmount === val ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setRechargeAmount(val)}
                  disabled={isRecharging}
                >
                  ₹{parseInt(val, 10).toLocaleString('en-IN')}
                </Button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-2)' }}>
            <Button
              variant="outline"
              onClick={() => setIsRechargeModalOpen(false)}
              disabled={isRecharging}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExecuteRecharge}
              isLoading={isRecharging}
              disabled={isRecharging}
            >
              {isRecharging ? 'Processing...' : `Pay ₹${parseFloat(rechargeAmount || '0').toLocaleString('en-IN')}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default WalletPage;
