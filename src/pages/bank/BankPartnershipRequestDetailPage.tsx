import React, { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusChip } from '@/components/ui/status-chip';
import { Textarea } from '@/components/ui/textarea';
import { usePartnershipRequest, usePendingPartnershipRequests } from '@/hooks/useBankPortal';

const PARTNERSHIP_IDEMPOTENCY_STORAGE_PREFIX = 'kardit.bank.partnership-request.idempotency';

function createIdempotencyKey(operation: 'approve' | 'reject') {
  const suffix =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `partnership-${operation}-${suffix}`;
}

function getOperationIdempotencyKey(requestId: string, operation: 'approve' | 'reject') {
  const storageKey = `${PARTNERSHIP_IDEMPOTENCY_STORAGE_PREFIX}.${requestId}.${operation}`;

  try {
    const existingKey = window.localStorage.getItem(storageKey);
    if (existingKey) return existingKey;

    const nextKey = createIdempotencyKey(operation);
    window.localStorage.setItem(storageKey, nextKey);
    return nextKey;
  } catch {
    return createIdempotencyKey(operation);
  }
}

function formatDateTime(value?: string) {
  if (!value) return '-';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'MMM d, yyyy HH:mm');
}

function formatStatus(value?: string) {
  const labels: Record<string, string> = {
    PENDING_BANK_APPROVAL: 'Pending',
    ACTIVE: 'Approved',
    APPROVE: 'Approved',
    APPROVED: 'Approved',
    SUSPENDED: 'Suspended',
    REJECTED: 'Rejected',
  };

  return labels[value || ''] || value?.replace(/_/g, ' ').toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || '-';
}

