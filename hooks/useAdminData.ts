"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

import {
    getApiId,
    getListData,
    mapService,
    mapOrder,
    mapOrderStatus,
    mapUser,
    mapTasker,
} from "@/app/admin/dashboard/utils";
import { useAdminSocket } from "@/hooks/useAdminSocket";
import type {
    OrderSocketPayload,
    SocketIdPayload,
} from "@/lib/admin-socket-contract";

import type {
    Order,
    User,
    Service,
    Tasker,
    ApiService,
    ApiUser,
    ApiOrder,
    AdminListResponse,
} from "@/app/admin/dashboard/types";

// ================= HELPER =================
const isSame = <T extends { id: string }>(a: T[], b: T[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i].id !== b[i].id) return false;
    }
    return true;
};

const isSameServiceList = (a: Service[], b: Service[]) => {
    if (a.length !== b.length) return false;

    return a.every((item, index) => {
        const next = b[index];
        return (
            item.id === next.id &&
            item.name === next.name &&
            item.description === next.description &&
            item.price === next.price &&
            item.duration === next.duration &&
            item.status === next.status &&
            item.bookings === next.bookings
        );
    });
};

const upsertById = <T extends { id: string }>(items: T[], item: T) => {
    const index = items.findIndex((existing) => existing.id === item.id);
    if (index === -1) {
        return [item, ...items];
    }

    const next = [...items];
    next[index] = item;
    return next;
};

type OrderRealtimePayload = Partial<ApiOrder> & {
    orderId?: string;
    data?: Partial<ApiOrder> & { orderId?: string };
    order?: Partial<ApiOrder> & { orderId?: string };
    payload?: Partial<ApiOrder> & { orderId?: string };
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
    if (!value || typeof value !== "object") return null;
    return value as Record<string, unknown>;
};

const pickOrderPayloadCandidate = (payload: OrderRealtimePayload) => {
    return payload.data ?? payload.order ?? payload.payload ?? payload;
};

const getRealtimeOrderStatus = (payload: OrderRealtimePayload) => {
    const candidate = pickOrderPayloadCandidate(payload);
    return candidate.status ?? payload.status;
};

const normalizeRealtimeOrderStatus = (status?: string): Order["status"] | null => {
    if (!status) return null;

    const normalized = status.trim().toUpperCase();

    const known = mapOrderStatus(normalized);
    if (known !== "pending") {
        return known;
    }

    const directMap: Record<string, Order["status"]> = {
        PENDING: "pending",
        CONFIRMED: "confirmed",
        IN_PROGRESS: "in_progress",
        COMPLETED: "completed",
        CANCELLED: "cancelled",
    };

    return directMap[normalized] ?? null;
};

const getRealtimeOrderId = (payload: OrderRealtimePayload): string => {
    const nested = pickOrderPayloadCandidate(payload);

    return (
        getApiId(payload) ||
        String(payload.orderId ?? "") ||
        getApiId(nested ?? {}) ||
        String(nested?.orderId ?? "")
    );
};

const hasRichOrderFields = (payload: OrderRealtimePayload) => {
    const candidate = pickOrderPayloadCandidate(payload);
    return Boolean(
        candidate.customerId ||
        candidate.serviceSnapshot ||
        candidate.address ||
        candidate.addressDetail ||
        candidate.createdAt ||
        candidate.startTime ||
        candidate.endTime
    );
};

const getUserLite = (value: unknown) => {
    const userObj = toRecord(value);
    if (!userObj) return null;

    return {
        name:
            typeof userObj.fullName === "string"
                ? userObj.fullName
                : typeof userObj.name === "string"
                    ? userObj.name
                    : "",
        phone: typeof userObj.phone === "string" ? userObj.phone : "",
        email: typeof userObj.email === "string" ? userObj.email : "",
    };
};

const formatWorkTime = (start?: string, end?: string) => {
    if (!start) return "";
    const startText = new Date(start);
    if (Number.isNaN(startText.getTime())) return "";

    const startFormatted = startText.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });

    if (!end) return startFormatted;

    const endText = new Date(end);
    if (Number.isNaN(endText.getTime())) return startFormatted;

    const endFormatted = endText.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return `${startFormatted} - ${endFormatted}`;
};

