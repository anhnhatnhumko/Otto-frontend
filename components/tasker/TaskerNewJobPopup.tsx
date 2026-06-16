import { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Job } from "./taskerTypes";
import { calculateCountdown } from "./countdownUtils";
import { formatCurrency } from "./taskerUtils";

interface TaskerNewJobPopupProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: (jobId: string) => void;
  onReject: () => void;
}

const TaskerNewJobPopup = ({
  job,
  open,
  onOpenChange,
  onAccept,
  onReject,
}: TaskerNewJobPopupProps) => {
  const [countdown, setCountdown] = useState(() =>
    calculateCountdown(job?.offerExpiresAt),
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const updateCountdown = () => {
      setCountdown(calculateCountdown(job?.offerExpiresAt));
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(timer);
  }, [job?.offerExpiresAt, open]);

  if (!job) {
    return null;
  }

  const details = [
    { icon: User, value: job.customer },
    { icon: Phone, value: job.phone },
    { icon: MapPin, value: job.address },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center animate-pulse">
              <Bell className="text-primary-foreground" size={24} />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="text-primary" size={18} />
                Đơn hàng mới!
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Vừa có đơn hàng mới dành cho bạn
              </p>
            </div>
          </div>

          <DialogDescription asChild>
            <div className="space-y-4 pt-2">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-semibold text-foreground text-lg">
                    {job.service}
                  </h4>
                  <Badge className="bg-primary">{job.id}</Badge>
                </div>

                <div className="grid gap-2 text-sm">
                  {details.map(({ icon: Icon, value }) => (
                    <div
                      key={`${job.id}-${value}`}
                      className="flex items-center gap-2 text-foreground"
                    >
                      <Icon size={14} className="text-muted-foreground" />
                      <span>{value}</span>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 text-foreground">
                    <Calendar size={14} className="text-muted-foreground" />
                    <span>{job.date}</span>
                    <Clock size={14} className="text-muted-foreground ml-2" />
                    <span>{job.time}</span>
                  </div>
                </div>

                {job.notes ? (
                  <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">
                    <span className="font-medium">Ghi chú:</span> {job.notes}
                  </div>
                ) : null}

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">Thu nhập:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(job.price)}
                  </span>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Bạn có muốn nhận đơn hàng này không?
              </p>

              <div
                className={`text-center rounded-lg p-3 font-semibold text-sm flex items-center justify-center gap-2 ${
                  countdown.isExpired
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : countdown.total.seconds <= 60
                      ? "bg-red-50 text-red-600 border border-red-200 animate-pulse"
                      : countdown.total.seconds <= 300
                        ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                        : "bg-blue-50 text-blue-600 border border-blue-200"
                }`}
              >
                <Clock size={16} />
                <span>
                  {countdown.isExpired
                    ? "Đã hết hạn"
                    : `Còn lại: ${countdown.formatted}`}
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-row gap-3 sm:gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onReject}
            disabled={countdown.isExpired}
          >
            <XCircle size={16} className="mr-2" />
            Từ chối
          </Button>
          <Button
            variant="hero"
            className="flex-1"
            onClick={() => onAccept(job.id)}
            disabled={countdown.isExpired}
          >
            <CheckCircle2 size={16} className="mr-2" />
            Nhận việc
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskerNewJobPopup;
