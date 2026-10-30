import bcrypt from 'bcryptjs';
import { getAuthConfig } from '../config/auth.config';

/**
 * Hashes a plaintext password using bcrypt with standard enterprise salt rounds.
 * Plaintext passwords are never logged or stored.
 */
export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText || typeof plainText !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const config = getAuthConfig();
  const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
  return bcrypt.hash(plainText, salt);
}

/**
 * Compares a candidate plaintext password with an existing bcrypt hash.
 */
export async function comparePassword(candidate: string, hash: string): Promise<boolean> {
  if (!candidate || !hash) {
    return false;
  }
  return bcrypt.compare(candidate, hash);
}
