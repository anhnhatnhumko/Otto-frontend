import { ReactNode } from "react";
import AuthSideImage from "@/components/auth/AuthSideImage";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* LEFT */}
      <div className="flex items-center justify-center px-6">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* RIGHT */}
      <AuthSideImage />
    </div>
  );
}
