"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Briefcase,
  ChevronRight,
  Eye,
  EyeOff,
  History,
  Send,
  Shield,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";

type WalletTransaction = {
  _id: string;
  type: "RECEIVE" | "WITHDRAW" | "BONUS" | "PENALTY";
  amount: number;
  status: "SUCCESS" | "PENDING" | "FAILED";
  isPositive?: boolean;
  orderCode?: string;
  bankName?: string;
  accountNumber?: string;
  createdAt: string;
};

type TransactionFilter = "all" | "RECEIVE" | "WITHDRAW" | "BONUS" | "PENALTY";

type MappedTransaction = {
  id: string;
  type: WalletTransaction["type"];
  amount: number;
  isPositive: boolean;
  description: string;
  date: string;
  time: string;
  status: "success" | "pending" | "failed";
};

const formatCurrency = (amount: number) =>
  `${new Intl.NumberFormat("vi-VN").format(Math.abs(amount))}đ`;

const getTransactionIcon = (type: WalletTransaction["type"]) => {
  switch (type) {
    case "RECEIVE":
      return <ArrowDownLeft size={16} className="text-green-600 dark:text-green-300" />;
    case "WITHDRAW":
      return <ArrowUpRight size={16} className="text-red-600 dark:text-red-300" />;
    case "BONUS":
      return <Star size={16} className="text-amber-500 dark:text-amber-300" />;
    case "PENALTY":
      return <ArrowUpRight size={16} className="text-red-600 dark:text-red-300" />;
    default:
      return null;
  }
};

const getTransactionBg = (type: WalletTransaction["type"]) => {
  switch (type) {
    case "RECEIVE":
      return "bg-green-100 dark:bg-green-500/15";
    case "WITHDRAW":
      return "bg-red-100 dark:bg-red-500/15";
    case "BONUS":
      return "bg-amber-100 dark:bg-amber-500/15";
    case "PENALTY":
      return "bg-red-100 dark:bg-red-500/15";
    default:
      return "bg-muted";
  }
};

