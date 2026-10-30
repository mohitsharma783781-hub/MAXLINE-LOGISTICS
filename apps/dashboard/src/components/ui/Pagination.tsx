import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  disabled?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  disabled = false,
}) => {
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-4)',
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        fontSize: 'var(--font-size-small)',
        color: 'var(--color-text-secondary)',
      }}
    >
      <div>
        {totalItems !== undefined && pageSize !== undefined ? (
          <span>
            Showing <strong style={{ color: 'var(--color-text-primary)' }}>{Math.min((currentPage - 1) * pageSize + 1, totalItems)}</strong> to{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{Math.min(currentPage * pageSize, totalItems)}</strong> of{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{totalItems}</strong> entries
          </span>
        ) : (
          <span>
            Page <strong style={{ color: 'var(--color-text-primary)' }}>{currentPage}</strong> of{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{totalPages}</strong>
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || isFirst}
          onClick={() => onPageChange(currentPage - 1)}
          leftIcon={<ChevronLeft size={16} />}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || isLast}
          onClick={() => onPageChange(currentPage + 1)}
          rightIcon={<ChevronRight size={16} />}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
