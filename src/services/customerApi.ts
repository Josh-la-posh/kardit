import { ApiError } from '@/services/authApi';
import type {
  CustomerDetailResponse,
  SearchCustomersRequest,
  SearchCustomersResponse,
} from '@/types/customerContracts';

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

export async function searchCustomers(request: SearchCustomersRequest): Promise<SearchCustomersResponse> {
  return postJson<SearchCustomersResponse>('/customers/search', request);
}

export async function getCustomer(customerRefId: string): Promise<CustomerDetailResponse> {
  return getJson<CustomerDetailResponse>(`/customers/${encodeURIComponent(customerRefId)}`);
}
