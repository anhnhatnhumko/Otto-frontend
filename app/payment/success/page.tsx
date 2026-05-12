"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { requireApiUrl } from "@/lib/api-url";

const API_URL = requireApiUrl();
const CONFIRMED_STATUSES = new Set(["PAID", "SEARCHING"]);
const REDIRECT_SECONDS = 8;

type PaymentOrder = {
  _id?: string;
  status?: string;
  totalPrice?: number;
  serviceSnapshot?: {
    name?: string;
  };
};

const PaymentSuccessContent = () => {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const source = params.get("source");
  const amount = Number(params.get("amount") || 0);
  const isWalletPayment = source === "wallet";

  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  const getOrderStatusLabel = (status?: string) => {
    switch (String(status || "").toUpperCase()) {
      case "PENDING_PAYMENT":
        return "Chờ thanh toán";
      case "PAID":
        return "Đã thanh toán";
      case "SEARCHING":
        return "Đang tìm người làm";
      case "ASSIGNED":
        return "Đã có người nhận";
      case "IN_PROGRESS":
        return "Đang thực hiện";
      case "WAITING_CONFIRMATION":
        return "Chờ xác nhận hoàn thành";
      case "COMPLETED":
        return "Hoàn thành";
      case "TIMEOUT":
        return "Đơn quá hạn";
      case "CANCELLED":
      case "AUTO_CANCELLED":
        return "Đã hủy";
      default:
        return "Đang cập nhật";
    }
  };

  useEffect(() => {
    if (!orderId) return;

    let interval: ReturnType<typeof setInterval> | undefined;
    let stopPolling: ReturnType<typeof setTimeout> | undefined;
    let isMounted = true;

    setOrder(null);
    setIsConfirmed(isWalletPayment);

    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_URL}/orders/${orderId}`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          // Với luồng redirect từ Stripe, backend đã confirm thanh toán trước khi redirect.
          // Nếu request detail bị chặn tạm thời (401/403/404), vẫn cho phép hiển thị success.
          if ([401, 403, 404].includes(res.status)) {
            if (!isMounted) return;

            setIsConfirmed(true);

            if (interval) {
              clearInterval(interval);
              interval = undefined;
            }

            return;
          }

          const errorText = await res.text().catch(() => "");
          throw new Error(
            `Fetch order failed (${res.status})${
              errorText ? `: ${errorText}` : ""
            }`,
          );
        }

        const data: PaymentOrder = await res.json();
        if (!isMounted) return;

        setOrder(data);

        if (isWalletPayment || CONFIRMED_STATUSES.has(data.status || "")) {
          setIsConfirmed(true);

          if (interval) {
            clearInterval(interval);
            interval = undefined;
          }
        }
      } catch (err) {
        if (!isMounted) return;

        console.warn("Fetch order warning:", err);
      }
    };

    fetchOrder();

    if (!isWalletPayment) {
      interval = setInterval(fetchOrder, 3000);
      stopPolling = setTimeout(() => {
        if (interval) {
          clearInterval(interval);
          interval = undefined;
        }
      }, 10000);
    }

    return () => {
      isMounted = false;

      if (interval) {
        clearInterval(interval);
      }

      if (stopPolling) {
        clearTimeout(stopPolling);
      }
    };
  }, [orderId, isWalletPayment]);

  useEffect(() => {
    if (!orderId || !isConfirmed) return;

    setSecondsLeft(REDIRECT_SECONDS);

    const countdown = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(countdown);
  }, [isConfirmed, orderId]);

  useEffect(() => {
    if (secondsLeft <= 0 && orderId && isConfirmed) {
      router.replace(`/orders/${orderId}`);
    }
  }, [secondsLeft, orderId, isConfirmed, router]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN").format(value) + "đ";

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Thiếu thông tin đơn hàng.</p>
      </div>
    );
  }

  if (!isConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Đang xử lý thanh toán, vui lòng đợi...</p>
      </div>
    );
  }

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
              Thanh toán đã thành công. Hệ thống sẽ tự chuyển sang trang theo dõi
              đơn hàng trong {secondsLeft} giây để bạn xem tiến trình tìm người làm.
            </p>

            <div className="bg-muted rounded-xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-foreground mb-3">
                Chi tiết đơn hàng
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã đơn</span>
                  <span className="font-medium">{order?._id || orderId}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dịch vụ</span>
                  <span className="font-medium">
                    {order?.serviceSnapshot?.name || "Đang cập nhật"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tổng tiền</span>
                  <span className="font-medium text-primary">
                    {formatCurrency(order?.totalPrice || amount)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trạng thái đơn</span>
                  <span className="font-medium text-green-600">
                    {isWalletPayment
                      ? "Nạp ví thành công"
                      : getOrderStatusLabel(order?.status)}
                  </span>
                </div>

                {!isWalletPayment && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tiếp theo</span>
                    <span className="font-medium">
                      Theo dõi quá trình tìm người làm
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={`/orders/${orderId}`} className="flex-1">
                <Button variant="hero-outline" className="w-full">
                  Xem theo dõi ngay
                </Button>
              </Link>

              <Link href="/" className="flex-1">
                <Button variant="hero" className="w-full">
                  Về trang chủ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
