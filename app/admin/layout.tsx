"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const guardAdminAccess = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        const user = await response.json();

        if (user?.role !== "ADMIN") {
          router.replace("/login");
          return;
        }
      } catch {
        router.replace("/login");
        return;
      } finally {
        setChecking(false);
      }
    };

    guardAdminAccess();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Đang kiểm tra quyền truy cập quản trị viên...
      </div>
    );
  }

  return <>{children}</>;
}