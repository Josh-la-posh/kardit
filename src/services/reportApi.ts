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
type ReportEnvelope<T> = {
  data?: {
    isSuccess?: boolean;
    value?: T;
    error?: unknown;
  };
};

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

function unwrapReportValue<TResponse>(response: TResponse | ReportEnvelope<TResponse>): TResponse {
  if (response && typeof response === 'object' && 'data' in response) {
    const envelope = response as ReportEnvelope<TResponse>;
    if (envelope.data?.isSuccess === false) {
      throw new ApiError('Report request failed', 200, envelope.data.error);
    }

    if (envelope.data?.value !== undefined) {
      return envelope.data.value;
    }
  }

  return response as TResponse;
}

async function getReportJson<TResponse>(path: string): Promise<TResponse> {
  const response = await getJson<TResponse | ReportEnvelope<TResponse>>(path);
  return unwrapReportValue(response);
}

export async function getCardTransactionsReport(cardId: string, params: ReportPageRequest) {
  const value = await getReportJson<CardTransactionsReportResponse & { record?: CardTransactionsReportResponse['transactions'] }>(
    `/transactions/reports/cards/${cardId}/transactions${buildQuery(
      toQueryParams({
        page: params.page,
        pageSize: params.pageSize,
        fromDate: params.fromDate,
        toDate: params.toDate,
      })
    )}`
  );

  return {
    cardId: value.cardId,
    page: value.page,
    pageSize: value.pageSize,
    transactions: Array.isArray(value.transactions) ? value.transactions : Array.isArray(value.record) ? value.record : [],
  };
}

export async function getCardLoadsReport(cardId: string, params: Pick<ReportPageRequest, 'page' | 'pageSize'>) {
  const value = await getReportJson<CardLoadsReportResponse & { record?: CardLoadsReportResponse['loads'] }>(
    `/transactions/reports/cards/${cardId}/loads${buildQuery(
      toQueryParams({
        page: params.page,
        pageSize: params.pageSize,
      })
    )}`
  );

  return {
    cardId: value.cardId,
    loads: Array.isArray(value.loads) ? value.loads : Array.isArray(value.record) ? value.record : [],
  };
}

export async function getCardUnloadsReport(cardId: string, params: Pick<ReportPageRequest, 'page' | 'pageSize'>) {
  const value = await getReportJson<CardUnloadsReportResponse & { record?: CardUnloadsReportResponse['unloads'] }>(
    `/transactions/reports/cards/${cardId}/unloads${buildQuery(
      toQueryParams({
        page: params.page,
        pageSize: params.pageSize,
      })
    )}`
  );

  return {
    cardId: value.cardId,
    unloads: Array.isArray(value.unloads) ? value.unloads : Array.isArray(value.record) ? value.record : [],
  };
}

export async function getCardLifecycleEventsReport(cardId: string, params: ReportPageRequest) {
  const value = await getReportJson<CardLifecycleEventsReportResponse & { record?: CardLifecycleEventsReportResponse['events'] }>(
    `/transactions/reports/cards/${cardId}/lifecycle-events${buildQuery(
      toQueryParams({
        pageNumber: params.page,
        pageSize: params.pageSize,
        fromDate: params.fromDate,
        toDate: params.toDate,
      })
    )}`
  );

  return {
    cardId: value.cardId,
    page: value.page,
    pageSize: value.pageSize,
    events: Array.isArray(value.events) ? value.events : Array.isArray(value.record) ? value.record : [],
  };
}

export async function getCardBalancesReport(cardId: string, params: ReportPageRequest) {
  const value = await getReportJson<CardBalancesReportResponse & { record?: CardBalancesReportResponse['snapshots'] }>(
    `/transactions/reports/cards/${cardId}/balances${buildQuery(
      toQueryParams({
        page: params.page,
        pageSize: params.pageSize,
        fromDate: params.fromDate,
        toDate: params.toDate,
      })
    )}`
  );

  return {
    cardId: value.cardId,
    page: value.page,
    pageSize: value.pageSize,
    snapshots: Array.isArray(value.snapshots) ? value.snapshots : Array.isArray(value.record) ? value.record : [],
  };
}

export async function getCardsIssuanceReport(params: ReportPageRequest & { productType?: string }) {
  const value = await getReportJson<CardsIssuanceReportResponse & { record?: CardsIssuanceReportResponse['records'] }>(
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

  return {
    page: value.page,
    pageSize: value.pageSize,
    records: Array.isArray(value.records) ? value.records : Array.isArray(value.record) ? value.record : [],
  };
}

export async function getCardsFulfillmentReport(params: ReportPageRequest & { status?: string }) {
  const value = await getReportJson<CardsFulfillmentReportResponse & { record?: CardsFulfillmentReportResponse['records'] }>(
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

  return {
    page: value.page,
    pageSize: value.pageSize,
    records: Array.isArray(value.records) ? value.records : Array.isArray(value.record) ? value.record : [],
  };
}

export async function getBatchesReport(params: ReportPageRequest & { operationType?: string }) {
  const value = await getReportJson<BatchesReportResponse & { record?: BatchesReportResponse['records'] }>(
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

  return {
    page: value.page,
    pageSize: value.pageSize,
    records: Array.isArray(value.records) ? value.records : Array.isArray(value.record) ? value.record : [],
  };
}

export async function getCmsTracesReport(params: Pick<ReportPageRequest, 'page' | 'pageSize'> & { cardId?: string; operationType?: string }) {
  const value = await getReportJson<CmsTracesReportResponse & { record?: CmsTracesReportResponse['records'] }>(
    `/transactions/reports/cms-traces${buildQuery(
      toQueryParams({
        page: params.page,
        pageSize: params.pageSize,
        cardId: params.cardId,
        operationType: params.operationType,
      })
    )}`
  );

  return {
    page: value.page,
    pageSize: value.pageSize,
    records: Array.isArray(value.records) ? value.records : Array.isArray(value.record) ? value.record : [],
  };
}

export async function getCustomerSupportViewReport(customerRefId: string) {
  return getReportJson<CustomerSupportViewReportResponse>(
    `/transactions/reports/customers/${customerRefId}/support-view`
  );
}

export async function getExceptionsReport(params: ReportPageRequest & { operationType?: string }) {
  const value = await getReportJson<ExceptionsReportResponse & { record?: ExceptionsReportResponse['records'] }>(
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

  return {
    page: value.page,
    pageSize: value.pageSize,
    records: Array.isArray(value.records) ? value.records : Array.isArray(value.record) ? value.record : [],
  };
}
