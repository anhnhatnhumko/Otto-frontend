import {
  Star,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useUnreadMessagesStore from "@/hooks/useUnreadMessages";
import { Order } from "./types";

interface AssignedViewProps {
  order: Order;
  onChat?: () => void;
  onCall?: () => void;
  onCancel?: () => void;
}

const AssignedView = ({
  order,
  onChat,
  onCall,
  onCancel,
}: AssignedViewProps) => {
  const tasker = order.tasker;
  const unreadCount = useUnreadMessagesStore(
    (state) => state.unreadCounts[order._id] || 0,
  );

  return (
    <Card className="overflow-hidden border-blue-200">
      <div className="h-1.5 bg-blue-500" />

      <CardContent className="space-y-5 p-6">
        <div className="text-center">
          <Badge className="mb-3 border-blue-200 bg-blue-100 text-blue-700">
            <CheckCircle2 size={12} className="mr-1" />
            Đã xác nhận
          </Badge>
          <h3 className="text-lg font-bold text-foreground">
            Tasker đã được phân công!
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tasker sẽ đến đúng lịch hẹn của bạn
          </p>
        </div>

        {tasker && (
          <div className="rounded-xl bg-muted/50 p-4">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-primary text-2xl font-bold text-primary-foreground">
                {tasker.avatar ? (
                  <img
                    src={tasker.avatar}
                    alt={tasker.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  tasker.name.charAt(0)
                )}
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-foreground">{tasker.name}</p>
                <div className="mt-1 flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Star size={14} className="fill-yellow-500 text-yellow-500" />
                    <span className="font-medium">{tasker.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Briefcase size={14} />
                    <span>{tasker.completedJobs} đơn</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {onCall && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={onCall}
                >
                  <Phone size={14} className="mr-1.5" />
                  Gọi điện
                </Button>
              )}
              {onChat && (
                <Button
                  variant="outline"
                  size="sm"
                  className="relative flex-1"
                  onClick={onChat}
                >
                  <MessageSquare size={14} className="mr-1.5" />
                  Nhắn tin
                  {unreadCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
            <Clock size={18} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Thời gian</p>
              <p className="text-sm text-muted-foreground">
                {order.date} • {order.time}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
            <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Địa chỉ</p>
              <p className="text-sm text-muted-foreground">{order.address}</p>
            </div>
          </div>
        </div>

        {onCancel && (
          <Button
            variant="ghost"
            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onCancel}
          >
            Hủy đơn hàng
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AssignedView;
