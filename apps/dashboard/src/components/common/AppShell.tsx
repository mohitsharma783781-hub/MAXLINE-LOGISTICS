import React, { useState } from 'react';
import { Sidebar, type NavGroupConfig } from './Sidebar';
import { Topbar } from './Topbar';
import { Drawer } from '../ui/Drawer';
import { useBreakpoints } from '../../hooks/useBreakpoints';
import { FloatingQuickAction } from './FloatingQuickAction';
import { RouteTransitBeam } from './RouteTransitBeam';

export interface AppShellProps {
  navigationGroups: NavGroupConfig[];
  brandName?: string;
  portalLabel?: string;
  children?: React.ReactNode;
  contentLayout?: 'constrained' | 'full';
  topBanner?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  navigationGroups,
  brandName = 'MAXLINE LOGISTICS',
  portalLabel = 'Enterprise Logistics Portal',
  children,
  topBanner,
}) => {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const { isMobile } = useBreakpoints();

  const handleToggleCollapse = () => {
    setIsDesktopCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: 'var(--color-background)',
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      {/* Desktop Sidebar (Hidden on Mobile) - Permanently pinned on left */}
      {!isMobile && (
        <Sidebar
          navigationGroups={navigationGroups}
          brandName={brandName}
          portalLabel={portalLabel}
          isCollapsed={isDesktopCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      )}

      {/* Mobile Drawer Navigation (Sheet Overlay) */}
      {isMobile && (
        <Drawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          position="left"
          title={`${brandName} Navigation`}
        >
          <div style={{ margin: '-var(--space-6)', backgroundColor: 'var(--color-sidebar-bg)', minHeight: '100%' }}>
            <Sidebar
              navigationGroups={navigationGroups}
              brandName={brandName}
              portalLabel={portalLabel}
              isCollapsed={false}
            />
          </div>
        </Drawer>
      )}

      {/* Main Structural Wrapper - Automatically stretches & resizes smoothly */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Top RBAC & Multi-Tenant Banner */}
        {topBanner && (
          <div style={{ flexShrink: 0 }}>
            {topBanner}
          </div>
        )}

        {/* Topbar Header */}
        <div style={{ flexShrink: 0 }}>
          <Topbar
            portalName={portalLabel}
            onMenuToggle={isMobile ? () => setIsMobileDrawerOpen(true) : undefined}
          />
        </div>

        {/* Flexible Main Content Area - ONLY this container scrolls */}
        <main
          style={{
            flex: 1,
            minHeight: 0,
            height: '100%',
            padding: isMobile ? 'var(--space-3)' : 'var(--space-4)',
            width: '100%',
            maxWidth: '100%',
            margin: '0 auto',
            overflowY: 'auto',
            overflowX: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>
      </div>

      {/* Floating Quick Action Button across portal */}
      <FloatingQuickAction />

      {/* Top Edge Route Transit Beam Glider */}
      <RouteTransitBeam />
    </div>
  );
};
