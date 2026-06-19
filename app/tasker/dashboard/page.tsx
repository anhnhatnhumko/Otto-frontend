"use client";
import { Suspense, useState, useEffect, useMemo, useCallback, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import useUnreadMessagesStore from "@/hooks/useUnreadMessages";
import TaskerProfileHeader from "@/components/tasker/TaskerProfileHeader";
import TaskerStatsGrid from "@/components/tasker/TaskerStatsGrid";
import TaskerJobCard from "@/components/tasker/TaskerJobCard";
import TaskerProfileTab from "@/components/tasker/TaskerProfileTab";
import TaskerJobDetailDialog from "@/components/tasker/TaskerJobDetailDialog";
import TaskerNewJobPopup from "@/components/tasker/TaskerNewJobPopup";
import { Job } from "@/components/tasker/taskerTypes";
import { getAvailableOrders } from "@/lib/api/order.api";
import { mapOrderToJob } from "@/components/tasker/tasker.mapper";
import { getMyTaskerOrders } from "@/lib/api/order.api";
import TaskerCompletionWaitingPopup from "@/components/tasker/TaskerCompletionWaitingPopup";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ChatDialog, { ChatMessage } from "@/components/dialogs/ChatDialog";
import { fetchOrderMessages, sendOrderMessage } from "@/lib/api/chat";
import { connectSocket } from "@/lib/socket";
import { handleAuthMeResponse } from "@/lib/auth-client";
import { Wallet } from "lucide-react";

const acceptOrder = async (jobId: string) => {
  const res = await fetch(`/api/orders/${jobId}/accept`, {
    method: "PATCH",
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Accept failed");
  }

  return data;
};

type User = {
  _id: string;
  fullName: string;
  email: string;
  role?: string;
  avatar?: string;
};

type RealtimeOrderPayload = {
  _id?: string;
  id?: string;
  orderId?: string;
  status?: string;
  offerExpiresAt?: string;
  data?: Record<string, any>;
  order?: Record<string, any>;
  payload?: Record<string, any>;
};

const TASKER_JOB_SYNC_INTERVAL_MS = 5000;
const TASKER_CHAT_FALLBACK_SYNC_INTERVAL_MS = 8000;
const JOB_STATUS_VALUES = new Set<Job["status"]>([
  "SEARCHING",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_CONFIRMATION",
  "COMPLETED",
  "CANCELLED",
  "TIMEOUT",
]);

const getRealtimeOrderCandidate = (
  payload: RealtimeOrderPayload,
): Record<string, any> =>
  (payload.data ?? payload.order ?? payload.payload ?? payload) as Record<
    string,
    any
  >;

const getRealtimeOrderId = (payload: RealtimeOrderPayload) => {
  const candidate = getRealtimeOrderCandidate(payload);

  return String(
    payload.orderId ??
      payload._id ??
      payload.id ??
      candidate?._id ??
      candidate?.id ??
      "",
  ).trim();
};

const normalizeJobStatus = (value: unknown): Job["status"] | null => {
  const normalized = String(value ?? "").trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  if (normalized === "AUTO_CANCELLED") {
    return "CANCELLED";
  }

  return JOB_STATUS_VALUES.has(normalized as Job["status"])
    ? (normalized as Job["status"])
    : null;
};

const buildRealtimeJob = (payload: RealtimeOrderPayload): Job | null => {
  const candidate = getRealtimeOrderCandidate(payload);
  const orderId = getRealtimeOrderId(payload);

  if (!orderId || !candidate || !candidate.scheduleTime) {
    return null;
  }

  const mapped = mapOrderToJob({
    ...candidate,
    _id: candidate._id ?? candidate.id ?? orderId,
  });

  return {
    ...mapped,
    id: orderId,
    status:
      normalizeJobStatus(candidate.status ?? payload.status) ?? mapped.status,
  };
};

const TaskerDashboardContent = () => {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewJobPopup, setShowNewJobPopup] = useState(false);
  const [incomingJob, setIncomingJob] = useState<Job | null>(null);
  const [completedJob, setCompletedJob] = useState<Job | null>(null);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [loadingMe, setLoadingMe] = useState(true);
  const [me, setMe] = useState<User | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPeerName, setChatPeerName] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [pendingChatOrderId, setPendingChatOrderId] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const walletRefreshTimeoutRef = useRef<number | null>(null);
  const walletRefreshLongTimeoutRef = useRef<number | null>(null);
  const seenJobIdsRef = useRef<Set<string>>(new Set());
  const incomingJobRef = useRef<Job | null>(null);
  const jobsRequestInFlightRef = useRef(false);

  const closeIncomingJobPopup = useCallback((orderId?: string) => {
    if (orderId && incomingJobRef.current?.id !== orderId) {
      return;
    }

    incomingJobRef.current = null;
    setShowNewJobPopup(false);
    setIncomingJob(null);
  }, []);

  useEffect(() => {
    incomingJobRef.current = incomingJob;
  }, [incomingJob]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/auth/me`, {
          credentials: "include",
        });

        const data = await handleAuthMeResponse(res, router);

        setMe(data);
        setUserId(data._id);
      } catch {
        router.push("/login");
      } finally {
        setLoadingMe(false);
      }
    };

    fetchUser();
  }, [router]);

  // =========================
  // STATE HELPERS
  // =========================
  const removeJob = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }, []);

  const loadJobs = useCallback(async () => {
    if (jobsRequestInFlightRef.current) {
      return;
    }

    jobsRequestInFlightRef.current = true;

    try {
      const [available, myJobs] = await Promise.all([
        getAvailableOrders(),
        getMyTaskerOrders(),
      ]);

      const mapped = [...available, ...myJobs].map(mapOrderToJob);
      const activeIncomingJob = incomingJobRef.current;

      if (activeIncomingJob) {
        const refreshedIncomingJob = mapped.find(
          (job) => job.id === activeIncomingJob.id,
        );

        if (!refreshedIncomingJob || refreshedIncomingJob.status !== "SEARCHING") {
          closeIncomingJobPopup(activeIncomingJob.id);
        } else {
          incomingJobRef.current = refreshedIncomingJob;
          setIncomingJob(refreshedIncomingJob);
        }
      }

      const newJobs = mapped.filter(
        (job) =>
          !seenJobIdsRef.current.has(job.id) && job.status === "SEARCHING",
      );

      if (!incomingJobRef.current && newJobs.length > 0) {
        const newest = newJobs[0];

        incomingJobRef.current = newest;
        setIncomingJob(newest);
        setShowNewJobPopup(true);
      }

      mapped.forEach((job) => {
        seenJobIdsRef.current.add(job.id);

        if (job.unreadMessages && job.unreadMessages > 0) {
          useUnreadMessagesStore.getState().setUnread(job.id, job.unreadMessages);
        }
      });

      setJobs(mapped);
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu",
        variant: "destructive",
      });
    } finally {
      jobsRequestInFlightRef.current = false;
      setLoading(false);
    }
  }, [closeIncomingJobPopup, toast]);

  const applyRealtimeJobUpdate = useCallback(
    (payload: RealtimeOrderPayload) => {
      const orderId = getRealtimeOrderId(payload);
      const nextStatus = normalizeJobStatus(
        payload.status ?? getRealtimeOrderCandidate(payload)?.status,
      );
      const mappedJob = buildRealtimeJob(payload);
      let shouldReloadJobs = false;

      if (!orderId) {
        return;
      }

      if (nextStatus === "CANCELLED") {
        removeJob(orderId);
        closeIncomingJobPopup(orderId);
        return;
      }

      setJobs((prev) => {
        const index = prev.findIndex((job) => job.id === orderId);

        if (index === -1) {
          if (mappedJob) {
            seenJobIdsRef.current.add(mappedJob.id);
            return [mappedJob, ...prev];
          }

          shouldReloadJobs = true;
          return prev;
        }

        const current = prev[index];
        const candidate = getRealtimeOrderCandidate(payload);
        const nextJob = mappedJob
          ? {
              ...current,
              ...mappedJob,
              unreadMessages: current.unreadMessages ?? mappedJob.unreadMessages,
            }
          : {
              ...current,
              status: nextStatus ?? current.status,
              price:
                typeof candidate?.totalPrice === "number"
                  ? candidate.totalPrice
                  : current.price,
              address:
                typeof candidate?.addressDetail === "string" && candidate.addressDetail
                  ? candidate.addressDetail
                  : typeof candidate?.address === "string" && candidate.address
                    ? candidate.address
                    : current.address,
              customer:
                typeof candidate?.customerId?.fullName === "string" &&
                candidate.customerId.fullName
                  ? candidate.customerId.fullName
                  : current.customer,
              phone:
                typeof candidate?.customerId?.phone === "string" &&
                candidate.customerId.phone
                  ? candidate.customerId.phone
                  : current.phone,
              notes:
                typeof candidate?.note === "string" ? candidate.note : current.notes,
              offerExpiresAt:
                typeof candidate?.offerExpiresAt === "string"
                  ? candidate.offerExpiresAt
                  : current.offerExpiresAt,
            };

        if (nextStatus && nextStatus !== "SEARCHING") {
          closeIncomingJobPopup(orderId);
        }

        const next = [...prev];
        next[index] = nextJob;
        return next;
      });

      if (shouldReloadJobs) {
        void loadJobs();
      }
    },
    [closeIncomingJobPopup, loadJobs, removeJob],
  );

  const fetchWallet = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await fetch(`/api/wallet`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();
      const balance = Number(data?.balance ?? 0);
      const pendingWithdrawals = Number(data?.pendingWithdrawals ?? 0);

      setWalletBalance(balance - pendingWithdrawals);
    } catch (err) {
      console.error("Fetch wallet error:", err);
    } finally {
      setWalletLoading(false);
    }
  }, [userId]);

  const scheduleWalletRefresh = useCallback(() => {
    void fetchWallet();

    if (typeof window === "undefined") return;

    if (walletRefreshTimeoutRef.current) {
      window.clearTimeout(walletRefreshTimeoutRef.current);
    }
    if (walletRefreshLongTimeoutRef.current) {
      window.clearTimeout(walletRefreshLongTimeoutRef.current);
    }

    walletRefreshTimeoutRef.current = window.setTimeout(() => {
      void fetchWallet();
    }, 1200);

    walletRefreshLongTimeoutRef.current = window.setTimeout(() => {
      void fetchWallet();
    }, 2600);
  }, [fetchWallet]);

  useEffect(() => {
    if (!userId) return;
    void fetchWallet();
  }, [fetchWallet, userId]);

  useEffect(() => {
    if (typeof window === "undefined" || !userId) return;

    const handleWindowFocus = () => {
      void fetchWallet();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchWallet();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchWallet, userId]);

  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return;
      if (walletRefreshTimeoutRef.current) {
        window.clearTimeout(walletRefreshTimeoutRef.current);
      }
      if (walletRefreshLongTimeoutRef.current) {
        window.clearTimeout(walletRefreshLongTimeoutRef.current);
      }
    };
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN").format(amount) + "đ";

  useEffect(() => {
    const syncJobs = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      void loadJobs();
    };

    syncJobs();

    if (typeof window === "undefined") {
      return;
    }

    const interval = window.setInterval(syncJobs, TASKER_JOB_SYNC_INTERVAL_MS);

    window.addEventListener("focus", syncJobs);
    document.addEventListener("visibilitychange", syncJobs);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", syncJobs);
      document.removeEventListener("visibilitychange", syncJobs);
    };
  }, [loadJobs]);

  // =========================
  // FILTER
  // =========================
  const assignedJobs = jobs.filter((j) => j.status === "ASSIGNED");
  const inProgressJobs = jobs.filter((j) => j.status === "IN_PROGRESS");
  const completedJobs = jobs.filter(
    (j) => j.status === "COMPLETED" || j.status === "WAITING_CONFIRMATION",
  );
  const timeoutJobs = jobs.filter((j) => j.status === "TIMEOUT");
  const mobileTabTriggerClassName =
    "flex min-h-10 w-full min-w-0 items-center justify-center px-1.5 py-1 text-center text-[11px] leading-4 whitespace-normal sm:w-auto sm:px-3 sm:py-1.5 sm:text-sm sm:whitespace-nowrap";

  const dashboardStats = useMemo(() => {
    const toAmount = (value: unknown) => {
      const parsed = Number(value ?? 0);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const completedForStats = jobs.filter(
      (job) => job.status === "COMPLETED" || job.status === "WAITING_CONFIRMATION",
    );

    const totalEarnings = completedForStats.reduce(
      (sum, job) => sum + toAmount(job.price),
      0,
    );

    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyEarnings = completedForStats.reduce((sum, job) => {
      const sourceDate = job.endTime || job.scheduleTime;
      if (!sourceDate) return sum;

      const jobDate = new Date(sourceDate);
      if (Number.isNaN(jobDate.getTime())) return sum;

      return jobDate >= startOfWeek ? sum + toAmount(job.price) : sum;
    }, 0);

    const ratedJobs = completedForStats.filter(
      (job) => typeof job.rating === "number" && job.rating > 0,
    );
    const avgRating = ratedJobs.length
      ? Number(
          (
            ratedJobs.reduce((sum, job) => sum + (job.rating ?? 0), 0) /
            ratedJobs.length
          ).toFixed(1),
        )
      : 0;

    return {
      totalEarnings,
      weeklyEarnings,
      avgRating,
    };
  }, [jobs]);

  // =========================
  // HANDLERS
  // =========================
  const openJobDetail = (job: Job) => {
    setSelectedJob(job);
    setIsJobDetailOpen(true);
  };

  const openChatForJob = async (job: Job) => {
    try {
      setChatOrderId(job.id);
      setChatPeerName(job.customer || "Khách hàng");

      // Clear unread messages when opening chat
      useUnreadMessagesStore.getState().clearUnread(job.id);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? { ...j, unreadMessages: 0 }
            : j
        )
      );

      // Mark messages as read on backend
        try {
        await fetch(`/api/chat/orders/${job.id}/messages/mark-read`, {
          method: "PATCH",
          credentials: "include",
        });
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }

      const socket = connectSocket(userId || "", "TASKER");
      socket?.emit("order:join", {
        orderId: job.id,
        userId: userId || "",
        role: "TASKER",
      });

      const messages = await fetchOrderMessages(job.id);
      const mappedMessages: ChatMessage[] = messages.map((message: any) => ({
        id: String(message._id ?? message.id ?? `${Date.now()}`),
        fromMe: String(message.senderId ?? "") === String(userId ?? ""),
        text: String(message.text ?? ""),
        time: new Date(message.createdAt ?? Date.now()).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        read: true,
      }));

      setChatMessages(mappedMessages);
      setChatOpen(true);

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("chat");
      nextParams.delete("orderId");
      const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
      router.replace(nextUrl);
    } catch (error) {
      console.error("Không mở được chat:", error);
      toast({
        title: "Lỗi",
        description: "Không thể mở cuộc hội thoại",
        variant: "destructive",
      });
    }
  };

  const handleSendChat = async (text: string) => {
    if (!chatOrderId) return;

    await sendOrderMessage(chatOrderId, text);
  };

  useEffect(() => {
    if (!userId || !chatOpen || !chatOrderId) return;

    const socket = connectSocket(userId, "TASKER");
    if (!socket) return;
    const joinChatRoom = () => {
      socket.emit("order:join", {
        orderId: chatOrderId,
        userId,
        role: "TASKER",
      });
    };

    joinChatRoom();
    socket.on("connect", joinChatRoom);

    return () => {
      socket.off("connect", joinChatRoom);
    };
  }, [userId, chatOpen, chatOrderId]);

  useEffect(() => {
    if (!chatOpen || !chatOrderId || !userId) return;
    if (isSocketConnected) return;

    let active = true;

    const refreshChatMessages = async () => {
      try {
        const messages = await fetchOrderMessages(chatOrderId);
        if (!active) return;

        const mappedMessages: ChatMessage[] = messages.map((message: any) => ({
          id: String(message._id ?? message.id ?? `${Date.now()}`),
          fromMe: String(message.senderId ?? "") === String(userId),
          text: String(message.text ?? ""),
          time: new Date(message.createdAt ?? Date.now()).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          read: true,
        }));

        setChatMessages((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const next = mappedMessages.filter((item) => !existingIds.has(item.id));
          return next.length > 0 ? [...prev, ...next] : prev;
        });
      } catch (error) {
        console.error("Failed to refresh chat messages", error);
      }
    };

    void refreshChatMessages();
    const interval = window.setInterval(() => {
      void refreshChatMessages();
    }, TASKER_CHAT_FALLBACK_SYNC_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [chatOpen, chatOrderId, isSocketConnected, userId]);

  useEffect(() => {
    if (!userId) return;

    const socket = connectSocket(userId, "TASKER");
    if (!socket) return;

    const handleWalletRealtime = () => {
      scheduleWalletRefresh();
    };

    const handleSocketConnect = () => {
      setIsSocketConnected(true);
      handleWalletRealtime();
      void loadJobs();
    };

    const handleSocketDisconnect = () => {
      setIsSocketConnected(false);
    };

    const handleIncomingChatMessage = (message: any) => {
      const incomingOrderId = String(message?.orderId ?? "");
      const senderId = String(message?.senderId ?? "");
      const isFromMe = senderId === String(userId);

      // If chat is open and it's the right order, add to messages
      if (incomingOrderId === chatOrderId && chatOpen) {
        const nextMessage: ChatMessage = {
          id: String(message?._id ?? message?.id ?? `m-${Date.now()}`),
          fromMe: isFromMe,
          text: String(message?.text ?? ""),
          time: new Date(message?.createdAt ?? Date.now()).toLocaleTimeString(
            "vi-VN",
            {
              hour: "2-digit",
              minute: "2-digit",
            },
          ),
          read: isFromMe,
        };

        setChatMessages((prev) => {
          if (prev.some((item) => item.id === nextMessage.id)) {
            return prev;
          }

          return [...prev, nextMessage];
        });
      } else if (!isFromMe) {
        // If message is from customer and chat is not open, increment unread
        useUnreadMessagesStore.getState().incrementUnread(incomingOrderId, 1);

        // Also update jobs state to trigger re-render
        setJobs((prev) =>
          prev.map((job) =>
            job.id === incomingOrderId
              ? { ...job, unreadMessages: (job.unreadMessages || 0) + 1 }
              : job
          )
        );
      }
    };

    const handleOrderCancelled = (payload: RealtimeOrderPayload) => {
      const orderId = String(payload?.orderId ?? "").trim();
      if (!orderId) return;

      removeJob(orderId);
      closeIncomingJobPopup(orderId);

      toast({
        title: "Khách hàng đã hủy",
        description: "Đơn hàng đã được khách hàng hủy",
        variant: "destructive",
      });
    };

    const handleOrderKept = (payload: RealtimeOrderPayload) => {
      const orderId = String(payload?.orderId ?? "").trim();
      if (!orderId) return;

      applyRealtimeJobUpdate({ ...payload, status: "ASSIGNED" });

      toast({
        title: "Đơn hàng được giữ lại",
        description: "Khách hàng đã giữ đơn hàng này",
      });
    };

    const handleOrderRealtime = (payload: RealtimeOrderPayload) => {
      handleWalletRealtime();
      applyRealtimeJobUpdate(payload);
    };

    if (socket.connected) {
      setIsSocketConnected(true);
    }

    socket.on("connect", handleSocketConnect);
    socket.on("disconnect", handleSocketDisconnect);
    socket.on("connect_error", handleSocketDisconnect);
    socket.on("chat:message", handleIncomingChatMessage);
    socket.on("order:cancelled", handleOrderCancelled);
    socket.on("order:kept", handleOrderKept);
    socket.on("order:status-updated", handleOrderRealtime);
    socket.on("order:updated", handleOrderRealtime);
    socket.on("notification:new", handleWalletRealtime);

    return () => {
      socket.off("connect", handleSocketConnect);
      socket.off("disconnect", handleSocketDisconnect);
      socket.off("connect_error", handleSocketDisconnect);
      socket.off("chat:message", handleIncomingChatMessage);
      socket.off("order:cancelled", handleOrderCancelled);
      socket.off("order:kept", handleOrderKept);
      socket.off("order:status-updated", handleOrderRealtime);
      socket.off("order:updated", handleOrderRealtime);
      socket.off("notification:new", handleWalletRealtime);
    };
  }, [
    applyRealtimeJobUpdate,
    chatOpen,
    chatOrderId,
    closeIncomingJobPopup,
    loadJobs,
    scheduleWalletRefresh,
    toast,
    userId,
  ]);

  useEffect(() => {
    const shouldOpenChat = searchParams.get("chat") === "true";
    const orderIdFromQuery = searchParams.get("orderId");

    if (!shouldOpenChat || !orderIdFromQuery || chatOpen) return;

    setPendingChatOrderId(orderIdFromQuery);

    const job = jobs.find((item) => item.id === orderIdFromQuery);
    if (job) {
      void openChatForJob(job);
    }
  }, [searchParams, jobs, chatOpen]);

  useEffect(() => {
    if (!pendingChatOrderId || chatOpen) return;

    const job = jobs.find((item) => item.id === pendingChatOrderId);
    if (job) {
      void openChatForJob(job);
      setPendingChatOrderId(null);
    }
  }, [jobs, pendingChatOrderId, chatOpen]);

  const handleStart = async (jobId: string) => {
    try {
      // Check time constraints before allowing start
      const job = jobs.find((j) => j.id === jobId);
      if (job && job.scheduleTime) {
        const scheduleTime = new Date(job.scheduleTime).getTime();
        const endTime = job.endTime ? new Date(job.endTime).getTime() : null;
        const now = new Date().getTime();
        const oneHourBefore = scheduleTime - 60 * 60 * 1000;

        if (now < oneHourBefore) {
          const remainingTime = Math.ceil((oneHourBefore - now) / (60 * 1000));
          toast({
            title: "Không thể bắt đầu",
            description: `Bạn chỉ có thể bắt đầu việc trong 1 tiếng trước thời gian dự định. Còn ${remainingTime} phút.`,
            variant: "destructive",
          });
          return;
        }

        if (endTime && now > endTime) {
          toast({
            title: "Quá hạn",
            description: "Đơn đã qua thời gian làm việc. Không thể bắt đầu.",
            variant: "destructive",
          });
          return;
        }
      }

      const res = await fetch(`/api/orders/${jobId}/start`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Không thể bắt đầu việc");
      }

      // Update local state immediately
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: "IN_PROGRESS" } : j)),
      );

      toast({
        title: "Đã bắt đầu",
        description: "Bạn đã bắt đầu làm việc này",
      });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleRejectJob = () => {
    const doReject = async () => {
      try {
        if (!selectedJob) return;
        const res = await fetch(`/api/orders/${selectedJob.id}/reject`, {
          method: "PATCH",
          credentials: "include",
        });

        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.message || "Reject failed");
        }

        toast({ title: "Đã từ chối", variant: "destructive" });

        // update local state
        setJobs((prev) => prev.filter((j) => j.id !== selectedJob.id));
        setIsJobDetailOpen(false);
        setSelectedJob(null);
      } catch (err: any) {
        toast({ title: "Lỗi", description: err.message, variant: "destructive" });
      }
    };

    void doReject();
  };

  const handleComplete = async (jobId: string) => {
    try {
      const res = await fetch(`/api/orders/${jobId}/complete`, {
        method: "PATCH",
        credentials: "include",
      });

      // Update state immediately
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, status: "WAITING_CONFIRMATION" } : j,
        ),
      );

      const job = jobs.find((j) => j.id === jobId);

      if (job) {
        setCompletedJob({
          ...job,
          status: "WAITING_CONFIRMATION",
        });

        setShowCompletionPopup(true); // show popup
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async (jobId: string) => {
    try {
      await acceptOrder(jobId);

      toast({
        title: "Nhận việc thành công",
      });

      // Update UI immediately
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: "ASSIGNED" } : j)),
      );

      // Close popup if this job came from the incoming popup
      closeIncomingJobPopup(jobId);
    } catch (err: any) {
      const message = String(err?.message || "Không thể nhận đơn");

      if (/order already taken|already taken|đã được nhận|đã có người nhận/i.test(message)) {
        closeIncomingJobPopup(jobId);
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
        toast({
          title: "Đơn đã có người nhận",
          description: "Đơn hàng này đã được tasker khác nhận trước đó.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleRejectIncomingJob = () => {
    const doReject = async () => {
      try {
        if (!incomingJob) return;
        const res = await fetch(`/api/orders/${incomingJob.id}/reject`, {
          method: "PATCH",
          credentials: "include",
        });

        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.message || "Reject failed");
        }

        toast({ title: "Đã từ chối", variant: "destructive" });

        closeIncomingJobPopup(incomingJob.id);
        setJobs((prev) => prev.filter((j) => j.id !== incomingJob.id));
      } catch (err: any) {
        toast({ title: "Lỗi", description: err.message, variant: "destructive" });
      }
    };

    void doReject();
  };

  useEffect(() => {
    if (!selectedJob) return;

    const nextJob = jobs.find((job) => job.id === selectedJob.id);
    if (!nextJob) {
      setSelectedJob(null);
      setIsJobDetailOpen(false);
      return;
    }

    if (nextJob !== selectedJob) {
      setSelectedJob(nextJob);
    }
  }, [jobs, selectedJob]);

  useEffect(() => {
    if (!completedJob) return;

    const nextJob = jobs.find((job) => job.id === completedJob.id);
    if (nextJob) {
      setCompletedJob(nextJob);
    }
  }, [completedJob, jobs]);

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-8 md:py-12">
        <div className="container max-w-6xl">
          <TaskerProfileHeader
            isAvailable={isAvailable}
            onAvailableChange={setIsAvailable}
            isEditing={isEditing}
            onEditToggle={() => setIsEditing(!isEditing)}
          />

          <TaskerStatsGrid
            totalEarnings={dashboardStats.totalEarnings}
            weeklyEarnings={dashboardStats.weeklyEarnings}
            completedJobs={completedJobs.length}
            avgRating={dashboardStats.avgRating}
            pendingJobs={assignedJobs.length}
          />

          <button
            onClick={() => router.push("/tasker/wallet")}
            className="group relative mb-6 flex w-full items-center gap-3 overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/12 via-card to-card p-4 text-left shadow-sm transition-all hover:border-emerald-400/40 hover:shadow-md active:scale-[0.99] dark:from-emerald-500/15 dark:via-slate-900/95 dark:to-slate-950/95"
          >
            <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-6 h-20 w-20 rounded-full bg-teal-400/10 blur-2xl" />
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/15 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
              <Wallet size={20} strokeWidth={2.2} />
            </div>
            <div className="relative min-w-0 flex-1 text-left">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  Ví Tasker
                </p>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-400/20 dark:text-emerald-200">
                  OTP bảo vệ
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Quản lý thu nhập, lịch sử giao dịch và rút tiền an toàn.
              </p>
            </div>
            <div className="relative shrink-0 text-right">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Số dư
              </p>
              <span className="block text-lg font-bold text-emerald-700 transition-transform group-hover:-translate-y-0.5 dark:text-emerald-200 sm:text-xl">
                {walletLoading ? "..." : formatCurrency(walletBalance)}
              </span>
            </div>
          </button>

          <Tabs defaultValue="assigned" className="space-y-6">
            <TabsList className="grid h-auto w-full grid-cols-5 items-stretch gap-1 rounded-xl bg-card p-1 sm:h-10 sm:w-full sm:grid-cols-none sm:flex sm:justify-center">
              <TabsTrigger
                value="assigned"
                className={mobileTabTriggerClassName}
              >
                <span className="sm:hidden">Mới</span>
                <span className="hidden sm:inline">
                  Việc mới ({assignedJobs.length})
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="in_progress"
                className={mobileTabTriggerClassName}
              >
                <span className="sm:hidden">Đang làm</span>
                <span className="hidden sm:inline">
                  Đang làm ({inProgressJobs.length})
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className={mobileTabTriggerClassName}
              >
                <span className="sm:hidden">Hoàn thành</span>
                <span className="hidden sm:inline">Đã hoàn thành</span>
              </TabsTrigger>
              {timeoutJobs.length > 0 && (
                <TabsTrigger
                  value="timeout"
                  className={`${mobileTabTriggerClassName} text-red-600`}
                >
                  <span className="sm:hidden">Quá hạn</span>
                  <span className="hidden sm:inline">
                    Quá hạn ({timeoutJobs.length})
                  </span>
                </TabsTrigger>
              )}
              <TabsTrigger
                value="profile"
                className={mobileTabTriggerClassName}
              >
                Hồ sơ
              </TabsTrigger>
            </TabsList>
            <TabsContent value="assigned">
              <div className="space-y-4">
                {assignedJobs.map((job) => (
                  <TaskerJobCard
                    key={job.id}
                    job={job}
                    onChat={openChatForJob}
                    onDetail={openJobDetail}
                    onAccept={handleAccept}
                    onStart={handleStart}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="in_progress">
              <div className="space-y-4">
                {inProgressJobs.map((job) => (
                  <TaskerJobCard
                    key={job.id}
                    job={job}
                    onChat={openChatForJob}
                    onComplete={handleComplete}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="space-y-4">
                {completedJobs.map((job) => (
                  <TaskerJobCard key={job.id} job={job} onChat={openChatForJob} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="timeout">
              <div className="space-y-4">
                {timeoutJobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Không có đơn hàng nào quá hạn
                  </div>
                ) : (
                  timeoutJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-red-50 border border-red-200 rounded-xl p-4 md:p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-red-900">
                            ⏰ {job.service}
                          </p>
                          <p className="text-sm text-red-700 mt-1">
                            Quá hạn: Không nhận được việc này
                          </p>
                          <p className="text-xs text-red-600 mt-2">
                            Khách: {job.customer} | Giá: {formatCurrency(job.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="profile">
              <TaskerProfileTab
                isEditing={isEditing}
                onEditToggle={() => setIsEditing(!isEditing)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <TaskerJobDetailDialog
        job={selectedJob}
        open={isJobDetailOpen}
        onOpenChange={setIsJobDetailOpen}
        onAccept={handleAccept}
        onReject={handleRejectJob}
      />

      <TaskerNewJobPopup
        job={incomingJob}
        open={showNewJobPopup}
        onOpenChange={(open) => {
          setShowNewJobPopup(open);
          if (!open) {
            closeIncomingJobPopup();
          }
        }}
        onAccept={handleAccept}
        onReject={handleRejectIncomingJob}
      />

      <TaskerCompletionWaitingPopup
        job={completedJob}
        open={showCompletionPopup}
        onOpenChange={setShowCompletionPopup}
        onClose={() => {
          setShowCompletionPopup(false);
          setCompletedJob(null);
        }}
      />

      <ChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        peerName={chatPeerName}
        initialMessages={chatMessages}
        onSend={handleSendChat}
      />

      <Footer />
    </div>
  );
};

export default function TaskerDashboard() {
  return (
    <Suspense fallback={<div className="p-6">Đang tải...</div>}>
      <TaskerDashboardContent />
    </Suspense>
  );
}
