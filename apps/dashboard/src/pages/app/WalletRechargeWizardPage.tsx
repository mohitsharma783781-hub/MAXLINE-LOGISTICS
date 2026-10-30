import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, CheckCircle2, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Input,
} from '../../components/ui';
import { WalletService } from '../../mocks/wallet.mock';
import { WalletRechargeService, type WalletRechargeRecord } from '../../services/walletRechargeService';
import { OnboardingService } from '../../services/onboardingService';
import { useTenant } from '../../context/TenantContext';
import { RazorpayService } from '../../services/razorpayService';

export const WalletRechargeWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId;

  // Step 1: Select Amount
  const [selectedPreset, setSelectedPreset] = useState<number | null>(1000);
  const [customAmount, setCustomAmount] = useState('1000');
  const [activeStep, setActiveStep] = useState<'amount' | 'checkout' | 'success' | 'failed'>('amount');

  // Step 2: Intent & Test Simulation
  const [rechargeRecord, setRechargeRecord] = useState<WalletRechargeRecord | null>(null);
  const [testMode, setTestMode] = useState<'SUCCESS' | 'FAILED' | 'PENDING' | 'MISMATCH'>('SUCCESS');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [finalWalletBalance, setFinalWalletBalance] = useState<number | null>(null);

  const wallet = WalletService.getWallet(tenantId);
  const currentBalanceINR = wallet.availableBalanceMinor / 100;

  const currentAmountINR = selectedPreset || parseFloat(customAmount) || 0;

  const handleSelectPreset = (amt: number) => {
    setSelectedPreset(amt);
    setCustomAmount(amt.toString());
  };

  const handleProceedToSummary = () => {
    if (currentAmountINR < 1) {
      alert('Please enter a valid recharge amount of at least ₹1.00.');
      return;
    }

    const newRecord: WalletRechargeRecord = {
      id: `rch-${Date.now()}`,
      rechargeId: `RCH-${Math.floor(1000000 + Math.random() * 9000000)}`,
      tenantId,
      amountINR: currentAmountINR,
      expectedAmountINR: currentAmountINR,
      paymentFeeINR: 0,
      payableAmountINR: currentAmountINR,
      paymentStatus: 'CREATED',
      paymentProvider: 'Razorpay',
      createdAt: new Date().toLocaleString(),
    };

    setRechargeRecord(newRecord);
    setActiveStep('checkout');
  };

  const handleExecutePayment = async () => {
    if (!rechargeRecord) return;
    setIsProcessing(true);

    try {
      await RazorpayService.openCheckout({
        amountINR: rechargeRecord.amountINR,
        name: 'MAXLINE LOGISTICS',
        description: `Wallet Recharge: ₹${rechargeRecord.amountINR.toFixed(2)} (${rechargeRecord.rechargeId})`,
        receipt: rechargeRecord.rechargeId,
        notes: {
          tenantId,
          rechargeId: rechargeRecord.rechargeId,
        },
        onSuccess: (data) => {
          // Credit the wallet upon verified payment
          const newTx = WalletService.recharge(rechargeRecord.amountINR, `Razorpay (${data.payment_id})`, tenantId);
          const updatedWallet = WalletService.getWallet(tenantId);
          setFinalWalletBalance(updatedWallet.availableBalanceMinor / 100);

          rechargeRecord.paymentStatus = 'SUCCESS';
          rechargeRecord.providerPaymentId = data.payment_id;
          rechargeRecord.walletTransactionId = newTx.id;
          rechargeRecord.completedAt = new Date().toLocaleString();

          setIsProcessing(false);
          setActiveStep('success');
        },
        onError: (err) => {
          setIsProcessing(false);
          setResultMessage(err.message || 'Razorpay payment was declined or failed.');
          setActiveStep('failed');
        },
        onDismiss: () => {
          setIsProcessing(false);
        },
      });
    } catch (err: any) {
      setIsProcessing(false);
      setResultMessage(err?.message || 'Failed to open Razorpay payment gateway.');
      setActiveStep('failed');
    }
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Wallet', path: '/app/wallet' },
    { label: 'Recharge Wallet', path: '/app/wallet/recharge' },
  ];

  if (activeStep === 'success' && rechargeRecord) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
        <Card style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <div style={{ padding: '16px', borderRadius: '50%', backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)', display: 'inline-flex', marginBottom: 'var(--space-4)' }}>
            <CheckCircle2 size={48} />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text)' }}>
            Payment & Wallet Recharge Successful!
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '14px' }}>
            Recharge Reference: <strong>{rechargeRecord.rechargeId}</strong>
          </p>

          <Card style={{ padding: 'var(--space-5)', margin: 'var(--space-6) 0', textAlign: 'left', backgroundColor: 'var(--color-surface-secondary)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', fontSize: '13px' }}>
              <div>Recharged Amount: <strong style={{ color: 'var(--color-violet-main)' }}>₹{rechargeRecord.amountINR.toFixed(2)}</strong></div>
              <div>Payment Status: <Badge variant="success">SUCCESS</Badge></div>
              <div>Gateway Ref ID: <strong>{rechargeRecord.providerPaymentId}</strong></div>
              <div>New Wallet Balance: <strong>₹{(finalWalletBalance || currentBalanceINR).toFixed(2)}</strong></div>
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <Button variant="outline" onClick={() => navigate('/app/wallet')}>
              Go to Wallet Overview
            </Button>
            <Button variant="primary" onClick={() => { setActiveStep('amount'); setRechargeRecord(null); }}>
              Recharge Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (activeStep === 'failed' && rechargeRecord) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
        <Card style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <div style={{ padding: '16px', borderRadius: '50%', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', display: 'inline-flex', marginBottom: 'var(--space-4)' }}>
            <AlertTriangle size={48} />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text)' }}>
            Payment Authorization Failed
          </h2>
          <p style={{ color: 'var(--color-danger)', marginTop: '4px', fontSize: '14px' }}>
            {resultMessage || 'Your payment was not completed. Your merchant wallet has NOT been credited.'}
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', marginTop: 'var(--space-6)' }}>
            <Button variant="outline" leftIcon={<ArrowLeft size={16} />} onClick={() => setActiveStep('amount')}>
              Back to Recharge Options
            </Button>
            <Button variant="primary" leftIcon={<RefreshCw size={16} />} onClick={() => setActiveStep('checkout')}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Recharge Merchant Wallet"
        description="Add funds to your prepaid wallet balance with instant server-verified payment credits."
        breadcrumbs={breadcrumbs}
      />

      {/* 2. Wallet Balance Banner */}
      <Card style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-violet-light)', border: '1px solid var(--color-violet-main)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Wallet size={24} style={{ color: 'var(--color-violet-main)' }} />
            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Current Available Balance</span>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-violet-main)', margin: 0 }}>
                ₹{currentBalanceINR.toFixed(2)}
              </h3>
            </div>
          </div>
          <Badge variant="success">PREPAID ACCOUNT</Badge>
        </div>
      </Card>

      {/* 3. STEP 1: AMOUNT SELECTION */}
      {activeStep === 'amount' && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
            1. Select Recharge Amount (INR)
          </h4>

          {/* Quick Presets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 'var(--space-3)' }}>
            {[500, 1000, 2000, 5000, 10000].map((amt) => {
              const isSelected = selectedPreset === amt;
              return (
                <button
                  key={amt}
                  onClick={() => handleSelectPreset(amt)}
                  style={{
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-default)',
                    border: isSelected ? '2px solid var(--color-violet-main)' : '1px solid var(--color-border)',
                    backgroundColor: isSelected ? 'var(--color-violet-light)' : 'var(--color-surface)',
                    color: isSelected ? 'var(--color-violet-main)' : 'var(--color-text)',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  ₹{amt.toLocaleString()}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 'var(--space-5)', maxWidth: '300px' }}>
            <Input
              label="Or Enter Custom Amount (₹) *"
              type="number"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedPreset(null);
              }}
              placeholder="e.g. 1500"
            />
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginTop: '2px' }}>
              Minimum recharge amount: ₹100
            </span>
          </div>

          <Button variant="primary" style={{ marginTop: 'var(--space-6)' }} onClick={handleProceedToSummary}>
            Proceed to Payment Summary →
          </Button>
        </Card>
      )}

      {/* 4. STEP 2: SUMMARY & MOCK PAYMENT */}
      {activeStep === 'checkout' && rechargeRecord && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
            2. Payment Summary & Gateway Authorization
          </h4>

          <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-default)', backgroundColor: 'var(--color-surface-secondary)', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Recharge Intent ID:</span>
              <strong>{rechargeRecord.rechargeId}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Recharge Amount:</span>
              <strong>₹{rechargeRecord.amountINR.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Payment Processing Fee:</span>
              <strong style={{ color: 'var(--color-success)' }}>₹0.00 (FREE)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--color-border)', fontSize: '16px' }}>
              <strong>Total Payable Amount:</strong>
              <strong style={{ color: 'var(--color-violet-main)' }}>₹{rechargeRecord.payableAmountINR.toFixed(2)}</strong>
            </div>
          </div>

          {/* Razorpay Gateway Information */}
          <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', borderRadius: 'var(--radius-default)', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🔒</span>
            <div>
              <strong style={{ fontSize: '13px', color: '#1e40af', display: 'block' }}>
                Razorpay Standard Web Checkout
              </strong>
              <span style={{ fontSize: '12px', color: '#3b82f6' }}>
                Instant wallet activation upon successful payment. Supports UPI, Cards, NetBanking, and Wallets.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <Button variant="outline" onClick={() => setActiveStep('amount')} disabled={isProcessing}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleExecutePayment}
              disabled={isProcessing}
              style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
            >
              {isProcessing ? 'Opening Razorpay...' : `Pay ₹${rechargeRecord.payableAmountINR.toFixed(2)} with Razorpay →`}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
