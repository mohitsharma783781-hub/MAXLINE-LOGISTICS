import React from 'react';
import type { ComponentSize, ComponentVariant } from '../../types/component';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ComponentVariant;
  size?: ComponentSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  onClick,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'secondary':
      case 'outline':
        return {
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border-strong)',
          boxShadow: 'var(--shadow-sm)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-text-secondary)',
          border: '1px solid transparent',
        };
      case 'link':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-blue-main)',
          border: 'none',
          padding: 0,
          height: 'auto',
          textDecoration: 'underline',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--color-danger)',
          color: 'var(--color-text-inverse)',
          border: '1px solid var(--color-danger)',
          boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
        };
      case 'success':
        return {
          backgroundColor: 'var(--color-success)',
          color: 'var(--color-text-inverse)',
          border: '1px solid var(--color-success)',
          boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
        };
      case 'brand':
      case 'info':
        return {
          backgroundColor: 'var(--color-sky-main)',
          color: 'var(--color-text-inverse)',
          border: '1px solid var(--color-sky-main)',
          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
        };
      case 'warning':
        return {
          backgroundColor: 'var(--color-warning)',
          color: 'var(--color-text-inverse)',
          border: '1px solid var(--color-warning)',
          boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)',
        };
      case 'primary':
      default:
        return {
          backgroundColor: 'var(--color-blue-main)',
          color: 'var(--color-text-inverse)',
          border: '1px solid var(--color-blue-main)',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    if (variant === 'link') return {};
    switch (size) {
      case 'sm':
        return {
          height: '34px',
          padding: '0 12px',
          fontSize: '13px',
          borderRadius: 'var(--radius-sm)',
        };
      case 'lg':
        return {
          height: '46px',
          padding: '0 22px',
          fontSize: '15px',
          borderRadius: 'var(--radius-md)',
        };
      case 'md':
      default:
        return {
          height: '40px',
          padding: '0 16px',
          fontSize: '14px',
          borderRadius: 'var(--radius-default)',
        };
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading || disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      disabled={disabled || isLoading}
      onClick={handleClick}
      style={{
        display: fullWidth ? 'flex' : 'inline-flex',
        width: fullWidth ? '100%' : 'auto',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1), background-color 150ms ease, box-shadow 150ms ease, border-color 150ms ease, opacity 150ms ease',
        opacity: disabled ? 0.5 : isLoading ? 0.8 : 1,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        outline: 'none',
        userSelect: 'none',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      onMouseDown={(e) => {
        if (!disabled && !isLoading && variant !== 'link') {
          e.currentTarget.style.transform = 'scale(0.97)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && !isLoading && variant !== 'link') {
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isLoading && variant !== 'link') {
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span
            style={{
              width: '14px',
              height: '14px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }}
          />
          Loading...
        </span>
      ) : (
        <>
          {leftIcon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{leftIcon}</span>}
          {children}
          {rightIcon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
