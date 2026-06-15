import { getAccessToken } from "./session";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

export type HomeService = {
  id: string;
  title: string;
  description?: string;
  pricePerHour: number;
  bookings: number;
  minHours: number;
  maxHours: number;
  estimatedTime?: number;
};

export type LocationOption = {
  id: string;
  name: string;
  provinceId?: string;
  type?: string;
};

export type WalletSummary = {
  balance: number;
  pendingBalance?: number;
};

export type WalletTransaction = {
  _id: string;
  type: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  bankName?: string;
  accountNumber?: string;
  externalId?: string;
  orderId?: any;
  createdAt?: string;
  updatedAt?: string;
};

export type WalletDepositSession = {
  checkoutUrl: string;
  transactionId: string;
  sessionId?: string;
};

export type WalletDepositRedirectOptions = {
  successUrl?: string;
  cancelUrl?: string;
};

export type StripeSessionConfirmResult = {
  redirectUrl?: string;
};

export type DraftOrderPayload = {
  service: HomeService;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  provinceId: string;
  provinceName: string;
  wardId: string;
  wardName: string;
  addressDetail: string;
  address: string;
  note: string;
  totalHours: number;
  totalPrice: number;
};

export type CustomerOrder = {
  _id: string;
  id: string;
  status: string;
  statusLabel: string;
  service: string;
  address: string;
  addressDetail: string;
  note: string;
  paymentMethod: string;
  paymentStatus: string;
  isPaid: boolean;
  isRefunded: boolean;
  totalHours: number;
  totalPrice: number;
  scheduleTime?: string;
  startTime: string;
  endTime: string;
  dateLabel: string;
  timeLabel: string;
  tasker?: {
    name: string;
    avatar?: string;
    rating: number;
    completedJobs: number;
    phone?: string;
  };
  rating?: number;
  review?: string;
  raw: any;
};

const iconKeyByName: Record<string, string> = {
  "Dọn dẹp nhà cửa": "home",
  "Giặt ủi": "shirt",
  "Sửa chữa điện, nước": "wrench",
  "Chăm sóc người cao tuổi": "heart",
  "Vệ sinh máy lạnh": "sparkles",
  "Rửa xe tại nhà": "car",
  "Sơn nhà": "brush",
  "Diệt côn trùng": "bug",
};

function tryParseJsonString(value: string): unknown | null {
  const text = value.trim();

  if (!text || (!text.startsWith("{") && !text.startsWith("["))) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractErrorMessage(
  payload: any,
  fallback = "Có lỗi xảy ra. Vui lòng thử lại.",
): string {
  if (typeof payload === "string") {
    const parsed = tryParseJsonString(payload);
    if (parsed) {
      return extractErrorMessage(parsed, fallback);
    }

    return payload.trim() || fallback;
  }

  const message = payload?.message;
  if (Array.isArray(message)) {
    return (
      message
        .map((item) => extractErrorMessage(item, ""))
        .filter(Boolean)
        .join(", ") || fallback
    );
  }

  if (typeof message === "string" && message.trim()) {
    const parsed = tryParseJsonString(message);
    if (parsed) {
      return extractErrorMessage(parsed, fallback);
    }

    return message.trim();
  }

  if (typeof payload?.error === "string" && payload.error.trim()) {
    if (payload.error.trim().toLowerCase() === "unauthorized") {
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    }

    return payload.error.trim();
  }

  if (Number(payload?.statusCode) === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  return fallback;
}

async function request<T = any>(path: string, opts: RequestInit = {}) {
  try {
    const accessToken = await getAccessToken();
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(opts.headers || {}),
      },
      credentials: "include",
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if (!res.ok) {
      throw new Error(extractErrorMessage(json, `HTTP ${res.status}`));
    }

    return (json?.data ?? json) as T;
  } catch (error: any) {
    if (error instanceof TypeError) {
      console.error(
        `[API] Network error calling ${API_BASE}${path}:`,
        error.message,
      );
      throw new Error(
        `Lỗi kết nối mạng. Vui lòng kiểm tra backend IP và port: ${API_BASE}`,
      );
    }
    throw error;
  }
}

async function requestFormData<T = any>(path: string, opts: RequestInit = {}) {
  try {
    const accessToken = await getAccessToken();
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
      ...opts,
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(opts.headers || {}),
      },
      credentials: "include",
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if (!res.ok) {
      throw new Error(extractErrorMessage(json, `HTTP ${res.status}`));
    }

    return (json?.data ?? json) as T;
  } catch (error: any) {
    if (error instanceof TypeError) {
      console.error(
        `[API] Network error calling ${API_BASE}${path}:`,
        error.message,
      );
      throw new Error(
        `Lỗi kết nối mạng. Vui lòng kiểm tra backend IP và port: ${API_BASE}`,
      );
    }
    throw error;
  }
}

