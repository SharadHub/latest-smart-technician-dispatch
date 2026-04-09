import { io, Socket } from "socket.io-client";
import type {
  UserRole,
  SocketJoinPayload,
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
  connectionTimeout: number | null;
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
  connectionTimeout: null,
  isConnecting: false,
};

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const RECONNECT_BACKOFF_MULTIPLIER = 1.5;

/**
 * Initialize socket connection
 */
export const initSocket = (token: string, userId: string, role: UserRole): Socket => {
  // Return existing socket if connected
  if (manager.socket?.connected) {
    return manager.socket;
  }

  // If already connecting, wait and return existing socket
  if (manager.isConnecting && manager.socket) {
    return manager.socket;
  }

  // Disconnect existing socket if any
  if (manager.socket) {
    manager.socket.disconnect();
  }

  manager.isConnecting = true;

  // Create new socket connection
  manager.socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: manager.maxReconnectAttempts,
    reconnectionDelay: manager.reconnectDelay,
    timeout: 10000,
  });

  // Connection event handlers
  manager.socket.on("connect", () => {
    console.log("[Socket] Connected:", manager.socket?.id);
    manager.connected = true;
    manager.isConnecting = false;
    manager.reconnectAttempts = 0;

    // Join user room for targeted notifications
    manager.socket?.emit("join", { userId, role });

    // Start heartbeat
    startHeartbeat();

    // Notify listeners
    emitEvent("connection", { status: "connected" });
  });

  manager.socket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
    manager.connected = false;
    manager.isConnecting = false;
    stopHeartbeat();

    // Notify listeners
    emitEvent("connection", { status: "disconnected", reason });

    // Handle reconnection for recoverable disconnects
    if (reason === "io server disconnect" || reason === "transport close") {
      handleReconnect(token, userId, role);
    }
  });

  manager.socket.on("connect_error", (error) => {
    console.error("[Socket] Connection error:", error.message);
    manager.isConnecting = false;
    emitEvent("connection", { status: "error", error: error.message });
  });

  // Setup default event handlers
  setupDefaultHandlers();

  return manager.socket;
};

/**
 * Handle reconnection with exponential backoff
 */
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

/**
 * Start heartbeat to keep connection alive
 */
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

/**
 * Stop heartbeat
 */
const stopHeartbeat = (): void => {
  if (manager.heartbeatInterval) {
    clearInterval(manager.heartbeatInterval);
    manager.heartbeatInterval = null;
  }
};

/**
 * Setup default event handlers
 */
const setupDefaultHandlers = (): void => {
  if (!manager.socket) return;

  // Booking request from dispatch system
  manager.socket.on("booking-request", (payload: SocketBookingRequestPayload) => {
    console.log("[Socket] Booking request:", payload.bookingId);
    emitEvent("booking-request", payload);
  });

  // Booking status update
  manager.socket.on("booking-updated", (payload: SocketBookingUpdatePayload) => {
    console.log("[Socket] Booking updated:", payload.bookingId, payload.status);
    emitEvent("booking-updated", payload);
  });

  // Booking accepted notification
  manager.socket.on("booking-accepted", (payload: SocketBookingUpdatePayload) => {
    console.log("[Socket] Booking accepted:", payload.bookingId);
    emitEvent("booking-accepted", payload);
  });

  // Handle pong response
  manager.socket.on("pong", (data: { timestamp: number }) => {
    const latency = Date.now() - data.timestamp;
    console.log("[Socket] Heartbeat latency:", latency, "ms");
  });
};

/**
 * Subscribe to socket events
 */
export const subscribe = (event: string, callback: (data: unknown) => void): () => void => {
  if (!manager.listeners.has(event)) {
    manager.listeners.set(event, new Set());
  }
  manager.listeners.get(event)?.add(callback);

  // Return unsubscribe function
  return () => {
    manager.listeners.get(event)?.delete(callback);
  };
};

/**
 * Emit event to listeners
 */
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

/**
 * Get current socket instance
 */
export const getSocket = (): Socket | null => manager.socket;

/**
 * Check if socket is connected
 */
export const isConnected = (): boolean => manager.connected;

/**
 * Disconnect socket
 */
export const disconnectSocket = (): void => {
  // Clear any pending connection timeout
  if (manager.connectionTimeout) {
    clearTimeout(manager.connectionTimeout);
    manager.connectionTimeout = null;
  }

  stopHeartbeat();
  manager.listeners.clear();
  manager.isConnecting = false;

  if (manager.socket) {
    // Only disconnect if actually connected or connecting
    if (manager.socket.connected || manager.isConnecting) {
      manager.socket.disconnect();
    }
    manager.socket = null;
    manager.connected = false;
    console.log("[Socket] Disconnected manually");
  }
};

/**
 * Emit event to server
 */
export const emit = (event: string, data?: unknown): void => {
  if (manager.socket?.connected) {
    manager.socket.emit(event, data);
  } else {
    console.warn("[Socket] Cannot emit, not connected");
  }
};

// Re-export types for convenience
export type {
  SocketJoinPayload,
  SocketBookingRequestPayload,
  SocketBookingUpdatePayload,
};
