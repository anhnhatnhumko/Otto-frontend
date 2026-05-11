"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  History,
  TrendingUp,
  Shield,
  Eye,
  EyeOff,
  ArrowLeft,
  Briefcase,
  Star,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

// interface Transaction {
//   id: string;
//   type: "earning" | "withdraw" | "bonus" | "penalty";
//   amount: number;
//   description: string;
//   date: string;
//   time: string;
//   status: "success" | "pending";
// }

type User = {
  _id: string;
  fullName: string;
  email: string;
  role?: string;
  avatar?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const TaskerWalletPage = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [me, setMe] = useState<User | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "RECEIVE" | "WITHDRAW" | "BONUS" | "PENALTY"
  >("all");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setMe(data);
      })
      .catch(() => {
        router.push("/login");
      })
      .finally(() => {
        setLoadingMe(false);
      });
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.abs(amount)) + "đ";
  };

  const mappedTransactions = (transactions || []).map((tx) => {
    const isReceive = tx.isPositive || tx.type === "BONUS";
    const isWithdraw = tx.type === "WITHDRAW" || tx.type === "PENALTY";
    return {
      id: tx._id,
      type: tx.type,

      amount: Math.abs(tx.amount), // 🔥 luôn dương

      isPositive: isReceive, // 🔥 quyết định dấu

      description: isReceive
        ? tx.orderCode
          ? `Đơn ${tx.orderCode}`
          : "Thu nhập từ đơn hàng"
        : isWithdraw
          ? `Rút về ${tx.bankName || "Ngân hàng"} ${
              tx.accountNumber ? "****" + tx.accountNumber.slice(-4) : ""
            }`
          : "Giao dịch",

      date: new Date(tx.createdAt).toLocaleDateString("vi-VN"),
      time: new Date(tx.createdAt).toLocaleTimeString("vi-VN"),

      status: tx.status === "SUCCESS" ? "success" : "pending",
    };
  });

  const filteredTransactions = mappedTransactions.filter((tx) => {
    if (activeFilter === "all") return true;
    return tx.type === activeFilter;
  });

  const totalEarnings = mappedTransactions
    .filter((t) => t.type === "RECEIVE" || t.type === "BONUS")
    .reduce((s, t) => s + t.amount, 0);
  const totalWithdrawn = Math.abs(
    mappedTransactions
      .filter((t) => t.type === "WITHDRAW")
      .reduce((s, t) => s + t.amount, 0),
  );
  const pendingEarnings = mappedTransactions
    .filter(
      (t) =>
        t.status === "pending" && (t.type === "RECEIVE" || t.type === "BONUS"),
    )
    .reduce((s, t) => s + t.amount, 0);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "RECEIVE":
        return <ArrowDownLeft size={16} className="text-green-600" />;
      case "WITHDRAW":
        return <ArrowUpRight size={16} className="text-destructive" />;
      case "BONUS":
        return <Star size={16} className="text-amber-500" />;
      case "PENALTY":
        return <ArrowUpRight size={16} className="text-destructive" />;
      default:
        return null;
    }
  };

  const getTransactionBg = (type: string) => {
    switch (type) {
      case "RECEIVE":
        return "bg-green-100";
      case "WITHDRAW":
        return "bg-red-100";
      case "BONUS":
        return "bg-amber-100";
      case "PENALTY":
        return "bg-red-100";
      default:
        return "bg-muted";
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [walletRes, txRes] = await Promise.all([
          fetch(`${API_URL}/wallet`, { credentials: "include" }),
          fetch(`${API_URL}/wallet/transactions`, {
            credentials: "include",
          }),
        ]);

        const walletData = await walletRes.json();
        const txData = await txRes.json();

        console.log("🔥 WALLET:", walletData);
        console.log("🔥 TX:", txData);

        setBalance(walletData.balance || 0);
        setTransactions(txData);
      } catch (err) {
        console.error("Fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-4 md:py-8">
        <div className="container max-w-2xl mx-auto px-4">
          {/* Top bar */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => router.push("/tasker/dashboard")}
              className="p-2 rounded-full hover:bg-muted active:scale-95 transition-transform"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-bold text-foreground flex-1">
              Ví Tasker
            </h1>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              {showBalance ? (
                <Eye size={18} className="text-muted-foreground" />
              ) : (
                <EyeOff size={18} className="text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Balance Card */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={18} className="opacity-80" />
                <span className="text-sm opacity-80">Thu nhập khả dụng</span>
              </div>
              <p className="text-3xl font-bold mb-1">
                {showBalance ? formatCurrency(balance) : "••••••••"}
              </p>
              {pendingEarnings > 0 && (
                <p className="text-xs opacity-70 mb-5">
                  {/* Đang chờ: +{formatCurrency(pendingEarnings)} */}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => router.push("/tasker/withdraw")}
                  className="flex flex-col items-center gap-1.5 bg-white/15 hover:bg-white/25 rounded-xl py-3 transition-colors active:scale-95"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Send size={18} />
                  </div>
                  <span className="text-xs font-medium">Rút tiền</span>
                </button>
                <button
                  onClick={() => setActiveFilter("all")}
                  className="flex flex-col items-center gap-1.5 bg-white/15 hover:bg-white/25 rounded-xl py-3 transition-colors active:scale-95"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <History size={18} />
                  </div>
                  <span className="text-xs font-medium">Lịch sử</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={14} className="text-green-600" />
                  <span className="text-[11px] text-muted-foreground">
                    Tổng thu
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {formatCurrency(totalEarnings)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Send size={14} className="text-destructive" />
                  <span className="text-[11px] text-muted-foreground">
                    Đã rút
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {formatCurrency(totalWithdrawn)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Briefcase size={14} className="text-primary" />
                  <span className="text-[11px] text-muted-foreground">
                    Chờ duyệt
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {formatCurrency(pendingEarnings)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick withdraw CTA */}
          <button
            onClick={() => router.push("/tasker/withdraw")}
            className="w-full flex items-center gap-3 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl mb-6 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <Send size={18} className="text-emerald-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">
                Rút tiền về ngân hàng
              </p>
              <p className="text-xs text-muted-foreground">
                Miễn phí • Nhận trong 1-3 ngày
              </p>
            </div>
            <ChevronRight
              size={18}
              className="text-muted-foreground group-hover:translate-x-0.5 transition-transform"
            />
          </button>

          {/* Security */}
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 rounded-xl mb-6">
            <Shield size={16} className="text-green-600" />
            <p className="text-xs text-green-700">
              Thu nhập được bảo mật và xử lý minh bạch
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {[
              { key: "all" as const, label: "Tất cả" },
              { key: "RECEIVE" as const, label: "Thu nhập" },
              { key: "WITHDRAW" as const, label: "Rút tiền" },
              { key: "BONUS" as const, label: "Thưởng" },
              { key: "PENALTY" as const, label: "Phạt" },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95 ${
                  activeFilter === filter.key
                    ? "bg-emerald-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Transaction List */}
          <div className="space-y-2">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <History
                  size={40}
                  className="mx-auto text-muted-foreground/40 mb-3"
                />
                <p className="text-muted-foreground">Chưa có giao dịch nào</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <Card key={tx.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getTransactionBg(tx.type)}`}
                      >
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {tx.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.date} • {tx.time}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm font-bold ${
                            tx.isPositive
                              ? "text-green-600"
                              : "text-destructive"
                          }`}
                        >
                          {tx.isPositive ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {tx.status === "success"
                            ? "Thành công"
                            : "Đang xử lý"}
                        </Badge>
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
