import type { GameSettings, RoomStateDTO } from './types.js';

export type ClientToServerEvents = {
  'room:create': (
    payload: { settings?: Partial<GameSettings> },
    ack: (res: { roomId: string; roomCode: string; reconnectToken: string } | { error: string }) => void
  ) => void;
  'room:join': (
    payload: { roomCode: string; playerName: string },
    ack: (res: { roomId: string; reconnectToken: string } | { error: string }) => void
  ) => void;
  'room:rejoin': (
    payload: { roomId: string; token: string },
    ack: (res: { ok: true } | { error: string }) => void
  ) => void;
  'room:leave': (payload: { roomId: string }) => void;
  'room:start': (
    payload: { roomId: string },
    ack: (res: { ok: boolean } | { error: string }) => void
  ) => void;
  'room:settings:update': (payload: { roomId: string; settings: Partial<GameSettings> }) => void;
  'room:next-round': (payload: { roomId: string }) => void;
  'room:play-again': (payload: { roomId: string }) => void;
  'answer:submit': (payload: { roomId: string; questionId: string; answer: string }) => void;
  'room:sync': (payload: { roomId: string }) => void;
};

export type ServerToClientEvents = {
  'room:state': (state: RoomStateDTO) => void;
  'error:event': (payload: { message: string }) => void;
};
