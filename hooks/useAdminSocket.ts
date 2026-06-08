"use client";

import { useEffect, useState } from "react";
import { connectSocket } from "@/lib/socket";
import {
  ADMIN_SOCKET_EVENTS,
  type AdminSocketHandlers,
  type SocketIdPayload,
} from "@/lib/admin-socket-contract";

interface AdminIdentity {
  userId: string;
  role: string;
}

interface UseAdminSocketOptions {
  identity: AdminIdentity | null;
  onOrderCreated: AdminSocketHandlers["onOrderCreated"];
  onOrderUpdated: AdminSocketHandlers["onOrderUpdated"];
  onUserUpsert: AdminSocketHandlers["onUserUpsert"];
  onUserDeleted: (payload: SocketIdPayload) => void;
  onTaskerChanged: AdminSocketHandlers["onTaskerChanged"];
  onServicesChanged: AdminSocketHandlers["onServicesChanged"];
  onServiceDeleted: (payload: SocketIdPayload) => void;
  onResync: AdminSocketHandlers["onResync"];
}

export function useAdminSocket({
  identity,
  onOrderCreated,
  onOrderUpdated,
  onUserUpsert,
  onUserDeleted,
  onTaskerChanged,
  onServicesChanged,
  onServiceDeleted,
  onResync,
}: UseAdminSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!identity) return;

    const socket = connectSocket(identity.userId, identity.role);
    if (!socket) return;

    const joinAdminRoom = () => {
      socket.emit(ADMIN_SOCKET_EVENTS.JOIN, {
        userId: identity.userId,
        role: identity.role,
      });
    };

    const onConnect = () => {
      setIsConnected(true);
      joinAdminRoom();
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onConnectError = () => {
      setIsConnected(false);
    };

    const onAnyEvent = (eventName: string, payload: unknown) => {
      if (process.env.NEXT_PUBLIC_ADMIN_SOCKET_DEBUG !== "true") return;
      if (!eventName.includes("admin:") && !eventName.includes("order:")) return;
      console.log("[admin-socket:event]", eventName, payload);
    };

    joinAdminRoom();

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.onAny(onAnyEvent);

    socket.on(ADMIN_SOCKET_EVENTS.TASKER_UPDATED, onTaskerChanged);
    socket.on(ADMIN_SOCKET_EVENTS.TASKER_DELETED, onTaskerChanged);
    socket.on(ADMIN_SOCKET_EVENTS.TASKERS_UPDATED, onTaskerChanged);
    socket.on(ADMIN_SOCKET_EVENTS.TASKERS_DELETED, onTaskerChanged);

    socket.on(ADMIN_SOCKET_EVENTS.ORDER_CREATED_LEGACY, onOrderCreated);
    socket.on(ADMIN_SOCKET_EVENTS.ORDER_UPDATED_LEGACY, onOrderUpdated);
    socket.on(ADMIN_SOCKET_EVENTS.ORDER_STATUS_UPDATED_LEGACY, onOrderUpdated);
    socket.on(ADMIN_SOCKET_EVENTS.ORDERS_CREATED, onOrderCreated);
    socket.on(ADMIN_SOCKET_EVENTS.ORDERS_UPDATED, onOrderUpdated);
    socket.on(ADMIN_SOCKET_EVENTS.ORDERS_STATUS_UPDATED, onOrderUpdated);
    socket.on(ADMIN_SOCKET_EVENTS.ORDER_UPDATED_GENERIC, onOrderUpdated);
    socket.on(ADMIN_SOCKET_EVENTS.ORDER_STATUS_UPDATED_GENERIC, onOrderUpdated);

    socket.on(ADMIN_SOCKET_EVENTS.USER_UPDATED_LEGACY, onUserUpsert);
    socket.on(ADMIN_SOCKET_EVENTS.USERS_UPDATED, onUserUpsert);
    socket.on(ADMIN_SOCKET_EVENTS.USERS_CREATED, onUserUpsert);
    socket.on(ADMIN_SOCKET_EVENTS.USER_DELETED_LEGACY, onUserDeleted);
    socket.on(ADMIN_SOCKET_EVENTS.USERS_DELETED, onUserDeleted);

    socket.on(ADMIN_SOCKET_EVENTS.SERVICE_UPDATED_LEGACY, onServicesChanged);
    socket.on(ADMIN_SOCKET_EVENTS.SERVICES_UPDATED, onServicesChanged);
    socket.on(ADMIN_SOCKET_EVENTS.SERVICES_CREATED, onServicesChanged);
    socket.on(ADMIN_SOCKET_EVENTS.SERVICE_DELETED_LEGACY, onServiceDeleted);
    socket.on(ADMIN_SOCKET_EVENTS.SERVICES_DELETED, onServiceDeleted);

    socket.on(ADMIN_SOCKET_EVENTS.STATS_UPDATED, onResync);
    socket.on("reconnect", onResync);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.offAny(onAnyEvent);

      socket.off(ADMIN_SOCKET_EVENTS.TASKER_UPDATED, onTaskerChanged);
      socket.off(ADMIN_SOCKET_EVENTS.TASKER_DELETED, onTaskerChanged);
      socket.off(ADMIN_SOCKET_EVENTS.TASKERS_UPDATED, onTaskerChanged);
      socket.off(ADMIN_SOCKET_EVENTS.TASKERS_DELETED, onTaskerChanged);

      socket.off(ADMIN_SOCKET_EVENTS.ORDER_CREATED_LEGACY, onOrderCreated);
      socket.off(ADMIN_SOCKET_EVENTS.ORDER_UPDATED_LEGACY, onOrderUpdated);
      socket.off(ADMIN_SOCKET_EVENTS.ORDER_STATUS_UPDATED_LEGACY, onOrderUpdated);
      socket.off(ADMIN_SOCKET_EVENTS.ORDERS_CREATED, onOrderCreated);
      socket.off(ADMIN_SOCKET_EVENTS.ORDERS_UPDATED, onOrderUpdated);
      socket.off(ADMIN_SOCKET_EVENTS.ORDERS_STATUS_UPDATED, onOrderUpdated);
      socket.off(ADMIN_SOCKET_EVENTS.ORDER_UPDATED_GENERIC, onOrderUpdated);
      socket.off(ADMIN_SOCKET_EVENTS.ORDER_STATUS_UPDATED_GENERIC, onOrderUpdated);

      socket.off(ADMIN_SOCKET_EVENTS.USER_UPDATED_LEGACY, onUserUpsert);
      socket.off(ADMIN_SOCKET_EVENTS.USERS_UPDATED, onUserUpsert);
      socket.off(ADMIN_SOCKET_EVENTS.USERS_CREATED, onUserUpsert);
      socket.off(ADMIN_SOCKET_EVENTS.USER_DELETED_LEGACY, onUserDeleted);
      socket.off(ADMIN_SOCKET_EVENTS.USERS_DELETED, onUserDeleted);

      socket.off(ADMIN_SOCKET_EVENTS.SERVICE_UPDATED_LEGACY, onServicesChanged);
      socket.off(ADMIN_SOCKET_EVENTS.SERVICES_UPDATED, onServicesChanged);
      socket.off(ADMIN_SOCKET_EVENTS.SERVICES_CREATED, onServicesChanged);
      socket.off(ADMIN_SOCKET_EVENTS.SERVICE_DELETED_LEGACY, onServiceDeleted);
      socket.off(ADMIN_SOCKET_EVENTS.SERVICES_DELETED, onServiceDeleted);

      socket.off(ADMIN_SOCKET_EVENTS.STATS_UPDATED, onResync);
      socket.off("reconnect", onResync);
    };
  }, [
    identity,
    onOrderCreated,
    onOrderUpdated,
    onUserUpsert,
    onUserDeleted,
    onTaskerChanged,
    onServicesChanged,
    onServiceDeleted,
    onResync,
  ]);

  return {
    isConnected: Boolean(identity) && isConnected,
  };
}
