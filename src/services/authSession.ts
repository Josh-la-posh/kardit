const AUTH_ACCESS_TOKEN_KEY = 'kardit.auth.accessToken.v1';
const AUTH_REFRESH_TOKEN_KEY = 'kardit.auth.refreshToken.v1';
const AUTH_TENANT_ID_KEY = 'kardit.auth.tenantId.v1';
const AUTH_PROFILE_KEY = 'kardit.auth.profile.v1';

function getSessionStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.sessionStorage;
}

export function saveAuthSession(session: {
  accessToken?: string;
  refreshToken?: string;
  tenantId?: string;
}): void {
  const storage = getSessionStorage();
  if (!storage) return;

  if (session.accessToken) storage.setItem(AUTH_ACCESS_TOKEN_KEY, session.accessToken);
  if (session.refreshToken) storage.setItem(AUTH_REFRESH_TOKEN_KEY, session.refreshToken);

  const tenantId = session.tenantId?.trim();
  if (tenantId) storage.setItem(AUTH_TENANT_ID_KEY, tenantId);
}

export function saveTenantId(tenantId?: string): void {
  const normalized = tenantId?.trim();
  if (!normalized) return;
  getSessionStorage()?.setItem(AUTH_TENANT_ID_KEY, normalized);
}

export function getAuthAccessToken(): string | null {
  return getSessionStorage()?.getItem(AUTH_ACCESS_TOKEN_KEY) || null;
}

export function getAuthTenantId(): string | null {
  return getSessionStorage()?.getItem(AUTH_TENANT_ID_KEY) || null;
}

export function saveAuthProfile(profile: unknown): void {
  const storage = getSessionStorage();
  if (!storage) return;

  storage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile));
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

export function clearAuthSession(): void {
  const storage = getSessionStorage();
  if (!storage) return;

  storage.removeItem(AUTH_ACCESS_TOKEN_KEY);
  storage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  storage.removeItem(AUTH_TENANT_ID_KEY);
  storage.removeItem(AUTH_PROFILE_KEY);
}
