"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams, usePathname, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
// import BottomNav from "@/components/BottomNav";
import OrderStateRenderer from "@/components/orders/OrderStateRenderer";
import OverdueOrderPopup from "@/components/OverdueOrderPopup";
import ChatDialog from "@/components/dialogs/ChatDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOverdueOrder } from "@/hooks/useOverdueOrder";
import { ArrowLeft, Activity, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/hooks/useAuth";
import { mapOrder } from "@/lib/mappers/order.mapper";
import { connectSocket } from "@/lib/socket";
import { fetchOrderMessages, sendOrderMessage } from "@/lib/api/chat";
import { Badge } from "@/components/ui/badge";
import useUnreadMessagesStore from "@/hooks/useUnreadMessages";

type RealtimeOrderPayload = {
  [key: string]: unknown;
  _id?: string;
  id?: string;
  orderId?: string;
  status?: string;
  data?: Record<string, unknown>;
  order?: Record<string, unknown>;
  payload?: Record<string, unknown>;
};

const TRACKING_EVENTS = [
  "order:updated",
  "order:status-updated",
  "admin:order-updated",
  "admin:orders:updated",
  "admin:order-status-updated",
  "admin:orders:status-updated",
] as const;

const getRealtimeOrderId = (payload: RealtimeOrderPayload) =>
  String(
    payload?.orderId ??
      payload?._id ??
      payload?.id ??
      payload?.data?.orderId ??
      payload?.data?._id ??
      payload?.data?.id ??
      payload?.order?._id ??
      payload?.order?.id ??
      payload?.payload?._id ??
      payload?.payload?.id ??
      "",
  );

const getStatusLabel = (status?: string) => {
  switch (String(status ?? "").toUpperCase()) {
    case "SEARCHING":
      return "Đang tìm tasker";
    case "ASSIGNED":
      return "Đã có tasker";
    case "IN_PROGRESS":
      return "Đang thực hiện";
    case "WAITING_CONFIRMATION":
      return "Chờ xác nhận hoàn thành";
    case "COMPLETED":
      return "Hoàn thành";
    case "CANCELLED":
      return "Đã hủy";
    case "TIMEOUT":
      return "Hết hạn";
    case "AUTO_CANCELLED":
      return "Tự hủy";
    case "PAID":
      return "Đã thanh toán";
    case "PENDING_PAYMENT":
      return "Chờ thanh toán";
    default:
      return status || "Đang cập nhật";
  }
};

const toTrackingOrder = (data: Record<string, unknown>) => {
  const mapped = mapOrder(data);

  return {
    ...mapped,
    startTime: typeof data.startTime === "string" ? data.startTime : "",
    endTime: typeof data.endTime === "string" ? data.endTime : "",
  };
};

type TrackingOrder = ReturnType<typeof toTrackingOrder>;

const asRecord = (value: unknown) =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

const pickRealtimeOrderSource = (payload: RealtimeOrderPayload) =>
  asRecord(payload.data) ??
  asRecord(payload.order) ??
  asRecord(payload.payload) ??
  asRecord(payload) ??
  {};

const formatTrackingRange = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }

  return {
    date: startDate.toLocaleDateString("vi-VN"),
    time: `${startDate.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${endDate.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`,
  };
};

const buildTrackingOrderPatch = (
  payload: RealtimeOrderPayload,
  current: TrackingOrder,
): Partial<TrackingOrder> => {
  const source = pickRealtimeOrderSource(payload);
  const patch: Partial<TrackingOrder> = {};
  const nextStatus = String(
    source.status ?? payload.status ?? current.status ?? "",
  ).trim();

  if (nextStatus) {
    patch.status = nextStatus;
  }

  if (typeof source.paymentStatus === "string") {
    patch.paymentStatus = source.paymentStatus;
  }

  if (typeof source.isPaid === "boolean") {
    patch.isPaid = source.isPaid;
  } else if (String(source.paymentStatus ?? "").toUpperCase() === "PAID") {
    patch.isPaid = true;
  }

  if (typeof source.totalPrice === "number") {
    patch.price = source.totalPrice;
  }

  if (typeof source.cancelReason === "string") {
    patch.cancelReason = source.cancelReason;
  }

  if (Object.prototype.hasOwnProperty.call(source, "overdueWarningSentAt")) {
    patch.overdueWarningSentAt = source.overdueWarningSentAt
      ? String(source.overdueWarningSentAt)
      : null;
  }

  if (typeof source.address === "string" && source.address.trim()) {
    patch.address = source.address;
  } else if (
    typeof source.addressDetail === "string" &&
    source.addressDetail.trim()
  ) {
    patch.address = source.addressDetail;
  }

  const nextStartTime =
    typeof source.startTime === "string" && source.startTime
      ? source.startTime
      : current.startTime;
  const nextEndTime =
    typeof source.endTime === "string" && source.endTime
      ? source.endTime
      : current.endTime;
  const nextRange = formatTrackingRange(nextStartTime, nextEndTime);

  if (typeof source.startTime === "string" && source.startTime) {
    patch.startTime = new Date(source.startTime).toISOString();
  }

  if (typeof source.endTime === "string" && source.endTime) {
    patch.endTime = new Date(source.endTime).toISOString();
  }

  if (nextRange) {
    patch.date = nextRange.date;
    patch.time = nextRange.time;
  }

  const tasker =
    asRecord(source.tasker) ??
    asRecord(source.taskerId) ??
    null;

  if (tasker) {
    patch.tasker = {
      name: String(
        tasker.name ?? tasker.fullName ?? current.tasker?.name ?? "",
      ).trim(),
      avatar: String(tasker.avatar ?? current.tasker?.avatar ?? "").trim(),
      rating: Number(tasker.rating ?? current.tasker?.rating ?? 0),
      completedJobs: Number(
        tasker.completedJobs ?? current.tasker?.completedJobs ?? 0,
      ),
      phone: String(tasker.phone ?? current.tasker?.phone ?? "").trim(),
    };
  }

  return patch;
};

function OrderTrackingPageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const isMobile = useIsMobile();
  const { user, loading: authLoading } = useAuth();

  const orderId = params?.id as string;

  const [order, setOrder] = useState<ReturnType<typeof toTrackingOrder> | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketOnline, setSocketOnline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatPeerName, setChatPeerName] = useState<string>("");
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const queuedRefreshRef = useRef<number | null>(null);

  // Popup quá hạn
  const {
    open: overdueOpen,
    setOpen: setOverdueOpen,
    overdueInfo,
    showOverduePopup,
    closePopupIfInvalid,
    handleKeepOrder,
    handleCancelOrder: handleCancelOrderTimeout,
    loading: overdueLoading,
  } = useOverdueOrder();

  const extractErrorMessage = (data: any, fallback: string) => {
    const message = data?.message;
    if (Array.isArray(message)) {
      return String(message[0] ?? fallback);
    }
    if (typeof message === "string" && message.trim()) {
      return message;
    }
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
    return fallback;
  };

  const canCancelOrder = (currentOrder: ReturnType<typeof toTrackingOrder>) => {
    const normalizedStatus = String(currentOrder.status || "").toUpperCase();
    if (normalizedStatus !== "SEARCHING" && normalizedStatus !== "ASSIGNED") {
      return false;
    }

    const start = new Date(currentOrder.startTime);
    if (Number.isNaN(start.getTime())) {
      return true;
    }

    return start.getTime() - Date.now() > 60 * 60 * 1000;
  };

  const handleCancelBooking = async () => {
    if (!order) return;
    setCancelMessage(null);

    if (!canCancelOrder(order)) {
      const message = "Đơn hàng chỉ được hủy trước giờ bắt đầu ít nhất 1 tiếng.";
      setCancelMessage(message);
      toast({
        title: "Không thể hủy đơn",
        description: message,
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(`/api/orders/${order._id}/cancel`, {
        method: "PATCH",
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = extractErrorMessage(data, "Không thể hủy đơn hàng lúc này.");
        setCancelMessage(message);
        throw new Error(message);
      }

      setCancelMessage(null);
      toast({
        title: "Đã hủy đơn hàng",
        description: data?.message || "Đơn hàng đã được hủy thành công",
        variant: "destructive",
      });

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: "CANCELLED",
              cancelReason:
                typeof data?.cancelReason === "string"
                  ? data.cancelReason
                  : prev.cancelReason,
            }
          : prev,
      );
      queueOrderRefresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi khi hủy đơn hàng.";
      setCancelMessage(message);
      toast({
        title: "Không thể hủy đơn",
        description: message,
        variant: "destructive",
      });
    }
  };

  // ==========================
  // FETCH ORDER
  // ==========================
  const fetchOrder = useCallback(async (silent = false) => {
    if (!orderId || orderId === "undefined") return;

    try {
      if (!silent) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const res = await fetch(`/api/orders/${orderId}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("STATUS:", res.status);
        throw new Error("Fetch order failed");
      }

      const data = (await res.json()) as Record<string, unknown>;
      const trackedOrder = toTrackingOrder(data);

      setOrder(trackedOrder);
      setLastSyncedAt(new Date().toLocaleTimeString("vi-VN"));

      const overdueWarningSentAt = (trackedOrder as any).overdueWarningSentAt;

      // 🔥 Hiển thị popup quá hạn chỉ khi status = ASSIGNED và có cảnh báo
      if (String(trackedOrder.status).toUpperCase() === "ASSIGNED" && Boolean(overdueWarningSentAt) && !overdueOpen) {
        showOverduePopup(trackedOrder);
      }

      // 🔥 Đóng popup nếu order không còn trong trạng thái quá hạn
      closePopupIfInvalid(trackedOrder);
    } catch (err) {
      console.error("FETCH ORDER ERROR:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [orderId, overdueOpen, showOverduePopup, closePopupIfInvalid]);

  const queueOrderRefresh = useCallback(() => {
    if (typeof window === "undefined") return;

    if (queuedRefreshRef.current) {
      window.clearTimeout(queuedRefreshRef.current);
    }

    queuedRefreshRef.current = window.setTimeout(() => {
      void fetchOrder(true);
    }, 1200);
  }, [fetchOrder]);

  useEffect(() => {
    if (!orderId || orderId === "undefined") return;

    void fetchOrder(false);
  }, [orderId, fetchOrder]);

  useEffect(() => {
    if (!order) return;

    const overdueWarningSentAt = (order as any).overdueWarningSentAt;

    if (
      String(order.status).toUpperCase() === "ASSIGNED" &&
      Boolean(overdueWarningSentAt) &&
      !overdueOpen
    ) {
      showOverduePopup(order);
    }

    closePopupIfInvalid(order);
  }, [closePopupIfInvalid, order, overdueOpen, showOverduePopup]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && queuedRefreshRef.current) {
        window.clearTimeout(queuedRefreshRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!orderId || orderId === "undefined") return;

    const handleWindowFocus = () => {
      void fetchOrder(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchOrder(true);
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchOrder, orderId]);

  // Auto-open chat when navigated from a notification with ?chat=true
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("chat") === "true" && order && !chatOpen) {
      void handleOpenChat();
    }
  }, [searchParams, order, chatOpen, pathname]);

  // ==========================
  // SOCKET + FALLBACK POLLING
  // ==========================
  useEffect(() => {
    if (!orderId || orderId === "undefined") return;
    const userId = String(user?.id ?? user?._id ?? "");
    const userRole = String(user?.role ?? "CUSTOMER");

    if (authLoading || !userId) return;

    const socket = connectSocket(userId, userRole);
    if (!socket) {
      const pollInterval = window.setInterval(() => {
        void fetchOrder(true);
      }, 30000);

      return () => {
        window.clearInterval(pollInterval);
      };
    }
    const currentOrderId = String(orderId);
    const joinOrderRoom = () => {
      socket.emit("order:join", {
        orderId: currentOrderId,
        userId,
        role: userRole,
      });
    };

    const handleOrderEvent = (payload: RealtimeOrderPayload) => {
      const changedOrderId = getRealtimeOrderId(payload);
      if (changedOrderId !== currentOrderId) return;

      setOrder((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          ...buildTrackingOrderPatch(payload, prev),
        };
      });
      setLastSyncedAt(new Date().toLocaleTimeString("vi-VN"));
      queueOrderRefresh();
    };

    const handleConnect = () => {
      setSocketOnline(true);
      queueOrderRefresh();
    };
    const handleDisconnect = () => setSocketOnline(false);

    if (socket.connected) {
      setSocketOnline(true);
    }

    joinOrderRoom();

    socket.on("connect", handleConnect);
    socket.on("connect", joinOrderRoom);
    socket.on("disconnect", handleDisconnect);

    TRACKING_EVENTS.forEach((eventName) => {
      socket.on(eventName, handleOrderEvent);
    });

    // chat message listener for this order
    const handleChatMessage = (msg: any) => {
      try {
        const mid = String(msg._id ?? msg.id ?? `s-${Date.now()}`);
        const fromMe = String(msg.senderId ?? '') === userId;
        const time = new Date(msg.createdAt ?? Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const chatMsg = { id: mid, fromMe, text: msg.text, time, read: true };
        if (chatOpen) {
          setChatMessages((prev) => {
            if (prev.some((item) => item.id === chatMsg.id)) {
              return prev;
            }

            return [...prev, chatMsg];
          });
          useUnreadMessagesStore.getState().clearUnread(currentOrderId);
        } else if (!fromMe) {
          useUnreadMessagesStore.getState().incrementUnread(currentOrderId, 1);
        }
      } catch (err) {
        console.error('CHAT MSG ERR', err);
      }
    };

    socket.on('chat:message', handleChatMessage);

    const pollInterval = window.setInterval(() => {
      void fetchOrder(true);
    }, 30000);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect", joinOrderRoom);
      socket.off("disconnect", handleDisconnect);

      TRACKING_EVENTS.forEach((eventName) => {
        socket.off(eventName, handleOrderEvent);
      });

      socket.off('chat:message', handleChatMessage);

      window.clearInterval(pollInterval);
    };
  }, [authLoading, user?.id, user?._id, user?.role, orderId, fetchOrder, queueOrderRefresh, chatOpen]);

  // open chat modal and load messages
  const handleOpenChat = async () => {
    if (!order) return;
    const taskerName = String(order.tasker?.name ?? 'Người thực hiện');
    setChatPeerName(taskerName);
    useUnreadMessagesStore.getState().clearUnread(order._id);
    try {
      await fetch(`/api/chat/orders/${order._id}/messages/mark-read`, {
        method: "PATCH",
        credentials: "include",
      }).catch(() => null);
      const msgs = await fetchOrderMessages(order._id);
      const mapped = msgs.map((m: any) => ({
        id: String(m._id ?? m.id),
        fromMe: String(m.senderId ?? '') === String(user?.id ?? user?._id ?? ''),
        text: m.text,
        time: new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        read: true,
      }));
      setChatMessages(mapped);
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
    setChatOpen(true);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('chat');
    const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
    router.replace(nextUrl);
  };

  useEffect(() => {
    if (!chatOpen || !order?._id) return;

    let active = true;

    const refreshChatMessages = async () => {
      try {
        const msgs = await fetchOrderMessages(order._id);
        if (!active) return;

        const mapped = msgs.map((m: any) => ({
          id: String(m._id ?? m.id),
          fromMe: String(m.senderId ?? '') === String(user?.id ?? user?._id ?? ''),
          text: m.text,
          time: new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          read: true,
        }));

        setChatMessages((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const next = mapped.filter((item) => !existingIds.has(item.id));
          return next.length > 0 ? [...prev, ...next] : prev;
        });
      } catch (err) {
        console.error('Failed to refresh chat messages', err);
      }
    };

    void refreshChatMessages();
    const interval = window.setInterval(() => {
      void refreshChatMessages();
    }, 20000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [chatOpen, order?._id, user?.id, user?._id]);

  const handleSendChat = async (text: string) => {
    try {
      await sendOrderMessage(String(orderId), text);
    } catch (err) {
      console.error('Failed to send chat', err);
    }
  };

  // ==========================
  // LOADING / ERROR
  // ==========================
  if (loading) {
    return <div className="p-6">Đang tải đơn hàng...</div>;
  }

  if (!order) {
    return <div className="p-6">Không tìm thấy đơn hàng</div>;
  }

  // ==========================
  // UI (GIỮ NGUYÊN)
  // ==========================
  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <Header />
      </div>

      <main className={`py-4 md:py-8 ${isMobile ? "pb-24" : ""}`}>
        <div className="container max-w-lg mx-auto px-4">
          {/* Top bar */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-muted active:scale-95 transition-transform"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">
                Theo dõi đơn hàng
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground font-mono">
                  {order._id}
                </p>
                {/* <Badge variant={socketOnline ? "secondary" : "outline"} className="gap-1">
                  <Activity className="h-3.5 w-3.5" />
                  {socketOnline ? "Realtime" : "Offline"}
                </Badge> */}
                {/* <Badge variant="outline">{getStatusLabel(order.status)}</Badge>
                {isRefreshing && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Đang cập nhật
                  </span>
                )}
                {lastSyncedAt && (
                  <span className="text-xs text-muted-foreground">
                    Lần sync cuối: {lastSyncedAt}
                  </span>
                )} */}
              </div>
            </div>
          </div>

          {/* Order state view */}
          {cancelMessage && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {cancelMessage}
            </div>
          )}
          <OrderStateRenderer
            order={order}
            onChat={handleOpenChat}
            onCancel={handleCancelBooking}
          />
        </div>
      </main>

      {/* {isMobile && <BottomNav activeTab="orders" onTabChange={() => {}} />} */}

      <ChatDialog
        open={chatOpen}
        onOpenChange={(o) => setChatOpen(o)}
        peerName={chatPeerName}
        initialMessages={chatMessages}
        onSend={handleSendChat}
      />

      <OverdueOrderPopup
        open={overdueOpen}
        onOpenChange={setOverdueOpen}
        info={overdueInfo}
        onKeep={async () => {
          try {
            await handleKeepOrder(orderId);
            toast({
              title: "Đơn hàng được giữ lại",
              description: "Bạn đã chọn giữ lại đơn hàng này.",
            });
            await fetchOrder(false);
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
            await handleCancelOrderTimeout(orderId);
            toast({
              title: "Đơn hàng đã hủy",
              description: "Đơn hàng của bạn đã được hủy thành công.",
              variant: "destructive",
            });
            await fetchOrder(false);
          } catch (err) {
            toast({
              title: "Lỗi",
              description: err instanceof Error ? err.message : "Không thể hủy đơn hàng",
              variant: "destructive",
            });
          }
        }}
      />
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="p-6">Đang tải...</div>}>
      <OrderTrackingPageContent />
    </Suspense>
  );
}
