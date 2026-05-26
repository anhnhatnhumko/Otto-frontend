"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlobalNotificationPopup from "@/components/customer/GlobalNotificationPopup";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const guardCustomerAccess = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        const userData = await response.json();

        if (userData?.role !== "CUSTOMER") {
          router.replace("/login");
          return;
        }

        setUser(userData);
      } catch {
        router.replace("/login");
        return;
      } finally {
        setChecking(false);
      }
    };

    guardCustomerAccess();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Đang kiểm tra quyền truy cập khách hàng...
      </div>
    );
  }

  if (!user || user.role !== "CUSTOMER") return null;

  const userId = String(user?._id ?? user?.id ?? "");
  const userRole = String(user?.role ?? "CUSTOMER");

  return (
    <>
      {children}
      <GlobalNotificationPopup userId={userId} role={userRole} />
    </>
  );
}