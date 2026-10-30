import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, ExternalLink, Lock } from 'lucide-react';
import { authService } from '../../services/auth.service';
import type { AuthUser } from '../../types/auth';
import { Card, Button, Badge, Spinner } from '../ui';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function checkAdminAuth() {
      try {
        const user = await authService.getCurrentUser();
        if (isMounted) {
          setCurrentUser(user);
        }
      } catch (_err) {
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkAdminAuth();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          gap: '16px',
        }}
      >
        <Spinner size="lg" />
        <div style={{ fontSize: '13px', color: '#94a3b8', letterSpacing: '0.05em' }}>
          VERIFYING PLATFORM ADMINISTRATOR PRIVILEGES...
        </div>
      </div>
    );
  }

  // 1. Not Authenticated: Redirect immediately to Admin Login
  if (!currentUser) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // 2. Authenticated, but not a verified platform admin (e.g. merchant user / owner)
  const isPlatformAdmin =
    currentUser.role === 'super_admin' || currentUser.role === 'admin_operator';

  if (!isPlatformAdmin) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          padding: '24px',
        }}
      >
        <Card
          style={{
            maxWidth: '520px',
            width: '100%',
            padding: '36px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            borderTop: '5px solid #ef4444',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <ShieldAlert size={36} />
          </div>

          <Badge variant="danger" style={{ marginBottom: '12px' }}>
            RESTRICTED PLATFORM AREA
          </Badge>

          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0' }}>
            Administrative Privileges Required
          </h2>

          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 20px 0' }}>
            The account <strong>{currentUser.workEmail}</strong> is registered as a{' '}
            <strong style={{ color: '#0f172a' }}>Merchant Account</strong>. Merchant accounts are strictly
            separated from MAXLINE platform administration and cannot access the Super Admin control center.
          </p>

          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '12px 16px',
              textAlign: 'left',
              fontSize: '12px',
              color: '#475569',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Lock size={16} color="#64748b" style={{ flexShrink: 0 }} />
            <span>
              If you require platform operator access, please contact the MAXLINE Infrastructure Team to have verified claims provisioned.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => authService.signOut().then(() => navigate('/admin/login'))}
            >
              Sign Out & Switch User
            </Button>

            <Button
              variant="primary"
              rightIcon={<ExternalLink size={16} />}
              onClick={() => navigate('/app')}
              style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
            >
              Go to Seller Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 3. Authenticated Platform Administrator: Grant access
  return <>{children}</>;
};
