"use client";
import { Suspense, useState, useEffect, useMemo } from "react";
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
import { fetchOrderMessages } from "@/lib/api/chat";
import { connectSocket } from "@/lib/socket";
import { handleAuthMeResponse } from "@/lib/auth-client";
import { requireApiUrl } from "@/lib/api-url";

const API_URL = requireApiUrl();

const acceptOrder = async (jobId: string) => {
  const res = await fetch(`${API_URL}/orders/${jobId}/accept`, {
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
  const [seenJobIds, setSeenJobIds] = useState<Set<string>>(new Set());
  const [completedJob, setCompletedJob] = useState<Job | null>(null);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [loadingMe, setLoadingMe] = useState(true);
  const [me, setMe] = useState<User | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPeerName, setChatPeerName] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [pendingChatOrderId, setPendingChatOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
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
  // 🟢 STATE HELPERS
  // =========================
  const upsertJob = (job: Job) => {
    setJobs((prev) => {
      const index = prev.findIndex((j) => j.id === job.id);

      if (index === -1) return [job, ...prev];

      const clone = [...prev];
      clone[index] = job;

      return clone;
    });
  };

  const removeJob = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch(`${API_URL}/wallet`, {
          credentials: "include",
        });

        const data = await res.json();

        console.log("🔥 WALLET DATA:", data);

        setWalletBalance(data.balance || 0);
        setWalletBalance((prev) => prev - (data.pendingWithdrawals || 0)); // trừ đi số tiền đang chờ rút
      } catch (err) {
        console.error("Fetch wallet error:", err);
      } finally {
        setWalletLoading(false);
      }
    };

    fetchWallet();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN").format(amount) + "đ";

  // =========================
  // 🟡 FETCH JOBS
  // =========================
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const [available, myJobs] = await Promise.all([
          getAvailableOrders(),
          getMyTaskerOrders(),
        ]);

        console.log("AVAILABLE:", available);
        console.log("MY JOBS:", myJobs);

        const merged = [...available, ...myJobs];

        const mapped = merged.map(mapOrderToJob);

        // 🔥 DETECT JOB MỚI
        const newJobs = mapped.filter(
          (job) => !seenJobIds.has(job.id) && job.status === "SEARCHING",
        );

        if (newJobs.length > 0) {
          const newest = newJobs[0];

          setIncomingJob(newest);
          setShowNewJobPopup(true);

          console.log("🔥 NEW JOB POPUP:", newest.id);
        }

        // 🔥 UPDATE SEEN IDS
        setSeenJobIds((prev) => {
          const updated = new Set(prev);
          mapped.forEach((j) => updated.add(j.id));
          return updated;
        });

        // 🔥 INITIALIZE UNREAD MESSAGE COUNTS
        mapped.forEach((job) => {
          if (job.unreadMessages && job.unreadMessages > 0) {
            useUnreadMessagesStore.getState().setUnread(job.id, job.unreadMessages);
          }
        });

        setJobs(mapped);
      } catch (err) {
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();

    const interval = setInterval(() => {
      fetchJobs();
    }, 5000); // 5s

    return () => clearInterval(interval);
  }, [toast]);

  // =========================
  // 📊 FILTER
  // =========================
  const assignedJobs = jobs.filter((j) => j.status === "ASSIGNED");
  const inProgressJobs = jobs.filter((j) => j.status === "IN_PROGRESS");
  const completedJobs = jobs.filter(
    (j) => j.status === "COMPLETED" || j.status === "WAITING_CONFIRMATION",
  );
  const timeoutJobs = jobs.filter((j) => j.status === "TIMEOUT");

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

  console.log("ASSIGNED:", assignedJobs);
  console.log("IN_PROGRESS:", inProgressJobs);
  console.log("COMPLETED:", completedJobs);
  console.log("TIMEOUT:", timeoutJobs);

  // =========================
  // 🎯 HANDLERS
  // =========================
  const openJobDetail = (job: Job) => {
    setSelectedJob(job);
    setIsJobDetailOpen(true);
  };

  const openChatForJob = async (job: Job) => {
    try {
      setChatOrderId(job.id);
      setChatPeerName(job.customer || "Khách hàng");

      // 🔥 CLEAR UNREAD MESSAGES WHEN OPENING CHAT
      useUnreadMessagesStore.getState().clearUnread(job.id);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? { ...j, unreadMessages: 0 }
            : j
        )
      );

      // 🔥 MARK MESSAGES AS READ ON BACKEND
      try {
        await fetch(`${API_URL}/chat/orders/${job.id}/messages/mark-read`, {
          method: "PATCH",
          credentials: "include",
        });
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }

      const socket = connectSocket(userId || "", "TASKER");
      socket.emit("order:join", {
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

    const socket = connectSocket(userId || "", "TASKER");
    socket.emit("chat:message", {
      orderId: chatOrderId,
      text,
    });
  };

  useEffect(() => {
    if (!userId) return;

    const socket = connectSocket(userId, "TASKER");

    const handleIncomingChatMessage = (message: any) => {
      const incomingOrderId = String(message?.orderId ?? "");
      const senderId = String(message?.senderId ?? "");
      const isFromMe = senderId === String(userId);

      // 🔥 If chat is open and it's the right order, add to messages
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
        // 🔥 If message is from customer and chat is not open, increment unread
        useUnreadMessagesStore.getState().incrementUnread(incomingOrderId, 1);
        
        // 🔥 Also update jobs state to trigger re-render
        setJobs((prev) =>
          prev.map((job) =>
            job.id === incomingOrderId
              ? { ...job, unreadMessages: (job.unreadMessages || 0) + 1 }
              : job
          )
        );
      }
    };

    socket.on("chat:message", handleIncomingChatMessage);

    return () => {
      socket.off("chat:message", handleIncomingChatMessage);
    };
  }, [userId, chatOrderId, chatOpen]);

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
      // 🔍 Kiểm tra ràng buộc thời gian
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

      const res = await fetch(`${API_URL}/orders/${jobId}/start`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Không thể bắt đầu việc");
      }

      // 🔥 update local state ngay lập tức
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
        const res = await fetch(`${API_URL}/orders/${selectedJob.id}/reject`, {
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
      const res = await fetch(`${API_URL}/orders/${jobId}/complete`, {
        method: "PATCH",
        credentials: "include",
      });

      // 🔥 update state ngay
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

        setShowCompletionPopup(true); // 🔥 show popup
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

      // 🔥 update UI ngay (optimistic)
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: "ASSIGNED" } : j)),
      );

      // 🔥 nếu là popup → đóng
      if (incomingJob?.id === jobId) {
        setShowNewJobPopup(false);
        setIncomingJob(null);
      }
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleRejectIncomingJob = () => {
    const doReject = async () => {
      try {
        if (!incomingJob) return;
        const res = await fetch(`${API_URL}/orders/${incomingJob.id}/reject`, {
          method: "PATCH",
          credentials: "include",
        });

        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.message || "Reject failed");
        }

        toast({ title: "Đã từ chối", variant: "destructive" });

        setShowNewJobPopup(false);
        setIncomingJob(null);
        setJobs((prev) => prev.filter((j) => j.id !== incomingJob.id));
      } catch (err: any) {
        toast({ title: "Lỗi", description: err.message, variant: "destructive" });
      }
    };

    void doReject();
  };

  // Subscribe to order room updates for the incoming popup so it auto-closes
  useEffect(() => {
    if (!userId || !incomingJob) return;

    const socket = connectSocket(userId, "TASKER");

    const orderId = incomingJob.id;

    socket.emit("order:join", {
      orderId,
      userId: userId || "",
      role: "TASKER",
    });

    const handleStatus = (payload: any) => {
      const payloadOrderId = String(payload?.orderId ?? payload?.id ?? "");
      if (payloadOrderId !== orderId) return;

      const status = payload?.status ?? payload?.data?.status;
      if (status && status !== "SEARCHING") {
        setShowNewJobPopup(false);
        setIncomingJob(null);
        setJobs((prev) => prev.map((j) => (j.id === orderId ? { ...j, status } : j)));
      }
    };

    const handleFullUpdate = (order: any) => {
      const id = String(order?._id ?? order?.id ?? "");
      if (id !== orderId) return;
      if (order.status && order.status !== "SEARCHING") {
        setShowNewJobPopup(false);
        setIncomingJob(null);
        setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: order.status } : j)));
      }
    };

    socket.on("order:status-updated", handleStatus);
    socket.on("order:updated", handleFullUpdate);

    return () => {
      socket.off("order:status-updated", handleStatus);
      socket.off("order:updated", handleFullUpdate);
      try {
        socket.disconnect();
      } catch (e) {
        // ignore
      }
    };
  }, [userId, incomingJob]);

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
            className="w-full flex items-center gap-3 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl mb-6 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-600 font-bold text-sm">₫</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">
                Ví của Tasker
              </p>
              <p className="text-xs text-muted-foreground">
                Quản lý thu nhập & rút tiền
              </p>
            </div>
            <span className="text-lg font-bold text-emerald-600">
              {walletLoading ? "..." : formatCurrency(walletBalance)}
            </span>
          </button>

          <Tabs defaultValue="assigned" className="space-y-6">
            <TabsList className="bg-card p-1 rounded-xl">
              <TabsTrigger value="assigned">
                Việc mới ({assignedJobs.length})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                Đang làm ({inProgressJobs.length})
              </TabsTrigger>

              <TabsTrigger value="completed">Đã hoàn thành</TabsTrigger>
              {timeoutJobs.length > 0 && (
                <TabsTrigger value="timeout" className="text-red-600">
                  Quá hạn ({timeoutJobs.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
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
        onOpenChange={setShowNewJobPopup}
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
