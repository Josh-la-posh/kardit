import React, { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { usePartnershipRequest, usePendingPartnershipRequests } from '@/hooks/useBankPortal';

export default function BankPartnershipRequestDetailPage() {
  const { partnershipRequestId } = useParams<{ partnershipRequestId: string }>();
  const navigate = useNavigate();
  const { request, isLoading, error, refresh } = usePartnershipRequest(partnershipRequestId);
  const { approve, reject, isActing } = usePendingPartnershipRequests();
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = async () => {
    if (!partnershipRequestId) return;

    try {
      const response = await approve(partnershipRequestId);
      toast.success(`Partnership approved: ${response.partnershipId}`);
      navigate('/bank/affiliate-partnership-requests');
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
      const response = await reject(partnershipRequestId, rejectionReason.trim());
      toast.error(`Partnership request rejected: ${response.requestId}`);
      navigate('/bank/affiliate-partnership-requests');
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
                <StatusChip status="PENDING" label={request.status} />
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

              <div className={sectionClassName}>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Onboarding Snapshot</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className={fieldClassName}>
                    <p className="text-xs text-muted-foreground">Case ID</p>
                    <p className="text-sm font-medium">{onboardingSnapshot.caseId || '-'}</p>
                  </div>
                  <div className={fieldClassName}>
                    <p className="text-xs text-muted-foreground">Snapshot Status</p>
                    <p className="text-sm font-medium">{onboardingSnapshot.status || '-'}</p>
                  </div>
                </div>
              </div>

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
                            <p className="text-sm font-medium">{document.docType}</p>
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
                    <p className="text-sm font-medium">{format(new Date(request.requestedAt), 'MMM d, yyyy HH:mm')}</p>
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
                  <Button className="w-full" onClick={handleApprove} disabled={isActing}>
                    Approve Request
                  </Button>
                  <div>
                    <label className="mb-2 block text-xs text-muted-foreground">Rejection reason</label>
                    <textarea
                      className="min-h-28 w-full rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Affiliate documentation incomplete"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      disabled={isActing}
                    />
                  </div>
                  <Button variant="destructive" className="w-full" onClick={handleReject} disabled={isActing}>
                    Reject Request
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
