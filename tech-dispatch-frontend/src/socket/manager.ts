import { io, Socket } from "socket.io-client";
import type {
  UserRole,
  SocketBookingRequestPayload,
  SocketBookingUpdatePayload,
} from "../types";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

interface SocketManager {
  socket: Socket | null;
  connected: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number | null;
  listeners: Map<string, Set<(data: unknown) => void>>;
  isConnecting: boolean;
}

const manager: SocketManager = {
  socket: null,
  connected: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  heartbeatInterval: null,
  listeners: new Map(),
  isConnecting: false,
};

const HEARTBEAT_INTERVAL = 30000;
const RECONNECT_BACKOFF_MULTIPLIER = 1.5;

export const initSocket = (token: string, userId: string, role: UserRole): Socket => {
  if (manager.socket?.connected) {
    return manager.socket;
  }

  if (manager.isConnecting && manager.socket) {
    return manager.socket;
  }

  if (manager.socket) {
    manager.socket.disconnect();
  }

  manager.isConnecting = true;

  manager.socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: manager.maxReconnectAttempts,
    reconnectionDelay: manager.reconnectDelay,
    timeout: 10000,
  });

  manager.socket.on("connect", () => {
    console.log("[Socket] Connected:", manager.socket?.id);
    manager.connected = true;
    manager.isConnecting = false;
    manager.reconnectAttempts = 0;

    manager.socket?.emit("join", { userId, role });
    startHeartbeat();
    emitEvent("connection", { status: "connected" });
  });

  manager.socket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
    manager.connected = false;
    manager.isConnecting = false;
    stopHeartbeat();
    emitEvent("connection", { status: "disconnected", reason });

    if (reason === "io server disconnect" || reason === "transport close") {
      handleReconnect(token, userId, role);
    }
  });

  manager.socket.on("connect_error", (error) => {
    console.error("[Socket] Connection error:", error.message);
    manager.isConnecting = false;
    emitEvent("connection", { status: "error", error: error.message });
  });

  setupDefaultHandlers();

  return manager.socket;
};

const handleReconnect = (token: string, userId: string, role: UserRole): void => {
  if (manager.reconnectAttempts >= manager.maxReconnectAttempts) {
    console.error("[Socket] Max reconnection attempts reached");
    emitEvent("connection", { status: "failed" });
    return;
  }

  manager.reconnectAttempts++;
  const delay = manager.reconnectDelay * Math.pow(RECONNECT_BACKOFF_MULTIPLIER, manager.reconnectAttempts - 1);

  console.log(`[Socket] Reconnecting in ${delay}ms (attempt ${manager.reconnectAttempts})`);

  setTimeout(() => {
    if (!manager.connected) {
      initSocket(token, userId, role);
    }
  }, delay);
};

const startHeartbeat = (): void => {
  if (manager.heartbeatInterval) {
    clearInterval(manager.heartbeatInterval);
  }

  manager.heartbeatInterval = window.setInterval(() => {
    if (manager.socket?.connected) {
      manager.socket.emit("ping", { timestamp: Date.now() });
    }
  }, HEARTBEAT_INTERVAL);
};

const stopHeartbeat = (): void => {
  if (manager.heartbeatInterval) {
    clearInterval(manager.heartbeatInterval);
    manager.heartbeatInterval = null;
  }
};

const setupDefaultHandlers = (): void => {
  if (!manager.socket) return;

  manager.socket.on("booking-request", (payload: SocketBookingRequestPayload) => {
    console.log("[Socket] Booking request:", payload.bookingId);
    emitEvent("booking-request", payload);
  });

  manager.socket.on("booking-updated", (payload: SocketBookingUpdatePayload) => {
    console.log("[Socket] Booking updated:", payload.bookingId, payload.status);
    emitEvent("booking-updated", payload);
  });

  manager.socket.on("booking-accepted", (payload: SocketBookingUpdatePayload) => {
    console.log("[Socket] Booking accepted:", payload.bookingId);
    emitEvent("booking-accepted", payload);
  });

  manager.socket.on("pong", (data: { timestamp: number }) => {
    const latency = Date.now() - data.timestamp;
    console.log("[Socket] Heartbeat latency:", latency, "ms");
  });
};

export const subscribe = (event: string, callback: (data: unknown) => void): () => void => {
  if (!manager.listeners.has(event)) {
    manager.listeners.set(event, new Set());
  }
  manager.listeners.get(event)?.add(callback);

  return () => {
    manager.listeners.get(event)?.delete(callback);
  };
};

const emitEvent = (event: string, data: unknown): void => {
  const callbacks = manager.listeners.get(event);
  if (callbacks) {
    callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[Socket] Error in ${event} listener:`, error);
      }
    });
  }
};

export const disconnectSocket = (): void => {
  stopHeartbeat();
  manager.listeners.clear();
  manager.isConnecting = false;

  if (manager.socket) {
    if (manager.socket.connected || manager.isConnecting) {
      manager.socket.disconnect();
    }
    manager.socket = null;
    manager.connected = false;
    console.log("[Socket] Disconnected manually");
  }
};
