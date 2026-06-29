import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useAuth } from '@/hooks/useAuth';
import { useCard, useCards } from '@/hooks/useCards';
import { resolveAffiliateId } from '@/services/affiliateBankApi';
import { createCardLoad, getCardBalance } from '@/services/cardsApi';
import type { CardLoadResponse } from '@/types/cardContracts';
import { ArrowLeft, Check, CheckCircle2, ChevronRight, ChevronsUpDown, CreditCard, Landmark, Loader2, RefreshCw, ShieldCheck, Wallet } from 'lucide-react';

type Step = 1 | 2 | 3;

const proofTypeOptions = [
  {
    value: 'BANK_TRANFER_CONFIRMED',
    label: 'Bank transfer confirmed',
    description: 'Customer transferred to the linked virtual account.',
  },
  // {
  //   value: 'VIRTUAL_ACCOUNT_CREDIT',
  //   label: 'Virtual account credit',
  //   description: 'Direct credit into the issuing bank virtual account.',
  // },
];
const quickAmountsByCurrency: Record<'NGN' | 'USD' | 'CNY', number[]> = {
  NGN: [5000, 10000, 25000, 50000, 100000],
  USD: [10, 25, 50, 100, 250],
  CNY: [50, 100, 250, 500, 1000],
};

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

