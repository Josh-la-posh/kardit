import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Activity, ArrowLeft, Calendar, CreditCard, Globe, Loader2, Mail, OctagonMinus, Phone, ShieldAlert, Snowflake, User, Users } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { queryAffiliates, queryBanks } from '@/services/superAdminApi';
import { blockAffiliate } from '@/services/bankPortalApi';
import { getAffiliateTransactionVolume, queryTransactions } from '@/services/transactionApi';
import { useAuth } from '@/hooks/useAuth';
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

type AffiliateAction = 'block' | null;

export default function AffiliateDetailPage() {
  const { bankId, affiliateId } = useParams<{ bankId: string; affiliateId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as LocationState | null;
  const { user } = useAuth();

  const [bankSummary, setBankSummary] = useState<BankQueryItem | null>(
    routeState?.bank?.bankId === bankId ? routeState.bank : null
  );
  const [affiliateSummary, setAffiliateSummary] = useState<AffiliateQueryItem | null>(
    routeState?.affiliate?.affiliateId === affiliateId ? routeState.affiliate : null
  );
  const [summaryLoading, setSummaryLoading] = useState(Boolean(bankId && affiliateId));
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [affiliateVolume, setAffiliateVolume] = useState<AffiliateTransactionVolumeResponse | null>(null);
  const [affiliateVolumeError, setAffiliateVolumeError] = useState<string | null>(null);
  const [affiliateTransactions, setAffiliateTransactions] = useState<TransactionListItem[]>([]);
  const [affiliateTransactionsError, setAffiliateTransactionsError] = useState<string | null>(null);
  const [affiliateTxLoading, setAffiliateTxLoading] = useState(Boolean(affiliateId));
  const { metrics: cardMetrics, isLoading: cardMetricsLoading, error: cardMetricsError } = useAffiliateCardMetrics(affiliateId);
  const [actionType, setActionType] = useState<AffiliateAction>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionWorking, setActionWorking] = useState(false);

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
    if (!affiliateId) {
      setAffiliateVolume(null);
      setAffiliateVolumeError('Affiliate not found');
      setAffiliateTransactions([]);
      setAffiliateTransactionsError('Affiliate not found');
      setAffiliateTxLoading(false);
      return;
    }

    let active = true;
    setAffiliateTxLoading(true);
    setAffiliateVolumeError(null);
    setAffiliateTransactionsError(null);

    Promise.all([
      getAffiliateTransactionVolume(affiliateId)
        .then((response) => ({ response, error: null as string | null }))
        .catch((error: unknown) => ({
          response: null,
          error: error instanceof Error ? error.message : 'Failed to load affiliate funding volume',
        })),
      queryTransactions({
        filters: {
          bankId,
          affiliateId,
        },
        pageNumber: 1,
        pageSize: 10,
      })
        .then((response) => ({ response, error: null as string | null }))
        .catch((error: unknown) => ({
          response: null,
          error: error instanceof Error ? error.message : 'Failed to load affiliate transactions',
        })),
    ])
      .then(([volumeResult, transactionsResult]) => {
        if (!active) return;
        setAffiliateVolume(volumeResult.response);
        setAffiliateVolumeError(volumeResult.error);
        setAffiliateTransactions(transactionsResult.response?.data ?? []);
        setAffiliateTransactionsError(transactionsResult.error);
      })
      .finally(() => {
        if (active) setAffiliateTxLoading(false);
      });

    return () => {
      active = false;
    };
  }, [affiliateId, bankId]);

  const bankName = bankSummary?.bankName || `Bank ${bankId}`;
  const affiliateName = affiliateSummary?.legalName || `Affiliate ${affiliateId}`;
  const affiliateStatus = affiliateSummary?.status || 'INACTIVE';
  const registrationNumber = affiliateSummary?.registrationNumber || '-';
  const affiliateCountry = affiliateSummary?.country || '-';
  const contactName = '-';
  const contactEmail = '-';
  const contactPhone = undefined;
  const provisionedAt = undefined;
  const totalCards = cardMetrics?.metrics.totalCardsIssued ?? 0;
  const actionTitle = 'Block Affiliate';
  const actionDescription = 'Add the reason for blocking this affiliate. This may cascade into card and approval restrictions.';

  const openActionDialog = (nextAction: Exclude<AffiliateAction, null>) => {
    setActionType(nextAction);
    setActionReason('');
  };

  const handleAffiliateAction = async () => {
    if (!actionType || !bankId || !affiliateId || !actionReason.trim()) {
      toast.error('Enter a reason first');
      return;
    }

    setActionWorking(true);
    try {
      const requestId = `REQ-BLK-${Date.now()}`;
      const idempotencyKey = `IDEMP-${Date.now()}`;
      const response = await blockAffiliate(bankId, affiliateId, {
        requestContext: {
          requestId,
          actorUserId: user?.id || 'USR-SUPERADMIN-UNKNOWN',
          userType: user?.stakeholderType || user?.role || 'SERVICE_PROVIDER',
          role: user?.role || 'SERVICE_PROVIDE',
          bankId,
          tenantId: user?.tenantId,
          affiliateId,
          idempotencyKey,
        },
        reason: actionReason.trim(),
        // idempotencyKey,
      });

      setAffiliateSummary((current) =>
        current ? { ...current, status: response.currentStatus } : current
      );
      toast.error(`Affiliate blocked: ${response.currentStatus}`);
      setActionType(null);
      setActionReason('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to block affiliate');
    } finally {
      setActionWorking(false);
    }
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <main className='scr-main'>
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">{affiliateName}</h1>
                <p className="page-sub">
                  {`Transactions and portfolio summary for ${affiliateName}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <StatusChip status={affiliateStatusToChip[affiliateStatus] || 'INACTIVE'} label={affiliateStatus} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/super-admin/banks/${bankId}/affiliates/${affiliateId}/customers`)}
                >
                  <Users className="h-4 w-4 mr-1" /> View Customers
                </Button>
                <Button variant="destructive" size="sm" onClick={() => openActionDialog('block')}>
                  <ShieldAlert className="h-4 w-4 mr-1" /> Block
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/super-admin/banks/${bankId}`)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to {bankName}
                </Button>
              </div>
            </header>

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
              {summaryLoading && (
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Loading affiliate details...
                </div>
              )}
              {summaryError && (
                <div className="mb-4 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  {summaryError}
                </div>
              )}
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
                  <div className="p-2 rounded-lg bg-[hsl(var(--success)/0.12)]">
                    <Users className="h-5 w-5 text-[hsl(var(--success))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">-</p>
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
                    <p className="text-2xl font-bold">-</p>
                    <p className="text-xs text-muted-foreground">Active Customers</p>
                  </div>
                </div>
              </div>
              <div className="kardit-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[hsl(var(--warning)/0.12)]">
                    <Users className="h-5 w-5 text-[hsl(var(--warning))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">-</p>
                    <p className="text-xs text-muted-foreground">Pending Customers</p>
                  </div>
                </div>
              </div>
              <div className="kardit-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {cardMetricsLoading ? '...' : totalCards.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Cards Issued</p>
                    {cardMetricsError && <p className="mt-1 text-xs text-destructive">{cardMetricsError}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <div className="kardit-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[hsl(var(--warning)/0.12)]">
                    <Activity className="h-5 w-5 text-[hsl(var(--warning))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {affiliateTxLoading ? '...' : formatMoney(affiliateVolume?.volumes?.totalFundingVolume)}
                    </p>
                    <p className="text-xs text-muted-foreground">Affiliate Funding</p>
                    {affiliateVolumeError && <p className="mt-1 text-xs text-destructive">{affiliateVolumeError}</p>}
                  </div>
                </div>
              </div>
              <div className="kardit-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[hsl(var(--success)/0.12)]">
                    <Users className="h-5 w-5 text-[hsl(var(--success))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {cardMetricsLoading ? '...' : (cardMetrics?.metrics.activeCards?.toLocaleString() ?? '-')}
                    </p>
                    <p className="text-xs text-muted-foreground">Active Cards</p>
                    {cardMetricsError && <p className="mt-1 text-xs text-destructive">{cardMetricsError}</p>}
                  </div>
                </div>
              </div>
              <div className="kardit-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[hsl(var(--info)/0.12)]">
                    <Snowflake className="h-5 w-5 text-[hsl(var(--info))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {cardMetricsLoading ? '...' : (cardMetrics?.metrics.frozenCards?.toLocaleString() ?? '-')}
                    </p>
                    <p className="text-xs text-muted-foreground">Frozen Cards</p>
                    {cardMetricsError && <p className="mt-1 text-xs text-destructive">{cardMetricsError}</p>}
                  </div>
                </div>
              </div>
              <div className="kardit-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[hsl(var(--destructive)/0.12)]">
                    <OctagonMinus className="h-5 w-5 text-[hsl(var(--destructive))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {cardMetricsLoading ? '...' : (cardMetrics?.metrics.terminatedCards?.toLocaleString() ?? '-')}
                    </p>
                    <p className="text-xs text-muted-foreground">Terminated Cards</p>
                    {cardMetricsError && <p className="mt-1 text-xs text-destructive">{cardMetricsError}</p>}
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
              ) : affiliateTransactionsError ? (
                <div className="p-8 text-center text-sm text-muted-foreground">{affiliateTransactionsError}</div>
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
        </main>

        <Dialog open={actionType !== null} onOpenChange={(open) => !open && setActionType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{actionTitle}</DialogTitle>
              <DialogDescription>{actionDescription}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="affiliateActionReason">Reason</Label>
                <textarea
                  id="affiliateActionReason"
                  className="mt-2 min-h-28 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm"
                  placeholder="SERIOUS_COMPLIANCE_VIOLATION"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  disabled={actionWorking}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setActionType(null)}
                  disabled={actionWorking}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleAffiliateAction}
                  disabled={actionWorking || !actionReason.trim()}
                >
                  {actionWorking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Proceed
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  );
}


