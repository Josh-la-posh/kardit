import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { KarditLogo } from '@/components/KarditLogo';
import { Button } from '@/components/ui/button';
import { useOnboardingCase } from '@/hooks/useOnboarding';
import { Loader2 } from 'lucide-react';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';

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
                </div>
                <StatusChip status={statusToChip[caseItem.status] || 'INACTIVE'} label={caseItem.status} />
              </div>

              {caseItem.status === 'CLARIFICATION_REQUESTED' && (
                <div className="mt-4 rounded-md border border-border bg-muted p-4">
                  <p className="text-sm font-medium">Clarification requested</p>
                  <p className="text-sm text-muted-foreground">A reviewer requested more information. Please await contact from the service provider.</p>
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
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
