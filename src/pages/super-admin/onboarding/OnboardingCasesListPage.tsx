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

const statusToChip: Record<string, StatusType> = {
  SUBMITTED: 'PENDING',
  UNDER_REVIEW: 'PROCESSING',
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
              <ul className="divide-y divide-border">
                {cases.map((c) => (
                  <li
                    key={c.caseId}
                    className="px-4 py-4 hover:bg-muted/40 cursor-pointer"
                    onClick={() => navigate(`/super-admin/onboarding/cases/${c.caseId}`)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.organization?.legalName || 'Affiliate'}</p>
                        <p className="text-xs text-muted-foreground truncate">Case: {c.caseId}</p>
                      </div>
                      <StatusChip status={statusToChip[c.status] || 'INACTIVE'} label={c.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
