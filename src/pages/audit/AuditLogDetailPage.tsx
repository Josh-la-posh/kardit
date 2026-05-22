import React from 'react';
import { format } from 'date-fns';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { AppCard, AppCardHeader, AppCardSub, AppCardTitle } from '@/components/ui/app-card';
import { useAuditLog } from '@/hooks/useAuditLogs';

const entityRoutes: Record<string, (id: string) => string> = {
  User: (id) => `/users/${id}`,
  Customer: (id) => `/customers/${id}`,
  Card: (id) => `/cards/${id}`,
  OnboardingCase: (id) => `/super-admin/onboarding/cases/${id}`,
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

  const entityRoute = log?.entityType && log?.entityId && entityRoutes[log.entityType]
    ? entityRoutes[log.entityType](log.entityId)
    : null;

  const renderKeyValues = (data: Record<string, any> | undefined) => {
    if (!data) return <p className="empty-list-sub">No data</p>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(data).map(([key, val]) => (
          <div key={key} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
            <span className="id" style={{ minWidth: 120 }}>{key}:</span>
            <span>{String(redactValue(key, val))}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ProtectedRoute requiredRoles={["Super Admin"]} requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout>
        <main className="scr-main">
          <div className="container container--narrow">
            <Link to="/audit-logs" className="back-link">
              <ArrowLeft /> Back to audit logs
            </Link>

            {isLoading ? (
              <AppCard padded="md" style={{ marginTop: 14 }}>
                <div style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </AppCard>
            ) : !log ? (
              <AppCard padded="md" style={{ marginTop: 14 }}>
                <div className="empty-list">Audit log entry not found.</div>
              </AppCard>
            ) : (
              <>
                <header className="page-head">
                  <div>
                    <h1 className="page-title">{log.actionType}</h1>
                    <p className="page-sub">{log.entityType} · {log.entityId || 'N/A'}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/audit-logs')}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                </header>

                <AppCard padded="md" style={{ marginTop: 14 }}>
                  <AppCardHeader style={{ marginBottom: 12 }}>
                    <div>
                      <AppCardTitle>Details</AppCardTitle>
                      <AppCardSub>Event context and actor metadata</AppCardSub>
                    </div>
                  </AppCardHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Timestamp</p><p>{format(new Date(log.timestamp), 'PPP p')}</p></div>
                    <div><p className="text-xs text-muted-foreground">User</p><p>{log.userEmail}</p></div>
                    <div><p className="text-xs text-muted-foreground">IP Address</p><p>{log.ipAddress || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">User Agent</p><p>{log.userAgent || '—'}</p></div>
                  </div>
                </AppCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginTop: 14 }}>
                  <AppCard padded="md">
                    <AppCardHeader style={{ marginBottom: 12 }}>
                      <div>
                        <AppCardTitle>Before</AppCardTitle>
                        <AppCardSub>Previous values</AppCardSub>
                      </div>
                    </AppCardHeader>
                    {renderKeyValues(log.oldValue)}
                  </AppCard>

                  <AppCard padded="md">
                    <AppCardHeader style={{ marginBottom: 12 }}>
                      <div>
                        <AppCardTitle>After</AppCardTitle>
                        <AppCardSub>New values</AppCardSub>
                      </div>
                    </AppCardHeader>
                    {renderKeyValues(log.newValue)}
                  </AppCard>
                </div>

                {entityRoute && (
                  <div style={{ marginTop: 14 }}>
                    <Button variant="outline" onClick={() => navigate(entityRoute)}>
                      <ExternalLink className="h-4 w-4 mr-1" /> Go to {log.entityType}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  );
}
