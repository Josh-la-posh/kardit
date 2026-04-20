import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { Download, Loader2, RefreshCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
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
        page: nextPage,
        pageSize: DEFAULT_PAGE_SIZE,
      });
      setTransactions(response.data);
      setPage(response.page);
      setTotal(response.total);
      if (response.data.length === 0) {
        setSelectedTransaction(null);
      }
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
    const request =
      user?.stakeholderType === 'BANK'
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
      const response = await exportTransactions({
        filters,
        exportFormat: 'CSV',
      });
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
        <div className="animate-fade-in">
          <PageHeader
            title="Transactions"
            subtitle=''
            actions={
              <>
                <Button variant="outline" onClick={() => fetchTransactions(1)} disabled={isLoading}>
                  <RefreshCcw className="h-4 w-4" /> Refresh
                </Button>
                <Button onClick={handleExport} disabled={isExporting}>
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Export CSV
                </Button>
              </>
            }
          />

          <div className="grid gap-4 lg:grid-cols-3 mb-6">
            <div className="kardit-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Funding Volume</p>
              {isSummaryLoading ? (
                <Loader2 className="mt-3 h-5 w-5 animate-spin text-primary" />
              ) : (
                <p className="mt-2 text-2xl font-bold text-primary">
                  {formatMoney(fundingVolume, 'NGN')}
                </p>
              )}
            </div>
            <div className="kardit-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Current Result Set</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{total}</p>
              <p className="mt-1 text-sm text-muted-foreground">Across the current transaction filters</p>
            </div>
            <div className="kardit-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Date Window</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {fromDate || 'Any start'} to {toDate || 'Any end'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Use filters to narrow down investigations quickly</p>
            </div>
          </div>

          <div className="kardit-card p-4 mb-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="relative xl:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Reference"
                  value={searchReference}
                  onChange={(e) => setSearchReference(e.target.value)}
                />
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
                <SelectTrigger>
                  <SelectValue placeholder="Transaction type" />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === 'ALL' ? 'All Types' : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(value) => setStatus(value as TransactionStatus | 'ALL')}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {transactionStatusOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === 'ALL' ? 'All Statuses' : option}
                    </SelectItem>
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
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <div className="kardit-card overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="p-12 text-center text-sm text-muted-foreground">{error}</div>
              ) : transactions.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">No transactions match the current filters.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Transaction ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Card ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Merchant</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {transactions.map((transaction, index) => (
                        <tr
                          key={transaction.transactionId}
                          onClick={() => handleRowClick(transaction.transactionId)}
                          className={`cursor-pointer transition-colors hover:bg-muted/40 ${
                            selectedTransaction?.transactionId === transaction.transactionId
                              ? 'bg-primary/5'
                              : index % 2 === 1
                                ? 'bg-muted/20'
                                : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-mono text-primary">{transaction.transactionId}</td>
                          <td className="px-4 py-3 text-sm font-mono">{transaction.cardId}</td>
                          <td className="px-4 py-3 text-sm">{transaction.transactionType}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{transaction.merchantName || '-'}</td>
                          <td className="px-4 py-3 text-sm font-medium">{formatMoney(transaction.amount, transaction.currency)}</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={getStatusBadgeVariant(transaction.status)}>{transaction.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateTime(transaction.transactionDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1 || isLoading} onClick={() => fetchTransactions(page - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages || isLoading} onClick={() => fetchTransactions(page + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </div>

            <div className="kardit-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Transaction Detail</h2>
                  <p className="text-sm text-muted-foreground">Select a transaction to inspect its metadata.</p>
                </div>
                {isFetchingDetail && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              </div>

              {!selectedTransaction ? (
                <div className="mt-8 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Pick a row from the table to load transaction details.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Transaction ID</p>
                    <p className="mt-1 font-mono text-sm text-foreground">{selectedTransaction.transactionId}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
                      <Badge className="mt-2 w-fit" variant={getStatusBadgeVariant(selectedTransaction.status)}>
                        {selectedTransaction.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Type</p>
                      <p className="mt-1 text-sm text-foreground">{selectedTransaction.transactionType}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Amount</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {formatMoney(selectedTransaction.amount, selectedTransaction.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Merchant</p>
                      <p className="mt-1 text-sm text-foreground">{selectedTransaction.merchantName || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Customer ID</p>
                      <p className="mt-1 font-mono text-sm text-foreground">{selectedTransaction.customerId}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Card ID</p>
                      <p className="mt-1 font-mono text-sm text-foreground">{selectedTransaction.cardId}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Authorization Code</p>
                      <p className="mt-1 text-sm text-foreground">{selectedTransaction.authorizationCode || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Merchant MCC</p>
                      <p className="mt-1 text-sm text-foreground">{selectedTransaction.merchantCategoryCode || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Source Reference</p>
                    <p className="mt-1 font-mono text-sm text-foreground">{selectedTransaction.sourceRef || '-'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Transaction Date</p>
                      <p className="mt-1 text-sm text-foreground">{formatDateTime(selectedTransaction.transactionDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Created At</p>
                      <p className="mt-1 text-sm text-foreground">{formatDateTime(selectedTransaction.createdAt)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
