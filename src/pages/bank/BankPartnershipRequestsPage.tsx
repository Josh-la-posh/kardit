import React from 'react';
import { format } from 'date-fns';
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
  const { bankId, requests, isLoading, isActing, error, refresh } = usePendingPartnershipRequests();

  const handleRefreshAll = async () => {
    await refresh();
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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {requests.map((request) => (
                      <tr key={request.partnershipRequestId} className="align-top hover:bg-muted/30">
                        <td className="px-4 py-4 text-sm">
                          <>
                            <p className="font-medium">{request.bankName || 'Pending Affiliate Request'}</p>
                            <p className="text-xs text-muted-foreground">{request.affiliateId}</p>
                          </>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          <p className="text-xs">{request.partnershipRequestId}</p>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <StatusChip status="PENDING" label={request.status} />
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {format(new Date(request.requestedAt), 'MMM d, yyyy HH:mm')}
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">{request.note || '-'}</td>
                        <td className="px-4 py-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/bank/affiliate-partnership-requests/${request.partnershipRequestId}`)}
                            disabled={isActing}
                          >
                            View more
                          </Button>
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
