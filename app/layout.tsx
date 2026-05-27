import "./globals.css";
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
        <BottomNavWrapper />
      </body>
    </html>
  );
}
