"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Home, Loader2 } from "lucide-react";

import Header from "@/components/Header";
import { Button } from "@/components/ui/button";

type WalletTransaction = {
  _id: string;
  amount: number;
  status?: string;
};

const formatVND = (amount: number) =>
  `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string" &&
    payload.message.trim()
  ) {
    return payload.message;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    Array.isArray(payload.message) &&
    typeof payload.message[0] === "string"
  ) {
    return payload.message[0];
  }

  return fallback;
};

const DepositSuccess = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transactionId");
  const sessionId = searchParams.get("session_id");

  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const confirmAndLoad = async () => {
      if (!transactionId && !sessionId) {
        setLoading(false);
        setError("Thiếu thông tin giao dịch.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        if (sessionId) {
          const confirmRes = await fetch(
            `/api/payments/stripe/success?session_id=${encodeURIComponent(sessionId)}`,
            {
              credentials: "include",
              cache: "no-store",
            },
          );

          if (!confirmRes.ok) {
            const confirmPayload = await confirmRes.json().catch(() => null);
            throw new Error(
              getErrorMessage(
                confirmPayload,
                "Không thể xác nhận giao dịch nạp tiền.",
              ),
            );
          }
        }

        if (!transactionId) {
          throw new Error("Không tìm thấy mã giao dịch nạp tiền.");
        }

        const transactionRes = await fetch("/api/wallet/transactions", {
          credentials: "include",
          cache: "no-store",
        });

        if (!transactionRes.ok) {
          const transactionPayload = await transactionRes.json().catch(() => null);
          throw new Error(
            getErrorMessage(
              transactionPayload,
              "Không thể tải thông tin giao dịch.",
            ),
          );
        }

        const transactions = (await transactionRes.json()) as WalletTransaction[];
        const currentTransaction = Array.isArray(transactions)
          ? transactions.find((item) => item._id === transactionId)
          : undefined;

        if (!currentTransaction) {
          throw new Error("Không tìm thấy giao dịch vừa nạp.");
        }

        if (!cancelled) {
          setAmount(currentTransaction.amount || 0);
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("otto-wallet-updated"));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể hoàn tất giao dịch nạp tiền.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void confirmAndLoad();

    return () => {
      cancelled = true;
    };
  }, [sessionId, transactionId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="bg-navy text-color-inverted min-h-[60px]">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push("/deposit")}
            className="w-10 h-10 rounded-xl bg-navy-light flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Kết quả giao dịch</h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            {loading ? (
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            ) : (
              <CheckCircle2 className="w-10 h-10 text-primary" />
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              {loading ? "Đang xác nhận nạp tiền..." : "Nạp tiền thành công!"}
            </h2>
            <p className="text-muted-foreground">
              {loading
                ? "Otto đang đối chiếu kết quả thanh toán với Stripe và cập nhật ví của bạn."
                : "Số dư ví đã được cập nhật theo giao dịch vừa hoàn tất."}
            </p>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-left">
              <p className="font-semibold text-red-600">Không thể hoàn tất nạp tiền</p>
              <p className="text-sm text-red-500 mt-1">{error}</p>
            </div>
          ) : null}

          {!loading && !error && amount > 0 ? (
            <div className="bg-card rounded-2xl border p-5 space-y-3 text-left">
              <div className="flex justify-between text-sm gap-3">
                <span className="text-muted-foreground">Số tiền nạp</span>
                <span className="font-semibold">{formatVND(amount)}</span>
              </div>
              <div className="flex justify-between text-sm gap-3">
                <span className="text-muted-foreground">Trạng thái</span>
                <span className="font-semibold text-primary">Thành công</span>
              </div>
            </div>
          ) : null}

          <div className="space-y-3 pt-2">
            <Button
              className="w-full h-14"
              onClick={() => router.push("/profile?tab=overview")}
            >
              Xem số dư ví
            </Button>

            <Button
              variant="outline"
              className="w-full h-14"
              onClick={() => router.push("/")}
            >
              <Home className="w-5 h-5 mr-2" />
              Về trang chủ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositSuccess;
