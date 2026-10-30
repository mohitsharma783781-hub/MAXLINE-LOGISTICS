import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicHeader } from '../components/public/PublicHeader';
import { PublicFooter } from '../components/public/PublicFooter';
import { PageFallback } from '../components/common/PageFallback';
import { RouteTransitBeam } from '../components/common/RouteTransitBeam';

export const PublicWebsiteLayout: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-background)' }}>
      <RouteTransitBeam />
      <PublicHeader />
      <main style={{ flex: 1 }}>
        <React.Suspense fallback={<PageFallback />}>
          <Outlet />
        </React.Suspense>
      </main>
      <PublicFooter />
    </div>
  );
};
