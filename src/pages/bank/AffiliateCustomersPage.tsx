import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Eye, Loader2, Search, User, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBankAffiliates } from '@/hooks/useBankPortal';
import { useCustomers } from '@/hooks/useCustomers';
import type { CustomerSearchRequestContext } from '@/types/customerContracts';

export default function AffiliateCustomersPage() {
  const { affiliateId } = useParams<{ affiliateId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { affiliates } = useBankAffiliates();
  const [search, setSearch] = useState('');

  const basePath = location.pathname.startsWith('/bank/active-affiliates')
    ? `/bank/active-affiliates/${affiliateId}`
    : `/bank/affiliates/${affiliateId}`;

  const affiliate = useMemo(
    () => affiliates.find((item) => item.affiliateId === affiliateId) || null,
    [affiliates, affiliateId]
  );

  const customerRequestContext = useMemo<CustomerSearchRequestContext | null>(() => {
    if (!user?.id || !affiliate?.tenantId) return null;
    return {
      actorUserId: user.id,
      userType: 'AFFILIATE',
      tenantId: affiliate.tenantId,
      scopeType: 'AFFILIATE_TENANT',
    };
  }, [affiliate?.tenantId, user?.id]);

  const { customers, total, isLoading, error } = useCustomers(search, {
    requestContext: customerRequestContext,
    page: 1,
    pageSize: 20,
  });

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(basePath)} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <PageHeader
              title={`${affiliate?.affiliateName || 'Affiliate'} Customers`}
              subtitle={`${total} customer${total === 1 ? '' : 's'}`}
              showBack={false}
            />
          </div>

          <Card className="border-0 shadow-lg p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name, phone, customer reference, or ID number..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="p-6 text-sm text-muted-foreground">{error}</div>
            ) : customers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No customers found for this affiliate.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">KYC Level</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {customers.map((customer, index) => (
                      <tr key={customer.customerRefId} className={index % 2 === 1 ? 'bg-muted/20' : ''}>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full bg-muted p-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{customer.fullName}</p>
                              <p className="font-mono text-xs text-muted-foreground">{customer.customerRefId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{customer.phone || '-'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{customer.email || '-'}</td>
                        <td className="px-4 py-3 text-sm font-medium">{customer.kycLevel || '-'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {format(new Date(customer.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`${basePath}/customers/${customer.customerRefId}`)}
                          >
                            <Eye className="mr-1 h-3 w-3" /> View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
