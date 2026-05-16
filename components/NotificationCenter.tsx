import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, X, CheckCheck, Eye } from 'lucide-react';

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const time = new Date(date);
  const diff = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return time.toLocaleDateString('vi-VN');
};

export const NotificationCenter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (notification: {
    _id: string;
    type?: string;
    orderId?: string;
    isRead: boolean;
  }) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    const orderId = String(notification.orderId ?? '');
    if (!orderId) return;

    const isTaskerPath = pathname.startsWith('/tasker');
    const isChat = String(notification.type ?? '').toLowerCase() === 'chat_message';

    setIsOpen(false);

    if (isTaskerPath) {
      if (isChat) {
        router.push(`/tasker/dashboard?chat=true&orderId=${orderId}`);
        return;
      }
      router.push('/tasker/dashboard');
      return;
    }

    if (isChat) {
      router.push(`/orders/${orderId}?chat=true`);
      return;
    }

    router.push(`/orders/${orderId}`);
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'order_accepted':
        return '✅';
      case 'order_completed':
        return '🎉';
      case 'order_cancelled':
        return '❌';
      case 'payment_received':
        return '💰';
      case 'chat_message':
        return '💬';
      case 'refund':
        return '💸';
      default:
        return '🔔';
    }
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
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Thông báo</h2>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Đánh dấu tất cả
              </Button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Chưa có thông báo</p>
          </div>
        ) : (
          <div className="space-y-0">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <h3 className="font-medium text-sm line-clamp-2">
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                      {notification.content}
                    </p>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
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
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
