import { useEffect, useState, useCallback, useMemo } from 'react';
import { connectSocket } from '@/lib/socket';
import { useUserStore } from '@/app/store/useUserStore';
import useActiveChatStore from '@/hooks/useActiveChat';
import {
  buildOptimisticChatNotification,
  buildOptimisticCustomerOrderNotification,
  buildOptimisticTaskerOrderCancelledNotification,
  getRealtimeNotificationIdentity,
  upsertRealtimeNotification,
} from '@/lib/realtime-notification';

const fetchAPI = async (path: string, options: RequestInit = {}) => {
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
};

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  content: string;
  type?: string;
  orderId?: string;
  senderId?: string;
  senderName?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

const mergeFetchedNotifications = (
  previous: Notification[],
  fetched: Notification[],
) => {
  const previousByIdentity = new Map(
    previous.map((item) => [getRealtimeNotificationIdentity(item), item] as const),
  );

  const sortedFetched = [...fetched]
    .map((item) => {
      const existing = previousByIdentity.get(getRealtimeNotificationIdentity(item));
      if (!existing) return item;

      return {
        ...item,
        isRead: existing.isRead || item.isRead,
      };
    })
    .sort((left, right) => {
    const leftTime = new Date(left.createdAt ?? 0).getTime();
    const rightTime = new Date(right.createdAt ?? 0).getTime();
    return rightTime - leftTime;
  });

  let next = sortedFetched;
  for (const item of previous) {
    const identity = getRealtimeNotificationIdentity(item);
    const alreadyExists = next.some(
      (existing) =>
        getRealtimeNotificationIdentity(existing) === identity ||
        (existing._id && item._id && existing._id === item._id),
    );

    if (!alreadyExists) {
      next = upsertRealtimeNotification(next, item);
    }
  }

  return next;
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [socketIdentity, setSocketIdentity] = useState<{
    userId: string;
    role: string;
  } | null>(null);
  const storeUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const storeUserId = useMemo(
    () => String(storeUser?._id ?? ''),
    [storeUser],
  );
  const storeUserRole = useMemo(
    () => String(storeUser?.role ?? 'CUSTOMER'),
    [storeUser],
  );
  const userId = socketIdentity?.userId ?? storeUserId;
  const userRole = socketIdentity?.role ?? storeUserRole;

  useEffect(() => {
    if (storeUserId) {
      setSocketIdentity({
        userId: storeUserId,
        role: storeUserRole || 'CUSTOMER',
      });
      return;
    }

    let cancelled = false;

    const bootstrapIdentity = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!res.ok) {
          if (!cancelled) {
            setSocketIdentity(null);
          }
          return;
        }

        const user = await res.json();
        const nextUserId = String(user?._id ?? user?.id ?? '').trim();
        const nextRole = String(user?.role ?? 'CUSTOMER').trim().toUpperCase();

        if (!cancelled && nextUserId) {
          setSocketIdentity({
            userId: nextUserId,
            role: nextRole,
          });
          setUser(user);
        }
      } catch {
        if (!cancelled) {
          setSocketIdentity(null);
        }
      }
    };

    void bootstrapIdentity();

    return () => {
      cancelled = true;
    };
  }, [setUser, storeUserId, storeUserRole]);

  // Tính toán unread count từ notifications
  const updateUnreadCount = useCallback((notifs: Notification[]) => {
    const count = notifs.filter((n) => !n.isRead).length;
    setUnreadCount(count);
  }, []);

  // Tải danh sách notification từ server
  const loadNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const response = await fetchAPI(`/notifications/user/${userId}`);
      if (response && Array.isArray(response)) {
        setNotifications((prev) => mergeFetchedNotifications(prev, response));
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    updateUnreadCount(notifications);
  }, [notifications, updateUnreadCount]);

  // Đánh dấu notification là đã đọc
  const markAsRead = useCallback((notificationId: string) => {
    fetchAPI(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    })
      .then(() => {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
      })
      .catch((error) => console.error('Failed to mark notification as read:', error));
  }, []);

  // Đánh dấu tất cả notification là đã đọc
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      await fetchAPI(`/notifications/user/${userId}/read-all`, {
        method: 'PATCH',
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [userId]);

  // Xóa notification
  const deleteNotification = useCallback((notificationId: string) => {
    fetchAPI(`/notifications/${notificationId}`, {
      method: 'DELETE',
    })
      .then(() => {
        setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      })
      .catch((error) => console.error('Failed to delete notification:', error));
  }, []);

  // Setup socket connection và lắng nghe real-time notification
  useEffect(() => {
    if (!userId) {
      return;
    }

    try {
      const socket = connectSocket(userId, userRole);

      if (!socket) {
        return;
      }

      // Lắng nghe notification mới
      const handleNewNotification = (notification: Notification) => {
        setNotifications((prev) => upsertRealtimeNotification(prev, notification));
      };

      const handleOrderRealtime = (payload: unknown) => {
        if (userRole !== 'CUSTOMER') return;

        const optimistic = buildOptimisticCustomerOrderNotification(payload);
        if (!optimistic) return;

        setNotifications((prev) =>
          upsertRealtimeNotification(prev, optimistic as Notification)
        );
      };

      const handleTaskerOrderCancelled = (payload: unknown) => {
        if (userRole !== 'TASKER') return;

        const optimistic = buildOptimisticTaskerOrderCancelledNotification(payload);
        if (!optimistic) return;

        setNotifications((prev) =>
          upsertRealtimeNotification(prev, optimistic as Notification)
        );
      };

      const handleChatRealtime = (payload: unknown) => {
        const optimistic = buildOptimisticChatNotification(payload, userId, userRole);
        if (!optimistic) return;
        if (useActiveChatStore.getState().isActiveOrder(optimistic.orderId)) {
          return;
        }

        setNotifications((prev) =>
          upsertRealtimeNotification(prev, optimistic as Notification)
        );
      };

      const handleConnect = () => {
        loadNotifications();
      };

      socket.on('notification:new', handleNewNotification);
      socket.on('chat:message', handleChatRealtime);
      socket.on('order:cancelled', handleTaskerOrderCancelled);
      socket.on('order:updated', handleOrderRealtime);
      socket.on('order:status-updated', handleOrderRealtime);
      socket.on('connect', handleConnect);
      loadNotifications();

      return () => {
        socket.off('notification:new', handleNewNotification);
        socket.off('chat:message', handleChatRealtime);
        socket.off('order:cancelled', handleTaskerOrderCancelled);
        socket.off('order:updated', handleOrderRealtime);
        socket.off('order:status-updated', handleOrderRealtime);
        socket.off('connect', handleConnect);
      };
    } catch (error) {
      console.error('Failed to setup notifications:', error);
    }
  }, [userId, userRole, loadNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    hasIdentity: Boolean(userId),
  };
};
