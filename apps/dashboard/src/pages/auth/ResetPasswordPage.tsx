import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/auth.service';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    // Check if error is passed in the URL hash
    if (typeof window !== 'undefined' && window.location.hash) {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const errorMsg = params.get('error_description');
      if (errorMsg) {
        setErrorMessage(decodeURIComponent(errorMsg.replace(/\+/g, ' ')));
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authService.updatePassword(newPassword);
      if (res.success) {
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message || 'Unable to update password. Your reset link may have expired.');
      }
    } catch (err: any) {
      setErrorMessage('Unable to update password. Please try requesting a new reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card style={{ padding: 'var(--space-8)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* Header Title */}
        <div>
          <h2 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
            Set new password
          </h2>
          <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Choose a secure password of at least 8 characters for your MAXLINE account.
          </p>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <Alert variant="success" title="Password Updated!">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <span>{successMessage}</span>
              <Button
                variant="primary"
                onClick={() => navigate('/login')}
                rightIcon={<ArrowRight size={16} />}
              >
                Go to Sign In
              </Button>
            </div>
          </Alert>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <Alert variant="danger" title="Update Notice">
            {errorMessage}
          </Alert>
        )}

        {/* Form Container */}
        {!successMessage && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leadingIcon={<Lock size={16} />}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leadingIcon={<Lock size={16} />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              rightIcon={!isLoading ? <CheckCircle2 size={16} /> : undefined}
              style={{ marginTop: 'var(--space-2)' }}
            >
              Update Password
            </Button>
          </form>
        )}

        {/* Footer Link */}
        <div style={{ textAlign: 'center', fontSize: 'var(--font-size-body)', marginTop: 'var(--space-2)' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              color: 'var(--color-violet-main)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </Card>
  );
};
