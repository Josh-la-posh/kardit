import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { store, type PlatformAffiliate } from '@/stores/mockStore';
import { Search, Building2, Eye, Users, CreditCard, ArrowLeft, Mail, Phone, Globe, Activity, TrendingDown, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useBankTransactionVolume } from '@/hooks/useTransactionVolumes';

const statusToChip: Record<string, StatusType> = {
  ACTIVE: 'SUCCESS',
  APPROVED: 'PENDING',
  SUSPENDED: 'WARNING',
  INACTIVE: 'INACTIVE',
};

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
  const { volume, isLoading: volumeLoading } = useBankTransactionVolume(bankId);
  
  const bank = bankId ? store.getPlatformBank(bankId) : null;
  const affiliates = useMemo(() => 
    bankId ? store.getPlatformAffiliates(bankId) : [], 
    [bankId]
  );
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const {  total, isLoading, error, refresh } = useSuperAdminBankAffiliates(bankId, {
    search,
    status: statusFilter,
  });

  const totals = useMemo(() => {
    return {
      totalAffiliates: total,
      activeAffiliates: affiliates.filter((affiliate) => affiliate.status === 'ACTIVE').length,
      // approvedAffiliates: affiliates.filter((affiliate) => affiliate.status === 'APPROVED').length,
      suspendedAffiliates: affiliates.filter((affiliate) => affiliate.status === 'SUSPENDED').length,
    };
  }, [affiliates, total]);

  if (!bankId) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
        <AppLayout navVariant="service-provider">
          <div className="text-center py-20 text-muted-foreground">Bank not found</div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <PageHeader
            title={bank?.bankName || `Bank ${bankId}`}
            subtitle={`Affiliates under ${bank?.bankName || bankId}`}
            actions={
              <div className="flex items-center gap-2">
                {bank?.status && <StatusChip status={statusToChip[bank.status] || 'INACTIVE'} label={bank.status} />}
                <Button variant="outline" size="sm" onClick={() => navigate('/super-admin/banks')}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Banks
                </Button>
              </div>
            }
          />

          <div className="kardit-card p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bank ID</p>
                <p className="font-medium">{bankId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bank Code</p>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{bank?.bankCode || '-'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Supported Currencies</p>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{bank?.supportedCurrencies?.join(', ') || '-'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created</p>
                <p className="font-medium">{bank?.createdAt ? format(new Date(bank.createdAt), 'MMM d, yyyy') : '-'}</p>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-7 gap-4 mb-6">
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
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totals.activeAffiliates}</p>
                  <p className="text-xs text-muted-foreground">Active Affiliates</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totals.approvedAffiliates}</p>
                  <p className="text-xs text-muted-foreground">Approved Affiliates</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Users className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totals.suspendedAffiliates}</p>
                  <p className="text-xs text-muted-foreground">Suspended Affiliates</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Activity className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {volumeLoading ? '...' : formatMoney(volume?.volumes?.totalTransactionVolume)}
                  </p>
                  <p className="text-xs text-muted-foreground">Transaction Volume</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {volumeLoading ? '...' : formatMoney(volume?.volumes?.totalFundingVolume)}
                  </p>
                  <p className="text-xs text-muted-foreground">Funding Volume</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {volumeLoading ? '...' : formatMoney(volume?.volumes?.totalUnloadVolume)}
                  </p>
                  <p className="text-xs text-muted-foreground">Unload Volume</p>
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
                  placeholder="Search by affiliate name, tenant, or registration number..."
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
                  <SelectItem value="APPROVED">APPROVED</SelectItem>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
            </div>
          </div>

          <div className="kardit-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="p-6 text-sm text-muted-foreground">{error}</div>
            ) : affiliates.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No affiliates found for this bank</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Affiliate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Affiliate ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Tenant ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Registration</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Country</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {affiliates.map((affiliate, i) => (
                      <tr
                        key={affiliate.affiliateId}
                        className={`transition-colors hover:bg-muted/40 cursor-pointer ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
                        onClick={() => navigate(`/super-admin/banks/${bankId}/affiliates/${affiliate.affiliateId}`)}
                      >
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                              <Building2 className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                              <p className="font-medium">{affiliate.legalName}</p>
                              <p className="text-xs text-muted-foreground">{affiliate.tradingName || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{affiliate.affiliateId}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{affiliate.tenantId}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{affiliate.registrationNumber}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{affiliate.country}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {format(new Date(affiliate.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <StatusChip status={statusToChip[affiliate.status] || 'INACTIVE'} label={affiliate.status} />
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/super-admin/banks/${bankId}/affiliates/${affiliate.affiliateId}`);
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
