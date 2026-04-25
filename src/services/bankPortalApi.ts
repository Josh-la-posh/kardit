import { ApiError } from '@/services/authApi';
import type {
  ApprovePartnershipResponse,
  BlockAffiliateRequest,
  BlockAffiliateResponse,
  GetBankAffiliatesResponse,
  GetBankDashboardResponse,
  GetPartnershipRequestResponse,
  ListBankAuditLogsRequest,
  ListBankAuditLogsResponse,
  ListBankCardsRequest,
  ListBankCardsResponse,
  ListBankReportsRequest,
  ListBankReportsResponse,
  QueryPartnershipRequestsRequest,
  QueryPartnershipRequestsResponse,
  RejectPartnershipRequest,
  RejectPartnershipResponse,
  SuspendAffiliateRequest,
  SuspendAffiliateResponse,
} from '@/types/bankPortalContracts';

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

export function resolveBankId(user?: { bankId?: string; tenantId?: string } | null): string {
  const explicitBankId = (import.meta as any).env?.VITE_BANK_ID as string | undefined;
  if (explicitBankId) return explicitBankId;
  if (user?.bankId) return user.bankId;
  if (user?.tenantId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.tenantId)) {
    return user.tenantId;
  }

  throw new Error('Missing bankId. Use a bank-scoped backend login that returns scope.bankId, or set VITE_BANK_ID.');
}

export async function getBankDashboard(bankId: string): Promise<GetBankDashboardResponse> {
  return getJson<GetBankDashboardResponse>(`/banks/${encodeURIComponent(bankId)}/dashboard`);
}

export async function getBankAffiliates(bankId: string): Promise<GetBankAffiliatesResponse> {
  return getJson<GetBankAffiliatesResponse>(`/banks/${encodeURIComponent(bankId)}/affiliates`);
}

export async function listBankCards(bankId: string, request: ListBankCardsRequest): Promise<ListBankCardsResponse> {
  return postJson<ListBankCardsResponse>(`/banks/${encodeURIComponent(bankId)}/cards`, request);
}

export async function listBankAuditLogs(
  bankId: string,
  request: ListBankAuditLogsRequest
): Promise<ListBankAuditLogsResponse> {
  return postJson<ListBankAuditLogsResponse>(`/banks/${encodeURIComponent(bankId)}/audit-logs`, request);
}

export async function listBankReports(
  bankId: string,
  request: ListBankReportsRequest
): Promise<ListBankReportsResponse> {
  return postJson<ListBankReportsResponse>(`/banks/${encodeURIComponent(bankId)}/reports`, request);
}

export async function getPartnershipRequest(
  bankId: string,
  partnershipRequestId: string
): Promise<GetPartnershipRequestResponse> {
  return getJson<GetPartnershipRequestResponse>(
    `/banks/${encodeURIComponent(bankId)}/affiliate-partnership-requests/${encodeURIComponent(partnershipRequestId)}`
  );
}

export async function queryPartnershipRequests(
  request: QueryPartnershipRequestsRequest
): Promise<QueryPartnershipRequestsResponse> {
  return postJson<QueryPartnershipRequestsResponse>('/affiliates/partnership-requests/query', request);
}

export async function approvePartnershipRequest(requestId: string): Promise<ApprovePartnershipResponse> {
  return postJson<ApprovePartnershipResponse>(`/partnerships/${encodeURIComponent(requestId)}/approve`, { requestId });
}

export async function rejectPartnershipRequest(
  requestId: string,
  request: RejectPartnershipRequest
): Promise<RejectPartnershipResponse> {
  return postJson<RejectPartnershipResponse>(`/partnerships/${encodeURIComponent(requestId)}/reject`, request);
}

export async function suspendAffiliate(
  affiliateId: string,
  request: SuspendAffiliateRequest
): Promise<SuspendAffiliateResponse> {
  return postJson<SuspendAffiliateResponse>(`/affiliates/${encodeURIComponent(affiliateId)}/suspend`, request);
}

export async function blockAffiliate(
  affiliateId: string,
  request: BlockAffiliateRequest
): Promise<BlockAffiliateResponse> {
  return postJson<BlockAffiliateResponse>(`/affiliates/${encodeURIComponent(affiliateId)}/block`, request);
}
