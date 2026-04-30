import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Building2, Plus, Eye, Loader2, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
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
const pageSizeOptions = ['10', '25', '50', '100'];

export default function BanksListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [statusFilter, setStatusFilter] = useState<BankStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState(25);
  const [downloading, setDownloading] = useState(false);

  const { banks, total, page, pageSize, isLoading, error, refetch } = useSuperAdminBanks({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    country,
    search,
    page: currentPage,
    pageSize: selectedPageSize,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const activeOnPage = banks.filter((bank) => bank.status === 'ACTIVE').length;
  const inactiveOnPage = banks.filter((bank) => bank.status === 'INACTIVE').length;

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Banks report downloaded successfully');
    } catch (err) {
      toast.error('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

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

  const handleCountryChange = (value: string) => {
    setCountry(value.toUpperCase());
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

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <PageHeader
            title="Banks"
            subtitle={`${total} bank${total === 1 ? '' : 's'} found`}
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  Refresh
                </Button>
                <Button
                  className='bg-blue-600 hover:bg-blue-700'
                  size='sm'
                  onClick={handleAddBank}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Issuing Bank
                </Button>
              </div>
            }
          />

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
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Building2 className="h-5 w-5 text-green-500" />
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
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_160px_140px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Search by bank name or code..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <input
                className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm uppercase text-foreground placeholder:normal-case placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Country"
                maxLength={2}
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
              />
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
            </div>
          </div>

          <div className="kardit-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="p-6 text-sm text-muted-foreground">{error}</div>
            ) : banks.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No banks found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Bank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Bank Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Currencies</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {banks.map((bank, index) => (
                      <tr
                        key={bank.bankId}
                        className={`transition-colors hover:bg-muted/40 cursor-pointer ${index % 2 === 1 ? 'bg-muted/20' : ''}`}
                        onClick={() => openBankDetail(bank)}
                      >
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{bank.bankName}</p>
                              <p className="text-xs text-muted-foreground">{bank.bankId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{bank.bankCode}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {bank.supportedCurrencies?.length ? bank.supportedCurrencies.join(', ') : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {format(new Date(bank.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <StatusChip status={statusToChip[bank.status] || 'INACTIVE'} label={bank.status} />
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openBankDetail(bank);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} - {total} total bank{total === 1 ? '' : 's'}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading || currentPage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading || currentPage >= totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
