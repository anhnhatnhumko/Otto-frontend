"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { register } from "@/lib/auth";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(10);

  const router = useRouter();

  useEffect(() => {
    if (!registerSuccess) return;

    const timer = window.setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [registerSuccess]);

  useEffect(() => {
    if (!registerSuccess || redirectCountdown !== 0) return;
    router.push("/login");
  }, [registerSuccess, redirectCountdown, router]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({ fullName: name, email, phone, password });
      setRegisterSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (registerSuccess) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-lg bg-gradient-hero text-white flex items-center justify-center font-bold">
            O
          </div>
          <span className="text-xl font-bold text-foreground">Otto</span>
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <h1 className="text-2xl font-bold text-center mb-2">
            Đăng ký thành công 
          </h1>
          <p className="text-sm text-muted-foreground leading-6">
            Hệ thống đã gửi email xác thực đến <span className="font-semibold">{email}</span>.
            Vui lòng kiểm tra hộp thư (và cả thư rác) để xác thực tài khoản trước khi đăng nhập.
          </p>
          <p className="mt-4 text-sm font-medium text-foreground">
            Tự động chuyển đến trang đăng nhập sau <span className="text-primary">{redirectCountdown}s</span>...
          </p>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full rounded-xl bg-gradient-hero py-3 font-semibold text-white shadow-md transition"
          >
            Đến trang đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back */}
      <Link
        href="/login"
        className="text-sm text-muted-foreground flex items-center mb-6"
      >
        ← Quay lại đăng nhập
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
        Tạo tài khoản mới
      </h1>
      <p className="text-muted-foreground mb-8">Đăng ký để bắt đầu sử dụng dịch vụ</p>

      {/* Form */}
      <form className="space-y-4" onSubmit={handleRegister}>
        {/* NAME */}
        <div className="space-y-2">
          <Label htmlFor="name">Họ và tên</Label>
          <div className="relative">
            <User
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-primary"
            />
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="h-12 pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>

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

        {/* PHONE */}
        <div className="space-y-2">
          <Label htmlFor="phone">Số điện thoại</Label>
          <div className="relative">
            <Phone
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="phone"
              type="tel"
              placeholder="0912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12 pl-10 focus-visible:ring-2 focus-visible:ring-primary"
              required
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>

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
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>
      </form>

      {/* Switch */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href="/login" className="text-blue-600 font-medium">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
