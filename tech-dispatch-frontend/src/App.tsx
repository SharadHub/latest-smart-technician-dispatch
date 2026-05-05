import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import { useSocketStore } from "./store/socketStore";
import router from "./router";

function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { connect, disconnect, socket } = useSocketStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }
  }, [isAuthenticated, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Once socket is connected, join the user's personal room
  useEffect(() => {
    if (socket && user) {
      socket.on("connect", () => {
        socket.emit("user:joinRoom", { userId: user._id });
      });
      // Also join immediately if already connected
      if (socket.connected) {
        socket.emit("user:joinRoom", { userId: user._id });
      }
    }
  }, [socket, user]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "12px",
            background: "#1e293b",
            color: "#fff",
            fontSize: "14px",
          },
        }}
      />
    </>
  );
}

export default App;
