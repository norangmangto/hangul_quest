export type GameCategory =
  | 'KOREAN_WORDS'
  | 'HANGUL_LETTERS'
  | 'KOREAN_VERBS'
  | 'KOREAN_TO_ENGLISH'
  | 'KOREAN_NUMBERS'
  | 'KOREAN_SENTENCES';

export type GameMode = 'standard' | 'teams' | 'elimination';

export type RoomStatus = 'LOBBY' | 'ROUND_ACTIVE' | 'ROUND_RESULT' | 'GAME_OVER';

export interface PlayerState {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  isHost: boolean;
  streak: number;
  team?: 'red' | 'blue';
  eliminated?: boolean;
}

export interface GameSettings {
  category: GameCategory;
  totalRounds: number;
  timeLimit: number; // seconds per round
  autoAdvanceDelay?: number; // seconds; 0 or undefined = disabled
  inputMode?: 'buttons' | 'typed';
  gameMode?: GameMode;
}

export interface PublicQuestion {
  id: string;
  prompt: string;
  promptType: 'emoji' | 'hangul' | 'romanization' | 'text';
  categoryHint: string;
  options: string[];
  hint?: string; // shown after answer reveal
}

export interface RoomStateDTO {
  roomId: string;
  roomCode: string;
  hostId: string;
  players: PlayerState[];
  status: RoomStatus;
  settings: GameSettings;
  currentRound: number;
  maxPlayers: number;
  currentQuestion?: PublicQuestion;
  roundWinner?: { id: string; name: string } | null;
  correctAnswer?: string; // only revealed in ROUND_RESULT / GAME_OVER
  roundExpiresAt?: number; // unix ms timestamp
  autoAdvanceAt?: number; // unix ms, present only in ROUND_RESULT when auto-advance is enabled
  roundStartedAt?: number; // unix ms, for speed bonus display
  teamScores?: { red: number; blue: number };
}
