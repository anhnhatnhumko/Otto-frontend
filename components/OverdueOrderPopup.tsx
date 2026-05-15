import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, MapPin, Star, Phone, XCircle, CheckCircle2 } from "lucide-react";
export interface OverdueOrderInfo {
  orderId: string;
  service: string;
  date: string;
  time: string;
  address: string;
  taskerName: string;
  taskerRating: number;
  overdueMinutes: number;
}
interface OverdueOrderPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  info: OverdueOrderInfo | null;
  onKeep: () => void;
  onCancel: () => void;
  onCallTasker?: () => void;
}
const OverdueOrderPopup = ({ open, onOpenChange, info, onKeep, onCancel, onCallTasker }: OverdueOrderPopupProps) => {
  if (!info) return null;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] md:max-w-md mx-auto rounded-2xl">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-yellow-100 flex items-center justify-center animate-in zoom-in-50 duration-300">
                <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-yellow-600" />
              </div>
              <span className="absolute inset-0 rounded-full bg-yellow-300/30 animate-ping" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-lg md:text-xl">
            ⏰ Đơn hàng đã quá giờ hẹn
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm">
            Tasker đã nhận đơn nhưng chưa bắt đầu sau{" "}
            <span className="font-semibold text-yellow-700">{info.overdueMinutes} phút</span> so với giờ hẹn.
            Bạn muốn tiếp tục giữ đơn hay hủy?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground text-lg font-bold shrink-0">
              {info.taskerName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-sm">{info.taskerName}</h4>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span>{info.taskerRating}</span>
              </div>
            </div>
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
              <Clock size={12} className="mr-1" />
              Quá hạn
            </Badge>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Mã đơn:</span>
              <span className="font-medium text-foreground text-xs">#{info.orderId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Dịch vụ:</span>
              <span className="font-medium text-foreground text-xs">{info.service}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Giờ hẹn:</span>
              <span className="font-medium text-foreground text-xs">{info.date} • {info.time}</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="text-muted-foreground text-xs shrink-0">Địa chỉ:</span>
              <span className="font-medium text-foreground text-xs text-right flex items-start gap-1">
                <MapPin size={12} className="mt-0.5 shrink-0" />
                {info.address}
              </span>
            </div>
          </div>
          {onCallTasker && (
            <Button variant="outline" className="w-full h-10" onClick={onCallTasker}>
              <Phone size={14} className="mr-2" />
              Gọi Tasker để kiểm tra
            </Button>
          )}
        </div>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1 h-11 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={onCancel}
          >
            <XCircle size={16} className="mr-2" />
            Hủy đơn
          </Button>
          <Button variant="hero" className="flex-1 h-11" onClick={onKeep}>
            <CheckCircle2 size={16} className="mr-2" />
            Giữ đơn
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
export default OverdueOrderPopup;