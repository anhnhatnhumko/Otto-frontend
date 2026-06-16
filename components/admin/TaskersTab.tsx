"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Star,
  FileCheck,
  UserCog,
  Plus,
  X,
  Briefcase,
  FileText,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskerStatusBadge } from "../shared/StatusBadges";
import {
  AddTaskerFormDialog,
  type AddTaskerPrefillData,
} from "../dialogs/AddTaskerFormDialog";

import type { Tasker, Service } from "@/app/admin/dashboard/types";
import { DataPagination } from "../ui/data-pagination";
import { API_URL } from "@/app/admin/dashboard/constants";
import { connectSocket } from "@/lib/socket";
import { toast } from "@/hooks/use-toast";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useUserStore } from "@/app/store/useUserStore";

const ADMIN_TASKER_REQUESTS_UNREAD_KEY = "admin_tasker_requests";

interface TaskersTabProps {
  taskers: Tasker[];
  services: Service[];
  provinceId: string;
  wardId: string;
  setWardId: (id: string) => void;
  setProvinceId: (id: string) => void;
  onViewDetail: (tasker: Tasker) => void;
  onConfirmAction: (type: string, id: string, action: string) => void;
  onRefresh?: () => void | Promise<void>;
}

interface Province {
  _id: string;
  name: string;
}

interface Ward {
  _id: string;
  name: string;
}

