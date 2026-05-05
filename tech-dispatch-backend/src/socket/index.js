import { Server } from "socket.io";
import { sessionMiddleware } from "../app.js";
import { registerTechnicianHandlers } from "./technicianSocket.js";
import { registerJobHandlers } from "./jobSocket.js";

let io = null;

// Adapt express middleware for Socket.IO handshake
const wrap = (fn) => (socket, next) => fn(socket.request, socket.request.res || {}, next);

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Parse session cookie on every socket connection
  io.use(wrap(sessionMiddleware));

  // Attach verified identity to socket.data
  io.use((socket, next) => {
    const userId = socket.request.session?.userId;
    if (userId) {
      socket.data.userId = userId.toString();
      socket.data.userRole = socket.request.session.role;
    }
    next();
  });

  io.on("connection", (socket) => {
    // Auto-join user room from session — no trust in client-provided userId
    if (socket.data.userId && socket.data.userRole === "user") {
      socket.join(`user:${socket.data.userId}`);
    }

    registerTechnicianHandlers(io, socket);
    registerJobHandlers(io, socket);
  });

  console.log("Socket.IO attached");
  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};
