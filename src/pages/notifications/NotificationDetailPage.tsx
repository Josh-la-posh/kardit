import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { useNotification, useNotifications } from '@/hooks/useNotifications';
import { Loader2, ArrowLeft, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

const entityRoutes: Record<string, (id: string) => string> = {
  Customer: id => `/customers/${id}`,
  Card: id => `/cards/${id}`,
  User: id => `/users/${id}`,
  LoadBatch: id => `/loads/batches/${id}`,
};

export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notification, isLoading } = useNotification(id);
  const { toggleRead } = useNotifications();

  if (isLoading) {
    return <ProtectedRoute><AppLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout></ProtectedRoute>;
  }

  if (!notification) {
    return <ProtectedRoute><AppLayout><div className="text-center py-20 text-muted-foreground">Notification not found.</div></AppLayout></ProtectedRoute>;
  }

  const statusMap: Record<string, StatusType> = { INFO: 'INFO', WARNING: 'WARNING', ERROR: 'ERROR' };
  const relatedRoute = notification.relatedEntityType && notification.relatedEntityId && entityRoutes[notification.relatedEntityType]
    ? entityRoutes[notification.relatedEntityType](notification.relatedEntityId)
    : null;

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in max-w-2xl">
          <PageHeader title={notification.title} actions={
            <div className="flex items-center gap-2">
              <StatusChip status={statusMap[notification.severity]} />
              <Button variant="outline" size="sm" onClick={() => navigate('/notifications')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            </div>
          } />

          <div className="kardit-card p-6 space-y-4">
            <div className="prose prose-invert max-w-none">
              <p className="text-sm text-foreground leading-relaxed">{notification.message}</p>
            </div>

            <div className="flex flex-col gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
              <p>Created: {format(new Date(notification.createdAt), 'PPP p')}</p>
              {notification.readAt && <p>Read: {format(new Date(notification.readAt), 'PPP p')}</p>}
              <p>Status: {notification.isRead ? 'Read' : 'Unread'}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => { toggleRead(notification.id); navigate('/notifications'); }}>
                {notification.isRead ? <><EyeOff className="h-4 w-4 mr-1" /> Mark as unread</> : <><Eye className="h-4 w-4 mr-1" /> Mark as read</>}
              </Button>
              {relatedRoute && (
                <Button variant="outline" size="sm" onClick={() => navigate(relatedRoute)}>
                  <ExternalLink className="h-4 w-4 mr-1" /> Go to related item
                </Button>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
