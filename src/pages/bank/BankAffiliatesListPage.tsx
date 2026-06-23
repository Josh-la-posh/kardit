import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { PaginatedTable } from '@/components/ui/paginated-table';
import { useBankAffiliates } from '@/hooks/useBankPortal';
import type { BankAffiliateSummary } from '@/types/bankPortalContracts';
import { Eye, RefreshCw, Search } from 'lucide-react';

export default function BankAffiliatesListPage() {
  const navigate = useNavigate();
  const { affiliates, isLoading, error, refresh } = useBankAffiliates();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    const items = Array.isArray(affiliates) ? affiliates : [];
    return items.filter((affiliate) => {
      if (!query) return true;
      const affiliateId = affiliate.affiliateId || '';
      const tenantId = affiliate.tenantId || '';
      const affiliateName = affiliate.affiliateName || '';
      return (
        affiliateId.toLowerCase().includes(query) ||
        tenantId.toLowerCase().includes(query) ||
        affiliateName.toLowerCase().includes(query)
      );
    });
  }, [affiliates, search]);

  const totalFunding = useMemo(
    () => filtered.reduce((sum, affiliate) => sum + (affiliate.totalFundingVolume || 0), 0),
    [filtered]
  );
  const totalCards = useMemo(
    () => filtered.reduce((sum, affiliate) => sum + (affiliate.totalCards || 0), 0),
    [filtered]
  );
  const totalActiveCards = useMemo(
    () => filtered.reduce((sum, affiliate) => sum + (affiliate.activeCards || 0), 0),
    [filtered]
  );

  const columns = useMemo(
    () => [
      {
        key: 'affiliateName',
        header: 'Affiliate',
        className: 'text-sm',
        render: (affiliate: BankAffiliateSummary) => (
          <div>
            <p className="font-medium text-foreground">{affiliate.affiliateName || 'Unnamed Affiliate'}</p>
          </div>
        ),
      },
      // {
      //   key: 'tenantId',
      //   header: 'Tenant ID',
      //   className: 'text-sm text-muted-foreground',
      //   render: (affiliate: BankAffiliateSummary) => affiliate.tenantId || '-',
      // },
      // {
      //   key: 'totalCards',
      //   header: 'Total Cards',
      //   className: 'text-sm text-muted-foreground',
      //   render: (affiliate: BankAffiliateSummary) => affiliate.totalCards.toLocaleString(),
      // },
      // {
      //   key: 'activeCards',
      //   header: 'Active Cards',
      //   className: 'text-sm text-muted-foreground',
      //   render: (affiliate: BankAffiliateSummary) => affiliate.activeCards.toLocaleString(),
      // },
      {
        key: 'totalFundingVolume',
        header: 'Funding Volume',
        className: 'text-sm text-muted-foreground',
        render: (affiliate: BankAffiliateSummary) => affiliate.totalFundingVolume.toLocaleString(),
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'text-sm',
        render: (affiliate: BankAffiliateSummary) => (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/bank/affiliates/${affiliate.affiliateId}`);
            }}
          >
            <Eye className="mr-1 h-3 w-3" /> View
          </Button>
        ),
      },
    ],
    [navigate]
  );

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">Affiliates</h1>
                <p className="page-sub">Portfolio affiliates attached to this bank.</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/bank/affiliate-partnership-requests')}>
                  Pending Requests
                </button>
                <button className="btn btn-ghost btn-sm" onClick={refresh} disabled={isLoading}>
                  <RefreshCw className={isLoading ? 'spin' : ''} /> Refresh
                </button>
              </div>
            </header>

            {/* <section className="kpis" style={{ marginTop: 14 }}>
              <Kpi label="Affiliates" value={String(filtered.length)} sub="Within current filter" />
              <Kpi label="Total cards" value={totalCards.toLocaleString()} sub="Across listed affiliates" />
              <Kpi label="Active cards" value={totalActiveCards.toLocaleString()} sub="Currently active" />
              <Kpi label="Funding" value={totalFunding.toLocaleString()} sub="Aggregate funding volume" />
            </section> */}

            <section className="bch-card card-pad" style={{ marginTop: 14 }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Search by affiliate name, ID, or tenant ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </section>

            <PaginatedTable<BankAffiliateSummary>
              className="mt-4"
              columns={columns}
              rows={filtered}
              isLoading={isLoading}
              error={error}
              emptyMessage="No affiliates found for this bank."
              rowKey={(affiliate) => affiliate.affiliateId}
              onRowClick={(affiliate) => navigate(`/bank/affiliates/${affiliate.affiliateId}`)}
              page={1}
              pageSize={Math.max(filtered.length, 1)}
              total={Math.max(filtered.length, 1)}
              onPageChange={() => {}}
            />
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}
