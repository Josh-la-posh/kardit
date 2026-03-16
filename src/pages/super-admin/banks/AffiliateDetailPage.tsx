import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { store, type Customer } from '@/stores/mockStore';
import { Search, Building2, Users, CreditCard, ArrowLeft, Mail, Phone, Globe, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

const affiliateStatusToChip: Record<string, StatusType> = {
  ACTIVE: 'SUCCESS',
  PENDING: 'PENDING',
  SUSPENDED: 'WARNING',
  INACTIVE: 'INACTIVE',
};

const customerStatusToChip: Record<string, StatusType> = {
  ACTIVE: 'SUCCESS',
  PENDING: 'PENDING',
  REJECTED: 'FAILED',
};

/**
 * AffiliateDetailPage - Super Admin view of customers under a specific affiliate
 * Shows all customers under the selected affiliate
 */
export default function AffiliateDetailPage() {
  const { bankId, affiliateId } = useParams<{ bankId: string; affiliateId: string }>();
  const navigate = useNavigate();
  
  const bank = bankId ? store.getPlatformBank(bankId) : null;
  const affiliate = affiliateId ? store.getPlatformAffiliate(affiliateId) : null;
  const customers = useMemo(() => 
    affiliateId ? store.getAffiliateCustomers(affiliateId) : [], 
    [affiliateId]
  );
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return customers.filter((customer) => {
      const q = search.toLowerCase();
      const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
      const matchesSearch = !q || 
        fullName.includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.customerId.toLowerCase().includes(q) ||
        (customer.phone || '').includes(q);
      const matchesStatus = statusFilter === 'ALL' || customer.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const statuses = useMemo(() => [...new Set(customers.map(c => c.status))], [customers]);

  // Calculate totals for this affiliate
  const totals = useMemo(() => {
    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'ACTIVE').length,
      pendingCustomers: customers.filter(c => c.status === 'PENDING').length,
    };
  }, [customers]);

  if (!bank || !affiliate) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
        <AppLayout navVariant="service-provider">
          <div className="text-center py-20 text-muted-foreground">
            {!bank ? 'Bank not found' : 'Affiliate not found'}
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
            title={affiliate.name}
            subtitle={`Customers under ${affiliate.name}`}
            actions={
              <div className="flex items-center gap-2">
                <StatusChip status={affiliateStatusToChip[affiliate.status] || 'INACTIVE'} label={affiliate.status} />
                <Button variant="outline" size="sm" onClick={() => navigate(`/super-admin/banks/${bankId}`)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to {bank.name}
                </Button>
              </div>
            }
          />

          {/* Breadcrumb */}
          <div className="mb-6 text-sm text-muted-foreground">
            <span 
              className="hover:text-foreground cursor-pointer transition-colors"
              onClick={() => navigate('/super-admin/banks')}
            >
              Banks
            </span>
            <span className="mx-2">/</span>
            <span 
              className="hover:text-foreground cursor-pointer transition-colors"
              onClick={() => navigate(`/super-admin/banks/${bankId}`)}
            >
              {bank.name}
            </span>
            <span className="mx-2">/</span>
            <span className="text-foreground">{affiliate.name}</span>
          </div>

          {/* Affiliate Info Card */}
          <div className="kardit-card p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Registration Number</p>
                <p className="font-medium">{affiliate.registrationNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Country</p>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{affiliate.country}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contact Person</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{affiliate.contactName}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contact Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{affiliate.contactEmail}</span>
                </div>
              </div>
            </div>
            {(affiliate.contactPhone || affiliate.provisionedAt) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4 pt-4 border-t border-border">
                {affiliate.contactPhone && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contact Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{affiliate.contactPhone}</span>
                    </div>
                  </div>
                )}
                {affiliate.provisionedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Provisioned On</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{format(new Date(affiliate.provisionedAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totals.totalCustomers}</p>
                  <p className="text-xs text-muted-foreground">Total Customers</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totals.activeCustomers}</p>
                  <p className="text-xs text-muted-foreground">Active Customers</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Users className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totals.pendingCustomers}</p>
                  <p className="text-xs text-muted-foreground">Pending Customers</p>
                </div>
              </div>
            </div>
            <div className="kardit-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <CreditCard className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{affiliate.totalCards.toLocaleString()}</p>
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
                  placeholder="Search by name, email, phone, or customer ID..."
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

          {/* Customers Table */}
          <div className="kardit-card overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No customers found for this affiliate</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((customer, i) => (
                      <tr
                        key={customer.id}
                        className={`transition-colors hover:bg-muted/40 ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                          {customer.customerId}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-muted">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                              {customer.embossName && (
                                <p className="text-xs text-muted-foreground">{customer.embossName}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {customer.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {customer.phone || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusChip status={customerStatusToChip[customer.status] || 'INACTIVE'} label={customer.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {format(new Date(customer.createdAt), 'MMM d, yyyy')}
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
