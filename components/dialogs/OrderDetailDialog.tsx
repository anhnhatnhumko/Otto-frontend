import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Phone,
  Mail,
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { OrderStatusBadge } from "../shared/StatusBadges";
import { formatCurrency, formatDate } from "@/app/admin/dashboard/utils";
import type { Order } from "@/app/admin/dashboard/types";

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function OrderDetailDialog({
  open,
  onOpenChange,
  order,
}: OrderDetailDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chi tiết đơn hàng của {order.customer}</DialogTitle>
          <DialogDescription>Thông tin chi tiết về đơn hàng</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Trạng thái:</span>
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoItem icon={Users} label="Khách hàng" value={order.customer} />
            <InfoItem icon={Phone} label="Điện thoại" value={order.customerPhone} />
            <div className="col-span-2">
              <InfoItem icon={Mail} label="Email" value={order.customerEmail} />
            </div>
            <div className="col-span-2">
              <InfoItem icon={MapPin} label="Địa chỉ" value={order.address} />
            </div>
            <InfoItem icon={Briefcase} label="Dịch vụ" value={order.service} />
            <InfoItem icon={UserCheck} label="Nhân viên" value={order.workerName} />
            <InfoItem icon={Calendar} label="Ngày đặt" value={formatDate(order.date)} />
            <InfoItem icon={Clock} label="Giờ thực hiện đơn hàng" value={order.workTime} />
          </div>

          {order.note && (
            <InfoItem icon={AlertCircle} label="Ghi chú" value={order.note} />
          )}

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Tổng tiền:</span>
              <span className="text-primary">
                {formatCurrency(order.amount)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
