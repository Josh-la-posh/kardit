import React, { useMemo, useState } from 'react';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { PaginatedTable } from '@/components/ui/paginated-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBankAuditLogs } from '@/hooks/useBankPortal';
import type { BankAuditLogItem } from '@/types/bankPortalContracts';
import { format } from 'date-fns';

function getTotalPages(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
}

const pageSizeOptions = ['20', '50', '100'];

export default function BankAuditLogsPage() {
  const { logs, page, pageSize, total, filters, isLoading, error, refresh, setPage } = useBankAuditLogs();
  const [actorUserId, setActorUserId] = useState(filters.actorUserId);
  const [eventType, setEventType] = useState(filters.eventType);
  const [fromDate, setFromDate] = useState(filters.fromDate);
  const [toDate, setToDate] = useState(filters.toDate);

  const totalPages = getTotalPages(total, pageSize);
  const eventTypes = useMemo(() => [...new Set(logs.map((log) => log.eventType).filter(Boolean))], [logs]);
  const columns = useMemo(
    () => [
      {
        key: 'eventType',
        header: 'Event',
        className: 'text-sm font-medium text-foreground',
        render: (log: BankAuditLogItem) => log.eventType || '-',
      },
      {
        key: 'resourceType',
        header: 'Resource Type',
        className: 'text-sm text-muted-foreground',
        render: (log: BankAuditLogItem) => log.resourceType || '-',
      },
      {
        key: 'resourceId',
        header: 'Resource ID',
        className: 'text-sm text-muted-foreground',
        render: (log: BankAuditLogItem) => log.resourceId || '-',
      },
      {
        key: 'actorUserId',
        header: 'Actor',
        className: 'text-sm text-muted-foreground',
        render: (log: BankAuditLogItem) => log.actorUserId || '-',
      },
      {
        key: 'occurredAt',
        header: 'Occurred',
        className: 'text-sm text-muted-foreground',
        render: (log: BankAuditLogItem) =>
          log.occurredAt ? format(new Date(log.occurredAt), 'MMM d, yyyy HH:mm') : '-',
      },
    ],
    []
  );

  const applyFilters = () => {
    void refresh({
      page: 1,
      filters: {
        actorUserId: actorUserId.trim(),
        eventType: eventType === 'ALL' ? '' : eventType,
        fromDate,
        toDate,
      },
    });
  };

  const handlePageSizeChange = (value: string) => {
    void refresh({ page: 1, pageSize: Number(value) });
  };

  const handleResetFilters = () => {
    setActorUserId('');
    setEventType('ALL');
    setFromDate('');
    setToDate('');
    void refresh({ page: 1, filters: {} });
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">Audit Logs</h1>
                <p className="page-sub">Review bank activity logs with filters and pagination.</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => refresh()} disabled={isLoading}>
                <RefreshCw className={isLoading ? 'spin' : ''} /> Refresh
              </button>
            </header>

            {/* <section className="kpis" style={{ marginTop: 14 }}>
              <Kpi label="Total logs" value={String(total)} sub="Current query scope" />
              <Kpi label="Current page" value={`${page}/${totalPages}`} sub={`${pageSize} rows per page`} />
              <Kpi label="Event types" value={String(eventTypes.length)} sub="Distinct events on this page" />
              <Kpi label="Filtered actor" value={actorUserId.trim() ? 'Yes' : 'No'} sub="Actor ID filter applied" />
            </section> */}

            <section className="bch-card card-pad" style={{ marginTop: 14 }}>
              <div className="grid gap-3 md:grid-cols-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Filter by actor user ID..."
                    value={actorUserId}
                    onChange={(e) => setActorUserId(e.target.value)}
                  />
                </div>
                <Select value={eventType || 'ALL'} onValueChange={setEventType}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue placeholder="Event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Events</SelectItem>
                    {eventTypes.map((event) => (
                      <SelectItem key={event} value={event}>
                        {event}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="date"
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
                <input
                  type="date"
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholder="End Date"
                />
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-28 bg-muted border-border">
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
              <div className="flex justify-end gap-3 mt-4">
                <Button className="bg-primary hover:bg-primary/90" onClick={applyFilters} disabled={isLoading}>
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={handleResetFilters} disabled={isLoading}>
                  Reset Filters
                </Button>
              </div>
            </section>

            <PaginatedTable<BankAuditLogItem>
              className="mt-4"
              columns={columns}
              rows={logs}
              isLoading={isLoading}
              error={error}
              emptyMessage="No audit logs returned."
              rowKey={(log, index) => log.auditLogId || `${log.eventType}-${index}`}
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
            />
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}
