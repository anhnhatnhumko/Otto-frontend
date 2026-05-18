"use client";

import { useEffect, useState } from "react";
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
  Briefcase,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useLogout } from "@/hooks/useLogout";
import { connectSocket } from "@/lib/socket";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { requireApiUrl } from "@/lib/api-url";




const AdminHeader = () => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
    const router = useRouter();
    const logout = useLogout();
  const API_URL = requireApiUrl();

  useEffect(() => {
    // connect as ADMIN to receive admin events
    try {
      const socket = connectSocket("admin", "ADMIN");

      const handleNew = (payload: any) => {
        // payload may be the created document, or { success, data }, or other wrapper
        try {
          const candidate = payload && payload._id ? payload : payload && payload.data ? payload.data : payload;
          if (candidate && candidate._id) {
            setRequests((r) => Array.isArray(r) ? [candidate, ...r] : [candidate]);
            return;
          }
        } catch (err) {
          // ignore and fallback to refetch
        }

        // fallback: refetch list
        void fetchList();
      };

      socket.on("admin:new-tasker-request", handleNew);

      // initial load
      void fetchList();

      return () => {
        socket.off("admin:new-tasker-request", handleNew);
      };
    } catch (err) {
      console.error("Admin socket init failed", err);
    }
  }, []);

  const fetchList = async () => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/admin/taskers/requests`);
      if (res.ok) {
        const json = await res.json();
        // API may return { success: true, data: [...] } or raw array
        const list = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
          ? json.data
          : [];
        setRequests(list);
      }
    } catch (err) {
      console.error("Load admin tasker requests failed", err);
    }
  };

  const openDetail = async (id: string) => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/admin/taskers/requests/${id}`);
      if (res.ok) {
        const json = await res.json();
        const item = json?.data ?? json;
        setSelectedRequest(item);
        setIsDetailOpen(true);
      }
    } catch (err) {
      console.error("Load tasker request detail failed", err);
    }
  };
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

          {/* Notifications - dynamic admin tasker requests */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {requests.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {requests.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Thông báo</span>
                <Badge variant="secondary" className="text-xs">
                  {requests.length} mới
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {requests.length === 0 ? (
                <DropdownMenuItem className="py-3 text-muted-foreground">Không có thông báo mới</DropdownMenuItem>
              ) : (
                requests.slice(0, 6).map((r) => (
                  <DropdownMenuItem key={r._id} className="flex flex-col items-start gap-1 py-3 cursor-pointer" onClick={() => void openDetail(r._id)}>
                    <span className="text-sm font-medium">{r.formData?.fullName ?? "(Không tên)"}</span>
                    <span className="text-xs text-muted-foreground">{r.formData?.phone ?? r.formData?.email ?? "Thông tin liên hệ"}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleString("vi-VN")}</span>
                  </DropdownMenuItem>
                ))
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-primary cursor-pointer" onClick={() => setIsListOpen(true)}>
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

      {/* Tasker request detail dialog */}
      {/* <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yêu cầu đăng ký Tasker</DialogTitle>
            <DialogDescription>Chi tiết yêu cầu đăng ký từ ứng viên</DialogDescription>
          </DialogHeader>

          {selectedRequest ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Họ tên</p>
                  <p className="font-medium">{selectedRequest.formData?.fullName ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium">{selectedRequest.formData?.phone ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedRequest.formData?.email ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Địa chỉ</p>
                  <p className="font-medium">{selectedRequest.formData?.address ?? "—"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Dịch vụ đăng ký</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(selectedRequest.services || []).map((s: string, i: number) => (
                    <Badge key={i} variant="secondary">{s}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Đóng</Button>
                <Button onClick={() => { setIsDetailOpen(false); void router.push(`/admin/dashboard`); }}>Mở trình quản lý</Button>
              </div>
            </div>
          ) : (
            <p>Đang tải...</p>
          )}
        </DialogContent>
      </Dialog> */}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Hồ sơ đăng ký Tasker {selectedRequest?.formData?.fullName ? `- ${selectedRequest.formData.fullName}` : ""}
            </DialogTitle>
            <DialogDescription>
              Thông tin do Tasker gửi khi đăng ký
              {selectedRequest?.createdAt && (
                <> · Nộp lúc {new Date(selectedRequest.createdAt).toLocaleString("vi-VN")}</>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest ? (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Thông tin cá nhân
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground">Họ tên</p><p className="font-medium">{selectedRequest?.formData?.fullName ?? "—"}</p></div>
                  <div><p className="text-muted-foreground">Email</p><p className="font-medium">{selectedRequest?.formData?.email ?? "—"}</p></div>
                  <div><p className="text-muted-foreground">Số điện thoại</p><p className="font-medium">{selectedRequest?.formData?.phone ?? "—"}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground">Quận/Huyện</p><p className="font-medium">{selectedRequest?.formData?.district ?? "—"}</p></div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Dịch vụ đăng ký
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedRequest.services || []).map((s: string, i: number) => (
                    <Badge key={i} variant="secondary">{s}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Đóng</Button>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Đang tải...
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tasker requests list dialog */}
      <Dialog open={isListOpen} onOpenChange={setIsListOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Danh sách yêu cầu đăng ký Tasker
            </DialogTitle>
            <DialogDescription>
              {requests.length} yêu cầu mới
            </DialogDescription>
          </DialogHeader>

          {requests.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Chưa có yêu cầu đăng ký nào
            </div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {requests.map((r) => (
                <div
                  key={r._id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition"
                  onClick={() => {
                    void openDetail(r._id);
                    setIsListOpen(false);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{r.formData?.fullName ?? "(Không tên)"}</p>
                    <p className="text-xs text-muted-foreground">{r.formData?.phone ?? r.formData?.email ?? "—"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Quận/Huyện: {r.formData?.district ?? "—"}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(r.services || []).slice(0, 3).map((s: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                      {(r.services || []).length > 3 && (
                        <Badge variant="secondary" className="text-xs">+{(r.services || []).length - 3}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge className={r.status === 'pending' ? 'bg-yellow-600' : 'bg-green-600'}>
                      {r.status === 'pending' ? 'Chờ duyệt' : 'Đã duyệt'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsListOpen(false)}>Đóng</Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default AdminHeader;
