import React, { useState } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
  showCharacterCount?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  requiredIndicator,
  showCharacterCount,
  maxLength,
  value,
  id,
  style,
  disabled,
  readOnly,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1-5, 6px)', width: '100%' }}>
      {label && (
        <label
          htmlFor={textareaId}
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

      <textarea
        id={textareaId}
        disabled={disabled}
        readOnly={readOnly}
        value={value}
        maxLength={maxLength}
        onFocus={(e) => {
          setIsFocused(true);
          if (onFocus) onFocus(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          if (onBlur) onBlur(e);
        }}
        style={{
          minHeight: '80px',
          width: '100%',
          padding: 'var(--space-3)',
          fontSize: 'var(--font-size-body)',
          borderRadius: 'var(--radius-default)',
          border: error
            ? '1px solid var(--color-danger)'
            : isFocused
            ? '1px solid var(--color-violet-main)'
            : '1px solid var(--color-border)',
          boxShadow: isFocused
            ? error
              ? '0 0 0 3px rgba(220, 38, 38, 0.15)'
              : '0 0 0 3px rgba(124, 58, 237, 0.15)'
            : 'none',
          backgroundColor: disabled || readOnly ? 'var(--color-surface-secondary)' : 'var(--color-surface)',
          color: disabled ? 'var(--color-text-disabled)' : 'var(--color-text-primary)',
          transition: 'all var(--transition-fast)',
          outline: 'none',
          resize: 'vertical',
          cursor: disabled ? 'not-allowed' : readOnly ? 'default' : 'text',
          ...style,
        }}
        {...props}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {error ? (
          <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-danger)', fontWeight: 'var(--font-weight-medium)' }}>
            {error}
          </span>
        ) : helperText ? (
          <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>
            {helperText}
          </span>
        ) : (
          <span />
        )}

        {showCharacterCount && maxLength && (
          <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
};
