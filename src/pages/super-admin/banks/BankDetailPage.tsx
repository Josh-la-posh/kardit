import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { PaginatedTable } from '@/components/ui/paginated-table';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Search, Building2, Eye, Users, CreditCard, ArrowLeft, Globe, Activity, Snowflake, OctagonMinus, RefreshCw, Loader2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useBankCardMetrics, useBankTransactionVolume } from '@/hooks/useTransactionVolumes';
import { useSuperAdminBankAffiliates } from '@/hooks/useSuperAdminBanks';
import { queryBanks } from '@/services/superAdminApi';
import type { AffiliateQueryItem, BankQueryItem } from '@/types/superAdminContracts';
import { AppCard, AppCardHeader, AppCardSub, AppCardTitle } from '@/components/ui/app-card';

const statusToChip: Record<string, StatusType> = {
  ACTIVE: 'SUCCESS',
  APPROVED: 'PENDING',
  SUSPENDED: 'WARNING',
  INACTIVE: 'INACTIVE',
};

const pageSizeOptions = ['20', '50', '100'];

function formatMoney(value: number | undefined) {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * BankDetailPage - Super Admin view of a specific bank's affiliates
 * Shows all affiliates under a selected bank
 */
export default function BankDetailPage() {
  const { bankId } = useParams<{ bankId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { volume, isLoading: volumeLoading, error: volumeError, refetch: refetchVolume } = useBankTransactionVolume(bankId);
  const { metrics: cardMetrics, isLoading: cardMetricsLoading, error: cardMetricsError, refetch: refetchCardMetrics } = useBankCardMetrics(bankId);
  
  const routeState = location.state as { bank?: BankQueryItem } | null;
  const [bankSummary, setBankSummary] = useState<BankQueryItem | null>(
    routeState?.bank?.bankId === bankId ? routeState.bank : null
  );
  const [bankLoading, setBankLoading] = useState(Boolean(bankId));
  const [bankError, setBankError] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState(20);
  const { affiliates, total, page, pageSize, isLoading, error, refresh } = useSuperAdminBankAffiliates(bankId, {
    search,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page: currentPage,
    pageSize: selectedPageSize,
  });

  const loadBankSummary = useCallback(async () => {
    if (!bankId) {
      setBankSummary(null);
      setBankError('Bank not found');
      setBankLoading(false);
      return;
    }

    setBankLoading(true);
    setBankError(null);

    try {
      const searchResponse = await queryBanks({
        filters: {
          search: bankId,
        },
        page: 1,
        pageSize: 25,
      }).catch(() => null);

      let nextBank = searchResponse?.data.find((item) => item.bankId === bankId) || null;

      if (!nextBank) {
        const fallbackResponse = await queryBanks({
          filters: {},
          page: 1,
          pageSize: 100,
        });
        nextBank = fallbackResponse.data.find((item) => item.bankId === bankId) || null;
      }

      setBankSummary(nextBank);
      if (!nextBank) {
        setBankError('Bank not found');
      }
    } catch (e) {
      setBankSummary(null);
      setBankError(e instanceof Error ? e.message : 'Failed to load bank details');
    } finally {
      setBankLoading(false);
    }
  }, [bankId]);

  useEffect(() => {
    loadBankSummary();
  }, [loadBankSummary]);

  const openAffiliateDetail = (affiliate: AffiliateQueryItem) => {
    navigate(`/super-admin/banks/${bankId}/affiliates/${affiliate.affiliateId}`, {
      state: {
        bank: bankSummary,
        affiliate,
      },
    });
  };

  const totals = useMemo(() => {
    return {
      totalAffiliates: total,
      activeAffiliates: affiliates.filter((affiliate) => affiliate.status === 'ACTIVE').length,
      approvedAffiliates: affiliates.filter((affiliate) => affiliate.status === 'APPROVED').length,
      suspendedAffiliates: affiliates.filter((affiliate) => affiliate.status === 'SUSPENDED').length,
    };
  }, [affiliates, total]);

  const columns = useMemo(
    () => [
      {
        key: 'affiliate',
        header: 'Affiliate',
        render: (affiliate: AffiliateQueryItem) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="action-icon" style={{ width: 34, height: 34 }}>
              <Building2 style={{ width: 16, height: 16 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--cs-ink-900)' }}>{affiliate.legalName}</div>
              <div className="meta" style={{ fontSize: 11.5 }}>{affiliate.tradingName || affiliate.affiliateId}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'affiliateId',
        header: 'Affiliate ID',
        className: 'id',
        render: (affiliate: AffiliateQueryItem) => affiliate.affiliateId,
      },
      {
        key: 'tenantId',
        header: 'Tenant ID',
        className: 'meta',
        render: (affiliate: AffiliateQueryItem) => affiliate.tenantId || '-',
      },
      {
        key: 'registrationNumber',
        header: 'Registration',
        className: 'meta',
        render: (affiliate: AffiliateQueryItem) => affiliate.registrationNumber || '-',
      },
      {
        key: 'country',
        header: 'Country',
        className: 'meta',
        render: (affiliate: AffiliateQueryItem) => affiliate.country || '-',
      },
      {
        key: 'createdAt',
        header: 'Created',
        className: 'meta',
        render: (affiliate: AffiliateQueryItem) => format(new Date(affiliate.createdAt), 'MMM d, yyyy'),
      },
      {
        key: 'status',
        header: 'Status',
        render: (affiliate: AffiliateQueryItem) => (
          <StatusChip status={statusToChip[affiliate.status] || 'INACTIVE'} label={affiliate.status} />
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'right',
        render: (affiliate: AffiliateQueryItem) => (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openAffiliateDetail(affiliate);
            }}
          >
            <Eye className="mr-1 h-3 w-3" /> View
          </Button>
        ),
      },
    ],
    [bankId, bankSummary, navigate]
  );

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  function handlePageSizeChange(value: string) {
    setSelectedPageSize(Number(value));
    setCurrentPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleClearFilters() {
    setSearch('');
    setStatusFilter('ALL');
    setCurrentPage(1);
  }

  const refreshAll = useCallback(async () => {
    await Promise.all([loadBankSummary(), refresh(), refetchVolume(), refetchCardMetrics()]);
  }, [loadBankSummary, refresh, refetchVolume, refetchCardMetrics]);

  if (!bankId) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
        <AppLayout navVariant="service-provider">
          <div className="text-center py-20 text-muted-foreground">Bank not found</div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const bankName = bankSummary?.bankName || `Bank ${bankId}`;
  const bankCode = bankSummary?.bankCode || '-';
  const bankStatus = bankSummary?.status;
  const supportedCurrencies = bankSummary?.supportedCurrencies || [];
  const createdAt = bankSummary?.createdAt;

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">{bankName}</h1>
                <p className="page-sub">
                  {`Affiliates under ${bankName}`}
                </p>
              </div>
              <div className="row-end">
                  {bankStatus && <StatusChip status={statusToChip[bankStatus] || 'INACTIVE'} label={bankStatus} />}
                  <Button variant="outline" size="sm" onClick={refreshAll} disabled={bankLoading || isLoading || volumeLoading || cardMetricsLoading}>
                    <RefreshCw className={bankLoading || isLoading || volumeLoading || cardMetricsLoading ? 'mr-1 h-4 w-4 animate-spin' : 'mr-1 h-4 w-4'} /> Refresh
                  </Button>
                  <Button className="btn-secondary" variant="outline" size="sm" onClick={() => navigate('/super-admin/banks')}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Banks
                  </Button>
                </div>
            </header>

            <div className="kardit-card p-6 mb-6" style={{ marginTop: 14 }}>
              {/* {bankLoading && (
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Loading bank details...
                </div>
              )}
              {bankError && (
                <div className="mb-4 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  {bankError}
                </div>
              )} */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bank ID</p>
                  <p className="font-medium">{bankId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bank Code</p>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{bankCode}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Supported Currencies</p>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{supportedCurrencies.length ? supportedCurrencies.join(', ') : '-'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created</p>
                  <p className="font-medium">{createdAt ? format(new Date(createdAt), 'MMM d, yyyy') : '-'}</p>
                </div>
              </div>
            </div>
            

            {/* Summary Stats */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <div className="kardit-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totals.totalAffiliates}</p>
                    <p className="text-xs text-muted-foreground">Affiliates Returned</p>
                  </div>
                </div>
              </div>
              <div className="kardit-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {cardMetricsLoading ? '...' : (cardMetrics?.metrics.totalCardsIssued?.toLocaleString() ?? '-')}
                    </p>
                    <p className="text-xs text-muted-foreground">Cards Issued</p>
                    {cardMetricsError && <p className="text-xs text-destructive mt-1">{cardMetricsError}</p>}
                  </div>
                </div>
              </div>
              <div className="kardit-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[hsl(var(--info)/0.12)]">
                    <Snowflake className="h-5 w-5 text-[hsl(var(--info))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {cardMetricsLoading ? '...' : (cardMetrics?.metrics.frozenCards?.toLocaleString() ?? '-')}
                    </p>
                    <p className="text-xs text-muted-foreground">Frozen Cards</p>
                    {cardMetricsError && <p className="text-xs text-destructive mt-1">{cardMetricsError}</p>}
                  </div>
                </div>
              </div>
              <div className="kardit-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[hsl(var(--destructive)/0.12)]">
                    <OctagonMinus className="h-5 w-5 text-[hsl(var(--destructive))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {cardMetricsLoading ? '...' : (cardMetrics?.metrics.terminatedCards?.toLocaleString() ?? '-')}
                    </p>
                    <p className="text-xs text-muted-foreground">Terminated Cards</p>
                    {cardMetricsError && <p className="text-xs text-destructive mt-1">{cardMetricsError}</p>}
                  </div>
                </div>
              </div>
              {/*<div className="kardit-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[hsl(var(--warning)/0.12)]">
                    <Users className="h-5 w-5 text-[hsl(var(--warning))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totals.suspendedAffiliates}</p>
                    <p className="text-xs text-muted-foreground">Suspended Affiliates</p>
                  </div>
                </div>
              </div> */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="kardit-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[hsl(var(--warning)/0.12)]">
                    <Activity className="h-5 w-5 text-[hsl(var(--warning))]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {volumeLoading ? '...' : formatMoney(volume?.volumes?.totalTransactionVolume)}
                    </p>
                    <p className="text-xs text-muted-foreground">Transaction Volume</p>
                    {volumeError && <p className="text-xs text-destructive mt-1">{volumeError}</p>}
                  </div>
                </div>
              </div>
              <div className="kardit-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[hsl(var(--success)/0.12)]">
                    <TrendingUp className="h-5 w-5 text-[hsl(var(--success))]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {volumeLoading ? '...' : formatMoney(volume?.volumes?.totalFundingVolume)}
                    </p>
                    <p className="text-xs text-muted-foreground">Funding Volume</p>
                    {volumeError && <p className="text-xs text-destructive mt-1">{volumeError}</p>}
                  </div>
                </div>
              </div>
              <div className="kardit-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[hsl(var(--success)/0.12)]">
                    <Users className="h-5 w-5 text-[hsl(var(--success))]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {cardMetricsLoading ? '...' : (cardMetrics?.metrics.activeCards?.toLocaleString() ?? '-')}
                    </p>
                    <p className="text-xs text-muted-foreground">Active Cards</p>
                    {cardMetricsError && <p className="text-xs text-destructive mt-1">{cardMetricsError}</p>}
                  </div>
                </div>
              </div>
            </div>

            <AppCard padded="md" style={{ marginTop: 14 }}>
              <AppCardHeader style={{ marginBottom: 12 }}>
                <div>
                  <AppCardTitle>Filters</AppCardTitle>
                  <AppCardSub>Search and narrow affiliates for this bank.</AppCardSub>
                </div>
              </AppCardHeader>

              <div className="banks-filters">
                <div className="search-wrap" style={{ width: '100%' }}>
                  <Search />
                  <input
                    className="bch-input bch-input-sm"
                    placeholder="Search by affiliate name or registration number..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>

                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="APPROVED">APPROVED</SelectItem>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={String(selectedPageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Page size" />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size} / page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={handleClearFilters} disabled={!search && statusFilter === 'ALL'}>
                  Clear
                </Button>
              </div>
            </AppCard>

            <AppCard style={{ marginTop: 14, overflow: 'hidden' }}>
              <PaginatedTable
                columns={columns}
                rows={affiliates}
                isLoading={isLoading}
                error={error}
                emptyMessage="No affiliates found for this bank"
                onRowClick={openAffiliateDetail}
                rowKey={(affiliate) => affiliate.affiliateId}
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setCurrentPage}
                className="border-0 shadow-none rounded-none"
              />
            </AppCard>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  );
}


