import { ApiError, getApiErrorMessage } from '@/services/apiError';
import type {
  ApprovePartnershipResponse,
  BlockAffiliateRequest,
  BlockAffiliateResponse,
  GetAffiliateCardMetricsResponse,
  GetBankCardMetricsResponse,
  GetBankAffiliatesResponse,
  GetBankAffiliatesQuery,
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

function unwrapResponse<TResponse>(response: TResponse | { data?: TResponse }): TResponse {
  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    (response as { data?: TResponse }).data !== undefined
  ) {
    return (response as { data: TResponse }).data;
  }

  return response as TResponse;
}

async function getJson<TResponse>(path: string): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new ApiError('Missing VITE_API_BASE_URL', 0, undefined);
  const res = await fetch(`${baseUrl}${path}`, { method: 'GET' });
  if (!res.ok) {
    const errorBody = await safeJson(res);
    throw new ApiError(getApiErrorMessage(errorBody, `Request failed(${res.status})`), res.status, errorBody);
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
    // throw new ApiError(message, res.status, errorBody);
    throw new ApiError(getApiErrorMessage(errorBody, `Request failed (${res.status})`), res.status, errorBody);
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

export async function getBankCardMetrics(bankId: string): Promise<GetBankCardMetricsResponse> {
  return getJson<GetBankCardMetricsResponse>(`/cards/metrics/bank/${encodeURIComponent(bankId)}`);
}

export async function getAffiliateCardMetrics(affiliateId: string): Promise<GetAffiliateCardMetricsResponse> {
  return getJson<GetAffiliateCardMetricsResponse>(`/cards/metrics/affiliate/${encodeURIComponent(affiliateId)}`);
}

export async function getBankAffiliates(
  bankId: string,
  query: GetBankAffiliatesQuery = {}
): Promise<GetBankAffiliatesResponse | { data: GetBankAffiliatesResponse }> {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    pageSize: String(query.pageSize ?? 20),
  });
  if (query.status) params.set('status', query.status);

  return getJson<GetBankAffiliatesResponse | { data: GetBankAffiliatesResponse }>(
    `/banks/${encodeURIComponent(bankId)}/affiliates?${params.toString()}`
  );
}

export async function getPendingBankAffiliateApprovals(
  bankId: string,
  page: number,
  pageSize: number
): Promise<unknown> {
  const query = new URLSearchParams({
    status: 'PENDING_BANK_APPROVAL',
    page: String(page),
    pageSize: String(pageSize),
  });

  return getJson<unknown>(
    `/banks/${encodeURIComponent(bankId)}/affiliates?${query.toString()}`
  );
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
  return getJson<GetPartnershipRequestResponse | { data: GetPartnershipRequestResponse }>(
    `/banks/${encodeURIComponent(bankId)}/affiliate-partnership-requests/${encodeURIComponent(partnershipRequestId)}`
  ).then(unwrapResponse);
}

export async function queryPartnershipRequests(
  request: QueryPartnershipRequestsRequest
): Promise<QueryPartnershipRequestsResponse> {
  return postJson<QueryPartnershipRequestsResponse>('/affiliates/partnership-requests/query', request);
}

export async function approvePartnershipRequest(requestId: string): Promise<ApprovePartnershipResponse> {
  return postJson<ApprovePartnershipResponse>(`/banks/partnerships/${encodeURIComponent(requestId)}/approve`, { requestId });
}

export async function rejectPartnershipRequest(
  requestId: string,
  request: RejectPartnershipRequest
): Promise<RejectPartnershipResponse> {
  return postJson<RejectPartnershipResponse>(`/banks/partnerships/${encodeURIComponent(requestId)}/reject`, request);
}

export async function suspendAffiliate(
  bankId: string,
  affiliateId: string,
  request: SuspendAffiliateRequest
): Promise<SuspendAffiliateResponse> {
  return postJson<SuspendAffiliateResponse>(`/banks/${encodeURIComponent(bankId)}/affiliates/${encodeURIComponent(affiliateId)}/suspend`, request);
}

export async function blockAffiliate(
  bankId:string,
  affiliateId: string,
  request: BlockAffiliateRequest
): Promise<BlockAffiliateResponse> {
  return postJson<BlockAffiliateResponse>(`/banks/${encodeURIComponent(bankId)}/affiliates/${encodeURIComponent(affiliateId)}/block`, request);
}
