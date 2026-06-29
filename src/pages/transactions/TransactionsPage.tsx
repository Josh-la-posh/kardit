import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Loader2, RefreshCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppCard, AppCardHeader, AppCardSub, AppCardTitle } from '@/components/ui/app-card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PaginatedTable } from '@/components/ui/paginated-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { getAffiliateBankPartnerships, resolveAffiliateId } from '@/services/affiliateBankApi';
import { getBankAffiliates } from '@/services/bankPortalApi';
import { getBanks } from '@/services/bankApi';
import { queryAffiliates, queryBanks as querySuperAdminBanks } from '@/services/superAdminApi';
import {
  downloadTransactionExport,
  exportTransactions,
  getAffiliateTransactionVolume,
  getBankTransactionVolume,
  queryTransactions,
} from '@/services/transactionApi';
import type {
  TransactionListItem,
  TransactionQueryFilters,
  TransactionStatus,
  TransactionType,
} from '@/types/transactionContracts';

const DEFAULT_PAGE_SIZE = 25;
const ALL_FILTER_VALUE = 'ALL';
const transactionTypeOptions: Array<TransactionType | 'ALL'> = ['ALL', 'LOADS', 'UNLOADS'];
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

type FilterOption = {
  id: string;
  label: string;
  meta?: string;
};

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

