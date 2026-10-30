import React from 'react';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  id,
  style,
  disabled,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: style?.width || '100%' }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#334155',
          }}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        disabled={disabled}
        style={{
          height: '40px',
          padding: '0 12px',
          fontSize: '14px',
          borderRadius: '8px',
          border: error ? '1px solid #DC2626' : '1px solid #CBD5E1',
          backgroundColor: disabled ? '#F1F5F9' : '#FFFFFF',
          color: disabled ? '#94A3B8' : '#0F172A',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          ...style,
        }}
        {...props}
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span style={{ fontSize: '12px', color: '#DC2626' }}>
          {error}
        </span>
      )}
    </div>
  );
};
