import React from 'react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  return (
    <div
      style={{
        padding: 'var(--space-8)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--color-danger-bg)',
        border: '1px solid var(--color-danger-border)',
        color: 'var(--color-danger-text)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-3)',
      }}
    >
      <h4 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'inherit' }}>
        {title}
      </h4>
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'inherit', maxWidth: '500px' }}>{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="danger" size="sm" style={{ marginTop: 'var(--space-2)' }}>
          Retry Request
        </Button>
      )}
    </div>
  );
};
