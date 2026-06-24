import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  approvePartnershipRequest,
  blockAffiliate,
  getBankAffiliates,
  getPendingBankAffiliateApprovals,
  getPartnershipRequest,
  listBankAuditLogs,
  listBankReports,
  rejectPartnershipRequest,
  resolveBankId,
  suspendAffiliate,
} from '@/services/bankPortalApi';
import { queryCards } from '@/services/cardsApi';
import type {
  ApprovePartnershipResponse,
  ApprovePartnershipRequest,
  BankAffiliateSummary,
  BankAffiliateStatus,
  BankAuditLogItem,
  BankCardItem,
  BankDashboardMetrics,
  BankReportItem,
  BlockAffiliateResponse,
  GetPartnershipRequestResponse,
  ListBankAuditLogsResponse,
  ListBankReportsResponse,
  PartnershipRequestQueryItem,
  RejectPartnershipRequest,
  RejectPartnershipResponse,
  SuspendAffiliateResponse,
} from '@/types/bankPortalContracts';

const DASHBOARD_PAGE_SIZE = 5;

function extractAffiliates(payload: unknown): BankAffiliateSummary[] {
  if (Array.isArray((payload as { affiliates?: unknown })?.affiliates)) {
    return (payload as { affiliates: BankAffiliateSummary[] }).affiliates;
  }
  if (Array.isArray((payload as { data?: { affiliates?: unknown } })?.data?.affiliates)) {
    return (payload as { data: { affiliates: BankAffiliateSummary[] } }).data.affiliates;
  }
  if (Array.isArray((payload as { data?: unknown })?.data)) {
    return (payload as { data: BankAffiliateSummary[] }).data;
  }
  return [];
}

function extractAffiliateMeta(payload: unknown): { page: number; pageSize: number; total: number } {
  const direct = payload as {
    page?: number;
    pageSize?: number;
    total?: number;
    pagination?: { page?: number; pageSize?: number; total?: number };
  };
  const directPagination = direct.pagination;
  if (directPagination) {
    const affiliates = extractAffiliates(payload);
    const page = directPagination.page ?? 1;
    const pageSize = directPagination.pageSize ?? 20;
    return {
      page,
      pageSize,
      total: directPagination.total ??
        (affiliates.length < pageSize ? (page - 1) * pageSize + affiliates.length : page * pageSize + 1),
    };
  }
  if (typeof direct?.page === 'number' || typeof direct?.pageSize === 'number' || typeof direct?.total === 'number') {
    return {
      page: direct.page ?? 1,
      pageSize: direct.pageSize ?? 20,
      total: direct.total ?? extractAffiliates(payload).length,
    };
  }

  const wrapped = payload as {
    data?: {
      page?: number;
      pageSize?: number;
      total?: number;
      pagination?: { page?: number; pageSize?: number; total?: number };
    };
  };
  const wrappedPagination = wrapped?.data?.pagination;
  if (wrappedPagination) {
    const affiliates = extractAffiliates(payload);
    const page = wrappedPagination.page ?? 1;
    const pageSize = wrappedPagination.pageSize ?? 20;
    return {
      page,
      pageSize,
      total: wrappedPagination.total ??
        (affiliates.length < pageSize ? (page - 1) * pageSize + affiliates.length : page * pageSize + 1),
    };
  }
  return {
    page: wrapped?.data?.page ?? 1,
    pageSize: wrapped?.data?.pageSize ?? 20,
    total: wrapped?.data?.total ?? extractAffiliates(payload).length,
  };
}

