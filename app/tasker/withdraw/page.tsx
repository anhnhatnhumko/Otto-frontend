"use client";

import { useEffect, useState } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Wallet,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface BankAccount {
  _id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isDefault: boolean;
}

interface WithdrawHistory {
  id: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  note?: string;
}

type User = {
  _id: string;
  fullName: string;
  email: string;
  role?: string;
  avatar?: string;
};

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

const TaskerWithdraw = () => {
  const mask = (acc: string) =>
    acc ? "****" + acc.slice(-4) : "xxxx xxxx xxxx";
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("vi-VN");
  const { toast } = useToast();
  const router = useRouter();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
  const [amount, setAmount] = useState("");
  const [showAddBank, setShowAddBank] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [balance, setBalance] = useState(0);
  useEffect(() => {
    fetch(`/api/bank-accounts`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.data || [];
        setBankAccounts(list);
      });
  }, []);

  useEffect(() => {
    if (bankAccounts.length > 0) {
      const defaultBank =
        bankAccounts.find((b) => b.isDefault) || bankAccounts[0];

      setSelectedBank(defaultBank);
    }
  }, [bankAccounts]);


  useEffect(() => {
    fetch(`/api/wallet`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setBalance(data.balance));
  }, []);

  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch(`/api/wallet/transactions`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        const withdraws = data.filter((tx: any) => tx.type === "WITHDRAW");
        setHistory(withdraws);
      });
  }, []);

  const [newBankName, setNewBankName] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newAccountHolder, setNewAccountHolder] = useState("");
  const [me, setMe] = useState<User | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("vi-VN").format(n) + "đ";

  const parsedAmount = parseInt(amount.replace(/\D/g, "")) || 0;
  const isValidAmount = parsedAmount >= 50000 && parsedAmount <= balance;

  const handleAmountChange = (value: string) => {
    const num = value.replace(/\D/g, "");
    setAmount(num ? new Intl.NumberFormat("vi-VN").format(parseInt(num)) : "");
  };

  const handleQuickAmount = (val: number) => {
    if (val <= balance) {
      setAmount(new Intl.NumberFormat("vi-VN").format(val));
    }
  };

  useEffect(() => {
    fetch(`/api/auth/me`, {
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

  const handleWithdraw = async () => {
    try {
      const res = await fetch(`/api/wallet/withdraw`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parsedAmount,
          bankName: selectedBank?.bankName,
          accountNumber: selectedBank?.accountNumber.replace(/\s/g, ""),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setShowConfirm(false);
      setShowSuccess(true);
      setAmount("");
    } catch (err: any) {
      toast({
        title: "Lỗi rút tiền",
        description: err.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    }
  };

  const handleAddBank = async () => {
    try {
      if (!newBankName || !newAccountNumber || !newAccountHolder) return;

      const res = await fetch(`/api/bank-accounts`, {
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

      if (!res.ok) throw new Error(data.message);

      toast({
        title: "Thêm tài khoản thành công!",
        description: `${newBankName} - ${newAccountNumber}`,
      });

      // 🔥 update UI ngay (không cần reload)
      setBankAccounts((prev) => [...prev, data]);

      setShowAddBank(false);
      setNewBankName("");
      setNewAccountNumber("");
      setNewAccountHolder("");
    } catch (err: any) {
      toast({
        title: "Lỗi thêm tài khoản",
        description: err.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle2 size={16} className="text-green-600" />;
      case "PENDING":
        return <Clock size={16} className="text-yellow-600" />;
      case "FAILED":
        return <XCircle size={16} className="text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            Thành công
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            Đang xử lý
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
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

      <main className="py-6 md:py-12">
        <div className="container max-w-2xl px-4">
          {/* Back */}
          <button
            onClick={() => router.push("/tasker/wallet")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            Quay lại ví
          </button>

          {/* Balance Card */}
          <Card className="overflow-hidden mb-6">
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 text-white p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="text-sm opacity-80">Thu nhập khả dụng</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Withdraw Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowUpRight size={20} className="text-emerald-600" />
                Rút tiền về ngân hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Bank Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Tài khoản nhận tiền
                </Label>
                <div className="space-y-2">
                  {bankAccounts.map((bank) => (
                    <button
                      key={bank._id}
                      onClick={() => setSelectedBank(bank)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        selectedBank?._id === bank._id
                          ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200"
                          : "border-border hover:border-emerald-300"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Building2
                          size={18}
                          className="text-muted-foreground"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {bank.bankName}
                          </p>
                          {bank.isDefault && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              Mặc định
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {bank.accountNumber} • {bank.accountHolder}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedBank?._id === bank._id
                            ? "border-emerald-500"
                            : "border-border"
                        }`}
                      >
                        {selectedBank?._id === bank._id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        )}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => setShowAddBank(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-border hover:border-emerald-400 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Plus size={18} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Thêm tài khoản ngân hàng
                    </p>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Số tiền rút</Label>
                <div className="relative">
                  <Input
                    placeholder="Nhập số tiền"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="text-lg font-semibold pr-10 h-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    đ
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Tối thiểu: 50.000đ
                  </p>
                  <button
                    onClick={() => handleQuickAmount(balance)}
                    className="text-xs text-emerald-600 font-medium hover:underline"
                  >
                    Rút tất cả
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {quickAmounts
                    .filter((a) => a <= balance)
                    .map((val) => (
                      <button
                        key={val}
                        onClick={() => handleQuickAmount(val)}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                          parsedAmount === val
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-border text-muted-foreground hover:border-emerald-300"
                        }`}
                      >
                        {formatCurrency(val)}
                      </button>
                    ))}
                </div>
              </div>

              {/* Warnings */}
              {parsedAmount > 0 && parsedAmount < 50000 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>Số tiền rút tối thiểu là 50.000đ</span>
                </div>
              )}
              {parsedAmount > balance && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>Số tiền rút vượt quá thu nhập khả dụng</span>
                </div>
              )}

              {/* Fee info */}
              <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Phí rút tiền</span>
                  <span className="font-medium text-green-600">Miễn phí</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Thời gian xử lý</span>
                  <span>1-3 ngày làm việc</span>
                </div>
                {parsedAmount > 0 && isValidAmount && (
                  <div className="flex justify-between text-foreground font-medium pt-1 border-t border-border">
                    <span>Số tiền nhận được</span>
                    <span>{formatCurrency(parsedAmount)}</span>
                  </div>
                )}
              </div>

              <Button
                size="lg"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!isValidAmount || !selectedBank}
                onClick={() => setShowConfirm(true)}
              >
                {isValidAmount && selectedBank
                  ? `Rút ${formatCurrency(parsedAmount)}`
                  : "Nhập thông tin để rút tiền"}
              </Button>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock size={20} className="text-muted-foreground" />
                Lịch sử rút tiền
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.map((item: any) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30"
                  >
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {item.bankName} • {mask(item.accountNumber)}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </p>
                        {getStatusLabel(item.status)}
                      </div>
                      {item.note && (
                        <p className="text-xs text-destructive mt-1">
                          {item.note}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                      -{formatCurrency(Math.abs(item.amount))}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      {/* Confirm Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận rút tiền</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Số tiền</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(parsedAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ngân hàng</span>
              <span className="font-medium text-foreground">
                {selectedBank?.bankName}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Số tài khoản</span>
              <span className="font-medium text-foreground">
                {selectedBank?.accountNumber}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Chủ tài khoản</span>
              <span className="font-medium text-foreground">
                {selectedBank?.accountHolder}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Phí</span>
              <span className="font-medium text-green-600">Miễn phí</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between">
              <span className="font-medium text-foreground">Nhận được</span>
              <span className="text-lg font-bold text-emerald-600">
                {formatCurrency(parsedAmount)}
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Hủy
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleWithdraw}
            >
              Xác nhận rút tiền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bank Dialog */}
      <Dialog open={showAddBank} onOpenChange={setShowAddBank}>
        <DialogContent className="max-w-sm">
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
                onChange={(e) => setNewAccountNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Chủ tài khoản</Label>
              <Input
                placeholder="VD: TRAN VAN BINH"
                value={newAccountHolder}
                onChange={(e) =>
                  setNewAccountHolder(e.target.value.toUpperCase())
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBank(false)}>
              Hủy
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleAddBank}
              disabled={!newBankName || !newAccountNumber || !newAccountHolder}
            >
              Thêm tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm text-center">
          <div className="flex flex-col items-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-green-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-foreground">
                Yêu cầu rút tiền thành công!
              </h3>
              <p className="text-sm text-muted-foreground">
                Yêu cầu của bạn đã được ghi nhận và đang chờ xử lý
              </p>
            </div>

            <div className="w-full p-4 rounded-xl bg-muted/50 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số tiền rút</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(parsedAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngân hàng</span>
                <span className="font-medium text-foreground">
                  {selectedBank?.bankName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số tài khoản</span>
                <span className="font-medium text-foreground">
                  {selectedBank?.accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chủ tài khoản</span>
                <span className="font-medium text-foreground">
                  {selectedBank?.accountHolder}
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thời gian dự kiến</span>
                <span className="font-medium text-foreground">
                  1-3 ngày làm việc
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 w-full p-3 rounded-lg bg-emerald-50 text-sm text-muted-foreground">
              <AlertCircle
                size={16}
                className="shrink-0 mt-0.5 text-emerald-600"
              />
              <span>
                Bạn sẽ nhận được thông báo khi giao dịch hoàn tất. Vui lòng kiểm
                tra tài khoản ngân hàng sau 1-3 ngày làm việc.
              </span>
            </div>

            <div className="flex gap-2 w-full pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSuccess(false)}
              >
                Đóng
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  setShowSuccess(false);
                  router.push("/tasker/wallet");
                }}
              >
                Về ví
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskerWithdraw;
