import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  durationMs?: number;
}

export interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'var(--space-6)',
        right: 'var(--space-6)',
        zIndex: 10200,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        maxWidth: '380px',
        width: '100%',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const duration = toast.durationMs || 5000;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const getStyle = () => {
    switch (toast.type) {
      case 'success':
        return { bg: 'var(--color-success-bg)', border: 'var(--color-success-border)', text: 'var(--color-success-text)', Icon: CheckCircle2 };
      case 'error':
        return { bg: 'var(--color-danger-bg)', border: 'var(--color-danger-border)', text: 'var(--color-danger-text)', Icon: AlertCircle };
      case 'warning':
        return { bg: 'var(--color-warning-bg)', border: 'var(--color-warning-border)', text: 'var(--color-warning-text)', Icon: AlertTriangle };
      case 'info':
      default:
        return { bg: 'var(--color-info-bg)', border: 'var(--color-info-border)', text: 'var(--color-info-text)', Icon: Info };
    }
  };

  const styleConfig = getStyle();
  const Icon = styleConfig.Icon;

  return (
    <div
      style={{
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-default)',
        backgroundColor: styleConfig.bg,
        border: `1px solid ${styleConfig.border}`,
        color: styleConfig.text,
        fontSize: 'var(--font-size-body)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
      }}
    >
      <Icon size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <h5 style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-body)', color: 'inherit' }}>
          {toast.title}
        </h5>
        {toast.description && (
          <p style={{ fontSize: 'var(--font-size-small)', opacity: 0.9, marginTop: '2px', color: 'inherit' }}>
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px' }}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};