const buildOrderPatch = (payload: OrderRealtimePayload): Partial<Order> => {
    const candidate = pickOrderPayloadCandidate(payload);
    const patch: Partial<Order> = {};

    const status = normalizeRealtimeOrderStatus(getRealtimeOrderStatus(payload));
    if (status) {
        patch.status = status;
    }

    if (typeof candidate.totalPrice === "number") {
        patch.amount = candidate.totalPrice;
    } else if (typeof candidate.amount === "number") {
        patch.amount = candidate.amount;
    }

    if (typeof candidate.note === "string") {
        patch.note = candidate.note;
    }

    if (typeof candidate.createdAt === "string" && candidate.createdAt) {
        patch.date = candidate.createdAt;

        const date = new Date(candidate.createdAt);
        if (!Number.isNaN(date.getTime())) {
            patch.time = date.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
            });
        }
    }

    const customerObj = getUserLite(candidate.customerId);
    if (customerObj?.name) patch.customer = customerObj.name;
    if (customerObj?.phone) patch.customerPhone = customerObj.phone;
    if (customerObj?.email) patch.customerEmail = customerObj.email;

    if (typeof candidate.customer === "string" && candidate.customer) {
        patch.customer = candidate.customer;
    }
    if (typeof candidate.customerPhone === "string") {
        patch.customerPhone = candidate.customerPhone;
    }
    if (typeof candidate.customerEmail === "string") {
        patch.customerEmail = candidate.customerEmail;
    }

    if (typeof candidate.serviceSnapshot?.name === "string" && candidate.serviceSnapshot.name) {
        patch.service = candidate.serviceSnapshot.name;
    } else if (typeof candidate.service === "string" && candidate.service) {
        patch.service = candidate.service;
    }

    if (typeof candidate.addressDetail === "string" && candidate.addressDetail) {
        patch.address = candidate.addressDetail;
    } else if (typeof candidate.address === "string") {
        patch.address = candidate.address;
    }

    const taskerObj = getUserLite(candidate.tasker) ?? getUserLite(candidate.taskerId);
    if (taskerObj?.name) {
        patch.workerName = taskerObj.name;
    } else if (typeof candidate.tasker === "string" && candidate.tasker) {
        patch.workerName = candidate.tasker;
    }

    const hasStart = typeof candidate.startTime === "string" && candidate.startTime;
    const hasEnd = typeof candidate.endTime === "string" && candidate.endTime;
    if (hasStart || hasEnd) {
        patch.workTime = formatWorkTime(
            hasStart ? candidate.startTime : undefined,
            hasEnd ? candidate.endTime : undefined,
        );
    }

    return patch;
};

// ================= FETCH HELPER =================
async function fetchJson<T>(
    path: string,
    router: ReturnType<typeof useRouter>
): Promise<T> {
    const res = await fetch(`/api${path}`, {
        credentials: "include",
        cache: "no-store",
    });

    if (res.status === 401) {
        router.push("/login");
        throw new Error("UNAUTHORIZED");
    }

    if (res.status === 403) {
        router.push("/");
        throw new Error("FORBIDDEN");
    }

    if (!res.ok) {
        throw new Error(`Request failed: ${path}`);
    }

    return res.json();
}

