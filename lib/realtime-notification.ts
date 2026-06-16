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

const normalizeText = (value: unknown) =>
  String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

const normalizeType = (value: unknown) => normalizeText(value);
const normalizeOrderId = (value: unknown) => String(value ?? "").trim();

const asRecord = (value: unknown): GenericPayload =>
  value && typeof value === "object" ? (value as GenericPayload) : {};

const readNested = (record: GenericPayload, key: string) => {
  const value = record[key];
  return value && typeof value === "object" ? asRecord(value) : {};
};

const firstNonEmptyRecord = (...records: GenericPayload[]) =>
  records.find((record) => Object.keys(record).length > 0) ?? {};

const pickOrderCandidate = (payload: unknown) => {
  const root = asRecord(payload);
  return readNested(root, "data").orderId
    ? readNested(root, "data")
    : readNested(root, "data")._id || readNested(root, "data").id
      ? readNested(root, "data")
      : readNested(root, "order")._id || readNested(root, "order").id
        ? readNested(root, "order")
        : readNested(root, "payload")._id || readNested(root, "payload").id
          ? readNested(root, "payload")
          : root;
};

const extractOrderId = (payload: unknown) => {
  const root = asRecord(payload);
  const candidate = pickOrderCandidate(payload);

  return normalizeOrderId(
    root.orderId ||
      root._id ||
      root.id ||
      candidate.orderId ||
      candidate._id ||
      candidate.id,
  );
};

const extractStatus = (payload: unknown) => {
  const root = asRecord(payload);
  const candidate = pickOrderCandidate(payload);
  return String(root.status || candidate.status || "").trim().toUpperCase();
};

const extractSenderRecord = (payload: unknown) => {
  const root = asRecord(payload);
  const candidate = pickOrderCandidate(payload);

  return firstNonEmptyRecord(
    readNested(root, "sender"),
    readNested(root, "senderId"),
    readNested(root, "tasker"),
    readNested(root, "taskerId"),
    readNested(root, "customer"),
    readNested(root, "customerId"),
    readNested(candidate, "sender"),
    readNested(candidate, "senderId"),
    readNested(candidate, "tasker"),
    readNested(candidate, "taskerId"),
    readNested(candidate, "customer"),
    readNested(candidate, "customerId"),
  );
};

const extractSenderId = (payload: unknown) => {
  const root = asRecord(payload);
  const candidate = pickOrderCandidate(payload);
  const sender = extractSenderRecord(payload);

  return String(
    sender._id ||
      sender.id ||
      root.senderId ||
      candidate.senderId ||
      "",
  ).trim();
};

const extractSenderName = (payload: unknown) => {
  const root = asRecord(payload);
  const candidate = pickOrderCandidate(payload);
  const sender = extractSenderRecord(payload);

  return String(
    sender.fullName ||
      sender.name ||
      root.senderName ||
      root.taskerName ||
      root.customerName ||
      candidate.senderName ||
      candidate.taskerName ||
      candidate.customerName ||
      "",
  ).trim();
};

const extractMessageText = (payload: unknown) => {
  const root = asRecord(payload);
  const data = readNested(root, "data");

  return String(
    root.text ||
      root.message ||
      root.content ||
      data.text ||
      data.message ||
      data.content ||
      "",
  ).trim();
};

const extractTimestamp = (payload: unknown) => {
  const root = asRecord(payload);
  const candidate = pickOrderCandidate(payload);

  const timestamp = String(
    root.createdAt ||
      root.updatedAt ||
      candidate.createdAt ||
      candidate.updatedAt ||
      "",
  ).trim();

  return timestamp || new Date().toISOString();
};

const buildNotification = (
  seed: Partial<NotificationLike>,
  fallbackId: string,
): NotificationLike => {
  const now = new Date().toISOString();

  return {
    _id: seed._id || fallbackId,
    title: seed.title || "Thông báo mới",
    content: seed.content || "",
    type: seed.type || "system",
    orderId: seed.orderId,
    senderId: seed.senderId,
    senderName: seed.senderName,
    isRead: false,
    createdAt: seed.createdAt || now,
    updatedAt: seed.updatedAt || seed.createdAt || now,
  };
};

const sortByNewest = <T extends NotificationLike>(items: T[]) =>
  [...items].sort((left, right) => {
    const leftTime = new Date(left.createdAt ?? 0).getTime();
    const rightTime = new Date(right.createdAt ?? 0).getTime();
    return rightTime - leftTime;
  });

