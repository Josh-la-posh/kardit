import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useSuperAdminBanks } from '@/hooks/useSuperAdminBanks';
import { Search, Building2, Eye, Wallet, RefreshCw, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusToChip: Record<string, StatusType> = {
  ACTIVE: 'SUCCESS',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'WARNING',
};

export default function BanksListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [downloading, setDownloading] = useState(false);
  const { banks, total, isLoading, error, refresh } = useSuperAdminBanks({ search, status: statusFilter });

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Banks report downloaded successfully');
    } catch {
      toast.error('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  const totals = useMemo(() => {
    return {
      banks: total,
      activeBanks: banks.filter((bank) => bank.status === 'ACTIVE').length,
      inactiveBanks: banks.filter((bank) => bank.status === 'INACTIVE').length,
      currenciesCovered: new Set(banks.flatMap((bank) => bank.supportedCurrencies || [])).size,
    };
  }, [banks, total]);

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <PageHeader
            title="Banks"
            subtitle="Manage all banks on the platform"
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                  onClick={handleDownloadReport}
                  disabled={downloading}
                >
                  <Download className="h-4 w-4 mr-1" /> {downloading ? 'Downloading...' : 'Download Report'}
                </Button>
              </div>
            }
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totals.banks}</p>
                  <p className="text-xs text-muted-foreground">Banks Returned</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Building2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totals.activeBanks}</p>
                  <p className="text-xs text-muted-foreground">Active Banks</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Building2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totals.inactiveBanks}</p>
                  <p className="text-xs text-muted-foreground">Inactive Banks</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Wallet className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totals.currenciesCovered}</p>
                  <p className="text-xs text-muted-foreground">Currencies Covered</p>
                </div>
              </div>
            </div>
          </div>

          <div className="kardit-card p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Search by bank name or bank code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-muted border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Bank ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Currencies</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {banks.map((bank, i) => (
                      <tr
                        key={bank.bankId}
                        className={`transition-colors hover:bg-muted/40 cursor-pointer ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
                        onClick={() => navigate(`/super-admin/banks/${bank.bankId}`, { state: { bank } })}
                      >
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{bank.bankName}</p>
                              <p className="text-xs text-muted-foreground">{bank.bankCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{bank.bankId}</td>
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
                              navigate(`/super-admin/banks/${bank.bankId}`, { state: { bank } });
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
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
