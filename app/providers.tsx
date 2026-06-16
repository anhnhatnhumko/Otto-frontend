"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import ForcedLogoutProvider from "@/components/providers/ForcedLogoutProvider";
import GlobalNotificationHost from "@/components/providers/GlobalNotificationHost";
import RealtimeChatBridge from "@/components/providers/RealtimeChatBridge";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="otto-theme"
      disableTransitionOnChange
    >
      <ForcedLogoutProvider>
        {children}
        <RealtimeChatBridge />
        <GlobalNotificationHost />
      </ForcedLogoutProvider>
    </ThemeProvider>
  );
}
