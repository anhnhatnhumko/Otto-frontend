"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLogout } from "@/hooks/useLogout";
import { useUserStore } from "@/app/store/useUserStore";
import { NotificationCenter } from "./NotificationCenter";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, setUser } = useUserStore();
  const [loadingUser, setLoadingUser] = useState(true);

  const pathname = usePathname();
  const logout = useLogout();

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { name: "Trang chủ", path: "/" },
    { name: "Dịch vụ", path: "/book-service" },
    { name: "Về chúng tôi", path: "/about" },
  ];

  // ✅ Lấy user từ /auth/me bằng cookie (credentials: include)
  useEffect(() => {
    fetch(`/api/auth/me`, {
      credentials: "include", // 👈 QUAN TRỌNG
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setUser(data);
      })
      .catch(() => {
        setUser(null); // chưa login hoặc cookie hết hạn
      })
      .finally(() => {
        setLoadingUser(false);
      });
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container flex h-16 items-center justify-between md:h-20">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-hero">
            <span className="text-xl font-bold text-primary-foreground">O</span>
          </div>
          <span className="text-2xl font-bold text-foreground">Otto</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(link.path) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {loadingUser ? null : !user ? (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Đăng nhập
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="hero" size="sm">
                  Đăng ký
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <NotificationCenter />
              {/* Avatar */}
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-gradient-hero flex items-center justify-center text-white font-semibold">
                  {user.fullName.charAt(0)}
                </div>
              )}

              <Link
                href="/profile"
                className="text-sm font-medium text-foreground hover:underline"
              >
                {user.fullName}
              </Link>

              <Button variant="outline" size="sm" onClick={logout}>
                Đăng xuất
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <div>
            <NotificationCenter />
          </div>
          <button
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-card border-b border-border animate-fade-up">
            <nav className="container py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              {!loadingUser && !user && (
                <div className="flex gap-2 mt-2 px-4">
                  <Link href="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link href="/register" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="hero" className="w-full">
                      Đăng ký
                    </Button>
                  </Link>
                </div>
              )}

              {!loadingUser && user && (
                <div className="mt-3 border-t border-border pt-3 px-4 flex flex-col gap-3">
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gradient-hero flex items-center justify-center text-white font-semibold">
                        {user.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </Link>

                  <Button variant="outline" className="w-full" onClick={logout}>
                    Đăng xuất
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;