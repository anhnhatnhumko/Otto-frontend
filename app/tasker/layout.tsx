"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TaskerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const guardTaskerAccess = async () => {
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

        if (user?.role !== "TASKER") {
          router.replace("/login");
          return;
        }

        if (user?.mustChangePassword) {
          router.replace("/change-password?firstLogin=1");
          return;
        }
      } catch {
        router.replace("/login");
        return;
      } finally {
        setChecking(false);
      }
    };

    guardTaskerAccess();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  return <>{children}</>;
}
