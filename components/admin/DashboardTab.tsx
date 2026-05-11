import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, X } from "lucide-react";
import { StatsCards } from "@/components/shared/StatsCards";
import { OrderStatusBadge } from "@/components/shared/StatusBadges";
import { formatCurrency } from "@/app/admin/dashboard/utils";
import type { Order, User, Service, Tasker } from "@/app/admin/dashboard/types";

interface DashboardTabProps {
  orders: Order[];
  users: User[];
  services: Service[];
  taskers: Tasker[];
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildRecentMonthOptions(baseDate: Date, count: number): string[] {
  const months: string[] = [];

  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    months.push(toMonthKey(date));
  }

  return months;
}

function getLatestOrderDate(orders: Order[]): Date | null {
  let latest: Date | null = null;

  for (const order of orders) {
    const raw =
      (order as any).createdAt ??
      (order as any).date ??
      (order as any).startTime;
    if (!raw) continue;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) continue;
    if (!latest || date > latest) latest = date;
  }

  return latest;
}

export function DashboardTab({
  orders,
  users,
  services,
  taskers,
}: DashboardTabProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [presetRange, setPresetRange] = useState<
    "all" | "7d" | "30d" | "month" | "custom"
  >("all");
  const latestMonth = useMemo(
    () => toMonthKey(getLatestOrderDate(orders) ?? new Date()),
    [orders],
  );
  const monthOptions = useMemo(
    () => buildRecentMonthOptions(getLatestOrderDate(orders) ?? new Date(), 12),
    [orders],
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(latestMonth);

  const applyPreset = (type: "7d" | "30d" | "month" | "all") => {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    setPresetRange(type);

    if (type === "all") {
      setStartDate("");
      setEndDate("");
      return;
    }

    if (type === "7d") {
      const s = new Date();
      s.setDate(today.getDate() - 6);
      setStartDate(fmt(s));
      setEndDate(fmt(today));
      return;
    }

    if (type === "30d") {
      const s = new Date();
      s.setDate(today.getDate() - 29);
      setStartDate(fmt(s));
      setEndDate(fmt(today));
      return;
    }

    if (type === "month") {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      const e = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setStartDate(fmt(s));
      setEndDate(fmt(e));
      return;
    }
  };

  // Helper to parse order date (prefer createdAt then date then startTime)
  const parseOrderDate = (o: Order): Date | null => {
    const raw = (o as any).createdAt ?? (o as any).date ?? (o as any).startTime;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  // If both start/end are provided, filter orders by that range.
  // Otherwise, default to the currently selected month.
  const filteredOrders = orders.filter((o) => {
    if (!startDate && !endDate) {
      const d = parseOrderDate(o);
      if (!d) return false;
      return toMonthKey(d) === selectedMonth;
    }

    const d = parseOrderDate(o);
    if (!d) return false;
    const start = startDate ? new Date(startDate) : new Date(-8640000000000000);
    const end = endDate ? new Date(endDate) : new Date(8640000000000000000);
    if (endDate) end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  });

  const chartData = buildDailyChartData(filteredOrders, startDate, endDate);

  return (
    <div className="space-y-6">
      {/* Month + date range filters - affects cards, charts and recent orders table */}
      {/* <Card className="shadow-card"> */}
      <Card className="bg-muted/40 rounded-lg border border-border w-full">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center p-3 rounded-lg bg-muted/40 border border-border">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Lọc theo thời gian:</span>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate((e.target as HTMLInputElement).value);
                setPresetRange("custom");
              }}
              className="bg-background w-full sm:w-[160px]"
              aria-label="Từ ngày"
            />
            <span className="text-muted-foreground text-sm">đến</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate((e.target as HTMLInputElement).value);
                setPresetRange("custom");
              }}
              className="bg-background w-full sm:w-[160px]"
              aria-label="Đến ngày"
            />
          </div>

          <div className="flex gap-4">
            <Select
              value={presetRange}
              onValueChange={(value) => {
                if (value === "all") applyPreset("all");
                if (value === "7d") applyPreset("7d");
                if (value === "30d") applyPreset("30d");
                if (value === "month") applyPreset("month");
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Chọn khoảng thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="7d">7 ngày qua</SelectItem>
                <SelectItem value="30d">30 ngày qua</SelectItem>
                <SelectItem value="month">Tháng này</SelectItem>
                <SelectItem value="custom">Tùy chỉnh</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedMonth}
              onValueChange={(value) => setSelectedMonth(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Chọn tháng" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month} value={month}>
                    {formatMonthLabel(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyPreset("all")}
              className="text-muted-foreground gap-1"
            >
              <X className="h-3.5 w-3.5" /> Xóa
            </Button>
          )}
        </div>
      </Card>
      {/* </Card> */}

      <StatsCards
        orders={filteredOrders}
        users={users}
        services={services}
        taskers={taskers}
      />

      <RevenueChart data={chartData} />

      <DailyOrdersChart data={chartData} />

      <RecentOrdersTable orders={filteredOrders} />
    </div>
  );
}

