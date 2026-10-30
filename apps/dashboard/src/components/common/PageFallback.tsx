import React from 'react';
import { Spinner } from '../ui/Spinner';

export const PageFallback: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        width: '100%',
        padding: '32px',
        gap: '14px',
      }}
    >
      <Spinner size={36} color="var(--color-primary, #2563eb)" />
      <span
        style={{
          fontSize: '13px',
          color: '#64748b',
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}
      >
        Loading page...
      </span>
    </div>
  );
};
