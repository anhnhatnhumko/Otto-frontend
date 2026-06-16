import { io, Socket } from "socket.io-client";
import { requireApiUrl } from "@/lib/api-url";

let socket: Socket | null = null;
let socketIdentityKey: string | null = null;

const buildIdentityKey = (userId?: string, role?: string) =>
  `${userId ?? "anonymous"}:${String(role ?? "UNKNOWN").toUpperCase()}`;

const readCookieToken = () => {
  if (typeof document === "undefined") {
    return undefined;
  }

  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("accessToken="))
    ?.split("=")[1];
};

export const connectSocket = (
  userId: string,
  role: string,
  token?: string,
) => {
  let apiUrl = "";

  try {
    apiUrl = requireApiUrl();
  } catch (error) {
    console.error("Socket disabled because NEXT_PUBLIC_API_URL is invalid.", error);
    return null;
  }

  const nextIdentityKey = buildIdentityKey(userId, role);
  const actualToken = token || readCookieToken();

  if (socket && socketIdentityKey === nextIdentityKey) {
    socket.auth = {
      userId,
      role,
      ...(actualToken ? { token: actualToken } : {}),
    };

    if (!socket.connected && !socket.active) {
      socket.connect();
    }

    return socket;
  }

  if (socket && socketIdentityKey !== nextIdentityKey) {
    socket.disconnect();
    socket = null;
    socketIdentityKey = null;
  }

  socket = io(apiUrl, {
    withCredentials: true,
    // Start with polling for more reliable first-connect on deployed proxies,
    // then upgrade to websocket as soon as it is available.
    transports: ["polling", "websocket"],
    upgrade: true,
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
      console.log("[socket] connected", socket?.id);
    }

    if (String(role).toUpperCase() === "ADMIN") {
      socket?.emit("admin:join", { role: "ADMIN" });
    }
  });

  socket.on("disconnect", () => {
    if (process.env.NODE_ENV === "development") {
      console.log("[socket] disconnected");
    }
  });

  socket.on("connect_error", (error) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[socket] connect_error", error.message);
    }
  });

  return socket;
};

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
