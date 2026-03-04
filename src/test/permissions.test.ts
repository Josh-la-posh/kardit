import { describe, it, expect } from 'vitest';
import { isBankReadOnlyUser, isBankAdmin, isBankStakeholder } from '@/lib/permissions';

describe('permissions', () => {
  it('treats non-admin bank users as read-only', () => {
    const user = {
      id: 'u1',
      email: 'bank@kardit.app',
      name: 'Bank User',
      role: 'User',
      stakeholderType: 'BANK' as const,
      tenantId: 't1',
      tenantName: 'Alpha Bank',
    };

    expect(isBankStakeholder(user)).toBe(true);
    expect(isBankAdmin(user)).toBe(false);
    expect(isBankReadOnlyUser(user)).toBe(true);
  });

  it('does not treat bank admins as read-only', () => {
    const user = {
      id: 'u2',
      email: 'bankadmin@kardit.app',
      name: 'Bank Admin',
      role: 'BANK_ADMIN',
      stakeholderType: 'BANK' as const,
      tenantId: 't1',
      tenantName: 'Alpha Bank',
    };

    expect(isBankStakeholder(user)).toBe(true);
    expect(isBankAdmin(user)).toBe(true);
    expect(isBankReadOnlyUser(user)).toBe(false);
  });
});
