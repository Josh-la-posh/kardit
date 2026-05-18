import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ChevronRight, Loader2, RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip, type StatusType } from '@/components/ui/status-chip';
import { useAuth } from '@/hooks/useAuth';
import { useCustomers } from '@/hooks/useCustomers';
import { store } from '@/stores/mockStore';

const kycFilterOptions = ['ALL', 'LEVEL_3', 'LEVEL_2', 'LEVEL_1'] as const;
const statusFilterOptions = ['ALL', 'PENDING', 'ACTIVE', 'REJECTED', 'BLOCKED'] as const;

const customerStatusToChip: Record<string, StatusType> = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  REJECTED: 'REJECTED',
  BLOCKED: 'BLOCKED',
};

const kycToneMap: Record<string, string> = {
  LEVEL_1: 'border-warning/30 bg-warning/10 text-warning',
  LEVEL_2: 'border-info/30 bg-info/10 text-info',
  LEVEL_3: 'border-success/30 bg-success/10 text-success',
};

function formatKycLevel(kycLevel: string) {
  return kycLevel.replace('LEVEL_', 'Tier ');
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-primary/25 bg-primary/10 text-primary'
          : 'border-border bg-background/60 text-muted-foreground hover:border-primary/25 hover:text-foreground',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

export default function CustomersListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState<(typeof kycFilterOptions)[number]>('ALL');
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilterOptions)[number]>('ALL');
  const { customers, isLoading, error, refetch } = useCustomers(search);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesKyc = kycFilter === 'ALL' || customer.kycLevel === kycFilter;
      const matchesStatus = statusFilter === 'ALL' || customer.status === statusFilter;
      return matchesKyc && matchesStatus;
    });
  }, [customers, kycFilter, statusFilter]);

  const customerCardCounts = useMemo(() => {
    const tenantCustomers = store.getCustomers(user?.tenantId);
    return new Map(
      tenantCustomers.map((customer) => [customer.customerId, store.getCardsByCustomer(customer.id, customer.tenantId).length])
    );
  }, [user?.tenantId]);

  const subtitle = useMemo(() => {
    if (!search.trim() && kycFilter === 'ALL' && statusFilter === 'ALL') {
      return `${customers.length} customer${customers.length === 1 ? '' : 's'}`;
    }
    return `${filteredCustomers.length} of ${customers.length} customer${customers.length === 1 ? '' : 's'}`;
  }, [customers.length, filteredCustomers.length, kycFilter, search, statusFilter]);

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in space-y-6">
          <PageHeader
            title="Customers"
            subtitle={subtitle}
            actions={
              <Button variant="outline" onClick={() => refetch()} disabled={isLoading} className="gap-2">
                <RefreshCw className={['h-4 w-4', isLoading ? 'animate-spin' : ''].join(' ')} />
                Refresh
              </Button>
            }
          />

          <section className="rounded-[28px] border border-border/80 bg-card px-6 py-6 shadow-[0_18px_50px_-32px_rgba(0,0,0,0.42)]">
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="flex h-12 w-full rounded-xl border border-border bg-background/70 px-4 py-2 pl-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  placeholder="Search by name, phone, customer ref, BVN, or NIN"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    KYC level
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {kycFilterOptions.map((option) => (
                      <FilterPill
                        key={option}
                        active={kycFilter === option}
                        label={option === 'ALL' ? 'All' : formatKycLevel(option)}
                        onClick={() => setKycFilter(option)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Status
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {statusFilterOptions.map((option) => (
                      <FilterPill
                        key={option}
                        active={statusFilter === option}
                        label={option === 'ALL' ? 'All' : option.charAt(0) + option.slice(1).toLowerCase()}
                        onClick={() => setStatusFilter(option)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredCustomers.length}</span> of{' '}
            <span className="font-semibold text-foreground">{customers.length}</span> customers
          </p>

          <section className="overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-[0_18px_50px_-32px_rgba(0,0,0,0.42)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="py-16 text-center text-sm text-muted-foreground">{error}</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No customers match the current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-border/80 bg-background/40">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Reference
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Phone
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        KYC
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Cards
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Created
                      </th>
                      <th className="w-12 px-6 py-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/80">
                    {filteredCustomers.map((customer) => (
                      <tr
                        key={customer.customerRefId}
                        onClick={() => navigate(`/customers/${customer.customerRefId}`)}
                        className="cursor-pointer transition-colors hover:bg-background/40"
                      >
                        <td className="px-6 py-5 align-middle text-sm font-mono font-medium text-foreground">
                          {customer.customerRefId}
                        </td>
                        <td className="px-6 py-5 align-middle">
                          <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-medium text-primary">
                              {getInitials(customer.fullName)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-base font-semibold text-foreground">{customer.fullName}</p>
                              <p className="truncate text-sm text-muted-foreground">{customer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 align-middle text-sm text-muted-foreground">
                          {customer.phone || '-'}
                        </td>
                        <td className="px-6 py-5 align-middle">
                          <span
                            className={[
                              'inline-flex rounded-full border px-3 py-1 text-sm font-medium',
                              kycToneMap[customer.kycLevel] || 'border-border bg-muted/50 text-muted-foreground',
                            ].join(' ')}
                          >
                            {formatKycLevel(customer.kycLevel)}
                          </span>
                        </td>
                        <td className="px-6 py-5 align-middle">
                          <StatusChip
                            status={customerStatusToChip[customer.status] || 'INACTIVE'}
                            label={customer.status}
                            showIcon={false}
                          />
                        </td>
                        <td className="px-6 py-5 align-middle text-sm text-muted-foreground">
                          {customerCardCounts.get(customer.customerId) ?? 0}
                        </td>
                        <td className="px-6 py-5 align-middle text-sm text-muted-foreground">
                          {format(new Date(customer.createdAt), 'dd MMM yyyy')}
                        </td>
                        <td className="px-6 py-5 align-middle text-right text-muted-foreground">
                          <ChevronRight className="ml-auto h-5 w-5" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
