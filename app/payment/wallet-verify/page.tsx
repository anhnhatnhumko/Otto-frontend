"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Shield,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

const WALLET_BALANCE = 950000;

type WalletVerifyOrder = {
  serviceSnapshot?: {
    name?: string;
  };
};

const WalletVerifyContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTransactionId = searchParams.get("transactionId") || "";
  const orderId = searchParams.get("orderId");
  const totalAmount = Number(searchParams.get("amount") || 0);
  const [transactionId, setTransactionId] = useState(initialTransactionId);
  const [order, setOrder] = useState<WalletVerifyOrder | null>(null);

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      const res = await fetch(`/api/orders/${orderId}`, {
        credentials: "include",
      });

      const data = await res.json();
      setOrder(data);
    };

    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN").format(amount) + "đ";

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleResend = async () => {
    try {
      const res = await fetch(`/api/orders/wallet/create-payment`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "KhÃ´ng thá»ƒ gá»­i láº¡i OTP");
      }

      const nextTransactionId = String(data?.transactionId ?? "");
      if (!nextTransactionId) {
        throw new Error("Thiáº¿u mÃ£ giao dá»‹ch OTP má»›i");
      }

      setTransactionId(nextTransactionId);
      setCountdown(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      setError("");
    } catch {
      setError("Không thể gửi lại OTP");
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
        throw new Error(data.message || "OTP không hợp lệ");
      }

      // ✅ SUCCESS REAL
      setIsSuccess(true);
      const successParams = new URLSearchParams({
        orderId,
        source: "wallet",
        amount: String(totalAmount),
      });
      router.replace(`/payment/success?${successParams.toString()}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Xác minh thất bại");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-12">
          <div className="container max-w-lg">
            <div className="bg-card rounded-2xl shadow-card p-8 text-center animate-fade-up">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Thanh toán thành công!
              </h1>
              <p className="text-muted-foreground mb-6">
                Đã trừ {formatCurrency(totalAmount)} từ Ví Otto của bạn
              </p>

              <div className="bg-muted rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dịch vụ</span>
                  <span className="font-medium text-foreground">
                    {order?.serviceSnapshot?.name || "Dịch vụ"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số tiền</span>
                  <span className="font-medium text-primary">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phương thức</span>
                  <span className="font-medium text-foreground">Ví Otto</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số dư còn lại</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(WALLET_BALANCE - totalAmount)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="hero-outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => router.push(`/orders/${orderId}`)}
                >
                  Theo dõi đơn hàng
                </Button>
                <Button
                  variant="hero"
                  size="lg"
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
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>

          <div className="bg-card rounded-2xl shadow-card p-6 md:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-1">
                Xác minh thanh toán
              </h1>
              <p className="text-sm text-muted-foreground">
                Nhập mã OTP đã gửi đến email của bạn
              </p>
            </div>

            {/* Transaction Info */}
            <div className="bg-muted rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  Số tiền thanh toán
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Số dư ví hiện tại
                </span>
                <span className="text-sm font-medium text-foreground">
                  {formatCurrency(WALLET_BALANCE)}
                </span>
              </div>
            </div>

            {/* OTP Input */}
            <div className="mb-6">
              <div className="flex justify-center gap-2 md:gap-3 mb-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`w-11 h-13 md:w-12 md:h-14 text-center text-xl font-bold rounded-xl border-2 bg-background text-foreground outline-none transition-all ${
                      error
                        ? "border-destructive"
                        : digit
                          ? "border-primary"
                          : "border-border focus:border-primary"
                    }`}
                  />
                ))}
              </div>
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
            </div>

            {/* Resend */}
            <div className="text-center mb-6">
              {canResend ? (
                <button
                  onClick={handleResend}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
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

            {/* Verify Button */}
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

            {/* Security */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <Shield size={14} className="text-green-600" />
              <p className="text-xs text-muted-foreground">
                Giao dịch được bảo mật bởi mã hóa SSL 256-bit
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default function WalletVerify() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <WalletVerifyContent />
    </Suspense>
  );
}
