import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultExpandedId?: string;
  allowMultiple?: boolean;
  style?: React.CSSProperties;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  defaultExpandedId,
  allowMultiple = false,
  style,
}) => {
  const [expandedIds, setExpandedIds] = useState<string[]>(
    defaultExpandedId ? [defaultExpandedId] : []
  );

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setExpandedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setExpandedIds((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        width: '100%',
        ...style,
      }}
    >
      {items.map((item) => {
        const isExpanded = expandedIds.includes(item.id);
        return (
          <div
            key={item.id}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-default)',
              backgroundColor: 'var(--color-surface)',
              overflow: 'hidden',
              transition: 'border-color var(--transition-fast)',
            }}
          >
            <button
              onClick={() => toggleItem(item.id)}
              style={{
                width: '100%',
                padding: 'var(--space-4) var(--space-5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-4)',
                backgroundColor: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: 'var(--font-size-body)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
              }}
              aria-expanded={isExpanded}
            >
              <span>{item.title}</span>
              <ChevronDown
                size={18}
                style={{
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform var(--transition-fast)',
                  color: 'var(--color-text-secondary)',
                  flexShrink: 0,
                }}
              />
            </button>

            {isExpanded && (
              <div
                style={{
                  padding: '0 var(--space-5) var(--space-4) var(--space-5)',
                  fontSize: 'var(--font-size-body)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--line-height-normal)',
                  borderTop: '1px solid var(--color-border-subtle, var(--color-border))',
                  marginTop: '-1px',
                }}
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
