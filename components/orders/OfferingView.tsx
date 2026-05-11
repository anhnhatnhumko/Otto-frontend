import { Star, Clock, CreditCard, X, Briefcase, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Order } from "./types";

interface OfferingViewProps {
  order: Order;
  onAccept?: () => void;
  onReject?: () => void;
}

const OfferingView = ({ order, onAccept, onReject }: OfferingViewProps) => {
  const tasker = order.tasker;

  return (
    <Card className="border-primary/20 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-primary to-primary/60" />
      
      <CardContent className="p-6 space-y-5">
        <div className="text-center">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">
            <CheckCircle2 size={12} className="mr-1" />
            XÁC NHẬN
          </Badge>
          <h3 className="text-lg font-bold text-foreground">
            Tasker đã hoàn thành công việc!
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Vui lòng xác nhận và thanh toán để hoàn tất đơn hàng
          </p>
        </div>

        {/* Tasker info */}
        {tasker && (
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 shrink-0">
                <AvatarImage src={tasker.avatar} alt={tasker.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xl font-bold">
                  {tasker.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part: string) => part[0])
                    .join("")
                    .toUpperCase() || tasker.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate">{tasker.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-sm">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-medium text-foreground">{tasker.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Briefcase size={14} />
                    <span>{tasker.completedJobs} đơn</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order info */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dịch vụ</span>
            <span className="font-medium text-foreground">{order.service}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Thời gian</span>
            <span className="font-medium text-foreground">{order.date} • {order.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tổng thanh toán</span>
            <span className="font-bold text-primary">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.price)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {onReject && (
            <Button variant="outline" className="flex-1" onClick={onReject}>
              <X size={16} className="mr-2" />
              Từ chối
            </Button>
          )}
          
            <Button variant="hero" className="flex-1" onClick={onAccept}>
              <CreditCard size={16} className="mr-2" />
              Xác nhận hoàn thành 
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfferingView;
