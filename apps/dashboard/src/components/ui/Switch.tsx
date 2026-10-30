import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  style?: React.CSSProperties;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  style,
}) => {
  const switchId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <label
      htmlFor={switchId}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        fontSize: 'var(--font-size-body)',
        color: disabled ? 'var(--color-text-disabled)' : 'var(--color-text-primary)',
        ...style,
      }}
    >
      <div
        onClick={() => !disabled && onChange(!checked)}
        style={{
          position: 'relative',
          width: '38px',
          height: '22px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: checked ? 'var(--color-violet-main)' : 'var(--color-border-strong)',
          transition: 'background-color var(--transition-fast)',
          opacity: disabled ? 0.5 : 1,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '18px' : '2px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow: 'var(--shadow-sm)',
            transition: 'left var(--transition-fast)',
          }}
        />
        <input
          type="checkbox"
          id={switchId}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        />
      </div>
      {label && <span>{label}</span>}
    </label>
  );
};
