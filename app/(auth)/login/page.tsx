"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { login } from "@/lib/auth";
import { extractUserFacingErrorFromUnknown } from "@/lib/user-facing-error";
import { FORCED_LOGOUT_MESSAGE_STORAGE_KEY } from "@/components/providers/ForcedLogoutProvider";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    try {
      const forcedLogoutMessage = window.sessionStorage.getItem(
        FORCED_LOGOUT_MESSAGE_STORAGE_KEY,
      );

      if (forcedLogoutMessage) {
        setError(forcedLogoutMessage);
        window.sessionStorage.removeItem(FORCED_LOGOUT_MESSAGE_STORAGE_KEY);
      }
    } catch {
      // ignore session storage errors
    }
  }, []);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login({ email, password });
      const role = res.user?.role;
      const mustChangePassword = Boolean(res.user?.mustChangePassword);

      if (role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (role === "CUSTOMER") {
        router.push("/profile");
      } else if (role === "TASKER") {
        if (mustChangePassword) {
          router.push("/change-password?firstLogin=1");
        } else {
          router.push("/tasker/dashboard");
        }
      }
    } catch (err: unknown) {
      setError(
        extractUserFacingErrorFromUnknown(
          err,
          "Đăng nhập không thành công. Vui lòng thử lại.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link
        href="/"
        className="mb-6 flex items-center text-sm text-muted-foreground"
      >
        ← Về trang chủ
      </Link>

      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero font-bold text-white">
          O
        </div>
        <span className="text-xl font-bold text-foreground">Otto</span>
      </div>

      <h1 className="mb-2 text-3xl font-bold text-foreground">
        Chào mừng trở lại!
      </h1>
      <p className="mb-8 text-muted-foreground">
        Đăng nhập để tiếp tục sử dụng dịch vụ
      </p>

      <form className="space-y-4" onSubmit={handleLogin}>
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
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@example.com"
              className="h-12 pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mật khẩu</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-blue-500 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <div className="group relative">
            <Lock
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary"
            />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="h-12 pl-10 pr-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-hero py-3 font-semibold text-white shadow-md transition disabled:opacity-70"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-medium text-blue-600">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
