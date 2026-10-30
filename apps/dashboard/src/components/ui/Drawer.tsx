import React, { useEffect } from 'react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  position?: 'left' | 'right';
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  position = 'right',
  children,
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

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: isRight ? 'flex-end' : 'flex-start',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 'min(400px, 85vw)',
          height: '100%',
          backgroundColor: 'var(--color-surface)',
          borderLeft: isRight ? '1px solid var(--color-border)' : 'none',
          borderRight: !isRight ? '1px solid var(--color-border)' : 'none',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: 'var(--space-4) var(--space-6)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {title && (
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
              {title}
            </h3>
          )}
          <button onClick={onClose} style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-muted)' }}>
            &times;
          </button>
        </div>
        <div style={{ padding: 'var(--space-6)', flex: 1, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
};
