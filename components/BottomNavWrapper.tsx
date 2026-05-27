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

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);

    switch (tab) {
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

  return <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />;
};

export default BottomNavWrapper;
