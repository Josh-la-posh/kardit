import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { store, type PlatformBank } from '@/stores/mockStore';
import { Search, Building2, Eye, Users, CreditCard, RefreshCw, Download, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusToChip: Record<string, StatusType> = {
  ACTIVE: 'SUCCESS',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'WARNING',
};

/**
 * BanksListPage - Super Admin view of all banks on the platform
 * Allows super admin to view and manage all banks
 */
export default function BanksListPage() {
  const navigate = useNavigate();
  const banks = store.getPlatformBanks();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [downloading, setDownloading] = useState(false);

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Banks report downloaded successfully');
      // In a real app, trigger actual file download here
    } catch (err) {
      toast.error('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  const filtered = useMemo(() => {
    return banks.filter((bank) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || 
        bank.name.toLowerCase().includes(q) ||
        bank.code.toLowerCase().includes(q) ||
        bank.contactEmail.toLowerCase().includes(q) ||
        bank.country.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || bank.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [banks, search, statusFilter]);

  const statuses = useMemo(() => [...new Set(banks.map(b => b.status))], [banks]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      banks: banks.length,
      activeBanks: banks.filter(b => b.status === 'ACTIVE').length,
      totalAffiliates: banks.reduce((sum, b) => sum + b.totalAffiliates, 0),
      totalCustomers: banks.reduce((sum, b) => sum + b.totalCustomers, 0),
      totalCards: banks.reduce((sum, b) => sum + b.totalCards, 0),
    };
  }, [banks]);

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <PageHeader
            title="Banks"
            subtitle="Manage all banks on the platform"
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
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

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totals.activeBanks}/{totals.banks}</p>
                  <p className="text-xs text-muted-foreground">Active Banks</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Building2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totals.totalAffiliates}</p>
                  <p className="text-xs text-muted-foreground">Total Affiliates</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totals.totalCustomers.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Customers</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <CreditCard className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totals.totalCards.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Cards</p>
                </div>
              </div>
            </div>
          </div>

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

          {/* Table */}
          <div className="kardit-card overflow-hidden">
            {filtered.length === 0 ? (
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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Country</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Affiliates</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Customers</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Cards</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((bank, i) => (
                      <tr
                        key={bank.id}
                        className={`transition-colors hover:bg-muted/40 cursor-pointer ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
                        onClick={() => navigate(`/super-admin/banks/${bank.id}`)}
                      >
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{bank.name}</p>
                              <p className="text-xs text-muted-foreground">{bank.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {bank.country}
                        </td>
                        <td className="px-4 py-3 text-sm max-w-[200px]">
                          <p className="truncate">{bank.contactEmail}</p>
                          {bank.contactPhone && (
                            <p className="text-xs text-muted-foreground truncate">{bank.contactPhone}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {bank.totalAffiliates}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {bank.totalCustomers.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {bank.totalCards.toLocaleString()}
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
                              navigate(`/super-admin/banks/${bank.id}`);
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
