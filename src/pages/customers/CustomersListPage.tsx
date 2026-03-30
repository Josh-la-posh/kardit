import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { useCustomers } from '@/hooks/useCustomers';

export default function CustomersListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { customers, isLoading, error, total } = useCustomers(search);

  const subtitle = useMemo(() => {
    if (!search.trim()) return `${total} customer${total === 1 ? '' : 's'}`;
    return `${total} match${total === 1 ? '' : 'es'} for "${search.trim()}"`;
  }, [search, total]);

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader title="Customers" subtitle={subtitle} />

          <div className="kardit-card mb-4 p-4">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  placeholder="Search by name, phone, customer ref, or ID number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Supported fields: `name`, `phone`, `customerRefId`, and `idNumber`.
              </p>
            </div>
          </div>

          <div className="kardit-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p className="text-sm">{error}</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p className="text-sm">No customers match the current filters.</p>
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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">KYC Level</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {customers.map((customer, index) => (
                      <tr
                        key={customer.customerRefId}
                        onClick={() => navigate(`/customers/${customer.customerRefId}`)}
                        className={`cursor-pointer transition-colors hover:bg-muted/40 ${index % 2 === 1 ? 'bg-muted/20' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm font-mono text-primary">{customer.customerRefId}</td>
                        <td className="px-4 py-3 text-sm font-medium">{customer.fullName}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{customer.email}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{customer.phone || '-'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{customer.kycLevel}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{format(new Date(customer.createdAt), 'MMM d, yyyy')}</td>
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
