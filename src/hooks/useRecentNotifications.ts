import { useState, useEffect, useCallback } from 'react';
import { 
  Notification, 
  mockNotifications, 
  simulateDelay 
} from '@/services/mockData';

/**
 * Hook to fetch recent notifications
 * 
 * Usage:
 * const { notifications, unreadCount, isLoading, markAsRead } = useRecentNotifications();
 */
export function useRecentNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await simulateDelay(400);
      setNotifications(mockNotifications);
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  return { 
    notifications, 
    unreadCount, 
    isLoading, 
    error, 
    markAsRead, 
    markAllAsRead,
    refetch: fetchNotifications 
  };
}
