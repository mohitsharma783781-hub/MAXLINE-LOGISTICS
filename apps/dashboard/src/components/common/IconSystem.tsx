import React from 'react';
import * as LucideIcons from 'lucide-react';

export type IconName = keyof typeof LucideIcons;

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconColor = 
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'brand'
  | 'muted'
  | 'inverse'
  | 'inherit';

export interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: IconColor;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

const sizeMap: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

const colorMap: Record<IconColor, string> = {
  primary: 'var(--color-blue-main)',
  secondary: 'var(--color-text-secondary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  info: 'var(--color-info)',
  brand: 'var(--color-sky-main)',
  muted: 'var(--color-text-muted)',
  inverse: 'var(--color-text-inverse)',
  inherit: 'currentColor',
};

export const IconSystem: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = 'inherit',
  strokeWidth = 1.75,
  className = '',
  style,
}) => {
  const IconComponent = (LucideIcons[name] as React.ComponentType<LucideIcons.LucideProps>) || LucideIcons.HelpCircle;
  const numericSize = sizeMap[size];
  const colorValue = colorMap[color] || color;

  return (
    <IconComponent
      size={numericSize}
      strokeWidth={strokeWidth}
      color={colorValue}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
    />
  );
};
