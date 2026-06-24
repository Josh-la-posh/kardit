import { normalizeServiceType } from '@/services/affiliateApi';

const AUTH_ACCESS_TOKEN_KEY = 'kardit.auth.accessToken.v1';
const AUTH_REFRESH_TOKEN_KEY = 'kardit.auth.refreshToken.v1';
const AUTH_TENANT_CODE_KEY = 'kardit.auth.tenantCode.v1';
const AUTH_PROFILE_KEY = 'kardit.auth.profile.v1';
const AUTH_RESUME_IDENTITY_KEY = 'kardit.auth.resumeIdentity.v1';

export type AuthResumeIdentity = {
  serviceType: 'AFFILIATE_SERVICE' | 'BANK_SERVICE' | 'ADMIN_SERVICE';
  serviceUserId: string;
};

function getSessionStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.sessionStorage;
}

export function saveAuthSession(session: {
  accessToken?: string;
  refreshToken?: string;
}): void {
  const storage = getSessionStorage();
  if (!storage) return;

  if (session.accessToken) storage.setItem(AUTH_ACCESS_TOKEN_KEY, session.accessToken);
  if (session.refreshToken) storage.setItem(AUTH_REFRESH_TOKEN_KEY, session.refreshToken);
}

export function saveTenantCode(tenantCode?: string): void {
  const normalized = tenantCode?.trim();
  if (!normalized) return;
  getSessionStorage()?.setItem(AUTH_TENANT_CODE_KEY, normalized);
}

export function getAuthAccessToken(): string | null {
  return getSessionStorage()?.getItem(AUTH_ACCESS_TOKEN_KEY) || null;
}

export function saveAuthProfile(profile: unknown): void {
  const storage = getSessionStorage();
  if (!storage) return;

  storage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile));
  const identity = getServiceIdentity(profile);
  if (identity) {
    storage.setItem(AUTH_RESUME_IDENTITY_KEY, JSON.stringify(identity));
  }
}

export function getAuthProfile(): unknown {
  const raw = getSessionStorage()?.getItem(AUTH_PROFILE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getServiceIdentity(profileResponse: unknown): AuthResumeIdentity | null {
  if (!profileResponse || typeof profileResponse !== 'object') return null;

  let profile = profileResponse as Record<string, unknown>;
  for (const key of ['data', 'value', 'profile', 'user']) {
    const nested = profile[key];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      profile = nested as Record<string, unknown>;
    }
  }

  const serviceType = normalizeServiceType(profile.serviceType);
  const serviceUserId =
    typeof profile.serviceUserId === 'string' ? profile.serviceUserId.trim() : '';

  return serviceType && serviceUserId
    ? { serviceType, serviceUserId }
    : null;
}

export function getAuthResumeIdentity(): AuthResumeIdentity | null {
  const raw = getSessionStorage()?.getItem(AUTH_RESUME_IDENTITY_KEY);
  if (!raw) return null;

  try {
    const identity = JSON.parse(raw) as Partial<AuthResumeIdentity>;
    return identity.serviceType && identity.serviceUserId
      ? identity as AuthResumeIdentity
      : null;
  } catch {
    return null;
  }
}

export function getAuthAffiliateId(): string | null {
  const profile = getAuthProfile();
  if (!profile || typeof profile !== 'object') return null;

  const record = profile as Record<string, unknown>;
  const serviceType = normalizeServiceType(record.serviceType);
  const affiliateId = record.affiliateId || (serviceType === 'AFFILIATE_SERVICE' ? record.serviceUserId : undefined);
  return typeof affiliateId === 'string' && affiliateId.trim() ? affiliateId.trim() : null;
}

export function clearAuthSession(): void {
  const storage = getSessionStorage();
  if (!storage) return;

  storage.removeItem(AUTH_ACCESS_TOKEN_KEY);
  storage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  storage.removeItem(AUTH_TENANT_CODE_KEY);
  storage.removeItem(AUTH_PROFILE_KEY);
}
