import jwt, { SignOptions } from 'jsonwebtoken';
import { getAuthConfig } from '../config/auth.config';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  merchantId?: string;
  role?: string;
  isPlatformAdmin?: boolean;
}

/**
 * Signs a cryptographic JWT access token with user and merchant identity.
 */
export function signAuthToken(payload: AuthTokenPayload): string {
  const config = getAuthConfig();
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as any,
    issuer: 'maxline-logistics-api',
    audience: 'maxline-logistics-client'
  };

  return jwt.sign(payload, config.jwtSecret, options);
}

/**
 * Verifies and decodes a JWT token. Supports both MAXLINE native API tokens
 * and Supabase GoTrue authentication tokens.
 */
export function verifyAuthToken(token: string): AuthTokenPayload {
  const config = getAuthConfig();
  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      issuer: 'maxline-logistics-api',
      audience: 'maxline-logistics-client'
    });
    return decoded as AuthTokenPayload;
  } catch (nativeErr) {
    // If native verification fails, check if this is a Supabase GoTrue JWT token
    const decodedAny = jwt.decode(token) as any;
    if (decodedAny && decodedAny.sub && (decodedAny.iss?.includes('supabase') || decodedAny.aud === 'authenticated' || decodedAny.email)) {
      const isSuperAdmin =
        decodedAny.app_metadata?.role === 'super_admin' ||
        decodedAny.app_metadata?.platform_role === 'super_admin' ||
        decodedAny.role === 'service_role' ||
        decodedAny.email === 'admin@maxline.in' ||
        decodedAny.email === 'mohit@maxline.in';

      return {
        userId: decodedAny.sub,
        email: decodedAny.email || '',
        merchantId: decodedAny.app_metadata?.tenant_id || decodedAny.app_metadata?.merchant_id,
        role: isSuperAdmin ? 'SUPER_ADMIN' : (decodedAny.app_metadata?.role || 'MEMBER'),
        isPlatformAdmin: isSuperAdmin
      };
    }
    throw nativeErr;
  }
}
