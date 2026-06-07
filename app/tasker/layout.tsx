"use client";

import GlobalNotificationPopup from "@/components/customer/GlobalNotificationPopup";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TaskerUser = {
  _id?: string;
  id?: string;
  role?: string;
  mustChangePassword?: boolean;
};

export default function TaskerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<TaskerUser | null>(null);

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

        const nextUser = (await response.json()) as TaskerUser;

        if (nextUser?.role !== "TASKER") {
          router.replace("/login");
          return;
        }

        if (nextUser?.mustChangePassword) {
          router.replace("/change-password?firstLogin=1");
          return;
        }

        setUser(nextUser);
      } catch {
        router.replace("/login");
        return;
      } finally {
        setChecking(false);
      }
    };

    void guardTaskerAccess();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  if (!user || user.role !== "TASKER") {
    return null;
  }

  const userId = String(user._id ?? user.id ?? "");
  const userRole = String(user.role ?? "TASKER");

  return (
    <>
      {children}
      <GlobalNotificationPopup userId={userId} role={userRole} />
    </>
  );
}
