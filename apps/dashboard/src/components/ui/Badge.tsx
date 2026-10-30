import React from 'react';
import type { StatusType } from '../../types/component';

export type BadgeVariant = StatusType | 'brand' | 'ndr' | 'sky';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = true,
  pulse = false,
  style,
}) => {
  const getVariantStyles = (): { bg: string; text: string; border: string } => {
    switch (variant) {
      case 'success':
        return {
          bg: 'var(--color-success-bg)',
          text: 'var(--color-success-text)',
          border: 'var(--color-success-border)',
        };
      case 'warning':
        return {
          bg: 'var(--color-warning-bg)',
          text: 'var(--color-warning-text)',
          border: 'var(--color-warning-border)',
        };
      case 'ndr':
        return {
          bg: 'var(--color-ndr-bg)',
          text: 'var(--color-ndr-text)',
          border: 'var(--color-ndr-border)',
        };
      case 'danger':
        return {
          bg: 'var(--color-danger-bg)',
          text: 'var(--color-danger-text)',
          border: 'var(--color-danger-border)',
        };
      case 'info':
        return {
          bg: 'var(--color-info-bg)',
          text: 'var(--color-info-text)',
          border: 'var(--color-info-border)',
        };
      case 'brand':
        return {
          bg: 'var(--color-blue-light)',
          text: 'var(--color-blue-main)',
          border: '#BFDBFE',
        };
      case 'sky':
        return {
          bg: 'var(--color-sky-light)',
          text: 'var(--color-sky-main)',
          border: '#BAE6FD',
        };
      case 'neutral':
      default:
        return {
          bg: 'var(--color-surface-secondary)',
          text: 'var(--color-text-secondary)',
          border: 'var(--color-border)',
        };
    }
  };

  const config = getVariantStyles();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: 1.4,
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot && (
        <span
          className={pulse || variant === 'success' || variant === 'brand' ? `pulse-dot-${variant === 'success' ? 'success' : variant === 'brand' ? 'brand' : 'warning'}` : ''}
          style={{
            width: size === 'sm' ? '5px' : '6px',
            height: size === 'sm' ? '5px' : '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            display: 'inline-block',
          }}
        />
      )}
      {children}
    </span>
  );
};
