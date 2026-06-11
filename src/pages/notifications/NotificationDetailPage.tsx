import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { useNotification } from '@/hooks/useNotifications';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';

const entityRoutes: Record<string, (id: string) => string> = {
  Customer: (id) => `/customers/${id}`,
  Card: (id) => `/cards/${id}`,
  User: (id) => `/users/${id}`,
  LoadBatch: (id) => `/loads/batches/${id}`,
};

export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notification, isLoading, error } = useNotification(id);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <main className="scr-main">
            <div className="container" style={{ display: 'grid', placeItems: 'center', paddingTop: 80 }}>
              <Loader2 className="spin" style={{ width: 26, height: 26 }} />
            </div>
          </main>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (!notification) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <main className="scr-main">
            <div className="container">
              <section className="bch-card" style={{ padding: 24 }}>
                <div className="empty-list-title">{error ? 'Unable to load notification' : 'Notification not found'}</div>
                <div className="empty-list-sub">{error || 'This notification may have been removed.'}</div>
                <div style={{ marginTop: 12 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/notifications')}>
                    <ArrowLeft className="h-4 w-4" /> Back to notifications
                  </button>
                </div>
              </section>
            </div>
          </main>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const statusMap: Record<string, StatusType> = { INFO: 'INFO', WARNING: 'WARNING', ERROR: 'ERROR' };
  const relatedRoute =
    notification.relatedEntityType && notification.relatedEntityId && entityRoutes[notification.relatedEntityType]
      ? entityRoutes[notification.relatedEntityType](notification.relatedEntityId)
      : null;

  return (
    <ProtectedRoute>
      <AppLayout>
        <main className="scr-main">
          <div className="container container--narrow">
            <header className="page-head">
              <div>
                <button className="back-link" onClick={() => navigate('/notifications')}>
                  <ArrowLeft /> Back to notifications
                </button>
                <h1 className="page-title">{notification.title}</h1>
                <p className="page-sub">Review notification details and take action.</p>
              </div>
              <StatusChip status={statusMap[notification.severity]} />
            </header>

            <section className="kpis" style={{ marginTop: 14 }}>
              <Kpi label="Severity" value={notification.severity} sub="Classification" />
              <Kpi label="Status" value={notification.isRead ? 'Read' : 'Unread'} sub="Current read state" />
              <Kpi label="Created" value={format(new Date(notification.createdAt), 'MMM d, HH:mm')} sub="Event timestamp" />
              <Kpi
                label="Related"
                value={notification.relatedEntityType || '-'}
                sub={notification.relatedEntityId ? `ID: ${notification.relatedEntityId}` : 'No linked entity'}
              />
            </section>

            <section className="bch-card card-pad" style={{ marginTop: 14 }}>
              <div className="section-head" style={{ marginTop: 0 }}>
                <div>
                  <div className="section-title">Message</div>
                  <div className="section-sub">Notification body and metadata</div>
                </div>
              </div>

              <div style={{ color: 'var(--cs-ink-400)', fontSize: 14, lineHeight: 1.65 }}>{notification.message}</div>

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--cs-line)', display: 'grid', gap: 6 }}>
                <div className="section-sub">Created: {format(new Date(notification.createdAt), 'PPP p')}</div>
                {notification.readAt && <div className="section-sub">Read: {format(new Date(notification.readAt), 'PPP p')}</div>}
                <div className="section-sub">Status: {notification.isRead ? 'Read' : 'Unread'}</div>
                <div className="section-sub">Type: {notification.type}</div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled
                  title="Read-state updates are not yet wired to the API"
                >
                  {notification.isRead ? 'Mark as unread' : 'Mark as read'}
                </button>

                {relatedRoute && (
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(relatedRoute)}>
                    <ExternalLink className="h-4 w-4" /> Go to related item
                  </button>
                )}
              </div>
            </section>
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
