import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = '8px',
  className = '',
  style,
}) => {
  return (
    <div
      className={`shimmer-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#f1f5f9',
        ...style,
      }}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 6 }) => {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 0' }}>
      {/* Table Header Skeleton */}
      <div style={{ display: 'flex', gap: '16px', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height="14px" width={i === 0 ? '120px' : i === 1 ? '160px' : '90px'} />
        ))}
      </div>
      {/* Table Rows Skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', gap: '16px', padding: '14px 16px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              height="16px"
              width={colIndex === 0 ? '110px' : colIndex === 1 ? '180px' : colIndex === 2 ? '90px' : '70px'}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', width: '100%' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton height="14px" width="100px" />
          <Skeleton height="32px" width="140px" borderRadius="6px" />
          <Skeleton height="12px" width="80px" />
        </div>
      ))}
    </div>
  );
};

