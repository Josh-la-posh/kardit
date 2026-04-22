import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, ChevronLeft, Loader2, ShieldAlert, StopCircle, Users } from 'lucide-react';
import { useBankAffiliateCards, useBankAffiliates } from '@/hooks/useBankPortal';
import { queryTransactions } from '@/services/transactionApi';
import type { TransactionListItem, TransactionStatus, TransactionType } from '@/types/transactionContracts';

type AffiliateAction = 'suspend' | 'block' | null;

function formatMoney(amount: number, currency = 'NGN') {
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
  const location = useLocation();
  const { affiliates } = useBankAffiliates();
  const { bankId, fetchCards, suspend, block } = useBankAffiliateCards(affiliateId);

  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | 'ALL'>('ALL');
  const [transactionType, setTransactionType] = useState<TransactionType | 'ALL'>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [working, setWorking] = useState(false);
  const [actionType, setActionType] = useState<AffiliateAction>(null);
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  const basePath = location.pathname.startsWith('/bank/active-affiliates')
    ? `/bank/active-affiliates/${affiliateId}`
    : `/bank/affiliates/${affiliateId}`;

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

  const openActionDialog = (nextAction: Exclude<AffiliateAction, null>) => {
    setActionType(nextAction);
    setActionReason('');
  };

  const handleAffiliateAction = async () => {
    if (!actionType || !affiliateId || !actionReason.trim()) {
      toast.error('Enter a reason first');
      return;
    }

    setWorking(true);
    try {
      if (actionType === 'suspend') {
        const response = await suspend(actionReason.trim());
        toast.warning(`Affiliate suspended: ${response.currentStatus}`);
      } else {
        const response = await block(actionReason.trim());
        toast.error(`Affiliate blocked: ${response.currentStatus}`);
      }
      setActionType(null);
      setActionReason('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : `Failed to ${actionType} affiliate`);
    } finally {
      setWorking(false);
    }
  };

  const actionTitle = actionType === 'suspend' ? 'Suspend Affiliate' : 'Block Affiliate';
  const actionDescription =
    actionType === 'suspend'
      ? 'Add the reason for suspending this affiliate. This will pause the affiliate until the issue is resolved.'
      : 'Add the reason for blocking this affiliate. This may cascade into card and approval restrictions.';

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
              title={affiliate?.affiliateName || 'Affiliate'}
              subtitle=''
              showBack={false}
              actions={
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => navigate(`${basePath}/customers`)}>
                    <Users className="h-4 w-4" /> View Customers
                  </Button>
                  <Button variant="outline" className="text-orange-600" onClick={() => openActionDialog('suspend')}>
                    <StopCircle className="h-4 w-4" /> Suspend Affiliate
                  </Button>
                  <Button variant="destructive" onClick={() => openActionDialog('block')}>
                    <ShieldAlert className="h-4 w-4" /> Block Affiliate
                  </Button>
                </div>
              }
            />
          </div>

          <Card className="border-0 shadow-lg p-6">
            <h3 className="mb-4 text-lg font-semibold">Affiliate Summary</h3>
            {affiliate ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Funding Volume</p>
                  <p className="font-semibold">{formatMoney(affiliate.totalFundingVolume)}</p>
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
            <div className="grid gap-4 md:grid-cols-5">
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
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-bold">Transactions</h2>
                </div>
                <p className="text-sm text-muted-foreground">{transactionTotal} result(s)</p>
              </div>

              {transactionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : transactionsError ? (
                <div className="text-sm text-muted-foreground">{transactionsError}</div>
              ) : transactions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No transactions found for this affiliate.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Transaction ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Card ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer Ref</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Merchant</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {transactions.map((transaction, index) => (
                        <tr key={transaction.transactionId} className={index % 2 === 1 ? 'bg-muted/20' : ''}>
                          <td className="px-4 py-3 text-sm font-mono text-primary">{transaction.transactionId}</td>
                          <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{transaction.cardId}</td>
                          <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{transaction.customerId}</td>
                          <td className="px-4 py-3 text-sm">{transaction.transactionType}</td>
                          <td className="px-4 py-3 text-right text-sm font-mono">
                            {formatMoney(transaction.amount, transaction.currency)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusChip status={toTransactionStatus(transaction.status)} label={transaction.status} />
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{transaction.merchantName || '-'}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {format(new Date(transaction.transactionDate), 'MMM d, yyyy HH:mm')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>

        <Dialog open={actionType !== null} onOpenChange={(open) => !open && setActionType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{actionTitle}</DialogTitle>
              <DialogDescription>{actionDescription}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="affiliateActionReason">Reason</Label>
                <textarea
                  id="affiliateActionReason"
                  className="mt-2 min-h-28 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm"
                  placeholder={actionType === 'suspend' ? 'REGULATORY_REVIEW_PENDING' : 'SERIOUS_COMPLIANCE_VIOLATION'}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  disabled={working}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActionType(null)} disabled={working}>
                  Cancel
                </Button>
                <Button
                  variant={actionType === 'block' ? 'destructive' : 'default'}
                  onClick={handleAffiliateAction}
                  disabled={working || !actionReason.trim()}
                >
                  {working && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Proceed
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  );
}