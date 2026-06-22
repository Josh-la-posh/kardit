import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, RefreshCw, Search, SearchX, X } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { queryAffiliates, queryBanks } from '@/services/superAdminApi';
import { useAuth } from '@/hooks/useAuth';
import { useCustomers } from '@/hooks/useCustomers';
import type { CustomerListItem } from '@/hooks/useCustomers';
import type { CustomerSearchRequestContext } from '@/types/customerContracts';
import type { AffiliateQueryItem, BankQueryItem } from '@/types/superAdminContracts';

type KycFilter = 'all' | 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';
type StatusFilter = 'all' | 'DRAFT' | 'ACTIVE' | 'FROZEN' | 'PENDING';

interface LocationState {
  bank?: BankQueryItem;
  affiliate?: AffiliateQueryItem;
}

function findBankById(items: BankQueryItem[], bankId: string) {
  return items.find((item) => item.bankId === bankId) || null;
}

function findAffiliateById(items: AffiliateQueryItem[], affiliateId: string) {
  return items.find((item) => item.affiliateId === affiliateId) || null;
}

export default function AffiliateCustomersPage() {
  const { bankId, affiliateId } = useParams<{ bankId: string; affiliateId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const routeState = location.state as LocationState | null;

  const [query, setQuery] = useState('');
  const [kyc, setKyc] = useState<KycFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [bankSummary, setBankSummary] = useState<BankQueryItem | null>(
    routeState?.bank?.bankId === bankId ? routeState.bank : null
  );
  const [affiliateSummary, setAffiliateSummary] = useState<AffiliateQueryItem | null>(
    routeState?.affiliate?.affiliateId === affiliateId ? routeState.affiliate : null
  );
  const [summaryLoading, setSummaryLoading] = useState(Boolean(bankId && affiliateId));
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const loadSummaries = useCallback(async () => {
    if (!bankId || !affiliateId) {
      setBankSummary(null);
      setAffiliateSummary(null);
      setSummaryError('Affiliate not found');
      setSummaryLoading(false);
      return;
    }

    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const [bankSearchResponse, affiliateSearchResponse] = await Promise.all([
        queryBanks({
          filters: {
            search: bankId,
          },
          page: 1,
          pageSize: 25,
        }).catch(() => null),
        queryAffiliates({
          filters: {
            bankId,
            search: affiliateId,
          },
          page: 1,
          pageSize: 25,
        }).catch(() => null),
      ]);

      let nextBank = findBankById(bankSearchResponse?.data || [], bankId);
      let nextAffiliate = findAffiliateById(affiliateSearchResponse?.data || [], affiliateId);

      if (!nextBank) {
        const fallbackBankResponse = await queryBanks({
          filters: {},
          page: 1,
          pageSize: 100,
        });
        nextBank = findBankById(fallbackBankResponse.data, bankId);
      }

      if (!nextAffiliate) {
        const fallbackAffiliateResponse = await queryAffiliates({
          filters: {
            bankId,
          },
          page: 1,
          pageSize: 100,
        });
        nextAffiliate = findAffiliateById(fallbackAffiliateResponse.data, affiliateId);
      }

      setBankSummary(nextBank);
      setAffiliateSummary(nextAffiliate);

      if (!nextBank || !nextAffiliate) {
        setSummaryError(!nextBank ? 'Bank not found' : 'Affiliate not found');
      }
    } catch (e) {
      setBankSummary(null);
      setAffiliateSummary(null);
      setSummaryError(e instanceof Error ? e.message : 'Failed to load affiliate customers');
    } finally {
      setSummaryLoading(false);
    }
  }, [affiliateId, bankId]);

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  const customerRequestContext = useMemo<CustomerSearchRequestContext | null>(() => {
    if (!user?.id || !affiliateSummary?.tenantId) return null;
    return {
      actorUserId: user.id,
      userType: 'SERVICE_PROVIDER',
      tenantId: affiliateSummary.tenantId,
      scopeType: 'AFFILIATE_TENANT',
    };
  }, [affiliateSummary?.tenantId, user?.id]);

  const { customers, total, isLoading, error, refetch } = useCustomers(query, {
    requestContext: customerRequestContext,
    page,
    pageSize,
    disableStoreEnrichment: true,
    enabled: Boolean(customerRequestContext),
  });

  const filtered = useMemo(() => {
    return customers.filter((customer) => {
      if (kyc !== 'all' && customer.kycLevel !== kyc) return false;
      if (status !== 'all' && customer.status !== status) return false;
      return true;
    });
  }, [customers, kyc, status]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function clearFilters() {
    setQuery('');
    setKyc('all');
    setStatus('all');
    setPage(1);
  }

  if (summaryLoading) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
        <AppLayout navVariant="service-provider">
          <main className="scr-main">
            <div className="container">
              <div className="empty-list profile-empty-card">
                <div className="empty-list-title">Loading affiliate customers...</div>
              </div>
            </div>
          </main>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (!bankSummary || !affiliateSummary) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
        <AppLayout navVariant="service-provider">
          <main className="scr-main">
            <div className="container">
              <div className="empty-list profile-empty-card">
                <div className="empty-list-title">Affiliate customers unavailable</div>
                <div className="empty-list-sub">
                  {summaryError || (!bankSummary ? 'Bank not found' : 'Affiliate not found')}
                </div>
                <button className="btn btn-secondary" onClick={() => navigate(`/super-admin/banks/${bankId || ''}`)}>
                  Back to bank
                </button>
              </div>
            </div>
          </main>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <main className="scr-main">
          <div className="container">
            <Link to={`/super-admin/banks/${bankId}/affiliates/${affiliateId}`} className="back-link">
              Back to affiliate
            </Link>

            <header className="page-head">
              <div>
                <h1 className="page-title">{affiliateSummary.legalName} Customers</h1>
                <p className="page-sub">
                  Search and view customers captured under this affiliate in the super-admin bank portfolio.
                </p>
                <div className="result-meta" style={{ marginTop: 10 }}>
                  <span
                    className="cursor-pointer transition-colors hover:text-foreground"
                    onClick={() => navigate('/super-admin/banks')}
                  >
                    Banks
                  </span>
                  <span className="mx-2">/</span>
                  <span
                    className="cursor-pointer transition-colors hover:text-foreground"
                    onClick={() => navigate(`/super-admin/banks/${bankId}`)}
                  >
                    {bankSummary.bankName}
                  </span>
                  <span className="mx-2">/</span>
                  <span
                    className="cursor-pointer transition-colors hover:text-foreground"
                    onClick={() => navigate(`/super-admin/banks/${bankId}/affiliates/${affiliateId}`)}
                  >
                    {affiliateSummary.legalName}
                  </span>
                  <span className="mx-2">/</span>
                  <span>Customers</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button className="btn btn-secondary" onClick={() => refetch()} disabled={isLoading}>
                  <RefreshCw className={isLoading ? 'spin' : ''} /> Refresh
                </button>
              </div>
            </header>

            <section className="card" style={{ padding: '18px 22px' }}>
              <div className="list-toolbar">
                <div className="search-input-wrap">
                  <Search className="search-icn" />
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Search by name, phone, customer ref, or ID number"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 14 }}>
                <div>
                  <FilterLabel>KYC level</FilterLabel>
                  <div className="filter-chips">
                    <Chip active={kyc === 'all'} onClick={() => { setKyc('all'); setPage(1); }}>All</Chip>
                    <Chip active={kyc === 'LEVEL_3'} onClick={() => { setKyc('LEVEL_3'); setPage(1); }}>Tier 3</Chip>
                    <Chip active={kyc === 'LEVEL_2'} onClick={() => { setKyc('LEVEL_2'); setPage(1); }}>Tier 2</Chip>
                    <Chip active={kyc === 'LEVEL_1'} onClick={() => { setKyc('LEVEL_1'); setPage(1); }}>Tier 1</Chip>
                  </div>
                </div>
                <div>
                  <FilterLabel>Status</FilterLabel>
                  <div className="filter-chips">
                    <Chip active={status === 'all'} onClick={() => { setStatus('all'); setPage(1); }}>All</Chip>
                    <Chip active={status === 'DRAFT'} onClick={() => { setStatus('DRAFT'); setPage(1); }}>Draft</Chip>
                    <Chip active={status === 'ACTIVE'} onClick={() => { setStatus('ACTIVE'); setPage(1); }}>Active</Chip>
                    <Chip active={status === 'FROZEN'} onClick={() => { setStatus('FROZEN'); setPage(1); }}>Frozen</Chip>
                    <Chip active={status === 'PENDING'} onClick={() => { setStatus('PENDING'); setPage(1); }}>Pending</Chip>
                  </div>
                </div>
              </div>
            </section>

            <div className="result-meta">
              Showing <strong>{filtered.length}</strong> of <strong>{total}</strong> customers
            </div>

            <section className="card" style={{ padding: 0 }}>
              <table className="data customers">
                <thead>
                  <tr>
                    <th style={{ width: 170 }}>Reference</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>KYC</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="right" style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-list">
                          <RefreshCw className="spin" />
                          <div className="empty-list-title">Loading customers...</div>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-list">
                          <SearchX />
                          <div className="empty-list-title">Unable to load customers</div>
                          <div className="empty-list-sub">{error}</div>
                          <button className="btn btn-secondary" onClick={() => refetch()}>
                            <RefreshCw /> Try again
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-list">
                          <SearchX />
                          <div className="empty-list-title">No customers match those filters</div>
                          <div className="empty-list-sub">
                            Try changing or clearing the filters above.
                            <br />
                            Search runs against name, phone, reference, and ID number.
                          </div>
                          <button className="btn btn-secondary" onClick={clearFilters}>
                            <X /> Clear filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((customer) => (
                      <CustomerRow
                        key={customer.customerRefId}
                        customer={customer}
                        onOpen={() => navigate(`/super-admin/banks/${bankId}/affiliates/${affiliateId}/customers/${encodeURIComponent(customer.customerRefId)}`)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </section>

            <div className="table-pager">
              <div className="table-pager__meta">
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </div>
              <div className="table-pager__actions">
                <button
                  className="btn btn-secondary table-pager__btn"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page <= 1 || isLoading}
                >
                  Previous
                </button>
                <button
                  className="btn btn-secondary table-pager__btn"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={page >= totalPages || isLoading}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  );
}

function CustomerRow({ customer, onOpen }: { customer: CustomerListItem; onOpen: () => void }) {
  return (
    <tr onClick={onOpen} className="row-clickable">
      <td className="id">{customer.customerRefId}</td>
      <td>
        <div className="customer-name">
          <div className="avatar-sm">{getInitials(customer.fullName)}</div>
          <div>
            <div className="customer-name__title">{customer.fullName}</div>
            <div className="customer-name__sub">{customer.email || customer.phone}</div>
          </div>
        </div>
      </td>
      <td className="mono customer-phone">{customer.phone || '-'}</td>
      <td><KycBadge level={customer.kycLevel} /></td>
      <td><StatusBadge status={customer.status} /></td>
      <td className="meta">{formatShortDate(customer.createdAt)}</td>
      <td className="right">
        <button type="button" className="icon-button" aria-label="View profile" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
          <ChevronRight />
        </button>
      </td>
    </tr>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className={active ? 'filter-chip is-active' : 'filter-chip'} onClick={onClick}>
      {children}
    </button>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <div className="filter-label">{children}</div>;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge status-${status.toLowerCase()}`}>{status}</span>;
}

function KycBadge({ level }: { level: string }) {
  const normalized = level || 'LEVEL_2';
  const value = normalized.replace('LEVEL_', '');
  return <span className={`kyc-pill lvl-${value}`}>Tier {value}</span>;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
