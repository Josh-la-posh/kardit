import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppCard, AppCardHeader, AppCardSub, AppCardTitle } from '@/components/ui/app-card';
import { Input } from '@/components/ui/input';
import { PaginatedTable } from '@/components/ui/paginated-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuditLogs } from '@/hooks/useAuditLogs';

const PAGE_SIZE = 20;

export default function AuditLogsListPage() {
  const navigate = useNavigate();
  const { logs, isLoading } = useAuditLogs();

  const [userSearch, setUserSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const actionTypes = useMemo(() => [...new Set(logs.map((l) => l.actionType))], [logs]);
  const entityTypes = useMemo(() => [...new Set(logs.map((l) => l.entityType))], [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const q = userSearch.toLowerCase();
      if (q && !l.userEmail.toLowerCase().includes(q)) return false;
      if (actionFilter !== 'ALL' && l.actionType !== actionFilter) return false;
      if (entityFilter !== 'ALL' && l.entityType !== entityFilter) return false;
      return true;
    });
  }, [logs, userSearch, actionFilter, entityFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const columns = useMemo(
    () => [
      {
        key: 'timestamp',
        header: 'Timestamp',
        className: 'whitespace-nowrap',
        render: (log: (typeof filtered)[number]) => format(new Date(log.timestamp), 'MMM d, yyyy HH:mm'),
      },
      {
        key: 'userEmail',
        header: 'User',
        render: (log: (typeof filtered)[number]) => log.userEmail,
      },
      {
        key: 'actionType',
        header: 'Action',
        render: (log: (typeof filtered)[number]) => (
          <span className="ujr-tag" style={{ fontFamily: 'var(--font-mono)' }}>{log.actionType}</span>
        ),
      },
      {
        key: 'entityType',
        header: 'Entity',
        render: (log: (typeof filtered)[number]) => log.entityType,
      },
      {
        key: 'entityId',
        header: 'Entity ID',
        className: 'meta',
        render: (log: (typeof filtered)[number]) => log.entityId || '�',
      },
    ],
    [filtered]
  );

  return (
    <ProtectedRoute requiredRoles={["Super Admin"]} requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout>
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">Audit logs</h1>
                <p className="page-sub">Activity history across users, entities, and actions.</p>
              </div>
            </header>

            {/* <section className="kpis" style={{ marginTop: 14 }}>
              <Kpi label="Total logs" value={String(logs.length)} sub="All captured events" />
              <Kpi label="Filtered" value={String(filtered.length)} sub="Matching current filters" />
              <Kpi label="Action" value={actionFilter === 'ALL' ? 'All' : actionFilter} sub="Active action filter" />
              <Kpi label="Entity" value={entityFilter === 'ALL' ? 'All' : entityFilter} sub="Active entity filter" />
            </section> */}

            <AppCard padded="md" style={{ marginTop: 14 }}>
              <AppCardHeader style={{ marginBottom: 12 }}>
                <div>
                  <AppCardTitle>Filters</AppCardTitle>
                  <AppCardSub>Search by user, then narrow by action and entity.</AppCardSub>
                </div>
              </AppCardHeader>

              <div className="onboarding-filters">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search by user email..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <Select
                  value={actionFilter}
                  onValueChange={(value) => {
                    setActionFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All actions</SelectItem>
                    {actionTypes.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select
                  value={entityFilter}
                  onValueChange={(value) => {
                    setEntityFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Entity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All entities</SelectItem>
                    {entityTypes.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </AppCard>

            <AppCard style={{ marginTop: 14, overflow: 'hidden' }}>
              <PaginatedTable
                columns={columns}
                rows={pagedRows}
                isLoading={isLoading}
                emptyMessage="No audit logs match filters."
                onRowClick={(row) => navigate(`/audit-logs/${row.id}`)}
                rowKey={(row) => row.id}
                page={safePage}
                pageSize={PAGE_SIZE}
                total={filtered.length}
                onPageChange={setPage}
                className="border-0 shadow-none rounded-none"
              />
            </AppCard>
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