// ================= HOOK =================
export function useAdminData() {
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);

    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [taskers, setTaskers] = useState<Tasker[]>([]);
    const [provinceId, setProvinceId] = useState("all");
    const [wardId, setWardId] = useState("all");
    const lastOrderReloadAtRef = useRef(0);
    const lastServicesReloadAtRef = useRef(0);
    const [adminIdentity, setAdminIdentity] = useState<{
        userId: string;
        role: string;
    } | null>(null);
    const serviceNameById = useMemo(
        () => Object.fromEntries(services.map((service) => [service.id, service.name])),
        [services],
    );

    // ================= RELOAD =================

    const reloadOrders = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/orders?limit=10000`, {
                credentials: "include",
                cache: "no-store",
            });

            if (!res.ok) return;

            const data = await res.json();
            const next = getListData<ApiOrder>(data).map(mapOrder);

            setOrders(next);
        } catch { }
    }, []);

    const reloadUsers = useCallback(async () => {
        try {
            const res = await fetch(
                `/api/admin/users?role=CUSTOMER&limit=10000`,
                {
                    credentials: "include",
                    cache: "no-store",
                }
            );

            if (!res.ok) return;

            const data: AdminListResponse<ApiUser> = await res.json();

            const newUsers = getListData<ApiUser>(data).map(mapUser);

            setUsers((prev) => (isSame(prev, newUsers) ? prev : newUsers));
        } catch { }
    }, []);

    const reloadServices = useCallback(async () => {
        try {
            const res = await fetch(`/api/services?includeInactive=true`, {
                credentials: "include",
                cache: "no-store",
            });

            if (!res.ok) return;

            const data: ApiService[] = await res.json();
            const mapped = data.map(mapService);

            setServices((prev) => (isSameServiceList(prev, mapped) ? prev : mapped));
        } catch { }
    }, []);

    const maybeReloadServices = useCallback(() => {
        const now = Date.now();
        if (now - lastServicesReloadAtRef.current > 1500) {
            lastServicesReloadAtRef.current = now;
            void reloadServices();
        }
    }, [reloadServices]);

    const reloadTaskers = useCallback(async () => {
        try {
            const query = new URLSearchParams({
                role: "TASKER",
                limit: "10000",
                ...(provinceId !== "all" && { provinceId }),
                ...(wardId !== "all" && { wardId }),
            });

            const res = await fetch(`/api/admin/users?${query}`, {
                credentials: "include",
                cache: "no-store",
            });

            if (!res.ok) return;

            const data: AdminListResponse<ApiUser> = await res.json();

            const newTaskers = getListData(data).map((t) =>
                mapTasker(t, serviceNameById)
            );

            setTaskers(newTaskers);
        } catch (err) {
            console.error(err);
        }
    }, [provinceId, serviceNameById, wardId]);

    // ================= INITIAL LOAD =================

    useEffect(() => {
        async function init() {
            try {
                const user = await fetchJson<ApiUser>("/auth/me", router);

                if (user.role !== "ADMIN") {
                    router.push("/");
                    return;
                }

                setAdminIdentity({
                    userId: getApiId(user),
                    role: user.role,
                });

                const [servicesResult, ordersResult, customersResult, taskersResult] =
                    await Promise.allSettled([
                        fetchJson<ApiService[]>("/services?includeInactive=true", router),
                        fetchJson<AdminListResponse<ApiOrder>>(
                            "/admin/orders?limit=10000",
                            router
                        ),
                        fetchJson<AdminListResponse<ApiUser>>(
                            "/admin/users?role=CUSTOMER&limit=10000",
                            router
                        ),
                        fetchJson<AdminListResponse<ApiUser>>(
                            "/admin/users?role=TASKER&limit=10000",
                            router
                        ),
                    ]);

                const mappedServices =
                    servicesResult.status === "fulfilled"
                        ? servicesResult.value.map(mapService)
                        : [];

                if (mappedServices.length > 0) {
                    setServices(mappedServices);
                }

                if (ordersResult.status === "fulfilled") {
                    setOrders(getListData<ApiOrder>(ordersResult.value).map(mapOrder));
                }

                if (customersResult.status === "fulfilled") {
                    setUsers(getListData<ApiUser>(customersResult.value).map(mapUser));
                }

                if (taskersResult.status === "fulfilled") {
                    const serviceNameById = Object.fromEntries(
                        mappedServices.map((s) => [s.id, s.name])
                    );

                    setTaskers(
                        getListData<ApiUser>(taskersResult.value).map((t) =>
                            mapTasker(t, serviceNameById)
                        )
                    );
                }
            } catch (err) {
                if (
                    err instanceof Error &&
                    ["UNAUTHORIZED", "FORBIDDEN"].includes(err.message)
                ) {
                    return;
                }

                toast({
                    title: "Lỗi tải dữ liệu",
                    description: "Không thể lấy dữ liệu admin",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        }

        init();
    }, [router]);

    const syncServicesAndTaskers = useCallback(() => {
        void reloadServices();
        void reloadTaskers();
    }, [reloadServices, reloadTaskers]);

    const onTaskerChanged = useCallback(() => {
        void reloadTaskers();
    }, [reloadTaskers]);

    const onOrderCreated = useCallback((order: ApiOrder) => {
        const mapped = mapOrder(order);
        if (!mapped.id) {
            void reloadOrders();
            return;
        }
        setOrders((prev) => upsertById(prev, mapped));

        // Refresh services counts (throttled) so table always reflects true values
        maybeReloadServices();
    }, [reloadOrders, maybeReloadServices]);

    const onOrderUpdated = useCallback((incoming: OrderSocketPayload) => {
        const payload = incoming as OrderRealtimePayload;
        const orderId = getRealtimeOrderId(payload);

        if (!orderId) {
            void reloadOrders();
            return;
        }

        const patch = buildOrderPatch(payload);
        const hasPatchField = Object.keys(patch).length > 0;

        let shouldReload = false;

        setOrders((prev) => {
            const index = prev.findIndex((item) => item.id === orderId);
            if (index === -1) {
                shouldReload = true;
                return prev;
            }

            const current = prev[index];
            const hasRichPayload = hasRichOrderFields(payload);

            let nextOrder = current;

            if (hasPatchField) {
                nextOrder = {
                    ...current,
                    ...patch,
                };
            } else if (hasRichPayload) {
                const normalized = mapOrder({
                    ...pickOrderPayloadCandidate(payload),
                    _id: orderId,
                });
                nextOrder = {
                    ...current,
                    ...normalized,
                    id: current.id,
                };
            } else {
                shouldReload = true;
            }

            if (nextOrder === current) {
                return prev;
            }

            const next = [...prev];
            next[index] = nextOrder;
            return next;
        });

        if (shouldReload) {
            const now = Date.now();
            if (now - lastOrderReloadAtRef.current > 1500) {
                lastOrderReloadAtRef.current = now;
                void reloadOrders();
            }
        }
        // Ensure services counts stay accurate after order updates (payments, service changes, etc.)
        maybeReloadServices();
    }, [reloadOrders, maybeReloadServices]);

    const onUserUpsert = useCallback((user: ApiUser) => {
        const normalizedRole = String(user.role ?? "").trim().toUpperCase();

        if (normalizedRole === "TASKER") {
            const mappedTasker = mapTasker(user, serviceNameById);
            setTaskers((prev) => upsertById(prev, mappedTasker));
            return;
        }

        const mappedUser = mapUser(user);
        setUsers((prev) => upsertById(prev, mappedUser));
    }, [serviceNameById]);

    const onUserDeleted = useCallback((payload: SocketIdPayload) => {
        const deletedId = getApiId(payload);
        if (!deletedId) return;
        setUsers((prev) => prev.filter((u) => u.id !== deletedId));
        setTaskers((prev) => prev.filter((tasker) => tasker.id !== deletedId));
    }, []);

    const onServiceDeleted = useCallback(
        (payload: SocketIdPayload) => {
            const deletedId = getApiId(payload);
            if (!deletedId) return;
            setServices((prev) => prev.filter((service) => service.id !== deletedId));
            void reloadTaskers();
        },
        [reloadTaskers]
    );

    const onResync = useCallback(() => {
        void Promise.all([
            reloadOrders(),
            reloadUsers(),
            reloadServices(),
            reloadTaskers(),
        ]);
    }, [reloadOrders, reloadUsers, reloadServices, reloadTaskers]);

    const { isConnected: isRealtimeConnected } = useAdminSocket({
        identity: adminIdentity,
        onOrderCreated,
        onOrderUpdated,
        onUserUpsert,
        onUserDeleted,
        onTaskerChanged,
        onServicesChanged: syncServicesAndTaskers,
        onServiceDeleted,
        onResync,
    });

    useEffect(() => {
        reloadTaskers();
    }, [reloadTaskers]);

    // ================= RETURN =================

    return {
        isLoading,
        orders,
        users,
        services,
        taskers,
        provinceId,
        wardId,
        setProvinceId,
        setWardId,
        setOrders,
        setUsers,
        setServices,
        setTaskers,
        reloadOrders,
        reloadUsers,
        reloadServices,
        reloadTaskers,
        isRealtimeConnected,
    };
}
