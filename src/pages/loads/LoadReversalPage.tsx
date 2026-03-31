import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { useCard, useCards } from '@/hooks/useCards';
import { createCardUnload, getCardBalance } from '@/services/cardsApi';
import type { CardUnloadResponse } from '@/types/cardContracts';
import { ArrowLeft, CheckCircle, ChevronDown, Code, CreditCard, Landmark, Loader2, Search, Wallet } from 'lucide-react';

function randomId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export default function LoadReversalPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cards } = useCards();

  const [search, setSearch] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumberMasked, setAccountNumberMasked] = useState('');
  const [reason, setReason] = useState('CUSTOMER_CASH_OUT');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ response: CardUnloadResponse; previousBalance: number | null } | null>(null);

  const { card: selectedCard, fundingDetails, isLoading: cardLoading } = useCard(selectedCardId || undefined);

  const filteredCards = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cards.filter((card) => {
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
        requestId: randomId('unload-request'),
        actorUserId: user?.id || 'user_unknown',
        userType: user?.stakeholderType || 'AFFILIATE',
        tenantId: user?.tenantId || 'tenant_unknown',
        affiliateId: user?.tenantId || 'affiliate_unknown',
        idempotencyKey: randomId('idem-unload'),
      },
      amount: {
        value: Number(amount) || 0,
        currency: selectedCard?.currency || fundingDetails?.fundingInstructions.currency || 'NGN',
      },
      destinationAccount: {
        accountId: accountId || '',
        bankCode: bankCode || '',
        accountNumberMasked: accountNumberMasked || '',
      },
      reason: reason || '',
    }),
    [
      accountId,
      accountNumberMasked,
      amount,
      bankCode,
      fundingDetails?.fundingInstructions.currency,
      reason,
      selectedCard?.currency,
      user?.id,
      user?.stakeholderType,
      user?.tenantId,
    ]
  );

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
          affiliateId: user?.tenantId || 'affiliate_unknown',
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
      toast.success('Card unload submitted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unload failed');
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
              <h2 className="text-xl font-semibold mb-2">Unload Successful</h2>
              <p className="text-sm text-muted-foreground mb-6">Transaction ID: {result.response.unloadTransactionId}</p>
              <div className="space-y-2 text-sm text-left kardit-surface p-4 rounded-lg mb-6">
                <div className="flex justify-between"><span className="text-muted-foreground">Card</span><span>{selectedCard?.maskedPan}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{selectedCard?.customerId}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="text-destructive">{Number(amount).toLocaleString('en-US', { style: 'currency', currency: selectedCard?.currency || 'NGN' })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Previous Balance</span><span>{result.previousBalance === null ? 'Unavailable' : result.previousBalance.toLocaleString('en-US', { style: 'currency', currency: selectedCard?.currency || 'NGN' })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Balance After</span><span className="font-semibold text-primary">{result.response.balanceAfter.toLocaleString('en-US', { style: 'currency', currency: selectedCard?.currency || 'NGN' })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Transferred To</span><span>{result.response.transferredTo.accountNumberMasked}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Completed At</span><span>{format(new Date(result.response.completedAt), 'PPP p')}</span></div>
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
            title="Card Unload"
            subtitle="Move funds from a card to a destination account"
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
                    placeholder="Search by PAN, customer ID, or product..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredCards.map((card) => (
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
                  {filteredCards.length === 0 && <p className="text-sm text-muted-foreground p-2">No cards found.</p>}
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
                  <p className="text-muted-foreground">Customer ID: {selectedCard.customerId}</p>
                  <p className="text-muted-foreground">Product: {selectedCard.productName}</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Landmark className="h-4 w-4" />
                    <span>Funding Account: {fundingDetails?.virtualAccount.accountNumber || 'Not available yet'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Wallet className="h-4 w-4" />
                    <span>Card Currency: {selectedCard.currency}</span>
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
                  placeholder="50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Destination Account ID <span className="text-destructive">*</span></label>
                  <input
                    className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="ACC-REG-00081"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Bank Code <span className="text-destructive">*</span></label>
                  <input
                    className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="058"
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Account Number Masked <span className="text-destructive">*</span></label>
                <input
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="01******89"
                  value={accountNumberMasked}
                  onChange={(e) => setAccountNumberMasked(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Reason <span className="text-destructive">*</span></label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="CUSTOMER_CASH_OUT" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => navigate('/loads')}>Cancel</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !selectedCardId || Number(amount) <= 0 || !accountId.trim() || !bankCode.trim() || !accountNumberMasked.trim() || !reason.trim()}
                >
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit Unload
                </Button>
              </div>
            </div>

            <div className="xl:col-span-1">
              <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
                <div className="kardit-card p-4 sticky top-24">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Code className="h-4 w-4" /> API Unload Request Preview
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
