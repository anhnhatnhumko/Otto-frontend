"use client";

import { useState } from "react";
import {
  Search,
  Edit,
  Clock,
  CheckCircle,
  Trash2,
  Plus,
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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatCurrency } from "@/app/admin/dashboard/utils";
import { ServiceStatusBadge } from "../shared/StatusBadges";
import { DataPagination } from "../ui/data-pagination";

import type { Service } from "@/app/admin/dashboard/types";

interface ServicesTabProps {
  services: Service[];
  onAdd: () => void;
  onEdit: (service: Service) => void;
  onToggleStatus: (id: string) => void;
  onConfirmAction: (type: string, id: string, action: string) => void;
}

export function ServicesTab({
  services,
  onAdd,
  onEdit,
  onToggleStatus,
  onConfirmAction,
}: ServicesTabProps) {
  const [search, setSearch] = useState("");

  // 🔥 PAGINATION STATE
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ================= FILTER =================
  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  // ================= PAGINATION =================
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginated = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <CardTitle>Quản lý dịch vụ</CardTitle>
          <CardDescription>
            Thêm, sửa, hoặc xóa dịch vụ hệ thống
          </CardDescription>
        </div>

        <Button className="gap-2" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Thêm dịch vụ
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 🔍 SEARCH */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // 🔥 reset page
            }}
            placeholder="Tìm theo tên hoặc mô tả..."
            className="pl-10"
          />
        </div>

        {/* TABLE */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead>ID</TableHead> */}
                <TableHead className="w-[18%]">Tên</TableHead>
                <TableHead className="w-[28%]">Mô tả</TableHead>
                <TableHead className="w-[12%]">Giá</TableHead>
                <TableHead className="w-[12%]">Thời gian</TableHead>
                <TableHead className="w-[10%] text-center">Lượt đặt</TableHead>
                <TableHead className="w-[12%]">Trạng thái</TableHead>
                <TableHead className="w-[8%] text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-6 text-muted-foreground"
                  >
                    Không tìm thấy dịch vụ nào
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((s) => (
                  <TableRow key={s.id}>
                    {/* <TableCell>{s.id}</TableCell> */}
                    <TableCell className="w-[18%]">{s.name}</TableCell>

                    <TableCell className="w-[28%] truncate max-w-[200px]">
                      {s.description}
                    </TableCell>

                    <TableCell className="w-[12%]">{formatCurrency(s.price)}</TableCell>
                    <TableCell className="w-[12%]">{s.duration}</TableCell>
                    <TableCell className="w-[10%] text-center">{s.bookings}</TableCell>

                    <TableCell className="w-[12%]">
                      <ServiceStatusBadge status={s.status} />
                    </TableCell>

                    <TableCell className="w-[8%]">
                      <div className="flex justify-center gap-1">
                        {/* EDIT */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(s)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {/* TOGGLE */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onToggleStatus(s.id)}
                          className={
                            s.status === "active"
                              ? "text-yellow-600"
                              : "text-green-600"
                          }
                        >
                          {s.status === "active" ? (
                            <Clock className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>

                        {/* DELETE */}
                        {/* <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() =>
                            onConfirmAction("service", s.id, "delete_service")
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button> */}
                      </div>
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
          itemLabel="dịch vụ"
        />
      </CardContent>
    </Card>
  );
}