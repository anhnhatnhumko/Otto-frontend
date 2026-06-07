"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login({ email, password });

      console.log("LOGIN OK:", res);

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Back */}
      <Link href="/" className="text-sm text-muted-foreground flex items-center mb-6">
        ← Về trang chủ
      </Link>

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="h-9 w-9 rounded-lg bg-gradient-hero text-white flex items-center justify-center font-bold">
          O
        </div>
        <span className="text-xl font-bold text-foreground">Otto</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-foreground mb-2">
        Chào mừng trở lại!
      </h1>
      <p className="text-muted-foreground mb-8">
        Đăng nhập để tiếp tục sử dụng dịch vụ
      </p>

      {/* Form */}
      <form className="space-y-4" onSubmit={handleLogin}>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="h-12 pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* PASSWORD */}
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

          <div className="relative group">
            <Lock
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary"
            />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        {/* ERROR */}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-hero py-3 font-semibold text-white shadow-md transition disabled:opacity-70"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4 text-sm text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        Hoặc
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Social */}
      <div className="grid grid-cols-2 gap-4">
        <button className="rounded-xl border border-border py-3 font-medium">
          Google
        </button>
        <button className="rounded-xl border border-border py-3 font-medium">
          Facebook
        </button>
      </div>

      {/* Switch */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="text-blue-600 font-medium">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
