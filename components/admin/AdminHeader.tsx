"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  LogOut,
  Settings,
  User,
  Shield,
  ChevronDown,
  Search,
  Menu,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useLogout } from "@/hooks/useLogout";




const AdminHeader = () => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const router = useRouter();
    const logout = useLogout();
    
    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error(error);
        } finally {
            router.push("/login");
        }
    };
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero shadow-sm">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-lg font-bold leading-tight text-foreground">
                Otto Admin
              </span>
              <span className="text-[10px] font-medium leading-tight text-muted-foreground uppercase tracking-wider">
                Bảng điều khiển
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search (desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm đơn hàng, người dùng, dịch vụ..."
              className="pl-9 bg-muted/50 border-transparent focus:border-border focus:bg-background"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            {isSearchOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Thông báo</span>
                <Badge variant="secondary" className="text-xs">
                  3 mới
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
                <span className="text-sm font-medium">
                  Đơn hàng mới #ORD007
                </span>
                <span className="text-xs text-muted-foreground">
                  Khách hàng Nguyễn Văn A vừa đặt đơn
                </span>
                <span className="text-[10px] text-muted-foreground">
                  2 phút trước
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
                <span className="text-sm font-medium">Tasker mới đăng ký</span>
                <span className="text-xs text-muted-foreground">
                  Võ Thị Mai đang chờ duyệt
                </span>
                <span className="text-[10px] text-muted-foreground">
                  15 phút trước
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
                <span className="text-sm font-medium">Đánh giá 1 sao</span>
                <span className="text-xs text-muted-foreground">
                  Cần kiểm duyệt đánh giá từ khách hàng
                </span>
                <span className="text-[10px] text-muted-foreground">
                  1 giờ trước
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-primary cursor-pointer">
                Xem tất cả
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Quick link to main site */}
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex text-muted-foreground text-xs gap-1.5"
            >
              Xem trang chính
            </Button>
          </Link>

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    AD
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start">
                  <span className="text-sm font-medium leading-tight">
                    Admin
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    Quản trị viên
                  </span>
                </div>
                <ChevronDown className="hidden lg:block h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>Admin Otto</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    admin@otto.vn
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Hồ sơ cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Cài đặt hệ thống
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Đăng xuất</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile search bar */}
      {isSearchOpen && (
        <div className="md:hidden border-t border-border px-4 py-3 bg-card animate-fade-up">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm kiếm..." className="pl-9" autoFocus />
          </div>
        </div>
      )}
    </header>
  );
};

export default AdminHeader;
