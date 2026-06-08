import { useCallback, useEffect, useState } from 'react';
import { getNotification, queryNotifications } from '@/services/notificationsApi';
import type { ListNotificationsRequest, SuperAdminNotification } from '@/types/superAdminContracts';
import { useAuth } from '@/hooks/useAuth';

export type AppNotificationSeverity = 'INFO' | 'WARNING' | 'ERROR';

export interface AppNotification {
  id: string;
  title: string;
  type: string;
  message: string;
  severity: AppNotificationSeverity;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
}

type UseNotificationsOptions = {
  status?: string;
  type?: string;
  page?: number;
  pageSize?: number;
};

function toSeverity(value: unknown): AppNotificationSeverity {
  if (typeof value !== 'string') return 'INFO';
  const normalized = value.trim().toUpperCase();
  if (normalized === 'WARNING' || normalized === 'ERROR') return normalized;
  return 'INFO';
}

function toReadState(status: string | undefined) {
  return status?.trim().toUpperCase() === 'READ';
}

function toTitle(notification: SuperAdminNotification) {
  if (notification.title?.trim()) return notification.title.trim();
  if (notification.type?.trim()) return notification.type.trim();
  return 'Notification';
}

function normalizeNotification(notification: SuperAdminNotification): AppNotification {
  const id = notification.notificationId;

  return {
    id,
    title: toTitle(notification),
    type: notification.type || 'Notification',
    message: notification.message || '',
    severity: toSeverity(notification.severity),
    isRead: toReadState(notification.status),
    createdAt: notification.createdAt,
    readAt: notification.readAt,
    relatedEntityType: notification.relatedEntityType,
    relatedEntityId: notification.relatedEntityId,
    metadata: notification.metadata,
  };
}

function extractNotifications(response: Awaited<ReturnType<typeof queryNotifications>>) {
  if (Array.isArray(response.notifications)) return response.notifications;
  if (Array.isArray(response.results)) return response.results;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.data)) return response.data;
  return [];
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user?.tenantId || !user?.id) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: ListNotificationsRequest = {
        tenantId: user.tenantId,
        userId: user.id,
        page: options.page ?? 1,
        pageSize: options.pageSize ?? 20,
        ...(options.status ? { status: options.status } : {}),
        ...(options.type ? { type: options.type } : {}),
      };

      const response = await queryNotifications(request);
      setNotifications(extractNotifications(response).map(normalizeNotification));
    } catch (err) {
      setNotifications([]);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [options.page, options.pageSize, options.status, options.type, user?.id, user?.tenantId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const markAsRead = useCallback((_id: string) => {}, []);
  const markAllAsRead = useCallback(() => {}, []);
  const toggleRead = useCallback((_id: string) => {}, []);

  return { notifications, isLoading, unreadCount, error, markAsRead, markAllAsRead, toggleRead, refetch: fetch };
}

export function useNotification(id: string | undefined) {
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) {
      setNotification(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getNotification(id);
      setNotification(normalizeNotification(response));
    } catch (err) {
      setNotification(null);
      setError(err instanceof Error ? err.message : 'Failed to load notification');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { notification, isLoading, error, refetch: fetch };
}
