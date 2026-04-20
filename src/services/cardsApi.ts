import { ApiError } from '@/services/authApi';
import type {
  BatchLoadUploadRequest,
  BatchLoadUploadResponse,
  CardLoadRequest,
  CardLoadResponse,
  CreateCardLimitRequestRequest,
  CreateCardLimitRequestResponse,
  CreateCardRequest,
  CreateCardResponse,
  CardUnloadRequest,
  CardUnloadResponse,
  CompleteCardLimitRequestRequest,
  CompleteCardLimitRequestResponse,
  ExecuteBatchLoadRequest,
  ExecuteBatchLoadResponse,
  FreezeCardRequest,
  FreezeCardResponse,
  GetBatchLoadResponse,
  GetBatchLoadResultsResponse,
  GetCardBalanceResponse,
  GetCardFundingDetails,
  GetCardFulfillmentStatusResponse,
  GetCardResponse,
  QueryCardsRequest,
  QueryCardsResponse,
  PinResetRequest,
  PinResetResponse,
  // QueryCardsRequest,
  // QueryCardsResponse,
  RefreshCardFulfillmentRequest,
  RefreshCardFulfillmentResponse,
  ReinitiateCardFulfillmentRequest,
  ReinitiateCardFulfillmentResponse,
  TerminateCardRequest,
  TerminateCardResponse,
  UnfreezeCardRequest,
  UnfreezeCardResponse,
} from '@/types/cardContracts';

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

export function createCard(request: CreateCardRequest): Promise<CreateCardResponse> {
  return postJson<CreateCardResponse>('/cards/issuance', request);
}

export function queryCards(request: QueryCardsRequest): Promise<QueryCardsResponse> {
  return postJson<QueryCardsResponse>('/cards/query', request);
}

export function getCard(cardId: string): Promise<GetCardResponse> {
  return getJson<GetCardResponse>(`/cards/${cardId}`);
}

export function getCardFundingDetails(cardId: string): Promise<GetCardFundingDetails> {
  return getJson<GetCardFundingDetails>(`/cards/${cardId}/funding-details`);
}

export function getCardFulfillmentStatus(cardId: string): Promise<GetCardFulfillmentStatusResponse> {
  return getJson<GetCardFulfillmentStatusResponse>(`/cards/${cardId}/fulfillment/status`);
}

export function refreshCardFulfillment(
  cardId: string,
  request: RefreshCardFulfillmentRequest
): Promise<RefreshCardFulfillmentResponse> {
  return postJson<RefreshCardFulfillmentResponse>(`/cards/${cardId}/fulfillment/refresh`, request);
}

export function reinitiateCardFulfillment(
  cardId: string,
  request: ReinitiateCardFulfillmentRequest
): Promise<ReinitiateCardFulfillmentResponse> {
  return postJson<ReinitiateCardFulfillmentResponse>(`/cards/${cardId}/fulfillment/reinitiate`, request);
}

export function freezeCard(cardId: string, request: FreezeCardRequest): Promise<FreezeCardResponse> {
  return postJson<FreezeCardResponse>(`/cards/${cardId}/freeze`, request);
}

export function unfreezeCard(cardId: string, request: UnfreezeCardRequest): Promise<UnfreezeCardResponse> {
  return postJson<UnfreezeCardResponse>(`/cards/${cardId}/unfreeze`, request);
}

export function terminateCard(cardId: string, request: TerminateCardRequest): Promise<TerminateCardResponse> {
  return postJson<TerminateCardResponse>(`/cards/${cardId}/terminate`, request);
}

export function getCardBalance(cardId: string): Promise<GetCardBalanceResponse> {
  return getJson<GetCardBalanceResponse>(`/cards/${cardId}/balance`);
}

export function createCardLimitRequest(
  cardId: string,
  request: CreateCardLimitRequestRequest
): Promise<CreateCardLimitRequestResponse> {
  return postJson<CreateCardLimitRequestResponse>(`/cards/${cardId}/limit-requests`, request);
}

export function completeCardLimitRequest(
  cardId: string,
  limitRequestId: string,
  request: CompleteCardLimitRequestRequest
): Promise<CompleteCardLimitRequestResponse> {
  return postJson<CompleteCardLimitRequestResponse>(
    `/ops/cards/${cardId}/limit-requests/${limitRequestId}/complete`,
    request
  );
}

export function resetCardPin(cardId: string, request: PinResetRequest): Promise<PinResetResponse> {
  return postJson<PinResetResponse>(`/cards/${cardId}/pin-reset`, request);
}

export function createCardLoad(cardId: string, request: CardLoadRequest): Promise<CardLoadResponse> {
  return postJson<CardLoadResponse>(`/cards/${cardId}/loads`, request);
}

export function createCardUnload(cardId: string, request: CardUnloadRequest): Promise<CardUnloadResponse> {
  return postJson<CardUnloadResponse>(`/cards/${cardId}/unloads`, request);
}

export function uploadBatchLoad(request: BatchLoadUploadRequest): Promise<BatchLoadUploadResponse> {
  return postJson<BatchLoadUploadResponse>('/cards/batch-loads', request);
}

export function executeBatchLoad(batchId: string, request: ExecuteBatchLoadRequest): Promise<ExecuteBatchLoadResponse> {
  return postJson<ExecuteBatchLoadResponse>(`/cards/batch-loads/${batchId}/execute`, request);
}

export function getBatchLoad(batchId: string): Promise<GetBatchLoadResponse> {
  return getJson<GetBatchLoadResponse>(`/cards/batch-loads/${batchId}`);
}

export function getBatchLoadResults(batchId: string): Promise<GetBatchLoadResultsResponse> {
  return getJson<GetBatchLoadResultsResponse>(`/cards/batch-loads/${batchId}/results`);
}
