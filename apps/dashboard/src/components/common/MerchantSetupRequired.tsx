import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ShieldAlert,
  ArrowRight,
  RotateCw,
  LogOut,
  Mail,
  User,
  KeyRound,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react';
import type { AuthUser } from '../../types/auth';
import { authService } from '../../services/auth.service';

interface MerchantSetupRequiredProps {
  user: AuthUser | null;
  onRefresh?: () => Promise<void> | void;
}

export const MerchantSetupRequired: React.FC<MerchantSetupRequiredProps> = ({
  user,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setRefreshMessage('Membership status re-checked with MAXLINE Supabase.');
    } catch {
      setRefreshMessage('Could not verify status. Please try again.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 120px)',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          maxWidth: '720px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 45px -15px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Top Accent Strip */}
        <div
          style={{
            height: '6px',
            background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #0284c7 100%)',
          }}
        />

        <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid #bfdbfe',
              }}
            >
              <ShieldAlert size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#2563eb',
                    backgroundColor: '#eff6ff',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  🔒 Account Authenticated • Merchant Setup Required
                </span>
              </div>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: '800',
                  color: '#0f172a',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Merchant Organization Setup Required
              </h1>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px', margin: 0 }}>
                You have successfully signed in via <strong>MAXLINE Supabase Auth</strong>. However, your authenticated user profile has not yet been assigned to an active merchant organization.
              </p>
            </div>
          </div>

          {/* Feedback banner */}
          {refreshMessage && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} />
              {refreshMessage}
            </div>
          )}

          {/* Authenticated Identity Details Card */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Authenticated User Identity
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={16} color="#64748b" />
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Full Name</div>
                  <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>
                    {user?.fullName || 'Authenticated User'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={16} color="#64748b" />
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Work Email</div>
                  <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>
                    {user?.workEmail || '—'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <KeyRound size={16} color="#64748b" />
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Supabase Auth User ID</div>
                  <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: '600', fontFamily: 'monospace' }}>
                    {user?.id ? `${user.id.slice(0, 18)}...` : '—'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={16} color="#dc2626" />
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Merchant Tenancy</div>
                  <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: '700' }}>
                    Pending Provisioning
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
              How to complete merchant activation:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#334155' }}>
                <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: '800', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px' }}>
                  1
                </span>
                <span>
                  <strong>New Merchant Setup:</strong> Complete your merchant business profile, warehouse addresses, and bank KYC to provision a dedicated MAXLINE merchant account.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#334155' }}>
                <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: '800', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px' }}>
                  2
                </span>
                <span>
                  <strong>Organization Membership:</strong> If you are joining an existing company, ask your organization administrator to add your email ({user?.workEmail}) to their merchant team in MAXLINE.
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => navigate('/app/onboarding')}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '11px 20px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                }}
              >
                <FileCheck2 size={16} />
                Complete Merchant Onboarding
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '11px 18px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: isRefreshing ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <RotateCw size={15} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                {isRefreshing ? 'Checking...' : 'Refresh Status'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              style={{
                backgroundColor: 'transparent',
                color: '#64748b',
                border: 'none',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
