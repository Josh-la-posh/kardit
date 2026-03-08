import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useReviewerOnboardingCases } from '@/hooks/useOnboarding';
import { Search, Loader2, Building2, Eye } from 'lucide-react';
import { format } from 'date-fns';

const statusToChip: Record<string, StatusType> = {
  SUBMITTED: 'PENDING',
  UNDER_REVIEW: 'PROCESSING',
  CLARIFICATION_REQUESTED: 'WARNING',
  REJECTED: 'FAILED',
  APPROVED: 'SUCCESS',
  PROVISIONED: 'SUCCESS',
};

/**
 * BankAffiliatesListPage - Bank portal view of affiliate onboarding applications
 * Banks can view, approve, or reject affiliates under their portfolio
 */
export default function BankAffiliatesListPage() {
  const navigate = useNavigate();
  const { cases, isLoading, error, refresh } = useReviewerOnboardingCases();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || 
        c.organization?.legalName?.toLowerCase().includes(q) ||
        c.contact?.contactEmail?.toLowerCase().includes(q) ||
        c.caseId.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cases, search, statusFilter]);

  const statuses = useMemo(() => [...new Set(cases.map(c => c.status))], [cases]);

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <div className="animate-fade-in">
          <PageHeader
            title="Affiliates"
            subtitle="Review and manage affiliate onboarding applications"
            actions={<Button variant="outline" size="sm" onClick={refresh}>Refresh</Button>}
          />

          {/* Filter Bar */}
          <div className="kardit-card p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Search by name, email, or case ID..."
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

          {/* Table */}
          <div className="kardit-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="p-6 text-sm text-muted-foreground">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No affiliate applications found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Submitted</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Affiliate Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Country</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((affiliate, i) => (
                      <tr
                        key={affiliate.caseId}
                        className={`transition-colors hover:bg-muted/40 ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {format(new Date(affiliate.submittedAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-sm max-w-[200px]">
                          <p className="font-medium truncate">{affiliate.organization?.legalName || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground truncate">{affiliate.organization?.registrationNumber}</p>
                        </td>
                        <td className="px-4 py-3 text-sm max-w-[200px]">
                          <p className="truncate">{affiliate.contact?.contactName || '—'}</p>
                          <p className="text-xs text-muted-foreground truncate">{affiliate.contact?.contactEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {affiliate.organization?.country || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusChip status={statusToChip[affiliate.status] || 'INACTIVE'} label={affiliate.status} />
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/bank/affiliates/${affiliate.caseId}`)}
                          >
                            <Eye className="h-3 w-3 mr-1" /> Review
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
