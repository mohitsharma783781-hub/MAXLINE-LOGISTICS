import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Card } from '../../components/ui/Card';

export const VerificationPage: React.FC = () => {
  const navigate = useNavigate();

  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const handleSimulateEmailVerify = () => {
    setEmailVerified(true);
    setAlertMessage('Verification email link confirmed successfully!');
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setAlertMessage('Please enter a valid 6-digit OTP code.');
      return;
    }

    setIsVerifyingOtp(true);
    setTimeout(() => {
      setIsVerifyingOtp(false);
      setMobileVerified(true);
      setAlertMessage('Mobile OTP verified successfully!');
      setTimeout(() => setAlertMessage(null), 3000);
    }, 1000);
  };

  const isFullyVerified = emailVerified && mobileVerified;

  return (
    <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
      <Card style={{ padding: '32px', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Verify Your Account Identity
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Complete Email & Mobile OTP Verification to activate your seller workspace.
            </p>
          </div>

          {alertMessage && (
            <Alert variant="info" title="Verification Status">
              {alertMessage}
            </Alert>
          )}

          {/* 1. EMAIL VERIFICATION CARD */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: emailVerified ? '#dcfce7' : '#eff6ff', color: emailVerified ? '#15803d' : '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={20} />
              </div>

              <div>
                <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Email Address Verification</strong>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Confirmation sent to merchant work email</span>
              </div>
            </div>

            <div>
              {emailVerified ? (
                <Badge variant="success"><CheckCircle2 size={12} /> Verified</Badge>
              ) : (
                <Button variant="outline" size="sm" onClick={handleSimulateEmailVerify} leftIcon={<RefreshCw size={12} />}>
                  Verify Link
                </Button>
              )}
            </div>
          </div>

          {/* 2. MOBILE OTP VERIFICATION CARD */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: mobileVerified ? '#dcfce7' : '#eff6ff', color: mobileVerified ? '#15803d' : '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={20} />
                </div>

                <div>
                  <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Mobile OTP Verification</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>6-digit SMS OTP sent to registered mobile</span>
                </div>
              </div>

              <div>
                {mobileVerified ? (
                  <Badge variant="success"><CheckCircle2 size={12} /> Verified</Badge>
                ) : (
                  <Badge variant="warning"><AlertCircle size={12} /> Pending</Badge>
                )}
              </div>
            </div>

            {!mobileVerified && (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <Input
                  placeholder="Enter 6-digit OTP (Demo: 123456)"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength={6}
                  style={{ width: '100%' }}
                />
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isVerifyingOtp}
                  style={{ backgroundColor: '#2563EB', borderColor: '#2563EB', whiteSpace: 'nowrap' }}
                >
                  Verify OTP
                </Button>
              </form>
            )}
          </div>

          {/* Account Status Summary */}
          <div style={{ backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Current Account Status</span>
              <div style={{ fontSize: '14px', fontWeight: '800', color: isFullyVerified ? '#15803d' : '#d97706' }}>
                {isFullyVerified ? 'Identity Verified — Proceed to Onboarding' : 'Pending Identity Verification'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app')}
                style={{ fontSize: '12px', borderColor: '#94a3b8', color: '#334155' }}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="primary"
                disabled={!isFullyVerified}
                onClick={() => navigate('/app/onboarding')}
                rightIcon={<ArrowRight size={16} />}
                style={{ backgroundColor: isFullyVerified ? '#16a34a' : '#cbd5e1', borderColor: isFullyVerified ? '#16a34a' : '#cbd5e1' }}
              >
                Continue Onboarding
              </Button>
            </div>
          </div>

        </div>
      </Card>
    </div>
  );
};