function normalizeServices(raw: any[]): HomeService[] {
  return raw
    .filter((item) => item && item._id && item.name)
    .map((item) => ({
      id: String(item._id),
      title: String(item.name),
      description: item.description ? String(item.description) : "",
      pricePerHour: Number(item.pricePerHour || 0),
      bookings: Number(item.bookings || 0),
      minHours: Math.max(1, Number(item.minHours || 2)),
      maxHours: Math.max(1, Number(item.maxHours || 12)),
      estimatedTime: item.estimatedTime
        ? Number(item.estimatedTime)
        : undefined,
    }));
}

function normalizeLocations(raw: any[]): LocationOption[] {
  return raw
    .filter((item) => item && item._id && item.name)
    .map((item) => ({
      id: String(item._id),
      name: String(item.name),
      provinceId: item.provinceId ? String(item.provinceId) : undefined,
      type: item.type ? String(item.type) : undefined,
    }));
}

function formatCurrencyVnd(price: number) {
  return `${Math.round(price).toLocaleString("vi-VN")}đ/giờ`;
}

function formatMoney(price: number) {
  return `${Math.round(price).toLocaleString("vi-VN")}đ`;
}

function formatTime(dateLike?: string) {
  if (!dateLike) return "—";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateLike?: string) {
  if (!dateLike) return "—";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function toIsoStringOrEmpty(dateLike?: string) {
  if (!dateLike) return "";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function toIsoStringOrUndefined(dateLike?: string) {
  if (!dateLike) return undefined;
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function extractLocationName(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value?.name === "string") return value.name.trim();
  return "";
}

function getPaymentStatus(order: any) {
  if (order?.paymentStatus) return String(order.paymentStatus);
  if (String(order?.paymentMethod || "").toLowerCase() === "cash") {
    return order?.paidAt ? "PAID" : "CASH";
  }
  return order?.paidAt ? "PAID" : "PENDING";
}

export function getOrderStatusLabel(status?: string) {
  switch (String(status || "").toUpperCase()) {
    case "PENDING_PAYMENT":
      return "Chờ thanh toán";
    case "PAID":
      return "Đã thanh toán";
    case "SEARCHING":
      return "Đang tìm tasker";
    case "ASSIGNED":
      return "Đã có tasker";
    case "IN_PROGRESS":
      return "Đang thực hiện";
    case "WAITING_CONFIRMATION":
      return "Chờ xác nhận hoàn thành";
    case "COMPLETED":
      return "Hoàn thành";
    case "CANCELLED":
      return "Đã hủy";
    case "TIMEOUT":
      return "Quá hạn";
    case "AUTO_CANCELLED":
      return "Tự hủy";
    default:
      return status || "Đang cập nhật";
  }
}

export function mapOrderResponse(raw: any): CustomerOrder {
  const tasker = raw?.tasker || raw?.taskerId;
  const addressDetail = String(raw?.addressDetail || "").trim();
  const savedAddress = String(raw?.address || "").trim();
  const wardName = extractLocationName(raw?.wardName || raw?.ward || raw?.wardId);
  const provinceName = extractLocationName(
    raw?.provinceName || raw?.province || raw?.provinceId,
  );
  const scheduleTime = toIsoStringOrUndefined(raw?.scheduleTime);
  const startTime = toIsoStringOrEmpty(raw?.startTime || raw?.scheduleTime);
  const endTime = toIsoStringOrEmpty(raw?.endTime);
  const fullAddress = [addressDetail, wardName, provinceName]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(", ");

  return {
    _id: String(raw?._id || raw?.id || ""),
    id: String(raw?._id || raw?.id || ""),
    status: String(raw?.status || ""),
    statusLabel: getOrderStatusLabel(raw?.status),
    service: String(raw?.serviceSnapshot?.name || raw?.service || "Dịch vụ"),
    address: savedAddress || fullAddress || addressDetail || "Chưa có địa chỉ",
    addressDetail: addressDetail || savedAddress,
    note: String(raw?.note || raw?.detail || ""),
    paymentMethod: String(raw?.paymentMethod || "cash"),
    paymentStatus: getPaymentStatus(raw),
    isPaid: Boolean(raw?.isPaid || raw?.paidAt),
    isRefunded: Boolean(raw?.isRefunded),
    totalHours: Number(raw?.totalHours || 0),
    totalPrice: Number(raw?.totalPrice || raw?.price || raw?.estimate || 0),
    scheduleTime,
    startTime,
    endTime,
    dateLabel: formatDate(raw?.startTime || raw?.scheduleTime),
    timeLabel:
      raw?.startTime && raw?.endTime
        ? `${formatTime(raw.startTime)} - ${formatTime(raw.endTime)}`
        : formatTime(raw?.scheduleTime),
    tasker: tasker
      ? {
          name: String(tasker.name || tasker.fullName || "Tasker"),
          avatar: tasker.avatar ? String(tasker.avatar) : undefined,
          rating: Number(tasker.rating || 0),
          completedJobs: Number(tasker.completedJobs || tasker.totalJobs || 0),
          phone: tasker.phone ? String(tasker.phone) : undefined,
        }
      : undefined,
    rating:
      raw?.rating === undefined || raw?.rating === null ? undefined : Number(raw.rating),
    review: raw?.review ? String(raw.review) : undefined,
    raw,
  };
}

export default {
  async getHomeServices() {
    const data = await request<any[]>("/services");
    return normalizeServices(Array.isArray(data) ? data : []);
  },

  getHomeServiceIconKey(serviceName: string) {
    return iconKeyByName[serviceName] || "home";
  },

  formatServicePrice(pricePerHour: number) {
    return formatCurrencyVnd(pricePerHour);
  },

  formatMoney,

  async getProvinces() {
    const data = await request<any[]>("/locations/provinces");
    return normalizeLocations(Array.isArray(data) ? data : []);
  },

  async getWards(provinceId: string) {
    const [wardData, allLocationData] = await Promise.all([
      request<any[]>(`/locations?provinceId=${provinceId}&type=WARD`).catch(
        () => [],
      ),
      request<any[]>(`/locations?provinceId=${provinceId}`).catch(() => []),
    ]);

    const normalizedWardData = normalizeLocations(
      Array.isArray(wardData) ? wardData : [],
    );
    if (normalizedWardData.length > 0) {
      return normalizedWardData;
    }

    const normalizedAllLocations = normalizeLocations(
      Array.isArray(allLocationData) ? allLocationData : [],
    );

    return normalizedAllLocations.filter((item) =>
      ["WARD", "COMMUNE", "SPECIAL", ""].includes(
        String(item.type || "").toUpperCase(),
      ),
    );
  },

  async getWallet() {
    const data = await request<any>("/wallet");
    return {
      balance: Number(data?.balance || 0),
      pendingBalance: Number(data?.pendingBalance || 0),
    } as WalletSummary;
  },

  async getWalletTransactions() {
    const data = await request<any[]>("/wallet/transactions");
    return (Array.isArray(data) ? data : []).map((item) => ({
      _id: String(item?._id || item?.id || ""),
      type: String(item?.type || ""),
      amount: Number(item?.amount || 0),
      status: String(item?.status || "PENDING"),
      paymentMethod: item?.paymentMethod ? String(item.paymentMethod) : undefined,
      bankName: item?.bankName ? String(item.bankName) : undefined,
      accountNumber: item?.accountNumber ? String(item.accountNumber) : undefined,
      externalId: item?.externalId ? String(item.externalId) : undefined,
      orderId: item?.orderId,
      createdAt: item?.createdAt ? String(item.createdAt) : undefined,
      updatedAt: item?.updatedAt ? String(item.updatedAt) : undefined,
    })) as WalletTransaction[];
  },

  async createWalletDeposit(
    amount: number,
    redirectOptions?: WalletDepositRedirectOptions,
  ) {
    return await request<WalletDepositSession>("/wallet/deposit", {
      method: "POST",
      body: JSON.stringify({
        amount,
        method: "STRIPE",
        successUrl: redirectOptions?.successUrl,
        cancelUrl: redirectOptions?.cancelUrl,
      }),
    });
  },

  async confirmStripeSession(sessionId: string) {
    return await request<StripeSessionConfirmResult>(
      `/payments/stripe/confirm?session_id=${encodeURIComponent(sessionId)}`,
      {
        method: "GET",
      },
    );
  },

  async getOrders() {
    try {
      const primaryData = await request<any[]>("/orders/my");
      const mappedPrimary = (Array.isArray(primaryData) ? primaryData : []).map(
        mapOrderResponse,
      );

      if (mappedPrimary.length > 0) {
        return mappedPrimary;
      }
    } catch (error) {
      console.warn("Failed to fetch /orders/my:", error);
    }

    const fallbackData = await request<any[]>("/orders?sort=-createdAt&limit=200");
    return (Array.isArray(fallbackData) ? fallbackData : []).map(mapOrderResponse);
  },

  async getOrder(id: string) {
    const data = await request<any>(`/orders/${id}`);
    return mapOrderResponse(data);
  },

  async createOrder(
    payload: DraftOrderPayload & {
      paymentMethod: "cash" | "wallet" | "stripe";
    },
  ) {
    return await request<any>("/orders", {
      method: "POST",
      body: JSON.stringify({
        serviceId: payload.service.id,
        provinceId: payload.provinceId,
        wardId: payload.wardId,
        address: payload.address,
        addressDetail: payload.addressDetail,
        scheduleTime: new Date(
          `${payload.scheduleDate}T${payload.startTime}:00`,
        ).toISOString(),
        startTime: payload.startTime,
        endTime: payload.endTime,
        note: payload.note,
        paymentMethod: payload.paymentMethod,
        serviceSnapshot: {
          name: payload.service.title,
          price: payload.service.pricePerHour,
        },
      }),
    });
  },

  async createWalletPayment(orderId: string) {
    return await request<{ message: string; transactionId: string }>(
      "/orders/wallet/create-payment",
      {
        method: "POST",
        body: JSON.stringify({ orderId }),
      },
    );
  },

  async createStripePayment(orderId: string) {
    return await request<{ checkoutUrl: string }>(`/payments/${orderId}/create`, {
      method: "POST",
      body: JSON.stringify({ method: "stripe" }),
    });
  },

  async verifyWalletPayment(transactionId: string, otp: string) {
    return await request<{ success: boolean }>("/orders/wallet/verify-payment", {
      method: "POST",
      body: JSON.stringify({ transactionId, otp }),
    });
  },

  async cancelOrder(orderId: string) {
    return await request<any>(`/orders/${orderId}/cancel`, {
      method: "PATCH",
    });
  },

  async confirmCompleted(orderId: string) {
    return await request<any>(`/orders/${orderId}/confirm-completed`, {
      method: "PATCH",
    });
  },

  async rateCompletedOrder(
    orderId: string,
    payload: { rating: number; review?: string },
  ) {
    return await request<any>(`/orders/${orderId}/rate`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async getProfile() {
    return await request("/customers/profile");
  },

  async getProfileStats() {
    try {
      return await request("/customers/profile-stats");
    } catch (error) {
      console.warn("Failed to fetch profile stats:", error);
      return null;
    }
  },

  async getUpcomingBookings(limit = 5) {
    try {
      const data = await request<any[]>(
        `/orders?status=PENDING_PAYMENT,PAID,SEARCHING,ASSIGNED,IN_PROGRESS,WAITING_CONFIRMATION&sort=-scheduleTime&limit=${limit}`,
      );
      return (Array.isArray(data) ? data : []).map(mapOrderResponse);
    } catch (error) {
      console.warn("Failed to fetch upcoming bookings:", error);
      return [] as CustomerOrder[];
    }
  },

  async updateProfile(payload: {
    fullName?: string;
    email?: string;
    phone?: string;
    birthday?: string;
    address?: string;
  }) {
    try {
      return await request("/customers/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } catch (error: any) {
      throw new Error(error?.message || "Cập nhật hồ sơ thất bại");
    }
  },

  async uploadAvatar(file: { uri: string; name: string; type: string }) {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);

      return await requestFormData("/upload/avatar", {
        method: "POST",
        body: formData,
      });
    } catch (error: any) {
      throw new Error(error?.message || "Upload ảnh thất bại");
    }
  },
};
