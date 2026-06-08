"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Bell, Check, X } from "lucide-react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";
import { usePathname, useRouter } from "next/navigation";
import { connectSocket } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";

type Notification = {
  _id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt?: string;
  type?: string;
  orderId?: string;
  senderId?: string;
  senderName?: string;
};

type NotificationThreadItem = {
  key: string;
  representative: Notification;
  sourceIds: string[];
  unreadCount: number;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeTick, setTimeTick] = useState(0);
  const mounted = useRef(true);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    mounted.current = true;
    load();
    let handleNewNotification: ((notification: Notification) => void) | null = null;

    const bootstrapRealtime = async () => {
      try {
        const meRes = await fetch(`/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!meRes.ok) return;

        const me = await meRes.json();
        const userId = String(me?._id ?? me?.id ?? "");
        const role = String(me?.role ?? "CUSTOMER");

        if (!userId) return;

        const socket = connectSocket(userId, role);
        if (!socket) return;
        socketRef.current = socket;

        handleNewNotification = (notification: Notification) => {
          setItems((prev) => {
            const exists = prev.some((item) => item._id === notification._id);
            if (exists) return prev;

            return [notification, ...prev];
          });

          toast({
            title: notification.title || "Thông báo mới",
            description: notification.content || notification.senderName || "Bạn có một thông báo mới",
          });
        };

        socket.off("notification:new", handleNewNotification);
        socket.on("notification:new", handleNewNotification);
      } catch (error) {
        console.warn("Failed to bootstrap realtime notifications", error);
      }
    };

    void bootstrapRealtime();

    return () => {
      mounted.current = false;
      if (handleNewNotification) {
        socketRef.current?.off("notification:new", handleNewNotification);
      }
    };
  }, [toast]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!open) return;
      const target = event.target as Node;
      if (!rootRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTimeTick((prev) => prev + 1);
    }, 60000);

    return () => {
      window.clearInterval(id);
    };
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchNotifications(20);
      if (!mounted.current) return;
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  }

  const unreadCount = items.filter((i) => !i.isRead).length;

  const displayItems = useMemo<NotificationThreadItem[]>(() => {
    const sorted = [...items].sort((left, right) => {
      const leftTime = new Date(left.createdAt ?? 0).getTime();
      const rightTime = new Date(right.createdAt ?? 0).getTime();
      return rightTime - leftTime;
    });

    const map = new Map<string, NotificationThreadItem>();

    for (const item of sorted) {
      const isChat = item.type === "chat_message" && Boolean(item.orderId);
      const key = isChat ? `chat:${item.orderId}` : `single:${item._id}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          representative: item,
          sourceIds: [item._id],
          unreadCount: item.isRead ? 0 : 1,
        });
        continue;
      }

      const existing = map.get(key)!;
      existing.sourceIds.push(item._id);
      if (!item.isRead) {
        existing.unreadCount += 1;
      }
    }

    return Array.from(map.values());
  }, [items, timeTick]);

  const formatRelativeTime = (value?: string) => {
    if (!value) return "vừa xong";

    const createdAt = new Date(value).getTime();
    if (Number.isNaN(createdAt)) return "vừa xong";

    const diffMs = Date.now() - createdAt;
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes <= 0) return "vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  async function handleMarkRead(ids: string[]) {
    try {
      await Promise.all(ids.map((id) => markNotificationRead(id)));
      setItems((prev) => prev.map((p) => (ids.includes(p._id) ? { ...p, isRead: true } : p)));
    } catch (err) {
      console.warn("Mark read failed", err);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((p) => ({ ...p, isRead: true })));
    } catch (err) {
      console.warn("Mark all read failed", err);
    }
  }

  async function handleClickNotification(thread: NotificationThreadItem) {
    const notification = thread.representative;
    await handleMarkRead(thread.sourceIds);
    if (notification.type === 'chat_message' && notification.orderId) {
      setOpen(false);
      if (pathname.startsWith('/tasker')) {
        router.push(`/tasker/dashboard?chat=true&orderId=${notification.orderId}`);
      } else {
        router.push(`/orders/${notification.orderId}?chat=true`);
      }
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-label="Notifications"
        className="p-2 rounded-md hover:bg-muted transition-colors relative"
        onClick={() => setOpen((s) => !s)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-600 text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <strong>Thông báo</strong>
              <button
                className="text-sm text-muted-foreground"
                onClick={handleMarkAllRead}
              >
                Đánh dấu tất cả
              </button>
            </div>

            {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

            {!loading && displayItems.length === 0 && (
              <p className="text-sm text-muted-foreground">Không có thông báo mới</p>
            )}

            <ul className="space-y-2">
              {displayItems.map((thread) => {
                const n = thread.representative;
                const isRead = thread.unreadCount === 0;

                return (
                <li
                  key={thread.key}
                  className={`p-2 rounded-md hover:bg-muted transition-colors cursor-pointer flex items-start justify-between ${
                    isRead ? "opacity-70" : "bg-muted/5 border border-muted"
                  }`}
                  onClick={() => handleClickNotification(thread)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium truncate">{n.title}</div>
                      <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(n.createdAt)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{n.content}</div>
                    {n.senderName && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                         {n.senderName}
                         {isRead && (
                           <span className="ml-1 text-[10px] text-muted-foreground">
                             (đã đọc)
                           </span>
                         )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center ml-3 flex-shrink-0">
                    {!isRead ? (
                      <button
                        title="Đánh dấu đã đọc"
                        className="p-1 rounded-md hover:bg-muted"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleMarkRead(thread.sourceIds);
                        }}
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </button>
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground" />
                    )}
                    {thread.unreadCount > 1 && (
                      <span className="text-[10px] text-muted-foreground mt-1">
                        +{thread.unreadCount - 1}
                      </span>
                    )}
                  </div>
                </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
