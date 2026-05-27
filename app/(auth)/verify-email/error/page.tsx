"use client";

import { useState } from "react";
import Link from "next/link";
import { XCircle, RefreshCw, Mail, Home, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const VerifyEmailError = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">(
    ""
  );

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage("Vui lòng nhập email");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const res = await fetch(`/api/auth/resend-verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data?.message || "Không thể gửi lại email xác thực");
        setMessageType("error");
        return;
      }

      setMessage("✅ Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.");
      setMessageType("success");
      setEmail("");
    } catch (err) {
      setMessage("Lỗi kết nối máy chủ. Vui lòng thử lại.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 ">
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6 animate-fade-up">
          {/* Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Xác minh thất bại
            </h1>
            <p className="text-muted-foreground text-base">
              Liên kết xác minh email không hợp lệ hoặc đã hết hạn. Vui lòng thử
              lại.
            </p>
          </div>

          {/* Reasons */}
          <div className="rounded-xl border border-border bg-card p-4 text-left space-y-3">
            <p className="text-sm font-medium text-foreground">
              Nguyên nhân có thể:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                Liên kết xác minh đã hết hạn (thường sau 24 giờ)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                Liên kết đã được sử dụng trước đó
              </li>
            </ul>
          </div>

          {/* Actions */}
          <form onSubmit={handleResendEmail} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">
                Email đăng ký của bạn
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={loading}
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2"
              size="lg"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Gửi lại email xác thực
                </>
              )}
            </Button>

            {message && (
              <div
                className={`rounded-lg p-3 text-sm flex items-start gap-2 ${
                  messageType === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {messageType === "success" ? (
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                )}
                <span>{message}</span>
              </div>
            )}
          </form>

          <div className="border-t border-border pt-4">
            <Link href="/">
              <Button variant="outline" className="w-full gap-2" size="lg">
                <Home className="h-4 w-4" />
                Về trang chủ
              </Button>
            </Link>
          </div>

          {/* Support */}
          <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Cần hỗ trợ?</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Liên hệ{" "}
              <span className="font-medium text-foreground">
                support@ottohome.online
              </span>{" "}
              hoặc hotline{" "}
              <span className="font-medium text-foreground">1900 1234</span>
            </p>
          </div>
        </div>
      </main> 
    </div>
  );
};

export default VerifyEmailError;
