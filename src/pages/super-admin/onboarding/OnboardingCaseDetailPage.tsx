import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { useCreateAffiliate } from '@/hooks/useAffiliates';
import { useReviewerOnboardingCase, useReviewerOnboardingCases } from '@/hooks/useOnboarding';
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
  const { caseItem, isLoading, error, refresh } = useReviewerOnboardingCase(caseId);
  const { decide, provision } = useReviewerOnboardingCases();
  const { createAffiliate, isLoading: isCreatingAffiliate } = useCreateAffiliate();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [working, setWorking] = useState(false);
  const [affiliateCreated, setAffiliateCreated] = useState(false);

  const canProvision = caseItem?.status === 'APPROVED';
  const canCreateAffiliate = caseItem?.status === 'APPROVED' && !affiliateCreated;

  const title = useMemo(
    () => caseItem?.affiliateName || caseItem?.organization?.legalName || 'Onboarding case',
    [caseItem?.affiliateName, caseItem?.organization?.legalName]
  );

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
      await provision(caseId);
      toast.success('Provisioned');
      navigate(`/super-admin/onboarding/cases/${caseId}?provisioned=1`);
      await refresh();
    } finally {
      setWorking(false);
    }
  };

  // const doCreateAffiliate = async () => {
  //   if (!caseItem || !caseId) return;

  //   const primaryContact =
  //     caseItem.contact
  //       ? {
  //           fullName: caseItem.contact.contactName,
  //           email: caseItem.contact.contactEmail,
  //           phone: caseItem.contact.contactPhone,
  //         }
  //       : caseItem.organization?.primaryContact;

  //   const legalName = caseItem.organization?.legalName || caseItem.affiliateName;
  //   if (!legalName || !primaryContact) {
  //     toast.error('This case is missing organization or admin contact details.');
  //     return;
  //   }

  //   try {
  //     const response = await createAffiliate({
  //       affiliateType: 'EXTERNAL',
  //       onboardingCaseId: caseId,
  //       legalName,
  //       shortName: caseItem.organization?.tradingName || legalName,
  //       adminContact: primaryContact,
  //       selectedBankIds: caseItem.issuingBankIds,
  //     });
  //     setAffiliateCreated(true);
  //     toast.success(`Affiliate record created for ${response.shortName}`);
  //     await refresh();
  //   } catch (err) {
  //     toast.error(err instanceof Error ? err.message : 'Failed to create affiliate record');
  //   }
  // };

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
                <Button variant="outline" size="sm" onClick={() => navigate('/super-admin/onboarding/cases')}>
                  Back
                </Button>
                <Button variant="outline" size="sm" onClick={refresh}>
                  Refresh
                </Button>
              </div>
            }
          />

          <div className="kardit-card p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error || !caseItem ? (
              <div className="text-sm text-muted-foreground">{error || 'Case not found'}</div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-md border border-border p-4">
                    <p className="text-xs text-muted-foreground">Affiliate</p>
                    <p className="text-sm font-medium">{caseItem.affiliateName || caseItem.organization?.legalName || 'Unnamed affiliate'}</p>
                    <p className="text-xs text-muted-foreground">{caseItem.affiliateId || caseItem.caseId}</p>
                  </div>
                  <div className="rounded-md border border-border p-4">
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="text-sm font-medium">{format(new Date(caseItem.submittedAt), 'MMM d, yyyy HH:mm')}</p>
                    <p className="text-xs text-muted-foreground">Updated {format(new Date(caseItem.updatedAt), 'MMM d, yyyy HH:mm')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-md border border-border p-4">
                    <p className="text-xs text-muted-foreground">Registration No.</p>
                    <p className="text-sm font-medium">{caseItem.kybSummary?.registrationNumber || caseItem.organization?.registrationNumber || '-'}</p>
                  </div>
                  <div className="rounded-md border border-border p-4">
                    <p className="text-xs text-muted-foreground">Country</p>
                    <p className="text-sm font-medium">
                      {caseItem.kybSummary?.country || caseItem.organization?.country || caseItem.organization?.address?.country || '-'}
                    </p>
                  </div>
                  <div className="rounded-md border border-border p-4">
                    <p className="text-xs text-muted-foreground">KYB Status</p>
                    <p className="text-sm font-medium">{caseItem.kybSummary?.status || caseItem.status}</p>
                  </div>
                  <div className="rounded-md border border-border p-4">
                    <p className="text-xs text-muted-foreground">Documents</p>
                    <p className="text-sm font-medium">{caseItem.documents.length} document(s)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-md border border-border p-4 space-y-2">
                    <p className="text-sm font-semibold">Organization</p>
                    <p className="text-sm text-muted-foreground">Legal name: {caseItem.organization?.legalName || caseItem.affiliateName || '-'}</p>
                    <p className="text-sm text-muted-foreground">Trading name: {caseItem.organization?.tradingName || '-'}</p>
                    <p className="text-sm text-muted-foreground">
                      Address: {caseItem.organization?.address?.line1 || caseItem.organization?.addressLine1 || '-'}
                    </p>
                  </div>
                  <div className="rounded-md border border-border p-4 space-y-2">
                    <p className="text-sm font-semibold">Primary contact</p>
                    <p className="text-sm text-muted-foreground">
                      Name: {caseItem.contact?.contactName || caseItem.organization?.primaryContact?.fullName || '-'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Email: {caseItem.contact?.contactEmail || caseItem.organization?.primaryContact?.email || '-'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Phone: {caseItem.contact?.contactPhone || caseItem.organization?.primaryContact?.phone || '-'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <div className="rounded-md border border-border p-4">
                    <p className="mb-3 text-sm font-semibold">Documents</p>
                    {caseItem.documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No documents attached yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {caseItem.documents.map((document) => (
                          <div key={document.documentId} className="flex items-start justify-between gap-3 rounded-md bg-muted/40 p-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium break-words">{document.documentType || document.type}</p>
                              <p className="text-xs text-muted-foreground break-all">{document.documentId}</p>
                            </div>
                            <StatusChip
                              status={
                                document.verificationStatus === 'VERIFIED'
                                  ? 'VERIFIED'
                                  : document.verificationStatus === 'REJECTED'
                                    ? 'REJECTED'
                                    : 'PENDING'
                              }
                              label={document.verificationStatus || 'PENDING'}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-md border border-border p-4">
                    <p className="mb-3 text-sm font-semibold">Timeline</p>
                    {caseItem.timeline.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No timeline events available.</p>
                    ) : (
                      <div className="space-y-3">
                        {caseItem.timeline.map((entry, index) => (
                          <div key={`${entry.status}-${entry.at}-${index}`} className="rounded-md bg-muted/40 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium">{entry.status}</p>
                              <p className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(entry.at), 'MMM d, yyyy HH:mm')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                    <Button variant="outline" onClick={() => doDecision('REQUEST_CLARIFICATION')} disabled={working}>
                      Request clarification
                    </Button>
                    <Button variant="outline" onClick={() => doDecision('REJECT')} disabled={working}>
                      Reject
                    </Button>
                    <Button onClick={() => doDecision('APPROVE')} disabled={working}>
                      Approve
                    </Button>
                    {/* <Button
                      variant="secondary"
                      onClick={doCreateAffiliate}
                      disabled={working || isCreatingAffiliate || !canCreateAffiliate}
                    >
                      {isCreatingAffiliate ? 'Creating affiliate...' : 'Create Affiliate Record'}
                    </Button> */}
                    <Button variant="secondary" onClick={doProvision} disabled={working || !canProvision}>
                      Provision
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border border-border p-4">
                  <p className="mb-3 text-sm font-semibold">Messages</p>
                  {caseItem.messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No case messages yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {caseItem.messages.map((message, index) => (
                        <div key={`${message.type}-${message.at}-${index}`} className="rounded-md bg-muted/40 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium">{message.type}</p>
                            <p className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(message.at), 'MMM d, yyyy HH:mm')}</p>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{message.text || message.message || '-'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {caseItem.status === 'APPROVED' && (
                  <div className="rounded-md border border-border bg-muted p-4">
                    <p className="mb-2 text-sm font-semibold">Affiliate creation payload</p>
                    <p className="text-sm text-muted-foreground">Type: EXTERNAL</p>
                    <p className="text-sm text-muted-foreground">Case ID: {caseItem.caseId}</p>
                    <p className="text-sm text-muted-foreground">Legal name: {caseItem.organization?.legalName || caseItem.affiliateName || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">
                      Short name: {caseItem.organization?.tradingName || caseItem.organization?.legalName || caseItem.affiliateName || 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Selected banks: {caseItem.issuingBankIds.length ? caseItem.issuingBankIds.join(', ') : 'None'}
                    </p>
                  </div>
                )}

                {caseItem.status === 'PROVISIONED' && (
                  <div className="rounded-md border border-border bg-muted p-4">
                    <p className="mb-2 text-sm font-semibold">Provisioning result</p>
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
