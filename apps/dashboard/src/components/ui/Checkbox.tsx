import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  indeterminate?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  disabled,
  id,
  style,
  onChange,
  ...props
}) => {
  const checkboxId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <label
      htmlFor={checkboxId}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        fontSize: 'var(--font-size-body)',
        color: disabled ? 'var(--color-text-disabled)' : 'var(--color-text-primary)',
        ...style,
      }}
    >
      <input
        type="checkbox"
        id={checkboxId}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        style={{
          width: '16px',
          height: '16px',
          borderRadius: 'var(--radius-sm)',
          accentColor: 'var(--color-violet-main)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
};
