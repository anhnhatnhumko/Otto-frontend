"use client";

import { useEffect, useMemo, useState } from "react";
import { useUserStore } from "@/app/store/useUserStore";
import useActiveChatStore from "@/hooks/useActiveChat";
import useUnreadMessagesStore from "@/hooks/useUnreadMessages";
import { buildOptimisticChatNotification } from "@/lib/realtime-notification";
import { connectSocket } from "@/lib/socket";

const SUPPORTED_ROLES = new Set(["CUSTOMER", "TASKER"]);

export default function RealtimeChatBridge() {
  const storeUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [socketIdentity, setSocketIdentity] = useState<{
    userId: string;
    role: string;
  } | null>(null);

  const storeUserId = useMemo(
    () => String(storeUser?._id ?? "").trim(),
    [storeUser],
  );
  const storeUserRole = useMemo(
    () => String(storeUser?.role ?? "").trim().toUpperCase(),
    [storeUser],
  );

  useEffect(() => {
    if (storeUserId && SUPPORTED_ROLES.has(storeUserRole)) {
      setSocketIdentity({
        userId: storeUserId,
        role: storeUserRole,
      });
      return;
    }

    let cancelled = false;

    const bootstrapIdentity = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) {
            setSocketIdentity(null);
          }
          return;
        }

        const user = await res.json();
        const userId = String(user?._id ?? user?.id ?? "").trim();
        const role = String(user?.role ?? "").trim().toUpperCase();

        if (!cancelled && userId && SUPPORTED_ROLES.has(role)) {
          setSocketIdentity({ userId, role });
          setUser(user);
        }
      } catch {
        if (!cancelled) {
          setSocketIdentity(null);
        }
      }
    };

    void bootstrapIdentity();

    return () => {
      cancelled = true;
    };
  }, [setUser, storeUserId, storeUserRole]);

  useEffect(() => {
    if (!socketIdentity?.userId || !SUPPORTED_ROLES.has(socketIdentity.role)) {
      return;
    }

    const socket = connectSocket(socketIdentity.userId, socketIdentity.role);
    if (!socket) {
      return;
    }

    const handleChatMessage = (payload: unknown) => {
      const optimistic = buildOptimisticChatNotification(
        payload,
        socketIdentity.userId,
        socketIdentity.role,
      );

      if (!optimistic?.orderId) {
        return;
      }

      if (useActiveChatStore.getState().isActiveOrder(optimistic.orderId)) {
        useUnreadMessagesStore.getState().clearUnread(optimistic.orderId);
        return;
      }

      useUnreadMessagesStore
        .getState()
        .incrementUnread(optimistic.orderId, 1);
    };

    socket.on("chat:message", handleChatMessage);

    return () => {
      socket.off("chat:message", handleChatMessage);
    };
  }, [socketIdentity]);

  return null;
}
