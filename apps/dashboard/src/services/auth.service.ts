import { supabase } from '../lib/supabaseClient';
import type {
  IAuthService,
  LoginCredentials,
  SignupPayload,
  AuthResponse,
  AuthUser,
  UserRole,
} from '../types/auth';

/**
 * Production-ready AuthService integrating native Supabase Authentication
 * and PostgreSQL Row-Level Security (RLS) multi-tenant isolation.
 *
 * Security Guarantees:
 * 1. Passwords are never stored or logged in browser storage.
 * 2. Authenticates directly against Supabase auth.users.
 * 3. Tenant provisioning is handled atomically via PostgreSQL triggers.
 * 4. Fails closed: unauthenticated sessions receive null and are denied access.
 */
let cachedUser: AuthUser | null = null;
let cachedUserTimestamp = 0;
const USER_CACHE_TTL_MS = 60 * 1000; // 60 seconds memory cache to prevent sequential network waterfalls

export class AuthService implements IAuthService {
  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    cachedUser = null;
    cachedUserTimestamp = 0;
    try {
      const emailLower = credentials.workEmail.trim().toLowerCase();
      const pass = credentials.password;

      if (!emailLower || !pass) {
        return {
          message: 'Please provide both work email and password.',
        };
      }

      // 1. Try real Supabase Auth first
      let supabaseUser: any = null;
      let supabaseSession: any = null;
      let supabaseErrorMsg: string | null = null;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailLower,
          password: pass,
        });

        if (!error && data?.user) {
          supabaseUser = data.user;
          supabaseSession = data.session;
        } else if (error) {
          supabaseErrorMsg = error.message;
        }
      } catch (err: any) {
        supabaseErrorMsg = err?.message || 'Authentication service error';
      }

      if (supabaseUser) {
        const user = supabaseUser;

        // SECURE PLATFORM ADMIN ROLE RESOLUTION:
        // Determined exclusively by server-controlled, immutable app_metadata.
        // Client-controlled email string heuristics (e.g. email containing "admin") are strictly forbidden.
        const appMetadata = user.app_metadata || {};
        const rawPlatformClaim = (appMetadata.platform_role || appMetadata.role || '').toString().toLowerCase();

        let verifiedRole: UserRole = 'customer';
        let isPlatformAdmin = false;

        if (rawPlatformClaim === 'super_admin') {
          verifiedRole = 'super_admin';
          isPlatformAdmin = true;
        } else if (rawPlatformClaim === 'admin_operator' || rawPlatformClaim === 'operator') {
          verifiedRole = 'admin_operator';
          isPlatformAdmin = true;
        }

        let tenantId: string | undefined = appMetadata.tenant_id || appMetadata.merchant_id;
        let merchantBusinessName: string | undefined = user.user_metadata?.business_name;

        if (!tenantId && !isPlatformAdmin) {
          try {
            const { data: profile } = await supabase
              .from('users')
              .select('id, full_name, phone')
              .eq('auth_user_id', user.id)
              .maybeSingle();

            if (profile?.id) {
              const { data: member } = await supabase
                .from('merchant_members')
                .select('merchant_id, role')
                .eq('user_id', profile.id)
                .order('is_default', { ascending: false })
                .limit(1)
                .maybeSingle();
              if (member?.merchant_id) {
                tenantId = member.merchant_id;
                const { data: merchantRow } = await supabase
                  .from('merchants')
                  .select('business_name')
                  .eq('id', tenantId)
                  .maybeSingle();
                if (merchantRow?.business_name) {
                  merchantBusinessName = merchantRow.business_name;
                }
              }
            }
          } catch (_fetchErr) {}
        }

        const resolvedTenantId = isPlatformAdmin ? 'ALL' : (tenantId || '');

        const authUser: AuthUser = {
          id: user.id,
          fullName: user.user_metadata?.full_name || (isPlatformAdmin ? 'MAXLINE Administrator' : 'Merchant User'),
          workEmail: user.email || emailLower,
          role: verifiedRole,
          businessName: isPlatformAdmin ? 'MAXLINE Super Admin' : (merchantBusinessName || ''),
          phoneNumber: user.user_metadata?.phone_number,
          businessType: user.user_metadata?.business_type,
          tenantId: resolvedTenantId,
        };

        if (typeof window !== 'undefined' && window.localStorage) {
          if (resolvedTenantId) {
            localStorage.setItem('courrier3_active_tenant_id', resolvedTenantId);
          } else {
            localStorage.removeItem('courrier3_active_tenant_id');
          }
          localStorage.setItem('courrier3_current_user', JSON.stringify(authUser));
        }

        return {
          user: authUser,
          token: supabaseSession?.access_token || '',
          message: 'Signed in successfully.',
        };
      }

      return {
        message: supabaseErrorMsg || 'Invalid credentials. Please verify your email and password.',
      };
    } catch (err: any) {
      return {
        message: err.message || 'Failed to sign in. Please verify your credentials.',
      };
    }
  }

  async signUp(payload: SignupPayload): Promise<AuthResponse> {
    try {
      const emailNorm = payload.workEmail.trim().toLowerCase();

      if (!emailNorm || !payload.password) {
        return {
          message: 'Work email and password are required.',
        };
      }

      // Delegate registration to Supabase Auth with metadata.
      // PostgreSQL trigger `public.handle_new_auth_user()` automatically provisions
      // the new tenant UUID, user profile, and empty wallet in PostgreSQL upon insertion.
      const { data, error } = await supabase.auth.signUp({
        email: emailNorm,
        password: payload.password,
        options: {
          data: {
            full_name: payload.fullName,
            business_name: payload.businessName,
            phone_number: payload.phoneNumber,
            business_type: payload.businessType,
          },
        },
      });

      if (error) {
        return {
          message: error.message,
        };
      }

      if (!data.user) {
        return {
          message: 'Registration failed. No user was returned from authentication server.',
        };
      }

      // Attempt to resolve the newly provisioned tenant UUID if immediate session was returned
      let tenantId: string | undefined = data.user.app_metadata?.tenant_id;
      if (!tenantId) {
        try {
          const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', data.user.id)
            .maybeSingle();

          if (profile?.id) {
            const { data: member } = await supabase
              .from('merchant_members')
              .select('merchant_id')
              .eq('user_id', profile.id)
              .maybeSingle();
            if (member?.merchant_id) {
              tenantId = member.merchant_id;
            }
          }
        } catch (_fetchErr) {
          // If query fails (e.g. email confirmation required before session creation), tenant will be resolved on login
        }
      }

      const userTenantId = tenantId || '';

      const authUser: AuthUser = {
        id: data.user.id,
        fullName: payload.fullName,
        workEmail: emailNorm,
        role: 'customer',
        businessName: payload.businessName,
        phoneNumber: payload.phoneNumber,
        businessType: payload.businessType,
        tenantId: userTenantId,
      };

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('courrier3_active_portal', 'CUSTOMER');
        if (userTenantId) {
          localStorage.setItem('courrier3_active_tenant_id', userTenantId);
        } else {
          localStorage.removeItem('courrier3_active_tenant_id');
        }
        localStorage.setItem('courrier3_current_user', JSON.stringify(authUser));
      }

      return {
        user: authUser,
        token: data.session?.access_token || '',
        message: 'Account registered successfully.',
      };
    } catch (err: any) {
      return {
        message: err.message || 'Registration failed. Please try again.',
      };
    }
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }
      return {
        success: true,
        message: `Password reset instructions sent to ${cleanEmail}. Please check your inbox.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to request password reset. Please try again.',
      };
    }
  }

  async getCurrentUser(forceRefresh = false): Promise<AuthUser | null> {
    // 0. Return fast in-memory cache if valid to eliminate route change latency
    if (!forceRefresh && cachedUser && Date.now() - cachedUserTimestamp < USER_CACHE_TTL_MS) {
      return cachedUser;
    }

    // 1. Check native Supabase Auth session first
    try {
      let user: any = null;
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        user = data.user;
      } else {
        // Fallback to locally cached Supabase session if network glitch or offline
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          user = sessionData.session.user;
        }
      }

      if (user) {
        // SECURE PLATFORM ADMIN ROLE RESOLUTION:
        // Determined exclusively by server-controlled, immutable app_metadata.
        const appMetadata = user.app_metadata || {};
        const rawPlatformClaim = (appMetadata.platform_role || appMetadata.role || '').toString().toLowerCase();

        let verifiedRole: UserRole = 'customer';
        let isPlatformAdmin = false;

        if (rawPlatformClaim === 'super_admin') {
          verifiedRole = 'super_admin';
          isPlatformAdmin = true;
        } else if (rawPlatformClaim === 'admin_operator' || rawPlatformClaim === 'operator') {
          verifiedRole = 'admin_operator';
          isPlatformAdmin = true;
        }

        let tenantId: string | undefined = appMetadata.tenant_id || appMetadata.merchant_id;
        let merchantBusinessName: string | undefined = user.user_metadata?.business_name;

        if (!tenantId && !isPlatformAdmin) {
          try {
            const { data: profile } = await supabase
              .from('users')
              .select('id, full_name, phone')
              .eq('auth_user_id', user.id)
              .maybeSingle();

            if (profile?.id) {
              const { data: member } = await supabase
                .from('merchant_members')
                .select('merchant_id, role')
                .eq('user_id', profile.id)
                .order('is_default', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (member?.merchant_id) {
                tenantId = member.merchant_id;
                const { data: merchantRow } = await supabase
                  .from('merchants')
                  .select('business_name')
                  .eq('id', tenantId)
                  .maybeSingle();
                if (merchantRow?.business_name) {
                  merchantBusinessName = merchantRow.business_name;
                }
              }
            }
          } catch {}
        }

        const resolvedTenantId = isPlatformAdmin ? 'ALL' : (tenantId || '');

        const authUser: AuthUser = {
          id: user.id,
          fullName: user.user_metadata?.full_name || (isPlatformAdmin ? 'MAXLINE Administrator' : 'Merchant User'),
          workEmail: user.email || '',
          role: verifiedRole,
          businessName: isPlatformAdmin ? 'MAXLINE Super Admin' : (merchantBusinessName || ''),
          phoneNumber: user.user_metadata?.phone_number,
          businessType: user.user_metadata?.business_type,
          tenantId: resolvedTenantId,
        };

        cachedUser = authUser;
        cachedUserTimestamp = Date.now();

        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('courrier3_current_user', JSON.stringify(authUser));
          if (authUser.tenantId) {
            localStorage.setItem('courrier3_active_tenant_id', authUser.tenantId);
          } else {
            localStorage.removeItem('courrier3_active_tenant_id');
          }
        }

        return authUser;
      }
    } catch (_err) {
      // Supabase session lookup failed or network offline
    }

    cachedUser = null;
    cachedUserTimestamp = 0;

    // 2. Fail-Closed: If not authenticated in Supabase, purge any stale/mock local session and return null
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('courrier3_active_portal');
        localStorage.removeItem('courrier3_active_tenant_id');
        localStorage.removeItem('courrier3_current_user');
      }
    } catch {}

    return null;
  }

  async signOut(): Promise<void> {
    cachedUser = null;
    cachedUserTimestamp = 0;
    try {
      await supabase.auth.signOut();
    } catch (_err) {
      // Ignore network signout errors
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('courrier3_active_portal');
        localStorage.removeItem('courrier3_active_tenant_id');
        localStorage.removeItem('courrier3_current_user');
      }
    } catch (_err) {}
  }
}

export const authService = new AuthService();
