import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { useCard, useCards } from '@/hooks/useCards';
import { resolveAffiliateId } from '@/services/affiliateBankApi';
import { createCardLoad, getCardBalance } from '@/services/cardsApi';
import type { CardLoadResponse } from '@/types/cardContracts';
import { ArrowLeft, CheckCircle, ChevronDown, Code, CreditCard, Landmark, Loader2, Search, Wallet } from 'lucide-react';

function randomId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
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
  const { cards, isLoading: cardsLoading, error: cardsError } = useCards(cardQueryOptions);

  const [search, setSearch] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [bankTransferReference, setBankTransferReference] = useState('');
  const [proofType, setProofType] = useState('BANK_TRANSFER_CONFIRMED');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ response: CardLoadResponse; previousBalance: number | null } | null>(null);

  const { card: selectedCard, fundingDetails, isLoading: cardLoading } = useCard(selectedCardId || undefined);

  const filteredCards = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cards.filter((card) => {
      if (card.status !== 'ACTIVE') return false;
      if (!query) return true;
      return (
        card.maskedPan.toLowerCase().includes(query) ||
        card.customerId.toLowerCase().includes(query) ||
        card.productName.toLowerCase().includes(query)
      );
    });
  }, [cards, search]);

  const requestPreview = useMemo(
    () => ({
      requestContext: {
        requestId: randomId('load-request'),
        actorUserId: user?.id || 'user_unknown',
        userType: user?.stakeholderType || 'AFFILIATE',
        tenantId: user?.tenantId || 'tenant_unknown',
        affiliateId,
        idempotencyKey: randomId('idem-load'),
      },
      amount: {
        value: Number(amount) || 0,
        currency: selectedCard?.currency || fundingDetails?.fundingInstructions.currency || 'NGN',
      },
      fundingReference: {
        virtualAccountNumber: fundingDetails?.virtualAccount.accountNumber || '',
        bankId: fundingDetails?.bankId || selectedCard?.issuingBankName || '',
        bankTransferReference: bankTransferReference || '',
        proofType,
      },
    }),
    [
      amount,
      bankTransferReference,
      fundingDetails?.bankId,
      fundingDetails?.fundingInstructions.currency,
      fundingDetails?.virtualAccount.accountNumber,
      proofType,
      selectedCard?.currency,
      selectedCard?.issuingBankName,
      user?.id,
      user?.stakeholderType,
      affiliateId,
      user?.tenantId,
    ]
  );

  const handleSubmit = async () => {
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
      toast.success('Card load submitted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Load failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
        <AppLayout>
          <div className="animate-fade-in max-w-lg mx-auto">
            <div className="kardit-card p-8 text-center">
              <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Load Successful</h2>
              <p className="text-sm text-muted-foreground mb-6">Transaction ID: {result.response.fundingTransactionId}</p>
              <div className="space-y-2 text-sm text-left kardit-surface p-4 rounded-lg mb-6">
                <div className="flex justify-between"><span className="text-muted-foreground">Card</span><span>{selectedCard?.maskedPan}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{selectedCard?.customerId}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="text-success">{Number(amount).toLocaleString('en-US', { style: 'currency', currency: selectedCard?.currency || 'NGN' })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Previous Balance</span><span>{result.previousBalance === null ? 'Unavailable' : result.previousBalance.toLocaleString('en-US', { style: 'currency', currency: selectedCard?.currency || 'NGN' })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Balance After</span><span className="font-semibold text-primary">{result.response.balanceAfter.toLocaleString('en-US', { style: 'currency', currency: selectedCard?.currency || 'NGN' })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">CMS Reference</span><span className="font-mono">{result.response.external.cmsReference}</span></div>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate('/loads')}>Back to Loads</Button>
                <Button onClick={() => navigate(`/cards/${selectedCardId}`)}>View Card</Button>
              </div>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title="Single Load"
            subtitle="Fund a card through its linked virtual account"
            actions={<Button variant="outline" size="sm" onClick={() => navigate('/loads')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>}
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 kardit-card p-6 space-y-5">
              <div>
                <label className="text-sm font-medium mb-1 block">Select Card <span className="text-destructive">*</span></label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Search by PAN, or product..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {cardsLoading ? (
                    <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading cards...
                    </div>
                  ) : cardsError ? (
                    <p className="text-sm text-destructive p-2">{cardsError}</p>
                  ) : filteredCards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCardId(card.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCardId === card.id ? 'bg-primary/20 border border-primary/40' : 'hover:bg-muted'
                      }`}
                    >
                      <span className="font-mono">{card.maskedPan}</span>
                      <span className="text-muted-foreground ml-2">- {card.customerId}</span>
                    </button>
                  ))}
                  {!cardsLoading && !cardsError && filteredCards.length === 0 && <p className="text-sm text-muted-foreground p-2">No active cards found.</p>}
                </div>
              </div>

              {cardLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading selected card details...
                </div>
              ) : selectedCard ? (
                <div className="kardit-surface p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> <span className="font-mono">{selectedCard.maskedPan}</span></div>
                  {/* <p className="text-muted-foreground">Customer ID: {selectedCard.customerId}</p> */}
                  <p className="text-muted-foreground">Product: {selectedCard.productName}</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Landmark className="h-4 w-4" />
                    <span>Virtual Account: {fundingDetails?.virtualAccount.accountNumber || 'Not available yet'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Wallet className="h-4 w-4" />
                    <span>Funding Currency: {fundingDetails?.fundingInstructions.currency || selectedCard.currency}</span>
                  </div>
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium mb-1 block">Amount <span className="text-destructive">*</span></label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="750000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Bank Transfer Reference <span className="text-destructive">*</span></label>
                <input
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="TRF-2026-009811"
                  value={bankTransferReference}
                  onChange={(e) => setBankTransferReference(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Proof Type <span className="text-destructive">*</span></label>
                <input
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={proofType}
                  onChange={(e) => setProofType(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => navigate('/loads')}>Cancel</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    submitting ||
                    !selectedCardId ||
                    !fundingDetails?.virtualAccount.accountNumber ||
                    !bankTransferReference.trim() ||
                    Number(amount) <= 0
                  }
                >
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit Load
                </Button>
              </div>
            </div>

            <div className="xl:col-span-1">
              <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
                <div className="kardit-card p-4 sticky top-24">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Code className="h-4 w-4" /> API Load Request Preview
                    </h3>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${previewOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre className="mt-3 text-xs bg-muted rounded-md p-3 overflow-auto max-h-96 text-foreground">
                      {JSON.stringify(requestPreview, null, 2)}
                    </pre>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
