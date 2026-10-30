import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Building, Mail, Phone, Lock, ArrowRight, FileText, Tag } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { Alert } from '../../components/ui/Alert';
import { PasswordRequirements } from '../../components/auth/PasswordRequirements';
import { authService } from '../../services/auth.service';

export const SignupPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [businessType, setBusinessType] = useState('d2c');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  const businessTypeOptions = [
    { value: 'd2c', label: 'D2C / eCommerce Brand' },
    { value: 'b2b', label: 'B2B Distributor / Wholesaler' },
    { value: 'enterprise', label: 'Enterprise Logistics Fleet' },
    { value: 'reseller', label: 'Courier Aggregator Reseller' },
    { value: 'other', label: 'Other Business Type' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!businessName.trim()) {
      setErrorMessage('Please enter your company or business name.');
      return;
    }
    if (!fullName.trim()) {
      setErrorMessage('Please enter the primary contact person name.');
      return;
    }
    if (!workEmail.trim() || !workEmail.includes('@')) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMessage('Please enter your mobile phone number.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('You must accept the Terms of Service to create an account.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authService.signUp({
        fullName,
        businessName,
        workEmail,
        phoneNumber,
        businessType,
        password,
        termsAccepted,
      });

      if (res.user) {
        if (!res.token) {
          // If Supabase project has email confirmation enabled, no immediate session token is returned
          setSuccessMessage(
            'Registration successful! A verification link has been sent to your email. Please verify your email before logging in.'
          );
          return;
        }
        navigate('/app');
      } else {
        const rawMsg = res.message || '';
        if (rawMsg.toLowerCase().includes('rate limit')) {
          setErrorMessage(
            'Email rate limit reached for Supabase verification emails (max 3/hour). If you already registered, please proceed to Sign In. Otherwise, please wait a few minutes or disable "Confirm email" in Supabase Auth.'
          );
        } else {
          setErrorMessage(rawMsg || 'Registration failed. Please check your details and try again.');
        }
      }
    } catch (err: any) {
      const rawMsg = err.message || '';
      if (rawMsg.toLowerCase().includes('rate limit')) {
        setErrorMessage(
          'Email rate limit reached for Supabase verification emails (max 3/hour). If you already registered, please proceed to Sign In. Otherwise, please wait a few minutes or disable "Confirm email" in Supabase Auth.'
        );
      } else {
        setErrorMessage(rawMsg || 'Registration failed. Please check your details and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)', overflow: 'hidden', width: '100%', margin: '20px 0' }}>
      
      {/* Top Brand Gradient Line */}
      <div style={{ height: '5px', background: 'linear-gradient(90deg, #2563eb 0%, #0284c7 50%, #16a34a 100%)' }} />

      <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Title */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#2563eb', backgroundColor: '#eff6ff', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🚀 Seller Onboarding Portal
            </span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Create Your Seller Account
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', margin: 0 }}>
            Join India's premier multi-tenant enterprise courier aggregator platform.
          </p>
        </div>

        {/* Top Perks Banner */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '700', color: '#334155' }}>
          <span style={{ color: '#16a34a' }}>🎁 ₹500 Wallet Bonus</span>
          <span style={{ color: '#94a3b8' }}>•</span>
          <span style={{ color: '#2563eb' }}>💳 ₹0 Subscription Fee</span>
          <span style={{ color: '#94a3b8' }}>•</span>
          <span style={{ color: '#7c3aed' }}>⚡ 1-Minute Signup</span>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <Alert variant="danger" title="Registration Notice">
            {errorMessage}
          </Alert>
        )}

        {/* Success Alert Banner (for email confirmation flow) */}
        {successMessage && (
          <Alert variant="success" title="Check Your Inbox">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span>{successMessage}</span>
              <div>
                <Link to="/login" style={{ color: '#15803d', fontWeight: '800', textDecoration: 'underline' }}>
                  Proceed to Sign In →
                </Link>
              </div>
            </div>
          </Alert>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Section 1: Business Profile */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <Input
              label="Company Name *"
              placeholder="Apex Logistics Pvt Ltd"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              leadingIcon={<Building size={16} />}
              required
            />

            <Input
              label="Contact Person Name *"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leadingIcon={<User size={16} />}
              required
            />
          </div>

          {/* Section 2: Contact Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <Input
              label="Work Email Address *"
              type="email"
              placeholder="john@apexlogistics.com"
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
              leadingIcon={<Mail size={16} />}
              required
            />

            <Input
              label="Mobile Number *"
              type="tel"
              placeholder="+91 98765 43210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              leadingIcon={<Phone size={16} />}
              required
            />
          </div>

          {/* Section 3: Industry & Optional Fields */}
          <Select
            label="Business Industry Segment"
            options={businessTypeOptions}
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <Input
              label="GST Number (Optional)"
              placeholder="22AAAAA0000A1Z5"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              leadingIcon={<FileText size={16} />}
            />

            <Input
              label="Referral Code (Optional)"
              placeholder="REF-2026-LOGIX"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              leadingIcon={<Tag size={16} />}
            />
          </div>

          {/* Section 4: Credentials */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div style={{ position: 'relative' }}>
              <Input
                label="Password *"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leadingIcon={<Lock size={16} />}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '34px',
                  border: 'none',
                  background: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Input
              label="Confirm Password *"
              type={showPassword ? 'text' : 'password'}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leadingIcon={<Lock size={16} />}
              required
            />
          </div>

          <PasswordRequirements password={password} />

          <div style={{ marginTop: '2px' }}>
            <Checkbox
              label={
                <span style={{ fontSize: '13px', color: '#475569' }}>
                  I agree to the <Link to="/faq" style={{ color: '#2563eb', fontWeight: '700' }}>Terms of Service</Link> and{' '}
                  <Link to="/faq" style={{ color: '#2563eb', fontWeight: '700' }}>Privacy Policy</Link>
                </span>
              }
              checked={termsAccepted}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTermsAccepted(e.target.checked)}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            rightIcon={!isLoading ? <ArrowRight size={18} /> : undefined}
            style={{ marginTop: '8px', backgroundColor: '#2563eb', borderColor: '#2563eb', fontWeight: '800', height: '48px', fontSize: '15px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}
          >
            Create Seller Account →
          </Button>
        </form>

        {/* Footer Link */}
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#64748b', marginTop: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: '#2563eb', fontWeight: '800', textDecoration: 'none' }}>
            Sign in to Seller Portal →
          </Link>
        </div>

      </div>
    </div>
  );
};
