import React from 'react';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const parseSize = (s: number | string): number => {
  if (typeof s === 'number') return s;
  if (s === 'sm') return 16;
  if (s === 'md') return 20;
  if (s === 'lg') return 32;
  if (s === 'xl') return 48;
  const parsed = parseInt(s, 10);
  return isNaN(parsed) ? 20 : parsed;
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 20,
  color = 'var(--color-violet-main)',
  style,
}) => {
  const numericSize = parseSize(size);
  return (
    <Loader2
      size={numericSize}
      style={{
        animation: 'spin 1s linear infinite',
        color,
        display: 'inline-block',
        ...style,
      }}
    />
  );
};
