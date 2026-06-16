"use client";

import OverdueOrderPopup from "@/components/OverdueOrderPopup";
import useActiveChatStore from "@/hooks/useActiveChat";
import { useToast } from "@/hooks/use-toast";
import { useOverdueOrder } from "@/hooks/useOverdueOrder";
import {
  buildOptimisticChatNotification,
  buildOptimisticCustomerOrderNotification,
  buildOptimisticTaskerOrderCancelledNotification,
  getRealtimeNotificationIdentity,
} from "@/lib/realtime-notification";
import { connectSocket } from "@/lib/socket";
import { Bell, MessageCircle, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type RealtimeNotification = {
  _id?: string;
  title?: string;
  content?: string;
  type?: string;
  orderId?: string;
  senderName?: string;
};

type Props = {
  userId: string;
  role: string;
};

const POPUP_AUTO_CLOSE_MS = 7000;

export default function GlobalNotificationPopup({ userId, role }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [queue, setQueue] = useState<RealtimeNotification[]>([]);
  const shownIds = useRef<Set<string>>(new Set());

  const {
    open: overdueOpen,
    setOpen: setOverdueOpen,
    overdueInfo,
    showOverduePopup,
    handleKeepOrder,
    handleCancelOrder,
  } = useOverdueOrder();

  const markNotificationRead = useCallback(async (notificationId?: string) => {
    const id = String(notificationId ?? "");
    if (!id) return;

    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
    } catch {
      return;
    }
  }, []);

  const handleOverdueNotification = useCallback(
    async (notification: RealtimeNotification) => {
      const orderId = String(notification?.orderId ?? "");
      if (!orderId) return;

      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) return;

        const order = await res.json();
        showOverduePopup(order);
        await markNotificationRead(notification._id);
      } catch {
        return;
      }
    },
    [markNotificationRead, showOverduePopup],
  );

  const handleCompletionNotification = useCallback(
    (notification: RealtimeNotification) => {
      const orderId = String(notification?.orderId ?? "");
      if (!orderId) return;

      void markNotificationRead(notification._id);
      void router.push(`/orders/${orderId}`);
    },
    [markNotificationRead, router],
  );

  useEffect(() => {
    if (!userId) return;

    const socket = connectSocket(userId, role);
    if (!socket) return;

    const handleNewNotification = (notification: RealtimeNotification) => {
      const identity = getRealtimeNotificationIdentity(notification);
      if (identity && shownIds.current.has(identity)) return;
      if (identity) {
        shownIds.current.add(identity);
      }

      const notificationType = String(notification?.type ?? "").toLowerCase();

      if (notificationType === "order_overdue_warning") {
        void handleOverdueNotification(notification);
        return;
      }

      if (notificationType === "order_completed_confirmation") {
        handleCompletionNotification(notification);
        return;
      }

      setQueue((prev) => [...prev, notification]);
    };

    const handleOrderRealtime = (payload: unknown) => {
      if (role !== "CUSTOMER") return;

      const optimistic = buildOptimisticCustomerOrderNotification(payload);
      if (!optimistic) return;

      const identity = getRealtimeNotificationIdentity(optimistic);
      if (identity && shownIds.current.has(identity)) return;
      if (identity) {
        shownIds.current.add(identity);
      }

      setQueue((prev) => [...prev, optimistic]);
    };

    const handleChatRealtime = (payload: unknown) => {
      const optimistic = buildOptimisticChatNotification(payload, userId, role);
      if (!optimistic) return;
      if (useActiveChatStore.getState().isActiveOrder(optimistic.orderId)) {
        return;
      }

      const identity = getRealtimeNotificationIdentity(optimistic);
      if (identity && shownIds.current.has(identity)) return;
      if (identity) {
        shownIds.current.add(identity);
      }

      setQueue((prev) => [...prev, optimistic]);
    };

    const handleTaskerOrderCancelled = (payload: unknown) => {
      if (role !== "TASKER") return;

      const optimistic = buildOptimisticTaskerOrderCancelledNotification(payload);
      if (!optimistic) return;

      const identity = getRealtimeNotificationIdentity(optimistic);
      if (identity && shownIds.current.has(identity)) return;
      if (identity) {
        shownIds.current.add(identity);
      }

      setQueue((prev) => [...prev, optimistic]);
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("chat:message", handleChatRealtime);
    socket.on("order:cancelled", handleTaskerOrderCancelled);
    socket.on("order:updated", handleOrderRealtime);
    socket.on("order:status-updated", handleOrderRealtime);

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("chat:message", handleChatRealtime);
      socket.off("order:cancelled", handleTaskerOrderCancelled);
      socket.off("order:updated", handleOrderRealtime);
      socket.off("order:status-updated", handleOrderRealtime);
    };
  }, [handleCompletionNotification, handleOverdueNotification, role, userId]);

  const active = queue[0] ?? null;
  const dismissActive = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  useEffect(() => {
    if (!active) return;

    const timer = window.setTimeout(() => {
      dismissActive();
    }, POPUP_AUTO_CLOSE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [active, dismissActive]);

  const activeType = useMemo(
    () => String(active?.type ?? "").toLowerCase(),
    [active],
  );
  const isChatMessage = activeType === "chat_message";
  const isOrderCancelled = activeType === "order_cancelled";
  const isTaskerSurface = role === "TASKER" || pathname.startsWith("/tasker");
  const actionLabel = isChatMessage
    ? "Mở chat"
    : isTaskerSurface
      ? "Về dashboard"
      : "Xem chi tiết";

  const handleOpen = async () => {
    const orderId = String(active?.orderId ?? "");
    await markNotificationRead(active?._id);

    if (isTaskerSurface) {
      if (isChatMessage && orderId) {
        const target = `/tasker/dashboard?chat=true&orderId=${orderId}`;
        if (pathname !== target) {
          router.push(target);
        }
        dismissActive();
        return;
      }

      if (pathname !== "/tasker/dashboard") {
        router.push("/tasker/dashboard");
      }
      dismissActive();
      return;
    }

    if (!orderId) {
      dismissActive();
      return;
    }

    if (isChatMessage) {
      const target = `/orders/${orderId}?chat=true`;
      if (pathname !== target) {
        router.push(target);
      }
      dismissActive();
      return;
    }

    const target = `/orders/${orderId}`;
    if (pathname !== target) {
      router.push(target);
    }
    dismissActive();
  };

  return (
    <>
      {active && (
        <div className="fixed top-20 right-4 z-[120] w-[calc(100vw-2rem)] max-w-sm rounded-xl border bg-background shadow-xl">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {isChatMessage ? (
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                ) : (
                  <Bell
                    className={`h-5 w-5 ${
                      isOrderCancelled ? "text-red-600" : "text-orange-500"
                    }`}
                  />
                )}
                <p className="text-sm font-semibold line-clamp-1">
                  {active.title ||
                    (isOrderCancelled ? "Khách hàng đã hủy đơn" : "Thông báo mới")}
                </p>
              </div>
              <button
                type="button"
                onClick={dismissActive}
                className="rounded p-1 hover:bg-muted"
                aria-label="Đóng popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {active.content ||
                active.senderName ||
                (isOrderCancelled
                  ? "Đơn hàng bạn đã nhận vừa được khách hàng hủy."
                  : "Bạn có một cập nhật mới")}
            </p>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleOpen}
                className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 ${
                  isOrderCancelled ? "bg-red-600" : "bg-primary"
                }`}
              >
                {actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <OverdueOrderPopup
        open={overdueOpen}
        onOpenChange={setOverdueOpen}
        info={overdueInfo}
        onKeep={async () => {
          try {
            if (!overdueInfo?.orderId) return;
            await handleKeepOrder(overdueInfo.orderId);
            toast({
              title: "Đơn hàng được giữ lại",
              description: "Bạn đã chọn giữ lại đơn hàng này.",
            });
          } catch (err) {
            toast({
              title: "Lỗi",
              description:
                err instanceof Error ? err.message : "Không thể giữ đơn hàng",
              variant: "destructive",
            });
          }
        }}
        onCancel={async () => {
          try {
            if (!overdueInfo?.orderId) return;
            await handleCancelOrder(overdueInfo.orderId);
            toast({
              title: "Đơn hàng đã hủy",
              description: "Đơn hàng của bạn đã được hủy thành công.",
              variant: "destructive",
            });
          } catch (err) {
            toast({
              title: "Lỗi",
              description:
                err instanceof Error ? err.message : "Không thể hủy đơn hàng",
              variant: "destructive",
            });
          }
        }}
      />
    </>
  );
}
