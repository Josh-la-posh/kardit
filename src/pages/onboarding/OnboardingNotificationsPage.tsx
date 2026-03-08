import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { KarditLogo } from '@/components/KarditLogo';
import { Button } from '@/components/ui/button';
import { useOnboardingCase } from '@/hooks/useOnboarding';
import { Loader2, Bell } from 'lucide-react';
import { format } from 'date-fns';
import type { OnboardingCase } from '@/types/onboardingContracts';

type NotificationItem = {
  title: string;
  timestamp?: string;
  body: string;
};

function buildNotifications(caseItem: OnboardingCase): NotificationItem[] {
  const items: NotificationItem[] = [];

  items.push({
    title: 'Submission received',
    timestamp: caseItem.submittedAt,
    body: 'Your onboarding case is in the review queue.',
  });

  if (caseItem.status && caseItem.updatedAt) {
    items.push({
      title: `Status: ${caseItem.status}`,
      timestamp: caseItem.updatedAt,
      body: 'Your case status was updated.',
    });
  }

  if (caseItem.status === 'CLARIFICATION_REQUESTED') {
    items.push({
      title: 'Clarification requested',
      timestamp: caseItem.updatedAt,
      body: [
        'A reviewer requested more information.',
        caseItem.reviewerNote ? `Note: ${caseItem.reviewerNote}` : null,
        caseItem.decisionReason ? `Reason: ${caseItem.decisionReason}` : null,
      ].filter(Boolean).join(' '),
    });
  }

  if (caseItem.status === 'REJECTED') {
    items.push({
      title: 'Rejected',
      timestamp: caseItem.updatedAt,
      body: caseItem.decisionReason ? `Reason: ${caseItem.decisionReason}` : 'Your onboarding case was rejected.',
    });
  }

  if (caseItem.status === 'APPROVED') {
    items.push({
      title: 'Approved',
      timestamp: caseItem.updatedAt,
      body: caseItem.reviewerNote ? `Note: ${caseItem.reviewerNote}` : 'Your onboarding case was approved.',
    });
  }

  if (caseItem.status === 'PROVISIONED') {
    items.push({
      title: 'Provisioned',
      timestamp: caseItem.updatedAt,
      body: [
        'Your tenant has been created.',
        caseItem.provisionedTenantId ? `Tenant: ${caseItem.provisionedTenantId}` : null,
        caseItem.provisionedAdminEmail ? `Admin: ${caseItem.provisionedAdminEmail}` : null,
      ].filter(Boolean).join(' '),
    });
  }

  // De-dupe by title+timestamp to keep the page tidy.
  const seen = new Set<string>();
  return items.filter((i) => {
    const key = `${i.title}|${i.timestamp || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function OnboardingNotificationsPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { caseItem, isLoading, error, refresh } = useOnboardingCase(caseId);

  const notifications = useMemo(() => (caseItem ? buildNotifications(caseItem) : []), [caseItem]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="flex justify-center mb-6">
          <KarditLogo size="md" />
        </div>

        <div className="kardit-card p-8">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2"><Bell className="h-5 w-5" /> Updates</h1>
              <p className="text-sm text-muted-foreground">Notifications for your onboarding case.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => caseId && navigate(`/onboarding/status/${caseId}`)} disabled={!caseId}>Back</Button>
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
            <div className="space-y-3">
              <div className="rounded-md border border-border p-4">
                <p className="text-xs text-muted-foreground">Case</p>
                <p className="text-sm font-medium break-all">{caseItem.caseId}</p>
              </div>

              {notifications.length === 0 ? (
                <div className="text-sm text-muted-foreground">No updates yet.</div>
              ) : (
                notifications.map((n) => (
                  <div key={`${n.title}-${n.timestamp || 'na'}`} className="rounded-md border border-border bg-muted p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.timestamp && (
                        <p className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(n.timestamp), 'MMM d, yyyy HH:mm')}</p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                  </div>
                ))
              )}

              <div className="pt-2">
                <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>Back to login</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
