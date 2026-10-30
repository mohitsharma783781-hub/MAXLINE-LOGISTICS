import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Package, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface NavItemConfig {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string | number;
}

export interface NavGroupConfig {
  sectionLabel: string;
  categoryIcon?: React.ElementType;
  items: NavItemConfig[];
}

export interface SidebarProps {
  navigationGroups: NavGroupConfig[];
  brandName?: string;
  portalLabel?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  navigationGroups,
  brandName = 'MAXLINE LOGISTICS',
  portalLabel = 'Enterprise Logistics Portal',
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const location = useLocation();

  // Accordion open section state stored in localStorage
  const [openSection, setOpenSection] = useState<string>(() => {
    return localStorage.getItem('sidebar_open_section') || 'Orders';
  });

  // Automatically expand group section containing active path
  useEffect(() => {
    navigationGroups.forEach((group) => {
      const hasActive = group.items.some(
        (item) =>
          location.pathname === item.path ||
          (item.path !== '/app' && location.pathname.startsWith(item.path + '/'))
      );
      if (hasActive) {
        setOpenSection(group.sectionLabel);
        localStorage.setItem('sidebar_open_section', group.sectionLabel);
      }
    });
  }, [location.pathname, navigationGroups]);

  const handleToggleSection = (sectionLabel: string) => {
    const nextSection = openSection === sectionLabel ? '' : sectionLabel;
    setOpenSection(nextSection);
    localStorage.setItem('sidebar_open_section', nextSection);
  };

