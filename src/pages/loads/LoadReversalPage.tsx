import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCards } from '@/hooks/useCards';
import { useLoadsByCard, useCreateLoadReversal } from '@/hooks/useLoads';
import { store } from '@/stores/mockStore';
import { Loader2, Search, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function LoadReversalPage() {
  const navigate = useNavigate();
  const { cards } = useCards();
  const { createReversal, isLoading: submitting } = useCreateLoadReversal();
  const customers = store.getCustomers();
  const custMap = useMemo(() => {
    const m: Record<string, string> = {};
    customers.forEach(c => { m[c.id] = `${c.firstName} ${c.lastName}`; });
    return m;
  }, [customers]);

  const [search, setSearch] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>(undefined);
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<any>(null);

  const { loads, isLoading: loadsLoading } = useLoadsByCard(selectedCardId);

  const filteredCards = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return cards.slice(0, 20);
    return cards.filter(c => c.maskedPan.includes(q) || (custMap[c.customerId] || '').toLowerCase().includes(q));
  }, [cards, search, custMap]);

  const selectedCard = selectedCardId ? store.getCard(selectedCardId) : null;
  const selectedLoad = selectedLoadId ? loads.find(l => l.id === selectedLoadId) : null;

  const handleSubmit = async () => {
    if (!selectedCardId || !selectedLoad) return;
    try {
      const res = await createReversal({
        cardId: selectedCardId,
        originalLoadId: selectedLoad.id,
        amount: selectedLoad.amount,
        currency: selectedLoad.currency,
        reason: reason || undefined,
      });
      setResult({ ...res, originalLoad: selectedLoad });
      toast.success('Reversal submitted successfully');
    } catch { toast.error('Reversal failed'); }
  };

  if (result) {
    return (
      <ProtectedRoute><AppLayout>
        <div className="animate-fade-in max-w-lg mx-auto">
          <div className="kardit-card p-8 text-center">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Reversal Successful</h2>
            <p className="text-sm text-muted-foreground mb-6">Transaction ID: {result.loadTransaction.id}</p>
            <div className="grid grid-cols-2 gap-4 text-sm text-left mb-6">
              <div className="kardit-surface p-4 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase mb-2">Original Load</p>
                <p>Amount: +{result.originalLoad.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                <p className="text-muted-foreground">ID: {result.originalLoad.id}</p>
              </div>
              <div className="kardit-surface p-4 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase mb-2">Reversal</p>
                <p className="text-destructive">Amount: -{result.originalLoad.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                <p className="text-muted-foreground">ID: {result.loadTransaction.id}</p>
              </div>
            </div>
            <p className="text-sm mb-4">New Balance: <span className="font-semibold text-primary">{result.newBalance.toLocaleString('en-US', { style: 'currency', currency: selectedCard?.currency || 'USD' })}</span></p>
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
          <PageHeader title="Load Reversal" subtitle="Reverse a previous load transaction" />
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
                  onChange={e => { setSearch(e.target.value); setSelectedCardId(undefined); setSelectedLoadId(null); }}
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredCards.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCardId(c.id); setSelectedLoadId(null); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedCardId === c.id ? 'bg-primary/20 border border-primary/40' : 'hover:bg-muted'}`}
                  >
                    <span className="font-mono">{c.maskedPan}</span>
                    <span className="text-muted-foreground ml-2">— {custMap[c.customerId] || 'Unknown'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Load selector */}
            {selectedCardId && (
              <div>
                <label className="text-sm font-medium mb-1 block">Select Load to Reverse</label>
                {loadsLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : loads.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reversible loads found for this card.</p>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {loads.map(l => (
                      <button
                        key={l.id}
                        onClick={() => setSelectedLoadId(l.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedLoadId === l.id ? 'bg-primary/20 border border-primary/40' : 'hover:bg-muted'}`}
                      >
                        <span className="text-success">+{l.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        <span className="text-muted-foreground ml-2">{l.currency}</span>
                        <span className="text-muted-foreground ml-2">— {format(new Date(l.createdAt), 'MMM d, yyyy')}</span>
                        {l.reference && <span className="text-muted-foreground ml-2">({l.reference})</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reason */}
            {selectedLoad && (
              <div>
                <label className="text-sm font-medium mb-1 block">Reason for reversal (optional)</label>
                <Textarea placeholder="Enter reason..." value={reason} onChange={e => setReason(e.target.value)} />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => navigate('/loads')}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!selectedLoad || submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Submit Reversal
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
