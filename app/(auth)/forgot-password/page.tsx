"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setError("");
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Không thể gửi email đặt lại mật khẩu");
        setIsLoading(false);
        return;
      }

      setIsSubmitted(true);
    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Back */}
      <Link href="/login" className="text-sm text-muted-foreground flex items-center mb-6">
        ← Quay lại đăng nhập
      </Link>

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="h-9 w-9 rounded-lg bg-gradient-hero text-white flex items-center justify-center font-bold">
          O
        </div>
        <span className="text-xl font-bold text-foreground">Otto</span>
      </div>

      {!isSubmitted ? (
        <>
          {/* Title */}
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Quên mật khẩu?
          </h1>
          <p className="text-muted-foreground mb-8">
            Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ERROR */}
            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-primary"
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  className="h-12 pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-gradient-hero py-3 font-semibold text-white shadow-md transition disabled:opacity-70"
            >
              {isLoading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
            </button>
          </form>
        </>
      ) : (
        /* Success State */
        <div className="text-center py-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Kiểm tra email của bạn
          </h1>
          <p className="text-muted-foreground mb-6">
            Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => window.open("https://mail.google.com", "_blank")}
              className="w-full rounded-xl bg-gradient-hero py-3 font-semibold text-white shadow-md transition"
            >
              Mở ứng dụng email
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setEmail("");
              }}
              className="w-full rounded-xl border border-border py-3 font-medium"
            >
              Gửi lại email
            </button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Không nhận được email?{" "}
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setEmail("");
              }}
              className="text-blue-600 hover:underline"
            >
              Thử lại với email khác
            </button>
          </p>
        </div>
      )}

      {/* Help text */}
      {!isSubmitted && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Nhớ mật khẩu?{" "}
          <Link href="/login" className="text-blue-600 font-medium">
            Đăng nhập ngay
          </Link>
        </p>
      )}
    </div>
  );
}
