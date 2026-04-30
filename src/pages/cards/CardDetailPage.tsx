import React, { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useCard } from '@/hooks/useCards';
import { useCardTransactions, TransactionFilters } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
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
  Calendar,
  ChevronLeft,
  CreditCard,
  Info,
  KeyRound,
  Landmark,
  Loader2,
  Minus,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Snowflake,
  User,
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

export default function CardDetailPage() {
  const navigate = useNavigate();
  const { cardId } = useParams<{ cardId: string }>();
  const { user } = useAuth();
  const { card, fundingDetails, fulfillmentStatus, isLoading, refetch: refetchCard } = useCard(cardId);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const { transactions, isLoading: txLoading, refetch: refetchTx } = useCardTransactions(cardId, filters);

  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balance, setBalance] = useState<Awaited<ReturnType<typeof getCardBalance>> | null>(null);
  const [actionType, setActionType] = useState<CardActionType>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [fulfillmentLoading, setFulfillmentLoading] = useState(false);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [limitLoading, setLimitLoading] = useState(false);
  const [requestedLimit, setRequestedLimit] = useState('');
  const [limitReason, setLimitReason] = useState('');
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
      userType: user?.stakeholderType || 'AFFILIATE',
      tenantId: user?.tenantId || 'tenant_unknown',
      affiliateId: user?.affiliateId || 'affiliate_unknown',
      idempotencyKey: randomId('idem'),
    }),
    [user?.id, user?.stakeholderType, user?.tenantId]
  );

  const buildLimitRequestContext = useCallback(
    () => ({
      requestId: randomId('card-limit'),
      actorUserId: user?.id || 'user_unknown',
      userType: user?.stakeholderType || 'AFFILIATE',
      tenantId: user?.tenantId || 'tenant_unknown',
      affiliateId: user?.tenantId || 'affiliate_unknown',
    }),
    [user?.id, user?.stakeholderType, user?.tenantId]
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
    setBalanceLoading(true);
    try {
      const response = await getCardBalance(cardId);
      setBalance(response);
      toast.success('Balance refreshed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to fetch balance');
    } finally {
      setBalanceLoading(false);
    }
  }, [cardId]);

  const handleFulfillmentRefresh = useCallback(async () => {
    if (!cardId) return;
    setFulfillmentLoading(true);
    try {
      const response = await refreshCardFulfillment(cardId, {
        requestContext: {
          requestId: randomId('fulfillment-refresh'),
          actorUserId: user?.id || 'user_unknown',
          userType: user?.stakeholderType || 'AFFILIATE',
          tenantId: user?.tenantId || 'tenant_unknown',
        },
      });
      toast.success(`Fulfillment updated to ${response.currentStatus}`);
      await refetchCard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to refresh fulfillment');
    } finally {
      setFulfillmentLoading(false);
    }
  }, [cardId, refetchCard, user?.id, user?.stakeholderType, user?.tenantId]);

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
      <ProtectedRoute requiredStakeholderTypes={['AFFILIATE', 'SERVICE_PROVIDER']}>
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
      <ProtectedRoute requiredStakeholderTypes={['AFFILIATE', 'SERVICE_PROVIDER']}>
        <AppLayout>
          <div className="text-center py-20 text-muted-foreground">Card not found.</div>
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

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE', 'SERVICE_PROVIDER']}>
      <AppLayout>
        <div className="animate-fade-in">
          <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/cards')}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
          </Button>
            
          <PageHeader
            title={card.maskedPan}
            subtitle={`${card.productName} (${card.productCode}) - ${card.issuingBankName}`}
            actions={
              <div className="flex items-center gap-2 flex-wrap">
                <StatusChip status={card.status as StatusType} />
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={handleBalanceFetch} disabled={balanceLoading}>
                  {balanceLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Wallet className="h-4 w-4 mr-1" />}
                  Fetch Balance
                </Button>
                {isAffiliate && (
                  <Button variant="outline" size="sm" onClick={handlePinReset} disabled={pinResetLoading}>
                    {pinResetLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <KeyRound className="h-4 w-4 mr-1" />}
                    Reset PIN
                  </Button>
                )}
                {isAffiliate && (
                  <Button variant="outline" size="sm" onClick={() => setLimitDialogOpen(true)}>
                    Request Limit
                  </Button>
                )}
                {isServiceProvider && (
                  <Button variant="outline" size="sm" onClick={() => setOpsDialogOpen(true)}>
                    <ShieldCheck className="h-4 w-4 mr-1" /> Complete Limit
                  </Button>
                )}
                {isAffiliate && card.status === 'PENDING_ACTIVATION' && (
                  <Button variant="outline" size="sm" onClick={() => { setActionType('activate'); setActionReason('CUSTOMER_CARD_ACTIVATION'); }}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Activate Card
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
                {isAffiliate && card.status !== 'BLOCKED' && (
                  <Button variant="danger" size="sm" onClick={() => { setActionType('terminate'); setActionReason('CUSTOMER_ACCOUNT_CLOSED'); }}>
                    <Ban className="h-4 w-4 mr-1" /> Terminate
                  </Button>
                )}
              </div>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="kardit-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Card Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Product</p>
                    <p className="text-sm">{card.productName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Customer Reference</p>
                    <p className="text-sm">{card.customerId || 'Unavailable'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm">{format(new Date(card.createdAt), 'PPP')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Currency</p>
                    <p className="text-sm">{card.currency}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="kardit-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Funding Details</h3>
              {fundingDetails?.virtualAccount ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Virtual Account</p>
                      <p className="text-sm font-mono">{fundingDetails.virtualAccount.accountNumber}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Account Name</p>
                    <p className="text-sm">{fundingDetails.virtualAccount.accountName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bank</p>
                    <p className="text-sm">{fundingDetails.virtualAccount.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Funding Instructions</p>
                    <p className="text-sm text-muted-foreground">{fundingDetails.fundingInstructions.message}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Funding details are not available for this card yet.</p>
              )}
            </div>

            <div className="kardit-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Fulfillment</h3>
                {card.productCode === 'PHYSICAL' || fulfillmentStatus ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleFulfillmentRefresh} disabled={fulfillmentLoading}>
                      {fulfillmentLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Refresh Status
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleFulfillmentReinitiate} disabled={fulfillmentLoading}>
                      Reinitiate
                    </Button>
                  </div>
                ) : null}
              </div>
              {fulfillmentStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <PackageCheck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Bureau Status</p>
                      <p className="text-sm">{fulfillmentStatus.fulfillment.bureauStatus}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Updated</p>
                    <p className="text-sm">{format(new Date(fulfillmentStatus.fulfillment.lastUpdatedAt), 'PPP p')}</p>
                  </div>
                  {fulfillmentStatus.fulfillment.tracking && (
                    <div>
                      <p className="text-xs text-muted-foreground">Tracking</p>
                      <p className="text-sm">{fulfillmentStatus.fulfillment.tracking.carrier} - {fulfillmentStatus.fulfillment.tracking.trackingNumber}</p>
                      <a
                        href={fulfillmentStatus.fulfillment.tracking.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-secondary hover:underline"
                      >
                        Open tracking link
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No fulfillment tracking is available for this card.</p>
              )}
            </div>

            <div className="kardit-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Balance</h3>
              {balance ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Available Balance</p>
                    <p className="text-lg font-semibold text-primary">
                      {balance.balance.availableBalance.toLocaleString('en-US', { style: 'currency', currency: balance.balance.currency })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ledger Balance</p>
                    <p className="text-sm">
                      {balance.balance.ledgerBalance.toLocaleString('en-US', { style: 'currency', currency: balance.balance.currency })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Source</p>
                    <p className="text-sm">{balance.source}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Retrieved At</p>
                    <p className="text-sm">{format(new Date(balance.retrievedAt), 'PPP p')}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Fetch balance to load the current CMS-backed balances for this card.</p>
              )}
            </div>

            <div className="kardit-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">PIN Management</h3>
              {pinResetResult ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm">{pinResetResult.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery</p>
                    <p className="text-sm">{pinResetResult.smsDelivery.channel} to {pinResetResult.smsDelivery.phoneMasked}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sent At</p>
                    <p className="text-sm">{format(new Date(pinResetResult.smsDelivery.sentAt), 'PPP p')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CMS Reference</p>
                    <p className="text-sm font-mono">{pinResetResult.external.cmsReference}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isAffiliate ? 'Use Reset PIN to trigger SMS delivery for the customer.' : 'PIN reset is only available to affiliate users on this screen.'}
                </p>
              )}
            </div>

            <div className="kardit-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Limit Operations</h3>
              {limitCompletionResult ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Completed Request</p>
                    <p className="text-sm font-mono">{limitCompletionResult.limitRequestId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Applied Limit</p>
                    <p className="text-sm">
                      {limitCompletionResult.appliedLimit.amount.toLocaleString('en-US', {
                        style: 'currency',
                        currency: limitCompletionResult.appliedLimit.currency,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Completed At</p>
                    <p className="text-sm">{format(new Date(limitCompletionResult.completedAt), 'PPP p')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CMS Reference</p>
                    <p className="text-sm font-mono">{limitCompletionResult.external.cmsReference}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isServiceProvider ? 'Use Complete Limit to close a pending limit request from operations.' : 'Limit completion is handled by service provider operations users.'}
                </p>
              )}
            </div>
          </div>

          <div className="kardit-card mt-4 p-6">
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
              <Select
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
              </Select>
              <Select
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
              </Select>
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
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Currency</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Narrative</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
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

        <Dialog open={actionType !== null} onOpenChange={(open) => { if (!open) { setActionType(null); setActionReason(''); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{actionTitle}</DialogTitle>
              <DialogDescription>Provide the API reason code or reason value for this card action.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Reason</label>
                <Textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder={defaultReason} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setActionType(null); setActionReason(''); }}>Cancel</Button>
              <Button onClick={handleCardAction} disabled={actionLoading || !actionReason.trim()}>
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
