import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/auth.service';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authService.requestPasswordReset(email);
      if (res.success) {
        setSuccessMessage(`Password reset link simulated for ${email}. Please check your inbox.`);
      }
    } catch (err: any) {
      setErrorMessage('Unable to process password reset request. Please try again.');
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
            Reset your password
          </h2>
          <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Enter your work email address and we'll send you instructions to regain access.
          </p>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <Alert variant="success" title="Check your email">
            {successMessage}
          </Alert>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <Alert variant="danger" title="Request Notice">
            {errorMessage}
          </Alert>
        )}

        {/* Form Container */}
        {!successMessage ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input
              label="Work Email Address"
              type="email"
              placeholder="admin@merchant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leadingIcon={<Mail size={16} />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              rightIcon={!isLoading ? <ArrowRight size={16} /> : undefined}
              style={{ marginTop: 'var(--space-2)' }}
            >
              Send Reset Link
            </Button>
          </form>
        ) : (
          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              setSuccessMessage(null);
              setEmail('');
            }}
          >
            Send to another email
          </Button>
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
