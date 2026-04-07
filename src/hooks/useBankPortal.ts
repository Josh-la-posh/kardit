import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  approvePartnershipRequest,
  blockAffiliate,
  getBankAffiliates,
  getBankDashboard,
  getPartnershipRequest,
  listBankAuditLogs,
  listBankCards,
  listBankReports,
  rejectPartnershipRequest,
  resolveBankId,
  resolvePendingPartnershipRequestIds,
  suspendAffiliate,
} from '@/services/bankPortalApi';
import type {
  ApprovePartnershipResponse,
  BankAffiliateSummary,
  BankAuditLogItem,
  BankCardItem,
  BankDashboardMetrics,
  BankReportItem,
  BlockAffiliateResponse,
  GetPartnershipRequestResponse,
  RejectPartnershipResponse,
  SuspendAffiliateResponse,
} from '@/types/bankPortalContracts';

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

function extractDashboard(payload: unknown): { metrics: BankDashboardMetrics | null; generatedAt: string | null } {
  const direct = payload as { metrics?: BankDashboardMetrics; generatedAt?: string };
  if (direct?.metrics) {
    return { metrics: direct.metrics, generatedAt: direct.generatedAt ?? null };
  }

  const wrapped = payload as { data?: { metrics?: BankDashboardMetrics; generatedAt?: string } };
  if (wrapped?.data?.metrics) {
    return { metrics: wrapped.data.metrics, generatedAt: wrapped.data.generatedAt ?? null };
  }

  return { metrics: null, generatedAt: null };
}

function extractCards(payload: unknown): { cards: BankCardItem[]; total: number } {
  if (Array.isArray((payload as { cards?: unknown })?.cards)) {
    const direct = payload as { cards: BankCardItem[]; total?: number };
    return { cards: direct.cards, total: direct.total ?? direct.cards.length };
  }
  if (Array.isArray((payload as { data?: { cards?: unknown; total?: unknown } })?.data?.cards)) {
    const wrapped = payload as { data: { cards: BankCardItem[]; total?: number } };
    return { cards: wrapped.data.cards, total: wrapped.data.total ?? wrapped.data.cards.length };
  }
  if (Array.isArray((payload as { data?: unknown })?.data)) {
    const arrayData = payload as { data: BankCardItem[]; total?: number };
    return { cards: arrayData.data, total: arrayData.total ?? arrayData.data.length };
  }
  return { cards: [], total: 0 };
}

