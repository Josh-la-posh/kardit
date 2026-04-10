import { ApiError } from '@/services/authApi';
import type {
  GenerateReportRequest,
  GenerateReportResponse,
  GetReportStatusResponse,
  GetSuperAdminDashboardResponse,
  ListNotificationsResponse,
  QueryAffiliatesRequest,
  QueryAffiliatesResponse,
  QueryBanksRequest,
  QueryBanksResponse,
  ListSuperAdminAuditLogsRequest,
  ListSuperAdminAuditLogsResponse,
  SaveNotificationSettingsRequest,
  UpdateNotificationStatusRequest,
} from '@/types/superAdminContracts';

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
    throw new ApiError('Request failed', res.status, body);
  }
  return (await res.json()) as TResponse;
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
    const message =
      (typeof errorBody === 'object' && errorBody && 'message' in (errorBody as Record<string, unknown>)
        ? String((errorBody as Record<string, unknown>).message)
        : undefined) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, errorBody);
  }

  if (res.status === 204) return undefined as TResponse;
  return (await res.json()) as TResponse;
}

export function getSuperAdminDashboard() {
  return getJson<GetSuperAdminDashboardResponse>('/super-admin/dashboard');
}

export function listSuperAdminAuditLogs(request: ListSuperAdminAuditLogsRequest) {
  return sendJson<ListSuperAdminAuditLogsResponse>('POST', '/audit-logs', request);
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
  return sendJson<QueryBanksResponse>('POST', '/banks/query', request);
}

export function queryAffiliates(request: QueryAffiliatesRequest) {
  return sendJson<QueryAffiliatesResponse>('POST', '/affiliates/query', request);
}
