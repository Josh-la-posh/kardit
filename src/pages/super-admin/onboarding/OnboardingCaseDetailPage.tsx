import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { useOnboardingCase, useReviewerOnboardingCases } from '@/hooks/useOnboarding';
import { Loader2 } from 'lucide-react';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { toast } from 'sonner';

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

export default function OnboardingCaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { caseItem, isLoading, error, refresh } = useOnboardingCase(caseId);
  const { decide, provision } = useReviewerOnboardingCases();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [working, setWorking] = useState(false);

  const canProvision = caseItem?.status === 'APPROVED';

  const title = useMemo(() => caseItem?.organization?.legalName || 'Onboarding case', [caseItem?.organization?.legalName]);

  const doDecision = async (decision: 'APPROVE' | 'REJECT' | 'REQUEST_CLARIFICATION') => {
    if (!caseId) return;
    setWorking(true);
    try {
      await decide(caseId, { decision, reason: reason || undefined, reviewerNote: note || undefined });
      toast.success('Decision saved');
      await refresh();
    } finally {
      setWorking(false);
    }
  };

  const doProvision = async () => {
    if (!caseId) return;
    setWorking(true);
    try {
      const res = await provision(caseId);
      toast.success('Provisioned');
      navigate(`/super-admin/onboarding/cases/${caseId}?provisioned=1`);
      await refresh();
      console.log(res);
    } finally {
      setWorking(false);
    }
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <PageHeader
            title={title}
            subtitle={caseItem ? `Case ${caseItem.caseId}` : 'Case detail'}
            actions={
              <div className="flex items-center gap-2">
                {caseItem && <StatusChip status={statusToChip[caseItem.status] || 'INACTIVE'} label={caseItem.status} />}
                <Button variant="outline" size="sm" onClick={() => navigate('/super-admin/onboarding/cases')}>Back</Button>
                <Button variant="outline" size="sm" onClick={refresh}>Refresh</Button>
              </div>
            }
          />

          <div className="kardit-card p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : error || !caseItem ? (
              <div className="text-sm text-muted-foreground">{error || 'Case not found'}</div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-md border border-border p-4">
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="text-sm font-medium">{caseItem.contact?.contactName || '—'}</p>
                    <p className="text-xs text-muted-foreground">{caseItem.contact?.contactEmail || '—'}</p>
                  </div>
                  <div className="rounded-md border border-border p-4">
                    <p className="text-xs text-muted-foreground">Documents</p>
                    <p className="text-sm text-muted-foreground">{caseItem.documents.length} document(s)</p>
                  </div>
                </div>

                <div className="rounded-md border border-border p-4 space-y-3">
                  <p className="text-sm font-semibold">Reviewer action</p>
                  <label className="block text-xs text-muted-foreground">Reason (optional)</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={working}
                    placeholder="Reason for decision"
                  />
                  <label className="block text-xs text-muted-foreground">Note (optional)</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={working}
                    placeholder="Internal reviewer note"
                  />
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" onClick={() => doDecision('REQUEST_CLARIFICATION')} disabled={working}>Request clarification</Button>
                    <Button variant="outline" onClick={() => doDecision('REJECT')} disabled={working}>Reject</Button>
                    <Button onClick={() => doDecision('APPROVE')} disabled={working}>Approve</Button>
                    <Button variant="secondary" onClick={doProvision} disabled={working || !canProvision}>Provision</Button>
                  </div>
                </div>

                {caseItem.status === 'PROVISIONED' && (
                  <div className="rounded-md border border-border bg-muted p-4">
                    <p className="text-sm font-semibold mb-2">Provisioning result</p>
                    <p className="text-sm text-muted-foreground">Tenant: {caseItem.provisionedTenantId}</p>
                    <p className="text-sm text-muted-foreground">Admin: {caseItem.provisionedAdminEmail}</p>
                    <p className="text-sm text-muted-foreground">Temp password: {caseItem.provisionedTemporaryPassword}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