const getTransactionStatusBadge = (status: MappedTransaction["status"]) => {
  if (status === "success") {
    return (
      <Badge
        variant="outline"
        className="border-green-500/30 bg-green-500/10 text-[10px] text-green-700 dark:text-green-200"
      >
        Thành công
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge
        variant="outline"
        className="border-red-500/30 bg-red-500/10 text-[10px] text-red-700 dark:text-red-200"
      >
        Thất bại
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-200"
    >
      Đang xử lý
    </Badge>
  );
};

const TaskerWalletPage = () => {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>("all");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [walletRes, txRes] = await Promise.all([
          fetch("/api/wallet", { credentials: "include" }),
          fetch("/api/wallet/transactions", { credentials: "include" }),
        ]);

        const walletData = await walletRes.json();
        const txData = await txRes.json();

        const nextTransactions = Array.isArray(txData) ? txData : txData?.data || [];

        setBalance(Number(walletData?.balance ?? 0));
        setTransactions(nextTransactions);
      } catch (error) {
        console.error("Fetch error", error);
      }
    };

    void fetchAll();
  }, []);

  const mappedTransactions: MappedTransaction[] = (transactions || []).map((tx) => {
    const isReceive = Boolean(tx.isPositive) || tx.type === "BONUS";
    const isWithdraw = tx.type === "WITHDRAW" || tx.type === "PENALTY";

    return {
      id: tx._id,
      type: tx.type,
      amount: Math.abs(tx.amount),
      isPositive: isReceive,
      description: isReceive
        ? tx.orderCode
          ? `Đơn ${tx.orderCode}`
          : "Thu nhập từ đơn hàng"
        : isWithdraw
          ? `Rút về ${tx.bankName || "Ngân hàng"} ${
              tx.accountNumber ? `****${tx.accountNumber.slice(-4)}` : ""
            }`
          : "Giao dịch",
      date: new Date(tx.createdAt).toLocaleDateString("vi-VN"),
      time: new Date(tx.createdAt).toLocaleTimeString("vi-VN"),
      status:
        tx.status === "SUCCESS"
          ? "success"
          : tx.status === "FAILED"
            ? "failed"
            : "pending",
    };
  });

  const filteredTransactions = mappedTransactions.filter((tx) => {
    if (activeFilter === "all") return true;
    return tx.type === activeFilter;
  });

  const totalEarnings = mappedTransactions
    .filter((tx) => tx.type === "RECEIVE" || tx.type === "BONUS")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalWithdrawn = Math.abs(
    mappedTransactions
      .filter((tx) => tx.type === "WITHDRAW")
      .reduce((sum, tx) => sum + tx.amount, 0),
  );

  const pendingEarnings = mappedTransactions
    .filter(
      (tx) =>
        tx.status === "pending" && (tx.type === "RECEIVE" || tx.type === "BONUS"),
    )
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_38%)] py-4 md:py-8">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="mb-5 flex items-center gap-3">
            <button
              onClick={() => router.push("/tasker/dashboard")}
              className="rounded-full p-2 transition-transform hover:bg-muted active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="flex-1 text-lg font-bold text-foreground">Ví Tasker</h1>
            <button
              onClick={() => setShowBalance((prev) => !prev)}
              className="rounded-full p-2 transition-colors hover:bg-muted"
            >
              {showBalance ? (
                <Eye size={18} className="text-muted-foreground" />
              ) : (
                <EyeOff size={18} className="text-muted-foreground" />
              )}
            </button>
          </div>

          <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-5 text-white shadow-lg sm:p-6">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />

            <div className="relative">
              <div className="mb-1 flex items-center gap-2">
                <Wallet size={18} className="opacity-80" />
                <span className="text-sm opacity-80">Thu nhập khả dụng</span>
              </div>
              <p className="mb-1 text-3xl font-bold sm:text-4xl">
                {showBalance ? formatCurrency(balance) : "••••••••"}
              </p>
              <p className="text-xs text-white/75">
                Rút tiền an toàn qua OTP trước khi chuyển về ngân hàng.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <button
                  onClick={() => router.push("/tasker/withdraw")}
                  className="flex min-h-16 flex-col items-center gap-1.5 rounded-2xl bg-white/15 py-3 transition-colors hover:bg-white/25 active:scale-95"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                    <Send size={18} />
                  </div>
                  <span className="text-xs font-medium">Rút tiền</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="rounded-2xl border-border/70 bg-card/95 shadow-sm">
              <CardContent className="p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-green-600 dark:text-green-300" />
                  <span className="text-[11px] text-muted-foreground">Tổng thu</span>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {formatCurrency(totalEarnings)}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/70 bg-card/95 shadow-sm">
              <CardContent className="p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <Send size={14} className="text-red-600 dark:text-red-300" />
                  <span className="text-[11px] text-muted-foreground">Đã rút</span>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {formatCurrency(totalWithdrawn)}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/70 bg-card/95 shadow-sm">
              <CardContent className="p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <Briefcase size={14} className="text-sky-600 dark:text-sky-300" />
                  <span className="text-[11px] text-muted-foreground">Chờ duyệt</span>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {formatCurrency(pendingEarnings)}
                </p>
              </CardContent>
            </Card>
          </div>

          <button
            onClick={() => router.push("/tasker/withdraw")}
            className="group mb-6 flex w-full items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 transition-colors hover:bg-emerald-500/15"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15">
              <Send size={18} className="text-emerald-600 dark:text-emerald-300" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Rút tiền về ngân hàng</p>
              <p className="text-xs text-muted-foreground">Miễn phí • Nhận trong 1-3 ngày</p>
            </div>
            <ChevronRight
              size={18}
              className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
            />
          </button>

          <div className="mb-6 flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <Shield size={16} className="mt-0.5 text-green-600 dark:text-green-300" />
            <p className="text-xs text-emerald-800 dark:text-emerald-200">
              Ví của bạn được bảo vệ an toàn. Rút tiền chỉ được thực hiện sau khi bạn xác
              nhận qua email hoặc OTP.
            </p>
          </div>

          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {[
              { key: "all" as const, label: "Tất cả" },
              { key: "RECEIVE" as const, label: "Thu nhập" },
              { key: "WITHDRAW" as const, label: "Rút tiền" },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
                  activeFilter === filter.key
                    ? "bg-emerald-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-card/70 py-12 text-center shadow-sm">
                <History size={40} className="mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground">Chưa có giao dịch nào</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <Card
                  key={tx.id}
                  className="rounded-2xl border-border/70 bg-card/95 shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getTransactionBg(
                            tx.type,
                          )}`}
                        >
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {tx.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tx.date} • {tx.time}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:ml-auto sm:block sm:text-right">
                        <p
                          className={`text-sm font-bold ${
                            tx.isPositive
                              ? "text-green-600 dark:text-green-300"
                              : "text-red-600 dark:text-red-300"
                          }`}
                        >
                          {tx.isPositive ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </p>
                        {getTransactionStatusBadge(tx.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TaskerWalletPage;
