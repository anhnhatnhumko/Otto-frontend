import { io, Socket } from "socket.io-client";
import { requireApiUrl } from "@/lib/api-url";

let socket: Socket | null = null;
let socketIdentityKey: string | null = null;

const buildIdentityKey = (userId?: string) =>
  `${userId ?? "anonymous"}`;

export const connectSocket = (
  userId: string,
  role: string,
  token?: string,
) => {
  const URL = requireApiUrl();

  const nextIdentityKey = buildIdentityKey(userId);
  if (
    socket &&
    (socket.connected || socket.active) &&
    socketIdentityKey === nextIdentityKey
  ) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  // Lấy token từ cookie nếu không được truyền vào
  const actualToken = token || 
    (typeof document !== 'undefined' 
      ? document.cookie.split('; ').find(c => c.startsWith('accessToken='))?.split('=')[1] 
      : undefined);

  socket = io(URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    timeout: 20000,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    rememberUpgrade: true,
    auth: {
      userId,
      role,
      ...(actualToken ? { token: actualToken } : {}),
    },
    query: {
      userId,
      role,
      ...(actualToken ? { token: actualToken } : {}),
    },
  });

  socketIdentityKey = nextIdentityKey;

  socket.on("connect", () => {
    if (process.env.NODE_ENV === "development") {
      console.log("🟢 SOCKET CONNECTED:", socket?.id);
    }

    if (String(role).toUpperCase() === "ADMIN") {
      socket?.emit("admin:join", { role: "ADMIN" });
    }
  });

  socket.on("disconnect", () => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔴 SOCKET DISCONNECTED");
    }
  });

  socket.on("connect_error", (err) => {
    if (process.env.NODE_ENV === "development") {
      console.log("❌ SOCKET ERROR:", err.message);
    }
  });

  return socket;
};


// optional
export const getSocket = () => socket;

export const isSocketConnected = () => Boolean(socket?.connected);

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    socketIdentityKey = null;
  }
};