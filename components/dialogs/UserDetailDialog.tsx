import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Phone, Mail, Calendar, ShoppingCart } from "lucide-react";
import { UserStatusBadge } from "../shared/StatusBadges";
import { formatCurrency } from "@/app/admin/dashboard/utils";
import type { User } from "@/app/admin/dashboard/types";

interface UserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function UserDetailDialog({ open, onOpenChange, user }: UserDetailDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>  
          <DialogTitle>Chi tiết người dùng {user.name}</DialogTitle>
          <DialogDescription>Thông tin chi tiết về người dùng</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Trạng thái:</span>
            <UserStatusBadge status={user.status} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoItem icon={Users} label="Họ tên" value={user.name} />
            <InfoItem icon={Phone} label="Điện thoại" value={user.phone} />
            <InfoItem icon={Mail} label="Email" value={user.email} className="col-span-2" />
            <InfoItem icon={Calendar} label="Ngày tham gia" value={user.joinDate} />
            <InfoItem icon={ShoppingCart} label="Số đơn hàng" value={String(user.orders)} />
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Tổng chi tiêu:</span>
              <span className="text-primary">{formatCurrency(user.totalSpent)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface InfoItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
}

function InfoItem({ icon: Icon, label, value, className }: InfoItemProps) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <p className="text-sm text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
