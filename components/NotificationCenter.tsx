"use client";

import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BadgeCheck,
  Bell,
  BellRing,
  CheckCheck,
  CircleDollarSign,
  Eye,
  MessageCircleMore,
  PartyPopper,
  ShieldX,
  X,
} from "lucide-react";

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const time = new Date(date);
  const diff = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return time.toLocaleDateString("vi-VN");
};

const getNotificationIcon = (type?: string) => {
  switch (String(type ?? "").toLowerCase()) {
    case "order_accepted":
      return BadgeCheck;
    case "order_completed":
      return PartyPopper;
    case "order_cancelled":
      return ShieldX;
    case "payment_received":
    case "refund":
      return CircleDollarSign;
    case "chat_message":
      return MessageCircleMore;
    default:
      return BellRing;
  }
};

export const NotificationCenter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    notifications,
    unreadCount,
    hasIdentity,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  if (!hasIdentity && !isLoading) {
    return null;
  }

  const handleNotificationClick = (notification: {
    _id: string;
    type?: string;
    orderId?: string;
    isRead: boolean;
  }) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    const orderId = String(notification.orderId ?? "");
    if (!orderId) {
      setIsOpen(false);
      return;
    }

    const isTaskerPath = pathname.startsWith("/tasker");
    const isChat =
      String(notification.type ?? "").toLowerCase() === "chat_message";

    setIsOpen(false);

    if (isTaskerPath) {
      router.push(
        isChat
          ? `/tasker/dashboard?chat=true&orderId=${orderId}`
          : "/tasker/dashboard",
      );
      return;
    }

    router.push(isChat ? `/orders/${orderId}?chat=true` : `/orders/${orderId}`);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Thông báo"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="max-h-96 w-96 overflow-y-auto">
        <div className="border-b p-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Thông báo</h2>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Đánh dấu tất cả
              </Button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>Chưa có thông báo</p>
          </div>
        ) : (
          <div className="space-y-0">
            {notifications.map((notification) => {
              const isCancelled = notification.type === "order_cancelled";
              const unreadClass = !notification.isRead
                ? isCancelled
                  ? "bg-red-50 dark:bg-red-500/10"
                  : "bg-blue-50 dark:bg-blue-500/10"
                : "";
              const dotClass = isCancelled ? "bg-red-500" : "bg-blue-500";
              const Icon = getNotificationIcon(notification.type);

              return (
                <div
                  key={notification._id}
                  className={`cursor-pointer border-b p-3 transition-colors hover:bg-muted last:border-b-0 ${unreadClass}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Icon className="h-4 w-4" />
                        </span>
                        <h3 className="line-clamp-2 text-sm font-medium">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className={`h-2 w-2 flex-shrink-0 rounded-full ${dotClass}`} />
                        )}
                      </div>
                      <p className="mb-1 line-clamp-2 text-xs text-muted-foreground">
                        {notification.content}
                      </p>
                      <span className="text-xs text-muted-foreground opacity-75">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>

                    <div className="flex flex-shrink-0 gap-1">
                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(event) => {
                            event.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          title="Đánh dấu đã đọc"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        title="Xóa"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
