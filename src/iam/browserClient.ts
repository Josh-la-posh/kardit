export interface TokenClaims {
  sub?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  fullName?: string;
  tenantId?: string;
  tenantSlug?: string;
  tenantName?: string;
  permissions?: string[];
  roles?: string[];
  sessionId?: string;
  exp?: number;
  iat?: number;
  [claim: string]: unknown;
}

export interface IAMBrowserClientOptions {
  gatewayUrl: string;
  clientId: string;
  callbackPath?: string;
  storageKey?: string;
}

export interface IAMLoginOptions {
  tenantCode?: string;
  returnUrl?: string;
}

export interface IAMLogoutOptions {
  postLogoutRedirectUri: string;
}

const authStateKey = 'iam_auth_state';
const returnUrlKey = 'iam_return_url';
const dpopKeyStoreKey = 'iam_dpop_private_key';
const encoder = new TextEncoder();
const nativeFetch = typeof window === 'undefined' ? fetch : window.fetch.bind(window);

function base64Url(bytes: ArrayBuffer | Uint8Array): string {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  data.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeJwt(token: string): TokenClaims | null {
  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
    return JSON.parse(json) as TokenClaims;
  } catch {
    return null;
  }
}

async function sha256(input: string | Uint8Array): Promise<Uint8Array> {
  const bytes = typeof input === 'string' ? encoder.encode(input) : input;
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
}

async function importOrCreateDpopKey(): Promise<CryptoKeyPair> {
  const stored = sessionStorage.getItem(dpopKeyStoreKey);
  if (stored) {
    const jwk = JSON.parse(stored) as JsonWebKey;
    const privateKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign']
    );
    const publicJwk = { crv: jwk.crv, ext: true, key_ops: ['verify'], kty: jwk.kty, x: jwk.x, y: jwk.y };
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      publicJwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['verify']
    );
    return { privateKey, publicKey };
  }

  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  sessionStorage.setItem(dpopKeyStoreKey, JSON.stringify(jwk));
  return pair;
}