export const isOptimisticNotification = (notification: NotificationLike) =>
  String(notification._id ?? "").startsWith("optimistic-");

export const getRealtimeNotificationIdentity = (notification: NotificationLike) => {
  const type = normalizeType(notification.type);
  const orderId = normalizeOrderId(notification.orderId);
  const senderId = normalizeText(notification.senderId);
  const senderName = normalizeText(notification.senderName);
  const content = normalizeText(notification.content);

  if (type === "chat_message" && orderId) {
    return `chat:${orderId}:${senderId || senderName || content}`;
  }

  if (
    (type === "order_accepted" ||
      type === "order_cancelled" ||
      type === "order_completed" ||
      type === "payment_received") &&
    orderId
  ) {
    return `${type}:${orderId}`;
  }

  const id = String(notification._id ?? "").trim();
  if (id) {
    return `id:${id}`;
  }

  return `${type}:${orderId}:${senderId || senderName || content}`;
};

export const mergeFetchedNotifications = <T extends NotificationLike>(
  fetched: T[],
  local: T[],
) => {
  const merged = new Map<string, T>();

  sortByNewest(fetched).forEach((item) => {
    merged.set(getRealtimeNotificationIdentity(item), item);
  });

  sortByNewest(local).forEach((item) => {
    const identity = getRealtimeNotificationIdentity(item);
    if (!merged.has(identity) && isOptimisticNotification(item)) {
      merged.set(identity, item);
    }
  });

  return sortByNewest(Array.from(merged.values()));
};

export const upsertRealtimeNotification = <T extends NotificationLike>(
  list: T[],
  next: T,
) => {
  const nextIdentity = getRealtimeNotificationIdentity(next);
  const nextType = normalizeType(next.type);
  const nextOrderId = normalizeOrderId(next.orderId);

  return sortByNewest([
    next,
    ...list.filter((item) => {
      const currentIdentity = getRealtimeNotificationIdentity(item);
      if (currentIdentity === nextIdentity) {
        return false;
      }

      if (
        nextOrderId &&
        normalizeOrderId(item.orderId) === nextOrderId &&
        normalizeType(item.type) === nextType &&
        nextType !== "chat_message"
      ) {
        return false;
      }

      return true;
    }),
  ]);
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

  const taskerName = extractSenderName(payload) || "Tasker";

  return buildNotification(
    {
      _id: `optimistic-order-accepted:${orderId}`,
      title: "Đơn hàng được nhận",
      content: `${taskerName} đã nhận đơn hàng của bạn.`,
      type: "order_accepted",
      orderId,
      senderName: taskerName,
      createdAt: extractTimestamp(payload),
    },
    `optimistic-order-accepted:${orderId}`,
  );
};

export const buildOptimisticTaskerOrderCancelledNotification = (
  payload: unknown,
): NotificationLike | null => {
  const status = extractStatus(payload);
  if (!["CANCELLED", "AUTO_CANCELLED", "TIMEOUT"].includes(status)) {
    return null;
  }

  const orderId = extractOrderId(payload);
  if (!orderId) {
    return null;
  }

  const customerName = extractSenderName(payload) || "Khách hàng";

  return buildNotification(
    {
      _id: `optimistic-order-cancelled:${orderId}`,
      title: "Đơn hàng đã bị hủy",
      content: `${customerName} đã hủy đơn hàng này.`,
      type: "order_cancelled",
      orderId,
      senderName: customerName,
      createdAt: extractTimestamp(payload),
    },
    `optimistic-order-cancelled:${orderId}`,
  );
};

export const buildOptimisticChatNotification = (
  payload: unknown,
  currentUserId?: string,
): NotificationLike | null => {
  const orderId = extractOrderId(payload);
  const senderId = extractSenderId(payload);
  const text = extractMessageText(payload);

  if (!orderId || !text) {
    return null;
  }

  if (currentUserId && senderId && senderId === currentUserId) {
    return null;
  }

  const senderName = extractSenderName(payload) || "Tin nhắn mới";
  const timestamp = extractTimestamp(payload);
  const identitySuffix = senderId || normalizeText(text).slice(0, 48) || timestamp;

  return buildNotification(
    {
      _id: `optimistic-chat:${orderId}:${identitySuffix}`,
      title: `Tin nhắn mới từ ${senderName}`,
      content: text,
      type: "chat_message",
      orderId,
      senderId,
      senderName,
      createdAt: timestamp,
    },
    `optimistic-chat:${orderId}:${identitySuffix}`,
  );
};
