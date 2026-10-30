import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/auth.service';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your Super Admin email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your admin password.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authService.signIn({ workEmail: email, password, rememberMe: true });
      if (res.user) {
        if (res.user.role === 'super_admin' || res.user.role === 'admin_operator') {
          navigate('/admin');
        } else {
          // Sign out immediately so merchant token is not held in admin context
          await authService.signOut();
          setErrorMessage('Access Denied: This account does not possess platform administrator privileges. Please sign in via the Seller Portal.');
        }
      } else {
        setErrorMessage(res.message || 'Invalid Super Admin credentials. Access denied.');
      }
    } catch (_err: any) {
      setErrorMessage('Invalid Super Admin credentials. Access denied.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <Card style={{ padding: '32px', backgroundColor: '#ffffff', border: '1px solid #1e293b', borderRadius: '16px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header Title & Admin Badge */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '14px', backgroundColor: '#0f172a', color: '#60a5fa', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <ShieldCheck size={28} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Super Admin Control Center
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Restricted Portal • Authorized Platform Management Only
            </p>
          </div>

          {/* Error Alert Banner */}
          {errorMessage && (
            <Alert variant="danger" title="Admin Security Notice">
              {errorMessage}
            </Alert>
          )}

          {/* Form Container */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Super Admin Email *"
              type="email"
              placeholder="admin@maxlinelogistics.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leadingIcon={<Mail size={16} />}
              required
            />

            <Input
              label="Password *"
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leadingIcon={<Lock size={16} />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              rightIcon={!isLoading ? <ArrowRight size={16} /> : undefined}
              style={{ marginTop: '8px', backgroundColor: '#0f172a', borderColor: '#0f172a' }}
            >
              Sign In to Admin Portal
            </Button>

          {/* Security Assurance Badge */}
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <ShieldCheck size={16} color="#0f172a" />
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
              Secured with MAXLINE Dedicated Supabase Auth
            </span>
          </div>
        </form>

          {/* Link Back to Seller Login */}
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
            Are you a merchant?{' '}
            <a href="/login" style={{ color: '#0284c7', fontWeight: '700', textDecoration: 'none' }}>
              Go to Seller Login →
            </a>
          </div>

        </div>
      </Card>
    </div>
  );
};
