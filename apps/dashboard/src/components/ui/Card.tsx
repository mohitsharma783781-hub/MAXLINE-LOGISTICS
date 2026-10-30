import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  variant?: 'default' | 'outlined' | 'elevated' | 'interactive' | 'accent';
}

export interface CardTitleProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export interface CardDescriptionProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  subtitle?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> & {
  Header: React.FC<CardProps>;
  Title: React.FC<CardTitleProps>;
  Description: React.FC<CardDescriptionProps>;
  Actions: React.FC<CardProps>;
  Body: React.FC<CardProps>;
  Content: React.FC<CardProps>;
  Footer: React.FC<CardProps>;
  StatCard: React.FC<StatCardProps>;
} = ({ children, style, onClick, interactive, variant = 'default', className = '' }) => {
  const isClickable = Boolean(onClick || interactive || variant === 'interactive');

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border-strong)',
          boxShadow: 'none',
        };
      case 'elevated':
        return {
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
        };
      case 'accent':
        return {
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderLeft: '4px solid var(--color-blue-main)',
          boxShadow: 'var(--shadow-md)',
        };
      case 'interactive':
      case 'default':
      default:
        return {
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-md)',
        };
    }
  };

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base)',
        cursor: isClickable ? 'pointer' : undefined,
        ...getVariantStyles(),
        ...style,
      }}
      onMouseEnter={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = style?.boxShadow ? String(style.boxShadow) : 'var(--shadow-md)';
        }
      }}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardProps> = ({ children, style }) => (
  <div
    style={{
      padding: 'var(--space-4) var(--space-5)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-4)',
      ...style,
    }}
  >
    {children}
  </div>
);

const CardTitle: React.FC<CardTitleProps> = ({ children, style }) => (
  <h3
    style={{
      fontSize: 'var(--font-size-h4)',
      fontWeight: 'var(--font-weight-bold)',
      color: 'var(--color-text-primary)',
      lineHeight: 'var(--line-height-tight)',
      margin: 0,
      ...style,
    }}
  >
    {children}
  </h3>
);

const CardDescription: React.FC<CardDescriptionProps> = ({ children, style }) => (
  <p
    style={{
      fontSize: 'var(--font-size-small)',
      color: 'var(--color-text-muted)',
      marginTop: 'var(--space-1)',
      marginBottom: 0,
      ...style,
    }}
  >
    {children}
  </p>
);

const CardActions: React.FC<CardProps> = ({ children, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', ...style }}>
    {children}
  </div>
);

const CardBody: React.FC<CardProps> = ({ children, style }) => (
  <div style={{ padding: 'var(--space-5)', ...style }}>{children}</div>
);

const CardFooter: React.FC<CardProps> = ({ children, style }) => (
  <div
    style={{
      padding: 'var(--space-4) var(--space-5)',
      borderTop: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...style,
    }}
  >
    {children}
  </div>
);

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType = 'positive', icon, subtitle, style }) => (
  <Card style={{ padding: 'var(--space-5)', ...style }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <span style={{ fontSize: 'var(--font-size-caption)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </span>
        <div style={{ fontSize: 'var(--font-size-h1)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginTop: 'var(--space-1)' }}>
          {value}
        </div>
      </div>
      {icon && (
        <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-blue-main)', flexShrink: 0 }}>
          {icon}
        </div>
      )}
    </div>
    {(change || subtitle) && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-3)', fontSize: 'var(--font-size-caption)' }}>
        {change && (
          <span style={{
            fontWeight: 'var(--font-weight-bold)',
            color: changeType === 'positive' ? 'var(--color-success)' : changeType === 'negative' ? 'var(--color-danger)' : 'var(--color-text-muted)',
          }}>
            {change}
          </span>
        )}
        {subtitle && <span style={{ color: 'var(--color-text-muted)' }}>{subtitle}</span>}
      </div>
    )}
  </Card>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Actions = CardActions;
Card.Body = CardBody;
Card.Content = CardBody;
Card.Footer = CardFooter;
Card.StatCard = StatCard;