  return (
    <aside
      style={{
        width: isCollapsed ? '68px' : '250px',
        minWidth: isCollapsed ? '68px' : '250px',
        background: 'linear-gradient(180deg, var(--color-navy-main) 0%, #090D16 100%)',
        color: '#E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100%',
        maxHeight: '100vh',
        borderRight: '1px solid #1E293B',
        zIndex: 100,
        fontFamily: 'var(--font-sans)',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      {/* 1. BRAND HEADER & TOGGLE BUTTON */}
      <div
        style={{
          height: '64px',
          padding: isCollapsed ? '0 8px' : '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #1E293B',
          backgroundColor: '#090D16',
          gap: '8px',
          overflow: 'hidden',
        }}
      >
        {!isCollapsed ? (
          <>
            <Link
              to="/app"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#FFFFFF',
                textDecoration: 'none',
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '9px',
                  background: 'linear-gradient(135deg, var(--color-blue-main) 0%, var(--color-blue-hover) 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '17px',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                }}
              >
                ML
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: '800',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {brandName}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#9CA3AF',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {portalLabel}
                </span>
              </div>
            </Link>

            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Collapse Sidebar"
                aria-label="Collapse Sidebar"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0284c7';
                  e.currentTarget.style.borderColor = '#0284c7';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1E293B';
                  e.currentTarget.style.borderColor = '#334155';
                  e.currentTarget.style.color = '#94A3B8';
                }}
              >
                <ChevronsLeft size={16} />
              </button>
            )}
          </>
        ) : (
          onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0284c7';
                e.currentTarget.style.borderColor = '#0284c7';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1E293B';
                e.currentTarget.style.borderColor = '#334155';
                e.currentTarget.style.color = '#38BDF8';
              }}
            >
              <ChevronsRight size={18} />
            </button>
          ) : (
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--color-blue-main) 0%, var(--color-blue-hover) 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '17px',
              }}
            >
              {brandName.charAt(0)}
            </div>
          )
        )}
      </div>

      {/* 2. SCROLLABLE NAVIGATION BODY */}
      {isCollapsed ? (
        /* ========================================================================= */
        /* COLLAPSED ICON-ONLY VIEW */
        /* ========================================================================= */
        <div
          style={{
            flex: 1,
            padding: '16px 8px',
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            scrollbarWidth: 'none',
          }}
        >
          {navigationGroups.map((group, gIdx) => (
            <div key={group.sectionLabel} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {gIdx > 0 && (
                <div style={{ height: '1px', backgroundColor: '#1E293B', width: '28px', margin: '4px auto' }} />
              )}
              {group.items.map((item) => {
                const ItemIcon = item.icon;
                const isItemActive =
                  location.pathname === item.path ||
                  (item.path !== '/app' && location.pathname.startsWith(item.path + '/'));

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={`${item.label} (${group.sectionLabel})`}
                    style={{
                      width: '42px',
                      height: '42px',
                      margin: '0 auto',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isItemActive ? '#FFFFFF' : '#9CA3AF',
                      background: isItemActive
                        ? 'linear-gradient(135deg, var(--color-blue-main) 0%, var(--color-blue-hover) 100%)'
                        : 'transparent',
                      boxShadow: isItemActive ? '0 4px 12px rgba(2, 132, 199, 0.4)' : 'none',
                      textDecoration: 'none',
                      transition: 'all var(--transition-fast)',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!isItemActive) {
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.backgroundColor = '#1E293B';
                        e.currentTarget.style.transform = 'scale(1.06)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isItemActive) {
                        e.currentTarget.style.color = '#9CA3AF';
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    <ItemIcon size={18} />
                    {item.badge !== undefined && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: '#38BDF8',
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        /* ========================================================================= */
        /* EXPANDED FULL NAVIGATION VIEW */
        /* ========================================================================= */
        <div
          style={{
            flex: 1,
            padding: '16px 12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#334155 #0F172A',
          }}
        >
          {navigationGroups.map((group) => {
            const CategoryIcon = group.categoryIcon || Package;
            const isSingleItem = group.items.length === 1;

            if (isSingleItem) {
              const singleItem = group.items[0];
              const isItemActive =
                location.pathname === singleItem.path ||
                (singleItem.path !== '/app' && location.pathname.startsWith(singleItem.path + '/'));

              return (
                <div key={group.sectionLabel}>
                  <Link
                    to={singleItem.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-default)',
                      color: isItemActive ? '#FFFFFF' : '#9CA3AF',
                      background: isItemActive
                        ? 'linear-gradient(135deg, var(--color-blue-main) 0%, var(--color-blue-hover) 100%)'
                        : 'transparent',
                      boxShadow: isItemActive ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                      fontWeight: isItemActive ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                      fontSize: 'var(--font-size-sidebar)',
                      textDecoration: 'none',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isItemActive) {
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.backgroundColor = '#1E293B';
                        e.currentTarget.style.transform = 'translateX(3px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isItemActive) {
                        e.currentTarget.style.color = '#9CA3AF';
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <CategoryIcon size={18} style={{ color: isItemActive ? '#FFFFFF' : '#9CA3AF', flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {singleItem.label}
                      </span>
                    </div>
                    {singleItem.badge !== undefined && (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '11px',
                          fontWeight: 'var(--font-weight-bold)',
                          backgroundColor: isItemActive ? '#FFFFFF' : 'var(--color-blue-main)',
                          color: isItemActive ? 'var(--color-blue-main)' : '#FFFFFF',
                        }}
                      >
                        {singleItem.badge}
                      </span>
                    )}
                  </Link>
                </div>
              );
            }

            const isOpen = openSection === group.sectionLabel;
            const isAnyChildActive = group.items.some(
              (item) =>
                location.pathname === item.path ||
                (item.path !== '/app' && location.pathname.startsWith(item.path + '/'))
            );

            return (
              <div key={group.sectionLabel} style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Group Accordion Header */}
                <button
                  type="button"
                  onClick={() => handleToggleSection(group.sectionLabel)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-default)',
                    border: 'none',
                    background: 'transparent',
                    color: isAnyChildActive ? '#FFFFFF' : '#9CA3AF',
                    fontSize: 'var(--font-size-sidebar)',
                    fontWeight: isAnyChildActive ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'color var(--transition-fast), background-color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isAnyChildActive) {
                      e.currentTarget.style.color = '#FFFFFF';
                      e.currentTarget.style.backgroundColor = '#1E293B';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isAnyChildActive) {
                      e.currentTarget.style.color = '#9CA3AF';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CategoryIcon size={18} style={{ color: isAnyChildActive ? 'var(--color-blue-main)' : '#9CA3AF', flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {group.sectionLabel}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      color: '#64748B',
                    }}
                  />
                </button>

                {/* Collapsible Sub-menu Items */}
                <div
                  style={{
                    maxHeight: isOpen ? '300px' : '0px',
                    opacity: isOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    marginTop: isOpen ? '4px' : '0px',
                    paddingLeft: '14px',
                  }}
                >
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive =
                      location.pathname === item.path ||
                      (item.path !== '/app' && location.pathname.startsWith(item.path + '/'));

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '9px 12px 9px 24px',
                          borderRadius: 'var(--radius-default)',
                          color: isActive ? '#FFFFFF' : '#9CA3AF',
                          background: isActive
                            ? 'linear-gradient(135deg, var(--color-blue-main) 0%, var(--color-blue-hover) 100%)'
                            : 'transparent',
                          boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                          fontSize: '14px',
                          fontWeight: isActive ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                          textDecoration: 'none',
                          transition: 'all var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.color = '#FFFFFF';
                            e.currentTarget.style.backgroundColor = '#1E293B';
                            e.currentTarget.style.transform = 'translateX(3px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.color = '#9CA3AF';
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.transform = 'translateX(0)';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <ItemIcon size={16} style={{ color: isActive ? '#FFFFFF' : '#64748B', flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.label}
                          </span>
                        </div>

                        {item.badge !== undefined && (
                          <span
                            style={{
                              padding: '2px 7px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '11px',
                              fontWeight: 'var(--font-weight-bold)',
                              backgroundColor: isActive ? '#FFFFFF' : 'var(--color-blue-main)',
                              color: isActive ? 'var(--color-blue-main)' : '#FFFFFF',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
};
