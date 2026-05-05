import { useEffect } from "react";
import { useSocketStore } from "../store/socketStore";

export const useSocketEvent = (
  event: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (data: any) => void,
  deps: unknown[] = []
) => {
  const socket = useSocketStore((s) => s.socket);

  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, event, ...deps]);
};
