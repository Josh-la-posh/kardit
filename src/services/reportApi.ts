import { ApiError } from '@/services/authApi';
import type {
  BatchesReportResponse,
  CardBalancesReportResponse,
  CardLifecycleEventsReportResponse,
  CardLoadsReportResponse,
  CardTransactionsReportResponse,
  CardUnloadsReportResponse,
  CardsFulfillmentReportResponse,
  CardsIssuanceReportResponse,
  CmsTracesReportResponse,
  CustomerSupportViewReportResponse,
  ExceptionsReportResponse,
  ReportPageRequest,
} from '@/types/reportContracts';

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

type QueryValue = string | number | undefined;

function buildQuery(params: Record<string, QueryValue>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

function toQueryParams(params: Record<string, QueryValue>) {
  return params;
}

async function getJson<TResponse>(path: string): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new ApiError('Missing VITE_API_BASE_URL', 0, undefined);
  const res = await fetch(`${baseUrl}${path}`, { method: 'GET' });
  if (!res.ok) {
    const body = await safeJson(res);
    throw new ApiError('Request failed', res.status, body);
  }
  return (await res.json()) as TResponse;
}

export function getCardTransactionsReport(cardId: string, params: ReportPageRequest) {
  return getJson<CardTransactionsReportResponse>(
    `/transactions/reports/cards/${cardId}/transactions${buildQuery(
      toQueryParams({
        page: params.page,
        pageSize: params.pageSize,
        fromDate: params.fromDate,
        toDate: params.toDate,
      })
    )}`
  );
}

export function getCardLoadsReport(cardId: string, params: Pick<ReportPageRequest, 'page' | 'pageSize'>) {
  return getJson<CardLoadsReportResponse>(
    `/transactions/reports/cards/${cardId}/loads${buildQuery(
      toQueryParams({
        page: params.page,
        pageSize: params.pageSize,
      })
    )}`
  );
}

export function getCardUnloadsReport(cardId: string, params: Pick<ReportPageRequest, 'page' | 'pageSize'>) {
  return getJson<CardUnloadsReportResponse>(
    `/transactions/reports/cards/${cardId}/unloads${buildQuery(
      toQueryParams({
        page: params.page,
        pageSize: params.pageSize,
      })
    )}`
  );
}

export function getCardLifecycleEventsReport(cardId: string, params: ReportPageRequest) {
  return getJson<CardLifecycleEventsReportResponse>(
    `/transactions/reports/cards/${cardId}/lifecycle-events${buildQuery(
      toQueryParams({
        page: params.page,
        pageSize: params.pageSize,
        fromDate: params.fromDate,
        toDate: params.toDate,
      })
    )}`
  );
}

export function getCardBalancesReport(cardId: string, params: ReportPageRequest) {
  return getJson<CardBalancesReportResponse>(
    `/transactions/reports/cards/${cardId}/balances${buildQuery(
      toQueryParams({
        page: params.page,
        pageSize: params.pageSize,
        fromDate: params.fromDate,
        toDate: params.toDate,
      })
    )}`
  );
}

export function getCardsIssuanceReport(params: ReportPageRequest & { productType?: string }) {
  return getJson<CardsIssuanceReportResponse>(
    `/transactions/reports/cards/issuance${buildQuery(
      toQueryParams({
        page: params.page,
        pageSize: params.pageSize,
        fromDate: params.fromDate,
        toDate: params.toDate,
        productType: params.productType,
      })
    )}`
  );
}

export function getCardsFulfillmentReport(params: ReportPageRequest & { status?: string }) {
  return getJson<CardsFulfillmentReportResponse>(
    `/transactions/reports/cards/fulfillment${buildQuery(
      toQueryParams({
        page: params.page,
        pageSize: params.pageSize,
        fromDate: params.fromDate,
        toDate: params.toDate,
        status: params.status,
      })
    )}`
  );
}

export function getBatchesReport(params: ReportPageRequest & { operationType?: string }) {
  return getJson<BatchesReportResponse>(
    `/transactions/reports/batches${buildQuery(
      toQueryParams({
        page: params.page,
        pageSize: params.pageSize,
        operationType: params.operationType,
        fromDate: params.fromDate,
        toDate: params.toDate,
      })
    )}`
  );
}

export function getCmsTracesReport(params: Pick<ReportPageRequest, 'page' | 'pageSize'> & { cardId?: string; operationType?: string }) {
  return getJson<CmsTracesReportResponse>(
    `/transactions/reports/cms-traces${buildQuery(
      toQueryParams({
        page: params.page,
        pageSize: params.pageSize,
        cardId: params.cardId,
        operationType: params.operationType,
      })
    )}`
  );
}

export function getCustomerSupportViewReport(customerRefId: string) {
  return getJson<CustomerSupportViewReportResponse>(
    `/transactions/reports/customers/${customerRefId}/support-view`
  );
}

export function getExceptionsReport(params: ReportPageRequest & { operationType?: string }) {
  return getJson<ExceptionsReportResponse>(
    `/transactions/reports/exceptions${buildQuery(
      toQueryParams({
        page: params.page,
        pageSize: params.pageSize,
        operationType: params.operationType,
        fromDate: params.fromDate,
        toDate: params.toDate,
      })
    )}`
  );
}
