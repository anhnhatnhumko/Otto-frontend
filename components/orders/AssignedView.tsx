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

  return (
    console.log("TASKER:", tasker),
    <Card className="border-blue-200 overflow-hidden">
      <div className="h-1.5 bg-blue-500" />

      <CardContent className="p-6 space-y-5">
        <div className="text-center">
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 mb-3">
            <CheckCircle2 size={12} className="mr-1" />
            Đã xác nhận
          </Badge>
          <h3 className="text-lg font-bold text-foreground">
            Tasker đã được phân công!
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Tasker sẽ đến đúng lịch hẹn của bạn
          </p>
        </div>

        {/* Tasker card */}
        {tasker && (
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shrink-0">
                {tasker.avatar ? (
                  <img
                    src={tasker.avatar}
                    alt={tasker.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  tasker.name.charAt(0)
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-lg">
                  {tasker.name}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-sm">
                    <Star
                      size={14}
                      className="text-yellow-500 fill-yellow-500"
                    />
                    <span className="font-medium">{tasker.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Briefcase size={14} />
                    <span>{tasker.completedJobs} đơn</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact buttons */}
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
                  className="flex-1"
                  onClick={onChat}
                >
                  <MessageSquare size={14} className="mr-1.5" />
                  Nhắn tin
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Schedule details */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <Clock size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Thời gian</p>
              <p className="text-sm text-muted-foreground">
                {order.date} • {order.time}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Địa chỉ</p>
              <p className="text-sm text-muted-foreground">{order.address}</p>
            </div>
          </div>
        </div>

        {onCancel && (
          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
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
