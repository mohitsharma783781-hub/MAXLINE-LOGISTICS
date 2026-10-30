import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  style?: React.CSSProperties;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description: _description,
  breadcrumbs,
  actions,
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        marginBottom: '16px',
        ...style,
      }}
    >
      {/* Breadcrumbs Trail */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#64748B',
            marginBottom: '2px',
          }}
        >
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight size={12} style={{ opacity: 0.6 }} />}
                {item.path && !isLast ? (
                  <Link
                    to={item.path}
                    style={{
                      color: '#475569',
                      textDecoration: 'none',
                      transition: 'color 150ms ease',
                    }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    style={{
                      color: isLast ? '#0F172A' : '#64748B',
                      fontWeight: isLast ? '600' : '400',
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Header Title & Actions Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#0F172A',
              lineHeight: '1.2',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {title}
          </h1>
        </div>

        {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>{actions}</div>}
      </div>
    </div>
  );
};
