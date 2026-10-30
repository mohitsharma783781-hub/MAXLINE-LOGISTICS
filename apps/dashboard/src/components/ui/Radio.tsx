import React from 'react';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Radio: React.FC<RadioProps> = ({
  label,
  checked,
  disabled,
  id,
  style,
  onChange,
  ...props
}) => {
  const radioId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <label
      htmlFor={radioId}
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
        type="radio"
        id={radioId}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        style={{
          width: '16px',
          height: '16px',
          accentColor: 'var(--color-violet-main)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
};
