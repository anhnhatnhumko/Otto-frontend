"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth(); // 👈 phải trả về loading

  useEffect(() => {
    if (loading) return; // ⛔ chưa xong thì không check

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "ADMIN") {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="p-8">Đang kiểm tra quyền truy cập...</div>;
  }

  return <>{children}</>;
}