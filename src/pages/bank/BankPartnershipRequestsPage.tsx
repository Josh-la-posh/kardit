import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { PaginatedTable, type PaginatedColumn } from '@/components/ui/paginated-table';
import { usePendingPartnershipRequests } from '@/hooks/useBankPortal';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import type { PartnershipRequestQueryItem } from '@/types/bankPortalContracts';

export default function BankPartnershipRequestsPage() {
  const navigate = useNavigate();
  const { bankId, requests, page, pageSize, total, setPage, isLoading, isActing, error, refresh } = usePendingPartnershipRequests();

  const handleRefreshAll = async () => {
    await refresh();
  };

  const openRequest = (request: PartnershipRequestQueryItem) => {
    navigate(`/bank/affiliate-partnership-requests/${request.partnershipRequestId}`);
  };

  const columns = useMemo<PaginatedColumn<PartnershipRequestQueryItem>[]>(
    () => [
      {
        key: 'affiliate',
        header: 'Affiliate',
        render: (request) => (
          <div>
            <p className="font-medium">Fix It</p>
          </div>
        ),
      },
      // {
      //   key: 'case',
      //   header: 'Case',
      //   render: (request) => <span className="text-xs text-muted-foreground">{request.partnershipRequestId}</span>,
      // },
      {
        key: 'status',
        header: 'Status',
        render: (request) => <StatusChip status="PENDING" label={request.status} />,
      },
      {
        key: 'requestedAt',
        header: 'Requested',
        render: (request) => format(new Date(request.requestedAt), 'MMM d, yyyy HH:mm'),
      },
      // {
      //   key: 'note',
      //   header: 'Note',
      //   render: (request) => <span className="text-muted-foreground">{request.note || '-'}</span>,
      // },
      {
        key: 'actions',
        header: 'View',
        render: (request) => (
          <Button
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              openRequest(request);
            }}
            disabled={isActing}
          >
            View more
          </Button>
        ),
      },
    ],
    [isActing]
  );

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <button className="back-link" onClick={() => navigate('/bank/affiliates')}>
                  <ArrowLeft /> Back to Affiliates
                </button>
                <h1 className="page-title">Pending Partnership Requests</h1>
                <p className="page-sub">
                  {bankId ? `Review incoming affiliate requests for ${bankId}` : 'Review incoming affiliate requests'}
                </p>
              </div>

              <Button variant="outline" size="sm" onClick={handleRefreshAll} disabled={isLoading || isActing}>
                <RefreshCw className="mr-1 h-4 w-4" /> Refresh
              </Button>
            </header>

            <div style={{ marginTop: 14 }}>
              <PaginatedTable<PartnershipRequestQueryItem>
                columns={columns}
                rows={requests}
                isLoading={isLoading}
                error={error || undefined}
                emptyMessage="No pending partnership requests found."
                onRowClick={openRequest}
                rowKey={(request) => request.partnershipRequestId}
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                className="shadow-none"
              />
            </div>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  );
}
