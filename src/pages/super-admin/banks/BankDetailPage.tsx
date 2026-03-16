import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { store, type PlatformAffiliate } from '@/stores/mockStore';
import { Search, Building2, Eye, Users, CreditCard, ArrowLeft, Mail, Phone, Globe, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const statusToChip: Record<string, StatusType> = {
  ACTIVE: 'SUCCESS',
  PENDING: 'PENDING',
  SUSPENDED: 'WARNING',
  INACTIVE: 'INACTIVE',
};

/**
 * BankDetailPage - Super Admin view of a specific bank's affiliates
 * Shows all affiliates under a selected bank
 */
export default function BankDetailPage() {
  const { bankId } = useParams<{ bankId: string }>();
  const navigate = useNavigate();
  
  const bank = bankId ? store.getPlatformBank(bankId) : null;
  const affiliates = useMemo(() => 
    bankId ? store.getPlatformAffiliates(bankId) : [], 
    [bankId]
  );
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return affiliates.filter((affiliate) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || 
        affiliate.name.toLowerCase().includes(q) ||
        affiliate.contactEmail.toLowerCase().includes(q) ||
        affiliate.contactName.toLowerCase().includes(q) ||
        affiliate.registrationNumber.toLowerCase().includes(q) ||
        affiliate.country.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || affiliate.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [affiliates, search, statusFilter]);

  const statuses = useMemo(() => [...new Set(affiliates.map(a => a.status))], [affiliates]);

  // Calculate totals for this bank
  const totals = useMemo(() => {
    return {
      totalAffiliates: affiliates.length,
      activeAffiliates: affiliates.filter(a => a.status === 'ACTIVE').length,
      totalCustomers: affiliates.reduce((sum, a) => sum + a.totalCustomers, 0),
      totalCards: affiliates.reduce((sum, a) => sum + a.totalCards, 0),
    };
  }, [affiliates]);

  if (!bank) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
        <AppLayout navVariant="service-provider">
          <div className="text-center py-20 text-muted-foreground">
            Bank not found
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <PageHeader
            title={bank.name}
            subtitle={`Affiliates under ${bank.name}`}
            actions={
              <div className="flex items-center gap-2">
                <StatusChip status={statusToChip[bank.status] || 'INACTIVE'} label={bank.status} />
                <Button variant="outline" size="sm" onClick={() => navigate('/super-admin/banks')}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Banks
                </Button>
              </div>
            }
          />

          {/* Bank Info Card */}
          <div className="kardit-card p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bank Code</p>
                <p className="font-medium">{bank.code}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Country</p>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{bank.country}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contact Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{bank.contactEmail}</span>
                </div>
              </div>
              {bank.contactPhone && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contact Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{bank.contactPhone}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totals.activeAffiliates}/{totals.totalAffiliates}</p>
                  <p className="text-xs text-muted-foreground">Active Affiliates</p>
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
            <div className="kardit-card p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Member Since</div>
              <p className="text-lg font-medium">{format(new Date(bank.createdAt), 'MMM d, yyyy')}</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="kardit-card p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Search by name, contact, registration number..."
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

          {/* Affiliates Table */}
          <div className="kardit-card overflow-hidden">
            {filtered.length === 0 ? (
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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Registration</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Customers</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Cards</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Provisioned</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((affiliate, i) => (
                      <tr
                        key={affiliate.id}
                        className={`transition-colors hover:bg-muted/40 cursor-pointer ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
                        onClick={() => navigate(`/super-admin/banks/${bankId}/affiliates/${affiliate.id}`)}
                      >
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                              <Building2 className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                              <p className="font-medium">{affiliate.name}</p>
                              <p className="text-xs text-muted-foreground">{affiliate.country}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {affiliate.registrationNumber}
                        </td>
                        <td className="px-4 py-3 text-sm max-w-[200px]">
                          <p className="truncate">{affiliate.contactName}</p>
                          <p className="text-xs text-muted-foreground truncate">{affiliate.contactEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {affiliate.totalCustomers.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {affiliate.totalCards.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {affiliate.provisionedAt 
                            ? format(new Date(affiliate.provisionedAt), 'MMM d, yyyy')
                            : '—'}
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
                              navigate(`/super-admin/banks/${bankId}/affiliates/${affiliate.id}`);
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
