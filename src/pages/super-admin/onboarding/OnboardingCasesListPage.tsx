import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReviewerOnboardingCases } from '@/hooks/useOnboarding';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { format } from 'date-fns';
import type { OnboardingCaseStatus } from '@/types/onboardingContracts';
import { PaginatedTable } from '@/components/ui/paginated-table';
import { AppCard, AppCardHeader, AppCardSub, AppCardTitle } from '@/components/ui/app-card';
import { RefreshCw, Search, X } from 'lucide-react';

const statusToChip: Record<string, StatusType> = {
  SUBMITTED: 'PENDING',
  UNDER_REVIEW: 'PROCESSING',
  IN_REVIEW: 'PROCESSING',
  CLARIFICATION_REQUIRED: 'WARNING',
  CLARIFICATION_REQUESTED: 'WARNING',
  REJECTED: 'FAILED',
  APPROVED: 'SUCCESS',
  PROVISIONED: 'SUCCESS',
};

const statusOptions: Array<OnboardingCaseStatus | 'ALL'> = [
  'ALL',
  'APPROVED',
  'REJECTED',
  'SUBMITTED',
  'CLARIFICATION_REQUIRED',
  // 'IN_REVIEW',
  // 'UNDER_REVIEW',
  // 'CLARIFICATION_REQUESTED',
  // 'PROVISIONED',
];

const pageSizeOptions = ['25', '50', '100'];

export default function OnboardingCasesListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialName = searchParams.get('Name') || '';
  const initialPage = Number(searchParams.get('Page') || '1');
  const initialPageSize = Number(searchParams.get('PageSize') || '25');
  const [statusFilter, setStatusFilter] = useState<OnboardingCaseStatus | 'ALL'>('ALL');
  const [nameFilter, setNameFilter] = useState(initialName);
  const [currentPage, setCurrentPage] = useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);
  const [selectedPageSize, setSelectedPageSize] = useState(
    Number.isFinite(initialPageSize) && initialPageSize > 0 ? initialPageSize : 25
  );
  const hasActiveFilters = statusFilter !== 'ALL' || selectedPageSize !== 25 || nameFilter.trim().length > 0;

  const { cases, total, page, pageSize, isLoading, error, refresh } = useReviewerOnboardingCases({
    name: nameFilter,
    status: statusFilter,
    page: currentPage,
    pageSize: selectedPageSize,
  });

  useEffect(() => {
    const next = new URLSearchParams();
    if (nameFilter.trim()) next.set('Name', nameFilter.trim());
    next.set('Page', String(currentPage));
    next.set('PageSize', String(selectedPageSize));
    setSearchParams(next, { replace: true });
  }, [currentPage, nameFilter, selectedPageSize, setSearchParams]);

  const subtitle = useMemo(() => {
    const statusText = statusFilter === 'ALL' ? 'all statuses' : statusFilter;
    return `${total} case${total === 1 ? '' : 's'} across ${statusText}`;
  }, [statusFilter, total]);
  const currentStatusLabel = statusFilter === 'ALL' ? 'All statuses' : statusFilter;

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as OnboardingCaseStatus | 'ALL');
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setSelectedPageSize(Number(value));
    setCurrentPage(1);
  };

  const handleNameChange = (value: string) => {
    setNameFilter(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setNameFilter('');
    setStatusFilter('ALL');
    setSelectedPageSize(25);
    setCurrentPage(1);
  };

  const columns = useMemo(
    () => [
      {
        key: 'submitted',
        header: 'Submitted',
        className: 'whitespace-nowrap',
        render: (c: (typeof cases)[number]) => format(new Date(c.submittedAt), 'MMM d, yyyy HH:mm'),
      },
      {
        key: 'affiliate',
        header: 'Affiliate',
        className: 'max-w-[260px] truncate',
        render: (c: (typeof cases)[number]) => c.organization?.legalName || 'Affiliate',
      },
      {
        key: 'status',
        header: 'Status',
        render: (c: (typeof cases)[number]) => (
          <StatusChip status={statusToChip[c.status] || 'INACTIVE'} label={c.status} />
        ),
      },
    ],
    [cases]
  );

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">Onboarding cases</h1>
                <p className="page-sub">Search and review onboarding submissions. Click any row to open case details.</p>
              </div>
              <div className="row-end">
                <Button variant="outline" size="sm" onClick={refresh}>
                  <RefreshCw className={isLoading ? 'mr-1 h-4 w-4 animate-spin' : 'mr-1 h-4 w-4'} />
                  Refresh
                </Button>
              </div>
            </header>

            <AppCard padded="md" style={{ marginTop: 16 }}>
              <AppCardHeader style={{ marginBottom: 12 }}>
                <div>
                  <AppCardTitle>Filters</AppCardTitle>
                  <AppCardSub>{subtitle}</AppCardSub>
                </div>
              </AppCardHeader>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9 pr-9"
                    value={nameFilter}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Search by affiliate name"
                  />
                  {nameFilter.trim() ? (
                    <button
                      type="button"
                      aria-label="Clear name search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => handleNameChange('')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === 'ALL' ? 'All statuses' : status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(selectedPageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Page size" />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size} / page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="btn btn-secondary" size="md" variant="outline" onClick={handleClearFilters} disabled={!hasActiveFilters}>
                  Clear
                </Button>
              </div>
            </AppCard>

            <AppCard style={{ marginTop: 14, overflow: 'hidden' }}>
              <PaginatedTable
                columns={columns}
                rows={cases}
                isLoading={isLoading}
                error={error}
                emptyMessage="No cases yet."
                onRowClick={(row) => navigate(`/super-admin/onboarding/cases/${row.caseId}`)}
                rowKey={(row) => row.caseId}
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setCurrentPage}
                className="border-0 shadow-none rounded-none"
              />
            </AppCard>
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