function extractPendingPartnershipRequests(payload: unknown): {
  requests: PartnershipRequestQueryItem[];
  page: number;
  pageSize: number;
  total: number;
} {
  const envelope = payload && typeof payload === 'object'
    ? payload as Record<string, unknown>
    : {};
  const data = envelope.data && typeof envelope.data === 'object'
    ? envelope.data as Record<string, unknown>
    : envelope;
  const rawItems =
    Array.isArray(data.affiliates) ? data.affiliates :
    Array.isArray(data.items) ? data.items :
    Array.isArray(data.results) ? data.results :
    Array.isArray(data.data) ? data.data :
    [];

  const requests = rawItems.map((item) => {
    const record = item && typeof item === 'object'
      ? item as Record<string, unknown>
      : {};
    const affiliate = record.affiliate && typeof record.affiliate === 'object'
      ? record.affiliate as Record<string, unknown>
      : record;

    return {
      partnershipRequestId: String(
        record.partnershipRequestId ?? record.requestId ?? affiliate.partnershipRequestId ?? ''
      ),
      affiliateId: String(affiliate.affiliateId ?? record.affiliateId ?? ''),
      affiliateName: String(
        affiliate.affiliateName ??
        affiliate.tradingName ??
        affiliate.legalName ??
        record.affiliateName ??
        ''
      ),
      bankId: String(record.bankId ?? data.bankId ?? ''),
      bankName: typeof record.bankName === 'string' ? record.bankName : undefined,
      status: String(record.status ?? affiliate.status ?? 'PENDING_BANK_APPROVAL'),
      note: typeof record.note === 'string' ? record.note : undefined,
      requestedAt: String(record.requestedAt ?? affiliate.requestedAt ?? ''),
      decisionedAt: typeof record.decisionedAt === 'string' ? record.decisionedAt : undefined,
    };
  }).filter((request) => request.status === 'PENDING_BANK_APPROVAL');

  return {
    requests,
    page: Number(data.page ?? data.pageNumber ?? 1),
    pageSize: Number(data.pageSize ?? 25),
    total: Number(data.total ?? data.totalRecords ?? requests.length),
  };
}

function toBankCardItem(card: {
  cardId?: string;
  affiliateId?: string;
  productType?: string;
  cardType?: string;
  productId?: string;
  status?: string;
  maskedPan?: string;
  customerId?: string;
  customerRefId?: string;
  issuedAt?: string;
  createdAt?: string;
}): BankCardItem {
  return {
    cardId: card.cardId || '',
    affiliateId: card.affiliateId || '',
    productType: card.productType || card.cardType || card.productId || 'Card',
    status: card.status || 'UNKNOWN',
    maskedPan: card.maskedPan || 'Unavailable',
    customerRefId: card.customerRefId || card.customerId || '',
    issuedAt: card.issuedAt || card.createdAt || new Date().toISOString(),
  };
}

function toBankAuditLogItem(log: {
  auditLogId?: string;
  actorUserId?: string;
  eventType?: string;
  resourceType?: string;
  resourceId?: string;
  occurredAt?: string;
  timestamp?: string;
}): BankAuditLogItem {
  return {
    auditLogId: log.auditLogId || '',
    actorUserId: log.actorUserId || '',
    eventType: log.eventType || '',
    resourceType: log.resourceType || '',
    resourceId: log.resourceId || '',
    occurredAt: log.occurredAt || log.timestamp || '',
  };
}

function extractAuditLogs(payload: unknown): BankAuditLogItem[] {
  if (Array.isArray((payload as { logs?: unknown })?.logs)) {
    return (payload as { logs: Array<Parameters<typeof toBankAuditLogItem>[0]> }).logs.map(toBankAuditLogItem);
  }
  if (Array.isArray((payload as { data?: { logs?: unknown } })?.data?.logs)) {
    return (payload as { data: { logs: Array<Parameters<typeof toBankAuditLogItem>[0]> } }).data.logs.map(toBankAuditLogItem);
  }
  if (Array.isArray((payload as { data?: unknown })?.data)) {
    return (payload as { data: Array<Parameters<typeof toBankAuditLogItem>[0]> }).data.map(toBankAuditLogItem);
  }
  return [];
}

