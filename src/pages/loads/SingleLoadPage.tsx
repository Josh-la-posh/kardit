import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useCard, useCards } from '@/hooks/useCards';
import { resolveAffiliateId } from '@/services/affiliateBankApi';
import { createCardLoad, getCardBalance } from '@/services/cardsApi';
import type { CardLoadResponse } from '@/types/cardContracts';
import { ArrowLeft, CheckCircle2, ChevronRight, CreditCard, Landmark, Loader2, RefreshCw, ShieldCheck, Wallet } from 'lucide-react';

type Step = 1 | 2 | 3;

const proofTypeOptions = [
  {
    value: 'BANK_TRANSFER_CONFIRMED',
    label: 'Bank transfer confirmed',
    description: 'Customer transferred to the linked virtual account.',
  },
  {
    value: 'INTERNAL_FUND_MOVE',
    label: 'Internal fund move',
    description: 'Funds moved internally before loading the card.',
  },
  {
    value: 'VIRTUAL_ACCOUNT_CREDIT',
    label: 'Virtual account credit',
    description: 'Direct credit into the issuing bank virtual account.',
  },
];

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

export default function SingleLoadPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const affiliateId = useMemo(() => {
    try {
      return resolveAffiliateId(user);
    } catch {
      return user?.tenantId || 'affiliate_unknown';
    }
  }, [user]);

  const cardQueryOptions = useMemo(() => ({ status: ['ACTIVE'] }), []);
  const { cards, isLoading: cardsLoading, error: cardsError, refetch: refetchCards } = useCards(cardQueryOptions);

  const [step, setStep] = useState<Step>(1);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [bankTransferReference, setBankTransferReference] = useState('');
  const [proofType, setProofType] = useState('BANK_TRANSFER_CONFIRMED');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<{ response: CardLoadResponse; previousBalance: number | null } | null>(null);

  const { card: selectedCard, fundingDetails, isLoading: cardLoading, refetch: refetchSelectedCard } = useCard(selectedCardId || undefined);

  const filteredCards = useMemo(
    () => cards.filter((card) => card.status === 'ACTIVE'),
    [cards]
  );

  const selectedProof = useMemo(
    () => proofTypeOptions.find((option) => option.value === proofType) || proofTypeOptions[0],
    [proofType]
  );

  const canContinueToReview =
    !!selectedCardId &&
    !!fundingDetails?.virtualAccount.accountNumber &&
    !!bankTransferReference.trim() &&
    Number(amount) > 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchCards();
      if (selectedCardId) {
        await refetchSelectedCard();
      }
      toast.success('Single load page refreshed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to refresh page');
    } finally {
      setRefreshing(false);
    }
  };

  const submitLoad = async () => {
    if (!selectedCardId || !selectedCard || !fundingDetails?.virtualAccount.accountNumber || !bankTransferReference.trim() || Number(amount) <= 0) {
      return;
    }

    setSubmitting(true);
    try {
      const previousBalance = await getCardBalance(selectedCardId)
        .then((response) => response.balance.availableBalance)
        .catch(() => null);

      const response = await createCardLoad(selectedCardId, {
        requestContext: {
          requestId: randomId('load-request'),
          actorUserId: user?.id || 'user_unknown',
          userType: user?.stakeholderType || 'AFFILIATE',
          tenantId: user?.tenantId || 'tenant_unknown',
          affiliateId,
          idempotencyKey: randomId('idem-load'),
        },
        amount: {
          value: Number(amount),
          currency: selectedCard.currency || fundingDetails.fundingInstructions.currency || 'NGN',
        },
        fundingReference: {
          virtualAccountNumber: fundingDetails.virtualAccount.accountNumber,
          bankId: fundingDetails.bankId,
          bankTransferReference: bankTransferReference.trim(),
          proofType,
        },
      });

      setResult({ response, previousBalance });
      setStep(3);
      toast.success('Card load submitted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Load failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title="Single Load"
            subtitle="Load both virtual and physical cards through the linked funding account."
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
                      <p className="text-sm text-muted-foreground">Choose the card to fund before filling the load details.</p>
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
                      <h2 className="text-lg font-semibold">Load details</h2>
                      <p className="text-sm text-muted-foreground">Enter the amount and funding proof for this load request.</p>
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
                          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Virtual account</p>
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
                      {cardLoading ? 'Loading selected card details...' : 'Select a card to continue with the load form.'}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Amount <span className="text-destructive">*</span></label>
                      <input
                        type="number"
                        className="flex h-12 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <label className="block text-sm font-medium">Funding reference</label>
                        <span className="text-xs text-muted-foreground">Maker submits, checker approves</span>
                      </div>

                      <div className="space-y-3">
                        {proofTypeOptions.map((option) => {
                          const checked = proofType === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setProofType(option.value)}
                              className={`w-full rounded-2xl border p-4 text-left transition ${
                                checked
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border bg-background hover:border-primary/40 hover:bg-muted/40'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <span className={`mt-1 h-4 w-4 rounded-full border ${checked ? 'border-primary bg-primary' : 'border-muted-foreground/40'}`} />
                                <div>
                                  <p className="text-sm font-medium">{option.label}</p>
                                  <p className="text-xs text-muted-foreground">{option.description}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium">Linked virtual account number</label>
                        <input
                          readOnly
                          className="flex h-11 w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm text-muted-foreground focus:outline-none"
                          value={fundingDetails?.virtualAccount.accountNumber || ''}
                          placeholder="Available after card selection"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">Bank transfer reference <span className="text-destructive">*</span></label>
                        <input
                          className="flex h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="TRF-2026-009811"
                          value={bankTransferReference}
                          onChange={(e) => setBankTransferReference(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Reference</label>
                      <input
                        className="flex h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Optional note for audit trail"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
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
                    Confirm the card and funding details before this load request is submitted for approval.
                  </p>
                </div>

                <div className="mb-8 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium">Approval required from a checker</p>
                    <p className="mt-1 text-sky-800">
                      On submit, this load enters the approval queue and is completed after checker approval and funding validation.
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
                        <h3 className="text-base font-semibold">Load</h3>
                        <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Edit</Button>
                      </div>
                      <div className="rounded-2xl border border-border">
                        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
                          <span className="text-sm text-muted-foreground">Amount</span>
                          <span className="text-3xl font-semibold">{formatMoney(Number(amount), selectedCard.currency || 'NGN')}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm">
                          <span className="text-muted-foreground">Proof type</span>
                          <span>{selectedProof.label}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm">
                          <span className="text-muted-foreground">Virtual account</span>
                          <span>{fundingDetails?.virtualAccount.accountNumber}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm">
                          <span className="text-muted-foreground">Bank transfer reference</span>
                          <span>{bankTransferReference}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                          <span className="text-muted-foreground">Reference</span>
                          <span>{reference || 'None'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border bg-muted/30 p-5">
                      <h3 className="mb-4 text-base font-semibold">Funding summary</h3>
                      <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-3">
                          <Landmark className="mt-0.5 h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium">{fundingDetails?.virtualAccount.bankName || selectedCard.issuingBankName}</p>
                            <p className="text-muted-foreground">{fundingDetails?.virtualAccount.accountNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Wallet className="mt-0.5 h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium">Funding currency</p>
                            <p className="text-muted-foreground">{fundingDetails?.fundingInstructions.currency || selectedCard.currency}</p>
                          </div>
                        </div>
                        <div className="rounded-xl border border-border bg-background p-4 text-xs text-muted-foreground">
                          {fundingDetails?.fundingInstructions.message || 'Funds will be validated against the linked virtual account before posting to the card.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={submitLoad} disabled={submitting}>
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
                    <h2 className="text-3xl font-semibold tracking-tight">Funds loaded</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      The load request has been submitted {result.response.status === 'APPROVED' ? 'successfully' : result.response.status === 'PENDING' ? 'is pending for approval' : 'with issues'} for the selected card.
                    </p>
                  </div>
                </div>

                <div className="kardit-card p-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Amount loaded</p>
                  <p className="mt-3 text-5xl font-semibold text-primary">{Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-3xl">{selectedCard.currency || 'NGN'}</span></p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Posted to {selectedCard.maskedPan} • {selectedCard.customerId}
                  </p>
                  <p className="mt-1 text-sm">
                    New balance: <span className="font-semibold">{formatMoney(result.response.balanceAfter, selectedCard.currency || 'NGN')}</span>
                  </p>
                </div>

                <div className="kardit-card p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                      <span className="text-muted-foreground">Funding transaction ID</span>
                      <span className="font-mono">{result.response.fundingTransactionId}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                      <span className="text-muted-foreground">CMS reference</span>
                      <span className="font-mono">{result.response.external.cmsReference}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                      <span className="text-muted-foreground">Virtual account</span>
                      <span>{fundingDetails?.virtualAccount.accountNumber}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                      <span className="text-muted-foreground">Bank transfer ref</span>
                      <span>{bankTransferReference}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                      <span className="text-muted-foreground">Proof type</span>
                      <span>{selectedProof.label}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                      <span className="text-muted-foreground">Previous balance</span>
                      <span>{result.previousBalance === null ? 'Unavailable' : formatMoney(result.previousBalance, selectedCard.currency || 'NGN')}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">Completed at</span>
                      <span>{new Date(result.response.completedAt).toLocaleString()}</span>
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
                      setBankTransferReference('');
                      setReference('');
                      setProofType('BANK_TRANSFER_CONFIRMED');
                    }}
                  >
                    Load another
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
