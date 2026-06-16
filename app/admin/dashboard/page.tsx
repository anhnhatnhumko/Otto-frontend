"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Activity,
  BarChart3,
  Briefcase,
  ShoppingCart,
  UserCog,
  Users,
} from "lucide-react";
import Footer from "@/components/Footer";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminNotifications from "@/components/admin/AdminNotifications";
import AdminPromotions from "@/components/admin/AdminPromotions";
import AdminReviews from "@/components/admin/AdminReviews";
import AdminSettings from "@/components/admin/AdminSettings";
import { useAdminData } from "@/hooks/useAdminData";
import { DashboardTab } from "@/components/admin/DashboardTab";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { TaskersTab } from "@/components/admin/TaskersTab";
import { ServicesTab } from "@/components/admin/ServicesTab";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { OrderDetailDialog } from "@/components/dialogs/OrderDetailDialog";
import { UserDetailDialog } from "@/components/dialogs/UserDetailDialog";
import { TaskerDetailDialog } from "@/components/dialogs/TaskerDetailDialog";
import { ServiceFormDialog } from "@/components/dialogs/ServiceFormDialog";
import { API_URL } from "./constants";
import type {
  Order,
  User,
  Service,
  Tasker,
  ServiceFormData,
  ConfirmAction,
} from "./types";

const INITIAL_SERVICE_FORM: ServiceFormData = {
  name: "",
  description: "",
  price: "",
  duration: "",
  status: "active",
};

