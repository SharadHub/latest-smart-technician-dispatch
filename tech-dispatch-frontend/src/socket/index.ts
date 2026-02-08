import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io("http://localhost:5000", {
    auth: { token },
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