function randomId(): string {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class IAMBrowserClient {
  private readonly gatewayUrl: string;
  private readonly clientId: string;
  private readonly callbackPath: string;
  private readonly storageKey: string;
  private refreshTimer: number | undefined;

  constructor(options: IAMBrowserClientOptions) {
    this.gatewayUrl = options.gatewayUrl.replace(/\/+$/, '');
    this.clientId = options.clientId;
    this.callbackPath = options.callbackPath || '/auth/callback';
    this.storageKey = options.storageKey || 'iam_access_token';
    this.scheduleRefresh();
  }

  private get refreshStorageKey() {
    return `${this.storageKey}_refresh`;
  }

  private storeTokens(accessToken: string, refreshToken?: string) {
    sessionStorage.setItem(this.storageKey, accessToken);
    if (refreshToken) sessionStorage.setItem(this.refreshStorageKey, refreshToken);
    this.scheduleRefresh();
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.storageKey);
  }

  getClaims(): TokenClaims | null {
    const token = this.getToken();
    return token ? decodeJwt(token) : null;
  }

  isAuthenticated(): boolean {
    const exp = this.getClaims()?.exp;
    return typeof exp === 'number' && exp * 1000 > Date.now() + 30_000;
  }

  hasPermission(permission: string): boolean {
    return this.getClaims()?.permissions?.includes(permission) ?? false;
  }

  authorizationHeader(): HeadersInit {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getDpopJkt(): Promise<string> {
    const pair = await importOrCreateDpopKey();
    const publicJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
    const thumbprintJson = JSON.stringify({
      crv: publicJwk.crv,
      kty: publicJwk.kty,
      x: publicJwk.x,
      y: publicJwk.y,
    });
    return base64Url(await sha256(thumbprintJson));
  }

  async login(options: IAMLoginOptions = {}): Promise<void> {
    const state = randomId();
    sessionStorage.setItem(authStateKey, state);
    sessionStorage.setItem(returnUrlKey, options.returnUrl || `${window.location.origin}/dashboard`);

    let dpopJkt: string;
    try {
      dpopJkt = await this.getDpopJkt();
    } catch {
      throw new Error('DPoP key generation failed - ensure the page is served over HTTPS');
    }

    const redirectUri = `${window.location.origin}${this.callbackPath}`;
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      state,
      dpop_jkt: dpopJkt,
    });
    if (options.tenantCode) params.set('tenant_code', options.tenantCode);

    window.location.assign(`${this.gatewayUrl}/auth/login?${params.toString()}`);
  }

  async handleCallback(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) throw new Error('Callback missing code or state');

    await this.exchangeCode(code, state);
    window.location.replace(this.consumeReturnUrl());
  }

  async exchangeCode(code: string, state: string): Promise<void> {
    const expectedState = sessionStorage.getItem(authStateKey);
    if (!expectedState || expectedState !== state) {
      throw new Error('State mismatch - possible CSRF');
    }

    const redirectUri = `${window.location.origin}${this.callbackPath}`;
    const url = `${this.gatewayUrl}/auth/callback?${new URLSearchParams({ code, state, redirect_uri: redirectUri })}`;
    const response = await this.dpopFetch(url, { method: 'GET' });
    if (!response.ok) throw new Error(`Token exchange failed: ${response.status}`);

    const body = (await response.json()) as {
      access_token?: string;
      accessToken?: string;
      refresh_token?: string;
      refreshToken?: string;
    };
    const accessToken = body.access_token || body.accessToken;
    if (!accessToken) throw new Error('Token exchange response missing access token');

    this.storeTokens(accessToken, body.refresh_token || body.refreshToken);
    sessionStorage.removeItem(authStateKey);
  }

  consumeReturnUrl(): string {
    const returnUrl = sessionStorage.getItem(returnUrlKey) || `${window.location.origin}/dashboard`;
    sessionStorage.removeItem(returnUrlKey);
    return returnUrl;
  }

  async dpopFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const request = new Request(input, init);
    const headers = new Headers(request.headers);
    const token = this.getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    headers.set('DPoP', await this.createDpopProof(request.method, request.url, token || undefined));

    return nativeFetch(request, { ...init, headers });
  }

  async refresh(): Promise<string | null> {
    const refreshToken = sessionStorage.getItem(this.refreshStorageKey);
    const tenantSlug = this.getClaims()?.tenantSlug;
    if (!refreshToken) return null;

    const response = await nativeFetch(`${this.gatewayUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken, tenant_slug: tenantSlug }),
    });

    if (!response.ok) {
      this.expireSession();
      return null;
    }

    const body = (await response.json()) as {
      access_token?: string;
      accessToken?: string;
      refresh_token?: string;
      refreshToken?: string;
    };
    const accessToken = body.access_token || body.accessToken;
    if (!accessToken) {
      this.expireSession();
      return null;
    }

    this.storeTokens(accessToken, body.refresh_token || body.refreshToken || refreshToken);
    return accessToken;
  }

  async logout(options: IAMLogoutOptions): Promise<void> {
    const token = this.getToken();
    this.clearSession();

    try {
      if (token) {
        const response = await nativeFetch(`${this.gatewayUrl}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const body = (await response.json().catch(() => undefined)) as { kc_logout_url?: string } | undefined;
          if (body?.kc_logout_url) {
            window.location.assign(body.kc_logout_url);
            return;
          }
        }
      }
    } catch {
      // Local session is already cleared; fall back to the app login page below.
    }

    window.location.assign(options.postLogoutRedirectUri);
  }

  clearSession(): void {
    sessionStorage.removeItem(this.storageKey);
    sessionStorage.removeItem(this.refreshStorageKey);
    sessionStorage.removeItem(authStateKey);
    sessionStorage.removeItem(returnUrlKey);
    if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
  }

  private scheduleRefresh(): void {
    if (typeof window === 'undefined') return;
    if (this.refreshTimer) window.clearTimeout(this.refreshTimer);

    const exp = this.getClaims()?.exp;
    if (typeof exp !== 'number') return;

    const delay = Math.max(exp * 1000 - Date.now() - 120_000, 1_000);
    this.refreshTimer = window.setTimeout(() => void this.refresh(), delay);
  }

  private expireSession(): void {
    this.clearSession();
    window.dispatchEvent(new CustomEvent('iam:session-expired'));
  }

  private async createDpopProof(method: string, url: string, accessToken?: string): Promise<string> {
    const pair = await importOrCreateDpopKey();
    const publicJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
    const header = {
      typ: 'dpop+jwt',
      alg: 'ES256',
      jwk: { crv: publicJwk.crv, kty: publicJwk.kty, x: publicJwk.x, y: publicJwk.y },
    };
    const payload: Record<string, unknown> = {
      htm: method.toUpperCase(),
      htu: url,
      iat: Math.floor(Date.now() / 1000),
      jti: randomId(),
    };
    if (accessToken) payload.ath = base64Url(await sha256(accessToken));

    const signingInput = `${base64Url(encoder.encode(JSON.stringify(header)))}.${base64Url(
      encoder.encode(JSON.stringify(payload))
    )}`;
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      pair.privateKey,
      encoder.encode(signingInput)
    );

    return `${signingInput}.${base64Url(signature)}`;
  }
}

export function isNativeFetchPatched(): boolean {
  return typeof window !== 'undefined' && window.fetch !== nativeFetch;
}
