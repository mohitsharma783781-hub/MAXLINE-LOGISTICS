import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '500px',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4, 16px)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: `min(${maxWidth}, 95vw)`,
          backgroundColor: 'var(--color-surface, #ffffff)',
          borderRadius: 'var(--radius-xl, 12px)',
          boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))',
          border: '1px solid var(--color-border, #e2e8f0)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {title && (
          <div
            style={{
              padding: 'var(--space-4, 16px) var(--space-6, 24px)',
              borderBottom: '1px solid var(--color-border, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
            }}
          >
            <h3 style={{ fontSize: 'var(--font-size-lg, 16px)', fontWeight: 'var(--font-weight-semibold, 600)', color: '#0f172a' }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              style={{
                fontSize: '20px',
                color: 'var(--color-text-muted, #64748b)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '4px 8px',
              }}
              aria-label="Close dialog"
            >
              &times;
            </button>
          </div>
        )}
        <div style={{ padding: 'var(--space-6, 24px)', overflowY: 'auto', flex: 1, backgroundColor: '#ffffff' }}>{children}</div>
        {footer && (
          <div
            style={{
              padding: 'var(--space-4, 16px) var(--space-6, 24px)',
              borderTop: '1px solid var(--color-border, #e2e8f0)',
              backgroundColor: 'var(--color-surface-subtle, #f8fafc)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-3, 12px)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
