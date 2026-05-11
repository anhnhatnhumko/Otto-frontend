import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Service, ServiceFormData } from "@/app/admin/dashboard/types";

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  form: ServiceFormData;
  onFormChange: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  onSave: () => void;
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  form,
  onFormChange,
  onSave,
}: ServiceFormDialogProps) {
  const isEdit = !!service;

  const updateField = <K extends keyof ServiceFormData>(key: K, value: ServiceFormData[K]) => {
    onFormChange((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Sửa dịch vụ" : "Thêm dịch vụ mới"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Cập nhật thông tin dịch vụ" : "Điền thông tin để tạo dịch vụ mới"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="service-name">Tên dịch vụ *</Label>
            <Input
              id="service-name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="VD: Dọn dẹp nhà"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="service-description">Mô tả</Label>
            <Textarea
              id="service-description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Mô tả ngắn về dịch vụ"
              rows={3}
            />
          </div>

          {/* Price & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service-price">Giá (VNĐ) *</Label>
              <Input
                id="service-price"
                type="number"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
                placeholder="350000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-duration">Thời gian</Label>
              <Input
                id="service-duration"
                value={form.duration}
                onChange={(e) => updateField("duration", e.target.value)}
                placeholder="2-3 giờ"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Trạng thái</Label>
            <Select
              value={form.status}
              onValueChange={(value: "active" | "inactive") => updateField("status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={onSave}>{isEdit ? "Cập nhật" : "Thêm"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
