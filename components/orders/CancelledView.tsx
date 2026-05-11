import { XCircle, RotateCcw, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Order } from "./types";

interface CancelledViewProps {
  order: Order;
  onRebook?: () => void;
  onSupport?: () => void;
}

const CancelledView = ({ order, onRebook, onSupport }: CancelledViewProps) => {
  return (
    <Card className="border-destructive/20 overflow-hidden">
      <div className="h-1.5 bg-destructive" />
      
      <CardContent className="p-6 space-y-5">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <Badge variant="destructive" className="mb-2">
            Đã hủy
          </Badge>
          <h3 className="text-lg font-bold text-foreground">{order.service}</h3>
          <p className="text-sm text-muted-foreground mt-1">{order.date} • {order.time}</p>
        </div>

        {/* Cancel reason */}
        {order.cancelReason && (
          <div className="bg-destructive/5 rounded-xl p-4">
            <p className="text-sm font-medium text-foreground mb-1">Lý do hủy</p>
            <p className="text-sm text-muted-foreground">{order.cancelReason}</p>
          </div>
        )}

        {/* Order summary */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mã đơn</span>
            <span className="font-mono text-foreground">{order._id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dịch vụ</span>
            <span className="text-foreground">{order.service}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Giá</span>
            <span className="text-foreground line-through">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.price)}
            </span>
          </div>
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>Hoàn tiền</span>
            <span className="font-medium">Đã hoàn 100%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {onSupport && (
            <Button variant="outline" className="flex-1" onClick={onSupport}>
              <HelpCircle size={16} className="mr-2" />
              Hỗ trợ
            </Button>
          )}
          {onRebook && (
            <Button variant="default" className="flex-1" onClick={onRebook}>
              <RotateCcw size={16} className="mr-2" />
              Đặt lại
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CancelledView;
