import { ApiError } from '@/services/apiError';
import type { BankQueryItem, QueryBanksRequest, QueryBanksResponse } from '@/types/bankContracts';

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

async function getJson<TResponse>(path: string): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new ApiError('Missing VITE_API_BASE_URL', 0, undefined);

  const res = await fetch(`${baseUrl}${path}`, { method: 'GET' });

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

function buildQueryBanksPath(request: QueryBanksRequest) {
  const query = new URLSearchParams();

  if (request.filters.country) query.set('country', request.filters.country);
  if (request.filters.name) query.set('name', request.filters.name);
  else if (request.filters.search) query.set('search', request.filters.search);

  request.filters.status?.forEach((status) => {
    if (status) query.append('status', status);
  });

  query.set('page', String(request.page));
  query.set('pageSize', String(request.pageSize));

  return `/banks/query?${query.toString()}`;
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

export async function queryBanks(request: QueryBanksRequest): Promise<QueryBanksResponse> {
  return unwrapApiValue(
    await getJson<QueryBanksResponse | ApiEnvelope<QueryBanksResponse>>(buildQueryBanksPath(request))
  );
}

export async function getBanks(): Promise<BankQueryItem[]> {
  return unwrapApiValue(
    await getJson<BankQueryItem[] | ApiStatusEnvelope<BankQueryItem[]> | ApiEnvelope<BankQueryItem[]>>('/banks/get-banks')
  );
}
