"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import GlobalNotificationPopup from "@/components/customer/GlobalNotificationPopup";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "CUSTOMER") {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) return null;

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