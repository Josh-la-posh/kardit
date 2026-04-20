import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReviewerOnboardingCases } from '@/hooks/useOnboarding';
import { Loader2 } from 'lucide-react';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { format } from 'date-fns';
import type { OnboardingCaseStatus } from '@/types/onboardingContracts';

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
  'SUBMITTED',
  'IN_REVIEW',
  'UNDER_REVIEW',
  'CLARIFICATION_REQUIRED',
  'CLARIFICATION_REQUESTED',
  'REJECTED',
  'APPROVED',
  'PROVISIONED',
];

const pageSizeOptions = ['10', '25', '50', '100'];

export default function OnboardingCasesListPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<OnboardingCaseStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState(25);
  const { cases, total, page, pageSize, isLoading, error, refresh } = useReviewerOnboardingCases({
    status: statusFilter,
    page: currentPage,
    pageSize: selectedPageSize,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const subtitle = useMemo(() => {
    const statusText = statusFilter === 'ALL' ? 'all statuses' : statusFilter;
    return `${total} case${total === 1 ? '' : 's'} across ${statusText}`;
  }, [statusFilter, total]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as OnboardingCaseStatus | 'ALL');
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setSelectedPageSize(Number(value));
    setCurrentPage(1);
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <PageHeader
            title="Onboarding cases"
            subtitle={subtitle}
            actions={<Button variant="outline" size="sm" onClick={refresh}>Refresh</Button>}
          />

          <div className="kardit-card mb-4 p-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_140px]">
              <div>
                <p className="text-sm font-medium">Filters</p>
                <p className="text-xs text-muted-foreground">Filter onboarding cases by review status and page size.</p>
              </div>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === 'ALL' ? 'All Statuses' : status}
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
            </div>
          </div>

          <div className="kardit-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : error ? (
              <div className="p-6 text-sm text-muted-foreground">{error}</div>
            ) : cases.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">No cases yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Submitted</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Affiliate</th>
                      {/* <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Contact</th> */}
                      {/* <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Case ID</th> */}
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {cases.map((c, i) => (
                      <tr
                        key={c.caseId}
                        onClick={() => navigate(`/super-admin/onboarding/cases/${c.caseId}`)}
                        className={`transition-colors hover:bg-muted/40 cursor-pointer ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{format(new Date(c.submittedAt), 'MMM d, yyyy HH:mm')}</td>
                        <td className="px-4 py-3 text-sm max-w-[260px] truncate">{c.organization?.legalName || 'Affiliate'}</td>
                        {/* // <td className="px-4 py-3 text-sm max-w-[220px] truncate text-muted-foreground">{c.contact?.contactEmail || '—'}</td> */}
                        {/* <td className="px-4 py-3 text-sm font-mono text-muted-foreground max-w-[240px] truncate">{c.caseId}</td> */}
                        <td className="px-4 py-3 text-sm"><StatusChip status={statusToChip[c.status] || 'INACTIVE'} label={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} • {total} total case{total === 1 ? '' : 's'}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading || currentPage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading || currentPage >= totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
