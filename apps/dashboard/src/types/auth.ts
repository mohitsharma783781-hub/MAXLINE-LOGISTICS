export type UserRole = 'customer' | 'admin' | 'tenant_admin' | 'super_admin' | 'admin_operator';

export interface AuthUser {
  id: string;
  fullName: string;
  workEmail: string;
  role: UserRole;
  businessName?: string;
  phoneNumber?: string;
  businessType?: string;
  tenantId?: string;
  avatarUrl?: string;
}

export interface LoginCredentials {
  workEmail: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupPayload {
  fullName: string;
  businessName: string;
  workEmail: string;
  phoneNumber: string;
  businessType: string;
  password: string;
  termsAccepted: boolean;
}

export interface AuthResponse {
  user?: AuthUser;
  token?: string;
  message?: string;
}

export interface IAuthService {
  signIn(credentials: LoginCredentials): Promise<AuthResponse>;
  signUp(payload: SignupPayload): Promise<AuthResponse>;
  requestPasswordReset(email: string): Promise<{ success: boolean; message: string }>;
  getCurrentUser(): Promise<AuthUser | null>;
  signOut(): Promise<void>;
}
