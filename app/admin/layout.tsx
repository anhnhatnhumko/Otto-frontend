"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const previousClassName = root.className;
    const previousColorScheme = root.style.colorScheme;

    root.classList.remove("dark");
    root.classList.add("light");
    root.style.colorScheme = "light";

    return () => {
      root.className = previousClassName;
      root.style.colorScheme = previousColorScheme;
    };
  }, []);

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

    void guardAdminAccess();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        {"\u0110ang ki\u1ec3m tra quy\u1ec1n truy c\u1eadp qu\u1ea3n tr\u1ecb vi\u00ean..."}
      </div>
    );
  }

  return <>{children}</>;
}
