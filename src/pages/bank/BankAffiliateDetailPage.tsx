import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { useOnboardingCase, useReviewerOnboardingCases } from '@/hooks/useOnboarding';
import { Loader2, ArrowLeft, Building2, User, FileText, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusToChip: Record<string, StatusType> = {
  SUBMITTED: 'PENDING',
  UNDER_REVIEW: 'PROCESSING',
  CLARIFICATION_REQUESTED: 'WARNING',
  REJECTED: 'FAILED',
  APPROVED: 'SUCCESS',
  PROVISIONED: 'SUCCESS',
};

/**
 * BankAffiliateDetailPage - Bank portal view to review individual affiliate application
 * Banks can view documents, approve, reject, or request clarification
 */
export default function BankAffiliateDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { caseItem, isLoading, error, refresh } = useOnboardingCase(caseId);
  const { decide } = useReviewerOnboardingCases();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [working, setWorking] = useState(false);

  const handleDecision = async (decision: 'APPROVE' | 'REJECT' | 'REQUEST_CLARIFICATION') => {
    if (!caseId) return;
    setWorking(true);
    try {
      await decide(caseId, { decision, reason: reason || undefined, reviewerNote: note || undefined });
      toast.success(
        decision === 'APPROVE' ? 'Affiliate approved' :
        decision === 'REJECT' ? 'Affiliate rejected' :
        'Clarification requested'
      );
      await refresh();
    } finally {
      setWorking(false);
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

  if (error || !caseItem) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['BANK']}>
        <AppLayout navVariant="bank">
          <div className="text-center py-20 text-muted-foreground">
            {error || 'Affiliate application not found'}
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const canTakeAction = ['SUBMITTED', 'UNDER_REVIEW'].includes(caseItem.status);

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <div className="animate-fade-in">
          <PageHeader
            title={caseItem.organization?.legalName || 'Affiliate Application'}
            subtitle={`Case: ${caseItem.caseId}`}
            actions={
              <div className="flex items-center gap-2">
                <StatusChip status={statusToChip[caseItem.status] || 'INACTIVE'} label={caseItem.status} />
                <Button variant="outline" size="sm" onClick={() => navigate('/bank/affiliates')}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              </div>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Organization Details */}
              <div className="kardit-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Organization</h2>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Legal Name</dt>
                    <dd className="font-medium">{caseItem.organization?.legalName || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Registration Number</dt>
                    <dd className="font-medium">{caseItem.organization?.registrationNumber || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Country</dt>
                    <dd className="font-medium">{caseItem.organization?.country || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Address</dt>
                    <dd className="font-medium">
                      {caseItem.organization?.addressLine1 || '—'}
                      {caseItem.organization?.city && `, ${caseItem.organization.city}`}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Contact Details */}
              <div className="kardit-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Primary Contact</h2>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium">{caseItem.contact?.contactName || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="font-medium">{caseItem.contact?.contactEmail || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="font-medium">{caseItem.contact?.contactPhone || '—'}</dd>
                  </div>
                </dl>
              </div>

              {/* KYB Documents */}
              <div className="kardit-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KYB Documents</h2>
                </div>
                {caseItem.documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents uploaded</p>
                ) : (
                  <div className="space-y-2">
                    {caseItem.documents.map((doc) => (
                      <div key={doc.documentId} className="flex items-center justify-between p-3 rounded-md border border-border bg-muted/50">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.fileName}</p>
                            <p className="text-xs text-muted-foreground">{doc.type}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Actions */}
            <div className="space-y-4">
              {/* Timeline */}
              <div className="kardit-card p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Timeline</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted</span>
                    <span>{format(new Date(caseItem.submittedAt), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span>{format(new Date(caseItem.updatedAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>

              {/* Decision Actions */}
              {canTakeAction && (
                <div className="kardit-card p-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Review Action</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Reason (optional)</label>
                      <input
                        className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm mt-1"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        disabled={working}
                        placeholder="Enter reason"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Internal Note (optional)</label>
                      <input
                        className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm mt-1"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        disabled={working}
                        placeholder="Internal note"
                      />
                    </div>
                    <div className="space-y-2 pt-2">
                      <Button
                        className="w-full"
                        onClick={() => handleDecision('APPROVE')}
                        disabled={working}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleDecision('REQUEST_CLARIFICATION')}
                        disabled={working}
                      >
                        <HelpCircle className="h-4 w-4 mr-1" /> Request Clarification
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => handleDecision('REJECT')}
                        disabled={working}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Previous Decision Info */}
              {caseItem.decisionReason && (
                <div className="kardit-card p-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Decision Info</h3>
                  <p className="text-sm">{caseItem.decisionReason}</p>
                  {caseItem.reviewerNote && (
                    <p className="text-sm text-muted-foreground mt-2">Note: {caseItem.reviewerNote}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
