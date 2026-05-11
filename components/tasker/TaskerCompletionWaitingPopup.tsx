import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Job } from "./taskerTypes";
import { formatCurrency } from "./taskerUtils";
interface TaskerCompletionWaitingPopupProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}
const TaskerCompletionWaitingPopup = ({
  job,
  open,
  onOpenChange,
  onClose,
}: TaskerCompletionWaitingPopupProps) => {
  if (!job) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center space-y-4">
          {/* Success icon */}
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            Đã gửi xác nhận hoàn thành!
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Công việc <span className="font-medium text-foreground">"{job.service}"</span> đã được gửi xác nhận. Vui lòng đợi khách hàng xác nhận để nhận thanh toán.
              </p>
              {/* Waiting indicator */}
              <div className="flex items-center justify-center gap-2 py-3 px-4 bg-muted/50 rounded-lg">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Đang đợi khách hàng xác nhận...
                </span>
              </div>
              {/* Earnings summary */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-sm text-muted-foreground mb-1">Thu nhập dự kiến</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(job.price)}
                </p>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  Thanh toán sẽ được chuyển vào ví sau khi khách hàng xác nhận hoàn thành.
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <Button variant="outline" className="w-full mt-2" onClick={onClose}>
          Đã hiểu
        </Button>
      </DialogContent>
    </Dialog>
  );
};
export default TaskerCompletionWaitingPopup;