import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useIssuingBanks } from '@/hooks/useIssuingBank';
import { Search, Building2, Eye, Plus, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusToChip: Record<string, StatusType> = {
  PROVISIONED: 'SUCCESS',
  DRAFT: 'PENDING',
  SUBMITTED: 'PROCESSING',
  PROVISIONING: 'PROCESSING',
  FAILED: 'FAILED',
};

/**
 * IssuingBanksListPage - Service Provider view of their provisioned issuing banks
 * Allows service provider to manage their issuing banks
 */
export default function IssuingBanksListPage() {
  const navigate = useNavigate();
  const { banks, isLoading, refetch } = useIssuingBanks();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return banks.filter((bank) => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        bank.bankDetails.name.toLowerCase().includes(q) ||
        bank.bankDetails.code.toLowerCase().includes(q) ||
        bank.bankDetails.contactEmail.toLowerCase().includes(q) ||
        bank.bankDetails.country.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || bank.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [banks, search, statusFilter]);

  const statuses = useMemo(() => [...new Set(banks.map(b => b.status))], [banks]);

  const handleRefresh = async () => {
    await refetch();
    toast.success('Banks list refreshed');
  };

  const handleAddBank = () => {
    navigate('/issuing-banks/new');
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <PageHeader
            title="Issuing Banks"
            subtitle="Manage your provisioned issuing banks"
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Refresh
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

          {/* Summary Stats */}
          {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{banks.length}</p>
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
                  <p className="text-2xl font-bold">{banks.filter(b => b.status === 'PROVISIONED').length}</p>
                  <p className="text-xs text-muted-foreground">Active Banks</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Building2 className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{banks.filter(b => b.status === 'PROVISIONING' || b.status === 'SUBMITTED').length}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Building2 className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{banks.filter(b => b.status === 'FAILED').length}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
            </div>
          </div> */}

          {/* Filter Bar */}
          <div className="kardit-card p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Search by name, code, email, or country..."
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
                  {statuses.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="kardit-card p-12 text-center">
              <div className="h-8 w-8 border-4 border-border border-t-primary rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading issuing banks...</p>
            </div>
          )}

          {/* Table */}
          {!isLoading && (
            <div className="kardit-card overflow-hidden">
              {filtered.length === 0 ? (
                <div className="p-12 text-center">
                  <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {banks.length === 0 ? 'No issuing banks yet. Create one to get started.' : 'No banks match your search.'}
                  </p>
                  {banks.length === 0 && (
                    <Button
                      className='bg-blue-600 hover:bg-blue-700 mt-4'
                      onClick={handleAddBank}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Create Your First Bank
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Bank</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Country</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Provisioned Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filtered.map((bank, i) => (
                        <tr
                          key={bank.id}
                          className={`transition-colors hover:bg-muted/40 cursor-pointer ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
                          onClick={() => bank.status === 'PROVISIONED' && navigate(`/issuing-banks/${bank.id}/details`)}
                        >
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Building2 className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{bank.bankDetails.name}</p>
                                <p className="text-xs text-muted-foreground">{bank.bankDetails.code}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {bank.bankDetails.country}
                          </td>
                          <td className="px-4 py-3 text-sm max-w-[200px]">
                            <p className="truncate">{bank.bankDetails.contactEmail}</p>
                            {bank.bankDetails.contactPhone && (
                              <p className="text-xs text-muted-foreground truncate">{bank.bankDetails.contactPhone}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <StatusChip status={statusToChip[bank.status] || 'PENDING'} label={bank.status} />
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {bank.provisionedAt ? format(new Date(bank.provisionedAt), 'MMM dd, yyyy') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {bank.status === 'PROVISIONED' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/issuing-banks/${bank.id}/details`);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" /> View
                              </Button>
                            ) : bank.status === 'FAILED' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/issuing-banks/${bank.sessionId}/failure`);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" /> Retry
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                              >
                                <Eye className="h-3 w-3 mr-1" /> —
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
