import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Tag, Search, Edit, Trash2, Plus, Copy, Percent, Calendar } from "lucide-react";

interface Promotion {
  id: string;
  code: string;
  name: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "disabled";
  applicableServices: string[];
}

const initialPromotions: Promotion[] = [
  { id: "PRO001", code: "NEWYEAR26", name: "Khuyến mãi năm mới", type: "percent", value: 20, minOrder: 200000, maxDiscount: 100000, usageLimit: 100, usedCount: 45, startDate: "2026-01-01", endDate: "2026-01-31", status: "active", applicableServices: ["Tất cả"] },
  { id: "PRO002", code: "CLEAN50K", name: "Giảm 50K dọn dẹp", type: "fixed", value: 50000, minOrder: 300000, usageLimit: 50, usedCount: 50, startDate: "2025-12-01", endDate: "2026-01-15", status: "expired", applicableServices: ["Dọn dẹp nhà"] },
  { id: "PRO003", code: "WELCOME", name: "Chào mừng KH mới", type: "percent", value: 15, minOrder: 100000, maxDiscount: 75000, usageLimit: 500, usedCount: 230, startDate: "2025-06-01", endDate: "2026-12-31", status: "active", applicableServices: ["Tất cả"] },
  { id: "PRO004", code: "VIP30", name: "Ưu đãi VIP", type: "percent", value: 30, minOrder: 500000, maxDiscount: 200000, usageLimit: 20, usedCount: 8, startDate: "2026-01-01", endDate: "2026-03-31", status: "active", applicableServices: ["Nấu ăn", "Chăm sóc người già"] },
  { id: "PRO005", code: "SUMMER25", name: "KM mùa hè", type: "percent", value: 25, minOrder: 200000, maxDiscount: 150000, usageLimit: 200, usedCount: 0, startDate: "2026-06-01", endDate: "2026-08-31", status: "disabled", applicableServices: ["Tất cả"] },
];