export function TaskersTab({
  taskers,
  services,
  provinceId,
  wardId,
  setWardId,
  setProvinceId,
  onViewDetail,
  onConfirmAction,
  onRefresh,
}: TaskersTabProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddTaskerOpen, setIsAddTaskerOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const { unreadIds: unreadRequestIds, addUnread, removeUnread } = useUnreadNotifications(ADMIN_TASKER_REQUESTS_UNREAD_KEY);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const authUser = useUserStore((state) => state.user) as
    | { _id?: string; id?: string; role?: string }
    | null;
  const [prefillTaskerData, setPrefillTaskerData] =
    useState<AddTaskerPrefillData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [socketIdentity, setSocketIdentity] = useState<{
    userId: string;
    role: string;
  } | null>(null);
  const socketUserId = String(authUser?._id ?? authUser?.id ?? "").trim();
  const socketRole = String(authUser?.role ?? "ADMIN").trim().toUpperCase();
  const activeSocketUserId = socketIdentity?.userId ?? "";
  const activeSocketRole = socketIdentity?.role ?? "ADMIN";

  // 🔥 PAGINATION STATE
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const pendingCount = taskers.filter((t) => t.status === "pending").length;
  const hasActiveFilters =
    statusFilter !== "all" || provinceId !== "all" || wardId !== "all";
  const hasLoadedRequestsRef = useRef(false);
  const pendingNewIdsRef = useRef<Set<string>>(new Set());
  const seenStorageKey = `seen_notifications_${ADMIN_TASKER_REQUESTS_UNREAD_KEY}`;
  const seenIdsRef = useRef<Set<string>>(new Set());

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

  // ================= FILTER =================
  // const filtered = taskers.filter((t) => {
  //   const matchesSearch =
  //     t.name.toLowerCase().includes(search.toLowerCase()) ||
  //     t.email.toLowerCase().includes(search.toLowerCase()) ||
  //     t.phone.includes(search);

  //   const matchesStatus = statusFilter === "all" || t.status === statusFilter;

  //   return matchesSearch && matchesStatus;
  // });

  const filtered = taskers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search);

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;

    const matchesProvince = provinceId === "all" || t.provinceId === provinceId;

    const matchesWard = wardId === "all" || t.wardId === wardId;

    return matchesSearch && matchesStatus && matchesProvince && matchesWard;
  });

  // ================= PAGINATION =================
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  // ============================
  // LOAD PROVINCES
  // ============================

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch(`/api/locations/provinces`);

        const data = await res.json();

        setProvinces(data);
      } catch (err) {
        console.error("Load provinces failed", err);
      }
    };

    fetchProvinces();
  }, []);

  // ============================
  // LOAD TASKER REQUESTS
  // ============================

  useEffect(() => {
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

    const fetchRequests = async () => {
      try {
        const res = await fetch(`/api/admin/taskers/requests`, {
          credentials: "include",
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
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
              try {
                const ids = list.map((it: any) => String(it?._id || it?.id || "").trim()).filter(Boolean);
                seenIdsRef.current = new Set(ids);
                localStorage.setItem(seenStorageKey, JSON.stringify(Array.from(seenIdsRef.current)));
              } catch (err) {}

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
        console.error("Load tasker requests failed", err);
      }
    };
    void fetchRequests();

    const timer = window.setInterval(() => {
      void fetchRequests();
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  // ============================
  // REALTIME: listen for new tasker requests
  // ============================
  useEffect(() => {
    if (!activeSocketUserId) {
      return;
    }

    try {
      const socket = connectSocket(activeSocketUserId, activeSocketRole);
      if (!socket) return;

      const handleCreated = (payload: any) => {
        const item = payload?.data ?? payload;
        if (!item) return;
        const createdId = String(item?._id || item?.id || '').trim();
        setRequests((prev) => {
          if (prev.find((p) => String(p._id || p.id) === String(item._id || item.id))) {
            return prev;
          }
          return [item, ...prev];
        });
        if (createdId) {
          if (hasLoadedRequestsRef.current) {
            if (!unreadRequestIds.has(createdId)) {
              addUnread(createdId);
            }
            seenIdsRef.current.add(createdId);
            try {
              localStorage.setItem(seenStorageKey, JSON.stringify(Array.from(seenIdsRef.current)));
            } catch (err) {}
          } else {
            pendingNewIdsRef.current.add(createdId);
          }
        }
        try {
          const who = item?.formData?.fullName ?? item?.formData?.email ?? item?.formData?.phone ?? "Người dùng";
          toast({ title: "Yêu cầu đăng ký mới", description: `${who} vừa gửi yêu cầu đăng ký` });
        } catch (e) {
          // ignore toast errors
        }
      };

      const handleUpdated = (payload: any) => {
        const item = payload?.data ?? payload;
        if (!item) return;
        setRequests((prev) => {
          const idKey = String(item._id || item.id);
          const exists = prev.some((p) => String(p._id || p.id) === idKey);
          if (!exists) {
            return [item, ...prev];
          }
          return prev.map((p) => (String(p._id || p.id) === idKey ? item : p));
        });

        // if detail dialog is open for this item, update it too
        setSelectedRequest((cur: any) => {
          if (!cur) return cur;
          const curId = String(cur._id || cur.id);
          const newId = String(item._id || item.id);
          return curId === newId ? item : cur;
        });

        try {
          const who = item?.formData?.fullName ?? item?.formData?.email ?? item?.formData?.phone ?? "Người dùng";
          const status = String(item?.status || "").toLowerCase();
          if (status === "approved" || status === "approved") {
            toast({ title: "Yêu cầu đã được duyệt", description: `${who} đã được duyệt.` });
          } else {
            toast({ title: "Yêu cầu được cập nhật", description: `${who} đã có cập nhật.` });
          }
        } catch (e) {
          // ignore
        }
      };

      const handleDeleted = (payload: any) => {
        const id = String((payload && (payload.id || payload._id)) || payload);
        if (!id) return;
        setRequests((prev) => prev.filter((p) => String(p._id || p.id) !== id));
        removeUnread(id);
        try {
          seenIdsRef.current.add(id);
          localStorage.setItem(seenStorageKey, JSON.stringify(Array.from(seenIdsRef.current)));
        } catch (err) {}
        setSelectedRequest((cur: any) => (cur && String(cur._id || cur.id) === id ? null : cur));
        try {
          toast({ title: "Yêu cầu bị từ chối", description: "Một yêu cầu đăng ký đã bị từ chối và xóa." });
        } catch (e) {
          // ignore
        }
      };

      socket.on('admin:new-tasker-request', handleCreated);
      socket.on('admin:tasker-request-created', handleCreated);
      socket.on('admin:tasker-requests:created', handleCreated);
      socket.on('admin:tasker-request-updated', handleUpdated);
      socket.on('admin:tasker-requests:updated', handleUpdated);
      socket.on('admin:tasker-request-deleted', handleDeleted);
      socket.on('admin:tasker-requests:deleted', handleDeleted);

      return () => {
        try {
          socket.off('admin:new-tasker-request', handleCreated);
          socket.off('admin:tasker-request-created', handleCreated);
          socket.off('admin:tasker-requests:created', handleCreated);
          socket.off('admin:tasker-request-updated', handleUpdated);
          socket.off('admin:tasker-requests:updated', handleUpdated);
          socket.off('admin:tasker-request-deleted', handleDeleted);
          socket.off('admin:tasker-requests:deleted', handleDeleted);
        } catch (e) {
          // ignore
        }
      };
    } catch (err) {
      console.warn('Socket setup failed', err);
    }
  }, [activeSocketRole, activeSocketUserId]);

  // ============================
  // LOAD WARDS BY PROVINCE
  // ============================

  useEffect(() => {
    if (provinceId === "all") {
      return;
    }

    const fetchWards = async () => {
      try {
        const res = await fetch(
          `/api/locations?provinceId=${provinceId}`,
        );

        const data = await res.json();

        setWards(data);
      } catch (err) {
        console.error("Load wards failed", err);
      }
    };

    fetchWards();
  }, [provinceId]);

  const isUnreadRequest = (request: any) => {
    const id = String(request?._id || request?.id || '').trim();
    return Boolean(id && unreadRequestIds.has(id));
  };

  const markAsSeen = (id: string) => {
    try {
      seenIdsRef.current.add(id);
      localStorage.setItem(seenStorageKey, JSON.stringify(Array.from(seenIdsRef.current)));
    } catch (err) {
      // ignore
    }
  };

  const normalizeLookupValue = (value?: string | null) =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const normalizeLocationLookupValue = (value?: string | null) =>
    normalizeLookupValue(value)
      .replace(/[.,/\\-]/g, " ")
      .replace(
        /^(thanh pho|tp|tinh|quan|huyen|thi xa|tx|thi tran|tt|phuong|xa)\s+/,
        "",
      )
      .replace(/\s+/g, " ")
      .trim();

  const matchesLookupValue = (left?: string | null, right?: string | null) => {
    const normalizedLeft = normalizeLookupValue(left);
    const normalizedRight = normalizeLookupValue(right);

    if (!normalizedLeft || !normalizedRight) {
      return false;
    }

    return (
      normalizedLeft === normalizedRight ||
      normalizedLeft.includes(normalizedRight) ||
      normalizedRight.includes(normalizedLeft)
    );
  };

  const matchesLocationValue = (left?: string | null, right?: string | null) => {
    const normalizedLeft = normalizeLocationLookupValue(left);
    const normalizedRight = normalizeLocationLookupValue(right);

    if (!normalizedLeft || !normalizedRight) {
      return false;
    }

    return normalizedLeft === normalizedRight;
  };

  const buildTaskerPrefillData = async (
    request: any,
  ): Promise<{
    prefillData: AddTaskerPrefillData;
    unresolvedFields: string[];
  }> => {
    const provinceName = request?.formData?.province ?? request?.formData?.city;
    const wardName = request?.formData?.ward ?? request?.formData?.district;
    const rawServices = Array.isArray(request?.services) ? request.services : [];

    const matchedProvince = provinces.find((province) =>
      matchesLocationValue(province.name, provinceName),
    );

    const matchedServiceIds = rawServices
      .map((serviceValue: unknown) => {
        const rawValue = String(serviceValue ?? "").trim();
        if (!rawValue) {
          return "";
        }

        const matchedService = services.find(
          (service) =>
            service.id === rawValue || matchesLookupValue(service.name, rawValue),
        );

        return matchedService?.id ?? "";
      })
      .filter(Boolean);

    let matchedWardId = "";

    if (matchedProvince?._id && wardName) {
      try {
        const response = await fetch(
          `/api/locations?provinceId=${matchedProvince._id}`,
        );

        if (response.ok) {
          const wardOptions = (await response.json()) as Ward[];
          matchedWardId =
            wardOptions.find((ward) => matchesLocationValue(ward.name, wardName))
              ?._id ?? "";
        }
      } catch (error) {
        console.error("Load wards for tasker prefill failed", error);
      }
    }

    const unresolvedFields: string[] = [];

    if (provinceName && !matchedProvince?._id) {
      unresolvedFields.push("tỉnh/thành");
    }

    if (wardName && matchedProvince?._id && !matchedWardId) {
      unresolvedFields.push("phường/xã");
    }

    if (rawServices.length > 0 && matchedServiceIds.length !== rawServices.length) {
      unresolvedFields.push("dịch vụ");
    }

    return {
      prefillData: {
        name: request?.formData?.fullName ?? "",
        email: request?.formData?.email ?? "",
        phone: request?.formData?.phone ?? "",
        provinceId: matchedProvince?._id ?? "",
        wardId: matchedWardId,
        services: Array.from(new Set(matchedServiceIds)),
      },
      unresolvedFields,
    };
  };

  const handleOpenAddTaskerFromRequest = async () => {
    if (!selectedRequest) {
      return;
    }

    const { prefillData, unresolvedFields } =
      await buildTaskerPrefillData(selectedRequest);

    setPrefillTaskerData(prefillData);
    setIsDetailOpen(false);
    setIsAddTaskerOpen(true);

    if (unresolvedFields.length > 0) {
      toast({
        title: "Đã điền sẵn một phần thông tin",
        description: `Vui lòng kiểm tra lại ${unresolvedFields.join(", ")} trước khi tạo tasker.`,
      });
    }
  };

  const openDetail = async (id: string) => {
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

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-3">
            <UserCog className="h-5 w-5" />
            Quản lý Tasker
          </CardTitle>
          <CardDescription>
            Quản lý người cung cấp dịch vụ (Tasker) trong hệ thống
          </CardDescription>
        </div>

        {/* Tasker requests button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="outline"
              className="hidden sm:flex text-xs gap-1.5"
              onClick={() => {
                setIsListOpen(true);
              }}
            >
              <Briefcase className="h-4 w-4" />
              Tasker
            </Button>
            {unreadRequestIds.size > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[11px] font-semibold px-1">
                {unreadRequestIds.size > 99 ? '99+' : unreadRequestIds.size}
              </span>
            )}
          </div>

          <Button
            onClick={() => {
              setPrefillTaskerData(null);
              setIsAddTaskerOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Thêm Tasker
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // 🔥 reset page
              }}
              className="pl-10"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1); // 🔥 reset page
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="inactive">Tạm nghỉ</SelectItem>
              <SelectItem value="banned">Đã khóa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-muted/40 border">
          {/* PROVINCE */}
          <Select
            value={provinceId}
            onValueChange={(value) => {
              setProvinceId(value);
              setWardId("all"); // 🔥 reset ward khi đổi tỉnh
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px] bg-background">
              <SelectValue placeholder="Chọn tỉnh" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">Tất cả tỉnh</SelectItem>
              {provinces.map((p) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* WARD / DISTRICT */}
          <Select
            value={wardId}
            onValueChange={(value) => {
              setWardId(value);
              setPage(1);
            }}
            disabled={provinceId === "all"}
          >
            <SelectTrigger className="w-full sm:w-[200px] bg-background">
              <SelectValue placeholder="Chọn quận / huyện" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {wards.map((w) => (
                <SelectItem key={w._id} value={w._id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setWardId("all");
                setProvinceId("all");
                setPage(1);
              }}
              className="ml-auto text-muted-foreground gap-1 self-start sm:self-auto"
            >
              <X className="h-3.5 w-3.5" />
              Xóa
            </Button>
          )}
        </div>

        {/* Pending Alert */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              Có {pendingCount} Tasker đang chờ duyệt
            </span>
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead>Mã Tasker</TableHead> */}
                <TableHead className="w-[25%]">Thông tin</TableHead>
                <TableHead className="hidden md:table-cell w-[20%]">
                  Dịch vụ
                </TableHead>
                <TableHead className="text-center hidden sm:table-cell w-[15%]">
                  Đánh giá
                </TableHead>
                <TableHead className="text-center hidden sm:table-cell w-[15%]">
                  Hoàn thành
                </TableHead>
                <TableHead className="w-[15%]">Trạng thái</TableHead>
                <TableHead className="text-center w-[10%]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Không tìm thấy Tasker nào
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((tasker) => (
                  <TableRow
                    key={tasker.id}
                    className={
                      tasker.status === "pending" ? "bg-yellow-50/50" : ""
                    }
                  >
                    {/* <TableCell className="font-medium">{tasker.id}</TableCell> */}

                    <TableCell className="w-[25%]">
                      <div className="flex flex-col">
                        <span className="font-medium flex items-center gap-1">
                          {tasker.name}
                          {tasker.verified && (
                            <FileCheck className="h-3 w-3 text-green-500" />
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {tasker.phone}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell w-[20%]">
                      <div className="flex flex-wrap gap-1">
                        {tasker.services.slice(0, 2).map((service, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {service}
                          </Badge>
                        ))}
                        {tasker.services.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{tasker.services.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-center hidden sm:table-cell w-[15%]">
                      {tasker.rating > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span>{tasker.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Chưa có
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-center hidden sm:table-cell w-[15%]">
                      {tasker.completedJobs}
                    </TableCell>

                    <TableCell className="w-[15%]">
                      <TaskerStatusBadge status={tasker.status} />
                    </TableCell>

                    <TableCell className="w-[10%]">
                      <TaskerActions
                        tasker={tasker}
                        onViewDetail={onViewDetail}
                        onConfirmAction={onConfirmAction}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 🔥 PAGINATION */}
        <DataPagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={(p) => setPage(p)}
          itemLabel="tasker"
        />
      </CardContent>

      {/* Add Tasker Dialog */}
      <AddTaskerFormDialog
        open={isAddTaskerOpen}
        onOpenChange={setIsAddTaskerOpen}
        services={services}
        prefillData={prefillTaskerData}
        onTaskerAdded={onRefresh}
      />

      {/* Tasker Request Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Hồ sơ đăng ký Tasker{" "}
              {selectedRequest?.formData?.fullName
                ? `- ${selectedRequest.formData.fullName}`
                : ""}
            </DialogTitle>
            <DialogDescription>
              Thông tin do Tasker gửi khi đăng ký
              {selectedRequest?.createdAt && (
                <>
                  {" "}
                  · Nộp lúc{" "}
                  {new Date(selectedRequest.createdAt).toLocaleString("vi-VN")}
                </>
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
                  <div>
                    <p className="text-muted-foreground">Họ tên</p>
                    <p className="font-medium">
                      {selectedRequest?.formData?.fullName ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">
                      {selectedRequest?.formData?.email ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Số điện thoại</p>
                    <p className="font-medium">
                      {selectedRequest?.formData?.phone ?? "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Địa chỉ</p>
                    <p className="font-medium">
                      {selectedRequest?.formData?.district ?? "—"}{selectedRequest?.formData?.city ? `, ${selectedRequest.formData.city}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Dịch vụ đăng ký
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedRequest.services || []).map(
                    (s: string, i: number) => (
                      <Badge key={i} variant="secondary">
                        {s}
                      </Badge>
                    ),
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button onClick={() => void handleOpenAddTaskerFromRequest()}>
                  Đưa vào form thêm Tasker
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Đóng
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Đang tải...
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tasker Requests List Dialog */}
      <Dialog open={isListOpen} onOpenChange={setIsListOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Danh sách yêu cầu đăng ký Tasker
            </DialogTitle>
            <DialogDescription>{requests.length} yêu cầu</DialogDescription>
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
                      markAsSeen(id);
                    }
                    void openDetail(r._id);
                    setIsListOpen(false);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {r.formData?.fullName ?? "(Không tên)"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.formData?.phone ?? r.formData?.email ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Địa chỉ: {r.formData?.district ?? "—"}{r.formData?.city ? ` • Thành phố: ${r.formData.city}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(r.services || [])
                        .slice(0, 3)
                        .map((s: string, i: number) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs"
                          >
                            {s}
                          </Badge>
                        ))}
                      {(r.services || []).length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{(r.services || []).length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge
                      className={
                        r.status === "pending"
                          ? "bg-yellow-600"
                          : "bg-green-600"
                      }
                    >
                      {r.status === "pending" ? "Chờ duyệt" : "Đã duyệt"}
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
            <Button variant="outline" onClick={() => setIsListOpen(false)}>
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ================= ACTIONS =================

interface TaskerActionsProps {
  tasker: Tasker;
  onViewDetail: (tasker: Tasker) => void;
  onConfirmAction: (type: string, id: string, action: string) => void;
  // onToggleStatus: (id: string) => void;
}

function TaskerActions({
  tasker,
  onViewDetail,
  onConfirmAction,
  // onToggleStatus,
}: TaskerActionsProps) {
  return (
    <div className="flex justify-center gap-1">
      <Button variant="ghost" size="icon" onClick={() => onViewDetail(tasker)}>
        <Eye className="h-4 w-4" />
      </Button>

      {tasker.status === "pending" && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="text-green-600"
            onClick={() =>
              onConfirmAction("tasker", tasker.id, "approve_tasker")
            }
          >
            <CheckCircle className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-red-600"
            onClick={() =>
              onConfirmAction("tasker", tasker.id, "reject_tasker")
            }
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </>
      )}

      {tasker.status === "active" && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="text-yellow-600"
            onClick={() => onConfirmAction("tasker", tasker.id, "ban_tasker")}
          >
            <Clock className="h-4 w-4" />
          </Button>

          {/* <Button
            variant="ghost"
            size="icon"
            className="text-red-600"
            onClick={() => onConfirmAction("tasker", tasker.id, "ban_tasker")}
          >
            <Ban className="h-4 w-4" />
          </Button> */}
        </>
      )}

      {tasker.status === "inactive" && (
        <Button
          variant="ghost"
          size="icon"
          className="text-green-600"
          onClick={() =>
            onConfirmAction("tasker", tasker.id, "activate_tasker")
          }
        >
          <CheckCircle className="h-4 w-4" />
        </Button>
      )}

      {tasker.status === "banned" && (
        <Button
          variant="ghost"
          size="icon"
          className="text-green-600"
          onClick={() =>
            onConfirmAction("tasker", tasker.id, "activate_tasker")
          }
        >
          <CheckCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