type DailyChartPoint = {
  name: string;
  revenue: number;
  orders: number;
};

function buildDailyChartData(
  orders: Order[],
  startDate?: string,
  endDate?: string,
): DailyChartPoint[] {
  const formatLabel = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  };

  // If a date range is provided, build days across that range
  if (startDate || endDate) {
    const s = startDate ? new Date(startDate) : new Date(endDate as string);
    const e = endDate ? new Date(endDate) : new Date(startDate as string);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return [];
    // normalize times
    s.setHours(0, 0, 0, 0);
    e.setHours(23, 59, 59, 999);
    // swap if out of order
    if (s > e) {
      const tmp = new Date(s);
      s.setTime(e.getTime());
      e.setTime(tmp.getTime());
    }

    const days: DailyChartPoint[] = [];
    const dayIndexByDateKey = new Map<string, number>();

    // build day buckets
    let cursor = new Date(s);
    let idx = 0;
    while (cursor <= e) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
      days.push({ name: formatLabel(cursor), revenue: 0, orders: 0 });
      dayIndexByDateKey.set(key, idx);
      idx += 1;
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const order of orders) {
      const sourceDate =
        (order as any).date ??
        (order as any).createdAt ??
        (order as any).startTime;
      if (!sourceDate) continue;
      const date = new Date(sourceDate);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const index = dayIndexByDateKey.get(key);
      if (index === undefined) continue;
      days[index].orders += 1;
      if (order.status === "completed") {
        days[index].revenue += order.amount || 0;
      }
    }

    return days;
  }

  const dateMap = new Map<string, DailyChartPoint>();

  for (const order of orders) {
    const sourceDate =
      (order as any).date ??
      (order as any).createdAt ??
      (order as any).startTime;
    if (!sourceDate) continue;

    const date = new Date(sourceDate);
    if (Number.isNaN(date.getTime())) continue;

    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!dateMap.has(key)) {
      dateMap.set(key, {
        name: formatLabel(date),
        revenue: 0,
        orders: 0,
      });
    }

    const bucket = dateMap.get(key)!;
    bucket.orders += 1;
    if (order.status === "completed") {
      bucket.revenue += order.amount || 0;
    }
  }

  return Array.from(dateMap.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([, value]) => value);
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return `Tháng ${month}/${year}`;
}

function RevenueChart({ data }: { data: DailyChartPoint[] }) {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Doanh thu theo ngày</CardTitle>
        <CardDescription>
          Biểu đồ doanh thu theo khoảng ngày đã chọn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis
              tickFormatter={(value) => `${value / 1000000}M`}
              className="text-xs"
            />
            <Tooltip
              formatter={(value?: number) => [
                formatCurrency(value ?? 0),
                "Doanh thu",
              ]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
              }}
            />
            <Bar
              dataKey="revenue"
              fill="hsl(210, 70%, 55%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function DailyOrdersChart({ data }: { data: DailyChartPoint[] }) {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Số đơn hàng theo ngày</CardTitle>
        <CardDescription>
          Xu hướng đơn hàng theo khoảng ngày đã chọn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              formatter={(value?: number) => [value ?? 0, "Đơn hàng"]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
              }}
            />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="hsl(340, 65%, 55%)"
              strokeWidth={2}
              dot={{ fill: "hsl(340, 65%, 55%)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function RecentOrdersTable({ orders }: { orders: Order[] }) {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Đơn hàng gần đây</CardTitle>
        <CardDescription>Các đơn hàng mới nhất trong hệ thống</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {/* <TableHead>Mã đơn</TableHead> */}
              <TableHead className="w-[25%]">Khách hàng</TableHead>
              <TableHead className="w-[25%]">Dịch vụ</TableHead>
              <TableHead className="w-[25%]">Trạng thái</TableHead>
              <TableHead className="text-right w-[25%]">Giá trị</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.slice(0, 5).map((order) => (
              <TableRow key={order.id}>
                {/* <TableCell className="font-medium">{order.id}</TableCell> */}
                <TableCell className="w-[25%]">{order.customer}</TableCell>
                <TableCell className="w-[25%]">{order.service}</TableCell>
                <TableCell className="w-[25%]">
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-right w-[25%]">
                  {formatCurrency(order.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
