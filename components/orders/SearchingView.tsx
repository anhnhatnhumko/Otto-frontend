import { Loader2, MapPin, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Order } from "./types";

interface SearchingViewProps {
  order: Order;
  onCancel?: () => void;
}

const SearchingView = ({ order, onCancel }: SearchingViewProps) => {
  return (
    <Card className="border-primary/20 overflow-hidden">
      {/* Animated top bar */}
      <div className="h-1.5 bg-muted overflow-hidden">
        <div className="h-full w-1/3 bg-primary rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" 
          style={{ animation: "shimmer 1.5s ease-in-out infinite alternate" }} />
      </div>
      
      <CardContent className="p-6 text-center space-y-5">
        {/* Pulsing search animation */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-primary/20 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">
            Đang tìm Tasker cho bạn...
          </h3>
          <p className="text-sm text-muted-foreground">
            Chúng tôi đang tìm kiếm Tasker phù hợp với yêu cầu của bạn. Vui lòng chờ trong giây lát.
          </p>
        </div>

        {/* Order summary */}
        <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
          <p className="font-semibold text-foreground">{order.service}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock size={14} />
            <span>{order.date} • {order.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={14} />
            <span>{order.address}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Thời gian tìm kiếm trung bình: 2-5 phút
        </p>

        {onCancel && (
          <Button variant="outline" className="w-full" onClick={onCancel}>
            <X size={16} className="mr-2" />
            Hủy tìm kiếm
          </Button>
        )}
      </CardContent>

      <style>{`
        @keyframes shimmer {
          from { transform: translateX(-100%); }
          to { transform: translateX(300%); }
        }
      `}</style>
    </Card>
  );
};

export default SearchingView;
