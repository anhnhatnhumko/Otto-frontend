"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import BottomNav from "./BottomNav";

type TabId = "overview" | "orders" | "book" | "promotions" | "profile";

const BottomNavWrapper = () => {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  // Routes where bottom nav should be hidden (mobile full-screen pages)
  const hideOnPrefixes = [
    "/login",
    "/signup",
    "/auth",
    "/verify-email",
    "/payment",
    "/checkout",
    "/reset-password",
  ];

  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam && ["overview", "orders", "book", "promotions", "profile"].includes(tabParam)) {
      setActiveTab(tabParam as TabId);
      return;
    }

    // Basic pathname mapping
    if (pathname === "/" || pathname === "") return setActiveTab("overview");
    if (pathname.startsWith("/book-service")) return setActiveTab("book");
    if (pathname.startsWith("/tasker") || pathname.includes("/tasker/")) return setActiveTab("overview");
    if (pathname.startsWith("/profile") || pathname.includes("/profile")) return setActiveTab("profile");
    if (pathname.startsWith("/orders") || pathname.includes("/orders/")) return setActiveTab("orders");

    // fallback
    setActiveTab("overview");
  }, [pathname, searchParams]);

  // If current pathname matches any hide prefix, do not render BottomNav
  const shouldHide = hideOnPrefixes.some((p) => pathname.startsWith(p));
  if (shouldHide) return null;

  // Track last visited order id so we can offer a quick 'back to order' action
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  useEffect(() => {
    const match = pathname.match(/^\/orders\/([^\/\?]+)/);
    if (match && match[1]) {
      try {
        sessionStorage.setItem("lastOrderId", match[1]);
      } catch {}
      setLastOrderId(match[1]);
      return;
    }

    try {
      const stored = sessionStorage.getItem("lastOrderId");
      setLastOrderId(stored);
    } catch {
      setLastOrderId(null);
    }
  }, [pathname]);

  const handleTabChange = (tab: string) => {
    // coerce to known tab values
    const known: TabId[] = ["overview", "orders", "book", "promotions", "profile"];
    const t = (known.includes(tab as TabId) ? (tab as TabId) : "overview");
    setActiveTab(t);

    switch (t) {
      case "overview":
        router.push("/");
        break;
      case "book":
        router.push("/book-service");
        break;
      case "orders":
        router.push("/profile?tab=orders");
        break;
      case "promotions":
        router.push("/profile?tab=promotions");
        break;
      case "profile":
        router.push("/profile?tab=profile");
        break;
    }
  };

  return (
    <>
      {/* Quick back-to-order FAB (mobile only) */}
      {lastOrderId && !pathname.startsWith("/orders/") && (
        <div className="fixed right-4 bottom-20 z-50 md:hidden">
          <button
            onClick={() => router.push(`/orders/${lastOrderId}`)}
            className="bg-primary text-white rounded-full p-3 shadow-lg"
            aria-label="Quay lại đơn hàng gần nhất"
          >
            Đơn
          </button>
        </div>
      )}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </>
  );
};

export default BottomNavWrapper;
