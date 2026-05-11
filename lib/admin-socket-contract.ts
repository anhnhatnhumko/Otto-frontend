import type { ApiOrder, ApiUser } from "@/app/admin/dashboard/types";

export const ADMIN_SOCKET_EVENTS = {
  JOIN: "admin:join",

  TASKER_UPDATED: "admin:tasker-updated",
  TASKER_DELETED: "admin:tasker-deleted",
  TASKERS_UPDATED: "admin:taskers:updated",
  TASKERS_DELETED: "admin:taskers:deleted",

  ORDER_CREATED_LEGACY: "admin:new-order",
  ORDER_UPDATED_LEGACY: "admin:order-updated",
  ORDER_STATUS_UPDATED_LEGACY: "admin:order-status-updated",
  ORDERS_CREATED: "admin:orders:created",
  ORDERS_UPDATED: "admin:orders:updated",
  ORDERS_STATUS_UPDATED: "admin:orders:status-updated",
  ORDER_UPDATED_GENERIC: "order:updated",
  ORDER_STATUS_UPDATED_GENERIC: "order:status-updated",

  USER_UPDATED_LEGACY: "admin:user-updated",
  USER_DELETED_LEGACY: "admin:user-deleted",
  USERS_CREATED: "admin:users:created",
  USERS_UPDATED: "admin:users:updated",
  USERS_DELETED: "admin:users:deleted",

  SERVICE_UPDATED_LEGACY: "admin:service-updated",
  SERVICE_DELETED_LEGACY: "admin:service-deleted",
  SERVICES_CREATED: "admin:services:created",
  SERVICES_UPDATED: "admin:services:updated",
  SERVICES_DELETED: "admin:services:deleted",

  STATS_UPDATED: "admin:stats:updated",
} as const;

export interface SocketIdPayload {
  id?: string;
  _id?: string;
}

export type OrderSocketPayload = Partial<ApiOrder> & {
  orderId?: string;
  data?: Partial<ApiOrder> & { orderId?: string };
  order?: Partial<ApiOrder> & { orderId?: string };
  payload?: Partial<ApiOrder> & { orderId?: string };
};

export interface AdminSocketHandlers {
  onOrderCreated: (order: ApiOrder) => void;
  onOrderUpdated: (order: OrderSocketPayload) => void;
  onUserUpsert: (user: ApiUser) => void;
  onUserDeleted: (payload: SocketIdPayload) => void;
  onTaskerChanged: () => void;
  onServicesChanged: () => void;
  onServiceDeleted: (payload: SocketIdPayload) => void;
  onResync: () => void;
}
