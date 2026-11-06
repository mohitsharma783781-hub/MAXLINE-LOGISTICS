import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ShieldCheck, MapPin, Wallet, UserCheck, X } from 'lucide-react';
import { CustomerWarehouseService } from '../../services/customerWarehouseService';
import { WalletService } from '../../mocks/wallet.mock';
import { supabase } from '../../lib/supabaseClient';
import { toValidTenantUUID } from '../../utils/uuidHelper';

interface OnboardingTrackerCardProps {
  customerId?: string;
  autoHideIfComplete?: boolean;
}

export const OnboardingTrackerCard: React.FC<OnboardingTrackerCardProps> = ({
  customerId = '',
  autoHideIfComplete = true,
}) => {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  // Status checks
  const [isKycDone, setIsKycDone] = useState(false);
  const [isKycReview, setIsKycReview] = useState(false);
  const [hasWarehouse, setHasWarehouse] = useState(false);
  const [hasWalletFunds, setHasWalletFunds] = useState(false);

  useEffect(() => {
    if (!customerId) return;

    // 1. Check KYC
    const savedKyc = localStorage.getItem(`MAXLINE_SELLER_KYC_${customerId}`);
    if (savedKyc) {
      try {
        const parsed = JSON.parse(savedKyc);
        if (parsed.kycStatus === 'Approved') setIsKycDone(true);
        else if (parsed.kycStatus === 'Under Review') setIsKycReview(true);
      } catch {}
    }

    // Check Cloud DB for merchant active status
    (async () => {
      try {
        const { data } = await supabase
          .from('merchants')
          .select('status')
          .eq('id', toValidTenantUUID(customerId))
          .maybeSingle();

        if (data?.status === 'ACTIVE') {
          setIsKycDone(true);
        }
      } catch {}
    })();

    // 2. Check Warehouse count
    const whs = CustomerWarehouseService.getWarehouses(customerId);
    if (whs && whs.length > 0) {
      setHasWarehouse(true);
    }

    // 3. Check Wallet
    const wallet = WalletService.getWallet(customerId);
    if (wallet && wallet.balanceINR > 0) {
      setHasWalletFunds(true);
    }
  }, [customerId]);

  // Calculate completion percentage
  let completedSteps = 1; // Step 1 Account Created is always done
  if (isKycDone || isKycReview) completedSteps += 1;
  if (hasWarehouse) completedSteps += 1;
  if (hasWalletFunds) completedSteps += 1;

  const percentage = Math.round((completedSteps / 4) * 100);

  // If 100% complete and autoHideIfComplete is true, dismiss
  if (isDismissed || (autoHideIfComplete && percentage === 100)) {
    return null;
  }

  const steps = [
    {
      id: 'step-account',
      title: 'Account Created',
      description: 'Registration verified',
      isComplete: true,
      icon: UserCheck,
      path: null,
    },
    {
      id: 'step-kyc',
      title: 'Business KYC',
      description: isKycDone ? 'Verified' : isKycReview ? 'Under Review' : 'PAN & Bank Details',
      isComplete: isKycDone || isKycReview,
      icon: ShieldCheck,
      path: '/app/kyc',
      actionLabel: isKycReview ? 'View Status' : 'Complete KYC (2 Mins)',
    },
    {
      id: 'step-warehouse',
      title: 'Pickup Location',
      description: hasWarehouse ? 'Hub Configured' : 'Origin address for couriers',
      isComplete: hasWarehouse,
      icon: MapPin,
      path: '/app/warehouses',
      actionLabel: 'Add Warehouse',
    },
    {
      id: 'step-wallet',
      title: 'Recharge Wallet',
      description: hasWalletFunds ? 'Funds Ready' : 'Top up to book shipments',
      isComplete: hasWalletFunds,
      icon: Wallet,
      path: '/app/wallet',
      actionLabel: 'Add Balance',
    },
  ];

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Top Strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                Quick Setup Checklist
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: percentage === 100 ? '#16a34a' : '#2563eb',
                  backgroundColor: percentage === 100 ? '#f0fdf4' : '#eff6ff',
                  padding: '1px 8px',
                  borderRadius: '10px',
                }}
              >
                {percentage}% Completed ({completedSteps}/4)
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
              Complete the remaining steps to enable automated courier pickups.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          style={{
            border: 'none',
            background: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
          }}
          title="Dismiss Checklist"
          aria-label="Dismiss Checklist"
        >
          <X size={16} />
        </button>
      </div>

      {/* 4 Interactive Progress Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
        {steps.map((st, idx) => {
          const IconComponent = st.icon;
          return (
            <div
              key={st.id}
              onClick={() => st.path && navigate(st.path)}
              style={{
                border: `1px solid ${st.isComplete ? '#bbf7d0' : '#e2e8f0'}`,
                backgroundColor: st.isComplete ? '#f0fdf4' : '#ffffff',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                cursor: st.path ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: st.isComplete ? '#16a34a' : '#f1f5f9',
                      color: st.isComplete ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '800',
                    }}
                  >
                    {st.isComplete ? <Check size={12} /> : idx + 1}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{st.title}</span>
                </div>
                {st.isComplete && (
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a' }}>✓ Ready</span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{st.description}</span>
                {!st.isComplete && st.path && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#2563eb',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    {st.actionLabel} <ArrowRight size={11} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