export default function BankPartnershipRequestDetailPage() {
  const { partnershipRequestId } = useParams<{ partnershipRequestId: string }>();
  const navigate = useNavigate();
  const { request, isLoading, error, refresh } = usePartnershipRequest(partnershipRequestId);
  const { approve, reject, isActing } = usePendingPartnershipRequests({ autoLoad: false });
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [decisionDialog, setDecisionDialog] = useState<'approve' | 'reject' | null>(null);
  const [successfulDecision, setSuccessfulDecision] = useState<'approve' | 'reject' | null>(null);

  const openDecisionDialog = (decision: 'approve' | 'reject') => {
    setReviewerNotes('');
    setRejectionReason('');
    setDecisionDialog(decision);
  };

  const handleApprove = async () => {
    if (!partnershipRequestId) return;

    try {
      await approve(partnershipRequestId, {
        reviewerNotes: reviewerNotes.trim(),
        idempotencyKey: getOperationIdempotencyKey(partnershipRequestId, 'approve'),
      });
      setDecisionDialog(null);
      setSuccessfulDecision('approve');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to approve partnership request');
    }
  };

  const handleReject = async () => {
    if (!partnershipRequestId || !rejectionReason.trim()) {
      toast.error('Enter a rejection reason before continuing');
      return;
    }

    try {
      await reject(partnershipRequestId, {
        rejectionReason: rejectionReason.trim(),
        reviewerNotes: reviewerNotes.trim(),
        idempotencyKey: getOperationIdempotencyKey(partnershipRequestId, 'reject'),
      });
      setDecisionDialog(null);
      setSuccessfulDecision('reject');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to reject partnership request');
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['BANK']}>
        <AppLayout navVariant="bank">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (error || !request) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['BANK']}>
        <AppLayout navVariant="bank">
          <div className="animate-fade-in">
            <PageHeader
              title="Partnership Request"
              subtitle={partnershipRequestId || 'Request detail'}
              actions={
                <Button variant="outline" size="sm" onClick={() => navigate('/bank/affiliate-partnership-requests')}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back to Requests
                </Button>
              }
            />
            <div className="kardit-card p-6 text-sm text-muted-foreground">{error || 'Partnership request not found.'}</div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const affiliate = request.affiliate ?? {
    affiliateId: '-',
    legalName: 'Partnership Request',
    tradingName: '-',
    registrationNumber: '-',
  };
  const onboardingSnapshot = request.onboardingSnapshot ?? {
    caseId: '',
    status: '',
    documents: [],
  };
  const sectionClassName = 'rounded-lg border border-[var(--cs-line)] bg-card p-6 shadow-sm';
  const fieldClassName = 'rounded-md bg-muted/30 px-4 py-3 ring-1 ring-inset ring-border/50';
  const documentClassName = 'rounded-md bg-muted/30 p-4 ring-1 ring-inset ring-border/50';

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <div className="animate-fade-in">
          <PageHeader
            title={affiliate.legalName || 'Partnership Request'}
            subtitle={`Request ${request.partnershipRequestId}`}
            actions={
              <div className="flex items-center gap-2">
                <StatusChip status="PENDING" label={formatStatus(request.status)} />
                <Button variant="outline" size="sm" onClick={() => navigate('/bank/affiliate-partnership-requests')}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button variant="outline" size="sm" onClick={refresh} disabled={isActing}>
                  <RefreshCw className="mr-1 h-4 w-4" /> Refresh
                </Button>
              </div>
            }
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className={sectionClassName}>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Affiliate</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className={fieldClassName}>
                    <p className="text-xs text-muted-foreground">Legal Name</p>
                    <p className="text-sm font-medium">{affiliate.legalName || '-'}</p>
                  </div>
                  <div className={fieldClassName}>
                    <p className="text-xs text-muted-foreground">Affiliate ID</p>
                    <p className="text-sm font-medium">{affiliate.affiliateId || '-'}</p>
                  </div>
                  <div className={fieldClassName}>
                    <p className="text-xs text-muted-foreground">Trading Name</p>
                    <p className="text-sm font-medium">{affiliate.tradingName || '-'}</p>
                  </div>
                  <div className={fieldClassName}>
                    <p className="text-xs text-muted-foreground">Registration Number</p>
                    <p className="text-sm font-medium">{affiliate.registrationNumber || '-'}</p>
                  </div>
                </div>
              </div>

              {/* <div className={sectionClassName}>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Onboarding Snapshot</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className={fieldClassName}>
                    <p className="text-xs text-muted-foreground">Case ID</p>
                    <p className="break-all text-sm font-medium">{onboardingSnapshot.caseId || '-'}</p>
                  </div>
                  <div className={fieldClassName}>
                    <p className="text-xs text-muted-foreground">Snapshot Status</p>
                    <StatusChip
                      status={onboardingSnapshot.status === 'APPROVED' ? 'SUCCESS' : 'PENDING'}
                      label={formatStatus(onboardingSnapshot.status)}
                    />
                  </div>
                  <div className={fieldClassName}>
                    <p className="text-xs text-muted-foreground">KYB Decision</p>
                    <p className="text-sm font-medium">{formatStatus(onboardingSnapshot.kybLevel)}</p>
                  </div>
                  <div className={fieldClassName}>
                    <p className="text-xs text-muted-foreground">Submitted At</p>
                    <p className="text-sm font-medium">{formatDateTime(onboardingSnapshot.submittedAt)}</p>
                  </div>
                  <div className={fieldClassName}>
                    <p className="text-xs text-muted-foreground">Reviewed At</p>
                    <p className="text-sm font-medium">{formatDateTime(onboardingSnapshot.reviewedAt)}</p>
                  </div>
                  <div className={fieldClassName}>
                    <p className="text-xs text-muted-foreground">Reviewer Notes</p>
                    <p className="text-sm font-medium">{onboardingSnapshot.reviewersNotes || '-'}</p>
                  </div>
                </div>
              </div> */}

              <div className={sectionClassName}>
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Documents</h2>
                </div>
                {onboardingSnapshot.documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No onboarding documents attached to this request.</p>
                ) : (
                  <div className="space-y-3">
                    {onboardingSnapshot.documents.map((document) => (
                      <div key={document.documentId} className={documentClassName}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {document.documentType || document.docType || '-'}
                            </p>
                            <p className="text-xs text-muted-foreground break-all">{document.documentId}</p>
                          </div>
                          <StatusChip
                            status={document.verificationStatus === 'VERIFIED' ? 'VERIFIED' : document.verificationStatus === 'REJECTED' ? 'REJECTED' : 'PENDING'}
                            label={document.verificationStatus || 'PENDING'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className={sectionClassName}>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Request Details</h2>
                <div className="space-y-4">
                  <div className={fieldClassName}>
                    <p className="text-xs text-muted-foreground">Requested At</p>
                    <p className="text-sm font-medium">{formatDateTime(request.requestedAt)}</p>
                  </div>
                  <div className={fieldClassName}>
                    <p className="text-xs text-muted-foreground">Note</p>
                    <p className="text-sm font-medium">{request.note || '-'}</p>
                  </div>
                </div>
              </div>

              <div className={sectionClassName}>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Decision</h2>
                <div className="space-y-3">
                  <Button className="w-full" onClick={() => openDecisionDialog('approve')} disabled={isActing}>
                    Approve Request
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={() => openDecisionDialog('reject')} disabled={isActing}>
                    Reject Request
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Dialog
          open={decisionDialog === 'approve'}
          onOpenChange={(open) => !open && !isActing && setDecisionDialog(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Approve partnership request</DialogTitle>
              <DialogDescription>
                Add a reviewer note before approving this affiliate partnership.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label htmlFor="approval-reviewer-note" className="text-sm font-medium">Reviewer note</label>
              <Textarea
                id="approval-reviewer-note"
                className="min-h-28"
                placeholder="Reviewed affiliate documents and request details"
                value={reviewerNotes}
                onChange={(event) => setReviewerNotes(event.target.value)}
                disabled={isActing}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDecisionDialog(null)} disabled={isActing}>
                Cancel
              </Button>
              <Button onClick={() => void handleApprove()} disabled={isActing}>
                {isActing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isActing ? 'Approving...' : 'Approve'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={decisionDialog === 'reject'}
          onOpenChange={(open) => !open && !isActing && setDecisionDialog(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reject partnership request</DialogTitle>
              <DialogDescription>
                Provide the rejection reason and an optional reviewer note.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="rejection-reason" className="text-sm font-medium">
                  Rejection reason <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="rejection-reason"
                  className="min-h-28"
                  placeholder="Affiliate documentation is incomplete"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  disabled={isActing}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="rejection-reviewer-note" className="text-sm font-medium">Reviewer note</label>
                <Textarea
                  id="rejection-reviewer-note"
                  className="min-h-24"
                  placeholder="Additional internal context"
                  value={reviewerNotes}
                  onChange={(event) => setReviewerNotes(event.target.value)}
                  disabled={isActing}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDecisionDialog(null)} disabled={isActing}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => void handleReject()}
                disabled={isActing || !rejectionReason.trim()}
              >
                {isActing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isActing ? 'Rejecting...' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={successfulDecision !== null} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {successfulDecision === 'approve'
                  ? 'Partnership approved'
                  : 'Partnership request rejected'}
              </DialogTitle>
              <DialogDescription>
                {successfulDecision === 'approve'
                  ? 'The affiliate partnership was approved successfully.'
                  : 'The affiliate partnership request was rejected successfully.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => {
                  setSuccessfulDecision(null);
                  navigate('/bank/affiliate-partnership-requests');
                }}
              >
                Back to requests
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  );
}
