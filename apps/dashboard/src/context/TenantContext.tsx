import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  TenantProfile,
  TenantSecurityEvent,
} from '../services/tenantService';
import {
  TenantService,
  INITIAL_TENANTS,
} from '../services/tenantService';
import { useRbac } from './RbacContext';
import { supabase } from '../lib/supabaseClient';
import { isValidUUID } from '../utils/uuidHelper';

interface TenantContextType {
  activeTenantId: string;
  activeTenant: TenantProfile | null;
  tenants: TenantProfile[];
  securityEvents: TenantSecurityEvent[];
  setActiveTenantId: (tenantId: string) => void;
  scopeData: <T extends Record<string, unknown>>(items: T[]) => T[];
  validateOwnership: (recordTenantId?: string) => boolean;
  logSecurityViolation: (
    eventType: TenantSecurityEvent['eventType'],
    targetResource: string,
    details: string
  ) => void;
  refreshTenantProfile: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// High-speed memory cache for tenant profiles to eliminate redundant PostgreSQL queries on route transitions
const tenantProfileCache = new Map<string, { profile: TenantProfile; timestamp: number }>();
const TENANT_CACHE_TTL_MS = 120 * 1000; // 2 minutes

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentRole } = useRbac();
  const isSuperAdmin = currentRole?.code === 'SUPER_ADMIN';

  const [tenants, setTenants] = useState<TenantProfile[]>(() => TenantService.getTenants());
  const [securityEvents, setSecurityEvents] = useState<TenantSecurityEvent[]>(() =>
    TenantService.getSecurityEvents()
  );

  // Initialize from active storage, but do NOT default to demo tenant
  const [activeTenantId, setActiveTenantIdState] = useState<string>(() => {
    return localStorage.getItem('courrier3_active_tenant_id') || '';
  });

  const [activeTenant, setActiveTenant] = useState<TenantProfile | null>(null);

  // Synchronize tenant profile from Supabase PostgreSQL
  const resolveTenantProfile = useCallback(async (tenantId: string, forceRefresh = false): Promise<TenantProfile | null> => {
    if (!tenantId) return null;

    if (!forceRefresh) {
      const cached = tenantProfileCache.get(tenantId);
      if (cached && Date.now() - cached.timestamp < TENANT_CACHE_TTL_MS) {
        return cached.profile;
      }
    }

    if (tenantId === 'ALL') {
      const allProfile: TenantProfile = {
        tenantId: 'ALL',
        companyName: 'Platform Headquarters',
        slug: 'all',
        status: 'ACTIVE',
        planTier: 'Enterprise',
        createdAt: '2026-01-01',
        assignedRateCards: [],
        assignedManager: 'HQ Administrator',
        contactEmail: 'admin@maxline.in',
        contactMobile: '',
        gstNumber: '',
      };
      tenantProfileCache.set('ALL', { profile: allProfile, timestamp: Date.now() });
      return allProfile;
    }

    // 1. If valid UUID, query Supabase merchants table
    if (isValidUUID(tenantId)) {
      try {
        const { data, error } = await supabase
          .from('merchants')
          .select('*')
          .eq('id', tenantId)
          .maybeSingle();

        if (!error && data) {
          const company = data.business_name || 'My Logistics Hub';
          const profile: TenantProfile = {
            tenantId: data.id,
            companyName: company,
            slug: company.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            status: data.status || 'ACTIVE',
            planTier: 'Growth',
            createdAt: data.created_at ? new Date(data.created_at).toISOString().split('T')[0] : '2026-01-01',
            assignedRateCards: ['RC-STANDARD'],
            assignedManager: 'Support Desk',
            contactEmail: '',
            contactMobile: '',
            gstNumber: '',
          };
          tenantProfileCache.set(tenantId, { profile, timestamp: Date.now() });
          return profile;
        }
      } catch (_err) {
        // Query failed, fall back to checking local demo registry or current user metadata
      }

      // If valid UUID but no DB row yet, check current user metadata if explicit business name exists
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('courrier3_current_user') : null;
        if (raw) {
          const u = JSON.parse(raw);
          if (u.businessName && !u.businessName.toLowerCase().includes('tenant-') && !u.businessName.toLowerCase().includes('skyon')) {
            const fallbackProfile: TenantProfile = {
              tenantId,
              companyName: u.businessName,
              slug: u.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              status: 'ACTIVE',
              planTier: 'Growth',
              createdAt: new Date().toISOString().split('T')[0],
              assignedRateCards: ['RC-STANDARD'],
              assignedManager: 'Support Desk',
              contactEmail: u.workEmail || '',
              contactMobile: u.phoneNumber || '',
              gstNumber: '',
            };
            tenantProfileCache.set(tenantId, { profile: fallbackProfile, timestamp: Date.now() });
            return fallbackProfile;
          }
        }
      } catch {}
    }

    // 2. Check local demo mock registry if present (for test tenants like TENANT-1001)
    const localMatch = INITIAL_TENANTS.find((t) => t.tenantId === tenantId);
    if (localMatch) {
      return localMatch;
    }

    // Fail-Closed: Never fall back to Apex Logistics for unknown IDs
    return null;
  }, []);

  // Synchronize active tenant directly from Supabase session
  useEffect(() => {
    const syncFromAuthUser = async (u: any) => {
      if (!u) return;
      const appMetadata = u.app_metadata || {};
      const platformRole = (appMetadata.platform_role || appMetadata.role || '').toString().toLowerCase();
      const isPlatformAdmin = platformRole === 'super_admin' || platformRole === 'admin_operator' || platformRole === 'operator';
      if (isPlatformAdmin) {
        setActiveTenantIdState('ALL');
        localStorage.setItem('courrier3_active_tenant_id', 'ALL');
        return;
      }

      let resolvedTid: string | undefined = u.app_metadata?.tenant_id || u.app_metadata?.merchant_id;

      if (!resolvedTid) {
        try {
          const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', u.id)
            .maybeSingle();

          if (profile?.id) {
            const { data: member } = await supabase
              .from('merchant_members')
              .select('merchant_id')
              .eq('user_id', profile.id)
              .order('is_default', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (member?.merchant_id) {
              resolvedTid = member.merchant_id;
            }
          }
        } catch (_err) {}
      }

      if (resolvedTid) {
        setActiveTenantIdState((prev) => (prev !== resolvedTid ? resolvedTid : prev));
        localStorage.setItem('courrier3_active_tenant_id', resolvedTid);
      } else {
        // Authenticated user with no merchant organization provisioned yet
        const currentStored = localStorage.getItem('courrier3_active_tenant_id');
        if (currentStored && currentStored.startsWith('tenant-demo')) {
          // preserve demo tenant in demo mode
        } else if (currentStored && isValidUUID(currentStored) && currentStored !== u.id) {
          // preserve non-auth UUID
        } else {
          setActiveTenantIdState('');
          localStorage.removeItem('courrier3_active_tenant_id');
        }
      }
    };

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        syncFromAuthUser(data.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncFromAuthUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (activeTenantId) {
      localStorage.setItem('courrier3_active_tenant_id', activeTenantId);
      resolveTenantProfile(activeTenantId).then((profile) => {
        if (isMounted) {
          setActiveTenant(profile);
          if (profile && !tenants.some((t) => t.tenantId === profile.tenantId)) {
            setTenants((prev) => [profile, ...prev]);
          }
        }
      });
    } else {
      setActiveTenant(null);
    }

    return () => {
      isMounted = false;
    };
  }, [activeTenantId, resolveTenantProfile, tenants]);

  const setActiveTenantId = (tenantId: string) => {
    setActiveTenantIdState(tenantId);
  };

  const refreshTenantProfile = async () => {
    if (activeTenantId) {
      tenantProfileCache.delete(activeTenantId);
      const profile = await resolveTenantProfile(activeTenantId, true);
      setActiveTenant(profile);
    }
  };

  const logSecurityViolation = (
    eventType: TenantSecurityEvent['eventType'],
    targetResource: string,
    details: string
  ) => {
    const newEvt = TenantService.logSecurityEvent(
      activeTenantId || 'UNASSIGNED',
      'authenticated_user@skyonship.com',
      eventType,
      targetResource,
      details
    );
    setSecurityEvents((prev) => [newEvt, ...prev]);
  };

  const scopeData = <T extends Record<string, unknown>>(items: T[]): T[] => {
    if (!activeTenantId) return [];
    return TenantService.scopeDataByTenant(items, activeTenantId, isSuperAdmin);
  };

  const validateOwnership = (recordTenantId?: string): boolean => {
    if (!recordTenantId) return true;
    if (!activeTenantId) return false;
    const isValid = TenantService.validateOwnership(recordTenantId, activeTenantId, isSuperAdmin);
    if (!isValid) {
      logSecurityViolation(
        'Cross-Tenant Access Blocked',
        `Record Tenant: ${recordTenantId}`,
        `Attempted cross-tenant access from active tenant ${activeTenantId}`
      );
    }
    return isValid;
  };

  return (
    <TenantContext.Provider
      value={{
        activeTenantId,
        activeTenant,
        tenants,
        securityEvents,
        setActiveTenantId,
        scopeData,
        validateOwnership,
        logSecurityViolation,
        refreshTenantProfile,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
