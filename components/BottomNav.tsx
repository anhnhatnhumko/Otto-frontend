import { Home, ClipboardList, Tag, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "overview", label: "Trang chủ", icon: Home },
  { id: "orders", label: "Đơn hàng", icon: ClipboardList },
  { id: "book", label: "Đặt dịch vụ", icon: Plus, isCenter: true },
  { id: "promotions", label: "Ưu đãi", icon: Tag },
  { id: "profile", label: "Tài khoản", icon: User },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-end justify-around px-2 pt-1 pb-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="flex flex-col items-center -mt-5"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-hero flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                  <Icon size={26} className="text-primary-foreground" />
                </div>
                <span className="text-[10px] mt-1 font-medium text-primary">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center py-2 px-3 min-w-[60px] rounded-xl transition-colors active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn(
                "text-[10px] mt-1",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
