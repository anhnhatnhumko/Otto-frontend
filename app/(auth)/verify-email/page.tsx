"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MailWarning, RefreshCw, ShieldCheck } from "lucide-react";

function VerifyEmailPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const resendUrl = useMemo(() => `${API_URL}/auth/resend-verify-email`, [API_URL]);

  const handleResend = async () => {
    if (!email.trim()) {
      setMessage("Vui lòng nhập email để gửi lại link xác thực.");
      return;
    }

    try {
      setSending(true);
      setMessage("");

      const res = await fetch(resendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data?.message || "Không thể gửi lại email xác thực.");
        return;
      }

      setMessage("Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư của bạn.");
    } catch {
      setMessage("Lỗi kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl shadow-xl border-primary/10">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
            <MailWarning className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Bạn cần xác thực email để tiếp tục</CardTitle>
          <CardDescription className="text-base">
            Tài khoản của bạn đã đổi email hoặc chưa được xác thực. Vui lòng kiểm tra hộp thư và bấm vào link xác thực trước khi thao tác tiếp.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-foreground flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium">Sau khi xác thực email thành công</p>
              <p>Bạn sẽ có thể đăng nhập và thao tác bình thường trở lại.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Nhập email của bạn"
              disabled={sending}
            />
          </div>

          {message ? (
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
              {message}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleResend} disabled={sending} className="sm:flex-1">
              {sending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              {sending ? "Đang gửi..." : "Gửi lại email xác thực"}
            </Button>
            <Button variant="outline" asChild className="sm:flex-1">
              <Link href="/login">Quay lại đăng nhập</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Nếu bạn vừa đổi email, hãy kiểm tra cả thư đến và thư rác.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Đang tải...
        </div>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  );
}