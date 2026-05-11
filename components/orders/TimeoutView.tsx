import { AlertTriangle, RotateCcw, Search, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Order } from "./types";
import { formatTime } from "../tasker/taskerUtils";

interface TimeoutViewProps {
  order: Order;
  onRetry?: () => void;
  onCancel?: () => void;
}

const TimeoutView = ({ order, onRetry, onCancel }: TimeoutViewProps) => {
  return (
    <Card className="border-yellow-200 overflow-hidden">
      <div className="h-1.5 bg-yellow-500" />
      
      <CardContent className="p-6 space-y-5">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 flex items-center justify-center mb-3">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 mb-2">
            <Clock size={12} className="mr-1" />
            Hết thời gian
          </Badge>
          <h3 className="text-lg font-bold text-foreground">
            Không tìm được Tasker
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Rất tiếc, không có Tasker nào nhận đơn trong thời gian cho phép. Bạn có thể thử lại hoặc chọn khung giờ khác.
          </p>
        </div>

        {/* Order summary */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dịch vụ</span>
            <span className="font-medium text-foreground">{order.service}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Thời gian</span>
            <span className="text-foreground">{order.date} • {formatTime(order.startTime)} - {formatTime(order.endTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Giá</span>
            <span className="font-medium text-foreground">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.price)}
            </span>
          </div>
        </div>

        {/* Suggestions */}
        <div className="p-3 bg-primary/5 rounded-xl">
          <p className="text-xs font-medium text-primary mb-2">💡 Gợi ý:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Thử đặt vào khung giờ khác</li>
            <li>• Đặt trước ít nhất 1 ngày để tăng tỷ lệ nhận đơn</li>
            <li>• Điều chỉnh giá cao hơn để thu hút Tasker</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {onCancel && (
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              Hủy đơn
            </Button>
          )}
          {onRetry && (
            <Button variant="hero" className="flex-1" onClick={onRetry}>
              <Search size={16} className="mr-2" />
              Tìm lại Tasker
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeoutView;
