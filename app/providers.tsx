"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import ForcedLogoutProvider from "@/components/providers/ForcedLogoutProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="otto-theme"
      disableTransitionOnChange
    >
      <ForcedLogoutProvider>{children}</ForcedLogoutProvider>
    </ThemeProvider>
  );
}
