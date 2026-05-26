"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireApiUrl } from "@/lib/api-url";

const API_URL = requireApiUrl();

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const token = searchParams.get("token") || "";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("Liên kết đặt lại mật khẩu không hợp lệ.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      let message = "Đặt lại mật khẩu thành công.";

      if (contentType.includes("application/json")) {
        const payload = await response.json();

        if (!response.ok) {
          const errorMessage = Array.isArray(payload?.message)
            ? payload.message.join(", ")
            : payload?.message;

          throw new Error(errorMessage || "Không thể đặt lại mật khẩu.");
        }

        if (payload?.message) {
          message = payload.message;
        }
      } else if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Không thể đặt lại mật khẩu.");
      }

      setSuccess(message);
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 py-10 px-4">
      <div>
        <h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nhập mật khẩu mới cho tài khoản của bạn.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="new-password">Mật khẩu mới</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Ít nhất 6 ký tự"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? "Đang cập nhật..." : "Xác nhận mật khẩu mới"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Quay lại{" "}
        <Link href="/login" className="underline">
          đăng nhập
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md space-y-6 py-10 px-4">Đang tải...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