function uniqueOptions(options: FilterOption[]) {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (!option.id || seen.has(option.id)) return false;
    seen.add(option.id);
    return true;
  });
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [fundingVolume, setFundingVolume] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingExport, setIsDownloadingExport] = useState(false);
  const [exportId, setExportId] = useState<string | null>(null);
  const [bankOptions, setBankOptions] = useState<FilterOption[]>([]);
  const [affiliateOptions, setAffiliateOptions] = useState<FilterOption[]>([]);
  const [isFilterOptionsLoading, setIsFilterOptionsLoading] = useState(true);
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
  const currentBankOption = useMemo(
    () => defaultBankId
      ? [{ id: defaultBankId, label: user?.tenantName || 'Current bank' }]
      : [],
    [defaultBankId, user?.tenantName]
  );
  const currentAffiliateOption = useMemo(
    () => affiliateId
      ? [{ id: affiliateId, label: user?.tenantName || 'Current affiliate' }]
      : [],
    [affiliateId, user?.tenantName]
  );

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
    } catch (err) {
      setTransactions([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : 'Unable to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  useEffect(() => {
    if (!user) return;

    let active = true;

    async function loadScopedOptions() {
      setIsFilterOptionsLoading(true);
      try {
        const nextBanks: FilterOption[] = [];
        const nextAffiliates: FilterOption[] = [];

        if (user?.stakeholderType === 'SERVICE_PROVIDER') {
          const [banksResponse, affiliatesResponse] = await Promise.all([
            querySuperAdminBanks({ filters: {}, page: 1, pageSize: 500 }),
            queryAffiliates({ filters: {}, page: 1, pageSize: 500 }),
          ]);

          nextBanks.push(
            ...(banksResponse.data || []).map((bank) => ({
              id: bank.bankId,
              label: bank.bankName || bank.bankCode || bank.bankId,
              meta: bank.bankCode,
            }))
          );
          nextAffiliates.push(
            ...(affiliatesResponse.data || []).map((affiliate) => ({
              id: affiliate.affiliateId,
              label: affiliate.tradingName || affiliate.legalName || affiliate.affiliateId,
              meta: affiliate.tenantId,
            }))
          );
        } else if (user?.stakeholderType === 'BANK') {
          nextBanks.push(...currentBankOption);
          if (defaultBankId) {
            const response = await getBankAffiliates(defaultBankId);
            nextAffiliates.push(
              ...(response.affiliates || []).map((affiliate) => ({
                id: affiliate.affiliateId,
                label: affiliate.affiliateName || affiliate.affiliateId,
                meta: affiliate.tenantId,
              }))
            );
          }
        } else {
          nextAffiliates.push(...currentAffiliateOption);
          if (affiliateId) {
            const response = await getAffiliateBankPartnerships(affiliateId);
            nextBanks.push(
              ...(response.banks || []).map((bank) => ({
                id: bank.bankId,
                label: bank.bankName || bank.bankCode || bank.bankId,
                meta: bank.bankCode,
              }))
            );
          } else {
            const banks = await getBanks();
            nextBanks.push(
              ...banks.map((bank) => ({
                id: bank.bankId,
                label: bank.bankName || bank.bankCode || bank.bankId,
                meta: bank.bankCode,
              }))
            );
          }
        }

        if (active) {
          setBankOptions(uniqueOptions([...currentBankOption, ...nextBanks]));
          setAffiliateOptions(uniqueOptions([...currentAffiliateOption, ...nextAffiliates]));
        }
      } catch (err) {
        console.error('Unable to load transaction filter options:', err);
        if (active) {
          setBankOptions(uniqueOptions(currentBankOption));
          setAffiliateOptions(uniqueOptions(currentAffiliateOption));
        }
      } finally {
        if (active) setIsFilterOptionsLoading(false);
      }
    }

    loadScopedOptions();

    return () => {
      active = false;
    };
  }, [affiliateId, currentAffiliateOption, currentBankOption, defaultBankId, user]);

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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportFilters = {
        bankId: filters.bankId,
        affiliateId: filters.affiliateId,
        status: filters.status,
        transactionType: filters.transactionType,
        fromDate: filters.fromDate ? new Date(`${filters.fromDate}T00:00:00`).toISOString() : undefined,
        toDate: filters.toDate ? new Date(`${filters.toDate}T23:59:59.999`).toISOString() : undefined,
      };
      const response = await exportTransactions({ filters: exportFilters, exportFormat: 'CSV' });
      setExportId(response.exportId);
      toast.success('Transaction export is ready to download.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to request export');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadExport = async () => {
    if (!exportId || isDownloadingExport) return;

    setIsDownloadingExport(true);
    try {
      const { blob, fileName } = await downloadTransactionExport(exportId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName || `transactions-${exportId}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setExportId(null);
      toast.success('Transaction export downloaded.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to download export');
    } finally {
      setIsDownloadingExport(false);
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

  const transactionColumns = useMemo(
    () => [
      {
        key: 'transactionType',
        header: 'Type',
        render: (transaction: TransactionListItem) => transaction.transactionType,
      },
      {
        key: 'merchantName',
        header: 'Merchant',
        className: 'meta',
        render: (transaction: TransactionListItem) => transaction.merchantName || '-',
      },
      {
        key: 'transactionId',
        header: 'Transaction ID',
        className: 'id',
        render: (transaction: TransactionListItem) => transaction.transactionId,
      },
      {
        key: 'amount',
        header: 'Amount',
        render: (transaction: TransactionListItem) => (
          <span style={{ fontWeight: 600 }}>
            {formatMoney(transaction.amount, transaction.currency)}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (transaction: TransactionListItem) => (
          <Badge variant={getStatusBadgeVariant(transaction.status)}>{transaction.status}</Badge>
        ),
      },
      {
        key: 'transactionDate',
        header: 'Date',
        className: 'meta',
        render: (transaction: TransactionListItem) => formatDateTime(transaction.transactionDate),
      },
    ],
    []
  );

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

            {/* <section className="kpis" style={{ marginTop: 14 }}>
              <Kpi label="Funding Volume" value={isSummaryLoading ? '...' : formatMoney(fundingVolume, 'NGN')} sub="Current actor scope" />
              <Kpi label="Result Set" value={String(total)} sub="Matches current filters" />
              <Kpi label="Date Window" value={`${fromDate || 'Any'} - ${toDate || 'Any'}`} sub="From and to date filter" />
              <Kpi label="Page" value={`${page}/${totalPages}`} sub={`${DEFAULT_PAGE_SIZE} rows per page`} />
            </section> */}

            <AppCard padded="md" style={{ marginTop: 14 }}>
              {/* <AppCardHeader style={{ marginBottom: 12 }}>
                <div>
                  <AppCardTitle>Filters</AppCardTitle>
                  <AppCardSub>Search and narrow transaction records across your scope.</AppCardSub>
                </div>
              </AppCardHeader> */}
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <Select value={bankId || ALL_FILTER_VALUE} onValueChange={(value) => setBankId(value === ALL_FILTER_VALUE ? '' : value)}>
                  <SelectTrigger><SelectValue placeholder="Bank" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FILTER_VALUE}>Select bank</SelectItem>
                    {bankOptions.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.label}{bank.meta ? ` - ${bank.meta}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* <Input placeholder="Merchant name" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} /> */}
                <Input title="Customer name" placeholder="Customer name" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
                <Input title="Card ID" placeholder="Card ID" value={cardId} onChange={(e) => setCardId(e.target.value)} />
                <div className="relative xl:col-span-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Reference" value={searchReference} onChange={(e) => setSearchReference(e.target.value)} />
                </div>
                {user?.stakeholderType !== 'AFFILIATE' && (
                  <Select value={affiliateIdFilter || ALL_FILTER_VALUE} onValueChange={(value) => setAffiliateIdFilter(value === ALL_FILTER_VALUE ? '' : value)}>
                    <SelectTrigger><SelectValue placeholder="Affiliate" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_FILTER_VALUE}>All Affiliates</SelectItem>
                      {affiliateOptions.map((affiliate) => (
                        <SelectItem key={affiliate.id} value={affiliate.id}>
                          {affiliate.label}{affiliate.meta ? ` - ${affiliate.meta}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                <Select value={transactionType} onValueChange={(value) => setTransactionType(value as TransactionType | 'ALL')}>
                  <SelectTrigger><SelectValue placeholder="Transaction type" /></SelectTrigger>
                  <SelectContent>
                    {transactionTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option === 'ALL' ? 'Types' : option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={(value) => setStatus(value as TransactionStatus | 'ALL')}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    {transactionStatusOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option === 'ALL' ? 'Status' : option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button variant="outline" onClick={resetFilters}>Clear Filters</Button>
                <p className="text-xs text-muted-foreground self-center">
                  {isFilterOptionsLoading
                    ? 'Loading filter options...'
                    : user?.stakeholderType === 'SERVICE_PROVIDER'
                    ? 'Global users can filter by bank or affiliate as needed.'
                    : 'Your organization scope is applied automatically.'}
                </p>
              </div>
            </AppCard>

            <AppCard style={{ marginTop: 14, overflow: 'hidden' }}>
              <PaginatedTable
                columns={transactionColumns}
                rows={transactions}
                isLoading={isLoading}
                error={error}
                emptyMessage="No transactions match the current filters."
                onRowClick={(row) => navigate(`/transactions/${encodeURIComponent(row.transactionId)}`)}
                rowKey={(row) => row.transactionId}
                page={page}
                pageSize={DEFAULT_PAGE_SIZE}
                total={total}
                onPageChange={fetchTransactions}
                className="border-0 shadow-none rounded-none"
              />
            </AppCard>
          </div>
        </main>

        <Dialog
          open={Boolean(exportId)}
          onOpenChange={(open) => {
            if (!open && !isDownloadingExport) setExportId(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Export ready</DialogTitle>
              <DialogDescription>
                Your transaction report has been prepared. Download the CSV file to continue.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => void handleDownloadExport()}
                disabled={isDownloadingExport}
              >
                {isDownloadingExport
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Download className="mr-2 h-4 w-4" />}
                {isDownloadingExport ? 'Downloading...' : 'Download'}
              </Button>
            </DialogFooter>
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
