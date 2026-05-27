import "./globals.css";
import { Suspense } from "react";
import BottomNavWrapper from "@/components/BottomNavWrapper";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900">
        {children}
        <Suspense fallback={null}>
          <BottomNavWrapper />
        </Suspense>
      </body>
    </html>
  );
}
