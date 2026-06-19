"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  isExpiredOtpMessage,
  isInvalidOtpMessage,
  normalizeOtpErrorMessage,
} from "@/lib/otp-feedback";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Shield,
  Wallet,
} from "lucide-react";

const WALLET_BALANCE = 950000;

type WalletVerifyOrder = {
  serviceSnapshot?: {
    name?: string;
  };
};

const EMPTY_OTP = ["", "", "", "", "", ""];

function WalletVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const orderId = searchParams.get("orderId") || "";
  const initialTransactionId = searchParams.get("transactionId") || "";
  const totalAmount = Number(searchParams.get("amount") || 0);

  const [transactionId, setTransactionId] = useState(initialTransactionId);
  const [order, setOrder] = useState<WalletVerifyOrder | null>(null);
  const [otp, setOtp] = useState<string[]>(EMPTY_OTP);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          credentials: "include",
        });

        if (!res.ok) return;

        const data = await res.json();
        setOrder(data);
      } catch {
        // ignore order preview failures here
      }
    };

    void fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = window.setTimeout(() => {
        setCountdown((value) => value - 1);
      }, 1000);

      return () => window.clearTimeout(timer);
    }

    if (countdown === 0) {
      setCanResend(true);
    }
  }, [canResend, countdown]);

  const formatCurrency = (amount: number) =>
    `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;

  const applyOtpErrorState = (message: string) => {
    setError(message);

    if (isInvalidOtpMessage(message) || isExpiredOtpMessage(message)) {
      setOtp([...EMPTY_OTP]);
      inputRefs.current[0]?.focus();
    }

    if (isExpiredOtpMessage(message)) {
      setCountdown(0);
      setCanResend(true);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);
    setError("");

    if (value && index < nextOtp.length - 1) {
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

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    const nextOtp = [...EMPTY_OTP];
    for (let index = 0; index < pasted.length; index += 1) {
      nextOtp[index] = pasted[index];
    }

    setOtp(nextOtp);
    setError("");
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleResend = async () => {
    if (!orderId) {
      applyOtpErrorState("Thiếu thông tin đơn hàng để gửi lại OTP");
      return;
    }

    try {
      const res = await fetch(`/api/orders/wallet/create-payment`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Không thể gửi lại OTP");
      }

      const nextTransactionId = String(data?.transactionId ?? "");
      if (!nextTransactionId) {
        throw new Error("Thiếu mã giao dịch OTP mới");
      }

      setTransactionId(nextTransactionId);
      setOtp([...EMPTY_OTP]);
      setError("");
      setCountdown(60);
      setCanResend(false);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      applyOtpErrorState(
        normalizeOtpErrorMessage(err, "Không thể gửi lại OTP"),
      );
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");

    if (!orderId || !transactionId) {
      setError("Thiếu thông tin thanh toán");
      return;
    }

    if (code.length < 6) {
      setError("Vui lòng nhập đủ 6 số mã xác minh");
      return;
    }

    try {
      setIsVerifying(true);
      setError("");

      const res = await fetch(`/api/orders/wallet/verify-payment`, {
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
        throw new Error(data?.message || "OTP không hợp lệ");
      }

      setIsSuccess(true);
      const successParams = new URLSearchParams({
        orderId,
        source: "wallet",
        amount: String(totalAmount),
      });
      router.replace(`/payment/success?${successParams.toString()}`);
    } catch (err: unknown) {
      applyOtpErrorState(
        normalizeOtpErrorMessage(err, "Xác minh thất bại"),
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const walletAfterPayment = useMemo(
    () => Math.max(WALLET_BALANCE - totalAmount, 0),
    [totalAmount],
  );

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-12">
          <div className="container max-w-lg">
            <div className="rounded-2xl bg-card p-8 text-center shadow-card">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-foreground">
                Thanh toán thành công
              </h1>
              <p className="mb-6 text-muted-foreground">
                Đã trừ {formatCurrency(totalAmount)} từ Ví Otto của bạn.
              </p>

              <div className="mb-6 space-y-2 rounded-xl bg-muted p-4 text-left text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Dịch vụ</span>
                  <span className="font-medium text-foreground">
                    {order?.serviceSnapshot?.name || "Dịch vụ"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Số tiền</span>
                  <span className="font-medium text-primary">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Số dư còn lại</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(walletAfterPayment)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="hero-outline"
                  className="flex-1"
                  onClick={() => router.push(`/orders/${orderId}`)}
                >
                  Theo dõi đơn hàng
                </Button>
                <Button
                  variant="hero"
                  className="flex-1"
                  onClick={() => router.push("/")}
                >
                  Về trang chủ
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
      <main className="py-8 md:py-12">
        <div className="container max-w-lg">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>

          <div className="rounded-2xl bg-card p-6 shadow-card md:p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <h1 className="mb-1 text-xl font-bold text-foreground">
                Xác minh thanh toán
              </h1>
              <p className="text-sm text-muted-foreground">
                Nhập mã OTP đã gửi đến email của bạn để hoàn tất thanh toán.
              </p>
            </div>

            <div className="mb-6 rounded-xl bg-muted p-4">
              <div className="mb-2 flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Số tiền thanh toán
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Số dư ví hiện tại
                </span>
                <span className="text-sm font-medium text-foreground">
                  {formatCurrency(WALLET_BALANCE)}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-3 flex justify-center gap-2 md:gap-3">
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
                    className={`h-13 w-11 rounded-xl border-2 bg-background text-center text-xl font-bold text-foreground outline-none transition-all md:h-14 md:w-12 ${
                      error
                        ? "border-destructive"
                        : digit
                          ? "border-primary"
                          : "border-border focus:border-primary"
                    }`}
                  />
                ))}
              </div>

              {error ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-center text-sm text-destructive">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="mb-6 text-center">
              {canResend ? (
                <button
                  onClick={handleResend}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <RefreshCw size={14} />
                  Gửi lại mã OTP
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Gửi lại mã sau{" "}
                  <span className="font-semibold text-foreground">
                    {countdown}s
                  </span>
                </p>
              )}
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleVerify}
              disabled={isVerifying || otp.join("").length < 6}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xác minh...
                </>
              ) : (
                `Xác nhận thanh toán ${formatCurrency(totalAmount)}`
              )}
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2">
              <Shield size={14} className="text-green-600" />
              <p className="text-xs text-muted-foreground">
                Mã OTP có hiệu lực trong 5 phút để bảo vệ giao dịch của bạn.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function WalletVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Đang tải...
        </div>
      }
    >
      <WalletVerifyContent />
    </Suspense>
  );
}
