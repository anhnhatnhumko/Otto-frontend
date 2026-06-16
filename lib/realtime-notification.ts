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
type SupportedRealtimeRole = "CUSTOMER" | "TASKER" | "ADMIN" | string;

const normalizeType = (value: unknown) => String(value ?? "").trim().toLowerCase();
const normalizeOrderId = (value: unknown) => String(value ?? "").trim();
const normalizeSenderId = (value: unknown) => String(value ?? "").trim();
const normalizeContent = (value: unknown) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .slice(0, 120);

const asRecord = (value: unknown): GenericPayload =>
  value && typeof value === "object" ? (value as GenericPayload) : {};

const readNested = (record: GenericPayload, key: string) => {
  const value = record[key];
  return value && typeof value === "object" ? asRecord(value) : {};
};

const extractOrderId = (payload: unknown) => {
  const root = asRecord(payload);
  const data = readNested(root, "data");
  const order = readNested(root, "order");
  const nestedPayload = readNested(root, "payload");

  return normalizeOrderId(
    root._id ||
      root.orderId ||
      data._id ||
      data.orderId ||
      order._id ||
      order.orderId ||
      nestedPayload._id ||
      nestedPayload.orderId,
  );
};

const extractTimestamp = (payload: unknown) => {
  const root = asRecord(payload);
  const data = readNested(root, "data");

  return String(
    root.createdAt ||
      data.createdAt ||
      root.updatedAt ||
      data.updatedAt ||
      new Date().toISOString(),
  );
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
      tasker.fullName ||
      root.taskerName ||
      taskerId.fullName ||
      taskerId.name ||
      dataTasker.name ||
      dataTasker.fullName ||
      data.taskerName ||
      dataTaskerId.fullName ||
      dataTaskerId.name ||
      root.senderName ||
      "",
  ).trim();
};

const extractCustomerName = (payload: unknown) => {
  const root = asRecord(payload);
  const data = readNested(root, "data");
  const customer = readNested(root, "customer");
  const customerId = readNested(root, "customerId");
  const dataCustomer = readNested(data, "customer");
  const dataCustomerId = readNested(data, "customerId");

  return String(
    customer.name ||
      customer.fullName ||
      root.customerName ||
      customerId.fullName ||
      customerId.name ||
      dataCustomer.name ||
      dataCustomer.fullName ||
      data.customerName ||
      dataCustomerId.fullName ||
      dataCustomerId.name ||
      root.senderName ||
      "",
  ).trim();
};

const extractSenderId = (payload: unknown) => {
  const root = asRecord(payload);
  const data = readNested(root, "data");
  const sender = readNested(root, "sender");
  const dataSender = readNested(data, "sender");

  return normalizeSenderId(
    root.senderId ||
      data.senderId ||
      sender._id ||
      sender.id ||
      dataSender._id ||
      dataSender.id,
  );
};

const extractSenderName = (payload: unknown) => {
  const root = asRecord(payload);
  const data = readNested(root, "data");
  const sender = readNested(root, "sender");
  const dataSender = readNested(data, "sender");

  return String(
    root.senderName ||
      data.senderName ||
      sender.fullName ||
      sender.name ||
      dataSender.fullName ||
      dataSender.name ||
      "",
  ).trim();
};

const extractMessageText = (payload: unknown) => {
  const root = asRecord(payload);
  const data = readNested(root, "data");
  return String(root.text || data.text || root.content || data.content || "").trim();
};

export const getRealtimeNotificationIdentity = (notification: NotificationLike) => {
  const type = normalizeType(notification.type);
  const orderId = normalizeOrderId(notification.orderId);
  const senderId = normalizeSenderId(notification.senderId);
  const content = normalizeContent(notification.content);

  if (
    (type === "order_accepted" ||
      type === "order_completed_confirmation" ||
      type === "order_cancelled") &&
    orderId
  ) {
    return `${type}:${orderId}`;
  }

  if (type === "chat_message" && orderId) {
    return `chat_message:${orderId}:${senderId}:${content}`;
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
        (nextType === "order_accepted" ||
          nextType === "order_completed_confirmation" ||
          nextType === "order_cancelled") &&
        nextOrderId &&
        normalizeType(item.type) === nextType &&
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
  const orderId = extractOrderId(payload);
  if (!orderId) {
    return null;
  }

  const status = extractStatus(payload);
  const taskerName = extractTaskerName(payload) || "Tasker";
  const now = extractTimestamp(payload);

  if (status === "ASSIGNED") {
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
  }

  if (status === "WAITING_CONFIRMATION") {
    return {
      _id: `optimistic-order-completion:${orderId}`,
      title: "Tasker đã báo hoàn thành",
      content: `${taskerName} đã báo hoàn thành công việc. Hãy kiểm tra và xác nhận đơn hàng của bạn.`,
      type: "order_completed_confirmation",
      orderId,
      senderName: taskerName,
      isRead: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  if (status === "CANCELLED" || status === "AUTO_CANCELLED") {
    return {
      _id: `optimistic-order-cancelled:${orderId}`,
      title: "Đơn hàng đã bị hủy",
      content: "Đơn hàng của bạn vừa được cập nhật sang trạng thái đã hủy.",
      type: "order_cancelled",
      orderId,
      senderName: taskerName,
      isRead: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  return null;
};

export const buildOptimisticCustomerOrderNotification = (
  payload: unknown,
): NotificationLike | null => buildOptimisticOrderAcceptedNotification(payload);

export const buildOptimisticTaskerOrderCancelledNotification = (
  payload: unknown,
): NotificationLike | null => {
  const orderId = extractOrderId(payload);
  if (!orderId) {
    return null;
  }

  const customerName = extractCustomerName(payload) || "Khách hàng";
  const now = extractTimestamp(payload);

  return {
    _id: `optimistic-tasker-order-cancelled:${orderId}`,
    title: "Khách hàng đã hủy đơn",
    content: `${customerName} đã hủy đơn hàng bạn đang theo dõi.`,
    type: "order_cancelled",
    orderId,
    senderName: customerName,
    isRead: false,
    createdAt: now,
    updatedAt: now,
  };
};

export const buildOptimisticChatNotification = (
  payload: unknown,
  currentUserId: string,
  role: SupportedRealtimeRole,
): NotificationLike | null => {
  const orderId = extractOrderId(payload);
  const senderId = extractSenderId(payload);

  if (!orderId || !senderId || senderId === String(currentUserId).trim()) {
    return null;
  }

  const senderName =
    extractSenderName(payload) ||
    (String(role).toUpperCase() === "TASKER" ? "Khách hàng" : "Tasker");
  const content = extractMessageText(payload);
  const createdAt = extractTimestamp(payload);
  const root = asRecord(payload);
  const data = readNested(root, "data");
  const messageId = String(root._id || root.id || data._id || data.id || "").trim();

  return {
    _id: messageId
      ? `optimistic-chat:${messageId}`
      : `optimistic-chat:${orderId}:${senderId}:${createdAt}`,
    title: `Tin nhắn mới từ ${senderName}`,
    content: content || "Bạn có một tin nhắn mới",
    type: "chat_message",
    orderId,
    senderId,
    senderName,
    isRead: false,
    createdAt,
    updatedAt: createdAt,
  };
};
