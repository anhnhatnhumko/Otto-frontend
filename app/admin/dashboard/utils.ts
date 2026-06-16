import type {
    Order,
    User,
    Service,
    Tasker,
    ApiOrder,
    ApiUser,
    ApiService,
    AdminListResponse,
} from "./types";

export const getApiId = (item: { _id?: string; id?: string }): string =>
    String(item._id ?? item.id ?? "");

export const getListData = <T>(payload: AdminListResponse<T> | T[]): T[] =>
    Array.isArray(payload) ? payload : payload.data ?? [];

export const formatDate = (value?: string | null): string => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("vi-VN");
};

export const formatTime = (value?: string | null): string => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

export const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export const mapOrderStatus = (status?: string): Order["status"] => {
    const statusMap: Record<string, Order["status"]> = {
        ASSIGNED: "confirmed",
        IN_PROGRESS: "in_progress",
        COMPLETED: "completed",
        WAITING_CONFIRMATION: "completed",
        CANCELLED: "cancelled",
        AUTO_CANCELLED: "cancelled",
        TIMEOUT: "cancelled",
    };
    return statusMap[status ?? ""] ?? "pending";
};

export const mapUserStatus = (status?: string): User["status"] => {
    if (status === "BLOCKED") return "banned";
    if (status === "ACTIVE") return "active";
    return "inactive";
};

export const mapTaskerStatus = (tasker: ApiUser): Tasker["status"] => {
    if (tasker.status === "BLOCKED") return "banned";
    if (tasker.isEmailVerified === false) return "pending";
    if (tasker.status === "ACTIVE" && tasker.isAvailable === false) return "inactive";
    if (tasker.status === "ACTIVE") return "active";
    return "inactive";
};

export const mapService = (service: ApiService): Service => ({
    id: getApiId(service),
    name: service.name ?? "Dịch vụ chưa đặt tên",
    description: service.description ?? "",
    price: service.price ?? service.pricePerHour ?? 0,
    duration: service.estimatedTime ? `${service.estimatedTime} phút` : "",
    status: service.isActive === false ? "inactive" : "active",
    bookings: service.bookings ?? 0,
});

export const mapOrder = (order: ApiOrder): Order => {
    const start = order.startTime;
    const end = order.endTime;
    // // const customer =
    // //     typeof order.customerId === "object"
    // //         ? order.customerId.fullName || order.customerId.name
    // //         : order.customer;
    // const customer =
    //     order.customerId && typeof order.customerId === "object"
    //         ? order.customerId.fullName || order.customerId.name
    //         : order.customer ?? null;
    // const tasker =
    //     typeof order.tasker === "object"
    //         ? order.tasker.name || order.tasker.fullName
    //         : typeof order.taskerId === "object"
    //             ? order.taskerId.fullName || order.taskerId.name
    //             : order.tasker;

    const getUser = (u: any) => {
        if (!u) return null;

        if (typeof u === "object") {
            return {
                name: u.fullName || u.name || null,
                phone: u.phone || "",
                email: u.email || "",
            };
        }

        return null;
    };

    const customerObj = getUser(order.customerId);
    const taskerObj =
        getUser(order.tasker) || getUser(order.taskerId);

    const customer =
        customerObj?.name ||
        (typeof order.customer === "string" ? order.customer : null) ||
        "Chưa có thông tin";

    const tasker =
        taskerObj?.name ||
        (typeof order.tasker === "string" ? order.tasker : null) ||
        "Không có";

    return {
        id: getApiId(order),
        customer: customer ?? "Chưa có thông tin",
        customerPhone:
            typeof order.customerId === "object"
                ? order.customerId.phone ?? order.customerPhone ?? ""
                : order.customerPhone ?? "",
        customerEmail:
            typeof order.customerId === "object"
                ? order.customerId.email ?? order.customerEmail ?? ""
                : order.customerEmail ?? "",
        service: order.serviceSnapshot?.name ?? order.service ?? "Dịch vụ chưa xác định",
        date: order.createdAt || "",
        time: formatTime(order.createdAt),
        workTime: (() => {
            if (!start) return "";

            const startStr = formatTime(start);

            if (!end) return startStr;

            const endStr = formatTime(end);

            return `${startStr} - ${endStr}`;
        })(),
        address: order.addressDetail ?? order.address ?? "",
        status: mapOrderStatus(order.status),
        amount: order.totalPrice ?? order.amount ?? 0,
        note: order.note,
        createdAt: order.createdAt,
        startTime: order.startTime,
        workerName: tasker ?? "Không có ",
    };
};

export const mapUser = (user: ApiUser): User => ({
    id: getApiId(user),
    name: user.fullName ?? user.name ?? "Người dùng chưa đặt tên",
    email: user.email ?? "",
    phone: user.phone ?? "",
    orders: user.orders ?? 0,
    status: mapUserStatus(user.status),
    joinDate: formatDate(user.createdAt),
    totalSpent: user.totalSpent ?? 0,
});

export const mapTasker = (tasker: ApiUser, serviceNameById: Record<string, string>): Tasker => ({
    id: getApiId(tasker),
    name: tasker.fullName ?? tasker.name ?? "Tasker chưa đặt tên",
    email: tasker.email ?? "",
    phone: tasker.phone ?? "",
    avatar: tasker.avatar,
    services:
        tasker.skills
            ?.map((skill) => {
                if (typeof skill === "string") return serviceNameById[skill] ?? "Dịch vụ chưa rõ";
                const skillId = getApiId(skill);
                return skill.name ?? serviceNameById[skillId] ?? "Dịch vụ chưa rõ";
            })
            .filter(Boolean) ?? [],
    rating: tasker.rating ?? 0,
    completedJobs: tasker.totalJobs ?? tasker.completedJobs ?? 0,
    status: mapTaskerStatus(tasker),
    joinDate: formatDate(tasker.createdAt),
    address: tasker.address ?? "",
    idCard: tasker.idCard ?? "",
    verified: tasker.isEmailVerified ?? false,
    earnings: tasker.earnings ?? 0,
    provinceId: tasker.provinceId ?? "all",
    wardId: tasker.wardId ?? "all",
});

export const isDestructiveAction = (action?: string): boolean => {
    if (!action) return false;
    return ["cancel", "ban", "delete", "reject"].some((keyword) => action.includes(keyword));
};
