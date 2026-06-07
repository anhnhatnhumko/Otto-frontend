"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  Plus,
  Wallet,
  XCircle,
} from "lucide-react";

interface BankAccount {
  _id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isDefault: boolean;
}

interface WalletTransaction {
  _id: string;
  amount: number;
  bankName?: string;
  accountNumber?: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: string;
  note?: string;
  type: string;
}

const quickAmounts = [100000, 200000, 500000, 1000000, 2000000, 5000000];

const banks = [
  "Vietcombank",
  "Techcombank",
  "BIDV",
  "Agribank",
  "VPBank",
  "MB Bank",
  "ACB",
  "Sacombank",
  "TPBank",
  "VIB",
];

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat("vi-VN").format(value)}đ`;

const formatDate = (date: string) => new Date(date).toLocaleDateString("vi-VN");

const maskAccount = (accountNumber?: string) =>
  accountNumber ? `****${accountNumber.slice(-4)}` : "xxxx xxxx xxxx";

const TaskerWithdraw = () => {
  const router = useRouter();
  const { toast } = useToast();

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [showAddBank, setShowAddBank] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);

  const [newBankName, setNewBankName] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newAccountHolder, setNewAccountHolder] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [banksRes, walletRes, txRes] = await Promise.all([
          fetch("/api/bank-accounts", { credentials: "include" }),
          fetch("/api/wallet", { credentials: "include" }),
          fetch("/api/wallet/transactions", { credentials: "include" }),
        ]);

        const banksData = await banksRes.json();
        const walletData = await walletRes.json();
        const txData = await txRes.json();

        const bankList = Array.isArray(banksData) ? banksData : banksData?.data || [];
        const withdrawHistory = Array.isArray(txData)
          ? txData.filter((tx: WalletTransaction) => tx.type === "WITHDRAW")
          : [];

        setBankAccounts(bankList);
        setBalance(Number(walletData?.balance ?? 0));
        setHistory(withdrawHistory);
      } catch {
        toast({
          title: "Không thể tải ví",
          description: "Vui lòng thử lại sau ít phút.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchInitialData();
  }, [toast]);

  useEffect(() => {
    if (bankAccounts.length === 0) return;
    setSelectedBank(
      bankAccounts.find((account) => account.isDefault) || bankAccounts[0],
    );
  }, [bankAccounts]);

  const parsedAmount = useMemo(
    () => parseInt(amount.replace(/\D/g, ""), 10) || 0,
    [amount],
  );

  const isValidAmount =
    parsedAmount >= 50000 && parsedAmount <= balance && Boolean(selectedBank);

  const handleAmountChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setAmount(digits ? new Intl.NumberFormat("vi-VN").format(parseInt(digits, 10)) : "");
  };

  const handleQuickAmount = (value: number) => {
    if (value <= balance) {
      setAmount(new Intl.NumberFormat("vi-VN").format(value));
    }
  };

  const handleAddBank = async () => {
    try {
      if (!newBankName || !newAccountNumber || !newAccountHolder) return;

      const res = await fetch("/api/bank-accounts", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bankName: newBankName,
          accountNumber: newAccountNumber.replace(/\s/g, ""),
          accountHolder: newAccountHolder,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Không thể thêm tài khoản");
      }

      setBankAccounts((prev) => [...prev, data]);
      setShowAddBank(false);
      setNewBankName("");
      setNewAccountNumber("");
      setNewAccountHolder("");

      toast({
        title: "Đã thêm tài khoản",
        description: `${data.bankName} • ${maskAccount(data.accountNumber)}`,
      });
    } catch (error) {
      toast({
        title: "Lỗi thêm tài khoản",
        description:
          error instanceof Error ? error.message : "Có lỗi xảy ra, thử lại nhé.",
        variant: "destructive",
      });
    }
  };

  const handleRequestOtp = async () => {
    if (!selectedBank) return;

    try {
      setIsRequestingOtp(true);

      const res = await fetch("/api/wallet/withdraw/request", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parsedAmount,
          bankName: selectedBank.bankName,
          accountNumber: selectedBank.accountNumber.replace(/\s/g, ""),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Không thể gửi OTP");
      }

      const params = new URLSearchParams({
        transactionId: String(data.transactionId ?? ""),
        amount: String(parsedAmount),
        bankName: selectedBank.bankName,
        accountNumber: selectedBank.accountNumber,
      });

      setShowConfirm(false);
      router.push(`/tasker/withdraw/verify?${params.toString()}`);
    } catch (error) {
      toast({
        title: "Không thể gửi OTP",
        description:
          error instanceof Error
            ? error.message
            : "Có lỗi xảy ra khi tạo yêu cầu rút tiền.",
        variant: "destructive",
      });
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const getStatusIcon = (status: WalletTransaction["status"]) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle2 size={16} className="text-green-600 dark:text-green-300" />;
      case "PENDING":
        return <Clock size={16} className="text-amber-500 dark:text-amber-300" />;
      case "FAILED":
        return <XCircle size={16} className="text-red-600 dark:text-red-300" />;
      default:
        return <Clock size={16} className="text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: WalletTransaction["status"]) => {
    switch (status) {
      case "SUCCESS":
        return (
          <Badge className="border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-200">
            Thành công
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200">
            Đang xử lý
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200">
            Thất bại
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_38%)] py-5 md:py-10">
        <div className="container mx-auto max-w-2xl px-3 sm:px-4">
          <button
            onClick={() => router.push("/tasker/wallet")}
            className="mb-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={18} />
            Quay lại ví
          </button>

          <Card className="mb-6 overflow-hidden rounded-3xl border-border/70 bg-card/95 shadow-lg">
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-5 text-white sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="text-sm text-white/80">Thu nhập khả dụng</p>
                  <p className="text-2xl font-bold sm:text-3xl">
                    {loading ? "..." : formatCurrency(balance)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="mb-6 rounded-3xl border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ArrowUpRight size={20} className="text-emerald-600 dark:text-emerald-300" />
                Rút tiền về ngân hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
                Mỗi lần rút tiền sẽ cần xác nhận OTP gửi về email của bạn để giữ an
                toàn cho ví.
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Tài khoản nhận tiền</Label>
                <div className="space-y-2.5">
                  {bankAccounts.map((bank) => {
                    const isActive = selectedBank?._id === bank._id;

                    return (
                      <button
                        key={bank._id}
                        onClick={() => setSelectedBank(bank)}
                        className={`w-full rounded-2xl border p-3 text-left transition-all ${
                          isActive
                            ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/20"
                            : "border-border bg-card hover:border-emerald-400/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                            <Building2 size={18} className="text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-foreground">
                                {bank.bankName}
                              </p>
                              {bank.isDefault && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-medium"
                                >
                                  Mặc định
                                </Badge>
                              )}
                            </div>
                            <p className="break-all text-xs text-muted-foreground">
                              {bank.accountNumber} • {bank.accountHolder}
                            </p>
                          </div>
                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              isActive ? "border-emerald-500" : "border-border"
                            }`}
                          >
                            {isActive && (
                              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setShowAddBank(true)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-3 text-left transition-colors hover:border-emerald-400/50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                      <Plus size={18} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Thêm tài khoản ngân hàng
                    </p>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Số tiền rút</Label>
                <div className="relative">
                  <Input
                    placeholder="Nhập số tiền"
                    value={amount}
                    onChange={(event) => handleAmountChange(event.target.value)}
                    inputMode="numeric"
                    className="h-12 pr-10 text-lg font-semibold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    đ
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Tối thiểu: 50.000đ</p>
                  <button
                    onClick={() => handleQuickAmount(balance)}
                    className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-300"
                  >
                    Rút tất cả
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {quickAmounts
                    .filter((value) => value <= balance)
                    .map((value) => (
                      <button
                        key={value}
                        onClick={() => handleQuickAmount(value)}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                          parsedAmount === value
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                            : "border-border bg-card text-muted-foreground hover:border-emerald-400/40"
                        }`}
                      >
                        {formatCurrency(value)}
                      </button>
                    ))}
                </div>
              </div>

              {parsedAmount > 0 && parsedAmount < 50000 && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-200">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>Số tiền rút tối thiểu là 50.000đ.</span>
                </div>
              )}

              {parsedAmount > balance && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-200">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>Số tiền rút vượt quá thu nhập khả dụng.</span>
                </div>
              )}

              <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm dark:bg-slate-900/50">
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>Phí rút tiền</span>
                  <span className="font-medium text-green-600 dark:text-green-300">
                    Miễn phí
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>Thời gian xử lý</span>
                  <span>1-3 ngày làm việc</span>
                </div>
                <div className="flex justify-between gap-4 border-t border-border pt-2 font-medium text-foreground">
                  <span>Số tiền nhận được</span>
                  <span>{formatCurrency(parsedAmount || 0)}</span>
                </div>
              </div>

              <Button
                size="lg"
                className="h-auto min-h-12 w-full whitespace-normal bg-emerald-600 py-3 text-white hover:bg-emerald-700"
                disabled={!isValidAmount}
                onClick={() => setShowConfirm(true)}
              >
                {isValidAmount
                  ? `Nhận mã OTP để rút ${formatCurrency(parsedAmount)}`
                  : "Nhập thông tin để rút tiền"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/70 bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock size={20} className="text-muted-foreground" />
                Lịch sử rút tiền
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                  Chưa có lần rút tiền nào.
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-2xl border border-border/60 bg-muted/30 p-3 dark:bg-slate-900/40"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted dark:bg-slate-800">
                            {getStatusIcon(item.status)}
                          </div>
                          <div className="min-w-0">
                            <p className="break-all text-sm font-medium text-foreground">
                              {item.bankName || "Ngân hàng"} • {maskAccount(item.accountNumber)}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <p className="text-xs text-muted-foreground">
                                {formatDate(item.createdAt)}
                              </p>
                              {getStatusLabel(item.status)}
                            </div>
                            {item.note && (
                              <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                                {item.note}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-foreground sm:ml-auto">
                          -{formatCurrency(Math.abs(item.amount))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm rounded-2xl border-border/70">
          <DialogHeader>
            <DialogTitle>Xác nhận rút tiền</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Số tiền</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(parsedAmount)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Ngân hàng</span>
              <span className="font-medium text-foreground">{selectedBank?.bankName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Số tài khoản</span>
              <span className="font-medium text-foreground">{selectedBank?.accountNumber}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Chủ tài khoản</span>
              <span className="font-medium text-foreground">{selectedBank?.accountHolder}</span>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200">
              Mã OTP sẽ được gửi về email đăng ký của bạn. Tiền chỉ bị trừ sau khi xác
              nhận OTP thành công.
            </div>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Hủy
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleRequestOtp}
              disabled={isRequestingOtp}
            >
              {isRequestingOtp ? "Đang gửi OTP..." : "Nhận mã OTP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddBank} onOpenChange={setShowAddBank}>
        <DialogContent className="max-w-sm rounded-2xl border-border/70">
          <DialogHeader>
            <DialogTitle>Thêm tài khoản ngân hàng</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Ngân hàng</Label>
              <Select value={newBankName} onValueChange={setNewBankName}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngân hàng" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Số tài khoản</Label>
              <Input
                placeholder="Nhập số tài khoản"
                value={newAccountNumber}
                inputMode="numeric"
                onChange={(event) => setNewAccountNumber(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Chủ tài khoản</Label>
              <Input
                placeholder="VD: TRAN VAN BINH"
                value={newAccountHolder}
                onChange={(event) =>
                  setNewAccountHolder(event.target.value.toUpperCase())
                }
              />
            </div>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowAddBank(false)}>
              Hủy
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleAddBank}
              disabled={!newBankName || !newAccountNumber || !newAccountHolder}
            >
              Thêm tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskerWithdraw;
