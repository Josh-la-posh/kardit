import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Activity, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { AppCard, AppCardHeader, AppCardSub, AppCardTitle } from '@/components/ui/app-card';
import { PaginatedTable } from '@/components/ui/paginated-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { useSuperAdminAudits } from '@/hooks/useSuperAdminAudits';
import type { SuperAdminAuditLog } from '@/types/superAdminContracts';

const pageSizeOptions = ['25', '50', '100'];

const statusToChip: Record<string, StatusType> = {
  SUCCESS: 'SUCCESS',
  COMPLETED: 'SUCCESS',
  FAILED: 'FAILED',
  FAILURE: 'FAILED',
  ERROR: 'ERROR',
  PENDING: 'WARNING',
};

export default function AuditLogsListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState(25);

  const { audits, total, page, pageSize, isLoading, error, refetch } = useSuperAdminAudits({
    page: currentPage,
    pageSize: selectedPageSize,
  });

  function handlePageSizeChange(value: string) {
    setSelectedPageSize(Number(value));
    setCurrentPage(1);
  }

  const columns = useMemo(
    () => [
      {
        key: 'occurredAt',
        header: 'Timestamp',
        className: 'whitespace-nowrap',
        render: (audit: SuperAdminAuditLog) => format(new Date(audit.occurredAt), 'MMM d, yyyy HH:mm'),
      },
      {
        key: 'action',
        header: 'Action',
        render: (audit: SuperAdminAuditLog) => (
          <div>
            <div style={{ fontWeight: 700, color: 'var(--cs-ink-900)' }}>{audit.action || '-'}</div>
            <div className="meta" style={{ fontSize: 11.5 }}>{audit.id}</div>
          </div>
        ),
      },
      {
        key: 'entity',
        header: 'Entity',
        render: (audit: SuperAdminAuditLog) => (
          <div>
            <div>{audit.targetEntityType || '-'}</div>
            <div className="meta" style={{ fontSize: 11.5 }}>{audit.targetEntityId || '-'}</div>
          </div>
        ),
      },
      {
        key: 'actor',
        header: 'Actor',
        render: (audit: SuperAdminAuditLog) => (
          <div>
            <div>{audit.actorUserRef || '-'}</div>
            <div className="meta" style={{ fontSize: 11.5 }}>{audit.createdBy || audit.modifiedBy || '-'}</div>
          </div>
        ),
      },
      {
        key: 'tenantId',
        header: 'Tenant',
        className: 'meta',
        render: (audit: SuperAdminAuditLog) => audit.tenantId || '-',
      },
      {
        key: 'outcome',
        header: 'Outcome',
        render: (audit: SuperAdminAuditLog) => (
          <StatusChip status={statusToChip[audit.outcome] || 'INACTIVE'} label={audit.outcome || 'UNKNOWN'} />
        ),
      },
    ],
    [],
  );

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">Audit logs</h1>
                <p className="page-sub">{`${total} audit record${total === 1 ? '' : 's'} found`}</p>
              </div>
              <div className="row-end">
                <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
                  <RefreshCw className={isLoading ? 'mr-1 h-4 w-4 animate-spin' : 'mr-1 h-4 w-4'} />
                  Refresh
                </Button>
              </div>
            </header>

            <AppCard padded="md" style={{ marginTop: 14 }}>
              <AppCardHeader style={{ marginBottom: 12 }}>
                <div>
                  <AppCardTitle>Query</AppCardTitle>
                  <AppCardSub>Audit records are loaded from the super-admin query endpoint with server-side pagination.</AppCardSub>
                </div>
              </AppCardHeader>

              <div className="banks-filters">

                <Select value={String(selectedPageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Page size" />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size} / page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </AppCard>

            <AppCard style={{ marginTop: 14, overflow: 'hidden' }}>
              <PaginatedTable
                columns={columns}
                rows={audits}
                isLoading={isLoading}
                error={error}
                emptyMessage="No audit logs found"
                rowKey={(audit) => audit.id}
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setCurrentPage}
                className="border-0 shadow-none rounded-none"
              />
            </AppCard>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  );
}
