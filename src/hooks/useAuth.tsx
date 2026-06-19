import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { getStakeholderTypeForAffiliateType } from '@/services/affiliateApi';
import { getAuthProfile, saveTenantCode } from '@/services/authSession';
import { iamClient, type TokenClaims } from '@/iam';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  stakeholderType?: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER';
  tenantId: string;
  affiliateId?: string;
  bankId?: string;
  tenantName: string;
  avatarUrl?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  sessionExpired: boolean;
}

interface AuthContextType extends AuthState {
  login: (tenantCode: string) => Promise<void>;
  logout: () => Promise<void>;
  forceSessionExpired: () => void;
  dismissSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function claimString(claims: TokenClaims | null, keys: string[], fallback = ''): string {
  if (!claims) return fallback;
  for (const key of keys) {
    const value = claims[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return fallback;
}

function unwrapProfileObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;

  for (const key of ['data', 'value', 'profile', 'affiliate', 'user']) {
    const nested = record[key];
    if (nested && typeof nested === 'object') return unwrapProfileObject(nested) || (nested as Record<string, unknown>);
  }

  return record;
}

function profileString(profile: Record<string, unknown> | null, keys: string[], fallback = ''): string {
  if (!profile) return fallback;
  for (const key of keys) {
    const value = profile[key];
    if (typeof value === 'string' && value.trim() && value.trim().toLowerCase() !== 'not assigned') {
      return value.trim();
    }
    if (Array.isArray(value)) {
      const first = value.find(
        (item) => typeof item === 'string' && item.trim() && item.trim().toLowerCase() !== 'not assigned'
      );
      if (typeof first === 'string') return first.trim();
    }
  }
  return fallback;
}

function normalizeStakeholderType(value: string): User['stakeholderType'] | undefined {
  const normalized = value.toUpperCase().replace(/[\s-]+/g, '_');
  if (normalized.includes('BANK')) return 'BANK';
  if (
    normalized.includes('SERVICE_PROVIDER') ||
    normalized.includes('SUPER_ADMIN') ||
    normalized.includes('SUPERADMIN')
  ) {
    return 'SERVICE_PROVIDER';
  }
  if (normalized.includes('AFFILIATE')) return 'AFFILIATE';
  return undefined;
}

function mergeProfileIntoUser(user: User, profileResponse: unknown): User {
  const profile = unwrapProfileObject(profileResponse);
  if (!profile) return user;

  const role = profileString(profile, ['role', 'userRole', 'primaryRole', 'roles'], user.role);
  const stakeholderType =
    getStakeholderTypeForAffiliateType(profile.affiliateType) ||
    normalizeStakeholderType(
      profileString(profile, ['stakeholderType', 'stakeholder_type', 'userType', 'user_type', 'role', 'userRole', 'roles'])
    ) || user.stakeholderType;

  return {
    ...user,
    id: profileString(profile, ['userId', 'id'], user.id),
    email: profileString(profile, ['email', 'username'], user.email),
    name: profileString(profile, ['fullName', 'name', 'displayName'], user.name),
    role,
    stakeholderType,
    tenantId: profileString(profile, ['tenantId', 'tenant_id'], user.tenantId),
    tenantName: profileString(profile, ['tenantName', 'tenant_name', 'legalName', 'tradingName', 'affiliateName', 'name'], user.tenantName),
    affiliateId: profileString(profile, ['affiliateId', 'affiliate_id'], user.affiliateId || '') || user.affiliateId,
    bankId: profileString(profile, ['ownerBankId', 'owner_bank_id', 'bankId', 'bank_id'], user.bankId || '') || user.bankId,
  };
}

function claimsToUser(claims: TokenClaims | null): User | null {
  if (!claims?.sub) return null;

  const roles = Array.isArray(claims.roles) ? claims.roles : [];
  const permissions = Array.isArray(claims.permissions) ? claims.permissions : [];
  const role = roles[0] || permissions[0] || 'User';
  const tenantId = claimString(claims, ['tenantId', 'tenant_id'], 'tenant_unknown');
  const tenantSlug = claimString(claims, ['tenantSlug', 'tenant_slug']);
  const tenantName = claimString(claims, ['tenantName', 'tenant_name'], tenantSlug || tenantId);
  const stakeholderTypeClaim = claimString(claims, ['stakeholderType', 'stakeholder_type', 'userType', 'user_type']);

  const user: User = {
    id: claims.sub,
    email: claimString(claims, ['email', 'preferred_username'], 'user@kardit.app'),
    name: claimString(claims, ['name', 'fullName', 'preferred_username', 'email'], 'User'),
    role,
    stakeholderType: normalizeStakeholderType(stakeholderTypeClaim) || 'AFFILIATE',
    tenantId,
    tenantName,
  };

  return mergeProfileIntoUser(user, getAuthProfile());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: iamClient.isAuthenticated(),
    user: iamClient.isAuthenticated() ? claimsToUser(iamClient.getClaims()) : null,
    sessionExpired: false,
  });

  useEffect(() => {
    const syncIamState = () => {
      const authenticated = iamClient.isAuthenticated();
      setState((prev) => ({
        ...prev,
        isAuthenticated: authenticated,
        user: authenticated ? claimsToUser(iamClient.getClaims()) : null,
      }));
    };

    const handleSessionExpired = () => {
      setState({
        isAuthenticated: false,
        user: null,
        sessionExpired: true,
      });
    };

    syncIamState();
    window.addEventListener('focus', syncIamState);
    window.addEventListener('iam:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('focus', syncIamState);
      window.removeEventListener('iam:session-expired', handleSessionExpired);
    };
  }, []);

  const login = useCallback(async (tenantCodeInput: string) => {
    const tenantCode = tenantCodeInput.trim();
    saveTenantCode(tenantCode);

    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    const safeNext = next?.startsWith('/') ? next : '/dashboard';

    await iamClient.login({
      tenantCode,
      returnUrl: `${window.location.origin}${safeNext}`,
    });
  }, []);

  const logout = useCallback(async () => {
    setState({
      isAuthenticated: false,
      user: null,
      sessionExpired: false,
    });
    await iamClient.logout({
      postLogoutRedirectUri: `${window.location.origin}/login`,
    });
  }, []);

  const forceSessionExpired = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sessionExpired: true,
    }));
  }, []);

  const dismissSessionExpired = useCallback(() => {
    setState({
      isAuthenticated: false,
      user: null,
      sessionExpired: false,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        forceSessionExpired,
        dismissSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
