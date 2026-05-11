import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Phone, MapPin, Calendar, DollarSign, XCircle, CheckCircle2 } from "lucide-react";
import { Job } from "./taskerTypes";
import { formatCurrency, getStatusBadge } from "./taskerUtils";

interface TaskerJobDetailDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: (jobId: string) => void;
  onReject: (jobId: string) => void;
}

const TaskerJobDetailDialog = ({ job, open, onOpenChange, onAccept, onReject }: TaskerJobDetailDialogProps) => {
  if (!job) return null;

  const details = [
    { icon: User, label: "Khách hàng", value: job.customer },
    { icon: Phone, label: "Điện thoại", value: job.phone },
    { icon: MapPin, label: "Địa chỉ", value: job.address },
    { icon: Calendar, label: "Thời gian", value: `${job.date} • ${job.time}` },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chi tiết công việc</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">{job.service}</span>
            {getStatusBadge(job.status)}
          </div>

          <div className="space-y-3">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="font-medium text-foreground">{value}</p>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3">
              <DollarSign size={18} className="text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Giá dịch vụ</p>
                <p className="font-bold text-primary text-lg">{formatCurrency(job.price)}</p>
              </div>
            </div>
          </div>

          {job.notes && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Ghi chú:</p>
              <p className="text-foreground">{job.notes}</p>
            </div>
          )}

          {/* {job.status === "ASSIGNED" && (
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => onReject(job.id)}>
                <XCircle size={16} className="mr-2" />
                Từ chối
              </Button>
              <Button variant="hero" className="flex-1" onClick={() => onAccept(job.id)}>
                <CheckCircle2 size={16} className="mr-2" />
                Nhận việc
              </Button>
            </div>
          )} */}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskerJobDetailDialog;
