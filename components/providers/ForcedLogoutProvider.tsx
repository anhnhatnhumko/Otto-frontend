"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserStore } from "@/app/store/useUserStore";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { extractUserFacingErrorMessage } from "@/lib/user-facing-error";

type AuthUser = {
  _id?: string;
  id?: string;
  fullName?: string;
  email?: string;
  role?: string;
  avatar?: string;
  status?: string;
};

type StoreUser = {
  _id: string;
  fullName: string;
  email: string;
  role?: string;
  avatar?: string;
};

type ForceLogoutPayload = {
  reason?: string;
  message?: string;
};

export const FORCED_LOGOUT_MESSAGE_STORAGE_KEY =
  "otto-forced-logout-message";

const DEFAULT_FORCED_LOGOUT_MESSAGE =
  "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.";

function normalizeStoreUser(user: AuthUser): StoreUser | null {
  const userId = String(user._id ?? user.id ?? "").trim();

  if (!userId) {
    return null;
  }

  return {
    _id: userId,
    fullName: String(user.fullName ?? "").trim(),
    email: String(user.email ?? "").trim(),
    role: user.role,
    avatar: user.avatar,
  };
}

export default function ForcedLogoutProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useUserStore((state) => state.user) as AuthUser | null;
  const setUser = useUserStore((state) => state.setUser);
  const [resolvedUser, setResolvedUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const isHandlingForceLogoutRef = useRef(false);

  const storeUserId = String(user?._id ?? user?.id ?? "").trim();
  const resolvedUserId = String(
    resolvedUser?._id ?? resolvedUser?.id ?? "",
  ).trim();

  const activeUser = useMemo<AuthUser | null>(
    () => user ?? resolvedUser,
    [resolvedUser, user],
  );
  const userId = useMemo(
    () => String(activeUser?._id ?? activeUser?.id ?? "").trim(),
    [activeUser],
  );
  const role = useMemo(
    () => String(activeUser?.role ?? "").trim().toUpperCase(),
    [activeUser],
  );

  const performForcedLogoutRef = useRef(
    async (payload?: ForceLogoutPayload | { message?: string } | null) => {
      if (isHandlingForceLogoutRef.current) {
        return;
      }

      isHandlingForceLogoutRef.current = true;

      const message =
        extractUserFacingErrorMessage(
          payload,
          DEFAULT_FORCED_LOGOUT_MESSAGE,
        ) || DEFAULT_FORCED_LOGOUT_MESSAGE;

      try {
        window.sessionStorage.setItem(
          FORCED_LOGOUT_MESSAGE_STORAGE_KEY,
          message,
        );
      } catch {
        // ignore storage errors
      }

      disconnectSocket();

      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch {
        // the cookie may already be invalid
      }

      setResolvedUser(null);
      setUser(null);

      const target = "/login?forcedLogout=1";
      if (pathname !== target) {
        router.replace(target);
      }
    },
  );

  useEffect(() => {
    if (!storeUserId) {
      setResolvedUser(null);
    }
  }, [storeUserId]);

  useEffect(() => {
    let cancelled = false;

    const hydrateUser = async () => {
      if (storeUserId || resolvedUserId) {
        setHydrated(true);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) {
            setResolvedUser(null);
          }
          return;
        }

        const data = (await res.json()) as AuthUser;
        if (cancelled) {
          return;
        }

        setResolvedUser(data);
        const normalizedUser = normalizeStoreUser(data);
        if (normalizedUser) {
          setUser((prev) => prev ?? normalizedUser);
        }
      } catch {
        if (!cancelled) {
          setResolvedUser(null);
        }
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    };

    void hydrateUser();

    return () => {
      cancelled = true;
    };
  }, [resolvedUserId, setUser, storeUserId]);

  useEffect(() => {
    if (!hydrated || !userId || !role) {
      return;
    }

    const socket = connectSocket(userId, role);
    if (!socket) {
      return;
    }

    const handleForceLogout = async (payload: ForceLogoutPayload) => {
      await performForcedLogoutRef.current(payload);
    };

    socket.on("auth:force-logout", handleForceLogout);

    return () => {
      socket.off("auth:force-logout", handleForceLogout);
    };
  }, [hydrated, role, userId]);

  useEffect(() => {
    if (!hydrated || !userId || pathname.startsWith("/login")) {
      return;
    }

    let cancelled = false;

    const verifySession = async () => {
      if (cancelled || isHandlingForceLogoutRef.current) {
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (cancelled || isHandlingForceLogoutRef.current) {
          return;
        }

        if (!res.ok) {
          await performForcedLogoutRef.current({
            message: DEFAULT_FORCED_LOGOUT_MESSAGE,
          });
          return;
        }

        const data = (await res.json()) as AuthUser;
        if (
          String(data?.status ?? "").trim().toUpperCase() === "BLOCKED"
        ) {
          await performForcedLogoutRef.current({
            message: DEFAULT_FORCED_LOGOUT_MESSAGE,
          });
        }
      } catch {
        return;
      }
    };

    const interval = window.setInterval(() => {
      void verifySession();
    }, 5000);

    const handleWindowFocus = () => {
      void verifySession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void verifySession();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    void verifySession();

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hydrated, pathname, userId]);

  return <>{children}</>;
}
