import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App';

// Client-side purge to start completely fresh without old demo/XYZ data
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (localStorage.getItem('maxline_clean_start_purge_v2') !== 'true') {
      const obRaw = localStorage.getItem('courrier3_onboarding_records');
      if (obRaw && (obRaw.includes('Apex') || obRaw.includes('Zenith') || obRaw.includes('FreshKart') || obRaw.includes('CUST-1001'))) {
        localStorage.removeItem('courrier3_onboarding_records');
      }
      localStorage.removeItem('courrier3_tenants_registry');
      localStorage.removeItem('courrier3_tenant_security_events');
      localStorage.setItem('maxline_clean_start_purge_v2', 'true');
    }
  }
} catch (e) {
  console.warn('[Startup] Purge check error:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
