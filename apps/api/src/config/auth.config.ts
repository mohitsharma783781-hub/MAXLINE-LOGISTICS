export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptSaltRounds: number;
}

export const getAuthConfig = (): AuthConfig => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Security Error]: JWT_SECRET must be configured with at least 32 characters in production.');
    }
    // Safe dev fallback with warning
    console.warn('[Security Warning]: JWT_SECRET is unset or under 32 characters. Using a development default.');
    return {
      jwtSecret: secret || 'dev-fallback-secret-key-32-chars-minimum-maxline-logistics',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
      bcryptSaltRounds: 12
    };
  }

  return {
    jwtSecret: secret.trim(),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    bcryptSaltRounds: 12
  };
};
