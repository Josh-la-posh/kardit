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

      setMetrics(dashboard.metrics);
      setGeneratedAt(dashboard.generatedAt);
      setAffiliates(affiliateRes.affiliates);
      setAuditLogs(auditRes.logs);
      setReports(reportRes.reports);
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
      setAffiliates(response.affiliates);
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
        setCards(response.cards);
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
  const [requests, setRequests] = useState<GetPartnershipRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const bankId = resolveBankId(user);
      const requestIds = resolvePendingPartnershipRequestIds();

      if (!requestIds.length) {
        setRequests([]);
        return;
      }

      const responses = await Promise.all(requestIds.map((requestId) => getPartnershipRequest(bankId, requestId)));
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

  return { requests, isLoading, isActing, error, refresh, approve, reject };
}
