import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Activity, ArrowLeft, Calendar, CreditCard, Globe, Loader2, Mail, OctagonMinus, Phone, Snowflake, User, Users } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { store } from '@/stores/mockStore';
import { queryAffiliates, queryBanks } from '@/services/superAdminApi';
import { getAffiliateTransactionVolume, queryTransactions } from '@/services/transactionApi';
import { useAffiliateCardMetrics } from '@/hooks/useTransactionVolumes';
import type { AffiliateTransactionVolumeResponse, TransactionListItem } from '@/types/transactionContracts';
import type { AffiliateQueryItem, BankQueryItem } from '@/types/superAdminContracts';

const affiliateStatusToChip: Record<string, StatusType> = {
  ACTIVE: 'SUCCESS',
  PENDING: 'PENDING',
  SUSPENDED: 'WARNING',
  INACTIVE: 'INACTIVE',
};

function formatMoney(value: number | undefined, currency = 'NGN') {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function toTransactionStatus(status: string): StatusType {
  if (status === 'AUTHORIZED' || status === 'COMPLETED') return 'COMPLETED';
  if (status === 'REFUSED' || status === 'CANCELLED') return 'DECLINED';
  if (status === 'PENDING') return 'PENDING';
  return 'INFO';
}

interface LocationState {
  bank?: BankQueryItem;
  affiliate?: AffiliateQueryItem;
}

function findBankById(items: BankQueryItem[], bankId: string) {
  return items.find((item) => item.bankId === bankId) || null;
}

function findAffiliateById(items: AffiliateQueryItem[], affiliateId: string) {
  return items.find((item) => item.affiliateId === affiliateId) || null;
}

export default function AffiliateDetailPage() {
  const { bankId, affiliateId } = useParams<{ bankId: string; affiliateId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as LocationState | null;

  const [bankSummary, setBankSummary] = useState<BankQueryItem | null>(
    routeState?.bank?.bankId === bankId ? routeState.bank : null
  );
  const [affiliateSummary, setAffiliateSummary] = useState<AffiliateQueryItem | null>(
    routeState?.affiliate?.affiliateId === affiliateId ? routeState.affiliate : null
  );
  const [summaryLoading, setSummaryLoading] = useState(Boolean(bankId && affiliateId));
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const fallbackBank = bankId ? store.getPlatformBank(bankId) : null;
  const fallbackAffiliate = affiliateId ? store.getPlatformAffiliate(affiliateId) : null;
  const customers = useMemo(() => (affiliateId ? store.getAffiliateCustomers(affiliateId) : []), [affiliateId]);

  const [affiliateVolume, setAffiliateVolume] = useState<AffiliateTransactionVolumeResponse | null>(null);
  const [affiliateTransactions, setAffiliateTransactions] = useState<TransactionListItem[]>([]);
  const [affiliateTxLoading, setAffiliateTxLoading] = useState(true);
  const { metrics: cardMetrics, isLoading: cardMetricsLoading } = useAffiliateCardMetrics(affiliateId);

  const totals = useMemo(() => {
    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter((c) => c.status === 'ACTIVE').length,
      pendingCustomers: customers.filter((c) => c.status === 'PENDING').length,
    };
  }, [customers]);

  const loadSummaries = useCallback(async () => {
    if (!bankId || !affiliateId) {
      setBankSummary(null);
      setAffiliateSummary(null);
      setSummaryError('Bank not found');
      setSummaryLoading(false);
      return;
    }

    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const [bankSearchResponse, affiliateSearchResponse] = await Promise.all([
        queryBanks({
          filters: {
            search: bankId,
          },
          page: 1,
          pageSize: 25,
        }).catch(() => null),
        queryAffiliates({
          filters: {
            bankId,
            search: affiliateId,
          },
          page: 1,
          pageSize: 25,
        }).catch(() => null),
      ]);

      let nextBank = findBankById(bankSearchResponse?.data || [], bankId);
      let nextAffiliate = findAffiliateById(affiliateSearchResponse?.data || [], affiliateId);

      if (!nextBank) {
        const fallbackBankResponse = await queryBanks({
          filters: {},
          page: 1,
          pageSize: 100,
        });
        nextBank = findBankById(fallbackBankResponse.data, bankId);
      }

      if (!nextAffiliate) {
        const fallbackAffiliateResponse = await queryAffiliates({
          filters: {
            bankId,
          },
          page: 1,
          pageSize: 100,
        });
        nextAffiliate = findAffiliateById(fallbackAffiliateResponse.data, affiliateId);
      }

      setBankSummary(nextBank);
      setAffiliateSummary(nextAffiliate);

      if (!nextBank || !nextAffiliate) {
        setSummaryError(!nextBank ? 'Bank not found' : 'Affiliate not found');
      }
    } catch (e) {
      setBankSummary(null);
      setAffiliateSummary(null);
      setSummaryError(e instanceof Error ? e.message : 'Failed to load affiliate details');
    } finally {
      setSummaryLoading(false);
    }
  }, [affiliateId, bankId]);

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  useEffect(() => {
    if (!affiliateId) return;

    let active = true;
    setAffiliateTxLoading(true);

    Promise.all([
      getAffiliateTransactionVolume(affiliateId).catch(() => null),
      queryTransactions({
        filters: {
          bankId,
          affiliateId,
        },
        page: 1,
        pageSize: 10,
      }).catch(() => null),
    ])
      .then(([volumeResponse, transactionsResponse]) => {
        if (!active) return;
        setAffiliateVolume(volumeResponse);
        setAffiliateTransactions(transactionsResponse?.data ?? []);
      })
      .finally(() => {
        if (active) setAffiliateTxLoading(false);
      });

    return () => {
      active = false;
    };
  }, [affiliateId, bankId]);

  const bankName = bankSummary?.bankName || fallbackBank?.name || `Bank ${bankId}`;
  const affiliateName = affiliateSummary?.legalName || fallbackAffiliate?.name || `Affiliate ${affiliateId}`;
  const affiliateStatus = affiliateSummary?.status || fallbackAffiliate?.status || 'INACTIVE';
  const registrationNumber = affiliateSummary?.registrationNumber || fallbackAffiliate?.registrationNumber || '-';
  const affiliateCountry = affiliateSummary?.country || fallbackAffiliate?.country || '-';
  const contactName = fallbackAffiliate?.contactName || '-';
  const contactEmail = fallbackAffiliate?.contactEmail || '-';
  const contactPhone = fallbackAffiliate?.contactPhone;
  const provisionedAt = fallbackAffiliate?.provisionedAt;
  const totalCards = cardMetrics?.metrics.totalCardsIssued ?? fallbackAffiliate?.totalCards ?? 0;

  if (summaryLoading) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
        <AppLayout navVariant="service-provider">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if ((!bankSummary && !fallbackBank) || (!affiliateSummary && !fallbackAffiliate)) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
        <AppLayout navVariant="service-provider">
          <div className="text-center py-20 text-muted-foreground">
            {summaryError || (!(bankSummary || fallbackBank) ? 'Bank not found' : 'Affiliate not found')}
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <PageHeader
            title={affiliateName}
            subtitle={`Transactions and portfolio summary for ${affiliateName}`}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip status={affiliateStatusToChip[affiliateStatus] || 'INACTIVE'} label={affiliateStatus} />
                {/* <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/super-admin/banks/${bankId}/affiliates/${affiliateId}/customers`)}
                >
                  <Users className="h-4 w-4 mr-1" /> View Customers
                </Button> */}
                <Button variant="outline" size="sm" onClick={() => navigate(`/super-admin/banks/${bankId}`)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to {bankName}
                </Button>
              </div>
            }
          />

          <div className="mb-6 text-sm text-muted-foreground">
            <span
              className="hover:text-foreground cursor-pointer transition-colors"
              onClick={() => navigate('/super-admin/banks')}
            >
              Banks
            </span>
            <span className="mx-2">/</span>
            <span
              className="hover:text-foreground cursor-pointer transition-colors"
              onClick={() => navigate(`/super-admin/banks/${bankId}`)}
            >
              {bankName}
            </span>
            <span className="mx-2">/</span>
            <span className="text-foreground">{affiliateName}</span>
          </div>

          <div className="kardit-card p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Registration Number</p>
                <p className="font-medium">{registrationNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Country</p>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{affiliateCountry}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contact Person</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{contactName}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contact Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{contactEmail}</span>
                </div>
              </div>
            </div>
            {(contactPhone || provisionedAt) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4 pt-4 border-t border-border">
                {contactPhone && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contact Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{contactPhone}</span>
                    </div>
                  </div>
                )}
                {provisionedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Provisioned On</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{format(new Date(provisionedAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totals.totalCustomers}</p>
                  <p className="text-xs text-muted-foreground">Total Customers</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totals.activeCustomers}</p>
                  <p className="text-xs text-muted-foreground">Active Customers</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Users className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totals.pendingCustomers}</p>
                  <p className="text-xs text-muted-foreground">Pending Customers</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {cardMetricsLoading ? '...' : totalCards.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Cards Issued</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Activity className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {affiliateTxLoading ? '...' : formatMoney(affiliateVolume?.volumes?.totalFundingVolume)}
                  </p>
                  <p className="text-xs text-muted-foreground">Affiliate Funding</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Users className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {cardMetricsLoading ? '...' : (cardMetrics?.metrics.activeCards?.toLocaleString() ?? '-')}
                  </p>
                  <p className="text-xs text-muted-foreground">Active Cards</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Snowflake className="h-5 w-5 text-cyan-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {cardMetricsLoading ? '...' : (cardMetrics?.metrics.frozenCards?.toLocaleString() ?? '-')}
                  </p>
                  <p className="text-xs text-muted-foreground">Frozen Cards</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <OctagonMinus className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {cardMetricsLoading ? '...' : (cardMetrics?.metrics.terminatedCards?.toLocaleString() ?? '-')}
                  </p>
                  <p className="text-xs text-muted-foreground">Terminated Cards</p>
                </div>
              </div>
            </div>
          </div>

          <div className="kardit-card overflow-hidden mb-4">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Affiliate Transactions</h3>
                <p className="mt-1 text-xs text-muted-foreground">Latest transactions scoped to this affiliate.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/transactions?affiliateId=${encodeURIComponent(affiliateId || '')}`)}
              >
                View All
              </Button>
            </div>
            {affiliateTxLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : affiliateTransactions.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No affiliate transactions found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Transaction ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Card</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {affiliateTransactions.map((transaction, index) => (
                      <tr key={transaction.transactionId} className={index % 2 === 1 ? 'bg-muted/20' : ''}>
                        <td className="px-4 py-3 text-sm font-mono text-primary">{transaction.transactionId}</td>
                        <td className="px-4 py-3 text-sm font-mono">{transaction.customerId}</td>
                        <td className="px-4 py-3 text-sm font-mono">{transaction.cardId}</td>
                        <td className="px-4 py-3 text-sm">{transaction.transactionType}</td>
                        <td className="px-4 py-3 text-right text-sm font-mono">
                          {formatMoney(transaction.amount, transaction.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusChip status={toTransactionStatus(transaction.status)} label={transaction.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {format(new Date(transaction.transactionDate), 'MMM d, yyyy HH:mm')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
