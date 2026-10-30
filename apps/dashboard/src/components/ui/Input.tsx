import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
  sizeVariant?: 'md' | 'lg';
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onClear?: () => void;
  isLoading?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  requiredIndicator,
  sizeVariant = 'md',
  leadingIcon,
  trailingIcon,
  onClear,
  isLoading = false,
  id,
  style,
  disabled,
  readOnly,
  value,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const height = sizeVariant === 'lg' ? '44px' : '40px';
  const showClear = Boolean(onClear && value && !disabled && !readOnly);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1-5, 6px)', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 'var(--font-size-body)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
          }}
        >
          {label}
          {requiredIndicator && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {leadingIcon && (
          <span
            style={{
              position: 'absolute',
              left: 'var(--space-3)',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}
          >
            {leadingIcon}
          </span>
        )}

        <input
          id={inputId}
          disabled={disabled}
          readOnly={readOnly}
          value={value}
          onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          style={{
            height,
            width: '100%',
            paddingLeft: leadingIcon ? 'var(--space-9, 36px)' : 'var(--space-3)',
            paddingRight: trailingIcon || showClear || isLoading ? 'var(--space-9, 36px)' : 'var(--space-3)',
            fontSize: 'var(--font-size-body)',
            borderRadius: 'var(--radius-default)',
            border: error
              ? '1px solid #DC2626'
              : isFocused
              ? '1px solid #2563EB'
              : '1px solid #CBD5E1',
            boxShadow: isFocused
              ? error
                ? '0 0 0 3px rgba(220, 38, 38, 0.15)'
                : '0 0 0 3px rgba(37, 99, 235, 0.2)'
              : 'none',
            backgroundColor: disabled || readOnly ? 'var(--color-surface-secondary)' : 'var(--color-surface)',
            color: disabled ? 'var(--color-text-disabled)' : 'var(--color-text-primary)',
            transition: 'all var(--transition-fast)',
            outline: 'none',
            boxSizing: 'border-box',
            cursor: disabled ? 'not-allowed' : readOnly ? 'default' : 'text',
            ...style,
          }}
          {...props}
        />

        <div
          style={{
            position: 'absolute',
            right: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
          }}
        >
          {isLoading && (
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-text-muted)' }} />
          )}
          {showClear && !isLoading && (
            <button
              type="button"
              onClick={onClear}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
              aria-label="Clear input"
            >
              <X size={14} />
            </button>
          )}
          {trailingIcon && !showClear && !isLoading && (
            <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
              {trailingIcon}
            </span>
          )}
        </div>
      </div>

      {error && (
        <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-danger)', fontWeight: 'var(--font-weight-medium)' }}>
          {error}
        </span>
      )}
      {!error && helperText && (
        <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>
          {helperText}
        </span>
      )}
    </div>
  );
};
