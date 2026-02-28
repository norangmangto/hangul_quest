import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@hangul-quest/shared";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket() {
  if (socket) return socket;
  socket = io(process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001", {
    auth: {
      token: typeof window !== "undefined" ? localStorage.getItem("token") : undefined
    },
    autoConnect: false
  });
  return socket;
}

export function syncSocketAuthToken(token: string) {
  const s = getSocket();
  s.auth = { token };
  if (s.connected) {
    s.disconnect();
    s.connect();
  }
}
