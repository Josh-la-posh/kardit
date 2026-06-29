import { ApiError } from '@/services/apiError';
import { getAuthAccessToken } from '@/services/authSession';
import type {
  GetBatchesRequest,
  GetBatchesResponse,
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
  BatchResultsFormat,
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
  return postJson<SubmitBatchResponse>(`/Batches/${batchId}/submit`, request).catch(() =>
    postJson<SubmitBatchResponse>(`/batches/${batchId}/submit`, request)
  );
}

export function getBatch(batchId: string): Promise<GetBatchResponse> {
  return getJson<GetBatchResponse>(`/batches/${encodeURIComponent(batchId)}`);
}

export function getBatchRows(batchId: string, request: GetBatchRowsRequest = {}): Promise<GetBatchRowsResponse> {
  const query = new URLSearchParams();
  if (request.status) query.set('status', request.status);
  if (request.page) query.set('page', String(request.page));
  if (request.pageSize) query.set('pageSize', String(request.pageSize));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return getJson<GetBatchRowsResponse>(`/batches/${batchId}/rows${suffix}`);
}

export function downloadBatchResults(
  batchId: string,
  format: BatchResultsFormat
): Promise<GetBatchResultsResponse> {
  const query = new URLSearchParams({ format });
  return getJson<GetBatchResultsResponse>(
    `/batches/${encodeURIComponent(batchId)}/results/download?${query.toString()}`
  );
}

export async function downloadProtectedBatchFile(
  downloadUrl: string,
  fallbackFileName: string
): Promise<{ blob: Blob; fileName: string }> {
  const accessToken = getAuthAccessToken();
  if (!accessToken) {
    throw new ApiError('Your session token is unavailable. Please sign in again.', 401, undefined);
  }

  const baseUrl = getApiBaseUrl();
  const resolvedUrl = new URL(downloadUrl, baseUrl ? `${baseUrl}/` : window.location.origin).toString();
  const response = await fetch(resolvedUrl, {
    method: 'GET',
    headers: {
      Authorization: accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await safeJson(response);
    const message =
      (typeof errorBody === 'object' && errorBody && 'message' in errorBody
        ? String((errorBody as { message: unknown }).message)
        : undefined) || `Download failed (${response.status})`;
    throw new ApiError(message, response.status, errorBody);
  }

  const disposition = response.headers.get('Content-Disposition') || '';
  const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  const fileName = encodedName
    ? decodeURIComponent(encodedName)
    : plainName?.trim() || fallbackFileName;

  return { blob: await response.blob(), fileName };
}

export function getBatches(request: GetBatchesRequest = {}): Promise<GetBatchesResponse> {
  const query = new URLSearchParams();
  if (request.batchType) query.set('BatchType', request.batchType);
  if (request.status) query.set('Status', request.status);
  if (request.productId) query.set('ProductId', request.productId);
  if (request.bankId) query.set('BankId', request.bankId);
  if (request.submittedByRef) query.set('SubmittedByRef', request.submittedByRef);
  if (request.tenantId) query.set('TenantId', request.tenantId);
  if (request.makerUserId) query.set('MakerUserId', request.makerUserId);
  if (request.checkerUserId) query.set('CheckerUserId', request.checkerUserId);
  if (request.submittedFrom) query.set('SubmittedFrom', request.submittedFrom);
  if (request.submittedTo) query.set('SubmittedTo', request.submittedTo);
  if (request.approvedFrom) query.set('ApprovedFrom', request.approvedFrom);
  if (request.approvedTo) query.set('ApprovedTo', request.approvedTo);
  if (request.processedFrom) query.set('ProcessedFrom', request.processedFrom);
  if (request.processedTo) query.set('ProcessedTo', request.processedTo);
  if (typeof request.page === 'number') query.set('Page', String(request.page));
  if (typeof request.pageSize === 'number') query.set('PageSize', String(request.pageSize));
  if (request.sortBy) query.set('SortBy', request.sortBy);
  if (request.sortDirection) query.set('SortDirection', request.sortDirection);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return getJson<GetBatchesResponse>(`/Batches${suffix}`);
}
