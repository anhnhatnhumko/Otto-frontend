"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFirstLogin = searchParams.get("firstLogin") === "1";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin.");
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
      const response = await fetch(`/api/auth/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      let message = "Đổi mật khẩu thành công.";

      if (contentType.includes("application/json")) {
        const payload = await response.json();
        if (!response.ok) {
          const errorMessage = Array.isArray(payload?.message)
            ? payload.message.join(", ")
            : payload?.message;
          throw new Error(errorMessage || "Không thể đổi mật khẩu.");
        }

        if (payload?.message) {
          message = payload.message;
        }
      } else if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Không thể đổi mật khẩu.");
      }

      setSuccess(message);

      setTimeout(() => {
        router.push("/tasker/dashboard");
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đổi mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">Đổi mật khẩu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isFirstLogin
            ? "Đây là lần đăng nhập đầu tiên. Bạn cần đổi mật khẩu trước khi vào hệ thống."
            : "Cập nhật mật khẩu để bảo mật tài khoản."}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Nhập mật khẩu hiện tại"
          />
        </div>

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

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Đang cập nhật..." : "Đổi mật khẩu"}
          </Button>
          <Link href="/login" className="text-sm text-muted-foreground underline">
            Về đăng nhập
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md py-8">Đang tải...</div>}>
      <ChangePasswordForm />
    </Suspense>
  );
}
