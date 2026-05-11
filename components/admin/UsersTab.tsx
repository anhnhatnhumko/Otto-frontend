"use client";

import { useState } from "react";
import { Search, Eye, UserCheck, Ban } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserStatusBadge } from "../shared/StatusBadges";
import type { User } from "@/app/admin/dashboard/types";

interface UsersTabProps {
  users: User[];
  onViewDetail: (user: User) => void;
  onConfirmAction: (type: string, id: string, action: string) => void;
}

export function UsersTab({ users, onViewDetail, onConfirmAction }: UsersTabProps) {
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search)
  );

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Quản lý người dùng</CardTitle>
        <CardDescription>Xem và quản lý người dùng trong hệ thống</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email, sđt..."
            className="pl-10"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead>ID</TableHead> */}
                <TableHead className="w-[20%]">Tên</TableHead>
                <TableHead className="w-[25%]">Email</TableHead>
                <TableHead className="w-[20%]">Điện thoại</TableHead>
                <TableHead className="text-center w-[12%]">Đơn hàng</TableHead>
                <TableHead className="w-[15%]">Trạng thái</TableHead>
                <TableHead className="text-center w-[8%]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    Không tìm thấy người dùng nào
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    {/* <TableCell>{u.id}</TableCell> */}
                    <TableCell className="w-[20%]">{u.name}</TableCell>
                    <TableCell className="w-[25%]">{u.email}</TableCell>
                    <TableCell className="w-[20%]">{u.phone}</TableCell>
                    <TableCell className="text-center w-[12%]">{u.orders}</TableCell>
                    <TableCell className="w-[15%]">
                      <UserStatusBadge status={u.status} />
                    </TableCell>
                    <TableCell className="w-[8%]">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onViewDetail(u)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {u.status === "banned" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => onConfirmAction("user", u.id, "activate_user")}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => onConfirmAction("user", u.id, "ban_user")}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
