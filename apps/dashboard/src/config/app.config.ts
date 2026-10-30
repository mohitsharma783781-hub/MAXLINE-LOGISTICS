export const APP_CONFIG = {
  name: 'MAXLINE LOGISTICS',
  version: '1.0.0-foundation',
  defaultTenant: {
    name: 'MAXLINE LOGISTICS Enterprise',
    logoUrl: '/favicon.ico',
  },
  breakpoints: {
    mobile: 320,
    tablet: 640,
    desktop: 1024,
    large: 1440,
  },
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
    timeoutMs: 15000,
  },
  theme: {
    defaultTheme: 'light' as const,
    supportedThemes: ['light', 'dark', 'system'] as const,
  },
} as const;
