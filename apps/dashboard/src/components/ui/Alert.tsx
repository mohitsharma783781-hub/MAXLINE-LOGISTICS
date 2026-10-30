import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  onDismiss?: () => void;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  action,
  style,
}) => {
  const getVariantConfig = () => {
    switch (variant) {
      case 'success':
        return {
          bg: 'var(--color-success-bg)',
          border: 'var(--color-success-border)',
          text: 'var(--color-success-text)',
          Icon: CheckCircle2,
        };
      case 'warning':
        return {
          bg: 'var(--color-warning-bg)',
          border: 'var(--color-warning-border)',
          text: 'var(--color-warning-text)',
          Icon: AlertTriangle,
        };
      case 'danger':
        return {
          bg: 'var(--color-danger-bg)',
          border: 'var(--color-danger-border)',
          text: 'var(--color-danger-text)',
          Icon: AlertCircle,
        };
      case 'info':
      default:
        return {
          bg: 'var(--color-info-bg)',
          border: 'var(--color-info-border)',
          text: 'var(--color-info-text)',
          Icon: Info,
        };
    }
  };

  const config = getVariantConfig();
  const Icon = config.Icon;

  return (
    <div
      style={{
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-default)',
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
        fontSize: 'var(--font-size-body)',
        ...style,
      }}
    >
      <Icon size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        {title && (
          <h5 style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-body)', marginBottom: children ? 'var(--space-1)' : 0, color: 'inherit' }}>
            {title}
          </h5>
        )}
        {children && <div style={{ fontSize: 'var(--font-size-small)', color: 'inherit', opacity: 0.9 }}>{children}</div>}
      </div>

      {action && <div style={{ flexShrink: 0 }}>{action}</div>}

      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            border: 'none',
            background: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '2px',
            opacity: 0.8,
            flexShrink: 0,
          }}
          aria-label="Dismiss alert"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
