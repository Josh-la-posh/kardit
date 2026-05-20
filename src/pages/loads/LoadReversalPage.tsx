import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useCard, useCards } from '@/hooks/useCards';
import { resolveAffiliateId } from '@/services/affiliateBankApi';
import { createCardUnload, getCardBalance } from '@/services/cardsApi';
import type { CardUnloadResponse } from '@/types/cardContracts';
import { ArrowLeft, CheckCircle2, ChevronRight, CreditCard, Landmark, Loader2, RefreshCw, ShieldCheck, Wallet } from 'lucide-react';

type Step = 1 | 2 | 3;

function randomId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function formatMoney(amount: number, currency = 'NGN') {
  return amount.toLocaleString('en-US', { style: 'currency', currency });
}

function cardKindLabel(card: { productCode?: string; productName?: string; embossName?: string; deliveryMethod?: string }) {
  const productText = `${card.productCode || ''} ${card.productName || ''}`.toUpperCase();
  if (productText.includes('VIRTUAL')) return 'Virtual card';
  if (productText.includes('PHYSICAL')) return 'Physical card';
  if (card.deliveryMethod || card.embossName) return 'Physical card';
  return 'Card';
}

function Stepper({ step }: { step: Step }) {
  const items: Array<{ key: Step; label: string }> = [
    { key: 1, label: 'Form' },
    { key: 2, label: 'Review' },
    { key: 3, label: 'Result' },
  ];

  return (
    <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
      {items.map((item) => {
        const complete = step > item.key;
        const active = step === item.key;

        return (
          <div key={item.key} className="flex items-center gap-3">
            <div className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm ${
              active ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
            }`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                complete || active ? 'bg-primary text-primary-foreground' : 'border border-border bg-background text-foreground'
              }`}>
                {complete ? '✓' : item.key}
              </span>
              <span className="font-medium">{item.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LoadReversalPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const affiliateId = useMemo(() => {
    try {
      return resolveAffiliateId(user);
    } catch {
      return user?.tenantId || 'affiliate_unknown';
    }
  }, [user]);

  const { cards, isLoading: cardsLoading, error: cardsError, refetch: refetchCards } = useCards();

  const [step, setStep] = useState<Step>(1);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumberMasked, setAccountNumberMasked] = useState('');
  const [reason, setReason] = useState('CUSTOMER_CASH_OUT');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<{ response: CardUnloadResponse; previousBalance: number | null } | null>(null);

  const { card: selectedCard, fundingDetails, isLoading: cardLoading, refetch: refetchSelectedCard } = useCard(selectedCardId || undefined);

  const filteredCards = useMemo(
    () => cards.filter((card) => card.status === 'ACTIVE'),
    [cards]
  );

  const canContinueToReview =
    !!selectedCardId &&
    Number(amount) > 0 &&
    !!accountId.trim() &&
    !!bankCode.trim() &&
    !!accountNumberMasked.trim() &&
    !!reason.trim();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchCards();
      if (selectedCardId) {
        await refetchSelectedCard();
      }
      toast.success('Card unload page refreshed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to refresh page');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCardId || !selectedCard || Number(amount) <= 0 || !accountId.trim() || !bankCode.trim() || !accountNumberMasked.trim() || !reason.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const previousBalance = await getCardBalance(selectedCardId)
        .then((response) => response.balance.availableBalance)
        .catch(() => null);

      const response = await createCardUnload(selectedCardId, {
        requestContext: {
          requestId: randomId('unload-request'),
          actorUserId: user?.id || 'user_unknown',
          userType: user?.stakeholderType || 'AFFILIATE',
          tenantId: user?.tenantId || 'tenant_unknown',
          affiliateId,
          idempotencyKey: randomId('idem-unload'),
        },
        amount: {
          value: Number(amount),
          currency: selectedCard.currency || fundingDetails?.fundingInstructions.currency || 'NGN',
        },
        destinationAccount: {
          accountId: accountId.trim(),
          bankCode: bankCode.trim(),
          accountNumberMasked: accountNumberMasked.trim(),
        },
        reason: reason.trim(),
      });

      setResult({ response, previousBalance });
      setStep(3);
      toast.success('Card unload submitted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title="Card Unload"
            subtitle="Move funds from a card to a destination account."
            actions={
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                  <RefreshCw className={`mr-1 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/loads')}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
              </div>
            }
          />

          <div className="mx-auto max-w-5xl">
            <Stepper step={step} />

            {step === 1 && (
              <div className="space-y-6">
                <div className="kardit-card p-6">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">Select card</h2>
                      <p className="text-sm text-muted-foreground">Choose the card to unload before entering the destination details.</p>
                    </div>
                    {selectedCard && (
                      <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {cardKindLabel(selectedCard)}
                      </div>
                    )}
                  </div>

                  {cardsLoading ? (
                    <div className="flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading cards...
                    </div>
                  ) : cardsError ? (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                      {cardsError}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium">Card <span className="text-destructive">*</span></label>
                        <Select value={selectedCardId || ''} onValueChange={(value) => setSelectedCardId(value || null)}>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Select a card" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredCards.map((card) => (
                              <SelectItem key={card.id} value={card.id}>
                                {card.maskedPan} - {card.productName} - {card.customerId}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {!filteredCards.length && (
                        <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                          No active cards found.
                        </div>
                      )}

                      {selectedCard && (
                        <div className="rounded-2xl border border-border bg-muted/30 p-4">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-primary" />
                              <span className="font-mono text-sm">{selectedCard.maskedPan}</span>
                            </div>
                            <span className="rounded-full border border-border px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                              {cardKindLabel(selectedCard)}
                            </span>
                          </div>
                          <div className="grid gap-2 text-sm md:grid-cols-3">
                            <p><span className="text-muted-foreground">Product:</span> {selectedCard.productName}</p>
                            <p><span className="text-muted-foreground">Customer:</span> {selectedCard.customerId}</p>
                            <p><span className="text-muted-foreground">Currency:</span> {selectedCard.currency}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="kardit-card p-6">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">Unload details</h2>
                      <p className="text-sm text-muted-foreground">Enter the amount and destination account for this unload request.</p>
                    </div>
                    <span className="text-xs text-muted-foreground">In {selectedCard?.currency || fundingDetails?.fundingInstructions.currency || 'NGN'}</span>
                  </div>

                  {cardLoading ? (
                    <div className="mb-6 flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading selected card details...
                    </div>
                  ) : selectedCard ? (
                    <div className="mb-6 rounded-2xl border border-border bg-muted/30 p-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="text-sm">
                          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Card</p>
                          <p className="font-mono">{selectedCard.maskedPan}</p>
                        </div>
                        <div className="text-sm">
                          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Funding account</p>
                          <p>{fundingDetails?.virtualAccount.accountNumber || 'Not available yet'}</p>
                        </div>
                        <div className="text-sm">
                          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Issuing bank</p>
                          <p>{fundingDetails?.virtualAccount.bankName || selectedCard.issuingBankName}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6 rounded-2xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                      Select a card to continue with the unload form.
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Amount <span className="text-destructive">*</span></label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="flex h-12 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium">Destination account ID <span className="text-destructive">*</span></label>
                        <input
                          className="flex h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="ACC-REG-00081"
                          value={accountId}
                          onChange={(e) => setAccountId(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium">Bank code <span className="text-destructive">*</span></label>
                        <input
                          className="flex h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="058"
                          value={bankCode}
                          onChange={(e) => setBankCode(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Account number masked <span className="text-destructive">*</span></label>
                      <input
                        type='number'
                        className="flex h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="01******89"
                        value={accountNumberMasked}
                        onChange={(e) => setAccountNumberMasked(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Reason <span className="text-destructive">*</span></label>
                      <Textarea
                        className="min-h-28 rounded-xl bg-background"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="CUSTOMER_CASH_OUT"
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-3">
                    <Button variant="outline" onClick={() => navigate('/loads')}>Cancel</Button>
                    <Button onClick={() => setStep(2)} disabled={!canContinueToReview}>
                      Continue to review <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              cardLoading ? (
                <div className="kardit-card p-6 md:p-8">
                  <div className="flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading review details...
                  </div>
                </div>
              ) : !selectedCard ? (
                <div className="kardit-card p-6 md:p-8">
                  <div className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                    Unable to load the selected card details. Please go back and select the card again.
                  </div>
                  <div className="mt-6">
                    <Button variant="outline" onClick={() => setStep(1)}>Back to form</Button>
                  </div>
                </div>
              ) : (
              <div className="kardit-card p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="text-3xl font-semibold tracking-tight">Review & submit</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Confirm the card and destination details before this unload request is submitted for approval.
                  </p>
                </div>

                <div className="mb-8 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium">Approval required from a checker</p>
                    <p className="mt-1 text-sky-800">
                      On submit, this unload enters the approval queue and is completed after checker approval and destination validation.
                    </p>
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-6">
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-base font-semibold">Card</h3>
                        <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Edit</Button>
                      </div>
                      <div className="rounded-2xl border border-border">
                        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm">
                          <span className="text-muted-foreground">Card</span>
                          <span className="font-mono">{selectedCard.maskedPan}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm">
                          <span className="text-muted-foreground">Customer</span>
                          <span>{selectedCard.customerId}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm">
                          <span className="text-muted-foreground">Product</span>
                          <span>{selectedCard.productName}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                          <span className="text-muted-foreground">Card type</span>
                          <span>{cardKindLabel(selectedCard)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-base font-semibold">Unload</h3>
                        <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Edit</Button>
                      </div>
                      <div className="rounded-2xl border border-border">
                        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
                          <span className="text-sm text-muted-foreground">Amount</span>
                          <span className="text-3xl font-semibold">{formatMoney(Number(amount), selectedCard.currency || 'NGN')}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm">
                          <span className="text-muted-foreground">Destination account ID</span>
                          <span>{accountId}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm">
                          <span className="text-muted-foreground">Bank code</span>
                          <span>{bankCode}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm">
                          <span className="text-muted-foreground">Account number masked</span>
                          <span>{accountNumberMasked}</span>
                        </div>
                        <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                          <span className="text-muted-foreground">Reason</span>
                          <span className="max-w-[60%] text-right">{reason}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border bg-muted/30 p-5">
                      <h3 className="mb-4 text-base font-semibold">Card summary</h3>
                      <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-3">
                          <Landmark className="mt-0.5 h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium">{fundingDetails?.virtualAccount.bankName || selectedCard.issuingBankName}</p>
                            <p className="text-muted-foreground">{fundingDetails?.virtualAccount.accountNumber || 'No funding account available'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Wallet className="mt-0.5 h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium">Card currency</p>
                            <p className="text-muted-foreground">{selectedCard.currency}</p>
                          </div>
                        </div>
                        <div className="rounded-xl border border-border bg-background p-4 text-xs text-muted-foreground">
                          Funds will be moved from the selected card to the destination account after approval.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit for approval
                  </Button>
                </div>
              </div>
              )
            )}

            {step === 3 && result && selectedCard && (
              <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full border border-primary/20 bg-primary/10 p-4">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-semibold tracking-tight">Funds unloaded</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      The unload request has been submitted successfully for the selected card.
                    </p>
                  </div>
                </div>

                <div className="kardit-card p-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Amount unloaded</p>
                  <p className="mt-3 text-5xl font-semibold text-primary">{Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-3xl">{selectedCard.currency || 'NGN'}</span></p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Moved from {selectedCard.maskedPan} • {selectedCard.customerId}
                  </p>
                  <p className="mt-1 text-sm">
                    Balance after: <span className="font-semibold">{formatMoney(result.response.balanceAfter, selectedCard.currency || 'NGN')}</span>
                  </p>
                </div>

                <div className="kardit-card p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                      <span className="text-muted-foreground">Unload transaction ID</span>
                      <span className="font-mono">{result.response.unloadTransactionId}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                      <span className="text-muted-foreground">CMS reference</span>
                      <span className="font-mono">{result.response.external.cmsReference}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                      <span className="text-muted-foreground">Transferred to</span>
                      <span>{result.response.transferredTo.accountNumberMasked}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                      <span className="text-muted-foreground">Destination account ID</span>
                      <span>{accountId}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                      <span className="text-muted-foreground">Previous balance</span>
                      <span>{result.previousBalance === null ? 'Unavailable' : formatMoney(result.previousBalance, selectedCard.currency || 'NGN')}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">Completed at</span>
                      <span>{format(new Date(result.response.completedAt), 'PPP p')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResult(null);
                      setStep(1);
                      setAmount('');
                      setAccountId('');
                      setBankCode('');
                      setAccountNumberMasked('');
                      setReason('CUSTOMER_CASH_OUT');
                    }}
                  >
                    Unload another
                  </Button>
                  <Button onClick={() => navigate(`/cards/${selectedCardId}`)}>View card balance</Button>
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
