import { Badge } from "@/components/ui/badge";

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export const formatTime = (date: string | Date) => {
  const d = new Date(date);

  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600"></Badge>;
    case "in_progress":
      return <Badge className="bg-blue-500">Đang thực hiện</Badge>;
    case "completed":
      return <Badge className="bg-green-500">Hoàn thành</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Đã hủy</Badge>;
    default:
      return null;
  }
};
