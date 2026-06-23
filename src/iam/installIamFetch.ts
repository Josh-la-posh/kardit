import { appConfig, isIamEnabled } from '@/config';
import { iamClient } from '@/iam';
import { getAuthAccessToken } from '@/services/authSession';

let installed = false;

function getRequestUrl(input: RequestInfo | URL): URL {
  return new URL(
    typeof input === 'string' || input instanceof URL ? input.toString() : input.url,
    window.location.origin
  );
}

function getApiUrl(): URL {
  return new URL(appConfig.apiBaseUrl || '/api/v1', window.location.origin);
}

function isBackendRequest(input: RequestInfo | URL): boolean {
  const url = getRequestUrl(input);
  const apiBase = getApiUrl();

  const isGatewayApi = Boolean(appConfig.gatewayUrl) && (() => {
    const gateway = new URL(appConfig.gatewayUrl, window.location.origin);
    return url.origin === gateway.origin && url.pathname.startsWith(gateway.pathname);
  })();
  const isAppApi = url.origin === apiBase.origin && url.pathname.startsWith(apiBase.pathname);

  return isGatewayApi || isAppApi;
}

function shouldUseDpop(input: RequestInfo | URL): boolean {
  if (!isIamEnabled || !iamClient.isAuthenticated()) return false;

  const url = getRequestUrl(input);
  const gateway = new URL(appConfig.gatewayUrl, window.location.origin);
  const isIamAuthEndpoint = url.pathname.startsWith(`${gateway.pathname.replace(/\/$/, '')}/auth/`);

  return isBackendRequest(input) && !isIamAuthEndpoint;
}

function claimString(claims: Record<string, unknown> | null, keys: string[]): string {
  if (!claims) return '';
  for (const key of keys) {
    const value = claims[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function getTenantIdFromTokenClaims(): string {
  const claims = iamClient.getClaims();
  return claimString(claims, [
    'tenantId',
    'tenant_id',
  ]);
}

function withStoredSessionHeaders(input: RequestInfo | URL, init?: RequestInit): RequestInit {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  }
  const accessToken = getAuthAccessToken();
  const tenantId = getTenantIdFromTokenClaims();

  if (accessToken && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${accessToken}`);
  if (tenantId && !headers.has('X-Tenant-Id')) {
    headers.set('X-Tenant-Id', tenantId);
    headers.set('tenantId', tenantId);
  }

  return { ...init, headers };
}

export function installIamFetch(): void {
  if (installed || typeof window === 'undefined') return;

  const rawFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const nextInit = isBackendRequest(input) ? withStoredSessionHeaders(input, init) : init;
    if (shouldUseDpop(input)) {
      return iamClient.dpopFetch(input, nextInit);
    }
    return rawFetch(input, nextInit);
  };
  installed = true;
}
