import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App';

// One-time client-side purge to start completely fresh without old demo/XYZ data
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (localStorage.getItem('maxline_clean_start_purge_v1') !== 'true') {
      const currentUserRaw = localStorage.getItem('courrier3_current_user');
      const isOldXyz = currentUserRaw && (
        currentUserRaw.includes('XYZ LOGISTICS') ||
        currentUserRaw.includes('48dba919-ca2a-4a86-b645-f795f70e9d59')
      );

      // Only purge if it was the old XYZ demo session
      if (isOldXyz) {
        localStorage.removeItem('courrier3_current_user');
        localStorage.removeItem('courrier3_active_portal');
        localStorage.removeItem('courrier3_active_tenant_id');
        localStorage.removeItem('courrier3_auth_session');
        localStorage.removeItem('courrier3_admin_impersonating');
        localStorage.removeItem('courrier3_admin_original_session');
        localStorage.removeItem('COURRIER3_WAREHOUSE_STORE');
        localStorage.removeItem('courrier3_shipments_store');
        localStorage.removeItem('maxline_pickups_store');
        localStorage.removeItem('maxline_manifests_store');
        localStorage.removeItem('maxline_merchants_registry');
        localStorage.removeItem('courrier3_tenants_registry');
      }
      localStorage.removeItem('courrier3_tenant_security_events');
      localStorage.removeItem('MAXLINE_RATE_ASSIGNMENTS_STORE');

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('COURRIER3_WALLET_STORE_') || key.startsWith('COURRIER3_TX_STORE_'))) {
          localStorage.removeItem(key);
        }
      }

      localStorage.setItem('maxline_clean_start_purge_v1', 'true');
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