function extractReports(payload: unknown): BankReportItem[] {
  if (Array.isArray((payload as { reports?: unknown })?.reports)) {
    return (payload as { reports: BankReportItem[] }).reports;
  }
  if (Array.isArray((payload as { data?: { reports?: unknown } })?.data?.reports)) {
    return (payload as { data: { reports: BankReportItem[] } }).data.reports;
  }
  if (Array.isArray((payload as { data?: unknown })?.data)) {
    return (payload as { data: BankReportItem[] }).data;
  }
  return [];
}

function extractPaginatedMeta(payload: unknown): { page: number; pageSize: number; total: number } {
  const direct = payload as { page?: number; pageSize?: number; total?: number };
  if (typeof direct?.page === 'number' || typeof direct?.pageSize === 'number' || typeof direct?.total === 'number') {
    return {
      page: direct.page ?? 1,
      pageSize: direct.pageSize ?? DASHBOARD_PAGE_SIZE,
      total: direct.total ?? 0,
    };
  }

  const wrapped = payload as { data?: { page?: number; pageSize?: number; total?: number } };
  return {
    page: wrapped?.data?.page ?? 1,
    pageSize: wrapped?.data?.pageSize ?? DASHBOARD_PAGE_SIZE,
    total: wrapped?.data?.total ?? 0,
  };
}

