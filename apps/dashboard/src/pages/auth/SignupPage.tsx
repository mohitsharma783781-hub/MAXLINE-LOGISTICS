import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Building, Mail, Phone, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import { Alert } from '../../components/ui/Alert';
import { authService } from '../../services/auth.service';

export const SignupPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = fullName.trim();
    const cleanCompany = businessName.trim();
    const cleanEmail = workEmail.trim().toLowerCase();
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');

    if (!cleanCompany) {
      setErrorMessage('Please enter your business or company name.');
      return;
    }
    if (!cleanName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile phone number.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('Please accept the Terms of Service to create an account.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authService.signUp({
        fullName: cleanName,
        businessName: cleanCompany,
        workEmail: cleanEmail,
        phoneNumber: cleanPhone,
        businessType: 'd2c',
        password,
        termsAccepted,
      });

      if (res.user) {
        // Direct seamless transition to Merchant Dashboard with Onboarding Stepper
        navigate('/app');
      } else {
        const rawMsg = res.message || '';
        if (rawMsg.toLowerCase().includes('rate limit')) {
          setErrorMessage('Email request limit reached. If you already have an account, please sign in.');
        } else {
          setErrorMessage(rawMsg || 'Registration failed. Please check your details and try again.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '520px',
        margin: '24px auto',
      }}
    >
      <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#2563eb',
                backgroundColor: '#eff6ff',
                padding: '3px 10px',
                borderRadius: '6px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Merchant Registration
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Create Seller Account
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', margin: 0 }}>
            Start dispatching pan-India shipments with verified carrier integrations.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <Alert variant="danger">
            {errorMessage}
          </Alert>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Company & Name */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
            <Input
              label="Company / Brand Name *"
              placeholder="e.g. Acme Retail Pvt Ltd"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              leadingIcon={<Building size={16} />}
              required
            />

            <Input
              label="Full Name (Owner) *"
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leadingIcon={<User size={16} />}
              required
            />
          </div>

          {/* Email & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
            <Input
              label="Work Email Address *"
              type="email"
              placeholder="name@company.com"
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
              leadingIcon={<Mail size={16} />}
              required
            />

            <Input
              label="Mobile Number *"
              type="tel"
              placeholder="10-digit mobile number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              leadingIcon={<Phone size={16} />}
              required
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <Input
              label="Password *"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leadingIcon={<Lock size={16} />}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '12px',
                top: '32px',
                border: 'none',
                background: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Terms Agreement */}
          <div style={{ marginTop: '2px' }}>
            <Checkbox
              label={
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  I agree to the{' '}
                  <Link to="/faq" target="_blank" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/faq" target="_blank" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>
                    Privacy Policy
                  </Link>
                </span>
              }
              checked={termsAccepted}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTermsAccepted(e.target.checked)}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            rightIcon={!isLoading ? <ArrowRight size={16} /> : undefined}
            style={{
              marginTop: '4px',
              backgroundColor: '#2563eb',
              borderColor: '#2563eb',
              fontWeight: '700',
              height: '44px',
              fontSize: '14px',
            }}
          >
            Create Seller Account
          </Button>
        </form>

        {/* Security badge & Sign in footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginTop: '-4px' }}>
          <ShieldCheck size={14} color="#16a34a" />
          <span>Encrypted 256-bit secure registration</span>
        </div>

        <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          Already have a seller account?{' '}
          <Link to="/login" style={{ color: '#2563eb', fontWeight: '700', textDecoration: 'none' }}>
            Sign in here →
          </Link>
        </div>
      </div>
    </div>
  );
};
