import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditLogsListPage() {
  const navigate = useNavigate();
  const { logs, isLoading } = useAuditLogs();

  const [userSearch, setUserSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const actionTypes = useMemo(() => [...new Set(logs.map(l => l.actionType))], [logs]);
  const entityTypes = useMemo(() => [...new Set(logs.map(l => l.entityType))], [logs]);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const q = userSearch.toLowerCase();
      if (q && !l.userEmail.toLowerCase().includes(q)) return false;
      if (actionFilter !== 'ALL' && l.actionType !== actionFilter) return false;
      if (entityFilter !== 'ALL' && l.entityType !== entityFilter) return false;
      return true;
    });
  }, [logs, userSearch, actionFilter, entityFilter]);

  return (
    <ProtectedRoute requiredRoles={["Super Admin"]}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader title="Audit Logs" subtitle="Activity history" />

          <div className="kardit-card p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Search by user email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-muted border-border"><SelectValue placeholder="Action" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Actions</SelectItem>
                  {actionTypes.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-muted border-border"><SelectValue placeholder="Entity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Entities</SelectItem>
                  {entityTypes.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="kardit-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">No audit logs match filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Entity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Entity ID</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((log, i) => (
                      <tr
                        key={log.id}
                        onClick={() => navigate(`/audit-logs/${log.id}`)}
                        className={`transition-colors hover:bg-muted/40 cursor-pointer ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm">{format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}</td>
                        <td className="px-4 py-3 text-sm">{log.userEmail}</td>
                        <td className="px-4 py-3 text-sm"><span className="px-2 py-0.5 rounded bg-muted text-xs font-mono">{log.actionType}</span></td>
                        <td className="px-4 py-3 text-sm">{log.entityType}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{log.entityId || '—'}</td>
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
