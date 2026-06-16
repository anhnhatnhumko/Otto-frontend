"use client";

import { useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
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
import { extractUserFacingErrorMessage } from "@/lib/user-facing-error";
import type {
  ConfirmAction,
  Order,
  Service,
  ServiceFormData,
  Tasker,
  User,
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
    setOrders,
    setUsers,
    setTaskers,
    reloadOrders,
    reloadUsers,
    reloadServices,
    reloadTaskers,
  } = useAdminData();

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
  const pendingResyncTimersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      pendingResyncTimersRef.current.forEach((timerId) =>
        window.clearTimeout(timerId),
      );
      pendingResyncTimersRef.current = [];
    };
  }, []);

  const queueRapidResync = (
    loaders: Array<(() => Promise<void> | void) | undefined>,
  ) => {
    pendingResyncTimersRef.current.forEach((timerId) =>
      window.clearTimeout(timerId),
    );
    pendingResyncTimersRef.current = [];

    [0, 1000, 2500, 4000].forEach((delay) => {
      const timerId = window.setTimeout(() => {
        loaders.forEach((loader) => {
          if (!loader) return;
          void Promise.resolve(loader());
        });
      }, delay);

      pendingResyncTimersRef.current.push(timerId);
    });
  };

  const openConfirmDialog = (type: string, id: string, action: string) => {
    setConfirmAction({ type, id, action });
    setIsConfirmDialogOpen(true);
  };

  const applyOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status } : order)),
    );
    setSelectedOrder((prev) =>
      prev && prev.id === orderId ? { ...prev, status } : prev,
    );
  };

  const applyUserStatus = (userId: string, status: User["status"]) => {
    setUsers((prev) =>
      prev.map((item) => (item.id === userId ? { ...item, status } : item)),
    );
    setSelectedUser((prev) =>
      prev && prev.id === userId ? { ...prev, status } : prev,
    );
  };

  const applyTaskerStatus = (
    taskerId: string,
    status: Tasker["status"],
    verified?: boolean,
  ) => {
    setTaskers((prev) =>
      prev.map((item) =>
        item.id === taskerId
          ? {
              ...item,
              status,
              ...(typeof verified === "boolean" ? { verified } : {}),
            }
          : item,
      ),
    );
    setSelectedTasker((prev) =>
      prev && prev.id === taskerId
        ? {
            ...prev,
            status,
            ...(typeof verified === "boolean" ? { verified } : {}),
          }
        : prev,
    );
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || loadingAction) return;

    setLoadingAction(true);

    const { id, action } = confirmAction;
    const rollbackSteps: Array<() => void> = [];

    try {
      let response: Response | null = null;

      switch (action) {
        case "confirm_order": {
          const previousStatus = orders.find((order) => order.id === id)?.status;
          if (previousStatus) {
            applyOrderStatus(id, "confirmed");
            rollbackSteps.push(() => applyOrderStatus(id, previousStatus));
          }

          response = await fetch(`/api/admin/orders/${id}/confirm`, {
            method: "PATCH",
            credentials: "include",
          });
          break;
        }

        case "cancel_order": {
          const previousStatus = orders.find((order) => order.id === id)?.status;
          if (previousStatus) {
            applyOrderStatus(id, "cancelled");
            rollbackSteps.push(() => applyOrderStatus(id, previousStatus));
          }

          response = await fetch(`/api/admin/orders/${id}/cancel`, {
            method: "PATCH",
            credentials: "include",
          });
          break;
        }

        case "complete_order": {
          const previousStatus = orders.find((order) => order.id === id)?.status;
          if (previousStatus) {
            applyOrderStatus(id, "completed");
            rollbackSteps.push(() => applyOrderStatus(id, previousStatus));
          }

          response = await fetch(`/api/admin/orders/${id}/complete`, {
            method: "PATCH",
            credentials: "include",
          });
          break;
        }

        case "ban_user": {
          const previousStatus = users.find((user) => user.id === id)?.status;
          if (previousStatus) {
            applyUserStatus(id, "banned");
            rollbackSteps.push(() => applyUserStatus(id, previousStatus));
          }

          response = await fetch(`/api/admin/users/${id}/ban`, {
            method: "PATCH",
            credentials: "include",
          });
          break;
        }

        case "activate_user": {
          const previousStatus = users.find((user) => user.id === id)?.status;
          if (previousStatus) {
            applyUserStatus(id, "active");
            rollbackSteps.push(() => applyUserStatus(id, previousStatus));
          }

          response = await fetch(`/api/admin/users/${id}/activate`, {
            method: "PATCH",
            credentials: "include",
          });
          break;
        }

        case "approve_tasker": {
          const previousTasker = taskers.find((tasker) => tasker.id === id);
          if (previousTasker) {
            applyTaskerStatus(id, "active", true);
            rollbackSteps.push(() =>
              applyTaskerStatus(
                id,
                previousTasker.status,
                previousTasker.verified,
              ),
            );
          }

          response = await fetch(`/api/admin/taskers/${id}/approve`, {
            method: "PATCH",
            credentials: "include",
          });
          break;
        }

        case "reject_tasker":
          response = await fetch(`/api/admin/taskers/${id}/reject`, {
            method: "DELETE",
            credentials: "include",
          });
          break;

        case "ban_tasker": {
          const previousTasker = taskers.find((tasker) => tasker.id === id);
          if (previousTasker) {
            applyTaskerStatus(id, "banned", previousTasker.verified);
            rollbackSteps.push(() =>
              applyTaskerStatus(
                id,
                previousTasker.status,
                previousTasker.verified,
              ),
            );
          }

          response = await fetch(`/api/admin/taskers/${id}/ban`, {
            method: "PATCH",
            credentials: "include",
          });
          break;
        }

        case "activate_tasker": {
          const previousTasker = taskers.find((tasker) => tasker.id === id);
          if (previousTasker) {
            applyTaskerStatus(id, "active", previousTasker.verified);
            rollbackSteps.push(() =>
              applyTaskerStatus(
                id,
                previousTasker.status,
                previousTasker.verified,
              ),
            );
          }

          response = await fetch(`/api/admin/taskers/${id}/activate`, {
            method: "PATCH",
            credentials: "include",
          });
          break;
        }

        case "delete_service":
          response = await fetch(`/api/services/${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          break;
      }

      if (!response?.ok) {
        let payload: unknown = null;
        const failedResponse = response;

        try {
          payload = failedResponse ? await failedResponse.json() : null;
        } catch {
          payload = null;
        }

        throw new Error(
          extractUserFacingErrorMessage(
            payload,
            "Không thể thực hiện thao tác này.",
          ),
        );
      }

      toast({
        title: "Thành công",
        description: "Giao diện đã được cập nhật ngay lập tức.",
      });

      switch (action) {
        case "confirm_order":
        case "cancel_order":
        case "complete_order":
          queueRapidResync([reloadOrders]);
          break;
        case "ban_user":
        case "activate_user":
          queueRapidResync([reloadUsers]);
          break;
        case "approve_tasker":
        case "reject_tasker":
        case "ban_tasker":
        case "activate_tasker":
          queueRapidResync([reloadTaskers]);
          break;
        case "delete_service":
          queueRapidResync([reloadServices, reloadTaskers]);
          break;
      }
    } catch (error) {
      rollbackSteps
        .slice()
        .reverse()
        .forEach((rollback) => rollback());

      toast({
        title: "Lỗi",
        description: extractUserFacingErrorMessage(
          error instanceof Error ? error.message : error,
          "Không thể thực hiện thao tác này.",
        ),
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
        description: "Vui lòng điền đầy đủ thông tin.",
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
        toast({ title: "Thành công", description: "Đã cập nhật dịch vụ." });
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
        toast({ title: "Thành công", description: "Đã thêm dịch vụ mới." });
      }

      await reloadServices();
      setIsServiceDialogOpen(false);
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể lưu dịch vụ.",
        variant: "destructive",
      });
    }
  };

  const handleToggleServiceStatus = async (serviceId: string) => {
    const service = services.find((item) => item.id === serviceId);
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
        description: "Đã cập nhật trạng thái dịch vụ.",
      });
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái dịch vụ.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AdminHeader />
        <main className="container mx-auto flex-1 px-4 py-8">
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

      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Quản trị viên</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            Quản lý đơn hàng, người dùng, dịch vụ và xem thống kê
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="flex h-auto w-full flex-wrap gap-1 lg:w-auto">
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
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab
              orders={orders}
              users={users}
              services={services}
              taskers={taskers}
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
              users={users}
              onViewDetail={(user) => {
                setSelectedUser(user);
                setIsUserDetailOpen(true);
              }}
              onConfirmAction={openConfirmDialog}
            />
          </TabsContent>

          <TabsContent value="taskers">
            <TaskersTab
              taskers={taskers}
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
