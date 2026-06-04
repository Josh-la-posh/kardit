import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaginatedTable } from '@/components/ui/paginated-table';
import { StatusChip } from '@/components/ui/status-chip';
import { Activity, ArrowLeft, Loader2, ShieldAlert, StopCircle, Users } from 'lucide-react';
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

function toIsoDateBoundary(value: string, endOfDay = false) {
  if (!value) return undefined;
  const time = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
  return new Date(`${value}${time}`).toISOString();
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
          cardId: undefined,
          affiliateId,
          customerId: undefined,
          status: transactionStatus === 'ALL' ? undefined : [transactionStatus],
          transactionType: transactionType === 'ALL' ? undefined : [transactionType],
          fromDate: toIsoDateBoundary(fromDate),
          toDate: toIsoDateBoundary(toDate, true),
          reference: undefined,
          merchantName: undefined,
        },
        pageNumber: 1,
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

  const transactionColumns = useMemo(
    () => [
      {
        key: 'transactionId',
        header: 'Transaction ID',
        className: 'font-mono text-[13px] text-[var(--cs-green-700)]',
        render: (transaction: TransactionListItem) => transaction.transactionId,
      },
      {
        key: 'cardId',
        header: 'Card ID',
        className: 'font-mono text-[13px] text-[var(--cs-ink-200)]',
        render: (transaction: TransactionListItem) => transaction.cardId,
      },
      {
        key: 'customerRef',
        header: 'Customer Ref',
        className: 'font-mono text-[13px] text-[var(--cs-ink-200)]',
        render: (transaction: TransactionListItem) => transaction.customerId,
      },
      {
        key: 'type',
        header: 'Type',
        className: 'text-[13px] text-[var(--cs-ink-400)]',
        render: (transaction: TransactionListItem) => transaction.transactionType,
      },
      {
        key: 'amount',
        header: 'Amount',
        className: 'text-[13px] font-mono text-right text-[var(--cs-ink-400)]',
        render: (transaction: TransactionListItem) => formatMoney(transaction.amount, transaction.currency),
      },
      {
        key: 'status',
        header: 'Status',
        className: 'text-[13px]',
        render: (transaction: TransactionListItem) => (
          <StatusChip status={toTransactionStatus(transaction.status)} label={transaction.status} />
        ),
      },
      {
        key: 'merchant',
        header: 'Merchant',
        className: 'text-[13px] text-[var(--cs-ink-200)]',
        render: (transaction: TransactionListItem) => transaction.merchantName || '-',
      },
      {
        key: 'date',
        header: 'Date',
        className: 'text-[13px] text-[var(--cs-ink-200)]',
        render: (transaction: TransactionListItem) => format(new Date(transaction.transactionDate), 'MMM d, yyyy HH:mm'),
      },
    ],
    []
  );

  const actionTitle = actionType === 'suspend' ? 'Suspend Affiliate' : 'Block Affiliate';
  const actionDescription =
    actionType === 'suspend'
      ? 'Add the reason for suspending this affiliate. This will pause the affiliate until the issue is resolved.'
      : 'Add the reason for blocking this affiliate. This may cascade into card and approval restrictions.';

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <button className="back-link" onClick={() => navigate('/bank/affiliates')}>
                  <ArrowLeft /> Back to affiliates
                </button>
                <h1 className="page-title">{affiliate?.affiliateName || 'Affiliate'}</h1>
                <p className="page-sub">Affiliate portfolio details, controls, and recent transaction activity.</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`${basePath}/customers`)}>
                  <Users className="h-4 w-4" /> View Customers
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => openActionDialog('suspend')}>
                  <StopCircle className="h-4 w-4" /> Suspend
                </button>
                <Button variant="danger" size="sm" onClick={() => openActionDialog('block')}>
                  <ShieldAlert className="h-4 w-4" /> Block
                </Button>
              </div>
            </header>

            <section className="kpis" style={{ marginTop: 14 }}>
              <Kpi label="Funding Volume" value={affiliate ? formatMoney(affiliate.totalFundingVolume) : '-'} sub="Affiliate cumulative funding" />
              <Kpi label="Total Cards" value={affiliate ? affiliate.totalCards.toLocaleString() : '-'} sub="Issued cards" />
              <Kpi label="Active Cards" value={affiliate ? affiliate.activeCards.toLocaleString() : '-'} sub="Currently active cards" />
              <Kpi label="Transactions" value={transactionTotal.toLocaleString()} sub="Matches current filter" />
            </section>

            <section className="bch-card card-pad" style={{ marginTop: 14 }}>
              <div className="section-head" style={{ marginTop: 0 }}>
                <div>
                  <div className="section-title">Transaction Filters</div>
                  <div className="section-sub">Filter affiliate activity by status, type, and date range.</div>
                </div>
              </div>
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
                  <button className="btn btn-primary w-full" onClick={applyFilters}>Apply Filters</button>
                </div>
              </div>
            </section>

            <section className="section-head" style={{ marginTop: 20 }}>
              <div>
                <div className="section-title">Transactions</div>
                <div className="section-sub">Recent transactions scoped to this affiliate.</div>
              </div>
              <div className="section-sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity className="h-4 w-4" /> {transactionTotal} result(s)
              </div>
            </section>

            {transactionsLoading ? (
              <section className="bch-card" style={{ display: 'grid', placeItems: 'center', padding: 48 }}>
                <Loader2 className="spin" style={{ width: 24, height: 24 }} />
              </section>
            ) : transactionsError ? (
              <section className="bch-card" style={{ padding: 24 }}>
                <div className="empty-list-sub">{transactionsError}</div>
              </section>
            ) : (
              <PaginatedTable<TransactionListItem>
                columns={transactionColumns}
                rows={transactions}
                emptyMessage="No transactions found for this affiliate."
                rowKey={(tx) => tx.transactionId}
                page={1}
                pageSize={Math.max(transactions.length, 1)}
                total={transactions.length}
                onPageChange={() => {}}
              />
            )}
          </div>
        </main>

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

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}
