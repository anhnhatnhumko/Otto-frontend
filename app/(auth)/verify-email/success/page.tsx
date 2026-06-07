"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailSuccess() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown !== 0) return;
    router.push("/login");
  }, [countdown, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-foreground text-center">
        🎉 Xác thực email thành công!
      </h1>
      <p className="mt-2 text-muted-foreground text-center">
        Bạn có thể đăng nhập và sử dụng dịch vụ của chúng tôi.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Tự động chuyển đến đăng nhập sau <span className="font-semibold text-primary">{countdown}s</span>...
      </p>
      <Link
        href="/login"
        className="mt-5 inline-flex rounded-xl bg-gradient-hero px-5 py-2.5 text-white font-semibold"
      >
        Đăng nhập ngay
      </Link>
    </div>
  );
}
