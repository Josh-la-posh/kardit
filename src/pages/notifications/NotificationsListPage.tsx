import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useNotifications } from '@/hooks/useNotifications';
import { Loader2, Bell, AlertTriangle, AlertCircle, Info, CheckSquare, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const severityIcons = { INFO: Info, WARNING: AlertTriangle, ERROR: AlertCircle };
const severityColors = { INFO: 'text-info', WARNING: 'text-warning', ERROR: 'text-destructive' };

export default function NotificationsListPage() {
  const navigate = useNavigate();
  const { notifications, isLoading, markAllAsRead } = useNotifications();
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [readFilter, setReadFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (severityFilter !== 'ALL' && n.severity !== severityFilter) return false;
      if (readFilter === 'UNREAD' && n.isRead) return false;
      if (readFilter === 'READ' && !n.isRead) return false;
      return true;
    });
  }, [notifications, severityFilter, readFilter]);

  const handleMarkAll = () => {
    markAllAsRead();
    toast.success('All notifications marked as read');
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader title="Notifications" subtitle="View all notifications" actions={
            <Button variant="outline" size="sm" onClick={handleMarkAll}><CheckSquare className="h-4 w-4 mr-1" /> Mark all read</Button>
          } />

          <div className="kardit-card p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-muted border-border"><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Severities</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                </SelectContent>
              </Select>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-muted border-border"><SelectValue placeholder="Read status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="UNREAD">Unread</SelectItem>
                  <SelectItem value="READ">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="kardit-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">No notifications match filters.</div>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map(n => {
                  const Icon = severityIcons[n.severity];
                  return (
                    <li
                      key={n.id}
                      onClick={() => navigate(`/notifications/${n.id}`)}
                      className={cn('px-4 py-4 cursor-pointer transition-colors hover:bg-muted/40', !n.isRead && 'bg-muted/20')}
                    >
                      <div className="flex gap-3 items-start">
                        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', severityColors[n.severity])} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn('text-sm', !n.isRead && 'font-medium')}>{n.title}</p>
                            {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{n.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
