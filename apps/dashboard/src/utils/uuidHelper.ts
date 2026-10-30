/**
 * UUID Helper Utilities for PostgreSQL Tenancy and Entity Identifiers.
 * Guarantees that any arbitrary string tenant identifier (e.g. 'tenant-demo-01', 'ALL')
 * safely resolves to a valid RFC 4122 UUID so PostgreSQL UUID columns never error.
 */

export const DEFAULT_PLATFORM_TENANT_ID = '00000000-0000-0000-0000-000000000001';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return UUID_REGEX.test(str.trim());
}

/**
 * Deterministic hash-based UUID generator for legacy non-UUID strings.
 * Ensures the same tenant string always produces the exact same UUID.
 */
export function stringToDeterministicUUID(input: string): string {
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ char;
  }
  const hex1 = Math.abs(hash1).toString(16).padStart(8, '0').slice(0, 8);
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0').slice(0, 8);
  const hex3 = Math.abs(hash1 ^ hash2).toString(16).padStart(8, '0').slice(0, 8);
  const hex4 = Math.abs(hash1 + hash2).toString(16).padStart(8, '0').slice(0, 8);

  return `${hex1}-${hex2.slice(0, 4)}-4${hex2.slice(4, 7)}-8${hex3.slice(0, 3)}-${hex3.slice(3, 7)}${hex4.slice(0, 8)}`;
}

/**
 * Normalizes any tenant string to a verified, valid PostgreSQL UUID.
 * Never defaults anonymous or null tenant to the demo tenant.
 */
export function toValidTenantUUID(tenantId?: string | null): string {
  if (!tenantId || tenantId === 'all' || tenantId === 'ALL') {
    return DEFAULT_PLATFORM_TENANT_ID;
  }

  const clean = tenantId.trim();
  if (clean === 'tenant-demo-01' || clean === 'tenant-demo' || clean === 'demo') {
    return DEFAULT_PLATFORM_TENANT_ID;
  }

  if (isValidUUID(clean)) {
    return clean;
  }

  return stringToDeterministicUUID(clean);
}

/**
 * Safe UUID generator for new records when standard crypto.randomUUID() is unavailable.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
