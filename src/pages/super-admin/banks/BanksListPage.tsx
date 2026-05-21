import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Building2, Plus, Eye, RefreshCw, Search } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { PaginatedTable } from '@/components/ui/paginated-table';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSuperAdminBanks } from '@/hooks/useSuperAdminBanks';
import type { BankStatus } from '@/types/bankContracts';
import type { BankQueryItem } from '@/types/superAdminContracts';

const statusToChip: Record<string, StatusType> = {
  ACTIVE: 'SUCCESS',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'WARNING',
};

const statusOptions: Array<BankStatus | 'ALL'> = ['ALL', 'ACTIVE', 'INACTIVE'];
const pageSizeOptions = ['20', '50', '100'];

export default function BanksListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [statusFilter, setStatusFilter] = useState<BankStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState(20);

  const { banks, total, page, pageSize, isLoading, error, refetch } = useSuperAdminBanks({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    country,
    search,
    page: currentPage,
    pageSize: selectedPageSize,
  });

  const activeOnPage = banks.filter((bank) => bank.status === 'ACTIVE').length;
  const inactiveOnPage = banks.filter((bank) => bank.status === 'INACTIVE').length;

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as BankStatus | 'ALL');
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setSelectedPageSize(Number(value));
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCountry('');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  const handleAddBank = () => {
    navigate('/issuing-banks/new');
  };

  const openBankDetail = (bank: BankQueryItem) => {
    navigate(`/super-admin/banks/${bank.bankId}`, {
      state: { bank },
    });
  };

  const columns = useMemo(
    () => [
      {
        key: 'bank',
        header: 'Bank',
        render: (bank: BankQueryItem) => (
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{bank.bankName}</p>
              <p className="text-xs text-muted-foreground">{bank.bankId}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'bankCode',
        header: 'Bank Code',
        className: 'font-mono text-muted-foreground',
        render: (bank: BankQueryItem) => bank.bankCode || '-',
      },
      {
        key: 'supportedCurrencies',
        header: 'Currencies',
        className: 'text-muted-foreground',
        render: (bank: BankQueryItem) =>
          bank.supportedCurrencies?.length ? bank.supportedCurrencies.join(', ') : '-',
      },
      {
        key: 'createdAt',
        header: 'Created',
        className: 'text-muted-foreground',
        render: (bank: BankQueryItem) => format(new Date(bank.createdAt), 'MMM d, yyyy'),
      },
      {
        key: 'status',
        header: 'Status',
        render: (bank: BankQueryItem) => (
          <StatusChip status={statusToChip[bank.status] || 'INACTIVE'} label={bank.status} />
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (bank: BankQueryItem) => (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openBankDetail(bank);
            }}
          >
            <Eye className="mr-1 h-3 w-3" /> View
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">Banks</h1>
                <p className="page-sub">{`${total} bank${total === 1 ? '' : 's'} found`}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
                  <RefreshCw className={isLoading ? 'mr-1 h-4 w-4 animate-spin' : 'mr-1 h-4 w-4'} />
                  Refresh
                </Button>
                <Button
                  className='bg-primary hover:bg-primary/90'
                  size='sm'
                  onClick={handleAddBank}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Issuing Bank
                </Button>
              </div>
            </header>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Banks</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--success)/0.12)]">
                  <Building2 className="h-5 w-5 text-[hsl(var(--success))]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeOnPage}</p>
                  <p className="text-xs text-muted-foreground">Active on Page</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inactiveOnPage}</p>
                  <p className="text-xs text-muted-foreground">Inactive on Page</p>
                </div>
              </div>
            </div>
          </div>

          <div className="kardit-card p-4 mb-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_140px_110px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Search by bank name"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              {/* <input
                className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm uppercase text-foreground placeholder:normal-case placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Country"
                maxLength={2}
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
              /> */}
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === 'ALL' ? 'All Statuses' : status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(selectedPageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="bg-muted border-border">
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
              <Button variant="outline" onClick={handleClearFilters} disabled={!search && !country && statusFilter === 'ALL'}>
                Clear
              </Button>
            </div>
          </div>

          <div className="kardit-card overflow-hidden">
            <PaginatedTable
              columns={columns}
              rows={banks}
              isLoading={isLoading}
              error={error}
              emptyMessage="No banks found"
              onRowClick={openBankDetail}
              rowKey={(bank) => bank.bankId}
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setCurrentPage}
              className="border-0 shadow-none rounded-none"
            />
          </div>
        </div>
        </main>
        
      </AppLayout>
    </ProtectedRoute>
  );
}