function ReviewField({ label, value, mono = false, strong = false }: { label: string; value: React.ReactNode; mono?: boolean; strong?: boolean }) {
  return (
    <div className="py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm ${mono ? 'font-mono break-all' : ''} ${strong ? 'text-lg font-semibold' : ''}`}>
        {value || 'Unavailable'}
      </p>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const items: Array<{ key: Step; label: string }> = [
    { key: 1, label: 'Form' },
    { key: 2, label: 'Review' },
    { key: 3, label: 'Result' },
  ];

  return (
    <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
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
                {complete ? <Check className="h-3 w-3" /> : item.key}
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
      return '';
    }
  }, [user]);

  const cardQueryOptions = useMemo(() => ({ status: ['ACTIVE'] }), []);
  const { cards, isLoading: cardsLoading, error: cardsError, refetch: refetchCards } = useCards(cardQueryOptions);

  const [step, setStep] = useState<Step>(1);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardPickerOpen, setCardPickerOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'NGN' | 'USD' | 'CNY'>('NGN');
  const [bankTransferReference, setBankTransferReference] = useState('');
  const [proofType, setProofType] = useState('BANK_TRANFER_CONFIRMED');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<{ response: CardLoadResponse; previousBalance: number | null } | null>(null);

  const { card: selectedCard, fundingDetails, isLoading: cardLoading, refetch: refetchSelectedCard } = useCard(selectedCardId || undefined);

  const filteredCards = useMemo(
    () => cards.filter((card) => card.status === 'ACTIVE'),
    [cards]
  );
  const selectedCardOption = useMemo(
    () => filteredCards.find((card) => card.id === selectedCardId),
    [filteredCards, selectedCardId]
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
          bankId: fundingDetails.bankId || fundingDetails.virtualAccount.bankId || user?.bankId || 'bank_unknown',
          role: user?.role || 'AFFILIATE_OPERATOR',
          userType: 'AFFILIATE',
          tenantId: user?.tenantId || 'tenant_unknown',
          affiliateId,
          idempotencyKey: randomId('idem-load'),
        },
        amount: {
          value: Number(amount),
          currency,
        },
        fundingReference: {
          virtualAccountNumber: fundingDetails.virtualAccount.accountNumber,
          bankId: fundingDetails.bankId || fundingDetails.virtualAccount.bankId || user?.bankId || 'bank_unknown',
          bankTransferReference: bankTransferReference.trim(),
          proofType: 'BANK_TRANFER_CONFIRMED',
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
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">Load Card</h1>
                <p className="page-sub">Load both virtual and physical cards through the linked funding account.</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-ghost btn-sm" onClick={handleRefresh} disabled={refreshing}>
                  <RefreshCw className={refreshing ? 'spin' : ''} style={{ width: 14, height: 14 }} /> Refresh
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/loads')}>
                  <ArrowLeft style={{ width: 14, height: 14 }} /> Back
                </button>
              </div>
            </header>

          <div className="mx-auto w-full max-w-5xl">
            <Stepper step={step} />

            {step === 1 && (
              <div className="space-y-6">
                <div className="bch-card card-pad-lg">
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
                        <Popover open={cardPickerOpen} onOpenChange={setCardPickerOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              aria-expanded={cardPickerOpen}
                              className="h-11 w-full justify-between rounded-xl px-3 font-normal"
                            >
                              <span className="min-w-0 truncate text-left">
                                {selectedCardOption
                                  ? `${selectedCardOption.id} - ${selectedCardOption.productName}`
                                  : 'Select a card'}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            className="w-[var(--radix-popover-trigger-width)] p-0"
                          >
                            <Command>
                              <CommandInput placeholder="Search by card ID, PAN, product, or bank..." />
                              <CommandList>
                                <CommandEmpty>No matching active card found.</CommandEmpty>
                                <CommandGroup heading={`${filteredCards.length} active cards`}>
                                  {filteredCards.map((card) => (
                                    <CommandItem
                                      key={card.id}
                                      value={[
                                        card.id,
                                        card.maskedPan,
                                        card.productName,
                                        card.productCode,
                                        card.issuingBankName,
                                      ].filter(Boolean).join(' ')}
                                      onSelect={() => {
                                        setSelectedCardId(card.id);
                                        setCardPickerOpen(false);
                                      }}
                                      className={`cursor-pointer p-0 transition-colors ${
                                        selectedCardId === card.id
                                          ? 'bg-primary text-white hover:bg-primary hover:text-white data-[selected=true]:bg-primary data-[selected=true]:text-white'
                                          : 'hover:bg-green-500 hover:text-white data-[selected=true]:bg-green-500 data-[selected=true]:text-white'
                                      }`}
                                    >
                                      <div className="flex w-full items-center justify-between gap-3 p-3">
                                        <p className="truncate text-xs">
                                          {card.productName || 'Card'} - {card.id}
                                        </p>
                                        <Check
                                          className={`h-4 w-4 shrink-0 ${
                                            selectedCardId === card.id ? 'opacity-100' : 'opacity-0'
                                          }`}
                                        />
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {!filteredCards.length && (
                        <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                          No active cards found.
                        </div>
                      )}

                      {selectedCard && (
                        <div className="rounded-2xl border border-border bg-card p-7 text-center">
                          <div className="mx-auto mb-4 grid h-12 w-20 place-items-center rounded-lg bg-primary">
                            <div className="h-4 w-6 rounded-sm bg-[#E7C16C]" />
                          </div>
                          <div className="font-mono text-2xl font-semibold tracking-wide text-foreground">{selectedCard.id}</div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            {selectedCard.productName} · {fundingDetails?.virtualAccount.bankName || selectedCard.issuingBankName}
                          </div>
                          <button type="button" className="mt-5 text-sm font-semibold text-primary" onClick={() => setCardPickerOpen(true)}>
                            Change card →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bch-card card-pad-lg">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold">Load details</h2>
                      <p className="text-sm text-muted-foreground">Enter the amount and funding proof for this load request.</p>
                    </div>
                    <span className="text-xs text-muted-foreground">In {currency}</span>
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
                          <p className="font-mono">{selectedCard.id}</p>
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
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-2xl font-semibold text-foreground">Amount</div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">In</span>
                          <Select value={currency} onValueChange={(v) => setCurrency(v as 'NGN' | 'USD' | 'CNY')}>
                            <SelectTrigger className="h-9 w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NGN">Naira (NGN)</SelectItem>
                              <SelectItem value="USD">US Dollar (USD)</SelectItem>
                              <SelectItem value="CNY">Yuan (CNY)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <TextField
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        {quickAmountsByCurrency[currency].map((value) => (
                          <button
                            key={value}
                            type="button"
                            className="rounded-full border border-border px-4 py-2 font-mono text-sm font-semibold hover:bg-muted"
                            onClick={() => setAmount(String(value))}
                          >
                            {formatMoney(value, currency)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <label className="block text-2xl font-semibold text-foreground">Funding reference</label>
                        <span className="text-sm text-muted-foreground">Virtual account must already be funded</span>
                      </div>

                      <div className="space-y-3">
                        {proofTypeOptions.map((option) => {
                          const checked = proofType === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setProofType(option.value)}
                              className={`w-full rounded-2xl border p-3 text-left transition ${
                                checked
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border bg-card hover:border-primary/50 hover:bg-muted/40'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <span className={`mt-1 h-3 md:h-4 w-3 md:w-4 rounded-full border ${checked ? 'border-primary bg-primary' : 'border-border'}`} />
                                <div>
                                  <p className="text-base md:text-lg font-semibold text-foreground">{option.label}</p>
                                  <p className="mt-1 text-xs md:text-sm text-muted-foreground">{option.description}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <TextField
                        label="Linked virtual account number"
                        readOnly
                        value={fundingDetails?.virtualAccount.accountNumber || ''}
                        placeholder="Available after card selection"
                      />

                      <TextField
                        label={<><span>Bank transfer reference</span> <span className="text-destructive">*</span></>}
                        placeholder="TRF-2026-009811"
                        value={bankTransferReference}
                        onChange={(e) => setBankTransferReference(e.target.value)}
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
                <div className="bch-card card-pad-lg">
                  <div className="flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading review details...
                  </div>
                </div>
              ) : !selectedCard ? (
                <div className="bch-card card-pad-lg">
                  <div className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                    Unable to load the selected card details. Please go back and select the card again.
                  </div>
                  <div className="mt-6">
                    <Button variant="outline" onClick={() => setStep(1)}>Back to form</Button>
                  </div>
                </div>
              ) : (
              <div className="panel-card border-border/40 shadow-none p-6">
                <div className="mb-6">
                  <h2 className="page-title">Review & submit</h2>
                  <p className="page-sub mt-2">
                    Confirm the card and funding details before this load request is submitted for approval.
                  </p>
                </div>

                <div className="mb-8 flex gap-3 rounded-xl bg-primary/5 p-4 text-sm text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Approval required from a checker</p>
                    <p className="mt-1">
                      On submit, this load enters the approval queue and is completed after checker approval and funding validation.
                    </p>
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                  <div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold">Review details</h3>
                      <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Edit</Button>
                    </div>

                    <div className="grid gap-x-10 divide-y divide-border/40 sm:grid-cols-2 sm:divide-y-0">
                      <ReviewField label="Customer" value={selectedCard.customerId} mono />
                      <ReviewField label="Card" value={selectedCard.maskedPan || selectedCard.id} mono />
                      <ReviewField label="Card type" value={cardKindLabel(selectedCard)} />
                      <ReviewField label="Amount" value={formatMoney(Number(amount), currency)} strong />
                      <ReviewField label="Proof type" value={selectedProof.label} />
                      <ReviewField label="Bank transfer reference" value={bankTransferReference} mono />
                      <ReviewField label="Virtual account" value={fundingDetails?.virtualAccount.accountNumber} mono />
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/30 p-5">
                    <h3 className="text-base font-semibold">Funding summary</h3>
                    <div className="mt-5 space-y-5 text-sm">
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
                          <p className="text-muted-foreground">{currency}</p>
                        </div>
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {fundingDetails?.fundingInstructions.message || 'Funds will be validated against the linked virtual account before posting to the card.'}
                      </p>
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
                    <h2 className="page-title">Funds loaded</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      The load request has been submitted {result.response.status === 'APPROVED' ? 'successfully' : result.response.status === 'PENDING' ? 'is pending for approval' : 'with issues'} for the selected card.
                    </p>
                  </div>
                </div>

                <div className="bch-card card-pad-lg" style={{ textAlign: 'center' }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Amount loaded</p>
                  <p className="mt-3 text-5xl font-semibold text-primary">{formatMoney(Number(amount), currency)}</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Posted to {selectedCard.maskedPan} • {selectedCard.customerId}
                  </p>
                  <p className="mt-1 text-sm">
                    New balance: <span className="font-semibold">{formatMoney(result.response.balanceAfter, currency)}</span>
                  </p>
                </div>

                <div className="bch-card card-pad-lg">
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
                      <span>{result.previousBalance === null ? 'Unavailable' : formatMoney(result.previousBalance, currency)}</span>
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
                      setCurrency('NGN');
                      setBankTransferReference('');
                      setProofType('BANK_TRANFER_CONFIRMED');
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
        </main>
      </AppLayout>
    </ProtectedRoute>
  );
}


