import { useState, useEffect, useCallback } from 'react';
import { reportStore, AppNotification } from '@/stores/reportStore';

const DELAY = 300;

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, DELAY));
    setNotifications(reportStore.getNotifications());
    setIsLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = useCallback((id: string) => {
    reportStore.markAsRead(id);
    setNotifications(reportStore.getNotifications());
  }, []);

  const markAllAsRead = useCallback(() => {
    reportStore.markAllAsRead();
    setNotifications(reportStore.getNotifications());
  }, []);

  const toggleRead = useCallback((id: string) => {
    reportStore.toggleRead(id);
    setNotifications(reportStore.getNotifications());
  }, []);

  return { notifications, isLoading, unreadCount, markAsRead, markAllAsRead, toggleRead, refetch: fetch };
}

export function useNotification(id: string | undefined) {
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    const t = setTimeout(() => {
      setNotification(reportStore.getNotification(id));
      setIsLoading(false);
    }, DELAY);
    return () => clearTimeout(t);
  }, [id]);

  return { notification, isLoading };
}
