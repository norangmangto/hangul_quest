import type { RoomStateDTO } from "./types.js";
import type { Difficulty, GameMode } from "./types.js";

export type ClientToServerEvents = {
  "room:create": (
    payload: { username: string; mode?: GameMode; noFailureCondition?: boolean; difficultyOverride?: Difficulty | null },
    ack: (res: { roomId: string; roomCode: string; token: string }) => void
  ) => void;
  "room:join": (payload: { username: string; roomCode: string }, ack: (res: { roomId: string; token: string }) => void) => void;
  "room:resume": (payload: { roomId: string }, ack: (res: { ok: boolean; roomState?: RoomStateDTO; message?: string }) => void) => void;
  "room:start": (payload: { roomId: string }) => void;
  "room:settings:update": (payload: { roomId: string; noFailureCondition?: boolean; difficultyOverride?: Difficulty | null }) => void;
  "answer:submit": (payload: { roomId: string; challengeId: string; answer: string; clientSeq: number }) => void;
  "player:encourage": (payload: { roomId: string; message: string }) => void;
};

export type ServerToClientEvents = {
  "room:state": (payload: RoomStateDTO) => void;
  "health:update": (payload: { roomId: string; teamHealth: number; maxTeamHealth: number }) => void;
  "progress:update": (payload: { roomId: string; progressMeter: number; successfulMiniGames: number; requiredSuccesses: number }) => void;
  "quest:complete": (payload: { roomId: string; questId: string; chapterId: RoomStateDTO["chapterId"] }) => void;
  "turn:start": (payload: { roomId: string; activePlayerId: string; challengeId: string; expiresAt: number }) => void;
  "answer:result": (payload: { roomId: string; playerId: string; isCorrect: boolean; reason?: "mismatch" | "timeout" }) => void;
  "turn:pass": (payload: { roomId: string; fromPlayerId: string; toPlayerId: string; failedPlayerIds: string[]; expiresAt: number }) => void;
  "challenge:cleared": (payload: {
    roomId: string;
    challengeId: string;
    questEffect:
      | "bridge_open"
      | "lake_calm"
      | "forge_ignited"
      | "market_restored"
      | "arena_shield_break"
      | "archive_unsealed";
  }) => void;
  "challenge:failed": (payload: { roomId: string; challengeId: string }) => void;
  "player:encourage": (payload: { playerId: string; username: string; message: string }) => void;
  "error:event": (payload: { code: string; message: string }) => void;
};
