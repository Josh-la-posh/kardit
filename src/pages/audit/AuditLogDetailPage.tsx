import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { useAuditLog } from '@/hooks/useAuditLogs';
import { Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const entityRoutes: Record<string, (id: string) => string> = {
  User: id => `/users/${id}`,
  Customer: id => `/customers/${id}`,
  Card: id => `/cards/${id}`,
};

const SENSITIVE_PATTERNS = /password|secret|token|pan|card.?number/i;

function redactValue(key: string, value: any): any {
  if (typeof value === 'string' && SENSITIVE_PATTERNS.test(key)) return '••••';
  return value;
}

export default function AuditLogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { log, isLoading } = useAuditLog(id);

  if (isLoading) return <ProtectedRoute><AppLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout></ProtectedRoute>;
  if (!log) return <ProtectedRoute><AppLayout><div className="text-center py-20 text-muted-foreground">Audit log entry not found.</div></AppLayout></ProtectedRoute>;

  const entityRoute = log.entityType && log.entityId && entityRoutes[log.entityType]
    ? entityRoutes[log.entityType](log.entityId)
    : null;

  const renderKeyValues = (data: Record<string, any> | undefined, label: string) => {
    if (!data) return <p className="text-sm text-muted-foreground italic">No data</p>;
    return (
      <div className="space-y-1">
        {Object.entries(data).map(([key, val]) => (
          <div key={key} className="flex gap-2 text-sm">
            <span className="text-muted-foreground min-w-[120px] font-mono text-xs">{key}:</span>
            <span>{String(redactValue(key, val))}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in max-w-2xl">
          <PageHeader title={log.actionType} subtitle={`${log.entityType} • ${log.entityId || 'N/A'}`} actions={
            <Button variant="outline" size="sm" onClick={() => navigate('/audit-logs')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          } />

          {/* Meta */}
          <div className="kardit-card p-6 mb-4 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Timestamp</p><p>{format(new Date(log.timestamp), 'PPP p')}</p></div>
              <div><p className="text-xs text-muted-foreground">User</p><p>{log.userEmail}</p></div>
              <div><p className="text-xs text-muted-foreground">IP Address</p><p>{log.ipAddress || '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">User Agent</p><p>{log.userAgent || '—'}</p></div>
            </div>
          </div>

          {/* Changes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="kardit-card p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Before</h3>
              {renderKeyValues(log.oldValue, 'Old')}
            </div>
            <div className="kardit-card p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">After</h3>
              {renderKeyValues(log.newValue, 'New')}
            </div>
          </div>

          {entityRoute && (
            <Button variant="outline" onClick={() => navigate(entityRoute)}>
              <ExternalLink className="h-4 w-4 mr-1" /> Go to {log.entityType}
            </Button>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
