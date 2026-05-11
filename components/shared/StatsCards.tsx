import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingCart,
  CheckCircle,
  DollarSign,
  UserCheck,
  UserCog,
  Award,
  Star,
} from "lucide-react";
import { formatCurrency } from "@/app/admin/dashboard/utils";
import type { Order, User, Service, Tasker } from "@/app/admin/dashboard/types";

interface StatsCardsProps {
  orders: Order[];
  users: User[];
  services: Service[];
  taskers: Tasker[];
}

export function StatsCards({ orders, users, services, taskers }: StatsCardsProps) {
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.amount, 0);
  const activeUsers = users.filter((u) => u.status === "active").length;
  const activeServices = services.filter((s) => s.status === "active").length;
  const activeTaskers = taskers.filter((t) => t.status === "active").length;
  const pendingTaskers = taskers.filter((t) => t.status === "pending").length;
  const verifiedTaskers = taskers.filter((t) => t.verified).length;
  const ratedTaskers = taskers.filter((t) => t.rating > 0);
  const avgRating = ratedTaskers.length
    ? ratedTaskers.reduce((sum, t) => sum + t.rating, 0) / ratedTaskers.length
    : 0;
  // Tính thu nhập Tasker dựa trên `orders` (đã được lọc theo khoảng ngày ở DashboardTab)
  const totalTaskerEarnings = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + (o.amount ?? 0), 0);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng đơn hàng"
          value={totalOrders}
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
          subtitle={<span className="text-yellow-600">{pendingOrders} chờ xử lý</span>}
        />
        <StatCard
          title="Hoàn thành"
          value={completedOrders}
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          subtitle={`${totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}% tỷ lệ hoàn thành`}
        />
        <StatCard
          title="Doanh thu"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          subtitle="Tổng từ các đơn hoàn thành"
        />
        <StatCard
          title="Người dùng"
          value={activeUsers}
          icon={<UserCheck className="h-4 w-4 text-muted-foreground" />}
          subtitle={`${users.length} tổng • ${activeServices} dịch vụ`}
        />
        <StatCard
          title="Tasker đang hoạt động"
          value={activeTaskers}
          icon={<UserCog className="h-4 w-4 text-muted-foreground" />}
          subtitle={<span className="text-yellow-600">{pendingTaskers} chờ duyệt</span>}
        />

      {/* <div className="grid gap-4 md:grid-cols-3"> */}
        <StatCard
          title="Tổng Tasker"
          value={taskers.length}
          icon={<Award className="h-4 w-4 text-muted-foreground" />}
          subtitle={`${verifiedTaskers} đã xác minh`}
        />
        <StatCard
          title="Đánh giá TB"
          value={avgRating.toFixed(1)}
          icon={<Star className="h-4 w-4 text-yellow-500" />}
          subtitle="Trung bình đánh giá Tasker"
        />
        <StatCard
          title="Thu nhập Tasker"
          value={formatCurrency(totalTaskerEarnings)}
          icon={<DollarSign className="h-4 w-4 text-green-500" />}
          subtitle="Tổng thu nhập"
        />
      </div>
      {/* </div> */}
    </>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle: React.ReactNode;
}

function StatCard({ title, value, icon, subtitle }: StatCardProps) {
  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
