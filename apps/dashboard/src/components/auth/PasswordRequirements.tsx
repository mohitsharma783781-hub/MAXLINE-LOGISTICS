import React from 'react';
import { Check, X } from 'lucide-react';

export interface PasswordRequirementsProps {
  password?: string;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ password = '' }) => {
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);

  const rules = [
    { label: 'Minimum 8 characters', valid: hasMinLength },
    { label: 'At least one number (0-9)', valid: hasNumber },
    { label: 'At least one uppercase letter (A-Z)', valid: hasUppercase },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1-5, 6px)',
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-default)',
        backgroundColor: 'var(--color-surface-secondary)',
        border: '1px solid var(--color-border)',
        fontSize: 'var(--font-size-caption)',
      }}
    >
      <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>
        Password Requirements:
      </span>
      {rules.map((rule, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {rule.valid ? (
            <Check size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
          ) : (
            <X size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          )}
          <span
            style={{
              color: rule.valid ? 'var(--color-success)' : 'var(--color-text-muted)',
              fontWeight: rule.valid ? 'var(--font-weight-medium)' : 'var(--font-weight-regular)',
            }}
          >
            {rule.label}
          </span>
        </div>
      ))}
    </div>
  );
};
