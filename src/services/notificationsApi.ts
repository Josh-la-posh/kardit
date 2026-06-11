import { ApiError, getApiErrorMessage } from '@/services/authApi';
import type {
  ListNotificationsRequest,
  ListNotificationsResponse,
  SuperAdminNotification,
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

function buildListNotificationsPath(request: ListNotificationsRequest) {
  const query = new URLSearchParams();

  if (request.status) query.set('status', request.status);
  if (request.type) query.set('type', request.type);

  query.set('tenantId', request.tenantId);
  query.set('userId', request.userId);
  query.set('page', String(request.page));
  query.set('pageSize', String(request.pageSize));

  return `/notifications?${query.toString()}`;
}

export function queryNotifications(request: ListNotificationsRequest) {
  return getJson<ListNotificationsResponse | ApiEnvelope<ListNotificationsResponse> | ApiStatusEnvelope<ListNotificationsResponse>>(
    buildListNotificationsPath(request),
  ).then(unwrapApiValue);
}

export function getNotification(notificationId: string) {
  return getJson<SuperAdminNotification | ApiEnvelope<SuperAdminNotification> | ApiStatusEnvelope<SuperAdminNotification>>(
    `/notifications/${encodeURIComponent(notificationId)}`,
  ).then(unwrapApiValue);
}
