import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Eye, Search, User, Users } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { store } from '@/stores/mockStore';

const customerStatusToChip: Record<string, StatusType> = {
  ACTIVE: 'SUCCESS',
  PENDING: 'PENDING',
  REJECTED: 'FAILED',
  BLOCKED: 'WARNING',
};

export default function AffiliateCustomersPage() {
  const { bankId, affiliateId } = useParams<{ bankId: string; affiliateId: string }>();
  const navigate = useNavigate();

  const bank = bankId ? store.getPlatformBank(bankId) : null;
  const affiliate = affiliateId ? store.getPlatformAffiliate(affiliateId) : null;
  const customers = useMemo(() => (affiliateId ? store.getAffiliateCustomers(affiliateId) : []), [affiliateId]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const statuses = useMemo(() => [...new Set(customers.map((c) => c.status))], [customers]);
  const filtered = useMemo(() => {
    return customers.filter((customer) => {
      const q = search.toLowerCase();
      const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.customerId.toLowerCase().includes(q) ||
        (customer.phone || '').includes(q);
      const matchesStatus = statusFilter === 'ALL' || customer.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

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
            title={`${affiliate.name} Customers`}
            subtitle={`${filtered.length} of ${customers.length} customers`}
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/super-admin/banks/${bankId}/affiliates/${affiliateId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Affiliate
              </Button>
            }
          />

          <div className="mb-6 text-sm text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer transition-colors" onClick={() => navigate('/super-admin/banks')}>
              Banks
            </span>
            <span className="mx-2">/</span>
            <span className="hover:text-foreground cursor-pointer transition-colors" onClick={() => navigate(`/super-admin/banks/${bankId}`)}>
              {bank.name}
            </span>
            <span className="mx-2">/</span>
            <span className="hover:text-foreground cursor-pointer transition-colors" onClick={() => navigate(`/super-admin/banks/${bankId}/affiliates/${affiliateId}`)}>
              {affiliate.name}
            </span>
            <span className="mx-2">/</span>
            <span className="text-foreground">Customers</span>
          </div>

          <div className="kardit-card p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Search by name, email..."
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
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="kardit-card overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No customers found for this affiliate.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {/* <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer ID</th> */}
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((customer, index) => (
                      <tr key={customer.id} className={`transition-colors hover:bg-muted/40 ${index % 2 === 1 ? 'bg-muted/20' : ''}`}>
                        {/* <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{customer.customerId}</td> */}
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-muted">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                              {customer.embossName && <p className="text-xs text-muted-foreground">{customer.embossName}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{customer.email}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{customer.phone || '-'}</td>
                        <td className="px-4 py-3">
                          <StatusChip status={customerStatusToChip[customer.status] || 'INACTIVE'} label={customer.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{format(new Date(customer.createdAt), 'MMM d, yyyy')}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/super-admin/banks/${bankId}/affiliates/${affiliateId}/customers/${customer.customerId}`)}
                          >
                            <Eye className="h-3 w-3 mr-1" /> View Details
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
