import React, { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { usePendingPartnershipRequests } from '@/hooks/useBankPortal';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';

export default function BankPartnershipRequestsPage() {
  const navigate = useNavigate();
  const { bankId, requests, isLoading, isActing, error, refresh, approve, reject } = usePendingPartnershipRequests();
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleRefreshAll = async () => {
    await refresh();
  };

  const handleApprove = async (requestId: string) => {
    try {
      const response = await approve(requestId);
      toast.success(`Partnership approved: ${response.partnershipId}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to approve partnership request');
    }
  };

  const handleReject = async () => {
    if (!rejectingRequestId || !rejectionReason.trim()) {
      toast.error('Enter a rejection reason before continuing');
      return;
    }

    try {
      const response = await reject(rejectingRequestId, rejectionReason.trim());
      toast.error(`Partnership request rejected: ${response.requestId}`);
      setRejectingRequestId(null);
      setRejectionReason('');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to reject partnership request');
    }
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <div className="animate-fade-in">
          <PageHeader
            title="Pending Partnership Requests"
            subtitle={bankId ? `Review incoming affiliate requests for ${bankId}` : 'Review incoming affiliate requests'}
            actions={
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/bank/affiliates')}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back to Affiliates
                </Button>
                <Button variant="outline" size="sm" onClick={handleRefreshAll} disabled={isLoading || isActing}>
                  <RefreshCw className="mr-1 h-4 w-4" /> Refresh
                </Button>
              </div>
            }
          />

          {rejectingRequestId && (
            <div className="mb-6 rounded-lg border border-border bg-card p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold">Reject Partnership Request</h3>
                <p className="text-sm text-muted-foreground">Provide a short reason that will be sent with the rejection.</p>
              </div>
              <textarea
                className="mb-3 min-h-28 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Affiliate documentation incomplete"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={isActing}
              />
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={handleReject} disabled={isActing}>
                  Confirm Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRejectingRequestId(null);
                    setRejectionReason('');
                  }}
                  disabled={isActing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="kardit-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="p-6 text-sm text-muted-foreground">{error}</div>
            ) : requests.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No pending partnership requests found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Affiliate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Case</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Requested</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Note</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Documents</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {requests.map((request) => (
                      <tr key={request.partnershipRequestId} className="align-top hover:bg-muted/30">
                        <td className="px-4 py-4 text-sm">
                          <p className="font-medium">{request.affiliate.legalName}</p>
                          <p className="text-xs text-muted-foreground">{request.affiliate.affiliateId}</p>
                          {request.affiliate.tradingName && (
                            <p className="text-xs text-muted-foreground">{request.affiliate.tradingName}</p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          <p>{request.onboardingSnapshot.caseId}</p>
                          <p className="text-xs">{request.partnershipRequestId}</p>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <StatusChip status="PENDING" label={request.status} />
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {format(new Date(request.requestedAt), 'MMM d, yyyy HH:mm')}
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">{request.note || '-'}</td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {request.onboardingSnapshot.documents.length ? (
                            request.onboardingSnapshot.documents.map((document) => (
                              <div key={document.documentId} className="mb-1 last:mb-0">
                                <p>{document.docType}</p>
                                <p className="text-xs">{document.verificationStatus}</p>
                              </div>
                            ))
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2">
                            <Button size="sm" onClick={() => handleApprove(request.partnershipRequestId)} disabled={isActing}>
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setRejectingRequestId(request.partnershipRequestId);
                                setRejectionReason('');
                              }}
                              disabled={isActing}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
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
