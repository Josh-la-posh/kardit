import { useMemo } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

const RECENT_NOTIFICATIONS_LIMIT = 5;

export function useRecentNotifications() {
  const { notifications, unreadCount, isLoading, error, refetch } = useNotifications({
    page: 1,
    pageSize: 25,
  });

  const recentNotifications = useMemo(() => {
    return [...notifications]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, RECENT_NOTIFICATIONS_LIMIT);
  }, [notifications]);

  return {
    notifications: recentNotifications,
    unreadCount,
    isLoading,
    error,
    markAsRead: () => {},
    markAllAsRead: () => {},
    refetch,
  };
}
