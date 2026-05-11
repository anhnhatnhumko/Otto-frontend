"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { register } from "@/lib/auth";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({ fullName: name, email, phone, password });
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Back */}
      <Link
        href="/login"
        className="text-sm text-gray-500 flex items-center mb-6"
      >
        ← Quay lại đăng nhập
      </Link>

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="h-9 w-9 rounded-lg bg-gradient-hero text-white flex items-center justify-center font-bold">
          O
        </div>
        <span className="text-xl font-bold text-gray-900">Otto</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Tạo tài khoản mới
      </h1>
      <p className="text-gray-500 mb-8">Đăng ký để bắt đầu sử dụng dịch vụ</p>

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
      <p className="mt-8 text-center text-sm text-gray-500">
        Đã có tài khoản?{" "}
        <Link href="/login" className="text-blue-600 font-medium">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
