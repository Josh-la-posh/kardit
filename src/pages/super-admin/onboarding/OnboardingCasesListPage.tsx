import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { useReviewerOnboardingCases } from '@/hooks/useOnboarding';
import { Loader2 } from 'lucide-react';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { format } from 'date-fns';

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

export default function OnboardingCasesListPage() {
  const navigate = useNavigate();
  const { cases, isLoading, error, refresh } = useReviewerOnboardingCases();

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <PageHeader
            title="Onboarding cases"
            subtitle="Review affiliate onboarding & KYB submissions"
            actions={<Button variant="outline" size="sm" onClick={refresh}>Refresh</Button>}
          />

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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Case ID</th>
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
                        <td className="px-4 py-3 text-sm max-w-[220px] truncate text-muted-foreground">{c.contact?.contactEmail || '—'}</td>
                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground max-w-[240px] truncate">{c.caseId}</td>
                        <td className="px-4 py-3 text-sm"><StatusChip status={statusToChip[c.status] || 'INACTIVE'} label={c.status} /></td>
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
