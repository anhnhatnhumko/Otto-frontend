import { Badge } from "@/components/ui/badge";

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export const formatTime = (date: string | Date) => {
  const value = new Date(date);

  return value.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getStatusBadge = (status: string) => {
  const normalizedStatus = String(status ?? "").toUpperCase();

  switch (normalizedStatus) {
    case "SEARCHING":
      return (
        <Badge className="border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200">
          Đang chờ
        </Badge>
      );
    case "ASSIGNED":
      return (
        <Badge className="border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-200">
          Đã nhận
        </Badge>
      );
    case "IN_PROGRESS":
      return (
        <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
          Đang thực hiện
        </Badge>
      );
    case "WAITING_CONFIRMATION":
      return (
        <Badge className="border border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-200">
          Chờ xác nhận
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge className="border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-200">
          Hoàn thành
        </Badge>
      );
    case "TIMEOUT":
      return (
        <Badge className="border border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-200">
          Quá hạn
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge className="border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200">
          Đã hủy
        </Badge>
      );
    default:
      return null;
  }
};
