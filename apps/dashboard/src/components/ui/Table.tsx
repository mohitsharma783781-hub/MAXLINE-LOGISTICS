import React from 'react';
import { Skeleton } from './Skeleton';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => React.ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  emptyText?: string;
  isLoading?: boolean;
  footer?: React.ReactNode;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  emptyText = 'No records found',
  isLoading = false,
  footer,
}: TableProps<T>) {
  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--color-surface)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: 'var(--font-size-body)',
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: 'var(--color-background)',
              borderBottom: '2px solid var(--color-border)',
              position: 'sticky',
              top: 0,
              zIndex: 2,
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  fontWeight: 'var(--font-weight-bold)',
                  fontSize: 'var(--font-size-small)',
                  color: 'var(--color-text-secondary)',
                  textAlign: col.align || 'left',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.01em',
                  textTransform: 'uppercase',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                {columns.map((col) => (
                  <td key={col.key} style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Skeleton height="20px" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: 'var(--space-8) var(--space-4)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-body)',
                }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  height: '52px',
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--color-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--color-surface)';
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      color: 'var(--color-text-primary)',
                      textAlign: col.align || 'left',
                      verticalAlign: 'middle',
                    }}
                  >
                    {col.render ? col.render(row) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {footer}
    </div>
  );
}
