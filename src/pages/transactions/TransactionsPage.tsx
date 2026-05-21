import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { Download, Loader2, RefreshCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { resolveAffiliateId } from '@/services/affiliateBankApi';
import {
  exportTransactions,
  getAffiliateTransactionVolume,
  getBankTransactionVolume,
  getTransaction,
  queryTransactions,
} from '@/services/transactionApi';
import type {
  TransactionDetail,
  TransactionListItem,
  TransactionQueryFilters,
  TransactionStatus,
  TransactionType,
} from '@/types/transactionContracts';

const DEFAULT_PAGE_SIZE = 25;
const transactionTypeOptions: Array<TransactionType | 'ALL'> = ['ALL', 'POS', 'ATM_WITHDRAWAL', 'LOAD', 'UNLOAD'];
const transactionStatusOptions: Array<TransactionStatus | 'ALL'> = [
  'ALL',
  'SUCCESS',
  'FAILED',
  'AUTHORIZED',
  'REFUSED',
  'CANCELLED',
  'COMPLETED',
  'PENDING',
];

function formatMoney(amount: number, currency: string) {
  const safeCurrency = (currency || '').trim() || 'NGN';
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: safeCurrency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString('en-NG')} ${safeCurrency}`;
  }
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  try {
    return format(new Date(value), 'MMM d, yyyy h:mm a');
  } catch {
    return value;
  }
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'SUCCESS' || status === 'AUTHORIZED' || status === 'COMPLETED') return 'default';
  if (status === 'FAILED' || status === 'REFUSED' || status === 'CANCELLED') return 'destructive';
  if (status === 'PENDING') return 'secondary';
  return 'outline';
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchReference, setSearchReference] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [cardId, setCardId] = useState('');
  const [bankId, setBankId] = useState(() => searchParams.get('bankId') || '');
  const [affiliateIdFilter, setAffiliateIdFilter] = useState(() => searchParams.get('affiliateId') || '');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [transactionType, setTransactionType] = useState<TransactionType | 'ALL'>('ALL');
  const [status, setStatus] = useState<TransactionStatus | 'ALL'>('ALL');
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetail | null>(null);
  const [fundingVolume, setFundingVolume] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const affiliateId = useMemo(() => {
    try {
      return resolveAffiliateId(user);
    } catch {
      return '';
    }
  }, [user]);

  const defaultBankId = user?.stakeholderType === 'BANK' ? user.bankId || user.tenantId : '';

  const filters = useMemo<TransactionQueryFilters>(() => {
    const next: TransactionQueryFilters = {
      affiliateId: user?.stakeholderType === 'AFFILIATE' ? affiliateId || undefined : affiliateIdFilter.trim() || undefined,
      bankId: bankId.trim() || defaultBankId || undefined,
      customerId: customerId.trim() || undefined,
      cardId: cardId.trim() || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      reference: searchReference.trim() || undefined,
      merchantName: merchantName.trim() || undefined,
    };

    if (transactionType !== 'ALL') next.transactionType = [transactionType];
    if (status !== 'ALL') next.status = [status];

    return next;
  }, [affiliateId, affiliateIdFilter, bankId, cardId, customerId, defaultBankId, fromDate, merchantName, searchReference, status, toDate, transactionType, user?.stakeholderType]);

  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

  const fetchTransactions = useCallback(async (nextPage = page) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await queryTransactions({
        filters,
        pageNumber: nextPage,
        pageSize: DEFAULT_PAGE_SIZE,
      });
      setTransactions(response.data);
      setPage(response.page);
      setTotal(response.total);
      if (response.data.length === 0) setSelectedTransaction(null);
    } catch (err) {
      setTransactions([]);
      setTotal(0);
      setSelectedTransaction(null);
      setError(err instanceof Error ? err.message : 'Unable to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  useEffect(() => {
    if (user?.stakeholderType === 'AFFILIATE' && !affiliateId) {
      setFundingVolume(0);
      setIsSummaryLoading(false);
      return;
    }
    if (user?.stakeholderType === 'BANK' && !defaultBankId) {
      setFundingVolume(0);
      setIsSummaryLoading(false);
      return;
    }
    if (user?.stakeholderType === 'SERVICE_PROVIDER') {
      setFundingVolume(0);
      setIsSummaryLoading(false);
      return;
    }

    let active = true;
    setIsSummaryLoading(true);
    const request = user?.stakeholderType === 'BANK'
      ? getBankTransactionVolume(defaultBankId)
      : getAffiliateTransactionVolume(affiliateId);

    request
      .then((response) => {
        if (active) setFundingVolume(response.volumes?.totalFundingVolume ?? 0);
      })
      .catch(() => {
        if (active) setFundingVolume(0);
      })
      .finally(() => {
        if (active) setIsSummaryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [affiliateId, defaultBankId, user?.stakeholderType]);

  const handleRowClick = async (transactionId: string) => {
    setIsFetchingDetail(true);
    try {
      const response = await getTransaction(transactionId);
      setSelectedTransaction(response);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to load transaction detail');
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await exportTransactions({ filters, exportFormat: 'CSV' });
      toast.success(`Export requested: ${response.exportId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to request export');
    } finally {
      setIsExporting(false);
    }
  };

  const resetFilters = () => {
    setSearchReference('');
    setMerchantName('');
    setCustomerId('');
    setCardId('');
    setBankId('');
    setAffiliateIdFilter('');
    setFromDate('');
    setToDate('');
    setTransactionType('ALL');
    setStatus('ALL');
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE', 'BANK', 'SERVICE_PROVIDER']}>
      <AppLayout>
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">Transactions</h1>
                <p className="page-sub">Search, filter, and inspect transaction metadata across your scope.</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => fetchTransactions(1)} disabled={isLoading}>
                  <RefreshCcw className="h-4 w-4" /> Refresh
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleExport} disabled={isExporting}>
                  {isExporting ? <Loader2 className="h-4 w-4 spin" /> : <Download className="h-4 w-4" />}
                  Export CSV
                </button>
              </div>
            </header>

            <section className="kpis" style={{ marginTop: 14 }}>
              <Kpi label="Funding Volume" value={isSummaryLoading ? '...' : formatMoney(fundingVolume, 'NGN')} sub="Current actor scope" />
              <Kpi label="Result Set" value={String(total)} sub="Matches current filters" />
              <Kpi label="Date Window" value={`${fromDate || 'Any'} - ${toDate || 'Any'}`} sub="From and to date filter" />
              <Kpi label="Page" value={`${page}/${totalPages}`} sub={`${DEFAULT_PAGE_SIZE} rows per page`} />
            </section>

            <section className="bch-card card-pad" style={{ marginTop: 14 }}>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="relative xl:col-span-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Reference" value={searchReference} onChange={(e) => setSearchReference(e.target.value)} />
                </div>
                <Input placeholder="Merchant name" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} />
                <Input placeholder="Customer ID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
                <Input placeholder="Card ID" value={cardId} onChange={(e) => setCardId(e.target.value)} />
                <Input placeholder="Bank ID" value={bankId} onChange={(e) => setBankId(e.target.value)} />
                {user?.stakeholderType !== 'AFFILIATE' && (
                  <Input placeholder="Affiliate ID" value={affiliateIdFilter} onChange={(e) => setAffiliateIdFilter(e.target.value)} />
                )}
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                <Select value={transactionType} onValueChange={(value) => setTransactionType(value as TransactionType | 'ALL')}>
                  <SelectTrigger><SelectValue placeholder="Transaction type" /></SelectTrigger>
                  <SelectContent>
                    {transactionTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option === 'ALL' ? 'All Types' : option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={(value) => setStatus(value as TransactionStatus | 'ALL')}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    {transactionStatusOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option === 'ALL' ? 'All Statuses' : option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button variant="outline" onClick={resetFilters}>Clear Filters</Button>
                <p className="text-xs text-muted-foreground self-center">
                  {user?.stakeholderType === 'SERVICE_PROVIDER'
                    ? 'Global users can filter by bank or affiliate as needed.'
                    : 'Your organization scope is applied automatically.'}
                </p>
              </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]" style={{ marginTop: 14 }}>
              <section className="bch-card" style={{ overflow: 'hidden' }}>
                {isLoading ? (
                  <div style={{ display: 'grid', placeItems: 'center', padding: 48 }}>
                    <Loader2 className="spin" style={{ width: 24, height: 24 }} />
                  </div>
                ) : error ? (
                  <div className="empty-list-sub" style={{ padding: 24 }}>{error}</div>
                ) : transactions.length === 0 ? (
                  <div className="empty-list" style={{ padding: 24 }}>No transactions match the current filters.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="data">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Merchant</th>
                          <th>Transaction ID</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction) => (
                          <tr key={transaction.transactionId} onClick={() => handleRowClick(transaction.transactionId)} style={{ cursor: 'pointer' }}>
                            <td>{transaction.transactionType}</td>
                            <td className="meta">{transaction.merchantName || '-'}</td>
                            <td>{transaction.transactionId}</td>
                            <td style={{ fontWeight: 600 }}>{formatMoney(transaction.amount, transaction.currency)}</td>
                            <td><Badge variant={getStatusBadgeVariant(transaction.status)}>{transaction.status}</Badge></td>
                            <td className="meta">{formatDateTime(transaction.transactionDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-[var(--cs-line)] px-4 py-3">
                  <p className="text-sm text-[var(--cs-ink-100)]">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1 || isLoading} onClick={() => fetchTransactions(page - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages || isLoading} onClick={() => fetchTransactions(page + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              </section>

              <section className="bch-card card-pad">
                <div className="section-head" style={{ marginTop: 0 }}>
                  <div>
                    <div className="section-title">Transaction Detail</div>
                    <div className="section-sub">Select a transaction to inspect its metadata.</div>
                  </div>
                  {isFetchingDetail && <Loader2 className="h-4 w-4 spin" />}
                </div>

                {!selectedTransaction ? (
                  <div className="notice info">Pick a row from the table to load transaction details.</div>
                ) : (
                  <div className="space-y-4">
                    <Detail label="Transaction ID" mono value={selectedTransaction.transactionId} />
                    <Detail label="Status" value={<Badge variant={getStatusBadgeVariant(selectedTransaction.status)}>{selectedTransaction.status}</Badge>} />
                    <Detail label="Type" value={selectedTransaction.transactionType} />
                    <Detail label="Amount" value={formatMoney(selectedTransaction.amount, selectedTransaction.currency)} />
                    <Detail label="Merchant" value={selectedTransaction.merchantName || '-'} />
                    <Detail label="Customer ID" mono value={selectedTransaction.customerId} />
                    <Detail label="Card ID" mono value={selectedTransaction.cardId} />
                    <Detail label="Authorization Code" value={selectedTransaction.authorizationCode || '-'} />
                    <Detail label="Merchant MCC" value={selectedTransaction.merchantCategoryCode || '-'} />
                    <Detail label="Source Reference" mono value={selectedTransaction.sourceRef || '-'} />
                    <Detail label="Transaction Date" value={formatDateTime(selectedTransaction.transactionDate)} />
                    <Detail label="Created At" value={formatDateTime(selectedTransaction.createdAt)} />
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
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

function Detail({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.08em] text-[var(--cs-ink-100)]">{label}</div>
      <div className={mono ? 'mt-1 text-sm font-mono text-[var(--cs-ink-700)]' : 'mt-1 text-sm text-[var(--cs-ink-400)]'}>{value}</div>
    </div>
  );
}
