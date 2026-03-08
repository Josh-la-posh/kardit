import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { KarditLogo } from '@/components/KarditLogo';
import { Button } from '@/components/ui/button';
import { useOnboardingCase } from '@/hooks/useOnboarding';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { format } from 'date-fns';

const statusToChip: Record<string, StatusType> = {
  DRAFT: 'INACTIVE',
  SUBMITTED: 'PENDING',
  UNDER_REVIEW: 'PROCESSING',
  CLARIFICATION_REQUESTED: 'WARNING',
  REJECTED: 'FAILED',
  APPROVED: 'SUCCESS',
  PROVISIONED: 'SUCCESS',
};

export default function OnboardingStatusPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { caseItem, isLoading, error, refresh } = useOnboardingCase(caseId);

  const steps = [
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'UNDER_REVIEW', label: 'Under review' },
    { key: 'DECISION', label: 'Decision' },
    { key: 'PROVISIONED', label: 'Provisioned' },
  ] as const;

  const stepState = (status: string, stepKey: (typeof steps)[number]['key']): 'DONE' | 'CURRENT' | 'TODO' => {
    const done = (k: string) => ({
      SUBMITTED: ['SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_REQUESTED', 'REJECTED', 'APPROVED', 'PROVISIONED'],
      UNDER_REVIEW: ['UNDER_REVIEW', 'CLARIFICATION_REQUESTED', 'REJECTED', 'APPROVED', 'PROVISIONED'],
      DECISION: ['CLARIFICATION_REQUESTED', 'REJECTED', 'APPROVED', 'PROVISIONED'],
      PROVISIONED: ['PROVISIONED'],
    } as const)[k as 'SUBMITTED' | 'UNDER_REVIEW' | 'DECISION' | 'PROVISIONED']?.includes(status as any);

    if (stepKey === 'SUBMITTED') {
      if (done('SUBMITTED')) return status === 'SUBMITTED' ? 'CURRENT' : 'DONE';
      return 'TODO';
    }
    if (stepKey === 'UNDER_REVIEW') {
      if (done('UNDER_REVIEW')) return status === 'UNDER_REVIEW' ? 'CURRENT' : 'DONE';
      return 'TODO';
    }
    if (stepKey === 'DECISION') {
      if (done('DECISION')) return status === 'CLARIFICATION_REQUESTED' || status === 'REJECTED' || status === 'APPROVED' ? 'CURRENT' : 'DONE';
      return 'TODO';
    }
    // PROVISIONED
    if (done('PROVISIONED')) return status === 'PROVISIONED' ? 'CURRENT' : 'DONE';
    return 'TODO';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="flex justify-center mb-6">
          <KarditLogo size="md" />
        </div>

        <div className="kardit-card p-8">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl font-semibold">Onboarding status</h1>
              <p className="text-sm text-muted-foreground">Track your onboarding case.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/login')}>Back</Button>
              <Button variant="outline" onClick={refresh}>Refresh</Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error || !caseItem ? (
            <div className="text-sm text-muted-foreground">{error || 'Case not found'}</div>
          ) : (
            <>
              <div className="rounded-md border border-border p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Case</p>
                  <p className="text-sm font-medium break-all">{caseItem.caseId}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted: {format(new Date(caseItem.submittedAt), 'MMM d, yyyy HH:mm')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Updated: {format(new Date(caseItem.updatedAt), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                <StatusChip status={statusToChip[caseItem.status] || 'INACTIVE'} label={caseItem.status} />
              </div>

              <div className="mt-4 rounded-md border border-border p-4">
                <p className="text-sm font-medium mb-3">Progress</p>
                <div className="space-y-2">
                  {steps.map((s) => {
                    const state = stepState(caseItem.status, s.key);
                    const Icon = state === 'DONE' ? CheckCircle2 : Circle;
                    return (
                      <div key={s.key} className="flex items-center gap-2 text-sm">
                        <Icon className={`h-4 w-4 ${state === 'DONE' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={state === 'CURRENT' ? 'font-medium' : ''}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/onboarding/notifications/${caseItem.caseId}`)}
                  >
                    View updates
                  </Button>
                </div>
              </div>

              {caseItem.status === 'CLARIFICATION_REQUESTED' && (
                <div className="mt-4 rounded-md border border-border bg-muted p-4">
                  <p className="text-sm font-medium">Clarification requested</p>
                  <p className="text-sm text-muted-foreground">A reviewer requested more information.</p>
                  {caseItem.reviewerNote && (
                    <p className="text-sm text-muted-foreground mt-1">Note: {caseItem.reviewerNote}</p>
                  )}
                  {caseItem.decisionReason && (
                    <p className="text-sm text-muted-foreground mt-1">Reason: {caseItem.decisionReason}</p>
                  )}
                </div>
              )}

              {caseItem.status === 'REJECTED' && (
                <div className="mt-4 rounded-md border border-border bg-muted p-4">
                  <p className="text-sm font-medium">Rejected</p>
                  <p className="text-sm text-muted-foreground">Reason: {caseItem.decisionReason || '—'}</p>
                </div>
              )}

              {caseItem.status === 'PROVISIONED' && (
                <div className="mt-4 rounded-md border border-border bg-muted p-4">
                  <p className="text-sm font-medium">Provisioned</p>
                  <p className="text-sm text-muted-foreground">Tenant: {caseItem.provisionedTenantId || '—'}</p>
                  <p className="text-sm text-muted-foreground">Admin: {caseItem.provisionedAdminEmail || '—'}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
