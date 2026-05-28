import { ApiError } from '@/services/authApi';
import type {
  CreateBankPartnershipRequest,
  CreateBankPartnershipResponse,
  GetAffiliateBankPartnershipsResponse,
  QueryAffiliatePartnershipRequestsResponse,
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
    'affiliate@kardit.app': 'AFF-F5BE3E1610314B9582F3CFF4F7F34B88',
    'demo@kardit.app': 'a7d5929b-cba8-4e97-8985-2ce1d9fc91c3',
  };

  if (user?.tenantId && byTenant[user.tenantId]) return byTenant[user.tenantId];
  if (user?.email && byEmail[user.email.toLowerCase()]) return byEmail[user.email.toLowerCase()];

  throw new Error('Missing affiliateId. Set VITE_AFFILIATE_ID or provide an affiliate-scoped login.');
}

export async function getAffiliateBankPartnerships(
  affiliateId: string
): Promise<GetAffiliateBankPartnershipsResponse> {
  const response = await postJson<QueryAffiliatePartnershipRequestsResponse>(
    '/affiliates/partnership-requests/query',
    {
      filters: { affiliateId },
      page: 1,
      pageSize: 500,
    }
  );

  return {
    affiliateId,
    banks: (response.data || []).map((item) => ({
      bankId: item.bankId,
      bankName: item.bankName || 'Unknown',
      partnershipStatus: item.status,
      rejectionReason: item.note,
      lastUpdatedAt:
        item.decisionedAt && !item.decisionedAt.startsWith('0001-01-01')
          ? item.decisionedAt
          : item.requestedAt,
    })),
  };
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
