"use client";

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const SESSION_REVALIDATE_INTERVAL_MS = 15000;

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

const DEFAULT_FORCED_LOGOUT_MESSAGE =
  "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.";

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
  const isCheckingSessionRef = useRef(false);
  const storeUserId = String(user?._id ?? user?.id ?? "").trim();
  const resolvedUserId = String(resolvedUser?._id ?? resolvedUser?.id ?? "").trim();

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

  const performForcedLogout = useCallback(
    async (payload?: ForceLogoutPayload | unknown) => {
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
        // ignore logout failures here because the cookie may already be invalid
      }

      setResolvedUser(null);
      setUser(null);

      const target = "/login?forcedLogout=1";
      if (pathname !== target) {
        router.replace(target);
      }
    },
    [pathname, router, setUser],
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

    socket.on("auth:force-logout", performForcedLogout);

    return () => {
      socket.off("auth:force-logout", performForcedLogout);
    };
  }, [hydrated, performForcedLogout, role, userId]);

  const verifyActiveSession = useCallback(async () => {
    if (!userId || isHandlingForceLogoutRef.current || isCheckingSessionRef.current) {
      return;
    }

    isCheckingSessionRef.current = true;

    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (res.ok) {
        return;
      }

      let payload: unknown = null;

      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (res.status === 401 || res.status === 403) {
        await performForcedLogout(payload);
      }
    } catch {
      // Keep the current session during transient network failures.
    } finally {
      isCheckingSessionRef.current = false;
    }
  }, [performForcedLogout, userId]);

  useEffect(() => {
    if (!hydrated || !userId || !role) {
      return;
    }

    const validateIfVisible = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void verifyActiveSession();
    };

    void verifyActiveSession();

    if (typeof window === "undefined") {
      return;
    }

    const interval = window.setInterval(
      validateIfVisible,
      SESSION_REVALIDATE_INTERVAL_MS,
    );

    window.addEventListener("focus", validateIfVisible);
    document.addEventListener("visibilitychange", validateIfVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", validateIfVisible);
      document.removeEventListener("visibilitychange", validateIfVisible);
    };
  }, [hydrated, role, userId, verifyActiveSession]);

  return <>{children}</>;
}
