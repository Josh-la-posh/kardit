import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, ChevronLeft, CreditCard, Loader2, ShieldAlert, StopCircle } from 'lucide-react';
import { useBankAffiliateCards, useBankAffiliates } from '@/hooks/useBankPortal';
import { queryTransactions } from '@/services/transactionApi';
import type { TransactionListItem, TransactionStatus, TransactionType } from '@/types/transactionContracts';

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function toTransactionStatus(status: string) {
  if (status === 'AUTHORIZED' || status === 'COMPLETED') return 'COMPLETED';
  if (status === 'REFUSED' || status === 'CANCELLED') return 'DECLINED';
  if (status === 'PENDING') return 'PENDING';
  return 'INFO';
}

export default function AffiliateDetailPages() {
  const { affiliateId } = useParams<{ affiliateId: string }>();
  const navigate = useNavigate();
  const { affiliates } = useBankAffiliates();
  const { bankId, cards, total, isLoading, error, fetchCards, suspend, block } = useBankAffiliateCards(affiliateId);

  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | 'ALL'>('ALL');
  const [transactionType, setTransactionType] = useState<TransactionType | 'ALL'>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [working, setWorking] = useState(false);
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [cardsDialogOpen, setCardsDialogOpen] = useState(false);
  const visibleCards = Array.isArray(cards) ? cards : [];

  const affiliate = useMemo(
    () => affiliates.find((item) => item.affiliateId === affiliateId) || null,
    [affiliates, affiliateId]
  );

  const fetchTransactions = useCallback(async () => {
    if (!affiliateId) return;
    setTransactionsLoading(true);
    setTransactionsError(null);
    try {
      const response = await queryTransactions({
        filters: {
          bankId: bankId || undefined,
          affiliateId,
          status: transactionStatus === 'ALL' ? undefined : [transactionStatus],
          transactionType: transactionType === 'ALL' ? undefined : [transactionType],
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        },
        page: 1,
        pageSize: 25,
      });
      setTransactions(response.data);
      setTransactionTotal(response.total);
    } catch (err) {
      setTransactions([]);
      setTransactionTotal(0);
      setTransactionsError(err instanceof Error ? err.message : 'Failed to load affiliate transactions');
    } finally {
      setTransactionsLoading(false);
    }
  }, [affiliateId, bankId, fromDate, toDate, transactionStatus, transactionType]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const applyFilters = async () => {
    await fetchTransactions();
    await fetchCards({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
  };

  const handleSuspend = async () => {
    if (!affiliateId || !actionReason.trim()) {
      toast.error('Enter a suspension reason first');
      return;
    }
    setWorking(true);
    try {
      const response = await suspend(actionReason.trim());
      toast.warning(`Affiliate suspended: ${response.currentStatus}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to suspend affiliate');
    } finally {
      setWorking(false);
    }
  };

  const handleBlock = async () => {
    if (!affiliateId || !actionReason.trim()) {
      toast.error('Enter a blocking reason first');
      return;
    }
    setWorking(true);
    try {
      const response = await block(actionReason.trim());
      toast.error(`Affiliate blocked: ${response.currentStatus}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to block affiliate');
    } finally {
      setWorking(false);
    }
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/bank/affiliates')} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <PageHeader
              title={affiliate?.affiliateName}
              subtitle=''
              showBack={false}
              actions={
                <Button variant="outline" onClick={() => setCardsDialogOpen(true)}>
                  <CreditCard className="h-4 w-4" /> View Cards ({total})
                </Button>
              }
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              <Card className="border-0 shadow-lg p-6">
                <h3 className="mb-4 text-lg font-semibold">Affiliate Summary</h3>
                {affiliate ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Funding Volume</p>
                      <p className="font-semibold">{affiliate.totalFundingVolume.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Cards</p>
                      <p className="font-semibold">{affiliate.totalCards.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Cards</p>
                      <p className="font-semibold">{affiliate.activeCards.toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Affiliate summary unavailable.</p>
                )}
              </Card>

              <Card className="border-0 shadow-lg p-6">
                <h3 className="mb-4 text-lg font-semibold">Transaction Filters</h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <Label htmlFor="transactionStatus">Status</Label>
                    <select
                      id="transactionStatus"
                      value={transactionStatus}
                      onChange={(e) => setTransactionStatus(e.target.value as TransactionStatus | 'ALL')}
                      className="mt-2 flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm"
                    >
                      <option value="ALL">All</option>
                      <option value="AUTHORIZED">Authorized</option>
                      <option value="REFUSED">Refused</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="transactionType">Type</Label>
                    <select
                      id="transactionType"
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value as TransactionType | 'ALL')}
                      className="mt-2 flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm"
                    >
                      <option value="ALL">All</option>
                      <option value="POS">POS</option>
                      <option value="ATM_WITHDRAWAL">ATM Withdrawal</option>
                      <option value="LOAD">Load</option>
                      <option value="UNLOAD">Unload</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="fromDate">From Date</Label>
                    <Input id="fromDate" className="mt-2" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="toDate">To Date</Label>
                    <Input id="toDate" className="mt-2" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full" onClick={applyFilters}>Apply Filters</Button>
                  </div>
                </div>
              </Card>

              <Card className="border-0 shadow-lg">
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Transactions</h2>
                    <p className="text-sm text-muted-foreground">{transactionTotal} result(s)</p>
                  </div>

                  {transactionsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : transactionsError ? (
                    <div className="text-sm text-muted-foreground">{transactionsError}</div>
                  ) : transactions.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      <p>No transactions found for this affiliate.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Transaction ID</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Card ID</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer Ref</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Merchant</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((transaction) => (
                            <tr key={transaction.transactionId} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{transaction.transactionId}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{transaction.cardId}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{transaction.customerId}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{transaction.transactionType}</td>
                              <td className="px-4 py-3 text-right text-sm font-mono text-gray-600">
                                {formatMoney(transaction.amount, transaction.currency)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                <StatusChip status={toTransactionStatus(transaction.status)} label={transaction.status} />
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{transaction.merchantName || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{format(new Date(transaction.transactionDate), 'MMM d, yyyy HH:mm')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-0 shadow-lg p-6">
                <h3 className="mb-4 text-lg font-semibold">Affiliate Actions</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="reason">Action Reason</Label>
                    <textarea
                      id="reason"
                      className="mt-2 min-h-28 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm"
                      placeholder="REGULATORY_REVIEW_PENDING or SERIOUS_COMPLIANCE_VIOLATION"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      disabled={working}
                    />
                  </div>
                  <Button variant="outline" className="w-full text-orange-600" onClick={handleSuspend} disabled={working}>
                    <StopCircle className="mr-1 h-4 w-4" /> Suspend Affiliate
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={handleBlock} disabled={working}>
                    <ShieldAlert className="mr-1 h-4 w-4" /> Block Affiliate
                  </Button>
                </div>
              </Card>

              <Card className="border-0 shadow-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Portfolio Snapshot</p>
                    <p className="font-semibold">{transactionTotal} transaction results</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        <Dialog open={cardsDialogOpen} onOpenChange={setCardsDialogOpen}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Affiliate Cards</DialogTitle>
              <DialogDescription>
                Cards owned by {affiliate?.affiliateId || affiliateId || 'this affiliate'}.
              </DialogDescription>
            </DialogHeader>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="py-8 text-center text-sm text-muted-foreground">{error}</div>
            ) : visibleCards.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No cards found for this affiliate.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Card ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Masked PAN</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer Ref</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Issued At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visibleCards.map((card) => (
                      <tr key={card.cardId}>
                        <td className="px-4 py-3 text-sm font-medium">{card.cardId}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{card.maskedPan}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{card.productType}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{card.status}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{card.customerRefId}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{format(new Date(card.issuedAt), 'MMM d, yyyy HH:mm')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  );
}
