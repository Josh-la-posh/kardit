import type { User } from '@/hooks/useAuth';

function normalizeRole(role: string | undefined | null): string {
  return (role ?? '').trim().toUpperCase().replace(/\s+/g, '_');
}

export function isBankStakeholder(user: User | null | undefined): boolean {
  return user?.stakeholderType === 'BANK' || normalizeRole(user?.role).startsWith('BANK_');
}

export function isBankAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return role === 'ADMIN' || role === 'BANK_ADMIN' || role === 'BANK_PORTFOLIO_ADMIN';
}

/**
 * Bank supervisory read-only enforcement.
 *
 * Default: all bank users are treated as read-only unless explicitly admin.
 */
export function isBankReadOnlyUser(user: User | null | undefined): boolean {
  return isBankStakeholder(user) && !isBankAdmin(user);
}

export function canMutateSystem(user: User | null | undefined): boolean {
  // For now this only enforces bank read-only.
  return !isBankReadOnlyUser(user);
}
