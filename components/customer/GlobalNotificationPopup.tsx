"use client";

import OverdueOrderPopup from "@/components/OverdueOrderPopup";
import { useToast } from "@/hooks/use-toast";
import { useOverdueOrder } from "@/hooks/useOverdueOrder";
import { connectSocket } from "@/lib/socket";
import { Bell, MessageCircle, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const [active, setActive] = useState<RealtimeNotification | null>(null);
  const shownIds = useRef<Set<string>>(new Set());

  const {
    open: overdueOpen,
    setOpen: setOverdueOpen,
    overdueInfo,
    showOverduePopup,
    handleKeepOrder,
    handleCancelOrder,
  } = useOverdueOrder();

  const markNotificationRead = async (notificationId?: string) => {
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
  };

  const handleOverdueNotification = async (notification: RealtimeNotification) => {
    const orderId = String(notification?.orderId ?? "");
    if (!orderId) return;

    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
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
  };

  const handleCompletionNotification = (notification: RealtimeNotification) => {
    const orderId = String(notification?.orderId ?? "");
    if (!orderId) return;

    void markNotificationRead(notification._id);
    void router.push(`/orders/${orderId}`);
  };

  useEffect(() => {
    if (!userId) return;

    const socket = connectSocket(userId, role);

    const handleNewNotification = (notification: RealtimeNotification) => {
      const id = String(notification?._id ?? "");
      if (id && shownIds.current.has(id)) return;
      if (id) {
        shownIds.current.add(id);
      }

      if (String(notification?.type ?? "").toLowerCase() === "order_overdue_warning") {
        void handleOverdueNotification(notification);
        return;
      }

      if (String(notification?.type ?? "").toLowerCase() === "order_completed_confirmation") {
        handleCompletionNotification(notification);
        return;
      }

      setQueue((prev) => [...prev, notification]);
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [userId, role]);

  useEffect(() => {
    if (active || queue.length === 0) return;
    setActive(queue[0]);
    setQueue((prev) => prev.slice(1));
  }, [active, queue]);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => {
      setActive(null);
    }, POPUP_AUTO_CLOSE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [active]);

  const isChatMessage = useMemo(
    () => String(active?.type ?? "").toLowerCase() === "chat_message",
    [active],
  );

  const handleOpen = async () => {
    const orderId = String(active?.orderId ?? "");
    await markNotificationRead(active?._id);

    if (!orderId) {
      setActive(null);
      return;
    }

    if (isChatMessage) {
      const target = `/orders/${orderId}?chat=true`;
      if (pathname !== target) {
        router.push(target);
      }
      setActive(null);
      return;
    }

    const target = `/orders/${orderId}`;
    if (pathname !== target) {
      router.push(target);
    }
    setActive(null);
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
                  <Bell className="h-5 w-5 text-orange-500" />
                )}
                <p className="text-sm font-semibold line-clamp-1">
                  {active.title || "Thông báo mới"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="rounded p-1 hover:bg-muted"
                aria-label="Đóng popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {active.content || active.senderName || "Bạn có một cập nhật mới"}
            </p>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleOpen}
                className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                {isChatMessage ? "Mở chat" : "Xem chi tiết"}
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
              description: err instanceof Error ? err.message : "Không thể giữ đơn hàng",
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
              description: err instanceof Error ? err.message : "Không thể hủy đơn hàng",
              variant: "destructive",
            });
          }
        }}
      />
    </>
  );
}
