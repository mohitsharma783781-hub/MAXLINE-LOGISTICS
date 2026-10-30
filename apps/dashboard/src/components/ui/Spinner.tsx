import React from 'react';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 20,
  color = 'var(--color-violet-main)',
  style,
}) => {
  return (
    <Loader2
      size={size}
      style={{
        animation: 'spin 1s linear infinite',
        color,
        display: 'inline-block',
        ...style,
      }}
    />
  );
};
