import React, { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useCard } from '@/hooks/useCards';
import { useCardTransactions, TransactionFilters } from '@/hooks/useTransactions';
import { store } from '@/stores/mockStore';
import { Loader2, CreditCard, DollarSign, Calendar, User, Snowflake, Ban, RefreshCw, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CardDetailPage() {
  const { cardId } = useParams<{ cardId: string }>();
  const { card, isLoading, refetch: refetchCard } = useCard(cardId);

  const [filters, setFilters] = useState<TransactionFilters>({});
  const { transactions, isLoading: txLoading, refetch: refetchTx } = useCardTransactions(cardId, filters);

  // Status action modals
  const [freezeOpen, setFreezeOpen] = useState(false);
  const [unfreezeOpen, setUnfreezeOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const customer = card ? store.getCustomer(card.customerId) : null;

  const handleRefresh = useCallback(() => {
    refetchCard();
    refetchTx();
  }, [refetchCard, refetchTx]);

  const handleFreeze = async () => {
    if (!cardId) return;
    setActionLoading(true);
    await new Promise(r => setTimeout(r, 500));
    store.updateCard(cardId, { status: 'FROZEN' });
    setActionLoading(false);
    setFreezeOpen(false);
    refetchCard();
    toast.success('Card has been frozen');
  };

  const handleUnfreeze = async () => {
    if (!cardId) return;
    setActionLoading(true);
    await new Promise(r => setTimeout(r, 500));
    store.updateCard(cardId, { status: 'ACTIVE' });
    setActionLoading(false);
    setUnfreezeOpen(false);
    refetchCard();
    toast.success('Card has been unfrozen');
  };

  const handleBlock = async () => {
    if (!cardId || !blockReason.trim()) return;
    setActionLoading(true);
    await new Promise(r => setTimeout(r, 500));
    store.updateCard(cardId, { status: 'BLOCKED' });
    setActionLoading(false);
    setBlockOpen(false);
    setBlockReason('');
    refetchCard();
    toast.success('Card has been permanently blocked');
  };

  if (isLoading) {
    return (
      <ProtectedRoute><AppLayout>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AppLayout></ProtectedRoute>
    );
  }

  if (!card) {
    return (
      <ProtectedRoute><AppLayout>
        <div className="text-center py-20 text-muted-foreground">Card not found.</div>
      </AppLayout></ProtectedRoute>
    );
  }

  const amountIcon = (amount: number) => amount > 0
    ? <ArrowUpRight className="h-4 w-4 text-success" />
    : amount < 0
      ? <ArrowDownRight className="h-4 w-4 text-destructive" />
      : <Minus className="h-4 w-4 text-muted-foreground" />;

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title={card.maskedPan}
            subtitle={`${card.productName} • ${card.issuingBankName}`}
            actions={
              <div className="flex items-center gap-2 flex-wrap">
                <StatusChip status={card.status as StatusType} />
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                </Button>
                {card.status === 'ACTIVE' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setFreezeOpen(true)}>
                      <Snowflake className="h-4 w-4 mr-1" /> Freeze
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setBlockOpen(true)}>
                      <Ban className="h-4 w-4 mr-1" /> Block
                    </Button>
                  </>
                )}
                {card.status === 'FROZEN' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setUnfreezeOpen(true)}>
                      <Snowflake className="h-4 w-4 mr-1" /> Unfreeze
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setBlockOpen(true)}>
                      <Ban className="h-4 w-4 mr-1" /> Block
                    </Button>
                  </>
                )}
              </div>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Summary */}
            <div className="kardit-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Card Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div><p className="text-xs text-muted-foreground">Currency</p><p className="text-sm">{card.currency}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Current Balance</p>
                    <p className="text-lg font-semibold text-primary">
                      {card.currentBalance.toLocaleString('en-US', { style: 'currency', currency: card.currency })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div><p className="text-xs text-muted-foreground">Created</p><p className="text-sm">{format(new Date(card.createdAt), 'PPP')}</p></div>
                </div>
                {customer && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <Link to={`/customers/${customer.id}`} className="text-sm text-secondary hover:underline">
                        {customer.firstName} {customer.lastName} ({customer.customerId})
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card Actions placeholder for blocked */}
            {card.status === 'BLOCKED' && (
              <div className="kardit-card p-6 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Card Actions</h3>
                <p className="text-sm text-destructive">This card has been permanently blocked and cannot be used.</p>
              </div>
            )}
          </div>

          {/* Transactions */}
          <div className="kardit-card mt-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Transactions</h3>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="date"
                className="flex h-10 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={filters.dateFrom || ''}
                onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value || undefined }))}
                placeholder="From"
              />
              <input
                type="date"
                className="flex h-10 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={filters.dateTo || ''}
                onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value || undefined }))}
                placeholder="To"
              />
              <Select value={filters.type || 'ALL'} onValueChange={v => setFilters(f => ({ ...f, type: v as any }))}>
                <SelectTrigger className="w-full sm:w-40 bg-muted border-border"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="LOAD">Load</SelectItem>
                  <SelectItem value="PURCHASE">Purchase</SelectItem>
                  <SelectItem value="REFUND">Refund</SelectItem>
                  <SelectItem value="FEE">Fee</SelectItem>
                  <SelectItem value="REVERSAL">Reversal</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.status || 'ALL'} onValueChange={v => setFilters(f => ({ ...f, status: v as any }))}>
                <SelectTrigger className="w-full sm:w-40 bg-muted border-border"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="POSTED">Posted</SelectItem>
                  <SelectItem value="DECLINED">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {txLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
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
                    {transactions.map((tx, i) => (
                      <tr key={tx.id} className={`${i % 2 === 1 ? 'bg-muted/20' : ''}`}>
                        <td className="px-4 py-3 text-sm">{format(new Date(tx.postedAt), 'MMM d, yyyy HH:mm')}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center gap-1">
                            {amountIcon(tx.amount)} {tx.type}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-mono ${tx.amount > 0 ? 'text-success' : tx.amount < 0 ? 'text-destructive' : ''}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-sm">{tx.currency}</td>
                        <td className="px-4 py-3"><StatusChip status={tx.status as StatusType} /></td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{tx.narrative || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Freeze Modal */}
        <Dialog open={freezeOpen} onOpenChange={setFreezeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Freeze card?</DialogTitle>
              <DialogDescription>Freezing will temporarily prevent this card from being used. You can unfreeze it later.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFreezeOpen(false)}>Cancel</Button>
              <Button onClick={handleFreeze} disabled={actionLoading}>
                {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Freeze card
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unfreeze Modal */}
        <Dialog open={unfreezeOpen} onOpenChange={setUnfreezeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unfreeze card?</DialogTitle>
              <DialogDescription>Unfreezing will allow this card to be used again, according to program rules.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUnfreezeOpen(false)}>Cancel</Button>
              <Button onClick={handleUnfreeze} disabled={actionLoading}>
                {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Unfreeze card
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Block Modal */}
        <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
          <DialogContent className="border-destructive/30">
            <DialogHeader>
              <DialogTitle className="text-destructive">Block card permanently?</DialogTitle>
              <DialogDescription>Blocking this card will permanently stop it from being used. This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <label className="text-sm font-medium text-foreground">Reason for blocking <span className="text-destructive">*</span></label>
              <Textarea className="mt-1" placeholder="Enter reason..." value={blockReason} onChange={e => setBlockReason(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setBlockOpen(false); setBlockReason(''); }}>Cancel</Button>
              <Button variant="danger" onClick={handleBlock} disabled={actionLoading || !blockReason.trim()}>
                {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Block card
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  );
}
