"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Shield,
  Wallet,
} from "lucide-react";

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat("vi-VN").format(value)}đ`;

const maskAccount = (value: string) =>
  value ? `****${value.slice(-4)}` : "xxxx xxxx xxxx";

const WithdrawVerifyContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTransactionId = searchParams.get("transactionId") || "";
  const amount = Number(searchParams.get("amount") || 0);
  const bankName = searchParams.get("bankName") || "";
  const accountNumber = searchParams.get("accountNumber") || "";

  const [transactionId, setTransactionId] = useState(initialTransactionId);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = window.setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => {
        window.clearTimeout(timer);
      };
    }

    if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const nextOtp = ["", "", "", "", "", ""];

    for (let index = 0; index < pasted.length; index += 1) {
      nextOtp[index] = pasted[index];
    }

    setOtp(nextOtp);
    setError("");

    const nextFocusIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleResend = async () => {
    try {
      const res = await fetch("/api/wallet/withdraw/request", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          bankName,
          accountNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Không thể gửi lại OTP");
      }

      setTransactionId(String(data.transactionId ?? ""));
      setCountdown(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      setError("");
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi lại OTP");
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");

    if (!transactionId) {
      setError("Thiếu thông tin giao dịch rút tiền");
      return;
    }

    if (code.length < 6) {
      setError("Vui lòng nhập đủ 6 số mã xác minh");
      return;
    }

    try {
      setIsVerifying(true);
      setError("");

      const res = await fetch("/api/wallet/withdraw/verify", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId,
          otp: code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "OTP không hợp lệ");
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xác minh thất bại");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!transactionId || !amount || !bankName) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_38%)] py-8 md:py-12">
          <div className="container mx-auto max-w-lg px-4">
            <div className="rounded-3xl border border-border/70 bg-card/95 p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-300" />
              </div>
              <h1 className="mb-2 text-xl font-bold text-foreground">
                Không tìm thấy thông tin xác minh
              </h1>
              <p className="mb-6 text-sm text-muted-foreground">
                Bạn hãy quay lại màn rút tiền và tạo yêu cầu OTP mới.
              </p>
              <Button onClick={() => router.push("/tasker/withdraw")}>
                Về màn rút tiền
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_38%)] py-8 md:py-12">
          <div className="container mx-auto max-w-lg px-4">
            <div className="rounded-3xl border border-border/70 bg-card/95 p-6 text-center shadow-sm md:p-8">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-300" />
              </div>

              <h1 className="mb-2 text-2xl font-bold text-foreground">
                Xác nhận rút tiền thành công
              </h1>
              <p className="mb-6 text-sm text-muted-foreground">
                Yêu cầu rút tiền của bạn đã được ghi nhận và đang chờ xử lý.
              </p>

              <div className="mb-6 rounded-2xl border border-border/70 bg-muted/40 p-4 text-left text-sm dark:bg-slate-900/50">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Số tiền</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between gap-4">
                  <span className="text-muted-foreground">Ngân hàng</span>
                  <span className="break-words text-right font-medium text-foreground">
                    {bankName}
                  </span>
                </div>
                <div className="mt-2 flex justify-between gap-4">
                  <span className="text-muted-foreground">Tài khoản nhận</span>
                  <span className="font-medium text-foreground">
                    {maskAccount(accountNumber)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between gap-4">
                  <span className="text-muted-foreground">Thời gian dự kiến</span>
                  <span className="font-medium text-foreground">1-3 ngày làm việc</span>
                </div>
              </div>

              <div className="mb-6 flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-left text-sm text-emerald-800 dark:text-emerald-200">
                <Shield className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Otto đã xác minh OTP thành công. Bạn sẽ nhận được thông báo khi giao
                  dịch hoàn tất.
                </span>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/tasker/withdraw")}
                >
                  Xem lịch sử rút tiền
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => router.push("/tasker/wallet")}
                >
                  Về ví
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_38%)] py-8 md:py-12">
        <div className="container mx-auto max-w-lg px-4">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>

          <div className="rounded-3xl border border-border/70 bg-card/95 p-6 shadow-sm md:p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <Wallet className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
              </div>
              <h1 className="mb-1 text-xl font-bold text-foreground">
                Xác minh rút tiền
              </h1>
              <p className="text-sm text-muted-foreground">
                Nhập mã OTP đã gửi đến email của bạn để hoàn tất yêu cầu rút tiền.
              </p>
            </div>

            <div className="mb-6 rounded-2xl border border-border/70 bg-muted/40 p-4 dark:bg-slate-900/50">
              <div className="mb-2 flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Số tiền rút</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-300">
                  {formatCurrency(amount)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Tài khoản nhận</span>
                <span className="break-words text-right text-sm font-medium text-foreground">
                  {bankName} • {maskAccount(accountNumber)}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-3 flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => handleChange(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`h-12 w-11 rounded-2xl border-2 bg-background text-center text-xl font-bold text-foreground outline-none transition-all sm:h-14 sm:w-12 ${
                      error
                        ? "border-red-500"
                        : digit
                          ? "border-emerald-500"
                          : "border-border focus:border-emerald-500"
                    }`}
                  />
                ))}
              </div>

              {error && <p className="text-center text-sm text-red-600 dark:text-red-300">{error}</p>}
            </div>

            <div className="mb-6 text-center">
              {canResend ? (
                <button
                  onClick={handleResend}
                  className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-300"
                >
                  <RefreshCw size={14} />
                  Gửi lại mã OTP
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Gửi lại mã sau <span className="font-semibold text-foreground">{countdown}s</span>
                </p>
              )}
            </div>

            <Button
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              size="lg"
              onClick={handleVerify}
              disabled={isVerifying || otp.join("").length < 6}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xác minh...
                </>
              ) : (
                `Xác nhận rút ${formatCurrency(amount)}`
              )}
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2">
              <Shield size={14} className="text-emerald-600 dark:text-emerald-300" />
              <p className="text-center text-xs text-muted-foreground">
                Mã OTP có hiệu lực trong 5 phút để bảo vệ ví của bạn.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default function TaskerWithdrawVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Đang tải...
        </div>
      }
    >
      <WithdrawVerifyContent />
    </Suspense>
  );
}
