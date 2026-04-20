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

type ApiEnvelope<T> = {
  data?: {
    isSuccess?: boolean;
    value?: T;
    error?: unknown;
  };
};

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

function unwrapApiValue<TResponse>(response: TResponse | ApiEnvelope<TResponse>): TResponse {
  if (response && typeof response === 'object' && 'data' in response) {
    const envelope = response as ApiEnvelope<TResponse>;
    if (envelope.data?.isSuccess === false) {
      throw new ApiError('Request failed', 200, envelope.data.error);
    }

    if (envelope.data?.value !== undefined) {
      return envelope.data.value;
    }
  }

  return response as TResponse;
}

function normalizeListResponse<TItem>(
  value: {
    page?: number;
    pageSize?: number;
    total?: number;
    data?: unknown;
    results?: unknown;
    items?: unknown;
    records?: unknown;
    transactions?: unknown;
  },
  fallbackPage = 1,
  fallbackPageSize = 25
) {
  const list =
    Array.isArray(value.data)
      ? value.data
      : Array.isArray(value.results)
        ? value.results
        : Array.isArray(value.items)
          ? value.items
          : Array.isArray(value.records)
            ? value.records
            : Array.isArray(value.transactions)
              ? value.transactions
              : [];

  return {
    page: value.page ?? fallbackPage,
    pageSize: value.pageSize ?? fallbackPageSize,
    total: value.total ?? list.length,
    data: list as TItem[],
  };
}

export function queryTransactions(request: TransactionQueryRequest): Promise<TransactionQueryResponse> {
  return postJson<TransactionQueryResponse | ApiEnvelope<TransactionQueryResponse>>('/transactions/query', request)
    .then((response) => {
      const value = unwrapApiValue(response) as TransactionQueryResponse & {
        results?: TransactionQueryResponse['data'];
        items?: TransactionQueryResponse['data'];
        records?: TransactionQueryResponse['data'];
        transactions?: TransactionQueryResponse['data'];
      };
      return normalizeListResponse(value, request.page, request.pageSize) as TransactionQueryResponse;
    });
}

export function getTransaction(transactionId: string): Promise<TransactionDetail> {
  return getJson<TransactionDetail | ApiEnvelope<TransactionDetail>>(`/transactions/${encodeURIComponent(transactionId)}`)
    .then(unwrapApiValue);
}

export function getCustomerTransactions(customerId: string): Promise<CustomerTransactionsResponse> {
  return getJson<CustomerTransactionsResponse | ApiEnvelope<CustomerTransactionsResponse>>(
    `/transactions/customers/${encodeURIComponent(customerId)}`
  ).then((response) => {
    const value = unwrapApiValue(response) as CustomerTransactionsResponse & {
      results?: CustomerTransactionsResponse['data'];
      items?: CustomerTransactionsResponse['data'];
      records?: CustomerTransactionsResponse['data'];
      transactions?: CustomerTransactionsResponse['data'];
    };
    return {
      ...normalizeListResponse(value),
      customerId: value.customerId ?? customerId,
    } as CustomerTransactionsResponse;
  });
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
  return getJson<CardUnloadTransactionsResponse | ApiEnvelope<CardUnloadTransactionsResponse>>(
    `/transactions/cards/${encodeURIComponent(cardId)}/unloads`
  ).then((response) => {
    const value = unwrapApiValue(response) as CardUnloadTransactionsResponse & {
      results?: CardUnloadTransactionsResponse['data'];
      items?: CardUnloadTransactionsResponse['data'];
      records?: CardUnloadTransactionsResponse['data'];
      transactions?: CardUnloadTransactionsResponse['data'];
    };
    return {
      ...normalizeListResponse(value),
      cardId: value.cardId ?? cardId,
    } as CardUnloadTransactionsResponse;
  });
}

export function getCardLoadTransactions(cardId: string): Promise<CardLoadTransactionsResponse> {
  return getJson<CardLoadTransactionsResponse | ApiEnvelope<CardLoadTransactionsResponse>>(
    `/transactions/cards/${encodeURIComponent(cardId)}/loads`
  ).then((response) => {
    const value = unwrapApiValue(response) as CardLoadTransactionsResponse & {
      results?: CardLoadTransactionsResponse['data'];
      items?: CardLoadTransactionsResponse['data'];
      records?: CardLoadTransactionsResponse['data'];
      transactions?: CardLoadTransactionsResponse['data'];
    };
    return {
      ...normalizeListResponse(value),
      cardId: value.cardId ?? cardId,
    } as CardLoadTransactionsResponse;
  });
}

export function getCardTransactions(cardId: string): Promise<CardTransactionsResponse> {
  return getJson<CardTransactionsResponse | ApiEnvelope<CardTransactionsResponse>>(
    `/transactions/cards/${encodeURIComponent(cardId)}`
  ).then((response) => {
    const value = unwrapApiValue(response) as CardTransactionsResponse & {
      results?: CardTransactionsResponse['data'];
      items?: CardTransactionsResponse['data'];
      records?: CardTransactionsResponse['data'];
      transactions?: CardTransactionsResponse['data'];
    };
    return {
      ...normalizeListResponse(value),
      cardId: value.cardId ?? cardId,
    } as CardTransactionsResponse;
  });
}