function extractAuditLogs(payload: unknown): BankAuditLogItem[] {
  if (Array.isArray((payload as { logs?: unknown })?.logs)) {
    return (payload as { logs: BankAuditLogItem[] }).logs;
  }
  if (Array.isArray((payload as { data?: { logs?: unknown } })?.data?.logs)) {
    return (payload as { data: { logs: BankAuditLogItem[] } }).data.logs;
  }
  if (Array.isArray((payload as { data?: unknown })?.data)) {
    return (payload as { data: BankAuditLogItem[] }).data;
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

export function useBankDashboardData() {
  const { user } = useAuth();
  const [bankId, setBankId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<BankDashboardMetrics | null>(null);
  const [affiliates, setAffiliates] = useState<BankAffiliateSummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<BankAuditLogItem[]>([]);
  const [reports, setReports] = useState<BankReportItem[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resolvedBankId = resolveBankId(user);
      setBankId(resolvedBankId);

      const [dashboard, affiliateRes, auditRes, reportRes] = await Promise.all([
        getBankDashboard(resolvedBankId),
        getBankAffiliates(resolvedBankId),
        listBankAuditLogs(resolvedBankId, {
          filters: { fromDate: null, toDate: null, actorUserId: null, eventType: null },
          pagination: { page: 1, pageSize: 5 },
        }),
        listBankReports(resolvedBankId, {
          filters: { reportType: null, fromDate: null, toDate: null },
          pagination: { page: 1, pageSize: 5 },
        }),
      ]);

      const normalizedDashboard = extractDashboard(dashboard);
      setMetrics(normalizedDashboard.metrics);
      setGeneratedAt(normalizedDashboard.generatedAt);
      setAffiliates(extractAffiliates(affiliateRes));
      setAuditLogs(extractAuditLogs(auditRes));
      setReports(extractReports(reportRes));
    } catch (e: any) {
      setError(e?.message || 'Failed to load bank dashboard');
      setMetrics(null);
      setAffiliates([]);
      setAuditLogs([]);
      setReports([]);
      setGeneratedAt(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { bankId, metrics, affiliates, auditLogs, reports, generatedAt, isLoading, error, refresh };
}

export function useBankAffiliates() {
  const { user } = useAuth();
  const [bankId, setBankId] = useState<string | null>(null);
  const [affiliates, setAffiliates] = useState<BankAffiliateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resolvedBankId = resolveBankId(user);
      setBankId(resolvedBankId);
      const response = await getBankAffiliates(resolvedBankId);
      setAffiliates(extractAffiliates(response));
    } catch (e: any) {
      setError(e?.message || 'Failed to load bank affiliates');
      setAffiliates([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { bankId, affiliates, isLoading, error, refresh };
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
        const response = await listBankCards(resolvedBankId, {
          filters: {
            affiliateId,
            status: filters?.status || null,
            fromDate: filters?.fromDate || null,
            toDate: filters?.toDate || null,
          },
          pagination: { page: 1, pageSize: 20 },
        });
        const normalized = extractCards(response);
        setCards(normalized.cards);
        setTotal(normalized.total);
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
      return suspendAffiliate(affiliateId, {
        requestContext: {
          requestId: `REQ-SUS-${Date.now()}`,
          actorUserId: user?.id || 'USR-BNK-UNKNOWN',
          userType: user?.role || 'BANK_USER',
          bankId: resolvedBankId,
        },
        reason,
      });
    },
    [affiliateId, bankId, user]
  );

  const block = useCallback(
    async (reason: string): Promise<BlockAffiliateResponse> => {
      if (!affiliateId) throw new Error('Missing affiliateId');
      return blockAffiliate(affiliateId, {
        requestContext: {
          requestId: `REQ-BLK-${Date.now()}`,
          actorUserId: user?.id || 'USR-BNK-UNKNOWN',
          userType: user?.stakeholderType || 'BANK',
          role: user?.role || 'BANK_USER',
        },
        reason,
      });
    },
    [affiliateId, user]
  );

  return { bankId, cards, total, isLoading, error, fetchCards, suspend, block };
}

export function usePartnershipRequest(partnershipRequestId: string | undefined) {
  const { user } = useAuth();
  const [request, setRequest] = useState<GetPartnershipRequestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!partnershipRequestId) return;
    setIsLoading(true);
    setError(null);
    try {
      const bankId = resolveBankId(user);
      setRequest(await getPartnershipRequest(bankId, partnershipRequestId));
    } catch (e: any) {
      setError(e?.message || 'Failed to load partnership request');
      setRequest(null);
    } finally {
      setIsLoading(false);
    }
  }, [partnershipRequestId, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { request, isLoading, error, refresh };
}

export function usePendingPartnershipRequests() {
  const { user } = useAuth();
  const [bankId, setBankId] = useState<string | null>(null);
  const [requests, setRequests] = useState<GetPartnershipRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resolvedBankId = resolveBankId(user);
      setBankId(resolvedBankId);
      const requestIds = resolvePendingPartnershipRequestIds();

      if (!requestIds.length) {
        setRequests([]);
        return;
      }

      const responses = await Promise.all(
        requestIds.map((requestId) => getPartnershipRequest(resolvedBankId, requestId))
      );
      setRequests(responses.filter((request) => request.status === 'PENDING_BANK_APPROVAL'));
    } catch (e: any) {
      setError(e?.message || 'Failed to load pending partnership requests');
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const approve = useCallback(
    async (requestId: string): Promise<ApprovePartnershipResponse> => {
      setIsActing(true);
      setError(null);
      try {
        const response = await approvePartnershipRequest(requestId);
        await refresh();
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
    async (requestId: string, rejectionReason: string): Promise<RejectPartnershipResponse> => {
      setIsActing(true);
      setError(null);
      try {
        const response = await rejectPartnershipRequest(requestId, { rejectionReason });
        await refresh();
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

  return { bankId, requests, isLoading, isActing, error, refresh, approve, reject };
}
