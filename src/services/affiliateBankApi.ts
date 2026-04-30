import { ApiError } from '@/services/authApi';
import type {
  CreateBankPartnershipRequest,
  CreateBankPartnershipResponse,
  GetAffiliateBankPartnershipsResponse,
} from '@/types/affiliateBankContracts';

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');

const getApiBaseUrl = () => {
  const base = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  return base ? normalizeBaseUrl(base) : '';
};

const safeJson = async (res: Response) => {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

async function getJson<TResponse>(path: string): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new ApiError('Missing VITE_API_BASE_URL', 0, undefined);
  const res = await fetch(`${baseUrl}${path}`, { method: 'GET' });
  if (!res.ok) {
    const errorBody = await safeJson(res);
    throw new ApiError('Request failed', res.status, errorBody);
  }
  return (await res.json()) as TResponse;
}

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new ApiError('Missing VITE_API_BASE_URL', 0, undefined);
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorBody = await safeJson(res);
    const message =
      (typeof errorBody === 'object' && errorBody && 'message' in (errorBody as Record<string, unknown>)
        ? String((errorBody as Record<string, unknown>).message)
        : undefined) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, errorBody);
  }
  return (await res.json()) as TResponse;
}

export function resolveAffiliateId(user?: { tenantId?: string; email?: string } | null): string {
  const explicitAffiliateId = (import.meta as any).env?.VITE_AFFILIATE_ID as string | undefined;
  if (explicitAffiliateId) return explicitAffiliateId;
  if (user?.tenantId?.startsWith('AFF-')) return user.tenantId;

  const byTenant: Record<string, string> = {
    tenant_alpha_affiliate: '',
  };

  const byEmail: Record<string, string> = {
    'affiliate@kardit.app': '5c1e9fd2-6d32-4d0c-9bf2-c7b0d8f2b201',
    'demo@kardit.app': '00000000-0000-0000-0000-000000000000',
  };

  if (user?.tenantId && byTenant[user.tenantId]) return byTenant[user.tenantId];
  if (user?.email && byEmail[user.email.toLowerCase()]) return byEmail[user.email.toLowerCase()];

  throw new Error('Missing affiliateId. Set VITE_AFFILIATE_ID or provide an affiliate-scoped login.');
}

export async function getAffiliateBankPartnerships(
  affiliateId: string
): Promise<GetAffiliateBankPartnershipsResponse> {
  return getJson<GetAffiliateBankPartnershipsResponse>(
    `/affiliates/${encodeURIComponent(affiliateId)}/bank-partnerships`
  );
}

export async function createAffiliateBankPartnershipRequest(
  affiliateId: string,
  request: CreateBankPartnershipRequest
): Promise<CreateBankPartnershipResponse> {
  return postJson<CreateBankPartnershipResponse>(
    `/affiliates/${encodeURIComponent(affiliateId)}/bank-partnership-requests`,
    request
  );
}
