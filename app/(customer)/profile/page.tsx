"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataPagination } from "@/components/ui/data-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bell,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Eye,
  Clock,
  CreditCard,
  Crown,
  Edit3,
  Gift,
  Heart,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Percent,
  Phone,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  Star,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import WalletCard from "@/components/wallet/WalletCard";
import OrderStateRenderer from "@/components/orders/OrderStateRenderer";
import { useUserStore } from "@/app/store/useUserStore";
import { handleAuthMeResponse } from "@/lib/auth-client";
import {
  fetchProfileStats,
  fetchUpcomingBookings,
  fetchOrdersHistory,
  fetchPromotions,
  fetchFavoriteServices,
  fetchCustomerProfile,
} from "@/lib/api/profile.api";
import { mapOrder } from "@/lib/mappers/order.mapper";



type MeUser = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  birthday?: string;
  address?: string;
};

interface MappedOrder {
  _id: string;
  status: string;
  paymentStatus?: string;
  isPaid?: boolean;
  service: string;
  date: string;
  time: string;
  startTime: string;
  endTime: string;
  address: string;
  price: number;
  tasker?: { name: string; avatar?: string; rating: number; completedJobs?: number; phone?: string };
  cancelReason?: string;
}

interface Booking extends MappedOrder {}

interface Order extends MappedOrder {
  rating?: number;
  review?: string;
}

type OrderStatusFilter = "all" | "pending" | "assigned" | "in-progress" | "completed" | "cancelled" | "timeout";
type ProfileTab = "overview" | "orders" | "promotions" | "profile";

interface Promotion {
  _id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  expiryDate: string;
  minOrderAmount: number;
}

interface FavoriteService {
  serviceId: string;
  serviceName: string;
  bookingCount: number;
  icon?: string;
}

