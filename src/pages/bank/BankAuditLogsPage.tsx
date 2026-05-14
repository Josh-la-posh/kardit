import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBankAuditLogs } from '@/hooks/useBankPortal';

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
  }

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <div className="animate-fade-in">
          <PageHeader
            title="Audit Logs"
            subtitle="Review bank activity logs with filters and pagination."
            actions={
              <Button variant="outline" size="sm" onClick={() => refresh()} disabled={isLoading}>
                <RefreshCw className="mr-1 h-4 w-4" /> Refresh
              </Button>
            }
          />

          <div className="kardit-card p-4 mb-4">
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
                placeholder='End Date'
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
            <div className='flex justify-end gap-3 mt-4'>
                <Button className="bg-primary hover:bg-primary/90" onClick={applyFilters} disabled={isLoading}>
                Apply Filters
              </Button>
              <Button variant="outline" onClick={handleResetFilters} disabled={isLoading}>
                Reset Filters
              </Button>
              </div>
          </div>

          <div className="kardit-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="p-6 text-sm text-muted-foreground">{error}</div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">No audit logs returned.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Event</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Resource Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Resource ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Occurred</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.map((log, index) => (
                      <tr key={log.auditLogId || `${log.eventType}-${index}`} className={index % 2 === 1 ? 'bg-muted/20' : ''}>
                        <td className="px-4 py-3 text-sm font-medium">{log.eventType}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{log.resourceType || '-'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{log.resourceId || '-'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{log.actorUserId || '-'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {log.occurredAt ? format(new Date(log.occurredAt), 'MMM d, yyyy HH:mm') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} - {total} total log{total === 1 ? '' : 's'}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={isLoading || page <= 1} onClick={() => setPage(Math.max(1, page - 1))}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading || page >= totalPages}
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
