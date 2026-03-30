import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { useBankAffiliates } from '@/hooks/useBankPortal';
import { Building2, Eye, Loader2, RefreshCw, Search } from 'lucide-react';

export default function BankAffiliatesListPage() {
  const navigate = useNavigate();
  const { bankId, affiliates, isLoading, error, refresh } = useBankAffiliates();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return affiliates.filter((affiliate) => {
      if (!query) return true;
      return (
        affiliate.affiliateId.toLowerCase().includes(query) ||
        affiliate.tenantId.toLowerCase().includes(query)
      );
    });
  }, [affiliates, search]);

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <div className="animate-fade-in">
          <PageHeader
            title="Affiliates"
            subtitle={bankId ? `Attached affiliates for ${bankId}` : 'Attached affiliates'}
            actions={
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/bank/affiliate-partnership-requests')}>
                  Pending Requests
                </Button>
                <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
                  <RefreshCw className="mr-1 h-4 w-4" /> Refresh
                </Button>
              </div>
            }
          />

          <div className="kardit-card mb-4 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Search by affiliate ID or tenant ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="kardit-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="p-6 text-sm text-muted-foreground">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No affiliates found for this bank.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Affiliate ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Tenant ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Cards</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Funding Volume</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((affiliate) => (
                      <tr key={affiliate.affiliateId} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-medium">{affiliate.affiliateId}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{affiliate.tenantId}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {affiliate.activeCards} active / {affiliate.totalCards} total
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{affiliate.totalFundingVolume.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/bank/affiliates/${affiliate.affiliateId}`)}>
                            <Eye className="mr-1 h-3 w-3" /> View
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
