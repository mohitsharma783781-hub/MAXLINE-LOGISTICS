import { useState, useEffect } from 'react';
import { APP_CONFIG } from '../config/app.config';

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  windowWidth: number;
}

export function useBreakpoints(): BreakpointState {
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { tablet, desktop, large } = APP_CONFIG.breakpoints;

  return {
    isMobile: windowWidth < tablet,
    isTablet: windowWidth >= tablet && windowWidth < desktop,
    isDesktop: windowWidth >= desktop && windowWidth < large,
    isLargeDesktop: windowWidth >= large,
    windowWidth,
  };
}
