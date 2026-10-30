export type RoutePortalType = 'public' | 'customer' | 'admin';

export interface RouteConfigItem {
  id: string;
  path: string;
  title: string;
  portal: RoutePortalType;
  iconName?: string;
  requiresAuth?: boolean;
  requiredRole?: 'superadmin' | 'admin' | 'merchant' | 'staff';
  children?: RouteConfigItem[];
}

export interface NavigationMenuItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  badge?: string | number;
}
