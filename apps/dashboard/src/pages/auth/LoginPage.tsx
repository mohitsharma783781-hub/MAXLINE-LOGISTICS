import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import { Alert } from '../../components/ui/Alert';
import { authService } from '../../services/auth.service';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your work email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (email.toLowerCase().includes('admin@maxline.in') || email.toLowerCase().includes('admin@courrier3.com')) {
      setErrorMessage('Admin Account Detected: Super Admin users must log in via the dedicated Admin Login Portal (/admin/login).');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authService.signIn({ workEmail: email, password, rememberMe });
      if (res.user) {
        localStorage.setItem('courrier3_active_portal', 'CUSTOMER');
        navigate('/app');
      } else {
        setErrorMessage(res.message || 'Invalid merchant credentials. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage('Invalid merchant credentials or sign-in failed. Please try again.');
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
              🔒 Seller Portal Authentication
            </span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', margin: 0 }}>
            Sign in to manage your logistics & shipping operations across India.
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <Alert variant="danger" title="Authentication Notice">
            {errorMessage}
          </Alert>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Work Email Address *"
            type="email"
            placeholder="admin@merchant.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leadingIcon={<Mail size={16} />}
            required
          />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>
                Password *
              </label>
              <Link to="/forgot-password" style={{ fontSize: '12px', color: '#2563eb', fontWeight: '700', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
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
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Checkbox
              label={<span style={{ fontSize: '13px', color: '#475569' }}>Remember this device</span>}
              checked={rememberMe}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRememberMe(e.target.checked)}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            rightIcon={!isLoading ? <ArrowRight size={18} /> : undefined}
            style={{ marginTop: '6px', backgroundColor: '#2563eb', borderColor: '#2563eb', fontWeight: '800', height: '48px', fontSize: '15px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}
          >
            Sign In To Seller Portal →
          </Button>

          {/* Security Assurance Badge */}
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <ShieldCheck size={16} color="#2563eb" />
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
              Secured with MAXLINE Dedicated Supabase Auth
            </span>
          </div>
        </form>

        {/* Footer Registration Link */}
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#64748b', marginTop: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          Don't have a seller account?{' '}
          <Link to="/signup" style={{ color: '#2563eb', fontWeight: '800', textDecoration: 'none' }}>
            Create free seller account →
          </Link>
        </div>

      </div>
    </div>
  );
};
