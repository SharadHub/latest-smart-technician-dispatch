import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import router from "./router";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";

function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

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
