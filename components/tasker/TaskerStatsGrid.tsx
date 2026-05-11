import { DollarSign, TrendingUp, Briefcase, Star, AlertCircle, LucideIcon } from "lucide-react";
import { formatCurrency } from "./taskerUtils";

interface TaskerStatsGridProps {
  totalEarnings: number;
  weeklyEarnings: number;
  completedJobs: number;
  avgRating: number;
  pendingJobs: number;
}

interface StatItem {
  key: keyof TaskerStatsGridProps;
  label: string;
  icon: LucideIcon;
  bgClass: string;
  iconClass: string;
  isCurrency?: boolean;
  suffix?: string;
}

const statConfig: StatItem[] = [
  { key: "totalEarnings", label: "Tổng thu nhập", icon: DollarSign, bgClass: "bg-green-100", iconClass: "text-green-600", isCurrency: true },
  { key: "weeklyEarnings", label: "Tuần này", icon: TrendingUp, bgClass: "bg-blue-100", iconClass: "text-blue-600", isCurrency: true },
  { key: "completedJobs", label: "Đã hoàn thành", icon: Briefcase, bgClass: "bg-purple-100", iconClass: "text-purple-600", suffix: " việc" },
  { key: "avgRating", label: "Đánh giá TB", icon: Star, bgClass: "bg-yellow-100", iconClass: "text-yellow-600", suffix: " ⭐" },
  { key: "pendingJobs", label: "Việc mới", icon: AlertCircle, bgClass: "bg-orange-100", iconClass: "text-orange-600", suffix: " việc" },
];

const TaskerStatsGrid = (props: TaskerStatsGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {statConfig.map((stat) => {
        const Icon = stat.icon;
        const value = props[stat.key];
        return (
          <div key={stat.key} className="bg-card rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${stat.bgClass} flex items-center justify-center`}>
                <Icon className={stat.iconClass} size={20} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold text-foreground">
                  {stat.isCurrency ? formatCurrency(value) : `${value}${stat.suffix || ""}`}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskerStatsGrid;
