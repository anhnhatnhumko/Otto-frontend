import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { connectSocket } from "@/lib/socket";
import { useUserStore } from "@/app/store/useUserStore";
import {
  buildOptimisticChatNotification,
  buildOptimisticOrderAcceptedNotification,
  buildOptimisticTaskerOrderCancelledNotification,
  mergeFetchedNotifications,
  upsertRealtimeNotification,
} from "@/lib/realtime-notification";

const POLLING_INTERVAL_MS = 1000;

const fetchAPI = async (path: string, options: RequestInit = {}) => {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
    ...options,
  });

  if (!response.ok) {
    throw new Error(String(response.status));
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

type AuthLikeUser = {
  _id?: string;
  id?: string;
  role?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
};

const normalizeUser = (user: AuthLikeUser | null) => {
  if (!user) {
    return null;
  }

  const userId = String(user._id ?? user.id ?? "").trim();
  if (!userId) {
    return null;
  }

  return {
    _id: userId,
    fullName: String(user.fullName ?? "").trim(),
    email: String(user.email ?? "").trim(),
    role: String(user.role ?? "").trim(),
    avatar: user.avatar,
  };
};

export const useNotifications = () => {
  const storeUser = useUserStore((state) => state.user);
  const [resolvedUser, setResolvedUser] = useState<AuthLikeUser | null>(null);
  const [hasResolvedIdentity, setHasResolvedIdentity] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isFetchingRef = useRef(false);

  const activeUser = useMemo(
    () => normalizeUser(storeUser) ?? normalizeUser(resolvedUser),
    [resolvedUser, storeUser],
  );
  const userId = useMemo(() => String(activeUser?._id ?? "").trim(), [activeUser]);
  const userRole = useMemo(
    () => String(activeUser?.role ?? "CUSTOMER").trim().toUpperCase(),
    [activeUser],
  );
  const hasIdentity = Boolean(userId);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  useEffect(() => {
    let cancelled = false;

    const bootstrapIdentity = async () => {
      const normalizedStoreUser = normalizeUser(storeUser);

      if (normalizedStoreUser) {
        setResolvedUser(normalizedStoreUser);
        setHasResolvedIdentity(true);
        return;
      }

      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setResolvedUser(null);
          }
          return;
        }

        const data = (await response.json()) as AuthLikeUser;
        if (!cancelled) {
          setResolvedUser(data);
        }
      } catch {
        if (!cancelled) {
          setResolvedUser(null);
        }
      } finally {
        if (!cancelled) {
          setHasResolvedIdentity(true);
        }
      }
    };

    void bootstrapIdentity();

    return () => {
      cancelled = true;
    };
  }, [storeUser]);

  const loadNotifications = useCallback(async () => {
    if (!userId || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;

    try {
      setIsLoading(true);
      const response = await fetchAPI(`/notifications/user/${userId}`);

      if (Array.isArray(response)) {
        setNotifications((prev) =>
          mergeFetchedNotifications(response as Notification[], prev),
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error ?? "");

      if (message === "401" || message === "403") {
        setNotifications([]);
      } else {
        console.error("Failed to load notifications:", error);
      }
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [userId]);

  const markAsRead = useCallback((notificationId: string) => {
    void fetchAPI(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    })
      .then(() => {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId
              ? { ...notification, isRead: true }
              : notification,
          ),
        );
      })
      .catch((error) => console.error("Failed to mark notification as read:", error));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      await fetchAPI(`/notifications/user/${userId}/read-all`, {
        method: "PATCH",
      });
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, [userId]);

  const deleteNotification = useCallback((notificationId: string) => {
    void fetchAPI(`/notifications/${notificationId}`, {
      method: "DELETE",
    })
      .then(() => {
        setNotifications((prev) =>
          prev.filter((notification) => notification._id !== notificationId),
        );
      })
      .catch((error) => console.error("Failed to delete notification:", error));
  }, []);

  useEffect(() => {
    if (!hasResolvedIdentity || !userId) {
      return;
    }

    const socket = connectSocket(userId, userRole);
    if (!socket) {
      return;
    }

    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => upsertRealtimeNotification(prev, notification));
    };

    const handleIncomingChat = (payload: unknown) => {
      const nextNotification = buildOptimisticChatNotification(payload, userId);
      if (!nextNotification) {
        return;
      }

      setNotifications((prev) =>
        upsertRealtimeNotification(prev, nextNotification as Notification),
      );
    };

    const handleCustomerOrderRealtime = (payload: unknown) => {
      if (userRole !== "CUSTOMER") {
        return;
      }

      const nextNotification = buildOptimisticOrderAcceptedNotification(payload);
      if (!nextNotification) {
        return;
      }

      setNotifications((prev) =>
        upsertRealtimeNotification(prev, nextNotification as Notification),
      );
    };

    const handleTaskerOrderCancelled = (payload: unknown) => {
      if (userRole !== "TASKER") {
        return;
      }

      const nextNotification =
        buildOptimisticTaskerOrderCancelledNotification(payload);
      if (!nextNotification) {
        return;
      }

      setNotifications((prev) =>
        upsertRealtimeNotification(prev, nextNotification as Notification),
      );
    };

    const handleReconnect = () => {
      void loadNotifications();
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("chat:message", handleIncomingChat);
    socket.on("order:updated", handleCustomerOrderRealtime);
    socket.on("order:status-updated", handleCustomerOrderRealtime);
    socket.on("order:cancelled", handleTaskerOrderCancelled);
    socket.on("connect", handleReconnect);

    void loadNotifications();

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("chat:message", handleIncomingChat);
      socket.off("order:updated", handleCustomerOrderRealtime);
      socket.off("order:status-updated", handleCustomerOrderRealtime);
      socket.off("order:cancelled", handleTaskerOrderCancelled);
      socket.off("connect", handleReconnect);
    };
  }, [hasResolvedIdentity, loadNotifications, userId, userRole]);

  useEffect(() => {
    if (!hasResolvedIdentity || !userId) {
      return;
    }

    const loadIfVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      void loadNotifications();
    };

    loadIfVisible();

    const intervalId = window.setInterval(() => {
      loadIfVisible();
    }, POLLING_INTERVAL_MS);

    const handleVisibilityChange = () => {
      loadIfVisible();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hasResolvedIdentity, loadNotifications, userId]);

  return {
    notifications,
    unreadCount,
    isLoading,
    hasIdentity,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
