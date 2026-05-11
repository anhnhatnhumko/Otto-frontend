import { requireApiUrl } from "@/lib/api-url";

export const API_URL = requireApiUrl();

export const CHART_COLORS = [
  "hsl(210, 70%, 55%)",
  "hsl(340, 65%, 55%)",
  "hsl(45, 93%, 47%)",
  "hsl(142, 71%, 45%)",
  "hsl(215, 15%, 45%)",
  "hsl(24, 95%, 53%)",
  "hsl(262, 83%, 58%)",
];

export const MOCK_REVENUE_DATA = [
  { name: "T1", revenue: 12000000 },
  { name: "T2", revenue: 15000000 },
  { name: "T3", revenue: 18000000 },
  { name: "T4", revenue: 14000000 },
  { name: "T5", revenue: 22000000 },
  { name: "T6", revenue: 25000000 },
  { name: "T7", revenue: 28000000 },
];

export const MOCK_ORDERS_BY_SERVICE = [
  { name: "Dọn dẹp", value: 156, color: "hsl(210, 70%, 55%)" },
  { name: "Giặt ủi", value: 89, color: "hsl(340, 65%, 55%)" },
  { name: "Nấu ăn", value: 45, color: "hsl(45, 93%, 47%)" },
  { name: "Chăm sóc", value: 32, color: "hsl(142, 71%, 45%)" },
  { name: "Khác", value: 90, color: "hsl(215, 15%, 45%)" },
];

export const MOCK_DAILY_ORDERS = [
  { name: "T2", orders: 12 },
  { name: "T3", orders: 19 },
  { name: "T4", orders: 15 },
  { name: "T5", orders: 22 },
  { name: "T6", orders: 28 },
  { name: "T7", orders: 35 },
  { name: "CN", orders: 18 },
];

export const CONFIRM_DIALOG_CONTENT: Record<string, { title: string; description: string }> = {
  confirm_order: {
    title: "Xác nhận đơn hàng",
    description: "Bạn có chắc muốn xác nhận đơn hàng này?",
  },
  cancel_order: {
    title: "Hủy đơn hàng",
    description: "Bạn có chắc muốn hủy đơn hàng này? Hành động này không thể hoàn tác.",
  },
  complete_order: {
    title: "Hoàn thành đơn hàng",
    description: "Xác nhận đơn hàng đã được hoàn thành?",
  },
  ban_user: {
    title: "Khóa tài khoản",
    description: "Bạn có chắc muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập.",
  },
  activate_user: {
    title: "Kích hoạt tài khoản",
    description: "Bạn có chắc muốn kích hoạt tài khoản này?",
  },
  delete_service: {
    title: "Xóa dịch vụ",
    description: "Bạn có chắc muốn xóa dịch vụ này? Hành động này không thể hoàn tác.",
  },
  approve_tasker: {
    title: "Duyệt Tasker",
    description: "Bạn có chắc muốn duyệt và kích hoạt Tasker này?",
  },
  reject_tasker: {
    title: "Từ chối Tasker",
    description: "Bạn có chắc muốn từ chối đơn đăng ký này? Hành động này không thể hoàn tác.",
  },
  ban_tasker: {
    title: "Khóa Tasker",
    description: "Bạn có chắc muốn khóa tài khoản Tasker này?",
  },
  activate_tasker: {
    title: "Kích hoạt Tasker",
    description: "Bạn có chắc muốn kích hoạt lại tài khoản Tasker này?",
  },
};
