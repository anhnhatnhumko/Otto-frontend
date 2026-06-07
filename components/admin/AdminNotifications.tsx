import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Bell, Send, Search, Eye, Trash2, Plus, Users, UserCog, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

interface Notification {
  id: string;
  title: string;
  message: string;
  target: "all" | "customers" | "taskers" | "specific";
  targetName?: string;
  status: "sent" | "scheduled" | "draft";
  sentAt?: string;
  scheduledAt?: string;
  readCount: number;
  totalRecipients: number;
}

const initialNotifications: Notification[] = [
  { id: "NTF001", title: "Khuyến mãi mùa hè", message: "Giảm 20% tất cả dịch vụ dọn dẹp nhà trong tháng 7!", target: "customers", status: "sent", sentAt: "2026-01-15 09:00", readCount: 45, totalRecipients: 120 },
  { id: "NTF002", title: "Cập nhật chính sách", message: "Chính sách hoa hồng mới sẽ áp dụng từ 01/02/2026", target: "taskers", status: "sent", sentAt: "2026-01-14 10:30", readCount: 12, totalRecipients: 25 },
  { id: "NTF003", title: "Bảo trì hệ thống", message: "Hệ thống sẽ bảo trì vào 22:00 - 02:00 ngày 20/01", target: "all", status: "sent", sentAt: "2026-01-13 15:00", readCount: 80, totalRecipients: 145 },
  { id: "NTF004", title: "Chúc mừng năm mới", message: "Chúc mừng năm mới 2026! Tặng voucher 50K cho đơn đầu tiên.", target: "customers", status: "scheduled", scheduledAt: "2026-02-01 00:00", readCount: 0, totalRecipients: 120 },
  { id: "NTF005", title: "Đào tạo kỹ năng", message: "Mời tham gia buổi đào tạo kỹ năng giao tiếp ngày 25/01", target: "taskers", status: "draft", readCount: 0, totalRecipients: 0 },
];

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", target: "all" as Notification["target"], scheduledAt: "" });

  const filtered = notifications.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.message.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      sent: { label: "Đã gửi", className: "bg-green-100 text-green-800 border-green-200" },
      scheduled: { label: "Đã lên lịch", className: "bg-blue-100 text-blue-800 border-blue-200" },
      draft: { label: "Bản nháp", className: "bg-muted text-muted-foreground border-border" },
    };
    const c = config[status] || { label: status, className: "" };
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };

  const getTargetLabel = (target: string) => {
    const labels: Record<string, string> = { all: "Tất cả", customers: "Khách hàng", taskers: "Tasker", specific: "Cá nhân" };
    return labels[target] || target;
  };

  const getTargetIcon = (target: string) => {
    if (target === "taskers") return <UserCog className="h-3 w-3" />;
    return <Users className="h-3 w-3" />;
  };

  const handleCreate = () => {
    setForm({ title: "", message: "", target: "all", scheduledAt: "" });
    setIsCreateOpen(true);
  };

  const handleSend = (asDraft = false) => {
    if (!form.title || !form.message) {
      toast({ title: "Lỗi", description: "Vui lòng điền tiêu đề và nội dung", variant: "destructive" });
      return;
    }
    const newNotif: Notification = {
      id: `NTF${String(notifications.length + 1).padStart(3, "0")}`,
      title: form.title,
      message: form.message,
      target: form.target,
      status: asDraft ? "draft" : form.scheduledAt ? "scheduled" : "sent",
      sentAt: !asDraft && !form.scheduledAt ? new Date().toLocaleString("vi-VN") : undefined,
      scheduledAt: form.scheduledAt || undefined,
      readCount: 0,
      totalRecipients: asDraft ? 0 : form.target === "all" ? 145 : form.target === "customers" ? 120 : 25,
    };
    setNotifications(prev => [newNotif, ...prev]);
    setIsCreateOpen(false);
    toast({ title: "Thành công", description: asDraft ? "Đã lưu bản nháp" : "Đã gửi thông báo" });
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast({ title: "Thành công", description: "Đã xóa thông báo" });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Quản lý thông báo
              </CardTitle>
              <CardDescription>Gửi thông báo đến khách hàng và Tasker</CardDescription>
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo thông báo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm thông báo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
              <div className="text-2xl font-bold text-green-700">{notifications.filter(n => n.status === "sent").length}</div>
              <p className="text-xs text-green-600">Đã gửi</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-center">
              <div className="text-2xl font-bold text-blue-700">{notifications.filter(n => n.status === "scheduled").length}</div>
              <p className="text-xs text-blue-600">Đã lên lịch</p>
            </div>
            <div className="p-4 rounded-lg bg-muted border border-border text-center">
              <div className="text-2xl font-bold text-muted-foreground">{notifications.filter(n => n.status === "draft").length}</div>
              <p className="text-xs text-muted-foreground opacity-75">Bản nháp</p>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead className="hidden md:table-cell">Đối tượng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">Đã đọc</TableHead>
                  <TableHead className="hidden sm:table-cell">Thời gian</TableHead>
                  <TableHead className="text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Không có thông báo nào</TableCell>
                  </TableRow>
                ) : (
                  filtered.map(n => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{n.title}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1">{getTargetIcon(n.target)}{getTargetLabel(n.target)}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(n.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-center">
                        {n.status === "sent" ? `${n.readCount}/${n.totalRecipients}` : "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {n.sentAt || n.scheduledAt || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedNotif(n); setIsDetailOpen(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(n.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo thông báo mới</DialogTitle>
            <DialogDescription>Gửi thông báo đến người dùng trong hệ thống</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Tiêu đề thông báo" />
            </div>
            <div className="space-y-2">
              <Label>Nội dung *</Label>
              <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Nội dung thông báo..." rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Đối tượng</Label>
              <Select value={form.target} onValueChange={(v: Notification["target"]) => setForm(f => ({ ...f, target: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="customers">Khách hàng</SelectItem>
                  <SelectItem value="taskers">Tasker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lên lịch gửi (tùy chọn)</Label>
              <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleSend(true)}>Lưu nháp</Button>
            <Button onClick={() => handleSend(false)} className="gap-2"><Send className="h-4 w-4" />Gửi ngay</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedNotif?.title}</DialogTitle>
            <DialogDescription>Chi tiết thông báo</DialogDescription>
          </DialogHeader>
          {selectedNotif && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Trạng thái:</span>
                {getStatusBadge(selectedNotif.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Đối tượng:</span>
                <span className="flex items-center gap-1">{getTargetIcon(selectedNotif.target)}{getTargetLabel(selectedNotif.target)}</span>
              </div>
              {selectedNotif.sentAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Gửi lúc:</span>
                  <span>{selectedNotif.sentAt}</span>
                </div>
              )}
              {selectedNotif.status === "sent" && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Đã đọc:</span>
                  <span>{selectedNotif.readCount}/{selectedNotif.totalRecipients} ({Math.round(selectedNotif.readCount / Math.max(selectedNotif.totalRecipients, 1) * 100)}%)</span>
                </div>
              )}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{selectedNotif.message}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotifications;
