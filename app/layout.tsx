import "./globals.css";
import { Suspense } from "react";
import { Providers } from "./providers";
import BottomNavWrapper from "@/components/BottomNavWrapper";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <Providers>
          {children}
          <Suspense fallback={null}>
            <BottomNavWrapper />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