const formatCurrency = (amount: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selected, setSelected] = useState<Promotion | null>(null);
  const [form, setForm] = useState({
    code: "", name: "", type: "percent" as "percent" | "fixed", value: "",
    minOrder: "", maxDiscount: "", usageLimit: "", startDate: "", endDate: "",
  });

  const filtered = promotions.filter(p =>
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      active: { label: "Đang hoạt động", className: "bg-green-100 text-green-800 border-green-200" },
      expired: { label: "Hết hạn", className: "bg-red-100 text-red-800 border-red-200" },
      disabled: { label: "Tạm dừng", className: "bg-muted text-muted-foreground border-border" },
    };
    const c = config[status] || { label: status, className: "" };
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };

  const handleAdd = () => {
    setSelected(null);
    setForm({ code: "", name: "", type: "percent", value: "", minOrder: "", maxDiscount: "", usageLimit: "", startDate: "", endDate: "" });
    setIsFormOpen(true);
  };

  const handleEdit = (p: Promotion) => {
    setSelected(p);
    setForm({
      code: p.code, name: p.name, type: p.type, value: p.value.toString(),
      minOrder: p.minOrder.toString(), maxDiscount: p.maxDiscount?.toString() || "",
      usageLimit: p.usageLimit.toString(), startDate: p.startDate, endDate: p.endDate,
    });
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!form.code || !form.name || !form.value) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }
    if (selected) {
      setPromotions(prev => prev.map(p => p.id === selected.id ? {
        ...p, code: form.code, name: form.name, type: form.type,
        value: parseInt(form.value), minOrder: parseInt(form.minOrder) || 0,
        maxDiscount: form.maxDiscount ? parseInt(form.maxDiscount) : undefined,
        usageLimit: parseInt(form.usageLimit) || 0, startDate: form.startDate, endDate: form.endDate,
      } : p));
      toast({ title: "Thành công", description: "Đã cập nhật khuyến mãi" });
    } else {
      const newPromo: Promotion = {
        id: `PRO${String(promotions.length + 1).padStart(3, "0")}`,
        code: form.code.toUpperCase(), name: form.name, type: form.type,
        value: parseInt(form.value), minOrder: parseInt(form.minOrder) || 0,
        maxDiscount: form.maxDiscount ? parseInt(form.maxDiscount) : undefined,
        usageLimit: parseInt(form.usageLimit) || 0, usedCount: 0,
        startDate: form.startDate, endDate: form.endDate,
        status: "active", applicableServices: ["Tất cả"],
      };
      setPromotions(prev => [newPromo, ...prev]);
      toast({ title: "Thành công", description: "Đã tạo khuyến mãi mới" });
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    setPromotions(prev => prev.filter(p => p.id !== id));
    toast({ title: "Thành công", description: "Đã xóa khuyến mãi" });
  };

  const handleToggle = (id: string) => {
    setPromotions(prev => prev.map(p =>
      p.id === id ? { ...p, status: p.status === "active" ? "disabled" as const : "active" as const } : p
    ));
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Đã sao chép", description: `Mã ${code} đã được sao chép` });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" />Quản lý khuyến mãi</CardTitle>
              <CardDescription>Tạo và quản lý mã giảm giá, voucher</CardDescription>
            </div>
            <Button onClick={handleAdd} className="gap-2"><Plus className="h-4 w-4" />Tạo khuyến mãi</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm theo mã hoặc tên..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
              <div className="text-2xl font-bold text-green-700">{promotions.filter(p => p.status === "active").length}</div>
              <p className="text-xs text-green-600">Đang hoạt động</p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-center">
              <div className="text-2xl font-bold text-red-700">{promotions.filter(p => p.status === "expired").length}</div>
              <p className="text-xs text-red-600">Hết hạn</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-center">
              <div className="text-2xl font-bold text-blue-700">{promotions.reduce((s, p) => s + p.usedCount, 0)}</div>
              <p className="text-xs text-blue-600">Tổng lượt dùng</p>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên KM</TableHead>
                  <TableHead className="hidden md:table-cell">Giảm giá</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">Đã dùng</TableHead>
                  <TableHead className="hidden md:table-cell">Hạn dùng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Không có khuyến mãi nào</TableCell></TableRow>
                ) : (
                  filtered.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{p.code}</code>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(p.code)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {p.type === "percent" ? `${p.value}%` : formatCurrency(p.value)}
                        {p.maxDiscount && <span className="text-xs text-muted-foreground ml-1">(tối đa {formatCurrency(p.maxDiscount)})</span>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center">{p.usedCount}/{p.usageLimit}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{p.startDate} → {p.endDate}</TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Edit className="h-4 w-4" /></Button>
                          {p.status !== "expired" && (
                            <Button variant="ghost" size="icon" className={p.status === "active" ? "text-yellow-600" : "text-green-600"} onClick={() => handleToggle(p.id)}>
                              {p.status === "active" ? <Percent className="h-4 w-4" /> : <Percent className="h-4 w-4" />}
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(p.id)}>
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

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected ? "Sửa khuyến mãi" : "Tạo khuyến mãi mới"}</DialogTitle>
            <DialogDescription>{selected ? "Cập nhật thông tin khuyến mãi" : "Điền thông tin để tạo mã giảm giá"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã giảm giá *</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="VD: NEWYEAR" />
              </div>
              <div className="space-y-2">
                <Label>Tên KM *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Tên khuyến mãi" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại giảm giá</Label>
                <Select value={form.type} onValueChange={(v: "percent" | "fixed") => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Phần trăm (%)</SelectItem>
                    <SelectItem value="fixed">Số tiền cố định</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Giá trị *</Label>
                <Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === "percent" ? "20" : "50000"} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Đơn tối thiểu</Label>
                <Input type="number" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} placeholder="200000" />
              </div>
              {form.type === "percent" && (
                <div className="space-y-2">
                  <Label>Giảm tối đa</Label>
                  <Input type="number" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} placeholder="100000" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Giới hạn lượt dùng</Label>
              <Input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} placeholder="100" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày bắt đầu</Label>
                <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Ngày kết thúc</Label>
                <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Hủy</Button>
            <Button onClick={handleSave}>{selected ? "Cập nhật" : "Tạo"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPromotions;
