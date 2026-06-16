"use client";

import GlobalNotificationPopup from "@/components/customer/GlobalNotificationPopup";
import { useUserStore } from "@/app/store/useUserStore";

const ALLOWED_NOTIFICATION_ROLES = new Set(["CUSTOMER", "TASKER"]);

export default function GlobalNotificationHost() {
  const user = useUserStore((state) => state.user);

  const userId = String(user?._id ?? "").trim();
  const role = String(user?.role ?? "").trim().toUpperCase();

  if (!userId || !ALLOWED_NOTIFICATION_ROLES.has(role)) {
    return null;
  }

  return <GlobalNotificationPopup userId={userId} role={role} />;
}
