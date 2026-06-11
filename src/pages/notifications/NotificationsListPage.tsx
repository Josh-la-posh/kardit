import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useNotifications } from '@/hooks/useNotifications';
import { AlertCircle, AlertTriangle, Bell, CheckSquare, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const severityIcons = { INFO: Info, WARNING: AlertTriangle, ERROR: AlertCircle };
const severityColors = {
  INFO: 'text-[var(--cs-green-700)]',
  WARNING: 'text-[var(--warning-text)]',
  ERROR: 'text-[var(--cs-red-700)]',
};

export default function NotificationsListPage() {
  const navigate = useNavigate();
  const { notifications, isLoading, error } = useNotifications();
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [readFilter, setReadFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (severityFilter !== 'ALL' && n.severity !== severityFilter) return false;
      if (readFilter === 'UNREAD' && n.isRead) return false;
      if (readFilter === 'READ' && !n.isRead) return false;
      return true;
    });
  }, [notifications, severityFilter, readFilter]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);
  const warningCount = useMemo(() => notifications.filter((n) => n.severity === 'WARNING').length, [notifications]);
  const errorCount = useMemo(() => notifications.filter((n) => n.severity === 'ERROR').length, [notifications]);

  return (
    <ProtectedRoute>
      <AppLayout>
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">Notifications</h1>
                <p className="page-sub">View all notifications and quickly triage unread items.</p>
              </div>
              <button className="btn btn-ghost btn-sm" disabled={true} title="Read-state updates are not yet wired to the API">
                <CheckSquare className="h-4 w-4" /> Mark all read
              </button>
            </header>

            <section className="kpis" style={{ marginTop: 14 }}>
              <Kpi label="Total" value={String(notifications.length)} sub="All notifications" />
              <Kpi label="Unread" value={String(unreadCount)} sub="Need your attention" />
              <Kpi label="Warnings" value={String(warningCount)} sub="Potential issues" />
              <Kpi label="Errors" value={String(errorCount)} sub="High priority events" />
            </section>

            <section className="bch-card card-pad" style={{ marginTop: 14 }}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="bch-label" htmlFor="severityFilter">Severity</label>
                  <select
                    id="severityFilter"
                    className="bch-select"
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                  >
                    <option value="ALL">All Severities</option>
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="ERROR">Error</option>
                  </select>
                </div>
                <div>
                  <label className="bch-label" htmlFor="readFilter">Read status</label>
                  <select
                    id="readFilter"
                    className="bch-select"
                    value={readFilter}
                    onChange={(e) => setReadFilter(e.target.value)}
                  >
                    <option value="ALL">All</option>
                    <option value="UNREAD">Unread</option>
                    <option value="READ">Read</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="bch-card" style={{ overflow: 'hidden', marginTop: 14 }}>
              <div className="card-head">
                <div className="card-head-title">Notification feed</div>
              </div>

              {isLoading ? (
                <div style={{ display: 'grid', placeItems: 'center', padding: 48 }}>
                  <Loader2 className="spin" style={{ width: 24, height: 24 }} />
                </div>
              ) : error ? (
                <div className="empty-list" style={{ padding: 24 }}>
                  <Bell />
                  <div className="empty-list-title">Unable to load notifications</div>
                  <div className="empty-list-sub">{error}</div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty-list" style={{ padding: 24 }}>
                  <Bell />
                  <div className="empty-list-title">No notifications match filters</div>
                  <div className="empty-list-sub">Adjust severity or read status to broaden the list.</div>
                </div>
              ) : (
                <ul className="recent" style={{ border: 'none', borderRadius: 0 }}>
                  {filtered.map((n) => {
                    const Icon = severityIcons[n.severity];
                    return (
                      <li
                        key={n.id}
                        onClick={() => navigate(`/notifications/${n.id}`)}
                        className={cn('recent-row cursor-pointer hover:bg-[var(--bg)]', !n.isRead && 'bg-[var(--bg)]')}
                      >
                        <div className={cn('recent-row__icon', severityColors[n.severity])} style={{ background: 'var(--surface)', border: '1px solid var(--cs-line)' }}>
                          <Icon />
                        </div>
                        <div className="recent-row__body">
                          <div className="recent-row__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={cn(!n.isRead && 'font-semibold')}>{n.title}</span>
                            {!n.isRead && <span style={{ width: 6, height: 6, borderRadius: '999px', background: 'var(--cs-green-700)' }} />}
                          </div>
                          <div className="recent-row__meta" style={{ marginTop: 4 }}>{n.message}</div>
                        </div>
                        <div className="recent-row__time">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</div>
                      </li>
                    );
                  })}
                </ul>
              )}
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
