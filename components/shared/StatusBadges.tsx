import { Badge } from "@/components/ui/badge";

interface StatusConfig {
  label: string;
  className: string;
}

const ORDER_STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: { label: "Chờ xác nhận", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  confirmed: { label: "Đã nhận đơn", className: "bg-blue-100 text-blue-800 border-blue-200" },
  in_progress: { label: "Đang thực hiện", className: "bg-purple-100 text-purple-800 border-purple-200" },
  completed: { label: "Hoàn thành", className: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-800 border-red-200" },
};

const USER_STATUS_CONFIG: Record<string, StatusConfig> = {
  active: { label: "Hoạt động", className: "bg-green-100 text-green-800 border-green-200" },
  inactive: { label: "Không hoạt động", className: "bg-gray-100 text-gray-800 border-gray-200" },
  banned: { label: "Đã khóa", className: "bg-red-100 text-red-800 border-red-200" },
};

const TASKER_STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: { label: "Chờ duyệt", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  active: { label: "Đang hoạt động", className: "bg-green-100 text-green-800 border-green-200" },
  inactive: { label: "Tạm nghỉ", className: "bg-gray-100 text-gray-800 border-gray-200" },
  banned: { label: "Đã khóa", className: "bg-red-100 text-red-800 border-red-200" },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const config = ORDER_STATUS_CONFIG[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

export function UserStatusBadge({ status }: { status: string }) {
  const config = USER_STATUS_CONFIG[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

export function ServiceStatusBadge({ status }: { status: string }) {
  return status === "active" ? (
    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
      Hoạt động
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
      Tạm dừng
    </Badge>
  );
}

export function TaskerStatusBadge({ status }: { status: string }) {
  const config = TASKER_STATUS_CONFIG[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