export function useBankDashboardData() {
  const { user } = useAuth();
  const [bankId, setBankId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<BankDashboardMetrics | null>(null);
  const [affiliates, setAffiliates] = useState<BankAffiliateSummary[]>([]);
  const [affiliatesError, setAffiliatesError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<BankAuditLogItem[]>([]);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [reports, setReports] = useState<BankReportItem[]>([]);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(DASHBOARD_PAGE_SIZE);
  const [auditTotal, setAuditTotal] = useState(0);
  const [reportPage, setReportPage] = useState(1);
  const [reportPageSize, setReportPageSize] = useState(DASHBOARD_PAGE_SIZE);
  const [reportTotal, setReportTotal] = useState(0);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (options?: { auditPage?: number; reportPage?: number }) => {
    setIsLoading(true);
    setError(null);
    try {
      const resolvedBankId = resolveBankId(user);
      setBankId(resolvedBankId);
      const nextAuditPage = options?.auditPage ?? auditPage;
      const nextReportPage = options?.reportPage ?? reportPage;

      const [affiliateRes, auditRes, reportRes] = await Promise.allSettled([
        getBankAffiliates(resolvedBankId),
        listBankAuditLogs(resolvedBankId, {
          filters: { fromDate: null, toDate: null, actorUserId: null, eventType: null },
          pagination: { page: nextAuditPage, pageSize: DASHBOARD_PAGE_SIZE },
        }),
        listBankReports(resolvedBankId, {
          filters: { reportType: null, fromDate: null, toDate: null },
          pagination: { page: nextReportPage, pageSize: DASHBOARD_PAGE_SIZE },
        }),
      ]);

      setMetrics(null);
      setGeneratedAt(null);

      if (affiliateRes.status === 'fulfilled') {
        setAffiliates(extractAffiliates(affiliateRes.value));
        setAffiliatesError(null);
      } else {
        setAffiliates([]);
        setAffiliatesError(
          affiliateRes.reason instanceof Error ? affiliateRes.reason.message : 'Failed to load affiliates'
        );
      }

      if (auditRes.status === 'fulfilled') {
        setAuditLogs(extractAuditLogs(auditRes.value as ListBankAuditLogsResponse));
        const auditMeta = extractPaginatedMeta(auditRes.value as ListBankAuditLogsResponse);
        setAuditPage(auditMeta.page);
        setAuditPageSize(auditMeta.pageSize);
        setAuditTotal(auditMeta.total);
        setAuditError(null);
      } else {
        setAuditLogs([]);
        setAuditTotal(0);
        setAuditError(auditRes.reason instanceof Error ? auditRes.reason.message : 'Failed to load audit logs');
      }

      if (reportRes.status === 'fulfilled') {
        setReports(extractReports(reportRes.value as ListBankReportsResponse));
        const reportMeta = extractPaginatedMeta(reportRes.value as ListBankReportsResponse);
        setReportPage(reportMeta.page);
        setReportPageSize(reportMeta.pageSize);
        setReportTotal(reportMeta.total);
        setReportsError(null);
      } else {
        setReports([]);
        setReportTotal(0);
        setReportsError(reportRes.reason instanceof Error ? reportRes.reason.message : 'Failed to load reports');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load bank dashboard');
      setMetrics(null);
      setAffiliates([]);
      setAffiliatesError(null);
      setAuditLogs([]);
      setAuditError(null);
      setReports([]);
      setReportsError(null);
      setAuditTotal(0);
      setReportTotal(0);
      setGeneratedAt(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh({ auditPage, reportPage });
  }, [auditPage, reportPage, refresh]);

  const totalAuditPages = Math.max(1, Math.ceil(auditTotal / Math.max(1, auditPageSize)));
  const totalReportPages = Math.max(1, Math.ceil(reportTotal / Math.max(1, reportPageSize)));

  const goToAuditPage = useCallback(
    async (page: number) => {
      const nextPage = Math.min(Math.max(1, page), totalAuditPages);
      setAuditPage(nextPage);
    },
    [totalAuditPages]
  );

  const goToReportPage = useCallback(
    async (page: number) => {
      const nextPage = Math.min(Math.max(1, page), totalReportPages);
      setReportPage(nextPage);
    },
    [totalReportPages]
  );

  return {
    bankId,
    metrics,
    affiliates,
    affiliatesError,
    auditLogs,
    auditError,
    reports,
    reportsError,
    auditPage,
    auditPageSize,
    auditTotal,
    reportPage,
    reportPageSize,
    reportTotal,
    generatedAt,
    isLoading,
    error,
    refresh,
    goToAuditPage,
    goToReportPage,
  };
}

export function useBankAuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<BankAuditLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<{
    actorUserId: string;
    eventType: string;
    fromDate: string;
    toDate: string;
  }>({
    actorUserId: '',
    eventType: '',
    fromDate: '',
    toDate: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = useCallback(async (
    nextPage: number,
    nextPageSize: number,
    nextFilters: typeof filters
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const resolvedBankId = resolveBankId(user);

      const response = await listBankAuditLogs(resolvedBankId, {
        filters: {
          fromDate: nextFilters.fromDate || null,
          toDate: nextFilters.toDate || null,
          actorUserId: nextFilters.actorUserId || null,
          eventType: nextFilters.eventType || null,
        },
        pagination: {
          page: nextPage,
          pageSize: nextPageSize,
        },
      });

      const auditMeta = extractPaginatedMeta(response);
      setLogs(extractAuditLogs(response));
      setPage(auditMeta.page);
      setPageSize(auditMeta.pageSize);
      setTotal(auditMeta.total);
    } catch (e: any) {
      setError(e?.message || 'Failed to load audit logs');
      setLogs([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAuditLogs(page, pageSize, filters);
  }, [fetchAuditLogs, filters, page, pageSize]);

  const refresh = useCallback(async (options?: {
    page?: number;
    pageSize?: number;
    filters?: Partial<typeof filters>;
  }) => {
    const nextPage = options?.page ?? page;
    const nextPageSize = options?.pageSize ?? pageSize;
    const nextFilters = {
      ...filters,
      ...(options?.filters || {}),
    };

    if (
      nextPage !== page ||
      nextPageSize !== pageSize ||
      nextFilters.actorUserId !== filters.actorUserId ||
      nextFilters.eventType !== filters.eventType ||
      nextFilters.fromDate !== filters.fromDate ||
      nextFilters.toDate !== filters.toDate
    ) {
      setPage(nextPage);
      setPageSize(nextPageSize);
      setFilters(nextFilters);
      return;
    }

    await fetchAuditLogs(nextPage, nextPageSize, nextFilters);
  }, [fetchAuditLogs, filters, page, pageSize]);

  return {
    logs,
    page,
    pageSize,
    total,
    filters,
    isLoading,
    error,
    refresh,
    setPage,
    setPageSize,
    setFilters,
  };
}

export function useBankAffiliates(options?: { page?: number; pageSize?: number; status?: BankAffiliateStatus }) {
  const { user } = useAuth();
  const [bankId, setBankId] = useState<string | null>(null);
  const [affiliates, setAffiliates] = useState<BankAffiliateSummary[]>([]);
  const [page, setPage] = useState(options?.page ?? 1);
  const [pageSize, setPageSize] = useState(options?.pageSize ?? 20);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (override?: { page?: number; pageSize?: number; status?: BankAffiliateStatus }) => {
    setIsLoading(true);
    setError(null);
    try {
      const resolvedBankId = resolveBankId(user);
      setBankId(resolvedBankId);
      const nextPage = override?.page ?? options?.page ?? page;
      const nextPageSize = override?.pageSize ?? options?.pageSize ?? pageSize;
      const nextStatus = override?.status ?? options?.status;
      const response = await getBankAffiliates(resolvedBankId, {
        page: nextPage,
        pageSize: nextPageSize,
        status: nextStatus,
      });
      const nextAffiliates = extractAffiliates(response);
      const meta = extractAffiliateMeta(response);
      setAffiliates(nextAffiliates);
      setPage(meta.page);
      setPageSize(meta.pageSize);
      setTotal(meta.total);
    } catch (e: any) {
      setError(e?.message || 'Failed to load bank affiliates');
      setAffiliates([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [options?.page, options?.pageSize, options?.status, page, pageSize, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { bankId, affiliates, page, pageSize, total, isLoading, error, refresh, setPage, setPageSize };
}

export function useBankAffiliateCards(affiliateId: string | undefined) {
  const { user } = useAuth();
  const [bankId, setBankId] = useState<string | null>(null);
  const [cards, setCards] = useState<BankCardItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(
    async (filters?: { status?: string; fromDate?: string; toDate?: string }) => {
      if (!affiliateId) return;
      setIsLoading(true);
      setError(null);
      try {
        const resolvedBankId = resolveBankId(user);
        setBankId(resolvedBankId);
        const response = await queryCards({
          filters: {
            bankId: resolvedBankId,
            affiliateId,
            ...(filters?.status ? { status: [filters.status] } : {}),
            ...(filters?.fromDate ? { fromDate: filters.fromDate } : {}),
            ...(filters?.toDate ? { toDate: filters.toDate } : {}),
          },
          page: 1,
          pageSize: 20,
        });
        setCards(response.data.map(toBankCardItem));
        setTotal(response.total);
      } catch (e: any) {
        setError(e?.message || 'Failed to load affiliate cards');
        setCards([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    },
    [affiliateId, user]
  );

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const suspend = useCallback(
    async (reason: string): Promise<SuspendAffiliateResponse> => {
      if (!affiliateId) throw new Error('Missing affiliateId');
      const resolvedBankId = bankId || resolveBankId(user);
      return suspendAffiliate(resolvedBankId, affiliateId, {
        requestContext: {
          requestId: `REQ-SUS-${Date.now()}`,
          actorUserId: user?.id || 'USR-BNK-UNKNOWN',
          userType: user?.role || 'BANK_ADMIN',
          bankId: resolvedBankId,
          role: user?.role || 'BANK_ADMIN',
          tenantId: user?.tenantId,
          affiliateId: affiliateId,
          idempotencyKey: `IDEMP-${Date.now()}`,
        },
        reason,
        // idempotencyKey: `IDEMP-${Date.now()}`,
      });
    },
    [affiliateId, bankId, user]
  );

  const block = useCallback(
    async (reason: string): Promise<BlockAffiliateResponse> => {
      if (!affiliateId) throw new Error('Missing affiliateId');
      const resolvedBankId = bankId || resolveBankId(user);
      return blockAffiliate(resolvedBankId, affiliateId, {
        requestContext: {
          requestId: `REQ-BLK-${Date.now()}`,
          actorUserId: user?.id || 'USR-BNK-UNKNOWN',
          userType: user?.role || 'BANK_ADMIN',
          role: user?.role || 'BANK_ADMIN',
          tenantId: user?.tenantId,
          affiliateId: affiliateId,
          idempotencyKey: `IDEMP-${Date.now()}`,
        },
        reason,
        // idempotencyKey: `IDEMP-${Date.now()}`,
      });
    },
    [affiliateId, user]
  );

  return { bankId, cards, total, isLoading, error, fetchCards, suspend, block };
}

export function usePartnershipRequest(partnershipRequestId: string | undefined) {
  const { user } = useAuth();
  const bankIdScope = user?.bankId;
  const tenantIdScope = user?.tenantId;
  const [request, setRequest] = useState<GetPartnershipRequestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!partnershipRequestId) return;
    setIsLoading(true);
    setError(null);
    try {
      const bankId = resolveBankId({ bankId: bankIdScope, tenantId: tenantIdScope });
      setRequest(await getPartnershipRequest(bankId, partnershipRequestId));
    } catch (e: any) {
      setError(e?.message || 'Failed to load partnership request');
      setRequest(null);
    } finally {
      setIsLoading(false);
    }
  }, [bankIdScope, partnershipRequestId, tenantIdScope]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { request, isLoading, error, refresh };
}

export function usePendingPartnershipRequests(options: { autoLoad?: boolean } = {}) {
  const { user } = useAuth();
  const autoLoad = options.autoLoad ?? true;
  const bankIdScope = user?.bankId;
  const tenantIdScope = user?.tenantId;
  const [bankId, setBankId] = useState<string | null>(null);
  const [requests, setRequests] = useState<Array<PartnershipRequestQueryItem>>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resolvedBankId = resolveBankId({ bankId: bankIdScope, tenantId: tenantIdScope });
      setBankId(resolvedBankId);
      const response = await getPendingBankAffiliateApprovals(resolvedBankId, page, pageSize);
      const pending = extractPendingPartnershipRequests(response);
      setRequests(pending.requests);
      setPage(pending.page);
      setTotal(pending.total);
    } catch (e: any) {
      setError(e?.message || 'Failed to load pending partnership requests');
      setRequests([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [bankIdScope, page, pageSize, tenantIdScope]);

  useEffect(() => {
    if (autoLoad) {
      refresh();
    }
  }, [autoLoad, refresh]);

  const approve = useCallback(
    async (requestId: string, request: ApprovePartnershipRequest): Promise<ApprovePartnershipResponse> => {
      setIsActing(true);
      setError(null);
      try {
        const response = await approvePartnershipRequest(requestId, request);
        if (autoLoad) {
          await refresh();
        }
        return response;
      } catch (e: any) {
        setError(e?.message || 'Failed to approve partnership request');
        throw e;
      } finally {
        setIsActing(false);
      }
    },
    [refresh]
  );

  const reject = useCallback(
    async (requestId: string, request: RejectPartnershipRequest): Promise<RejectPartnershipResponse> => {
      setIsActing(true);
      setError(null);
      try {
        const response = await rejectPartnershipRequest(requestId, request);
        if (autoLoad) {
          await refresh();
        }
        return response;
      } catch (e: any) {
        setError(e?.message || 'Failed to reject partnership request');
        throw e;
      } finally {
        setIsActing(false);
      }
    },
    [refresh]
  );

  return { bankId, requests, page, pageSize, total, setPage, isLoading, isActing, error, refresh, approve, reject };
}