const CustomerDashboard = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingAvatar, setLoadingAvatar] = useState(false);

  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [me, setMe] = useState<MeUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const router = useRouter();
  const [formData, setFormData] = useState({ fullName: "", email: "", phone: "" });
  const [emailChangedTo, setEmailChangedTo] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  // Real data states
  const [profileStats, setProfileStats] = useState<any>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<MappedOrder[]>([]);
  const [recentOrders, setRecentOrders] = useState<(MappedOrder & { rating?: number; review?: string })[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [favoriteServices, setFavoriteServices] = useState<any[]>([]);
  const [customerProfile, setCustomerProfile] = useState<MeUser | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>("all");
  const [orderPage, setOrderPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<(MappedOrder & { rating?: number; review?: string }) | null>(null);

  const orderPageSize = 10;

  const isMobile = useIsMobile();

  useEffect(() => {
    const tab = searchParams.get("tab");

    if (tab === "overview" || tab === "orders" || tab === "promotions" || tab === "profile") {
      setActiveTab(tab);
      return;
    }

    setActiveTab("overview");
  }, [searchParams]);

  useEffect(() => {
    fetch(`/api/auth/me`, {
      credentials: "include",
    })
      .then((res) => handleAuthMeResponse(res, router))
      .then((data) => {
        setMe(data);
        setUser(data);
      })
      .catch(() => {
        router.push("/login");
      })
      .finally(() => {
        setLoadingMe(false);
      });
  }, []);

  // Sync formData when `me` is loaded
  useEffect(() => {
    if (!me) return;
    setFormData({
      fullName: me.fullName || "",
      email: me.email || "",
      phone: me.phone || "",
    });
  }, [me]);

  // Nếu đổi email thì redirect sang trang verify sau 5s
  useEffect(() => {
    if (!emailChangedTo) return;

    const timer = setTimeout(() => {
      router.push(`/verify-email?email=${encodeURIComponent(emailChangedTo)}`);
    }, 5000);

    return () => clearTimeout(timer);
  }, [emailChangedTo, router]);

  // Auto-hide success banner sau 4s
  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  // Fetch profile stats
  useEffect(() => {
    fetchProfileStats()
      .then((data) => {
        if (data) setProfileStats(data);
      })
      .catch((err) => console.error("Error fetching profile stats:", err));
  }, []);

  // Fetch upcoming bookings
  useEffect(() => {
    fetchUpcomingBookings()
      .then((data) => {
        if (Array.isArray(data)) {
          setUpcomingBookings(data.map((order: any) => mapOrder(order)));
        }
      })
      .catch((err) => console.error("Error fetching upcoming bookings:", err));
  }, []);

  // Fetch order history
  useEffect(() => {
    // Fetch all orders (use a large limit) and paginate client-side to show 10 items per page
    fetchOrdersHistory(10000)
      .then((data) => {
        if (Array.isArray(data)) {
          setRecentOrders(data.map((order: any) => mapOrder(order)));
        }
      })
      .catch((err) => console.error("Error fetching orders history:", err));
  }, []);

  // Fetch promotions
  useEffect(() => {
    fetchPromotions()
      .then((data) => {
        if (Array.isArray(data)) setPromotions(data);
      })
      .catch((err) => console.error("Error fetching promotions:", err));
  }, []);

  // Fetch favorite services
  useEffect(() => {
    fetchFavoriteServices()
      .then((data) => {
        if (Array.isArray(data)) setFavoriteServices(data);
      })
      .catch((err) => console.error("Error fetching favorite services:", err));
  }, []);

  // Fetch customer profile
  useEffect(() => {
    fetchCustomerProfile()
      .then((data) => {
        if (data) setCustomerProfile(data);
      })
      .catch((err) => console.error("Error fetching customer profile:", err));
  }, []);

  // Stats with fallback
  const totalOrders = profileStats?.totalOrders ?? 0;
  const totalSpent = profileStats?.totalSpent ?? 0;
  const avgRating = profileStats?.avgRating ?? 0;
  const loyaltyPoints = profileStats?.loyaltyPoints ?? 0;
  const memberLevel = profileStats?.memberLevel ?? "Thành viên";
  const nextLevelName = profileStats?.nextLevelName ?? "Bronze";
  const nextLevelPoints = profileStats?.nextLevelPoints ?? 5000;
  const pointsToNextLevel =
    profileStats?.pointsToNextLevel ?? Math.max(0, nextLevelPoints - loyaltyPoints);
  const rewardProgress =
    profileStats?.rewardProgress ??
    Math.min(100, Math.round((loyaltyPoints / Math.max(1, nextLevelPoints)) * 100));
  const isMaxLevel = profileStats?.isMaxLevel ?? false;
  const formatPoints = (value: number) => value.toLocaleString("vi-VN");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const canCancelOrder = (order: MappedOrder) => {
    const normalizedStatus = order.status.toUpperCase();
    if (normalizedStatus !== "SEARCHING" && normalizedStatus !== "ASSIGNED") {
      return false;
    }

    const start = new Date(order.startTime);
    if (Number.isNaN(start.getTime())) {
      return true;
    }

    return start.getTime() - Date.now() > 60 * 60 * 1000;
  };

  const getStatusBadge = (status: string, paymentStatus?: string, isPaid?: boolean) => {
    const normalizedStatus = status.toLowerCase();
    const normalizedPayment = (paymentStatus || "").toLowerCase();
    const pendingPayment = !isPaid && normalizedPayment === "pending";

    if (pendingPayment) {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          <Clock size={12} className="mr-1" />
          Chờ thanh toán
        </Badge>
      );
    }

    switch (normalizedStatus) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle2 size={12} className="mr-1" />
            Hoàn thành
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-600 bg-yellow-50"
          >
            <Clock size={12} className="mr-1" />
            Đang chờ
          </Badge>
        );
      case "assigned":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <CheckCircle2 size={12} className="mr-1" />
            Đã nhận đơn
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-700 border-red-200"
          >
            <XCircle size={12} className="mr-1" />
            Đã hủy
          </Badge>
        );
      case "in-progress":
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            <Clock size={12} className="mr-1" />
            Đang thực hiện
          </Badge>
        );
      case "timeout":
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
            <Clock size={12} className="mr-1" />
            Quá hạn
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            {status}
          </Badge>
        );
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Chỉ cho phép ảnh");
      return;
    }

    try {
      setLoadingAvatar(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/users/avatar`, {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      // 🔥 update global
      setUser((prev) => (prev ? { ...prev, avatar: data.avatar } : prev));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAvatar(false);
    }
  };

  const handleCopyPromo = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Đã sao chép!",
      description: `Mã ${code} đã được sao chép vào clipboard`,
    });
  };

  const handleCancelBooking = async (order: MappedOrder) => {
    if (!canCancelOrder(order)) {
      toast({
        title: "Không thể hủy đơn",
        description: "Đơn hàng chỉ được hủy trước giờ bắt đầu ít nhất 1 tiếng.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(`/api/orders/${order._id}/cancel`, {
        method: "PATCH",
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          data?.message || "Không thể hủy đơn hàng lúc này. Vui lòng thử lại.";
        throw new Error(Array.isArray(message) ? message[0] : message);
      }

      setUpcomingBookings((prev) =>
        prev.map((item) =>
          item._id === order._id ? { ...item, status: "CANCELLED" } : item,
        ),
      );
      setRecentOrders((prev) =>
        prev.map((item) =>
          item._id === order._id ? { ...item, status: "CANCELLED" } : item,
        ),
      );
      setSelectedOrder((prev) =>
        prev && prev._id === order._id ? { ...prev, status: "CANCELLED" } : prev,
      );

      toast({
        title: "Đã hủy đơn hàng",
        description:
          data?.message || `Đơn hàng ${order._id} đã được hủy thành công`,
        variant: "destructive",
      });
    } catch (err) {
      toast({
        title: "Không thể hủy đơn",
        description:
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi khi hủy đơn hàng.",
        variant: "destructive",
      });
    }
  };

  const handleRebookService = (service: string) => {
    toast({
      title: "Đặt lại dịch vụ",
      description: `Đang chuyển đến trang đặt ${service}...`,
    });
  };

  const filteredOrders = useMemo(() => {
    return recentOrders.filter((order) => {
      const matchSearch =
        (order.service || "").toLowerCase().includes(orderSearch.toLowerCase()) ||
        (order._id || "").toLowerCase().includes(orderSearch.toLowerCase()) ||
        (order.tasker?.name || "").toLowerCase().includes(orderSearch.toLowerCase());

      const normalizedStatus = order.status.toLowerCase();
      const matchStatus = orderStatusFilter === "all" || normalizedStatus === orderStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [recentOrders, orderSearch, orderStatusFilter]);

  const totalOrderPages = Math.ceil(filteredOrders.length / orderPageSize);
  const paginatedOrders = filteredOrders.slice(
    (orderPage - 1) * orderPageSize,
    orderPage * orderPageSize,
  );

  const hasOrderFilters = orderSearch.trim() || orderStatusFilter !== "all";

  const clearOrderFilters = () => {
    setOrderSearch("");
    setOrderStatusFilter("all");
    setOrderPage(1);
  };

  const openOrderDetail = (order: MappedOrder & { rating?: number; review?: string }) => {
    setSelectedOrder(order);
  };

  if (loadingMe) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Đang tải dữ liệu người dùng...
      </div>
    );
  }

  if (!me) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-8 pb-32 md:py-12 md:pb-12">
        <div className="container max-w-6xl">
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-gradient-hero flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    me.fullName.charAt(0)
                  )}
                </div>

                {/* Upload button */}
                <button
                  onClick={handleClickUpload}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shadow-md hover:bg-muted"
                >
                  {loadingAvatar ? (
                    <span className="text-xs animate-spin">⏳</span>
                  ) : (
                    <Camera size={14} />
                  )}
                </button>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Xin chào, {me.fullName}! 👋
                  </h1>
                </div>
                <p className="text-muted-foreground mb-3">
                  Thành viên {memberLevel} • {formatPoints(loyaltyPoints)} điểm
                </p>
                <div className="flex items-center gap-2 max-w-xs">
                  <Progress
                    value={rewardProgress}
                    className="h-2"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {isMaxLevel
                      ? "Bạn đã đạt hạng cao nhất"
                      : `${formatPoints(pointsToNextLevel)} điểm nữa lên ${nextLevelName}`}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Link href="/book-service">
                  <Button variant="hero" size="lg">
                    <Sparkles size={18} className="mr-2" />
                    Đặt dịch vụ mới
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Wallet Card */}
          <div className="mb-4 md:mb-6">
            {isMobile ? <WalletCard compact /> : <WalletCard />}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="hover:shadow-card-hover transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <ShoppingCart className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Tổng đơn hàng
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {totalOrders}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-card-hover transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <CreditCard className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Đã chi tiêu</p>
                    <p className="text-xl font-bold text-foreground">
                      {(totalSpent / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-card-hover transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <Star className="text-yellow-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Đánh giá TB</p>
                    <p className="text-2xl font-bold text-foreground">
                      {avgRating} ⭐
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-card-hover transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Gift className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Điểm thưởng</p>
                    <p className="text-2xl font-bold text-foreground">
                      {loyaltyPoints.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reward Points */}
          <Card className="mb-6 overflow-hidden border-amber-200 bg-gradient-to-br from-amber-50 via-background to-primary/5">
            <CardContent className="p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Crown className="text-amber-600" size={24} />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Điểm thưởng hiện có
                      </p>
                      <h3 className="text-2xl font-bold text-foreground">
                        {formatPoints(loyaltyPoints)} điểm
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-2xl">
                      {isMaxLevel
                        ? "Bạn đã chạm tới hạng cao nhất của chương trình khách hàng thân thiết."
                        : `Tích đủ ${formatPoints(pointsToNextLevel)} điểm nữa để lên ${nextLevelName} và mở thêm ưu đãi.`}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        <Gift size={12} className="mr-1" />
                        Tích điểm tự động
                      </Badge>
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        {formatCurrency(totalSpent)} đã chi tiêu
                      </Badge>
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        {memberLevel}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-[320px] space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tiến trình lên hạng</span>
                    <span className="font-medium text-foreground">{rewardProgress}%</span>
                  </div>
                  <Progress value={rewardProgress} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{memberLevel}</span>
                    <span>{isMaxLevel ? "Max tier" : nextLevelName}</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3 mt-6">
                {[
                  {
                    icon: Sparkles,
                    title: "1 điểm / 1.000đ",
                    description: "Điểm được cộng theo tổng giá trị đơn hoàn thành.",
                  },
                  {
                    icon: Percent,
                    title: "Đổi ưu đãi",
                    description: "Sử dụng điểm để mở ưu đãi khi hệ thống hỗ trợ.",
                  },
                  {
                    icon: Heart,
                    title: "Duy trì hạng",
                    description: "Chi tiêu đều đặn để giữ và nâng cấp thành viên.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-amber-200/70 bg-background/80 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <item.icon size={16} className="text-amber-600" />
                      </div>
                      <p className="font-medium text-foreground">{item.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Bookings Alert */}
          {upcomingBookings.length > 0 && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="text-primary" size={20} />
                    <CardTitle className="text-lg">Lịch hẹn sắp tới</CardTitle>
                  </div>
                  <Badge variant="secondary">
                    {upcomingBookings.length} lịch hẹn
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="bg-card rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-foreground">
                          {booking.service}
                        </h4>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>{booking.date}</span>
                          <Clock size={14} className="ml-2" />
                          <span>{booking.time}</span>
                        </div>
                        {booking.tasker && (
                          <div className="flex items-center gap-2">
                            <User size={14} />
                            <span>{booking.tasker.name}</span>
                            <Star size={14} className="ml-2 text-yellow-500" />
                            <span>{booking.tasker.rating}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin size={14} />
                          <span>{booking.address}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(booking.price)}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <MessageSquare size={14} className="mr-1" />
                          Nhắn tin
                        </Button>
                        {canCancelOrder(booking) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelBooking(booking)}
                          >
                            Hủy
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ProfileTab)} className="space-y-6">
            <TabsList className="bg-card p-1 rounded-xl">
              <TabsTrigger value="overview" className="rounded-lg">
                Tổng quan
              </TabsTrigger>
              <TabsTrigger value="orders" className="rounded-lg">
                Lịch sử đơn hàng
              </TabsTrigger>
              <TabsTrigger value="promotions" className="rounded-lg">
                Ưu đãi ({promotions.length})
              </TabsTrigger>
              <TabsTrigger value="profile" className="rounded-lg">
                Thông tin cá nhân
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Favorite Services */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Heart size={18} className="text-red-500" />
                        Dịch vụ yêu thích
                      </CardTitle>
                      <Link href="/book-service">
                        <Button variant="ghost" size="sm">
                          Xem tất cả
                          <ChevronRight size={16} />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {favoriteServices.length > 0 ? (
                      favoriteServices.map((service) => (
                        <div
                          key={service.serviceId}
                          className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{service.icon || "⭐"}</span>
                            <div>
                              <p className="font-medium text-foreground">
                                {service.serviceName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Đã đặt {service.bookingCount} lần
                              </p>
                            </div>
                          </div>
                          {/* <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRebookService(service.serviceName)}
                          >
                            <RefreshCw size={14} className="mr-1" />
                            Đặt lại
                          </Button> */}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        Chưa có dịch vụ yêu thích
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Bell size={18} />
                        Thông báo gần đây
                      </CardTitle>
                      <Badge variant="secondary">0 mới</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-center text-muted-foreground py-4">
                      Không có thông báo mới
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Orders History Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Lịch sử đơn hàng</CardTitle>
                  <CardDescription>Xem lại tất cả đơn hàng bạn đã đặt</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm theo dịch vụ, mã đơn hoặc tasker..."
                        value={orderSearch}
                        onChange={(e) => {
                          setOrderSearch(e.target.value);
                          setOrderPage(1);
                        }}
                        className="pl-10"
                      />
                    </div>

                    <Select
                      value={orderStatusFilter}
                      onValueChange={(value) => {
                        setOrderStatusFilter(value as OrderStatusFilter);
                        setOrderPage(1);
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="pending">Đang chờ</SelectItem>
                        <SelectItem value="assigned">Đã nhận đơn</SelectItem>
                        <SelectItem value="in-progress">Đang thực hiện</SelectItem>
                        <SelectItem value="completed">Hoàn thành</SelectItem>
                        <SelectItem value="cancelled">Đã hủy</SelectItem>
                        <SelectItem value="timeout">Quá hạn</SelectItem>
                      </SelectContent>
                    </Select>

                    {hasOrderFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearOrderFilters}
                        className="ml-auto text-muted-foreground gap-1 self-start sm:self-auto"
                      >
                        <X className="h-3.5 w-3.5" /> Xóa
                      </Button>
                    )}
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {/* <TableHead>ID</TableHead> */}
                          <TableHead>Dịch vụ</TableHead>
                          <TableHead>Ngày đặt</TableHead>
                          <TableHead>Giờ đặt</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Giá</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {paginatedOrders.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="py-8 text-center text-muted-foreground"
                            >
                              Không tìm thấy đơn hàng nào
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedOrders.map((order) => (
                            <TableRow
                              key={order._id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => {
                                if (isMobile) {
                                  router.push(`/orders/${order._id}`);
                                } else {
                                  openOrderDetail(order);
                                }
                              }}
                            >
                              {/* <TableCell className="font-mono text-xs">{order._id}</TableCell> */}
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-medium text-foreground">{order.service}</p>
                                  {order.tasker && (
                                    <p className="text-xs text-muted-foreground">
                                      {order.tasker.name}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{order.date}</TableCell>
                              <TableCell>{order.time}</TableCell>
                              <TableCell>
                                {getStatusBadge(order.status, order.paymentStatus, order.isPaid)}
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(order.price)}
                              </TableCell>
                              {/* <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {order.status?.toUpperCase() === "COMPLETED" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRebookService(order.service);
                                      }}
                                    >
                                      <RefreshCw size={14} className="mr-1" />
                                      Đặt lại
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openOrderDetail(order);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" /> 
                                  </Button>
                                </div>
                              </TableCell> */}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <DataPagination
                    page={orderPage}
                    totalPages={totalOrderPages}
                    totalItems={filteredOrders.length}
                    pageSize={orderPageSize}
                    onPageChange={setOrderPage}
                    itemLabel="đơn hàng"
                  />
                </CardContent>
              </Card>

              <Dialog
                open={Boolean(selectedOrder)}
                onOpenChange={(open) => {
                  if (!open) setSelectedOrder(null);
                }}
              >
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Chi tiết đơn hàng</DialogTitle>
                    <DialogDescription>
                      Thông tin đầy đủ của đơn hàng bạn đã đặt
                    </DialogDescription>
                  </DialogHeader>

                  {selectedOrder && (
                    <div className="space-y-4">
                      {selectedOrder.status.toUpperCase() === "SEARCHING" ||
                      selectedOrder.status.toUpperCase() === "ASSIGNED" ? (
                        <>
                          <OrderStateRenderer
                            order={selectedOrder as any}
                            onCancel={canCancelOrder(selectedOrder) ? () => handleCancelBooking(selectedOrder) : undefined}
                          />

                          {!canCancelOrder(selectedOrder) && (
                            <p className="text-sm text-destructive text-center">
                              Đơn này không thể hủy
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Mã đơn</p>
                              <p className="font-mono text-sm font-medium">{selectedOrder._id}</p>
                            </div>
                            {getStatusBadge(
                              selectedOrder.status,
                              selectedOrder.paymentStatus,
                              selectedOrder.isPaid,
                            )}
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-muted-foreground">Dịch vụ</span>
                              <span className="font-medium text-right">{selectedOrder.service}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-muted-foreground">Ngày đặt</span>
                              <span className="font-medium text-right">{selectedOrder.date}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-muted-foreground">Giờ đặt</span>
                              <span className="font-medium text-right">{selectedOrder.time}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-muted-foreground">Địa chỉ</span>
                              <span className="font-medium text-right">{selectedOrder.address}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-muted-foreground">Tổng tiền</span>
                              <span className="font-bold text-primary text-right">
                                {formatCurrency(selectedOrder.price)}
                              </span>
                            </div>
                            {selectedOrder.tasker && (
                              <div className="flex items-start justify-between gap-3">
                                <span className="text-muted-foreground">Tasker</span>
                                <span className="font-medium text-right">{selectedOrder.tasker.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="rounded-xl border border-border p-4">
                        <p className="text-sm font-medium text-foreground mb-2">Đánh giá</p>
                        {(selectedOrder.rating ?? 0) > 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={
                                    i < (selectedOrder.rating ?? 0)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-muted"
                                  }
                                />
                              ))}
                            </div>
                            {selectedOrder.review ? (
                              <p className="text-sm text-muted-foreground italic">
                                "{selectedOrder.review}"
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Chưa có đánh giá</p>
                        )}
                      </div>

                      {selectedOrder.status?.toUpperCase() === "COMPLETED" && (
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => handleRebookService(selectedOrder.service)}
                        >
                          <RefreshCw size={14} className="mr-2" />
                          Đặt lại dịch vụ này
                        </Button>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Promotions Tab */}
            <TabsContent value="promotions">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {promotions.length > 0 ? (
                  promotions.map((promo) => (
                    <Card
                      key={promo._id}
                      className="overflow-hidden hover:shadow-card-hover transition-shadow"
                    >
                      <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant="secondary"
                            className="bg-white/20 text-white border-0"
                          >
                            <Percent size={12} className="mr-1" />
                            {promo.discount}
                          </Badge>
                          <span className="text-xs opacity-80">
                            HSD: {promo.expiryDate}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg">{promo.title}</h3>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-3">
                          {promo.description}
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Đơn tối thiểu: {formatCurrency(promo.minOrderAmount)}
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 rounded-lg bg-muted text-sm font-mono">
                            {promo.code}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyPromo(promo.code)}
                          >
                            Sao chép
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    Không có ưu đãi nào hiện tại
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Thông tin cá nhân</CardTitle>
                      <CardDescription>
                        Quản lý thông tin tài khoản của bạn
                      </CardDescription>
                    </div>
                    <Button
                      variant={isEditing ? "hero" : "outline"}
                      onClick={async () => {
                        if (isEditing) {
                          // Người dùng bấm Lưu → gọi API
                          setSavingProfile(true);
                          setFieldErrors({
                            fullName: "",
                            email: "",
                            phone: "",
                          });
                          setSuccessMessage("");

                          const previousEmail = (me?.email || "").trim().toLowerCase();
                          const nextEmail = (formData.email || "").trim().toLowerCase();

                          // Validate required fields
                          const nextFieldErrors = {
                            fullName: formData.fullName.trim() ? "" : "Vui lòng nhập họ và tên",
                            email: formData.email.trim() ? "" : "Vui lòng nhập email",
                            phone: formData.phone.trim() ? "" : "Vui lòng nhập số điện thoại",
                          };

                          setFieldErrors(nextFieldErrors);

                          if (Object.values(nextFieldErrors).some(Boolean)) {
                            toast({
                              variant: "destructive",
                              title: "Thiếu thông tin",
                              description: "Vui lòng kiểm tra các trường bị lỗi bên dưới.",
                            });
                            setSavingProfile(false);
                            return;
                          }

                          try {
                            const res = await fetch(`/api/customers/profile`, {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              credentials: "include",
                              body: JSON.stringify({
                                fullName: formData.fullName,
                                email: formData.email,
                                phone: formData.phone,
                              }),
                            });

                            if (!res.ok) {
                              const errorData = await res.json();
                              console.error("❌ Lỗi từ server:", errorData);

                              const serverMessage =
                                typeof errorData?.message === "string"
                                  ? errorData.message
                                  : Array.isArray(errorData?.message)
                                    ? errorData.message.join(", ")
                                    : "";

                              if (serverMessage.toLowerCase().includes("email")) {
                                setFieldErrors((prev) => ({ ...prev, email: serverMessage }));
                              }

                              throw new Error(errorData.message || "Không thể cập nhật hồ sơ");
                            }

                            const updatedUser = await res.json();
                            console.log("✅ Cập nhật thành công:", updatedUser);

                            setMe(updatedUser);
                            setUser(updatedUser);
                            setFieldErrors({
                              fullName: "",
                              email: "",
                              phone: "",
                            });

                            const emailChanged = previousEmail && nextEmail !== previousEmail;
                            setSuccessMessage(
                              emailChanged
                                ? "Đã đổi email. Vui lòng kiểm tra hộp thư của email mới để xác thực."
                                : "Hồ sơ đã được cập nhật thành công."
                            );

                            if (emailChanged) {
                              setEmailChangedTo(updatedUser.email || nextEmail);
                            }
                          } catch (err) {
                            console.error("Lỗi lưu hồ sơ:", err);
                            toast({
                              variant: "destructive",
                              title: "Lỗi",
                              description: err instanceof Error ? err.message : "Không thể lưu hồ sơ",
                            });
                          } finally {
                            setSavingProfile(false);
                          }
                        }

                        setIsEditing(!isEditing);
                      }}
                      disabled={savingProfile}
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Edit3 size={16} className="mr-2" />
                          {isEditing ? "Lưu thay đổi" : "Chỉnh sửa"}
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {successMessage ? (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 mb-6">
                      {successMessage}
                    </div>
                  ) : null}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Họ và tên</Label>
                      <div className="relative">
                        <User
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={18}
                        />
                          <Input
                            id="fullName"
                            value={formData.fullName}
                            onChange={(e) => {
                              setFormData((s) => ({ ...s, fullName: e.target.value }));
                              if (fieldErrors.fullName) {
                                setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                              }
                            }}
                            disabled={!isEditing}
                            className={`pl-10 h-12 ${fieldErrors.fullName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                          />
                      </div>
                      {fieldErrors.fullName ? (
                        <p className="text-sm text-destructive">{fieldErrors.fullName}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={18}
                        />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData((s) => ({ ...s, email: e.target.value }));
                            if (fieldErrors.email) {
                              setFieldErrors((prev) => ({ ...prev, email: "" }));
                            }
                          }}
                          disabled={!isEditing}
                          className={`pl-10 h-12 ${fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                      </div>
                      {fieldErrors.email ? (
                        <p className="text-sm text-destructive">{fieldErrors.email}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <div className="relative">
                        <Phone
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={18}
                        />
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => {
                            setFormData((s) => ({ ...s, phone: e.target.value }));
                            if (fieldErrors.phone) {
                              setFieldErrors((prev) => ({ ...prev, phone: "" }));
                            }
                          }}
                          disabled={!isEditing}
                          className={`pl-10 h-12 ${fieldErrors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                      </div>
                      {fieldErrors.phone ? (
                        <p className="text-sm text-destructive">{fieldErrors.phone}</p>
                      ) : null}
                    </div>

                    {/* <div className="space-y-2">
                      <Label htmlFor="birthday">Ngày sinh</Label>
                      <div className="relative">
                        <Calendar
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={18}
                        />
                        <Input
                          id="birthday"
                          type="text"
                          defaultValue={customerProfile?.birthday || ""}
                          disabled={!isEditing}
                          placeholder="Chưa cập nhật"
                          className="pl-10 h-12"
                        />
                      </div>
                    </div> */}

                    {/* <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Địa chỉ</Label>
                      <div className="relative">
                        <MapPin
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={18}
                        />
                        <Input
                          id="address"
                          defaultValue={customerProfile?.address || ""}
                          disabled={!isEditing}
                          placeholder="Chưa cập nhật"
                          className="pl-10 h-12"
                        />
                      </div>
                    </div> */}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};


export default CustomerDashboard;