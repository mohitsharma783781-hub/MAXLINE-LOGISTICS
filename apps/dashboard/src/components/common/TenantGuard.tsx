import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Building2 } from 'lucide-react';
import { Button, Card, Badge } from '../ui';
import { useTenant } from '../../context/TenantContext';
import { useRbac } from '../../context/RbacContext';

interface TenantGuardProps {
  children: React.ReactNode;
  expectedTenantId?: string;
}

export const TenantGuard: React.FC<TenantGuardProps> = ({
  children,
  expectedTenantId,
}) => {
  const location = useLocation();
  const params = useParams();
  const { activeTenantId, activeTenant, logSecurityViolation } = useTenant();
  const { currentRole } = useRbac();
  const isSuperAdmin = currentRole?.code === 'SUPER_ADMIN';

  // Check if route contains cross-tenant violation indicators (e.g. attempting to view an ID explicitly tagged with another tenant)
  let isViolation = false;
  let targetTenantInfo = expectedTenantId;

  if (expectedTenantId && expectedTenantId !== activeTenantId && !isSuperAdmin) {
    isViolation = true;
  }

  // Check parameter manipulation in URLs (e.g. /app/shipments/SHP-VELOCITY-999 or /app/orders/TENANT-1002-ORD)
  const paramValues = Object.values(params).filter(Boolean) as string[];
  const hasCrossTenantParam = paramValues.some(
    (val) =>
      val.includes('TENANT-1002') ||
      val.includes('TENANT-1003') ||
      val.includes('TENANT-1004') ||
      val.includes('VELOCITY') ||
      val.includes('ACME')
  );

  if (hasCrossTenantParam && activeTenantId === 'TENANT-1001' && !isSuperAdmin) {
    isViolation = true;
    targetTenantInfo = 'TENANT-1002 / Foreign Merchant';
  }

  if (isViolation) {
    logSecurityViolation(
      'Cross-Tenant Access Blocked',
      `URL Path: ${location.pathname}`,
      `Unauthorized attempt to inspect foreign tenant data (${targetTenantInfo}) under tenant ${activeTenantId}`
    );

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '65vh',
          padding: 'var(--space-8)',
          textAlign: 'center',
        }}
      >
        <Card
          style={{
            maxWidth: '560px',
            width: '100%',
            padding: 'var(--space-8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-4)',
            borderTop: '4px solid var(--color-danger-main, #ef4444)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
            }}
          >
            <ShieldAlert size={36} />
          </div>

          <Badge variant="danger" style={{ fontSize: '13px', padding: '4px 12px' }}>
            SECURITY ALERT • CROSS-TENANT ACCESS VIOLATION
          </Badge>

          <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>
            Cross-Customer Data Isolation Enforced
          </h2>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
            Your account <strong style={{ color: 'var(--color-text-primary)' }}>({activeTenant?.companyName || 'Merchant'} - {activeTenantId})</strong> is isolated from foreign merchant datasets. Direct URL manipulation or unauthorized cross-tenant resource inspection is blocked by security policy.
          </p>

          <div
            style={{
              backgroundColor: 'var(--color-bg-secondary, #f8fafc)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              width: '100%',
              fontSize: '12px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              border: '1px solid var(--color-border)',
            }}
          >
            <div>
              <span style={{ color: 'var(--color-text-secondary)' }}>Your Active Tenant ID: </span>
              <strong style={{ color: 'var(--color-violet-main)' }}>{activeTenantId}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)' }}>Attempted Resource: </span>
              <code>{location.pathname}</code>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)' }}>Security Action: </span>
              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Access Denied & Security Audit Logged</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Button
              variant="outline"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => window.history.back()}
            >
              Return to Safety
            </Button>
            <Button
              variant="primary"
              leftIcon={<Building2 size={16} />}
              onClick={() => (window.location.href = '/app')}
            >
              Go to My Tenant Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
