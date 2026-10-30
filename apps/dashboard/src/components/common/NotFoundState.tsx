import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export const NotFoundState: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        textAlign: 'center',
        backgroundColor: 'var(--color-background)',
      }}
    >
      <span
        style={{
          fontSize: 'var(--font-size-4xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-primary)',
          lineHeight: 1,
          marginBottom: 'var(--space-2)',
        }}
      >
        404
      </span>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>
        Page Not Found
      </h1>
      <p
        style={{
          fontSize: 'var(--font-size-md)',
          color: 'var(--color-text-secondary)',
          maxWidth: '460px',
          marginBottom: 'var(--space-6)',
        }}
      >
        The requested URL path does not exist on this shipping platform instance.
      </p>
      <Link to="/">
        <Button variant="primary">Return to Homepage</Button>
      </Link>
    </div>
  );
};
