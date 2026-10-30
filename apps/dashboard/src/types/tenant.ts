export interface TenantThemeConfig {
  primaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  companyName: string;
  domain?: string;
}

export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'suspended' | 'trial';
  planTier: 'starter' | 'growth' | 'enterprise';
  theme: TenantThemeConfig;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: 'superadmin' | 'admin' | 'merchant' | 'staff';
}
