import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  User,
} from "lucide-react";
import useUnreadMessagesStore from "@/hooks/useUnreadMessages";
import { Job } from "./taskerTypes";
import { formatCurrency, getStatusBadge } from "./taskerUtils";

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

      timeDisplay =
        hoursAfterDays > 0
          ? minsAfterDays > 0
            ? `${remainingDays} ngày ${hoursAfterDays} giờ ${minsAfterDays} phút`
            : `${remainingDays} ngày ${hoursAfterDays} giờ`
          : minsAfterDays > 0
            ? `${remainingDays} ngày ${minsAfterDays} phút`
            : `${remainingDays} ngày`;
    } else if (remainingHours > 0) {
      timeDisplay =
        remainingMins > 0
          ? `${remainingHours} giờ ${remainingMins} phút`
          : `${remainingHours} giờ`;
    } else {
      timeDisplay = `${remainingMinutes} phút`;
    }

    return {
      allowed: false,
      message: `Bắt đầu sau ${timeDisplay}`,
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
    return `Còn ${remainingMinutes} phút nữa đến giờ làm`;
  }

  return null;
};

const TaskerJobCard = ({
  job,
  onDetail,
  onChat,
  onStart,
  onComplete,
}: TaskerJobCardProps) => {
  const [startStatus, setStartStatus] = useState(canStartJob(job));
  const warningMessage = getStartWarning(job);
  const rating = typeof job.rating === "number" ? job.rating : 0;
  const unreadCount = useUnreadMessagesStore(
    (state) => state.unreadCounts[job.id] || 0,
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStartStatus(canStartJob(job));
    }, 60000);

    return () => {
      window.clearInterval(interval);
    };
  }, [job]);

  return (
    <div className="rounded-3xl border border-border/70 bg-card/95 p-4 shadow-sm transition-shadow hover:shadow-md md:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{job.service}</h3>
              {getStatusBadge(job.status)}
            </div>
          </div>
          <p className="shrink-0 text-2xl font-bold text-emerald-600 dark:text-emerald-300">
            {formatCurrency(job.price)}
          </p>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <User size={15} className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <span className="break-words">{job.customer}</span>
              {job.status === "IN_PROGRESS" && job.phone && (
                <div className="mt-1 flex items-center gap-2 text-foreground/85 dark:text-slate-200">
                  <Phone size={14} className="shrink-0" />
                  <span className="break-all">{job.phone}</span>
                </div>
              )}
            </div>
          </div>

          {job.status !== "IN_PROGRESS" && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="shrink-0" />
                <span>{job.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={15} className="shrink-0" />
                <span>{job.time}</span>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2">
            <MapPin size={15} className="mt-0.5 shrink-0" />
            <span className="break-words">{job.address}</span>
          </div>

          {job.status === "IN_PROGRESS" && job.notes && (
            <div className="rounded-2xl border border-border/60 bg-muted/40 px-3 py-2 text-foreground dark:bg-slate-900/50">
              {job.notes}
            </div>
          )}
        </div>

        {job.status === "COMPLETED" && rating > 0 && (
          <div className="rounded-2xl border border-border/60 bg-muted/40 p-3 dark:bg-slate-900/50">
            <div className="mb-1 flex items-center gap-2">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  size={14}
                  className={
                    index < rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/40"
                  }
                />
              ))}
              <span className="text-sm font-medium text-foreground">{rating}/5</span>
            </div>
            {job.review && (
              <p className="text-sm text-muted-foreground dark:text-slate-300">
                &quot;{job.review}&quot;
              </p>
            )}
          </div>
        )}

        {job.status === "ASSIGNED" && (
          <div className="space-y-3">
            {warningMessage && (
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-800 dark:text-amber-200">
                {warningMessage}
              </div>
            )}

            <div className="space-y-2 lg:hidden">
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChat?.(job)}
                  className="relative h-11 w-full"
                >
                  <MessageCircle size={14} />
                  <span>Nhắn tin</span>
                  {unreadCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDetail?.(job)}
                  className="h-11 w-full"
                >
                  Chi tiết
                </Button>
              </div>

              <Button
                variant="hero"
                size="sm"
                disabled={!startStatus.allowed}
                title={startStatus.message}
                onClick={() => onStart?.(job.id)}
                className="h-auto min-h-11 w-full whitespace-normal px-4 py-3 text-sm leading-snug disabled:bg-muted disabled:text-foreground disabled:opacity-100 dark:disabled:bg-slate-800"
              >
                {startStatus.allowed ? "Bắt đầu làm việc" : startStatus.message}
              </Button>
            </div>

            <div className="hidden lg:flex lg:flex-wrap lg:items-center lg:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChat?.(job)}
                className="relative"
              >
                <div className="flex items-center gap-1">
                  <MessageCircle size={14} />
                  <span>Nhắn tin</span>
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
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
                className="px-4 disabled:bg-muted disabled:text-foreground disabled:opacity-100 dark:disabled:bg-slate-800"
              >
                {startStatus.allowed ? "Bắt đầu làm việc" : startStatus.message}
              </Button>
            </div>
          </div>
        )}

        {job.status === "IN_PROGRESS" && (
          <div className="grid grid-cols-1 gap-2 sm:flex sm:justify-end">
            <Button
              variant="hero"
              size="sm"
              onClick={() => onComplete?.(job.id)}
              className="h-11 w-full sm:w-auto"
            >
              <CheckCircle2 size={14} className="mr-1" />
              Hoàn thành
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskerJobCard;
