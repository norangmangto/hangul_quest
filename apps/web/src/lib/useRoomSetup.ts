import { useEffect, useRef } from 'react';
import { getSocket } from './socket';
import { useGameStore } from './store';

/**
 * Handles the one-time socket setup when the room page mounts:
 * - Connects the socket if not already connected
 * - Calls room:rejoin (with a saved reconnect token) or room:sync (new join)
 *
 * A ref guard (syncInitiatedRef) prevents React StrictMode's double-invocation
 * from calling room:rejoin twice. StrictMode runs effects twice in development
 * (mount → cleanup → remount). Without the guard, the second run would send
 * room:rejoin with an already-rotated token → "Invalid token" → redirect home.
 */
export function useRoomSetup(
  roomId: string,
  onRejoinError: () => void,
) {
  const { setMyId } = useGameStore();
  const syncInitiatedRef = useRef(false);

  useEffect(() => {
    if (syncInitiatedRef.current) return;
    syncInitiatedRef.current = true;

    const socket = getSocket();
    if (!socket.connected) socket.connect();
    if (socket.id) setMyId(socket.id);

    const token = localStorage.getItem(`rct:${roomId}`);
    if (token) {
      const go = () => {
        setMyId(socket.id!);
        socket.emit('room:rejoin', { roomId, token }, (r) => {
          if ('error' in r) {
            localStorage.removeItem(`rct:${roomId}`);
            onRejoinError();
          } else {
            localStorage.setItem(`rct:${roomId}`, r.reconnectToken);
          }
        });
      };
      socket.connected ? go() : socket.once('connect', go);
    } else {
      const go = () => { setMyId(socket.id!); socket.emit('room:sync', { roomId }); };
      socket.connected ? go() : socket.once('connect', go);
    }
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps
}
