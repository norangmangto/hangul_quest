import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@hangul-quest/shared';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socket) return socket;
  socket = io(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000', {
    autoConnect: false,
  });
  return socket;
}
