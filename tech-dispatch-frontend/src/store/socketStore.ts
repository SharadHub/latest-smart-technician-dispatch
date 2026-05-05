import { create } from "zustand";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = (import.meta.env.VITE_API_URL as string)?.replace("/api", "") || "http://localhost:5000";

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>()((set, get) => ({
  socket: null,
  isConnected: false,

  connect: () => {
    if (get().socket?.connected) return;
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });
    socket.on("connect", () => set({ isConnected: true }));
    socket.on("disconnect", () => set({ isConnected: false }));
    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, isConnected: false });
  },
}));
