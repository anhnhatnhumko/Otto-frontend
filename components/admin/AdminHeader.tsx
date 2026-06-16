"use client";

import { useEffect, useRef, useState } from "react";
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
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { connectSocket } from "@/lib/socket";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUserStore } from "@/app/store/useUserStore";

const ADMIN_TASKER_REQUESTS_UNREAD_KEY = "admin_tasker_requests";

const AdminHeader = () => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const { unreadIds: unreadRequestIds, addUnread, removeUnread, clearUnread } = useUnreadNotifications(ADMIN_TASKER_REQUESTS_UNREAD_KEY);
  const hasLoadedRequestsRef = useRef(false);
  const pendingNewIdsRef = useRef<Set<string>>(new Set());
  const seenStorageKey = `seen_notifications_${ADMIN_TASKER_REQUESTS_UNREAD_KEY}`;
  const seenIdsRef = useRef<Set<string>>(new Set());
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [socketIdentity, setSocketIdentity] = useState<{
    userId: string;
    role: string;
  } | null>(null);
    const router = useRouter();
    const logout = useLogout();
  const authUser = useUserStore((state) => state.user) as
    | { _id?: string; id?: string; role?: string }
    | null;
  const API_URL = "/api";
  const socketUserId = String(authUser?._id ?? authUser?.id ?? "").trim();
  const socketRole = String(authUser?.role ?? "ADMIN").trim().toUpperCase();
  const activeSocketUserId = socketIdentity?.userId ?? "";
  const activeSocketRole = socketIdentity?.role ?? "ADMIN";

  useEffect(() => {
    if (socketUserId) {
      setSocketIdentity({
        userId: socketUserId,
        role: socketRole || "ADMIN",
      });
      return;
    }

    let cancelled = false;

    const bootstrapIdentity = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) return;

        const user = await res.json();
        const userId = String(user?._id ?? user?.id ?? "").trim();
        const role = String(user?.role ?? "ADMIN").trim().toUpperCase();

        if (!cancelled && userId) {
          setSocketIdentity({ userId, role });
        }
      } catch {
        return;
      }
    };

    void bootstrapIdentity();

    return () => {
      cancelled = true;
    };
  }, [socketRole, socketUserId]);

  useEffect(() => {
    if (!activeSocketUserId) {
      return;
    }

    // Load persisted seen IDs so we don't treat already-seen items as new on reload
    try {
      const raw = localStorage.getItem(seenStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          seenIdsRef.current = new Set(parsed.map((v: any) => String(v).trim()).filter(Boolean));
        }
      }
    } catch (err) {
      // ignore
    }
    // connect as ADMIN to receive admin events
    try {
      const socket = connectSocket(activeSocketUserId, activeSocketRole);
      if (!socket) return;

      const handleNew = (payload: any) => {
        // payload may be the created document, or { success, data }, or other wrapper
        try {
          const candidate = payload && payload._id ? payload : payload && payload.data ? payload.data : payload;
          if (candidate && candidate._id) {
            setRequests((r) => {
              const arr = Array.isArray(r) ? r : [];
              const id = String(candidate._id || candidate.id || '').trim();
              const exists = arr.some((it: any) => String(it._id || it.id || '') === id);
              if (exists) return arr;
              return [candidate, ...arr];
            });
            const createdId = String(candidate._id || candidate.id || '').trim();
            if (createdId) {
              // If we've completed the initial load, mark it unread immediately.
              // If not, stash it and let the initial fetch process pending ids to avoid
              // re-marking already-read items on reload when socket may replay existing items.
              if (hasLoadedRequestsRef.current) {
                if (!unreadRequestIds.has(createdId)) {
                  addUnread(createdId);
                }
              } else {
                pendingNewIdsRef.current.add(createdId);
              }
            }
            return;
          }
        } catch (err) {
          // ignore and fallback to refetch
        }

        // fallback: refetch list
        void fetchList();
      };

      const handleDeleted = (payload: any) => {
        const id = String((payload && (payload.id || payload._id)) || payload);
        if (!id) return;
        setRequests((prev) => prev.filter((p) => String(p._id || p.id) !== id));
        removeUnread(id);
        // also mark as seen so it won't be considered new later
        try {
          seenIdsRef.current.add(id);
          localStorage.setItem(seenStorageKey, JSON.stringify(Array.from(seenIdsRef.current)));
        } catch (err) {}
      };

      const handleConnect = () => {
        void fetchList();
      };

      socket.on("admin:new-tasker-request", handleNew);
      socket.on("admin:tasker-request-created", handleNew);
      socket.on("admin:tasker-requests:created", handleNew);
      socket.on("admin:tasker-request-deleted", handleDeleted);
      socket.on("admin:tasker-requests:deleted", handleDeleted);
      socket.on("connect", handleConnect);

      return () => {
        socket.off("admin:new-tasker-request", handleNew);
        socket.off("admin:tasker-request-created", handleNew);
        socket.off("admin:tasker-requests:created", handleNew);
        socket.off("admin:tasker-request-deleted", handleDeleted);
        socket.off("admin:tasker-requests:deleted", handleDeleted);
        socket.off("connect", handleConnect);
      };
    } catch (err) {
      console.error("Admin socket init failed", err);
    }
  }, [activeSocketRole, activeSocketUserId]);

  const fetchList = async () => {
    if (!API_URL) return;
    try {
      const res = await fetch(`/api/admin/taskers/requests`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        // API may return { success: true, data: [...] } or raw array
        const list = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
          ? json.data
          : [];
        const idsToMarkUnread: string[] = [];
        setRequests((prev) => {
          if (hasLoadedRequestsRef.current) {
            const prevIds = new Set(prev.map((item) => String(item._id || item.id || "")));
            list.forEach((item: any) => {
              const id = String(item?._id || item?.id || "").trim();
              if (id && !prevIds.has(id)) {
                // Only mark as unread if this id hasn't been seen before and isn't already unread
                if (!seenIdsRef.current.has(id) && !unreadRequestIds.has(id)) {
                  idsToMarkUnread.push(id);
                }
                seenIdsRef.current.add(id);
              }
            });
            try {
              localStorage.setItem(seenStorageKey, JSON.stringify(Array.from(seenIdsRef.current)));
            } catch (err) {}
          } else {
            hasLoadedRequestsRef.current = true;
            // populate seen ids from initial list
            try {
              const ids = list.map((it: any) => String(it?._id || it?.id || '').trim()).filter(Boolean);
              seenIdsRef.current = new Set(ids);
              localStorage.setItem(seenStorageKey, JSON.stringify(Array.from(seenIdsRef.current)));
            } catch (err) {}

            // Process any pending new ids that arrived via socket before initial load
            try {
              pendingNewIdsRef.current.forEach((id) => {
                if (id && !unreadRequestIds.has(id)) {
                  idsToMarkUnread.push(id);
                }
                seenIdsRef.current.add(id);
              });
            } finally {
              try {
                localStorage.setItem(seenStorageKey, JSON.stringify(Array.from(seenIdsRef.current)));
              } catch (err) {}
              pendingNewIdsRef.current.clear();
            }
          }

          return list;
        });

        if (idsToMarkUnread.length > 0) {
          window.setTimeout(() => {
            idsToMarkUnread.forEach((id) => addUnread(id));
          }, 0);
        }
      }
    } catch (err) {
      console.error("Load admin tasker requests failed", err);
    }
  };

  useEffect(() => {
    void fetchList();
    const timer = window.setInterval(() => {
      void fetchList();
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const openDetail = async (id: string) => {
    if (!API_URL) return;
    try {
      const res = await fetch(`/api/admin/taskers/requests/${id}`, {
        credentials: "include",
        cache: "no-store",
      });
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
  const isUnreadRequest = (request: any) => {
    const id = String(request?._id || request?.id || '').trim();
    return Boolean(id && unreadRequestIds.has(id));
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
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                aria-label="Thông báo"
              >
                <Bell className="h-5 w-5" />
                {unreadRequestIds.size > 0 && (
                  <span className="absolute top-0 right-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                    {unreadRequestIds.size > 99 ? '99+' : unreadRequestIds.size}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Thông báo</span>
                <Badge variant="secondary" className="text-xs">
                  {unreadRequestIds.size} mới
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {requests.length === 0 ? (
                <DropdownMenuItem className="py-3 text-muted-foreground">Không có thông báo mới</DropdownMenuItem>
              ) : (
                requests.slice(0, 6).map((r) => {
                  const unread = isUnreadRequest(r);
                  return (
                  <DropdownMenuItem 
                    key={r._id} 
                    className={`flex flex-col items-start gap-1 py-3 cursor-pointer transition-colors hover:bg-sky-50 focus:bg-sky-50 data-[highlighted]:bg-sky-50 ${unread ? 'bg-sky-50 border-l-2 border-l-sky-400' : 'bg-sky-50/70 opacity-85'}`} 
                    onClick={() => {
                      const id = String(r._id || r.id || '');
                      if (id) {
                        removeUnread(id);
                        try {
                          seenIdsRef.current.add(id);
                          localStorage.setItem(seenStorageKey, JSON.stringify(Array.from(seenIdsRef.current)));
                        } catch (err) {}
                      }
                      void openDetail(r._id);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${unread ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>{r.formData?.fullName ?? "(Không tên)"}</span>
                      <Badge variant="secondary" className={`text-[10px] h-5 px-1.5 ${unread ? 'bg-sky-100 text-sky-700 border-sky-200' : 'bg-sky-50 text-sky-600 border-sky-100'}`}>
                        {unread ? 'Mới' : 'Đã đọc'}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{r.formData?.phone ?? r.formData?.email ?? "Thông tin liên hệ"}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleString("vi-VN")}</span>
                  </DropdownMenuItem>
                  );
                })
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="justify-center text-primary cursor-pointer" 
                onClick={() => {
                  clearUnread();
                  try {
                    // mark all current requests as seen so they don't reappear as new after reload
                    const ids = requests.map((it) => String(it._id || it.id || '').trim()).filter(Boolean);
                    ids.forEach((id) => seenIdsRef.current.add(id));
                    localStorage.setItem(seenStorageKey, JSON.stringify(Array.from(seenIdsRef.current)));
                  } catch (err) {}
                  setIsListOpen(true);
                }}
              >
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
                  <div className="col-span-2"><p className="text-muted-foreground">Địa chỉ</p><p className="font-medium">{selectedRequest?.formData?.district ?? "—"}{selectedRequest?.formData?.city ? `, ${selectedRequest.formData.city}` : ""}</p></div>
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
              {requests.length} yêu cầu
            </DialogDescription>
          </DialogHeader>

          {requests.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Chưa có yêu cầu đăng ký nào
            </div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {requests.map((r) => {
                const unread = isUnreadRequest(r);
                return (
                <div
                  key={r._id}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-4 hover:bg-sky-50 focus:bg-sky-50 data-[highlighted]:bg-sky-50 cursor-pointer transition ${unread ? 'bg-sky-50 border-sky-300' : 'bg-sky-50/60 opacity-85'}`}
                  onClick={() => {
                    const id = String(r._id || r.id || '');
                    if (id) {
                      removeUnread(id);
                    }
                    void openDetail(r._id);
                    setIsListOpen(false);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{r.formData?.fullName ?? "(Không tên)"}</p>
                    <p className="text-xs text-muted-foreground">{r.formData?.phone ?? r.formData?.email ?? "—"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Địa chỉ: {r.formData?.district ?? "—"}{r.formData?.city ? ` • Thành phố: ${r.formData.city}` : ""}
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
                    <div className="mt-2 flex justify-end">
                      <Badge variant="secondary" className={`text-[10px] h-5 px-1.5 ${unread ? 'bg-sky-100 text-sky-700 border-sky-200' : 'bg-sky-50 text-sky-600 border-sky-100'}`}>
                        {unread ? 'Mới' : 'Đã đọc'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
                );
              })}
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
