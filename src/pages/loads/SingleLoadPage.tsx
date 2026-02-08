import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useCards } from '@/hooks/useCards';
import { useCreateSingleLoad } from '@/hooks/useLoads';
import { store } from '@/stores/mockStore';
import { Loader2, Search, CreditCard, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SingleLoadPage() {
  const navigate = useNavigate();
  const { cards } = useCards();
  const { createLoad, isLoading: submitting } = useCreateSingleLoad();
  const customers = store.getCustomers();
  const custMap = useMemo(() => {
    const m: Record<string, string> = {};
    customers.forEach(c => { m[c.id] = `${c.firstName} ${c.lastName}`; });
    return m;
  }, [customers]);

  const [search, setSearch] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [result, setResult] = useState<{ loadTransaction: any; previousBalance: number; newBalance: number } | null>(null);

  const filteredCards = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return cards.filter(c => c.status === 'ACTIVE');
    return cards.filter(c => c.status === 'ACTIVE' && (c.maskedPan.includes(q) || (custMap[c.customerId] || '').toLowerCase().includes(q)));
  }, [cards, search, custMap]);

  const selectedCard = selectedCardId ? store.getCard(selectedCardId) : null;

  const handleSubmit = async () => {
    if (!selectedCardId || !amount || Number(amount) <= 0) return;
    try {
      const res = await createLoad({ cardId: selectedCardId, amount: Number(amount), currency: selectedCard?.currency || 'USD', reference: reference || undefined });
      setResult(res);
      toast.success('Load submitted successfully');
    } catch { toast.error('Load failed'); }
  };

  if (result) {
    return (
      <ProtectedRoute><AppLayout>
        <div className="animate-fade-in max-w-lg mx-auto">
          <div className="kardit-card p-8 text-center">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Load Successful</h2>
            <p className="text-sm text-muted-foreground mb-6">Transaction ID: {result.loadTransaction.id}</p>
            <div className="space-y-2 text-sm text-left kardit-surface p-4 rounded-lg mb-6">
              <div className="flex justify-between"><span className="text-muted-foreground">Card</span><span>{selectedCard?.maskedPan}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="text-success">+{Number(amount).toLocaleString('en-US', { style: 'currency', currency: selectedCard?.currency || 'USD' })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Previous Balance</span><span>{result.previousBalance.toLocaleString('en-US', { style: 'currency', currency: selectedCard?.currency || 'USD' })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">New Balance</span><span className="font-semibold text-primary">{result.newBalance.toLocaleString('en-US', { style: 'currency', currency: selectedCard?.currency || 'USD' })}</span></div>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/loads')}>Back to Loads</Button>
              <Button onClick={() => navigate(`/cards/${selectedCardId}`)}>View Card</Button>
            </div>
          </div>
        </div>
      </AppLayout></ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in max-w-xl mx-auto">
          <PageHeader title="Single Load" subtitle="Load funds to a card" />

          <div className="kardit-card p-6 space-y-5">
            {/* Card selector */}
            <div>
              <label className="text-sm font-medium mb-1 block">Select Card</label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Search by PAN or customer name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredCards.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCardId(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedCardId === c.id ? 'bg-primary/20 border border-primary/40' : 'hover:bg-muted'}`}
                  >
                    <span className="font-mono">{c.maskedPan}</span>
                    <span className="text-muted-foreground ml-2">— {custMap[c.customerId] || 'Unknown'}</span>
                  </button>
                ))}
                {filteredCards.length === 0 && <p className="text-sm text-muted-foreground p-2">No active cards found.</p>}
              </div>
            </div>

            {/* Card summary */}
            {selectedCard && (
              <div className="kardit-surface p-4 rounded-lg space-y-1 text-sm">
                <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> <span className="font-mono">{selectedCard.maskedPan}</span></div>
                <p className="text-muted-foreground">Customer: {custMap[selectedCard.customerId]}</p>
                <p className="text-muted-foreground">Balance: {selectedCard.currentBalance.toLocaleString('en-US', { style: 'currency', currency: selectedCard.currency })}</p>
              </div>
            )}

            {/* Amount & reference */}
            <div>
              <label className="text-sm font-medium mb-1 block">Amount <span className="text-destructive">*</span></label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Reference (optional)</label>
              <input
                className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g. Payroll load"
                value={reference}
                onChange={e => setReference(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => navigate('/loads')}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!selectedCardId || !amount || Number(amount) <= 0 || submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Submit Load
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
