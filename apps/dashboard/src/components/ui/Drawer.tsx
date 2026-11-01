import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  position?: 'left' | 'right';
  children: React.ReactNode;
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  position = 'right',
  children,
  width,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isRight = position === 'right';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: isRight ? 'flex-end' : 'flex-start',
        alignItems: 'stretch',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: width || 'min(440px, 90vw)',
          height: '100vh',
          minHeight: '100vh',
          backgroundColor: 'var(--color-surface, #ffffff)',
          borderLeft: isRight ? '1px solid var(--color-border, #e2e8f0)' : 'none',
          borderRight: !isRight ? '1px solid var(--color-border, #e2e8f0)' : 'none',
          boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10000,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: 'var(--space-4, 16px) var(--space-6, 24px)',
            borderBottom: '1px solid var(--color-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            backgroundColor: '#ffffff',
          }}
        >
          {title && (
            <h3 style={{ fontSize: 'var(--font-size-lg, 16px)', fontWeight: 'var(--font-weight-semibold, 600)', color: '#0f172a' }}>
              {title}
            </h3>
          )}
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
            aria-label="Close drawer"
          >
            &times;
          </button>
        </div>
        <div
          style={{
            padding: 'var(--space-6, 24px)',
            flex: 1,
            overflowY: 'auto',
            backgroundColor: '#ffffff',
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
