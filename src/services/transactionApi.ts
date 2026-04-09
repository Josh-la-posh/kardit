import { ApiError } from '@/services/authApi';
import type {
  AffiliateTransactionVolumeResponse,
  BankTransactionVolumeResponse,
  CardLoadTransactionsResponse,
  CardTransactionsResponse,
  CardUnloadTransactionsResponse,
  CustomerTransactionsResponse,
  TransactionDetail,
  TransactionExportRequest,
  TransactionExportResponse,
  TransactionQueryRequest,
  TransactionQueryResponse,
} from '@/types/transactionContracts';

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');

const getApiBaseUrl = () => {
  const base = (import.meta.env as ImportMetaEnv).VITE_API_BASE_URL;
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
    const errorBody = await safeJson(res);
    throw new ApiError('Request failed', res.status, errorBody);
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
      (typeof errorBody === 'object' && errorBody && 'message' in (errorBody as Record<string, unknown>)
        ? String((errorBody as Record<string, unknown>).message)
        : undefined) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, errorBody);
  }

  return (await res.json()) as TResponse;
}

export function queryTransactions(request: TransactionQueryRequest): Promise<TransactionQueryResponse> {
  return postJson<TransactionQueryResponse>('/transactions/query', request);
}

export function getTransaction(transactionId: string): Promise<TransactionDetail> {
  return getJson<TransactionDetail>(`/transactions/${encodeURIComponent(transactionId)}`);
}

export function getCustomerTransactions(customerId: string): Promise<CustomerTransactionsResponse> {
  return getJson<CustomerTransactionsResponse>(`/transactions/customers/${encodeURIComponent(customerId)}`);
}

export function exportTransactions(request: TransactionExportRequest): Promise<TransactionExportResponse> {
  return postJson<TransactionExportResponse>('/transactions/export', request);
}

export function getBankTransactionVolume(bankId: string): Promise<BankTransactionVolumeResponse> {
  return getJson<BankTransactionVolumeResponse>(`/transactions/volume/bank/${encodeURIComponent(bankId)}`);
}

export function getAffiliateTransactionVolume(affiliateId: string): Promise<AffiliateTransactionVolumeResponse> {
  return getJson<AffiliateTransactionVolumeResponse>(`/transactions/volume/affiliate/${encodeURIComponent(affiliateId)}`);
}

export function getCardUnloadTransactions(cardId: string): Promise<CardUnloadTransactionsResponse> {
  return getJson<CardUnloadTransactionsResponse>(`/transactions/cards/${encodeURIComponent(cardId)}/unloads`);
}

export function getCardLoadTransactions(cardId: string): Promise<CardLoadTransactionsResponse> {
  return getJson<CardLoadTransactionsResponse>(`/transactions/cards/${encodeURIComponent(cardId)}/loads`);
}

export function getCardTransactions(cardId: string): Promise<CardTransactionsResponse> {
  return getJson<CardTransactionsResponse>(`/transactions/cards/${encodeURIComponent(cardId)}`);
}
