import { Button } from "@/components/ui/button";
import {
  Star,
  User,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { Job } from "./taskerTypes";
import { formatCurrency, getStatusBadge } from "./taskerUtils";
import { useState, useEffect } from "react";
import useUnreadMessagesStore from "@/hooks/useUnreadMessages";

interface TaskerJobCardProps {
  job: Job;
  onDetail?: (job: Job) => void;
  onChat?: (job: Job) => void;
  onAccept?: (jobId: string) => void;
  onStart?: (jobId: string) => void;
  onComplete?: (jobId: string) => void;
}

const canStartJob = (job: Job): { allowed: boolean; message?: string } => {
  if (!job.scheduleTime) return { allowed: true };

  const scheduleTime = new Date(job.scheduleTime).getTime();
  const endTime = job.endTime ? new Date(job.endTime).getTime() : null;
  const now = new Date().getTime();
  const oneHourBefore = scheduleTime - 60 * 60 * 1000;
  const fiveMinBefore = scheduleTime - 5 * 60 * 1000;

  if (now < oneHourBefore) {
    const remainingMs = oneHourBefore - now;
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    const remainingDays = Math.floor(remainingMinutes / (60 * 24));
    const remainingHours = Math.floor(remainingMinutes / 60);
    const remainingMins = remainingMinutes % 60;

    let timeDisplay = "";
    if (remainingDays > 0) {
      const hoursAfterDays = Math.floor((remainingMinutes % (60 * 24)) / 60);
      const minsAfterDays = remainingMinutes % 60;

      timeDisplay = hoursAfterDays > 0
        ? minsAfterDays > 0
          ? `${remainingDays} ngày ${hoursAfterDays} giờ ${minsAfterDays} phút`
          : `${remainingDays} ngày ${hoursAfterDays} giờ`
        : minsAfterDays > 0
          ? `${remainingDays} ngày ${minsAfterDays} phút`
          : `${remainingDays} ngày`;
    } else if (remainingHours > 0) {
      timeDisplay = remainingMins > 0
        ? `${remainingHours} giờ ${remainingMins} phút`
        : `${remainingHours} giờ`;
    } else {
      timeDisplay = `${remainingMinutes} phút`;
    }

    return {
      allowed: false,
      message: `Có thể bắt đầu sau ${timeDisplay}`,
    };
  }

  if (endTime && now > endTime) {
    return {
      allowed: false,
      message: "Quá hạn làm việc",
    };
  }

  return { allowed: true };
};

const getStartWarning = (job: Job): string | null => {
  if (!job.scheduleTime) return null;

  const scheduleTime = new Date(job.scheduleTime).getTime();
  const now = new Date().getTime();
  const fifteenMinBefore = scheduleTime - 15 * 60 * 1000;

  if (now >= fifteenMinBefore && now < scheduleTime) {
    const remainingMinutes = Math.ceil((scheduleTime - now) / (60 * 1000));
    return `⏰ Còn ${remainingMinutes}p`;
  }

  return null;
};

const TaskerJobCard = ({
  job,
  onDetail,
  onChat,
  onAccept,
  onStart,
  onComplete,
}: TaskerJobCardProps) => {
  const [startStatus, setStartStatus] = useState(canStartJob(job));
  const warningMessage = getStartWarning(job);
  // Use selector to avoid unnecessary re-renders
  const unreadCount = useUnreadMessagesStore((state) => state.unreadCounts[job.id] || 0);

  // Cập nhật status mỗi phút
  useEffect(() => {
    const interval = setInterval(() => {
      setStartStatus(canStartJob(job));
    }, 60000); // cập nhật mỗi phút

    return () => clearInterval(interval);
  }, [job]);

  return (
    <div className="bg-card rounded-xl p-4 md:p-6 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-foreground">{job.service}</h3>
            {getStatusBadge(job.status)}
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User size={14} />
              <span>{job.customer}</span>
              {job.status === "IN_PROGRESS" && (
                <>
                  <Phone size={14} className="ml-2" />
                  <span>{job.phone}</span>
                </>
              )}
            </div>
            {job.status !== "IN_PROGRESS" && (
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>{job.date}</span>
                <Clock size={14} className="ml-2" />
                <span>{job.time}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin size={14} />
              <span>{job.address}</span>
            </div>
            {job.status === "IN_PROGRESS" && job.notes && (
              <p className="mt-2 text-foreground">{job.notes}</p>
            )}
          </div>

          {/* Rating for completed jobs */}
          {job.status === "COMPLETED" && job.rating && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i < job.rating!
                        ? "fill-primary text-primary"
                        : "text-muted"
                    }
                  />
                ))}
                <span className="text-sm font-medium text-foreground">
                  {job.rating}/5
                </span>
              </div>
              {job.review && (
                <p className="text-sm text-muted-foreground">"{job.review}"</p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <p className="text-xl font-bold text-primary">
            {formatCurrency(job.price)}
          </p>

          {job.status === "ASSIGNED" && (
            <div className="flex gap-2 flex-col">
              {warningMessage && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-700">
                  {warningMessage}
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChat?.(job)}
                  className="relative"
                >
                  <div className="flex items-center gap-1">
                    <MessageCircle size={14} />
                    <span>Nhắn tin</span>
                    {unreadCount > 0 && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </div>
                    )}
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDetail?.(job)}
                >
                  Chi tiết
                </Button>
                <Button
                  variant="hero"
                  size="sm"
                  disabled={!startStatus.allowed}
                  title={startStatus.message}
                  onClick={() => onStart?.(job.id)}
                >
                  {startStatus.allowed ? "Bắt đầu làm việc" : startStatus.message}
                </Button>
              </div>
            </div>
          )}

          {job.status === "IN_PROGRESS" && (
            <div className="flex gap-2">
              {/* <Button variant="outline" size="sm">
                <Phone size={14} className="mr-1" />
                Gọi
              </Button>
              <Button variant="outline" size="sm">
                <Navigation size={14} className="mr-1" />
                Chỉ đường
              </Button> */}
              <Button
                variant="hero"
                size="sm"
                onClick={() => onComplete?.(job.id)}
              >
                <CheckCircle2 size={14} className="mr-1" />
                Hoàn thành
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskerJobCard;
