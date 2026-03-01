import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { useCards } from '@/hooks/useCards';
import { useCreateSingleLoad } from '@/hooks/useLoads';
import { store } from '@/stores/mockStore';
import { Loader2, Search, CreditCard, CheckCircle, ArrowLeft, ChevronDown, Code } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const LOAD_TYPES = [
  { code: 'L', label: 'Load (Credit)' },
  { code: 'U', label: 'Unload (Debit)' },
];

export default function SingleLoadPage() {
  const navigate = useNavigate();
  const { cards } = useCards();
  const { createLoad, isLoading: submitting } = useCreateSingleLoad();
  const { user } = useAuth();
  const tenantScope = user?.role === 'Super Admin' ? undefined : user?.tenantId;
  const customers = store.getCustomers(tenantScope);
  const custMap = useMemo(() => {
    const m: Record<string, string> = {};
    customers.forEach(c => { m[c.id] = `${c.firstName} ${c.lastName}`; });
    return m;
  }, [customers]);

  const [search, setSearch] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [loadType, setLoadType] = useState('L');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [result, setResult] = useState<{ loadTransaction: any; previousBalance: number; newBalance: number } | null>(null);

  const filteredCards = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return cards.filter(c => c.status === 'ACTIVE');
    return cards.filter(c => c.status === 'ACTIVE' && (c.maskedPan.includes(q) || (custMap[c.customerId] || '').toLowerCase().includes(q)));
  }, [cards, search, custMap]);

  const selectedCard = selectedCardId ? store.getCard(selectedCardId, tenantScope) : null;

  const cmsPayload = useMemo(() => ({
    load_typ: loadType,
    crt_code_product: selectedCard?.productCode || '',
    crt_load_value: Number(amount) || 0,
    currency: selectedCard?.currency || '',
    reference: reference || undefined,
    card_id: selectedCardId || '',
  }), [loadType, selectedCard, amount, reference, selectedCardId]);

  const handleSubmit = async () => {
    if (!selectedCardId || !amount || Number(amount) <= 0) return;
    try {
      const res = await createLoad({
        cardId: selectedCardId,
        amount: loadType === 'U' ? -Number(amount) : Number(amount),
        currency: selectedCard?.currency || 'USD',
        reference: reference || undefined,
        loadType,
        productCode: selectedCard?.productCode || '',
      });
      setResult(res);
      toast.success('Load submitted successfully');
    } catch { toast.error('Load failed'); }
  };

  if (result) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}><AppLayout>
        <div className="animate-fade-in max-w-lg mx-auto">
          <div className="kardit-card p-8 text-center">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{loadType === 'U' ? 'Unload' : 'Load'} Successful</h2>
            <p className="text-sm text-muted-foreground mb-6">Transaction ID: {result.loadTransaction.id}</p>
            <div className="space-y-2 text-sm text-left kardit-surface p-4 rounded-lg mb-6">
              <div className="flex justify-between"><span className="text-muted-foreground">Card</span><span>{selectedCard?.maskedPan}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Product Code</span><span className="font-mono">{selectedCard?.productCode}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Load Type</span><span>{loadType === 'L' ? 'Load (Credit)' : 'Unload (Debit)'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className={loadType === 'U' ? 'text-destructive' : 'text-success'}>{loadType === 'U' ? '-' : '+'}{Number(amount).toLocaleString('en-US', { style: 'currency', currency: selectedCard?.currency || 'USD' })}</span></div>
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
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title="Single Load"
            subtitle="Load or unload funds on a card"
            actions={<Button variant="outline" size="sm" onClick={() => navigate('/loads')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>}
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 kardit-card p-6 space-y-5">
              {/* Load Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Load Type <span className="text-destructive">*</span></label>
                <Select value={loadType} onValueChange={setLoadType}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOAD_TYPES.map(t => <SelectItem key={t.code} value={t.code}>{t.code} — {t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Card selector */}
              <div>
                <label className="text-sm font-medium mb-1 block">Select Card <span className="text-destructive">*</span></label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Search by PAN or customer name..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredCards.map(c => (
                    <button key={c.id} onClick={() => setSelectedCardId(c.id)} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedCardId === c.id ? 'bg-primary/20 border border-primary/40' : 'hover:bg-muted'}`}>
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
                  <p className="text-muted-foreground">Product Code: <span className="font-mono text-foreground">{selectedCard.productCode}</span></p>
                </div>
              )}

              {/* Amount & reference */}
              <div>
                <label className="text-sm font-medium mb-1 block">Amount (crt_load_value) <span className="text-destructive">*</span></label>
                <input type="number" min="0.01" step="0.01" className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Reference (optional)</label>
                <input className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. Payroll load" value={reference} onChange={e => setReference(e.target.value)} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => navigate('/loads')}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!selectedCardId || !amount || Number(amount) <= 0 || submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Submit {loadType === 'U' ? 'Unload' : 'Load'}
                </Button>
              </div>
            </div>

            {/* CMS Preview */}
            <div className="xl:col-span-1">
              <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
                <div className="kardit-card p-4 sticky top-24">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Code className="h-4 w-4" /> CMS Load Request Preview
                    </h3>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${previewOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre className="mt-3 text-xs bg-muted rounded-md p-3 overflow-auto max-h-96 text-foreground">
                      {JSON.stringify(cmsPayload, null, 2)}
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
