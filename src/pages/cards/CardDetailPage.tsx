import React, { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useCard } from '@/hooks/useCards';
import { useCardTransactions, TransactionFilters } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { resolveAffiliateId } from '@/services/affiliateBankApi';
import type { TransactionStatus as ApiTransactionStatus, TransactionType as ApiTransactionType } from '@/types/transactionContracts';
import {
  activateCard,
  completeCardLimitRequest,
  createCardLimitRequest,
  freezeCard,
  getCardBalance,
  refreshCardFulfillment,
  reinitiateCardFulfillment,
  resetCardPin,
  terminateCard,
  unfreezeCard,
} from '@/services/cardsApi';
import {
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  ChevronLeft,
  KeyRound,
  Loader2,
  Minus,
  OctagonAlert,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Snowflake,
  Wallet,
  CheckCircle2,
} from 'lucide-react';

type CardActionType = 'activate' | 'freeze' | 'unfreeze' | 'terminate' | null;

function randomId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function formatDateTime(value?: string) {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return format(date, 'PPP p');
}

function formatDateOnly(value?: string) {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return format(date, 'PPP');
}

function formatMoney(value: number, currency: string) {
  return value.toLocaleString('en-US', { style: 'currency', currency });
}

function DetailItem({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm ${mono ? 'font-mono break-all' : ''}`}>{value || 'Unavailable'}</p>
    </div>
  );
}

export default function CardDetailPage() {
  const navigate = useNavigate();
  const { cardId } = useParams<{ cardId: string }>();
  const { user } = useAuth();
  const {
    card,
    fundingDetails,
    fulfillmentStatus,
    isLoading,
    isFundingLoading,
    isFulfillmentLoading,
    error,
    refetch: refetchCard
  } = useCard(cardId);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const { transactions, isLoading: txLoading, refetch: refetchTx } = useCardTransactions(cardId, filters);

  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balance, setBalance] = useState<Awaited<ReturnType<typeof getCardBalance>> | null>(null);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<CardActionType>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionConfirmOpen, setActionConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [fulfillmentLoading, setFulfillmentLoading] = useState(false);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [limitLoading, setLimitLoading] = useState(false);
  const [requestedLimit, setRequestedLimit] = useState('');
  const [limitReason, setLimitReason] = useState('');
  const [pinResetConfirmOpen, setPinResetConfirmOpen] = useState(false);
  const [pinResetLoading, setPinResetLoading] = useState(false);
  const [pinResetResult, setPinResetResult] = useState<Awaited<ReturnType<typeof resetCardPin>> | null>(null);
  const [opsDialogOpen, setOpsDialogOpen] = useState(false);
  const [opsLoading, setOpsLoading] = useState(false);
  const [limitRequestId, setLimitRequestId] = useState('');
  const [appliedLimit, setAppliedLimit] = useState('');
  const [opsRemarks, setOpsRemarks] = useState('');
  const [opsCmsReference, setOpsCmsReference] = useState('');
  const [limitCompletionResult, setLimitCompletionResult] = useState<Awaited<ReturnType<typeof completeCardLimitRequest>> | null>(null);

  const isAffiliate = user?.stakeholderType !== 'SERVICE_PROVIDER';
  const isServiceProvider = user?.stakeholderType === 'SERVICE_PROVIDER';

  const buildAffiliateActionContext = useCallback(
    () => ({
      requestId: randomId('card-action'),
      actorUserId: user?.id || 'user_unknown',
      bankId: fundingDetails?.bankId || fundingDetails?.virtualAccount.bankId || user?.bankId || 'bank_unknown',
      role: user?.role || 'AFFILIATE_USER',
      userType: user?.stakeholderType || 'AFFILIATE',
      tenantId: user?.tenantId || 'tenant_unknown',
      affiliateId: resolveAffiliateId(user),
      idempotencyKey: randomId('idem'),
    }),
    [fundingDetails?.bankId, fundingDetails?.virtualAccount.bankId, user]
  );

  const buildLimitRequestContext = useCallback(
    () => ({
      requestId: randomId('card-limit'),
      actorUserId: user?.id || 'user_unknown',
      userType: user?.stakeholderType || 'AFFILIATE',
      tenantId: user?.tenantId || 'tenant_unknown',
      affiliateId: resolveAffiliateId(user),
    }),
    [user]
  );

  const buildOpsContext = useCallback(
    () => ({
      requestId: randomId('ops-limit-complete'),
      actorUserId: user?.id || 'user_unknown',
      userType: user?.stakeholderType || 'SERVICE_PROVIDER',
      role: user?.role || 'OPS_ADMIN',
    }),
    [user?.id, user?.role, user?.stakeholderType]
  );

  const handleRefresh = useCallback(() => {
    refetchCard();
    refetchTx();
  }, [refetchCard, refetchTx]);

  const handleBalanceFetch = useCallback(async () => {
    if (!cardId) return;
    setBalance(null);
    setBalanceDialogOpen(true);
    setBalanceLoading(true);
    try {
      const response = await getCardBalance(cardId);
      setBalance(response);
    } catch (error) {
      setBalanceDialogOpen(false);
      toast.error(error instanceof Error ? error.message : 'Unable to fetch balance');
    } finally {
      setBalanceLoading(false);
    }
  }, [cardId]);

  const handleBalanceDialogChange = useCallback((open: boolean) => {
    if (balanceLoading) return;
    setBalanceDialogOpen(open);
    if (!open) setBalance(null);
  }, [balanceLoading]);

  const handleFulfillmentReinitiate = useCallback(async () => {
    if (!cardId) return;
    setFulfillmentLoading(true);
    try {
      const response = await reinitiateCardFulfillment(cardId, {
        requestContext: {
          requestId: randomId('fulfillment-reinitiate'),
          actorUserId: user?.id || 'user_unknown',
          userType: user?.stakeholderType || 'AFFILIATE',
          tenantId: user?.tenantId || 'tenant_unknown',
          idempotencyKey: randomId('idem-fulfillment'),
        },
        reason: 'FULFILLMENT_FAILED_RETRY',
      });
      toast.success(`Fulfillment reinitiated with bureau status ${response.bureauPushStatus}`);
      await refetchCard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to reinitiate fulfillment');
    } finally {
      setFulfillmentLoading(false);
    }
  }, [cardId, refetchCard, user?.id, user?.stakeholderType, user?.tenantId]);

  const handleCardAction = useCallback(async () => {
    if (!cardId || !actionType || !actionReason.trim()) return;

    setActionLoading(true);
    try {
      if (actionType === 'activate') {
        await activateCard(cardId, {
          requestContext: buildAffiliateActionContext(),
          reason: actionReason.trim(),
        });
        toast.success('Card activated successfully');
      } else if (actionType === 'freeze') {
        await freezeCard(cardId, {
          requestContext: buildAffiliateActionContext(),
          reason: actionReason.trim(),
        });
        toast.success('Card frozen successfully');
      } else if (actionType === 'unfreeze') {
        await unfreezeCard(cardId, {
          requestContext: buildAffiliateActionContext(),
          reason: actionReason.trim(),
        });
        toast.success('Card unfrozen successfully');
      } else if (actionType === 'terminate') {
        await terminateCard(cardId, {
          requestContext: buildAffiliateActionContext(),
          reason: actionReason.trim(),
        });
        toast.success('Card terminated successfully');
      }

      setActionType(null);
      setActionReason('');
      setActionConfirmOpen(false);
      await refetchCard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Card action failed');
    } finally {
      setActionLoading(false);
    }
  }, [actionReason, actionType, buildAffiliateActionContext, cardId, refetchCard]);

  const handleLimitRequest = useCallback(async () => {
    if (!cardId || !requestedLimit || Number(requestedLimit) <= 0 || !limitReason.trim()) return;

    setLimitLoading(true);
    try {
      const response = await createCardLimitRequest(cardId, {
        requestContext: buildLimitRequestContext(),
        requestedLimit: {
          amount: Number(requestedLimit),
          currency: card?.currency || 'NGN',
        },
        reason: limitReason.trim(),
      });
      toast.success(`Limit request logged as ${response.limitRequestId}`);
      setLimitDialogOpen(false);
      setRequestedLimit('');
      setLimitReason('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create limit request');
    } finally {
      setLimitLoading(false);
    }
  }, [buildLimitRequestContext, card?.currency, cardId, limitReason, requestedLimit]);

  const handlePinReset = useCallback(async () => {
    if (!cardId) return;

    setPinResetLoading(true);
    try {
      const response = await resetCardPin(cardId, {
        requestContext: {
          ...buildAffiliateActionContext(),
          requestId: randomId('pin-reset'),
        },
        reason: 'CUSTOMER_FORGOT_PIN',
      });
      setPinResetResult(response);
      setPinResetConfirmOpen(false);
      toast.success(`PIN reset sent via ${response.smsDelivery.channel}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to reset PIN');
    } finally {
      setPinResetLoading(false);
    }
  }, [buildAffiliateActionContext, cardId]);

  const handleCompleteLimitRequest = useCallback(async () => {
    if (!cardId || !limitRequestId.trim() || !appliedLimit || Number(appliedLimit) <= 0 || !opsCmsReference.trim() || !opsRemarks.trim()) {
      return;
    }

    setOpsLoading(true);
    try {
      const response = await completeCardLimitRequest(cardId, limitRequestId.trim(), {
        requestContext: buildOpsContext(),
        outcome: 'COMPLETED',
        appliedLimit: {
          amount: Number(appliedLimit),
          currency: card?.currency || 'NGN',
        },
        external: {
          cmsReference: opsCmsReference.trim(),
        },
        opsRemarks: opsRemarks.trim(),
      });
      setLimitCompletionResult(response);
      setOpsDialogOpen(false);
      setLimitRequestId('');
      setAppliedLimit('');
      setOpsRemarks('');
      setOpsCmsReference('');
      toast.success(`Limit request ${response.limitRequestId} completed`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to complete limit request');
    } finally {
      setOpsLoading(false);
    }
  }, [appliedLimit, buildOpsContext, card?.currency, cardId, limitRequestId, opsCmsReference, opsRemarks]);

  if (isLoading) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['AFFILIATE', 'BANK', 'SERVICE_PROVIDER']}>
        <AppLayout>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (!card) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['AFFILIATE', 'BANK', 'SERVICE_PROVIDER']}>
        <AppLayout>
          <div className="mx-auto max-w-2xl py-12">

            <div className="kardit-card p-6 space-y-4">
              <Alert variant="destructive">
                <OctagonAlert className="h-4 w-4" />
                <AlertTitle>Unable to load card details</AlertTitle>
                <AlertDescription>
                  {error || 'Card not found.'}
                </AlertDescription>
              </Alert>
{/* 
              <p className="text-sm text-muted-foreground">
                If this was a temporary backend issue, you can retry this page immediately.
              </p> */}

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => refetchCard()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button variant="outline" onClick={() => navigate('/cards')}>
                  Return to Cards
                </Button>
              </div>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const amountIcon = (amount: number) =>
    amount > 0 ? (
      <ArrowUpRight className="h-4 w-4 text-success" />
    ) : amount < 0 ? (
      <ArrowDownRight className="h-4 w-4 text-destructive" />
    ) : (
      <Minus className="h-4 w-4 text-muted-foreground" />
    );

  const actionTitle =
    actionType === 'activate'
      ? 'Activate Card'
      : actionType === 'freeze'
        ? 'Freeze Card'
        : actionType === 'unfreeze'
          ? 'Unfreeze Card'
          : 'Terminate Card';

  const defaultReason =
    actionType === 'activate'
      ? 'CUSTOMER_CARD_ACTIVATION'
      : actionType === 'freeze'
        ? 'CUSTOMER_REQUEST'
        : actionType === 'unfreeze'
          ? 'ISSUE_RESOLVED'
          : 'CUSTOMER_ACCOUNT_CLOSED';

  const fundingAccount = fundingDetails?.virtualAccount;
  const fundingCustomer = fundingDetails?.customer;
  const fundingBank = fundingDetails?.bank;
  const tracking = fulfillmentStatus?.fulfillment.tracking;
  const hasTracking =
    Boolean(tracking?.carrier?.trim()) ||
    Boolean(tracking?.trackingNumber?.trim()) ||
    Boolean(tracking?.trackingUrl?.trim());
  const cardTitle = card.maskedPan && card.maskedPan !== 'Unavailable' ? card.maskedPan : card.id;
  const customerName = fundingCustomer?.displayName || card.customerId || 'Customer unavailable';
  const issuerName = fundingBank?.bankName || card.issuingBankName;
  const productType = fulfillmentStatus?.productType || card.productCode;

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE', 'BANK', 'SERVICE_PROVIDER']}>
      <AppLayout>
        <div className="animate-fade-in">
          {/* <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/cards')}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
          </Button> */}
            
          <PageHeader
            title={customerName}
            subtitle={cardTitle}
            actions={
              <div className="flex items-center gap-2 flex-wrap">
                <StatusChip status={card.status as StatusType} />
                {/* <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                </Button> */}
                {isAffiliate && card.status === 'PENDING_ACTIVATION' && (
                  <Button variant="outline" size="sm" onClick={() => { setActionType('activate'); setActionReason('CUSTOMER_CARD_ACTIVATION'); }}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Activate
                  </Button>
                )}
                {isAffiliate && card.status === 'ACTIVE' && (
                  <Button variant="outline" size="sm" onClick={() => { setActionType('freeze'); setActionReason('CUSTOMER_REQUEST'); }}>
                    <Snowflake className="h-4 w-4 mr-1" /> Freeze
                  </Button>
                )}
                {isAffiliate && card.status === 'FROZEN' && (
                  <Button variant="outline" size="sm" onClick={() => { setActionType('unfreeze'); setActionReason('ISSUE_RESOLVED'); }}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Unfreeze
                  </Button>
                )}
                {isAffiliate && card.status !== 'TERMINATED' && (
                  <Button variant="danger" size="sm" onClick={() => { setActionType('terminate'); setActionReason('CUSTOMER_ACCOUNT_CLOSED'); }}>
                    <Ban className="h-4 w-4 mr-1" /> Terminate
                  </Button>
                )}
              </div>
            }
          />

          <div className="panel-card border-border/40 shadow-none p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold tracking-tight">{productType} Card</h2>
                  <StatusChip status={card.status as StatusType} />
                </div>

                <div className="grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
                  <DetailItem label="Issuer" value={issuerName} />
                  <DetailItem label="Currency" value={fundingDetails?.fundingInstructions.currency || card.currency} />
                  <DetailItem label="Customer Reference" value={fundingDetails?.customerId || card.customerId} mono />
                  <DetailItem label="Created" value={formatDateOnly(card.createdAt)} />
                  {/* <DetailItem label="Fulfillment" value={isFulfillmentLoading ? 'Loading...' : fulfillmentStatus?.fulfillment.bureauStatus || 'Unavailable'} /> */}
                </div>
              </div>

              <div className="min-w-full lg:min-w-80 lg:max-w-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Funding Account</p>
                {isFundingLoading ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading funding details...
                  </div>
                ) : fundingAccount ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="text-2xl font-semibold tracking-tight">{fundingAccount.accountNumber}</p>
                      <p className="text-sm text-muted-foreground">{fundingAccount.accountName}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 lg:grid-cols-1">
                      <DetailItem label="Virtual Account Bank" value={fundingAccount.bankName} />
                      <DetailItem label="Status" value={<StatusChip status={fundingAccount.status as StatusType} />} />
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Funding details are not available for this card yet.</p>
                )}
              </div>
            </div>

            {fundingDetails?.fundingInstructions.message && (
              <p className="mt-5 max-w-4xl text-sm text-muted-foreground">
                {fundingDetails.fundingInstructions.message}
              </p>
            )}

            {pinResetResult && (
              <p className="mt-5 text-sm text-muted-foreground">
                PIN reset {pinResetResult.status.toLowerCase()} via {pinResetResult.smsDelivery.channel} to {pinResetResult.smsDelivery.phoneMasked}.
              </p>
            )}

            {limitCompletionResult && (
              <p className="mt-5 text-sm text-muted-foreground">
                Limit request {limitCompletionResult.limitRequestId} completed with {formatMoney(limitCompletionResult.appliedLimit.amount, limitCompletionResult.appliedLimit.currency)} applied.
              </p>
            )}

            {hasTracking && (
              <p className="mt-5 text-sm text-muted-foreground">
                Tracking: {tracking?.carrier || 'Carrier unavailable'} {tracking?.trackingNumber ? `- ${tracking.trackingNumber}` : ''}
                {tracking?.trackingUrl?.trim() && (
                  <>
                    {' '}
                    <a href={tracking.trackingUrl} target="_blank" rel="noreferrer" className="text-secondary hover:underline">
                      Open link
                    </a>
                  </>
                )}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleBalanceFetch} disabled={balanceLoading}>
                {balanceLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Wallet className="h-4 w-4 mr-1" />}
                Fetch Balance
              </Button>
              {(productType === 'PHYSICAL' || fulfillmentStatus) && (
                <>
                  <Button variant="outline" size="sm" onClick={handleFulfillmentReinitiate} disabled={fulfillmentLoading}>
                    <PackageCheck className="h-4 w-4 mr-1" /> Reinitiate
                  </Button>
                </>
              )}
              {isAffiliate && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setPinResetConfirmOpen(true)} disabled={pinResetLoading}>
                    {pinResetLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <KeyRound className="h-4 w-4 mr-1" />}
                    Reset PIN
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setLimitDialogOpen(true)}>
                    Request Limit
                  </Button>
                </>
              )}
              {isServiceProvider && (
                <Button variant="outline" size="sm" onClick={() => setOpsDialogOpen(true)}>
                  <ShieldCheck className="h-4 w-4 mr-1" /> Complete Limit
                </Button>
              )}
            </div>
          </div>

          <div className="panel-card border-border/40 shadow-none mt-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Transactions</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="date"
                className="flex h-10 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value || undefined }))}
              />
              <input
                type="date"
                className="flex h-10 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value || undefined }))}
              />
              {/* <Select
                value={filters.type || 'ALL'}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value as ApiTransactionType | 'ALL' }))}
              >
                <SelectTrigger className="w-full sm:w-40 bg-muted border-border"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="POS">POS</SelectItem>
                  <SelectItem value="ATM_WITHDRAWAL">ATM Withdrawal</SelectItem>
                  <SelectItem value="LOAD">Load</SelectItem>
                  <SelectItem value="UNLOAD">Unload</SelectItem>
                </SelectContent>
              </Select> */}
              {/* <Select
                value={filters.status || 'ALL'}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value as ApiTransactionStatus | 'ALL' }))}
              >
                <SelectTrigger className="w-full sm:w-40 bg-muted border-border"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="AUTHORIZED">Authorized</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="REFUSED">Refused</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select> */}
            </div>

            {txLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No transactions match your filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/40">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Currency</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Narrative</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {transactions.map((tx, index) => (
                      <tr key={tx.id} className={index % 2 === 1 ? 'bg-muted/20' : ''}>
                        <td className="px-4 py-3 text-sm">{format(new Date(tx.postedAt), 'MMM d, yyyy HH:mm')}</td>
                        <td className="px-4 py-3 text-sm"><span className="inline-flex items-center gap-1">{amountIcon(tx.amount)} {tx.type}</span></td>
                        <td className={`px-4 py-3 text-sm text-right font-mono ${tx.amount > 0 ? 'text-success' : tx.amount < 0 ? 'text-destructive' : ''}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-sm">{tx.currency}</td>
                        <td className="px-4 py-3"><StatusChip status={tx.status as StatusType} /></td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{tx.narrative || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <Dialog open={balanceDialogOpen} onOpenChange={handleBalanceDialogChange}>
          <DialogContent
            className="overflow-hidden border-border/60 p-0 sm:max-w-md"
            onEscapeKeyDown={(event) => {
              if (balanceLoading) event.preventDefault();
            }}
            onPointerDownOutside={(event) => {
              if (balanceLoading) event.preventDefault();
            }}
          >
            {balanceLoading ? (
              <div className="flex min-h-80 flex-col items-center justify-center px-8 py-12 text-center">
                <div className="relative mb-7 flex h-24 w-24 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
                  <div className="absolute inset-2 rounded-full border-2 border-primary/15 border-t-primary animate-spin" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <Wallet className="h-6 w-6" />
                  </div>
                </div>
                <DialogHeader className="space-y-2 text-center sm:text-center">
                  <DialogTitle className="text-xl">Fetching card balance</DialogTitle>
                  <DialogDescription>
                    Securely retrieving the latest balance. This should only take a moment.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-7 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Connecting to card services
                </div>
              </div>
            ) : balance ? (
              <>
                <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-6 pb-7 pt-8 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <DialogHeader className="space-y-2 text-center sm:text-center">
                    <DialogTitle className="text-xl">Card balance</DialogTitle>
                    <DialogDescription>Available balance as of the latest retrieval</DialogDescription>
                  </DialogHeader>
                  <p className="mt-5 text-4xl font-bold tracking-tight text-foreground">
                    {formatMoney(balance.balance.availableBalance, balance.balance.currency)}
                  </p>
                  <div className="mt-3 inline-flex items-center rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                    Balance retrieved successfully
                  </div>
                </div>

                <div className="space-y-5 px-6 py-6">
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Ledger balance</span>
                      <span className="text-base font-semibold">
                        {formatMoney(balance.balance.ledgerBalance, balance.balance.currency)}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4 border-t border-border/60 pt-4">
                      <span className="text-sm text-muted-foreground">Retrieved</span>
                      <span className="text-right text-sm font-medium">{formatDateTime(balance.retrievedAt)}</span>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => handleBalanceDialogChange(false)}>
                    Done
                  </Button>
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog
          open={actionType !== null && !actionConfirmOpen}
          onOpenChange={(open) => {
            if (!open) {
              setActionType(null);
              setActionReason('');
              setActionConfirmOpen(false);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{actionTitle}</DialogTitle>
              <DialogDescription>Enter the reason for this card action.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Reason</label>
                <Textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder={defaultReason} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setActionType(null); setActionReason(''); setActionConfirmOpen(false); }}>Cancel</Button>
              <Button onClick={() => setActionConfirmOpen(true)} disabled={!actionReason.trim()}>
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={pinResetConfirmOpen} onOpenChange={(open) => { if (!pinResetLoading) setPinResetConfirmOpen(open); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm PIN Reset</DialogTitle>
              <DialogDescription>
                This will trigger PIN reset delivery for card {card.id}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPinResetConfirmOpen(false)} disabled={pinResetLoading}>
                Cancel
              </Button>
              <Button onClick={handlePinReset} disabled={pinResetLoading}>
                {pinResetLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={actionConfirmOpen}
          onOpenChange={(open) => {
            if (!open && !actionLoading) {
              setActionConfirmOpen(false);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm {actionTitle}</DialogTitle>
              <DialogDescription>
                This will {actionType || 'update'} card {card.id}. Review the reason before continuing.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Reason</p>
              <p className="text-sm">{actionReason}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionConfirmOpen(false)} disabled={actionLoading}>
                Back
              </Button>
              <Button
                variant={actionType === 'terminate' ? 'danger' : 'default'}
                onClick={handleCardAction}
                disabled={actionLoading || !actionReason.trim()}
              >
                {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Card Limit Increase</DialogTitle>
              <DialogDescription>Log a new card limit request against this card.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Requested Limit</label>
                <input
                  type="number"
                  min="1"
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={requestedLimit}
                  onChange={(e) => setRequestedLimit(e.target.value)}
                  placeholder="500000"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Reason</label>
                <Textarea value={limitReason} onChange={(e) => setLimitReason(e.target.value)} placeholder="Customer salary increase and higher transaction needs" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLimitDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleLimitRequest} disabled={limitLoading || !requestedLimit || !limitReason.trim()}>
                {limitLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={opsDialogOpen} onOpenChange={setOpsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Limit Request</DialogTitle>
              <DialogDescription>Mark a card limit request as completed from operations.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Limit Request ID</label>
                <input
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={limitRequestId}
                  onChange={(e) => setLimitRequestId(e.target.value)}
                  placeholder="LIM-2026-00011"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Applied Limit</label>
                <input
                  type="number"
                  min="1"
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={appliedLimit}
                  onChange={(e) => setAppliedLimit(e.target.value)}
                  placeholder="500000"
                />
              </div>
              <div>
                <label className="text-sm font-medium">CMS Reference</label>
                <input
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={opsCmsReference}
                  onChange={(e) => setOpsCmsReference(e.target.value)}
                  placeholder="CMS-LIM-992201"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ops Remarks</label>
                <Textarea value={opsRemarks} onChange={(e) => setOpsRemarks(e.target.value)} placeholder="Limit updated manually in CMS by operations team." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCompleteLimitRequest} disabled={opsLoading || !limitRequestId.trim() || !appliedLimit || !opsCmsReference.trim() || !opsRemarks.trim()}>
                {opsLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Complete Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  );
}