export default function Admin() {
  const {
    isLoading,
    orders,
    users,
    services,
    taskers,
    isRealtimeConnected,
    setOrders,
    setUsers,
    setTaskers,
    reloadOrders,
    reloadUsers,
    reloadServices,
    reloadTaskers,
  } = useAdminData();

  // Dialog states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTasker, setSelectedTasker] = useState<Tasker | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isTaskerDetailOpen, setIsTaskerDetailOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );
  const [serviceForm, setServiceForm] =
    useState<ServiceFormData>(INITIAL_SERVICE_FORM);
  const [provinceId, setProvinceId] = useState("all");
  const [wardId, setWardId] = useState("all");
  const [loadingAction, setLoadingAction] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>(
    {},
  );

  const displayUsers = useMemo(
    () =>
      users.map((item) => ({
        ...item,
        status: (statusOverrides[`user:${item.id}`] as User["status"]) ?? item.status,
      })),
    [statusOverrides, users],
  );

  const displayTaskers = useMemo(
    () =>
      taskers.map((item) => ({
        ...item,
        status:
          (statusOverrides[`tasker:${item.id}`] as Tasker["status"]) ?? item.status,
      })),
    [statusOverrides, taskers],
  );

  const runRapidSync = (reload: () => void | Promise<void>) => {
    if (typeof window === "undefined") {
      void reload();
      return;
    }

    let attempt = 0;
    const maxAttempts = 10;

    const tick = () => {
      attempt += 1;
      void reload();

      if (attempt >= maxAttempts) {
        return;
      }

      window.setTimeout(tick, 500);
    };

    window.setTimeout(tick, 500);
  };

  const applyOptimisticAction = (action: string, id: string) => {
    switch (action) {
      case "confirm_order":
        setOrders((prev) =>
          prev.map((order) =>
            order.id === id ? { ...order, status: "confirmed" } : order,
          ),
        );
        break;
      case "cancel_order":
        setOrders((prev) =>
          prev.map((order) =>
            order.id === id ? { ...order, status: "cancelled" } : order,
          ),
        );
        break;
      case "complete_order":
        setOrders((prev) =>
          prev.map((order) =>
            order.id === id ? { ...order, status: "completed" } : order,
          ),
        );
        break;
      case "ban_user":
        setStatusOverrides((prev) => ({ ...prev, [`user:${id}`]: "banned" }));
        setUsers((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: "banned" } : item,
          ),
        );
        setSelectedUser((prev) =>
          prev?.id === id ? { ...prev, status: "banned" } : prev,
        );
        break;
      case "activate_user":
        setStatusOverrides((prev) => ({ ...prev, [`user:${id}`]: "active" }));
        setUsers((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: "active" } : item,
          ),
        );
        setSelectedUser((prev) =>
          prev?.id === id ? { ...prev, status: "active" } : prev,
        );
        break;
      case "approve_tasker":
      case "activate_tasker":
        setStatusOverrides((prev) => ({ ...prev, [`tasker:${id}`]: "active" }));
        setTaskers((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: "active" } : item,
          ),
        );
        setSelectedTasker((prev) =>
          prev?.id === id ? { ...prev, status: "active" } : prev,
        );
        break;
      case "ban_tasker":
        setStatusOverrides((prev) => ({ ...prev, [`tasker:${id}`]: "banned" }));
        setTaskers((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: "banned" } : item,
          ),
        );
        setSelectedTasker((prev) =>
          prev?.id === id ? { ...prev, status: "banned" } : prev,
        );
        break;
      case "reject_tasker":
        setStatusOverrides((prev) => {
          const next = { ...prev };
          delete next[`tasker:${id}`];
          return next;
        });
        setTaskers((prev) => prev.filter((item) => item.id !== id));
        setSelectedTasker((prev) => (prev?.id === id ? null : prev));
        break;
      default:
        break;
    }
  };

  // Action handlers
  const openConfirmDialog = (type: string, id: string, action: string) => {
    setConfirmAction({ type, id, action });
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || loadingAction) return;

    setLoadingAction(true);

    const { id, action } = confirmAction;

    try {
      let response: Response | null = null;

      switch (action) {
        case "confirm_order":
          response = await fetch(`/api/admin/orders/${id}/confirm`, {
            method: "PATCH",
            credentials: "include",
          });
          break;

        case "cancel_order":
          response = await fetch(`/api/admin/orders/${id}/cancel`, {
            method: "PATCH",
            credentials: "include",
          });
          break;

        case "complete_order":
          response = await fetch(`/api/admin/orders/${id}/complete`, {
            method: "PATCH",
            credentials: "include",
          });
          break;

        case "ban_user":
          response = await fetch(`/api/admin/users/${id}/ban`, {
            method: "PATCH",
            credentials: "include",
          });
          break;

        case "activate_user":
          response = await fetch(`/api/admin/users/${id}/activate`, {
            method: "PATCH",
            credentials: "include",
          });
          break;

        case "approve_tasker":
          response = await fetch(`/api/admin/taskers/${id}/approve`, {
            method: "PATCH",
            credentials: "include",
          });
          break;

        case "reject_tasker":
          response = await fetch(`/api/admin/taskers/${id}/reject`, {
            method: "DELETE",
            credentials: "include",
          });
          break;

        case "ban_tasker":
          response = await fetch(`/api/admin/taskers/${id}/ban`, {
            method: "PATCH",
            credentials: "include",
          });
          break;

        case "activate_tasker":
          response = await fetch(`/api/admin/taskers/${id}/activate`, {
            method: "PATCH",
            credentials: "include",
          });
          break;

        case "delete_service":
          response = await fetch(`/api/services/${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          break;
      }

      if (!response?.ok) {
        throw new Error(`Action failed: ${action}`);
      }

      applyOptimisticAction(action, id);

      switch (action) {
        case "confirm_order":
        case "cancel_order":
        case "complete_order":
          runRapidSync(reloadOrders);
          break;
        case "ban_user":
        case "activate_user":
          runRapidSync(reloadUsers);
          break;
        case "approve_tasker":
        case "reject_tasker":
        case "ban_tasker":
        case "activate_tasker":
          runRapidSync(reloadTaskers);
          break;
        default:
          break;
      }

      toast({
        title: "Thành công",
        description: "Thao tác đã được thực hiện",
      });
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể thực hiện thao tác",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
      setIsConfirmDialogOpen(false);
    }
  };

  const handleAddService = () => {
    setSelectedService(null);
    setServiceForm(INITIAL_SERVICE_FORM);
    setIsServiceDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setServiceForm({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration,
      status: service.status,
    });
    setIsServiceDialogOpen(true);
  };

  const handleSaveService = async () => {
    if (!serviceForm.name || !serviceForm.price) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: serviceForm.name,
      description: serviceForm.description,
      price: Number(serviceForm.price),
      estimatedTime: serviceForm.duration
        ? Number(serviceForm.duration.replace(/\D/g, ""))
        : undefined,
    };

    try {
      if (selectedService) {
        const res = await fetch(`/api/services/${selectedService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error("update_service_failed");
        }
        toast({ title: "Thành công", description: "Đã cập nhật dịch vụ" });
      } else {
        const res = await fetch(`/api/services`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error("create_service_failed");
        }
        toast({ title: "Thành công", description: "Đã thêm dịch vụ mới" });
      }

      await reloadServices();
      setIsServiceDialogOpen(false);
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể lưu dịch vụ",
        variant: "destructive",
      });
    }
  };

  const handleToggleServiceStatus = async (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    try {
      const newStatus = service.status === "active" ? "inactive" : "active";
      const res = await fetch(
        `/api/services/${serviceId}/active/${newStatus === "active"}`,
        {
          method: "PUT",
          credentials: "include",
        },
      );
      if (!res.ok) {
        throw new Error("toggle_service_failed");
      }
      await reloadServices();
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái dịch vụ",
      });
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    }
  };

  // const handleToggleTaskerStatus = (taskerId: string) => {
  //   setTaskers((prev) =>
  //     prev.map((t) =>
  //       t.id === taskerId
  //         ? { ...t, status: t.status === "active" ? "inactive" : "active" }
  //         : t,
  //     ),
  //   );
  //   toast({
  //     title: "Thành công",
  //     description: "Đã cập nhật trạng thái Tasker",
  //   });
  // };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AdminHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card className="shadow-card">
            <CardContent className="py-10 text-center text-muted-foreground">
              Đang tải dữ liệu admin...
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Quản trị viên</h1>
            {/* <Badge
              variant={isRealtimeConnected ? "secondary" : "outline"}
              className="gap-1.5"
            >
              <Activity className="h-3.5 w-3.5" />
              {isRealtimeConnected ? "Realtime: Online" : "Realtime: Offline"}
            </Badge> */}
          </div>
          <p className="text-muted-foreground mt-2">
            Quản lý đơn hàng, người dùng, dịch vụ và xem thống kê
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 w-full lg:w-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Thống kê</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Đơn hàng</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Người dùng</span>
            </TabsTrigger>
            <TabsTrigger value="taskers" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              <span className="hidden sm:inline">Tasker</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Dịch vụ</span>
            </TabsTrigger>
            {/* <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Thông báo</span>
            </TabsTrigger>
            <TabsTrigger value="promotions" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Khuyến mãi</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Đánh giá</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Cài đặt</span>
            </TabsTrigger> */}
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab
              orders={orders}
              users={displayUsers}
              services={services}
              taskers={displayTaskers}
            />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersTab
              orders={orders}
              onViewDetail={(order) => {
                setSelectedOrder(order);
                setIsOrderDetailOpen(true);
              }}
              onConfirmAction={openConfirmDialog}
            />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab
              users={displayUsers}
              onViewDetail={(user) => {
                setSelectedUser(user);
                setIsUserDetailOpen(true);
              }}
              onConfirmAction={openConfirmDialog}
            />
          </TabsContent>

          <TabsContent value="taskers">
            <TaskersTab
              taskers={displayTaskers}
              services={services}
              provinceId={provinceId}
              setProvinceId={setProvinceId}
              wardId={wardId}
              setWardId={setWardId}
              onViewDetail={(tasker) => {
                setSelectedTasker(tasker);
                setIsTaskerDetailOpen(true);
              }}
              onConfirmAction={openConfirmDialog}
              onRefresh={reloadTaskers}
            />
          </TabsContent>

          <TabsContent value="services">
            <ServicesTab
              services={services}
              onAdd={handleAddService}
              onEdit={handleEditService}
              onToggleStatus={handleToggleServiceStatus}
              onConfirmAction={openConfirmDialog}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <AdminNotifications />
          </TabsContent>

          <TabsContent value="promotions">
            <AdminPromotions />
          </TabsContent>

          <TabsContent value="reviews">
            <AdminReviews />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      {/* Dialogs */}
      <OrderDetailDialog
        open={isOrderDetailOpen}
        onOpenChange={setIsOrderDetailOpen}
        order={selectedOrder}
      />

      <UserDetailDialog
        open={isUserDetailOpen}
        onOpenChange={setIsUserDetailOpen}
        user={selectedUser}
      />

      <TaskerDetailDialog
        open={isTaskerDetailOpen}
        onOpenChange={setIsTaskerDetailOpen}
        tasker={selectedTasker}
      />

      <ServiceFormDialog
        open={isServiceDialogOpen}
        onOpenChange={setIsServiceDialogOpen}
        service={selectedService}
        form={serviceForm}
        onFormChange={setServiceForm}
        onSave={handleSaveService}
      />

      <ConfirmDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        action={confirmAction}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
