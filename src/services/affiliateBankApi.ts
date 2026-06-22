import { ApiError } from '@/services/apiError';
import { getAuthAffiliateId } from '@/services/authSession';
import type {
  BankPartnershipItem,
  CreateBankPartnershipRequest,
  CreateBankPartnershipResponse,
  GetBankPartnershipsByAffiliateResponse,
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

export function resolveAffiliateId(user?: { tenantId?: string; affiliateId?: string } | null): string {
  if ('affiliateId' in (user || {}) && typeof (user as { affiliateId?: string })?.affiliateId === 'string' && (user as { affiliateId?: string }).affiliateId) {
    return (user as { affiliateId?: string }).affiliateId as string;
  }
  const profileAffiliateId = getAuthAffiliateId();
  if (profileAffiliateId) return profileAffiliateId;
  if (user?.tenantId?.startsWith('AFF-')) return user.tenantId;

  throw new Error('Missing affiliateId. Sign in with an affiliate profile that includes affiliateId.');
}

function mapPartnershipToAffiliateBank(item: BankPartnershipItem) {
  return {
    bankId: item.bankId,
    bankName: item.bankName || 'Unknown',
    bankCode: item.bankCode,
    partnershipStatus: item.partnershipStatus || item.status || 'ACTIVE',
    rejectionReason: item.rejectionReason || item.note,
    lastUpdatedAt:
      item.lastUpdatedAt ||
      item.updatedAt ||
      (item.decisionedAt && !item.decisionedAt.startsWith('0001-01-01')
        ? item.decisionedAt
        : item.requestedAt) ||
      new Date(0).toISOString(),
  };
}

export async function getBankPartnershipsByAffiliate(
  affiliateId: string
): Promise<GetAffiliateBankPartnershipsResponse> {
  const response = await getJson<GetBankPartnershipsByAffiliateResponse>(
    `/affiliates/${encodeURIComponent(affiliateId)}/bank-partnerships`
  );

  const items = Array.isArray(response?.banks)
    ? response.banks
    : Array.isArray(response?.data)
      ? response.data
      : [];

  return {
    affiliateId: response?.affiliateId || affiliateId,
    banks: items
      .filter((item): item is BankPartnershipItem => Boolean(item?.bankId))
      .map(mapPartnershipToAffiliateBank),
  };
}

export async function getAffiliateBankPartnerships(
  affiliateId: string
): Promise<GetAffiliateBankPartnershipsResponse> {
  try {
    return await getBankPartnershipsByAffiliate(affiliateId);
  } catch {
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
        bankCode: undefined,
        partnershipStatus: item.status,
        rejectionReason: item.note,
        lastUpdatedAt:
          item.decisionedAt && !item.decisionedAt.startsWith('0001-01-01')
            ? item.decisionedAt
            : item.requestedAt,
      })),
    };
  }
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
