import { useEffect, useMemo, useState } from "react";
import { Star, Phone, MessageSquare, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    <Card className="border-green-200 overflow-hidden">
      <div className="h-1.5 bg-green-500" />
      
      <CardContent className="p-6 space-y-5">
        <div className="text-center">
          <Badge className="bg-green-100 text-green-700 border-green-200 mb-3">
            <Loader2 size={12} className="mr-1 animate-spin" />
            Đang thực hiện
          </Badge>
          <h3 className="text-lg font-bold text-foreground">
            {order.service}
          </h3>
        </div>

        {/* Progress steps */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tiến độ</span>
            <span className="font-medium text-foreground">
              {Math.round(progressState.value)}%
            </span>
          </div>
          <Progress value={progressState.value} className="h-2" />
        </div>

        {/* Time estimate */}
        <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-500/10 rounded-xl">
          <Clock size={16} className="text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            Còn {formatMinutesRemaining(progressState.remainingMinutes)}
          </span>
        </div>

        {/* Tasker info compact */}
        {tasker && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={tasker.avatar} alt={tasker.name} />
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-primary text-primary-foreground font-bold">
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
              <p className="font-semibold text-foreground text-sm truncate">{tasker.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                <span>{tasker.rating}</span>
                <span>•</span>
                <span>{tasker.completedJobs} đơn</span>
              </div>
            </div>
            <div className="flex gap-1.5">
              {onCall && (
                <Button variant="outline" size="icon" className="w-9 h-9" onClick={onCall}>
                  <Phone size={14} />
                </Button>
              )}
              {onChat && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  onClick={onChat}
                >
                  <MessageSquare size={14} className="shrink-0" />
                  <span>Nhắn tin</span>
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
