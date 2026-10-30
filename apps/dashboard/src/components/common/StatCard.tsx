import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { StatusType } from '../../types/component';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  badgeText?: string;
  badgeVariant?: StatusType;
  icon?: React.ElementType;
  style?: React.CSSProperties;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  badgeText,
  badgeVariant = 'neutral',
  icon: Icon,
  style,
}) => {
  return (
    <Card
      style={{
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: '135px',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* Top Row: Label (Left) + Icon (Right) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginBottom: '10px',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            lineHeight: '1.3',
          }}
        >
          {label}
        </span>

        {Icon && (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-surface-secondary)',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={16} />
          </div>
        )}
      </div>

      {/* Middle Row: Large Value */}
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 1,
            margin: 0,
            fontFeatureSettings: '"tnum"',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </div>
      </div>

      {/* Bottom Supporting Row */}
      {(subtext || badgeText) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            fontSize: '12px',
            lineHeight: 1.4,
          }}
        >
          {badgeText && (
            <Badge variant={badgeVariant} size="sm">
              {badgeText}
            </Badge>
          )}
          {subtext && (
            <span
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '12px',
              }}
            >
              {subtext}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
