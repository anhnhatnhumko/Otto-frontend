"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLogout } from "@/hooks/useLogout";
import { useUserStore } from "@/app/store/useUserStore";
import { NotificationCenter } from "./NotificationCenter";
import { useTheme } from "next-themes";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, setUser } = useUserStore();
  const [loadingUser, setLoadingUser] = useState(true);

  const pathname = usePathname();
  const logout = useLogout();

  const isActive = (path: string) => pathname === path;
  const { resolvedTheme, setTheme } = useTheme();
  const toggleTheme = () =>
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  const isDarkMode = resolvedTheme === "dark";

  const displayName = useMemo(
    () => String(user?.fullName ?? user?.email ?? "Tài khoản"),
    [user],
  );
  const avatarFallback = useMemo(
    () => displayName.charAt(0).toUpperCase(),
    [displayName],
  );

  const navLinks = [
    { name: "Trang chủ", path: "/" },
    { name: "Dịch vụ", path: "/book-service" },
    { name: "Về chúng tôi", path: "/about" },
  ];

  useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unauthorized");
        }

        return res.json();
      })
      .then((data) => {
        setUser(data);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoadingUser(false);
      });
  }, [setUser]);

  const renderAvatar = () => {
    if (user?.avatar) {
      return (
        <img
          src={user.avatar}
          alt={displayName}
          className="h-9 w-9 rounded-full object-cover"
        />
      );
    }

    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-hero font-semibold text-white">
        {avatarFallback}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between md:h-20">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-hero">
            <span className="text-xl font-bold text-primary-foreground">O</span>
          </div>
          <span className="text-2xl font-bold text-foreground">Otto</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
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

        <div className="flex items-center gap-2 md:gap-4">
          <NotificationCenter />

          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 transition-colors hover:bg-muted md:rounded-xl md:p-2.5"
            aria-label="Chuyển đổi sáng/tối"
          >
            {isDarkMode ? (
              <Sun
                size={18}
                className="text-foreground md:h-[18px] md:w-[18px]"
              />
            ) : (
              <Moon
                size={18}
                className="text-foreground md:h-[18px] md:w-[18px]"
              />
            )}
          </button>

          <div className="hidden items-center gap-4 md:flex">
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
                {renderAvatar()}

                <Link
                  href="/profile"
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  {displayName}
                </Link>

                <Button variant="outline" size="sm" onClick={logout}>
                  Đăng xuất
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              className="rounded-lg p-2 transition-colors hover:bg-muted"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="absolute left-0 right-0 top-full border-b border-border bg-card md:hidden">
            <nav className="container flex flex-col gap-2 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
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
                <div className="mt-2 flex gap-2 px-4">
                  <Link
                    href="/login"
                    className="flex-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button variant="outline" className="w-full">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button variant="hero" className="w-full">
                      Đăng ký
                    </Button>
                  </Link>
                </div>
              )}

              {!loadingUser && user && (
                <div className="mt-3 flex flex-col gap-3 border-t border-border px-4 pt-3">
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                  >
                    {renderAvatar()}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
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
