type NotificationLike = {
  _id?: string;
  title?: string;
  content?: string;
  type?: string;
  orderId?: string;
  senderId?: string;
  senderName?: string;
  createdAt?: string;
  updatedAt?: string;
  isRead?: boolean;
};

type GenericPayload = Record<string, unknown>;

const normalizeType = (value: unknown) => String(value ?? "").trim().toLowerCase();
const normalizeOrderId = (value: unknown) => String(value ?? "").trim();

const asRecord = (value: unknown): GenericPayload =>
  value && typeof value === "object" ? (value as GenericPayload) : {};

const readNested = (record: GenericPayload, key: string) => {
  const value = record[key];
  return value && typeof value === "object" ? asRecord(value) : {};
};

const extractOrderId = (payload: unknown) => {
  const root = asRecord(payload);
  const data = readNested(root, "data");
  return normalizeOrderId(root._id || root.orderId || data._id || data.orderId);
};

const extractStatus = (payload: unknown) => {
  const root = asRecord(payload);
  const data = readNested(root, "data");
  return String(root.status || data.status || "").trim().toUpperCase();
};

const extractTaskerName = (payload: unknown) => {
  const root = asRecord(payload);
  const data = readNested(root, "data");
  const tasker = readNested(root, "tasker");
  const taskerId = readNested(root, "taskerId");
  const dataTasker = readNested(data, "tasker");
  const dataTaskerId = readNested(data, "taskerId");

  return String(
    tasker.name ||
      root.taskerName ||
      taskerId.fullName ||
      dataTasker.name ||
      data.taskerName ||
      dataTaskerId.fullName ||
      root.senderName ||
      "",
  ).trim();
};

export const getRealtimeNotificationIdentity = (notification: NotificationLike) => {
  const type = normalizeType(notification.type);
  const orderId = normalizeOrderId(notification.orderId);

  if (type === "order_accepted" && orderId) {
    return `order_accepted:${orderId}`;
  }

  const id = String(notification._id ?? "").trim();
  if (id) {
    return `id:${id}`;
  }

  return `${type}:${orderId}:${String(notification.senderId ?? notification.senderName ?? "").trim()}`;
};

export const upsertRealtimeNotification = <T extends NotificationLike>(
  list: T[],
  next: T,
) => {
  const nextIdentity = getRealtimeNotificationIdentity(next);
  const nextType = normalizeType(next.type);
  const nextOrderId = normalizeOrderId(next.orderId);

  return [
    next,
    ...list.filter((item) => {
      const currentIdentity = getRealtimeNotificationIdentity(item);
      if (currentIdentity === nextIdentity) {
        return false;
      }

      if (
        nextType === "order_accepted" &&
        nextOrderId &&
        normalizeType(item.type) === "order_accepted" &&
        normalizeOrderId(item.orderId) === nextOrderId
      ) {
        return false;
      }

      return true;
    }),
  ];
};

export const buildOptimisticOrderAcceptedNotification = (
  payload: unknown,
): NotificationLike | null => {
  if (extractStatus(payload) !== "ASSIGNED") {
    return null;
  }

  const orderId = extractOrderId(payload);
  if (!orderId) {
    return null;
  }

  const taskerName = extractTaskerName(payload) || "Tasker";
  const now = new Date().toISOString();

  return {
    _id: `optimistic-order-accepted:${orderId}`,
    title: "Đơn hàng được nhận",
    content: `${taskerName} đã nhận đơn hàng của bạn`,
    type: "order_accepted",
    orderId,
    senderName: taskerName,
    isRead: false,
    createdAt: now,
    updatedAt: now,
  };
};
