import { useEffect, useState, useCallback, useMemo } from 'react';
import { connectSocket } from '@/lib/socket';
import { useUserStore } from '@/app/store/useUserStore';
import {
  buildOptimisticOrderAcceptedNotification,
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

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const storeUser = useUserStore((state) => state.user);

  const userId = useMemo(
    () => String(storeUser?._id ?? ''),
    [storeUser],
  );
  const userRole = useMemo(
    () => String(storeUser?.role ?? 'CUSTOMER'),
    [storeUser],
  );

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
        setNotifications(response);
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

        const optimistic = buildOptimisticOrderAcceptedNotification(payload);
        if (!optimistic) return;

        setNotifications((prev) =>
          upsertRealtimeNotification(prev, optimistic as Notification)
        );
      };

      const handleConnect = () => {
        loadNotifications();
      };

      socket.on('notification:new', handleNewNotification);
      socket.on('order:updated', handleOrderRealtime);
      socket.on('order:status-updated', handleOrderRealtime);
      socket.on('connect', handleConnect);
      loadNotifications();

      return () => {
        socket.off('notification:new', handleNewNotification);
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
  };
};
