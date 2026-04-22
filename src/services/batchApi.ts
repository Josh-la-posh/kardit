import { ApiError } from '@/services/authApi';
import type {
  GetBatchResponse,
  GetBatchRowsRequest,
  GetBatchRowsResponse,
  GetBatchResultsResponse,
  SubmitBatchRequest,
  SubmitBatchResponse,
  UploadBatchRequest,
  UploadBatchResponse,
  ValidateBatchRequest,
  ValidateBatchResponse,
} from '@/types/batchContracts';

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

async function postJson<TResponse>(path: string, body: unknown, init?: RequestInit): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new ApiError('Missing VITE_API_BASE_URL', 0, undefined);
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    body: JSON.stringify(body),
    ...init,
  });
  if (!res.ok) {
    const errorBody = await safeJson(res);
    const message =
      (typeof errorBody === 'object' && errorBody && 'message' in (errorBody as any)
        ? String((errorBody as any).message)
        : undefined) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, errorBody);
  }
  return (await res.json()) as TResponse;
}

export function uploadBatch(request: UploadBatchRequest): Promise<UploadBatchResponse> {
  return postJson<UploadBatchResponse>('/batches/card-creation/upload', request);
}

export function validateBatch(batchId: string, request: ValidateBatchRequest): Promise<ValidateBatchResponse> {
  return postJson<ValidateBatchResponse>(`/batches/${batchId}/validate`, request);
}

export function submitBatch(batchId: string, request: SubmitBatchRequest): Promise<SubmitBatchResponse> {
  return postJson<SubmitBatchResponse>(`/batches/${batchId}/submit`, request);
}

export function getBatch(batchId: string): Promise<GetBatchResponse> {
  return getJson<GetBatchResponse>(`/batches/${batchId}`);
}

export function getBatchRows(batchId: string, request: GetBatchRowsRequest = {}): Promise<GetBatchRowsResponse> {
  const query = new URLSearchParams();
  if (request.status) query.set('status', request.status);
  if (request.page) query.set('page', String(request.page));
  if (request.pageSize) query.set('pageSize', String(request.pageSize));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return getJson<GetBatchRowsResponse>(`/batches/${batchId}/rows${suffix}`);
}

export function getBatchResultsDownload(batchId: string): Promise<GetBatchResultsResponse> {
  return getJson<GetBatchResultsResponse>(`/batches/${batchId}/results/download`);
}
