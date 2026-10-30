import React from 'react';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge } from '../../components/ui';
import { useRbac } from '../../context/RbacContext';

interface AccessDeniedPageProps {
  requiredPermission?: string;
  attemptedPath?: string;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({
  requiredPermission,
  attemptedPath,
}) => {
  const navigate = useNavigate();
  const { currentRole } = useRbac();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
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
          HTTP 403 • ACCESS DENIED
        </Badge>

        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
          Access Restricted by RBAC Policy
        </h2>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
          Your current account role <strong style={{ color: 'var(--color-text-primary)' }}>({currentRole?.name || 'Restricted Role'})</strong> does not possess authorization to access this module.
        </p>

        {(requiredPermission || attemptedPath) && (
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
            {attemptedPath && (
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Target Path: </span>
                <code style={{ color: 'var(--color-violet-main)' }}>{attemptedPath}</code>
              </div>
            )}
            {requiredPermission && (
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Required Action: </span>
                <strong>{requiredPermission}</strong>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="outline"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>

          <Button
            variant="primary"
            leftIcon={<RefreshCw size={16} />}
            onClick={() => navigate('/admin')}
          >
            Return to Admin Home
          </Button>
        </div>
      </Card>
    </div>
  );
};
