"use client";

import { useState } from "react";
import { Search, Eye, CheckCircle, XCircle, Calendar, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "../shared/StatusBadges";
import { formatCurrency, formatDate } from "@/app/admin/dashboard/utils";
import { DataPagination } from "../ui/data-pagination";
import type { Order } from "@/app/admin/dashboard/types";

interface Props {
  orders: Order[];
  onViewDetail: (order: Order) => void;
  onConfirmAction: (type: string, id: string, action: string) => void;
}

type DatePreset = "all" | "today" | "7days" | "30days" | "thisMonth" | "custom";

const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export function OrdersTab({ orders, onViewDetail, onConfirmAction }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 🔥 FILTER
  const filtered = orders.filter((o) => {
    const matchSearch =
      (o.customer || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.id || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.service || "").toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "all" || o.status === statusFilter;

    // 🔥 FILTER DATE (QUAN TRỌNG)
    const matchDate = (() => {
      if (!dateFrom && !dateTo) return true;

      if (!o.date) return false;

      const orderDate = new Date(o.date);
      if (isNaN(orderDate.getTime())) return false;

      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;

      if (from && orderDate < from) return false;

      if (to) {
        to.setHours(23, 59, 59, 999);
        if (orderDate > to) return false;
      }

      return true;
    })();

    return matchSearch && matchStatus && matchDate;
  });

  const handlePresetChange = (value: DatePreset) => {
    setDatePreset(value);
    const today = new Date();
    const todayISO = toISODate(today);
    if (value === "all") {
      setDateFrom("");
      setDateTo("");
    } else if (value === "today") {
      setDateFrom(todayISO);
      setDateTo(todayISO);
    } else if (value === "7days") {
      const from = new Date();
      from.setDate(today.getDate() - 6);
      setDateFrom(toISODate(from));
      setDateTo(todayISO);
    } else if (value === "30days") {
      const from = new Date();
      from.setDate(today.getDate() - 29);
      setDateFrom(toISODate(from));
      setDateTo(todayISO);
    } else if (value === "thisMonth") {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      setDateFrom(toISODate(from));
      setDateTo(todayISO);
    }
  };

  const clearDateFilter = () => {
    setDatePreset("all");
    setDateFrom("");
    setDateTo("");
  };

  // 🔥 PAGINATION
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý đơn hàng</CardTitle>
        <CardDescription>Danh sách đơn hàng</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* FILTER */}
        <div className="flex gap-4">
          <Input
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ xác nhận</SelectItem>
              <SelectItem value="confirmed">Đã xác nhận</SelectItem>
              <SelectItem value="in_progress">Đang thực hiện</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center p-3 rounded-lg bg-muted/40 border border-border">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Lọc theo thời gian:</span>
          </div>
          <Select
            value={datePreset}
            onValueChange={(v) => handlePresetChange(v as DatePreset)}
          >
            <SelectTrigger className="w-full sm:w-[170px] bg-background">
              <SelectValue placeholder="Chọn khoảng thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {/* <SelectItem value="today">Hôm nay</SelectItem> */}
              <SelectItem value="7days">7 ngày qua</SelectItem>
              <SelectItem value="30days">30 ngày qua</SelectItem>
              <SelectItem value="thisMonth">Tháng này</SelectItem>
              <SelectItem value="custom">Tùy chỉnh</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 flex-1">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setDatePreset("custom");
              }}
              className="bg-background w-full sm:w-[160px]"
              aria-label="Từ ngày"
            />
            <span className="text-muted-foreground text-sm">đến</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setDatePreset("custom");
              }}
              className="bg-background w-full sm:w-[160px]"
              aria-label="Đến ngày"
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDateFilter}
              className="text-muted-foreground gap-1"
            >
              <X className="h-3.5 w-3.5" /> Xóa
            </Button>
          )}
        </div>

        {/* TABLE */}
        <Table>
          <TableHeader>
            <TableRow>
              {/* <TableHead>ID</TableHead> */}
              <TableHead className="w-[15%]">Khách</TableHead>
              <TableHead className="w-[15%]">Dịch vụ</TableHead>
              <TableHead className="w-[12%]">Tasker</TableHead>
              <TableHead className="w-[12%]">Ngày đặt</TableHead>
              <TableHead className="w-[10%]">Giờ đặt</TableHead>
              {/* <TableHead>Thực hiện</TableHead> */}
              <TableHead className="w-[15%]">Trạng thái</TableHead>
              <TableHead className="w-[12%] text-right">Giá</TableHead>
              <TableHead className="w-[9%] text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.map((o) => (
              <TableRow key={o.id}>
                {/* <TableCell>{o.id}</TableCell> */}
                <TableCell className="w-[15%]">{o.customer}</TableCell>
                <TableCell className="w-[15%]">{o.service}</TableCell>
                <TableCell className="w-[12%]">{o.workerName || "-"}</TableCell>
                <TableCell className="w-[12%]">{formatDate(o.date)}</TableCell>
                <TableCell className="w-[10%]">{o.time}</TableCell>
                {/* <TableCell>{o.startTime ? formatDate(o.startTime) : "-"}</TableCell> */}
                <TableCell className="w-[15%]">
                  <OrderStatusBadge status={o.status} />
                </TableCell>
                <TableCell className="w-[12%] text-right">{formatCurrency(o.amount)}</TableCell>

                <TableCell className="w-[9%] text-center">
                  <Button onClick={() => onViewDetail(o)} size="sm" variant="ghost">
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* PAGINATION */}
        <DataPagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          itemLabel="đơn hàng"
        />
      </CardContent>
    </Card>
  );
}
