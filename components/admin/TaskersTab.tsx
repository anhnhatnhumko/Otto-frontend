"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { AddTaskerFormDialog } from "../dialogs/AddTaskerFormDialog";

import type { Tasker, Service } from "@/app/admin/dashboard/types";
import { DataPagination } from "../ui/data-pagination";
import { API_URL } from "@/app/admin/dashboard/constants";

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

  // 🔥 PAGINATION STATE
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const pendingCount = taskers.filter((t) => t.status === "pending").length;
  const hasActiveFilters =
    statusFilter !== "all" || provinceId !== "all" || wardId !== "all";

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
        const res = await fetch(`${API_URL}/locations/provinces`);

        const data = await res.json();

        setProvinces(data);
      } catch (err) {
        console.error("Load provinces failed", err);
      }
    };

    fetchProvinces();
  }, []);

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
          `${API_URL}/locations?provinceId=${provinceId}`,
        );

        const data = await res.json();

        setWards(data);
      } catch (err) {
        console.error("Load wards failed", err);
      }
    };

    fetchWards();
  }, [provinceId]);

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Quản lý Tasker
          </CardTitle>
          <CardDescription>
            Quản lý người cung cấp dịch vụ (Tasker) trong hệ thống
          </CardDescription>
        </div>

        <Button onClick={() => setIsAddTaskerOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm Tasker
        </Button>
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
                <TableHead className="hidden md:table-cell w-[20%]">Dịch vụ</TableHead>
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
        onTaskerAdded={onRefresh}
      />
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
