import { useEffect, useMemo, useState } from "react";
import { Star, Phone, MessageSquare, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useUnreadMessagesStore from "@/hooks/useUnreadMessages";
import { Order } from "./types";

interface InProgressViewProps {
  order: Order;
  progress?: number;
  estimatedMinutes?: number;
  onChat?: () => void;
  onCall?: () => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const formatMinutesRemaining = (minutes: number) => {
  if (minutes <= 0) return "vừa xong";
  if (minutes < 60) return `${minutes} phút nữa`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours} giờ ${remainingMinutes} phút nữa`
    : `${hours} giờ nữa`;
};

const InProgressView = ({
  order,
  progress,
  estimatedMinutes,
  onChat,
  onCall,
}: InProgressViewProps) => {
  const tasker = order.tasker;
  const [now, setNow] = useState(() => Date.now());
  const unreadCount = useUnreadMessagesStore(
    (state) => state.unreadCounts[order._id] || 0,
  );

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const progressState = useMemo(() => {
    const startMs = new Date(order.startTime).getTime();
    const endMs = new Date(order.endTime).getTime();

    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return {
        value: typeof progress === "number" ? clamp(progress, 0, 100) : 60,
        remainingMinutes:
          typeof estimatedMinutes === "number" ? Math.max(0, estimatedMinutes) : 45,
      };
    }

    const totalMs = endMs - startMs;
    const elapsedMs = clamp(now - startMs, 0, totalMs);
    const percent = clamp((elapsedMs / totalMs) * 100, 0, 100);
    const remainingMinutes = Math.max(0, Math.ceil((endMs - now) / 60000));

    return {
      value: percent,
      remainingMinutes,
    };
  }, [now, order.startTime, order.endTime, progress, estimatedMinutes]);

  return (
    <Card className="overflow-hidden border-green-200">
      <div className="h-1.5 bg-green-500" />

      <CardContent className="space-y-5 p-6">
        <div className="text-center">
          <Badge className="mb-3 border-green-200 bg-green-100 text-green-700">
            <Loader2 size={12} className="mr-1 animate-spin" />
            Đang thực hiện
          </Badge>
          <h3 className="text-lg font-bold text-foreground">{order.service}</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tiến độ</span>
            <span className="font-medium text-foreground">
              {Math.round(progressState.value)}%
            </span>
          </div>
          <Progress value={progressState.value} className="h-2" />
        </div>

        <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 p-3 dark:bg-green-500/10">
          <Clock size={16} className="text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            Còn {formatMinutesRemaining(progressState.remainingMinutes)}
          </span>
        </div>

        {tasker && (
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={tasker.avatar} alt={tasker.name} />
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-primary font-bold text-primary-foreground">
                {tasker.name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part: string) => part[0])
                  .join("")
                  .toUpperCase() || tasker.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {tasker.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star size={12} className="fill-yellow-500 text-yellow-500" />
                <span>{tasker.rating}</span>
                <span>•</span>
                <span>{tasker.completedJobs} đơn</span>
              </div>
            </div>
            <div className="flex gap-1.5">
              {onCall && (
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={onCall}>
                  <Phone size={14} />
                </Button>
              )}
              {onChat && (
                <Button
                  variant="outline"
                  size="sm"
                  className="relative inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap px-3"
                  onClick={onChat}
                >
                  <MessageSquare size={14} className="shrink-0" />
                  <span>Nhắn tin</span>
                  {unreadCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InProgressView;
