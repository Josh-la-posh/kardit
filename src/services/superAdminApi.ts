import { ApiError, getApiErrorMessage } from '@/services/apiError';
import type {
  GenerateReportRequest,
  GenerateReportResponse,
  GetReportStatusResponse,
  GetSuperAdminDashboardResponse,
  ListNotificationsResponse,
  QuerySuperAdminAuditsRequest,
  QuerySuperAdminAuditsResponse,
  QueryAffiliatesRequest,
  QueryAffiliatesResponse,
  QueryBanksRequest,
  QueryBanksResponse,
  SaveNotificationSettingsRequest,
  UpdateNotificationStatusRequest,
} from '@/types/superAdminContracts';

type ApiEnvelope<T> = {
  data?: {
    isSuccess?: boolean;
    value?: T;
    error?: unknown;
  };
};

type ApiStatusEnvelope<T> = {
  status?: string;
  message?: string;
  error?: unknown;
  data?: T;
};

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');

const getApiBaseUrl = () => {
  const env = import.meta.env as Record<string, string | undefined> | undefined;
  const base = env?.VITE_API_BASE_URL;
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

async function getJson<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new ApiError('Missing VITE_API_BASE_URL', 0, undefined);
  const res = await fetch(`${baseUrl}${path}`, { method: 'GET', ...init });
  if (!res.ok) {
    const body = await safeJson(res);
    throw new ApiError(getApiErrorMessage(body, `Request failed (${res.status})`), res.status, body);
  }
  return (await res.json()) as TResponse;
}

function buildQuerySuperAdminAuditsPath(request: QuerySuperAdminAuditsRequest) {
  const query = new URLSearchParams();
  query.set('Page', String(request.page));
  query.set('PageSize', String(request.pageSize));
  return `/Audit/query?${query.toString()}`;
}

function buildQueryBanksPath(request: QueryBanksRequest) {
  const query = new URLSearchParams();

  if (request.filters.country) query.set('country', request.filters.country);
  if (request.filters.currency) query.set('currency', request.filters.currency);
  if (request.filters.search) query.set('name', request.filters.search);

  request.filters.status?.forEach((status) => {
    if (status) query.append('status', status);
  });

  query.set('page', String(request.page));
  query.set('pageSize', String(request.pageSize));

  return `/banks/query?${query.toString()}`;
}

async function sendJson<TResponse>(method: 'POST' | 'PATCH', path: string, body: unknown, init?: RequestInit): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new ApiError('Missing VITE_API_BASE_URL', 0, undefined);
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    body: JSON.stringify(body),
    ...init,
  });
  if (!res.ok) {
    const errorBody = await safeJson(res);
    throw new ApiError(getApiErrorMessage(errorBody, `Request failed (${res.status})`), res.status, errorBody);
  }

  if (res.status === 204) return undefined as TResponse;
  return (await res.json()) as TResponse;
}

function unwrapApiValue<TResponse>(response: TResponse | ApiEnvelope<TResponse> | ApiStatusEnvelope<TResponse>): TResponse {
  if (response && typeof response === 'object') {
    if ('status' in response && 'data' in response) {
      const envelope = response as ApiStatusEnvelope<TResponse>;
      if (envelope.status && envelope.status.toLowerCase() !== 'success') {
        throw new ApiError(envelope.message || 'Request failed', 200, envelope.error);
      }

      if (envelope.data !== undefined) {
        return envelope.data;
      }
    }

    if ('data' in response) {
      const envelope = response as ApiEnvelope<TResponse>;
      if (envelope.data?.isSuccess === false) {
        throw new ApiError('Request failed', 200, envelope.data.error);
      }

      if (envelope.data?.value !== undefined) {
        return envelope.data.value;
      }
    }
  }

  return response as TResponse;
}

export function getSuperAdminDashboard() {
  return getJson<GetSuperAdminDashboardResponse>('/super-admin/dashboard');
}

export function querySuperAdminAudits(request: QuerySuperAdminAuditsRequest) {
  return getJson<QuerySuperAdminAuditsResponse | ApiEnvelope<QuerySuperAdminAuditsResponse>>(
    buildQuerySuperAdminAuditsPath(request),
  ).then(unwrapApiValue);
}

export function listNotifications() {
  return getJson<ListNotificationsResponse>('/notifications');
}

export function updateNotificationStatus(notificationId: string, request: UpdateNotificationStatusRequest) {
  return sendJson<void>('PATCH', `/notifications/${encodeURIComponent(notificationId)}`, request);
}

export function saveNotificationSettings(request: SaveNotificationSettingsRequest) {
  return sendJson<void>('POST', '/notifications/settings', request);
}

export function generateReport(request: GenerateReportRequest) {
  return sendJson<GenerateReportResponse>('POST', '/reports/generate', request);
}

export function getReportStatus(reportExecutionId: string) {
  return getJson<GetReportStatusResponse>(`/reports/${encodeURIComponent(reportExecutionId)}`);
}

export function queryBanks(request: QueryBanksRequest) {
  return getJson<QueryBanksResponse | ApiEnvelope<QueryBanksResponse>>(buildQueryBanksPath(request))
    .then(unwrapApiValue);
}

export function queryAffiliates(request: QueryAffiliatesRequest) {
  return sendJson<QueryAffiliatesResponse | ApiEnvelope<QueryAffiliatesResponse>>('POST', '/affiliates/query', request)
    .then(unwrapApiValue);
}
